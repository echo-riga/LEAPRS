// src/app/(protected)/user/page.tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";
import type { PpmpSummary, TrainingRequest } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function UserPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [ppmpEntries, myRequests, departments, schoolYears] = await Promise.all(
    [
      sql`
    SELECT
      p.id,
      p.aip_code,
      p.ppa,
      d.name        AS department,
      d.id          AS department_id,
      sy.name       AS school_year_name,
      sy.id         AS school_year_id,
      p.pillar,
      p.intended_outcome,
      p.planned_outputs,
      p.ppa_owner,
      p.target_implementation,
      EXISTS (
        SELECT 1
        FROM training_requests tr
        JOIN request_status_track rst ON rst.request_id = tr.id
        WHERE tr.ppmp_id          = p.id
          AND tr.requested_by_id  = ${session.user.id}
          AND rst.actioned_at     = (
            SELECT MAX(actioned_at)
            FROM request_status_track
            WHERE request_id = tr.id
          )
          AND rst.status NOT IN ('completed', 'rejected')
      ) AS has_active_request
    FROM ppmp p
    LEFT JOIN departments  d  ON d.id  = p.department_id
    LEFT JOIN school_years sy ON sy.id = p.school_year_id
    ORDER BY p.created_at DESC
  `,
      sql`
    SELECT
      tr.id,
      p.aip_code,
      p.ppa,
      tr.type,
      rst.status,
      tr.submitted_at,
      tr.remarks
    FROM training_requests tr
    JOIN ppmp p ON p.id = tr.ppmp_id
    LEFT JOIN LATERAL (
      SELECT status FROM request_status_track
      WHERE request_id = tr.id
      ORDER BY actioned_at DESC
      LIMIT 1
    ) rst ON true
    WHERE tr.requested_by_id = ${session.user.id}
    ORDER BY tr.submitted_at DESC
  `,
      sql`SELECT id, name FROM departments ORDER BY name ASC`,
      sql`SELECT id, name FROM school_years ORDER BY name ASC`,
    ],
  );
  return (
    <DashboardClient
      user={{
        name: session.user.name,
        email: session.user.email,
        department: (session.user as any).department ?? null,
      }}
      ppmpEntries={ppmpEntries as unknown as PpmpSummary[]}
      myRequests={myRequests as unknown as TrainingRequest[]}
      departments={departments as unknown as { id: string; name: string }[]}
      schoolYears={schoolYears as unknown as { id: string; name: string }[]}
    />
  );
}
