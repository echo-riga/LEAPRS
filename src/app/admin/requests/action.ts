"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function fetchStatusTrack(requestId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  return (await sql`
    SELECT id, request_id, office, status, file_url, remarks, actioned_at
    FROM request_status_track
    WHERE request_id = ${requestId}
    ORDER BY actioned_at ASC
  `) as unknown as {
    id: string;
    request_id: string;
    office: string | null;
    status: string;
    file_url: string | null;
    remarks: string | null;
    actioned_at: string;
  }[];
}

export async function addStatusTrack(data: {
  requestId: string;
  office: string | null;
  status: string;
  fileUrl: string | null;
  remarks: string | null;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  if (data.status === "approved") {
   const rows = (await sql`
  SELECT tr.budget_wanted, p.id AS ppmp_id, p.remaining_budget
  FROM training_requests tr
  JOIN ppmp p ON p.id = tr.ppmp_id
  WHERE tr.id = ${data.requestId}
`) as unknown as {
  budget_wanted: number | null;
  ppmp_id: string;
  remaining_budget: number | null;
}[];

const [req] = rows;
if (!req) throw new Error("Request or PPMP not found.");

const allocation = Number(req.remaining_budget ?? 0);
const wanted = Number(req.budget_wanted ?? 0);

    if (wanted > 0 && allocation <= 0) {
      throw new Error("No remaining budget allocated for this PPMP entry. Approval is not allowed.");
    }
    if (wanted > allocation) {
      throw new Error(
        `Insufficient budget. Requested ₱${wanted.toLocaleString("en-PH", { minimumFractionDigits: 2 })} but only ₱${allocation.toLocaleString("en-PH", { minimumFractionDigits: 2 })} remaining.`
      );
    }

    if (wanted > 0) {
     await sql`
      UPDATE ppmp
      SET remaining_budget = remaining_budget - ${wanted},
        updated_at = now()
      WHERE id = ${req.ppmp_id}
      `;
    }
  }

  await sql`
    INSERT INTO request_status_track (request_id, office, status, file_url, remarks)
    VALUES (
      ${data.requestId},
      ${data.office || null},
      ${data.status},
      ${data.fileUrl || null},
      ${data.remarks || null}
    )
  `;

  revalidatePath("/admin/requests");
}

export async function fetchBudgetPreview(requestId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  const [row] = (await sql`
  SELECT tr.budget_wanted, p.budget_allocation, p.remaining_budget, p.ppa
  FROM training_requests tr
  JOIN ppmp p ON p.id = tr.ppmp_id
  WHERE tr.id = ${requestId}
`) as unknown as {
  budget_wanted: number | null;
  budget_allocation: number | null;
  remaining_budget: number | null;
  ppa: string;
}[];

  return row ?? null;
}