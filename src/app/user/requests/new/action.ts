"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { google } from "googleapis";
import { Readable } from "stream";

const FILE_LABELS: Record<string, string> = {
  activity_design: "Activity Design",
  attendees: "Attendees",
  market_study: "Market Study",
  tor: "Terms of Reference (TOR)",
  transportation: "Transportation",
  dte_travel: "DTE Travel Allowance (EO 77)",
  bir: "BIR",
  invitation_training: "Invitation Training",
  invitation_speaker: "Invitation Letter CV Honorarium Acceptance",
  capdev_budget: "CapDev Budget",
  lb_form: "LB Form",
};

function getDrive() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return google.drive({ version: "v3", auth: oauth2Client });
}

export async function submitTrainingRequest(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const ppmpId = formData.get("ppmpId") as string;
  const type = formData.get("type") as string;
  const trainingStart = formData.get("trainingStart") as string | null;
  const trainingEnd = formData.get("trainingEnd") as string | null;
  const remarks = formData.get("remarks") as string | null;

  // collect files
  const fileEntries: { key: string; file: File }[] = [];
  for (const [key, value] of formData.entries()) {
    if (value instanceof File && value.size > 0 && FILE_LABELS[key]) {
      fileEntries.push({ key, file: value });
    }
  }

  if (fileEntries.length === 0) throw new Error("No files received");

  const drive = getDrive();

  // 1. create folder — "Juan Dela Cruz 2025-03-13"
  const folderDate = new Date().toISOString().split("T")[0];
  const folderName = `${session.user.name} ${folderDate}`;

  const folderRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID!],
    },
    fields: "id",
  });

  const folderId = folderRes.data.id!;

  // 2. make folder public
  await drive.permissions.create({
    fileId: folderId,
    requestBody: { role: "reader", type: "anyone" },
  });

  // 3. upload each file with clean name
  for (const { key, file } of fileEntries) {
    const ext = file.name.split(".").pop() ?? "bin";
    const fileName = `${FILE_LABELS[key]}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: stream,
      },
      fields: "id",
    });
  }

  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

  // 4. insert into DB only after all uploads succeed
  const [request] = (await sql`
    INSERT INTO training_requests
      (ppmp_id, requested_by_id, type, training_start, training_end, remarks)
    VALUES (
      ${ppmpId},
      ${session.user.id},
      ${type},
      ${trainingStart || null},
      ${trainingEnd || null},
      ${remarks || null}
    )
    RETURNING id
  `) as unknown as { id: string }[];

  await sql`
    INSERT INTO request_status_track (request_id, status, file_url)
    VALUES (${request.id}, 'submitted', ${folderUrl})
  `;

  revalidatePath("/user");
  return { requestId: request.id };
}
