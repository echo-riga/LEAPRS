// src/app/api/webhook/seminar-response/route.ts
import { NextRequest, NextResponse } from "next/server";

interface SeminarResponsePayload {
  formId: string;
  timestamp: string;
  respondentEmail: string | null;
  answers: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const payload: SeminarResponsePayload = await request.json();

  console.log("📩 New response:", JSON.stringify(payload, null, 2));

  return NextResponse.json({ status: "ok" });
}