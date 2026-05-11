import { NextResponse } from "next/server";
import { google } from "googleapis";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId } = await req.json();
  if (!fileId)
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  await drive.files.delete({ fileId });

  return NextResponse.json({ success: true });
}