"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitTrainingRequest(data: {
  ppmpId: string;
  type: string;
  trainingStart: string | null;
  trainingEnd: string | null;
  remarks: string | null;
  folderUrl: string;
  budgetWanted: number | null; // ← add this
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const [request] = (await sql`
    INSERT INTO training_requests
      (ppmp_id, requested_by_id, type, training_start, training_end, remarks, budget_wanted)
    VALUES (
      ${data.ppmpId},
      ${session.user.id},
      ${data.type},
      ${data.trainingStart || null},
      ${data.trainingEnd || null},
      ${data.remarks || null},
      ${data.budgetWanted}
    )
    RETURNING id
  `) as unknown as { id: string }[];

  await sql`
    INSERT INTO request_status_track (request_id, status, file_url)
    VALUES (${request.id}, 'submitted', ${data.folderUrl})
  `;

  revalidatePath("/user");
  return { requestId: request.id };
}

export async function updateTrainingRequest(data: {
  requestId: string;
  type: string;
  trainingStart: string | null;
  trainingEnd: string | null;
  remarks: string | null;
  budgetWanted: number | null;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const [latest] = (await sql`
    SELECT status FROM request_status_track
    WHERE request_id = ${data.requestId}
    ORDER BY actioned_at DESC
    LIMIT 1
  `) as unknown as { status: string }[];

  if (latest?.status !== "submitted")
    throw new Error("Request can no longer be edited.");

  await sql`
    UPDATE training_requests SET
      type           = ${data.type},
      training_start = ${data.trainingStart || null},
      training_end   = ${data.trainingEnd || null},
      remarks        = ${data.remarks || null},
      budget_wanted  = ${data.budgetWanted},
      updated_at     = NOW()
    WHERE id = ${data.requestId}
      AND requested_by_id = ${session.user.id}
  `;

  revalidatePath("/user");
  return { success: true };
}
