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
