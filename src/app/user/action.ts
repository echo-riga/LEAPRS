"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function fetchMyRequestTrack(requestId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  return (await sql`
    SELECT id, office, status, file_url, remarks, actioned_at
    FROM request_status_track
    WHERE request_id = ${requestId}
    ORDER BY actioned_at ASC
  `) as unknown as {
    id: string;
    office: string | null;
    status: string;
    file_url: string | null;
    remarks: string | null;
    actioned_at: string;
  }[];
}

export async function submitPostCompletionDocs(data: {
  requestId: string;
  folderUrl: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // verify this request belongs to the user
  const [request] = (await sql`
    SELECT id FROM training_requests
    WHERE id = ${data.requestId}
      AND requested_by_id = ${session.user.id}
  `) as unknown as { id: string }[];

  if (!request) throw new Error("Request not found");

  // verify current latest status is pending_completion_docs
  const [latest] = (await sql`
    SELECT status FROM request_status_track
    WHERE request_id = ${data.requestId}
    ORDER BY actioned_at DESC
    LIMIT 1
  `) as unknown as { status: string }[];

  if (latest?.status !== "pending_completion_docs") {
    throw new Error("Request is not awaiting completion documents");
  }

  // insert pending_completion_approval with the subfolder url
  await sql`
    INSERT INTO request_status_track (request_id, status, file_url, remarks)
    VALUES (
      ${data.requestId},
      'pending_completion_approval',
      ${data.folderUrl},
      'Post-completion documents submitted by employee'
    )
  `;

  revalidatePath("/user");
  return { success: true };
}
