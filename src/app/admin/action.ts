"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function fetchDashboardStats(filters: {
  departmentId: string;
  schoolYearId: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  const { departmentId, schoolYearId } = filters;

  const [requestStats, budgetStats] = await Promise.all([
    sql`
  SELECT
    COUNT(*)                                                          AS total_requests,
    COUNT(*) FILTER (WHERE rst.status = 'submitted')                 AS submitted,
    COUNT(*) FILTER (WHERE rst.status = 'waiting_approval')          AS waiting_approval,
    COUNT(*) FILTER (WHERE rst.status = 'approved')                  AS approved,
    COUNT(*) FILTER (WHERE rst.status = 'rejected')                  AS rejected,
    COUNT(*) FILTER (WHERE rst.status = 'training_ongoing')          AS training_ongoing,
    COUNT(*) FILTER (WHERE rst.status = 'pending_completion_docs')   AS pending_completion_docs,
    COUNT(*) FILTER (WHERE rst.status = 'pending_completion_approval') AS pending_completion_approval,
    COUNT(*) FILTER (WHERE rst.status = 'completed')                 AS completed,
    COUNT(*) FILTER (WHERE tr.type = 'external')                     AS external_count,
    COUNT(*) FILTER (WHERE tr.type = 'in-house')                     AS inhouse_count
  FROM training_requests tr
  JOIN ppmp p ON p.id = tr.ppmp_id
  JOIN LATERAL (
    SELECT status FROM request_status_track
    WHERE request_id = tr.id
    ORDER BY actioned_at DESC
    LIMIT 1
  ) rst ON true
  WHERE (${departmentId} = '' OR p.department_id = ${departmentId})
    AND (${schoolYearId} = '' OR p.school_year_id = ${schoolYearId})
`,
    sql`
      SELECT
        COALESCE(SUM(p.budget_allocation), 0)                                          AS total_budget,
        COALESCE(SUM(p.budget_allocation) FILTER (WHERE rst.status = 'completed'), 0)  AS utilized_budget
      FROM training_requests tr
      JOIN ppmp p ON p.id = tr.ppmp_id
      JOIN LATERAL (
        SELECT status FROM request_status_track
        WHERE request_id = tr.id
        ORDER BY actioned_at DESC
        LIMIT 1
      ) rst ON true
      WHERE (${departmentId} = '' OR p.department_id = ${departmentId})
        AND (${schoolYearId} = '' OR p.school_year_id = ${schoolYearId})
    `,
  ]);

  const r = requestStats[0] as any;
  const b = budgetStats[0] as any;

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
  };
}
