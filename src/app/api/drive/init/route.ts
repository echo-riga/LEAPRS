import { NextResponse } from "next/server";
import { google } from "googleapis";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const { token: accessToken } = await oauth2Client.getAccessToken();
  if (!accessToken)
    return NextResponse.json({ error: "No access token" }, { status: 500 });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // folder name: "Juan Dela Cruz 2025-03-13"
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

  await drive.permissions.create({
    fileId: folderId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return NextResponse.json({ folderId, accessToken });
}
