import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { RequestsClient } from "./RequestsClient";

export const dynamic = "force-dynamic";

export type AdminRequest = {
  id: string;
  aip_code: string;
  ppa: string;
  type: "external" | "in-house";
  submitted_at: string;
  requester_name: string;
  requester_email: string;
  department_name: string | null;
  school_year_name: string | null;
  latest_status: string;
  latest_office: string | null;
};

export type StatusTrack = {
  id: string;
  request_id: string;
  office: string | null;
  status: string;
  file_url: string | null;
  remarks: string | null;
  actioned_at: string;
};

export default async function AdminRequestsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/unauthorized");

  const [requests, departments, schoolYears] = await Promise.all([
    sql`
      SELECT
        tr.id,
        p.aip_code,
        p.ppa,
        tr.type,
        tr.submitted_at,
        u.name          AS requester_name,
        u.email         AS requester_email,
        d.name          AS department_name,
        sy.name         AS school_year_name,
        rst.status      AS latest_status,
        rst.office      AS latest_office
      FROM training_requests tr
      JOIN ppmp p         ON p.id  = tr.ppmp_id
      JOIN "user" u       ON u.id  = tr.requested_by_id
      LEFT JOIN departments  d  ON d.id  = p.department_id
      LEFT JOIN school_years sy ON sy.id = p.school_year_id
      JOIN LATERAL (
        SELECT status, office FROM request_status_track
        WHERE request_id = tr.id
        ORDER BY actioned_at DESC
        LIMIT 1
      ) rst ON true
      ORDER BY tr.submitted_at DESC
    `,
    sql`SELECT id, name FROM departments ORDER BY name ASC`,
    sql`SELECT id, name FROM school_years ORDER BY name ASC`,
  ]);

  return (
    <RequestsClient
      requests={requests as unknown as AdminRequest[]}
      departments={departments as unknown as { id: string; name: string }[]}
      schoolYears={schoolYears as unknown as { id: string; name: string }[]}
    />
  );
}
