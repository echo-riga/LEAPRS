"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function adminSubmitTrainingRequest(data: {
  ppmpId: string;
  type: string;
  trainingStart: string | null;
  trainingEnd: string | null;
  remarks: string | null;
  folderUrl: string;
  budgetWanted: number | null;
  requestorName: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  const [request] = (await sql`
    INSERT INTO training_requests
      (ppmp_id, requested_by_id, type, training_start, training_end, remarks, budget_wanted, requestor_name)
    VALUES (
      ${data.ppmpId},
      ${session.user.id},
      ${data.type},
      ${data.trainingStart || null},
      ${data.trainingEnd || null},
      ${data.remarks || null},
      ${data.budgetWanted},
      ${data.requestorName}
    )
    RETURNING id
  `) as unknown as { id: string }[];

  await sql`
    INSERT INTO request_status_track (request_id, status, file_url)
    VALUES (${request.id}, 'submitted', ${data.folderUrl})
  `;

  revalidatePath("/admin/ppmp");
  return { requestId: request.id };
}