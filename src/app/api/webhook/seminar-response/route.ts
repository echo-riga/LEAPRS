import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formId, timestamp, respondentEmail, answers } = body;

    console.log("SURVEY WEBHOOK RECEIVED:", body);

    if (!formId) {
      return NextResponse.json({ error: "Missing formId" }, { status: 400 });
    }

    // Look up the survey_form by google_form_id
    const [surveyForm] = (await sql`
      SELECT id, training_request_id FROM survey_forms
      WHERE google_form_id = ${formId}
    `) as unknown as { id: string; training_request_id: string }[];

    if (!surveyForm) {
      console.warn(`Survey form not found for Google Form ID: ${formId}`);
      return NextResponse.json({ error: "Survey form not found" }, { status: 404 });
    }

    // Extract respondent name if present in answers
    const respondentName = answers?.["Respondent Name"] || null;

    // Check if this specific response (form + email/name) already exists to avoid duplication
    const duplicate = await sql`
      SELECT id FROM survey_responses
      WHERE survey_form_id = ${surveyForm.id}
        AND (
          (respondent_email IS NOT NULL AND respondent_email = ${respondentEmail || ""})
          OR (respondent_name IS NOT NULL AND respondent_name = ${respondentName || ""})
        )
        AND EXTRACT(EPOCH FROM (submitted_at - ${timestamp ? new Date(timestamp) : new Date()})) < 60
    `;

    if (duplicate.length > 0) {
      console.log("Duplicate response detected within 60s, ignoring.");
      return NextResponse.json({ success: true, message: "Duplicate ignored" });
    }

    // Insert response into survey_responses
    await sql`
      INSERT INTO survey_responses 
        (survey_form_id, training_request_id, respondent_email, respondent_name, answers, submitted_at)
      VALUES (
        ${surveyForm.id},
        ${surveyForm.training_request_id},
        ${respondentEmail || null},
        ${respondentName},
        ${JSON.stringify(answers || {})},
        ${timestamp ? new Date(timestamp) : new Date()}
      )
    `;

    console.log(`Successfully saved survey response for request ${surveyForm.training_request_id}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}