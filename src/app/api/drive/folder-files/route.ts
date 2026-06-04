import { NextResponse } from "next/server";
import { google } from "googleapis";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get("trackId");
  if (!trackId)
    return NextResponse.json({ error: "Missing trackId" }, { status: 400 });

  // Verify this track belongs to a request owned by this user
  const [track] = (await sql`
    SELECT rst.file_url
    FROM request_status_track rst
    JOIN training_requests tr ON tr.id = rst.request_id
    WHERE rst.id = ${trackId}
      AND tr.requested_by_id = ${session.user.id}
  `) as unknown as { file_url: string | null }[];

  if (!track)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!track.file_url)
    return NextResponse.json({ files: [] });

  const folderId = track.file_url.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!folderId)
    return NextResponse.json({ error: "Invalid folder URL" }, { status: 400 });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType)",
    pageSize: 50,
  });

  return NextResponse.json({ files: res.data.files ?? [] });
}