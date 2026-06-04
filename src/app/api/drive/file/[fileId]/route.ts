import { NextResponse } from "next/server";
import { google } from "googleapis";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId } = await params;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const fileMeta = await drive.files.get({
    fileId,
    fields: "id, name, mimeType",
  });

  const { token } = await oauth2Client.getAccessToken();
  const fileRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!fileRes.ok)
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });

  const contentType = fileMeta.data.mimeType ?? "application/octet-stream";
  const fileName = fileMeta.data.name ?? "file";

  return new NextResponse(fileRes.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}