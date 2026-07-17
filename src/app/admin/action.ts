"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

type RequestStatsRow = {
  total_requests: number | string;
  submitted: number | string;
  waiting_approval: number | string;
  approved: number | string;
  rejected: number | string;
  training_ongoing: number | string;
  pending_completion_docs: number | string;
  pending_completion_approval: number | string;
  completed: number | string;
  external_count: number | string;
  inhouse_count: number | string;
};

type BudgetStatsRow = {
  total_budget: number | string;
  utilized_budget: number | string;
  total_requested: number | string;
  in_progress_budget: number | string;
};

type MonthlyStatsRow = {
  month: string;
  submitted: number | string;
  waiting_approval?: number | string;
  completed: number | string;
  rejected: number | string;
};

export async function fetchDashboardStats(filters: {
  departmentId: string;
  schoolYearId: string;
  ppmpId: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user.role !== "admin" && session.user.role !== "dept_viewer")) throw new Error("Forbidden");

  let { departmentId, schoolYearId, ppmpId } = filters;
  if (session.user.role === "dept_viewer") {
    departmentId = session.user.department_id || "force-none-exist-id";
  }

  const [requestStats, budgetStats, monthlyStats] = await Promise.all([
    sql`
      WITH ppmp_scope AS (
        SELECT p.id
        FROM ppmp p
        WHERE (${departmentId} = '' OR p.department_id = ${departmentId})
          AND (${schoolYearId} = '' OR p.school_year_id = ${schoolYearId})
          AND (${ppmpId} = '' OR p.id = ${ppmpId})
      )
      SELECT
        COUNT(tr.id)                                                          AS total_requests,
        COUNT(tr.id) FILTER (WHERE rst.status = 'submitted')                 AS submitted,
        COUNT(tr.id) FILTER (WHERE rst.status = 'waiting_approval')          AS waiting_approval,
        COUNT(tr.id) FILTER (WHERE rst.status = 'approved')                  AS approved,
        COUNT(tr.id) FILTER (WHERE rst.status = 'rejected')                  AS rejected,
        COUNT(tr.id) FILTER (WHERE rst.status = 'training_ongoing')          AS training_ongoing,
        COUNT(tr.id) FILTER (WHERE rst.status = 'pending_completion_docs')   AS pending_completion_docs,
        COUNT(tr.id) FILTER (WHERE rst.status = 'pending_completion_approval') AS pending_completion_approval,
        COUNT(tr.id) FILTER (WHERE rst.status = 'completed')                 AS completed,
        COUNT(tr.id) FILTER (WHERE tr.type = 'external')                     AS external_count,
        COUNT(tr.id) FILTER (WHERE tr.type = 'in-house')                     AS inhouse_count
      FROM ppmp_scope ps
      LEFT JOIN training_requests tr ON tr.ppmp_id = ps.id
      LEFT JOIN LATERAL (
        SELECT status FROM request_status_track
        WHERE request_id = tr.id
        ORDER BY actioned_at DESC
        LIMIT 1
      ) rst ON tr.id IS NOT NULL
    `,
    sql`
      WITH ppmp_scope AS (
        SELECT p.id, p.budget_allocation
        FROM ppmp p
        WHERE (${departmentId} = '' OR p.department_id = ${departmentId})
          AND (${schoolYearId} = '' OR p.school_year_id = ${schoolYearId})
          AND (${ppmpId} = '' OR p.id = ${ppmpId})
      ), budget_scope AS (
        SELECT COALESCE(SUM(budget_allocation), 0) AS total_budget
        FROM ppmp_scope
      ), request_budget_scope AS (
        SELECT
          COALESCE(SUM(tr.budget_wanted), 0)                                                           AS total_requested,
          COALESCE(SUM(tr.budget_wanted) FILTER (WHERE rst.status = 'completed'), 0)                   AS utilized_budget,
          COALESCE(SUM(tr.budget_wanted) FILTER (WHERE rst.status NOT IN ('completed','rejected')), 0) AS in_progress_budget
        FROM ppmp_scope ps
        LEFT JOIN training_requests tr ON tr.ppmp_id = ps.id
        LEFT JOIN LATERAL (
          SELECT status FROM request_status_track
          WHERE request_id = tr.id
          ORDER BY actioned_at DESC
          LIMIT 1
        ) rst ON tr.id IS NOT NULL
      )
      SELECT
        budget_scope.total_budget,
        request_budget_scope.total_requested,
        request_budget_scope.utilized_budget,
        request_budget_scope.in_progress_budget
      FROM budget_scope
      CROSS JOIN request_budget_scope
    `,
    sql`
      WITH ppmp_scope AS (
        SELECT p.id
        FROM ppmp p
        WHERE (${departmentId} = '' OR p.department_id = ${departmentId})
          AND (${schoolYearId} = '' OR p.school_year_id = ${schoolYearId})
          AND (${ppmpId} = '' OR p.id = ${ppmpId})
      )
      SELECT
        TO_CHAR(DATE_TRUNC('month', tr.submitted_at), 'Mon YYYY') AS month,
        DATE_TRUNC('month', tr.submitted_at) AS month_date,
        COUNT(*) FILTER (WHERE rst.status IN ('submitted', 'waiting_approval')) AS submitted,
        COUNT(*) FILTER (WHERE rst.status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE rst.status = 'rejected') AS rejected
      FROM ppmp_scope ps
      JOIN training_requests tr ON tr.ppmp_id = ps.id
      JOIN LATERAL (
        SELECT status FROM request_status_track
        WHERE request_id = tr.id
        ORDER BY actioned_at DESC
        LIMIT 1
      ) rst ON true
      GROUP BY DATE_TRUNC('month', tr.submitted_at)
      ORDER BY DATE_TRUNC('month', tr.submitted_at) ASC
    `,
  ]);

  const r = requestStats[0] as RequestStatsRow;
  const b = budgetStats[0] as BudgetStatsRow;

  return {
    total_requests: Number(r.total_requests),
    submitted: Number(r.submitted),
    waiting_approval: Number(r.waiting_approval),
    approved: Number(r.approved),
    rejected: Number(r.rejected),
    training_ongoing: Number(r.training_ongoing),
    pending_completion_docs: Number(r.pending_completion_docs),
    pending_completion_approval: Number(r.pending_completion_approval),
    completed: Number(r.completed),
    total_budget: Number(b.total_budget),
    utilized_budget: Number(b.utilized_budget),
    external_count: Number(r.external_count),
    inhouse_count: Number(r.inhouse_count),
    total_requested: Number(b.total_requested),
    in_progress_budget: Number(b.in_progress_budget),
    monthly_trends: (monthlyStats as MonthlyStatsRow[]).map((m) => ({
      month: m.month,
      submitted: Number(m.submitted),
      waiting_approval: Number(m.waiting_approval),
      completed: Number(m.completed),
      rejected: Number(m.rejected),
    })),
  };
}

export async function fetchAipReport(filters: {
  departmentId: string;
  schoolYearId: string;
  ppmpId: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user.role !== "admin" && session.user.role !== "dept_viewer")) throw new Error("Forbidden");

  let { departmentId, schoolYearId, ppmpId } = filters;
  if (session.user.role === "dept_viewer") {
    departmentId = session.user.department_id || "force-none-exist-id";
  }

  const rows = await sql`
    SELECT
      p.aip_code,
      d.name AS department,
      p.ppa AS description,
      p.budget_allocation AS allocated,
      COALESCE(SUM(tr.budget_wanted) FILTER (
        WHERE rst.status NOT IN ('rejected')
      ), 0) AS requested,
      p.budget_allocation - COALESCE(SUM(tr.budget_wanted) FILTER (
        WHERE rst.status NOT IN ('rejected')
      ), 0) AS balance
    FROM ppmp p
    LEFT JOIN departments d ON d.id = p.department_id
    LEFT JOIN training_requests tr ON tr.ppmp_id = p.id
    LEFT JOIN LATERAL (
      SELECT status FROM request_status_track
      WHERE request_id = tr.id
      ORDER BY actioned_at DESC
      LIMIT 1
    ) rst ON true
    WHERE (${departmentId} = '' OR p.department_id = ${departmentId})
      AND (${schoolYearId} = '' OR p.school_year_id = ${schoolYearId})
      AND (${ppmpId} = '' OR p.id = ${ppmpId})
    GROUP BY p.id, p.aip_code, d.name, p.ppa, p.budget_allocation
    ORDER BY p.aip_code ASC
  `;

  return rows as unknown as {
    aip_code: string;
    department: string | null;
    description: string;
    allocated: number;
    requested: number;
    balance: number;
  }[];
}
