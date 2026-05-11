import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import {EditRequestClient} from "./EditRequestClient";

export const dynamic = "force-dynamic";

export type EditRequestDetail = {
  id: string;
  aip_code: string;
  ppa: string;
  type: "external" | "in-house";
  training_start: string | null;
  training_end: string | null;
  remarks: string | null;
  budget_wanted: number | null;
  folder_url: string | null;
  // PPMP fields
  ppmp_id: string;
  department_name: string | null;
  school_year_name: string | null;
  pillar: string | null;
  intended_outcome: string | null;
  planned_outputs: string | null;
  ppa_owner: string | null;
  target_implementation: string | null;
  budget_allocation: number | null;
};

export default async function EditRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id } = await params;

  const [entry] = (await sql`
    SELECT
      tr.id,
      p.aip_code,
      p.ppa,
      tr.type,
      tr.training_start,
      tr.training_end,
      tr.remarks,
      tr.budget_wanted,
      rst.file_url      AS folder_url,
      p.id              AS ppmp_id,
      d.name            AS department_name,
      sy.name           AS school_year_name,
      p.pillar,
      p.intended_outcome,
      p.planned_outputs,
      p.ppa_owner,
      p.target_implementation,
      p.budget_allocation
    FROM training_requests tr
    JOIN ppmp p ON p.id = tr.ppmp_id
    LEFT JOIN departments  d  ON d.id  = p.department_id
    LEFT JOIN school_years sy ON sy.id = p.school_year_id
    LEFT JOIN LATERAL (
      SELECT status, file_url FROM request_status_track
      WHERE request_id = tr.id
      ORDER BY actioned_at DESC
      LIMIT 1
    ) rst ON true
    WHERE tr.id = ${id}
      AND tr.requested_by_id = ${session.user.id}
  `) as unknown as EditRequestDetail[];

  if (!entry) redirect("/user");

  // Only allow edit if still submitted
  const [latest] = (await sql`
    SELECT status FROM request_status_track
    WHERE request_id = ${id}
    ORDER BY actioned_at DESC
    LIMIT 1
  `) as unknown as { status: string }[];

  if (latest?.status !== "submitted") redirect("/user");

  return <EditRequestClient entry={entry} />;
}