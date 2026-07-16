"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSurveyFormsForRequest, syncGoogleFormResponses } from "@/lib/survey";
import { callGemini } from "@/lib/gemini";

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

export async function updateTrainingRequest(data: {
  requestId: string;
  type: string;
  trainingStart: string | null;
  trainingEnd: string | null;
  remarks: string | null;
  budgetWanted: number | null;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // Only allow edit if latest status is still 'submitted'
  const [latest] = (await sql`
    SELECT status FROM request_status_track
    WHERE request_id = ${data.requestId}
    ORDER BY actioned_at DESC
    LIMIT 1
  `) as unknown as { status: string }[];

  if (latest?.status !== "submitted") {
    throw new Error("Request can no longer be edited.");
  }

  await sql`
    UPDATE training_requests SET
      type           = ${data.type},
      training_start = ${data.trainingStart || null},
      training_end   = ${data.trainingEnd || null},
      remarks        = ${data.remarks || null},
      budget_wanted  = ${data.budgetWanted},
      updated_at     = NOW()
    WHERE id = ${data.requestId}
      AND requested_by_id = ${session.user.id}
  `;

  revalidatePath("/user");
  return { success: true };
}

export async function addMyStatusTrack(data: {
  requestId: string;
  office: string | null;
  status: string;
  fileUrl: string | null;
  remarks: string | null;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // Verify the request belongs to the user
  const [request] = (await sql`
    SELECT id FROM training_requests
    WHERE id = ${data.requestId}
      AND requested_by_id = ${session.user.id}
  `) as unknown as { id: string }[];

  if (!request) throw new Error("Request not found or unauthorized");

  if (data.status === "approved" && data.office === "Finance") {
    const rows = (await sql`
      SELECT tr.budget_wanted, p.id AS ppmp_id, p.remaining_budget
      FROM training_requests tr
      JOIN ppmp p ON p.id = tr.ppmp_id
      WHERE tr.id = ${data.requestId}
    `) as unknown as {
      budget_wanted: number | null;
      ppmp_id: string;
      remaining_budget: number | null;
    }[];

    const [req] = rows;
    if (!req) throw new Error("Request or PPMP not found.");

    const allocation = Number(req.remaining_budget ?? 0);
    const wanted = Number(req.budget_wanted ?? 0);

    if (wanted > 0 && allocation <= 0) {
      throw new Error("No remaining budget allocated for this PPMP entry. Approval is not allowed.");
    }
    if (wanted > allocation) {
      throw new Error(
        `Insufficient budget. Requested ₱${wanted.toLocaleString("en-PH", { minimumFractionDigits: 2 })} but only ₱${allocation.toLocaleString("en-PH", { minimumFractionDigits: 2 })} remaining.`
      );
    }

    if (wanted > 0) {
      await sql`
        UPDATE ppmp
        SET remaining_budget = remaining_budget - ${wanted},
          updated_at = now()
        WHERE id = ${req.ppmp_id}
      `;
    }
  }

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

  if (data.status === "completed") {
    try {
      await createSurveyFormsForRequest(data.requestId);
    } catch (err) {
      console.error("Survey forms creation failed:", err);
    }
  }

  revalidatePath("/user");
  return { success: true };
}

export async function fetchMyBudgetPreview(requestId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // Verify the request belongs to the user
  const [request] = (await sql`
    SELECT id FROM training_requests
    WHERE id = ${requestId}
      AND requested_by_id = ${session.user.id}
  `) as unknown as { id: string }[];

  if (!request) throw new Error("Request not found or unauthorized");

  const [row] = (await sql`
    SELECT tr.budget_wanted, p.budget_allocation, p.remaining_budget, p.ppa
    FROM training_requests tr
    JOIN ppmp p ON p.id = tr.ppmp_id
    WHERE tr.id = ${requestId}
  `) as unknown as {
    budget_wanted: number | null;
    budget_allocation: number | null;
    remaining_budget: number | null;
    ppa: string;
  }[];

  return row ?? null;
}

export async function fetchSurveyDetails(requestId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // Verify the request exists. If standard user, verify it belongs to them.
  let isAuthorized = false;
  if (session.user.role === "admin") {
    isAuthorized = true;
  } else {
    const [request] = (await sql`
      SELECT id FROM training_requests
      WHERE id = ${requestId} AND requested_by_id = ${session.user.id}
    `) as unknown as { id: string }[];
    if (request) isAuthorized = true;
  }

  if (!isAuthorized) throw new Error("Unauthorized");

  // Fetch Forms
  const forms = (await sql`
    SELECT id, survey_type, google_form_url, google_form_id
    FROM survey_forms
    WHERE training_request_id = ${requestId}
  `) as unknown as {
    id: string;
    survey_type: string;
    google_form_url: string;
    google_form_id: string;
  }[];

  // Fetch total responses count
  const [resCountRow] = (await sql`
    SELECT COUNT(DISTINCT id) AS count
    FROM survey_responses
    WHERE training_request_id = ${requestId}
  `) as unknown as { count: string }[];

  const responseCount = Number(resCountRow?.count ?? 0);

  // Fetch existing summary (latest first)
  const [summary] = (await sql`
    SELECT id, summary_text, unique_notes, chart_data, source_response_count, generated_at
    FROM survey_summaries
    WHERE training_request_id = ${requestId}
    ORDER BY generated_at DESC
    LIMIT 1
  `) as unknown as {
    id: string;
    summary_text: string | null;
    unique_notes: any;
    chart_data: any;
    source_response_count: number;
    generated_at: string;
  }[];

  return {
    forms,
    responseCount,
    summary: summary ?? null,
  };
}

export async function generateAiSummary(requestId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // Verify authorization (admin can view any, user only their own)
  let isAuthorized = false;
  if (session.user.role === "admin") {
    isAuthorized = true;
  } else {
    const [request] = (await sql`
      SELECT id FROM training_requests
      WHERE id = ${requestId} AND requested_by_id = ${session.user.id}
    `) as unknown as { id: string }[];
    if (request) isAuthorized = true;
  }

  if (!isAuthorized) throw new Error("Unauthorized");

  // Fetch training request details
  const [requestDetail] = (await sql`
    SELECT tr.id, p.ppa
    FROM training_requests tr
    JOIN ppmp p ON p.id = tr.ppmp_id
    WHERE tr.id = ${requestId}
  `) as unknown as { id: string; ppa: string }[];

  if (!requestDetail) throw new Error("Training request not found");

  // Fetch all responses for this request
  const responses = (await sql`
    SELECT r.id, r.answers, f.survey_type
    FROM survey_responses r
    JOIN survey_forms f ON f.id = r.survey_form_id
    WHERE r.training_request_id = ${requestId}
  `) as unknown as { id: string; answers: any; survey_type: string }[];

  if (responses.length < 2) {
    throw new Error("At least 2 responses are required to generate an AI summary.");
  }

  const satisfactionResponses = responses.filter((r) => r.survey_type === "satisfaction");
  const learningsResponses = responses.filter((r) => r.survey_type === "learning");

  // 1. Process satisfaction rating statistics (Form 1)
  let speakerRatings: number[] = [];
  let overallRatings: number[] = [];
  let satisfactionComments: string[] = [];

  satisfactionResponses.forEach((r) => {
    const ans = r.answers || {};
    // Extract ratings
    const speakerRatingVal = parseInt(ans["Speaker Rating"] || ans["Speaker"]);
    const overallRatingVal = parseInt(ans["Overall Seminar Rating"] || ans["Overall"]);
    
    if (!isNaN(speakerRatingVal)) speakerRatings.push(speakerRatingVal);
    if (!isNaN(overallRatingVal)) overallRatings.push(overallRatingVal);

    const commentsVal = ans["What went well?"] || ans["Suggestions for improvement"];
    if (commentsVal) satisfactionComments.push(commentsVal);
  });

  const getAverage = (arr: number[]) => arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0;
  const getDistribution = (arr: number[]) => {
    const dist = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    arr.forEach((val) => {
      const key = String(val) as keyof typeof dist;
      if (dist[key] !== undefined) dist[key]++;
    });
    return dist;
  };

  const speakerAvg = getAverage(speakerRatings);
  const overallAvg = getAverage(overallRatings);
  const speakerDist = getDistribution(speakerRatings);
  const overallDist = getDistribution(overallRatings);

  const chartData = {
    speakerAverage: speakerAvg,
    overallAverage: overallAvg,
    speakerDistribution: speakerDist,
    overallDistribution: overallDist,
    satisfactionResponsesCount: satisfactionResponses.length,
  };

  // 2. Process open-ended learnings responses (Form 2)
  let learningsTexts: string[] = [];
  learningsResponses.forEach((r) => {
    const ans = r.answers || {};
    const Q1 = ans["What did you learn from the seminar?"] || ans["What did you learn?"];
    const Q2 = ans["Key takeaways from the seminar"] || ans["Key takeaways"];
    const Q3 = ans["How will you apply this to your work?"] || ans["How will you apply"];

    if (Q1) learningsTexts.push(`Learnings: ${Q1}`);
    if (Q2) learningsTexts.push(`Key Takeaways: ${Q2}`);
    if (Q3) learningsTexts.push(`Application: ${Q3}`);
  });

  // Assemble the prompt for Gemini
  const prompt = `
You are an AI assistant analyzing seminar evaluation surveys for the training program "${requestDetail.ppa}".

Form 1: Satisfaction Rating Summary:
- Average Speaker Rating: ${speakerAvg} / 5 (from ${speakerRatings.length} ratings)
- Average Overall Seminar Rating: ${overallAvg} / 5 (from ${overallRatings.length} ratings)
- General comments: ${satisfactionComments.length > 0 ? satisfactionComments.map((c) => `"${c}"`).join(", ") : "None"}

Form 2: Learnings & Takeaways:
${learningsTexts.length > 0 ? learningsTexts.map((t, idx) => `${idx + 1}. ${t}`).join("\n") : "No text feedback received."}

Generate a comprehensive evaluation report in clean Markdown.
Structure the response EXACTLY in three parts with these headers:

### SUMMARY OF LEARNINGS AND TAKEAWAYS
[Synthesize the main learnings and takeaways described in Form 2. Do not just list them; compile them into a coherent summary paragraph.]

### UNIQUE OR THOUGHTFUL FEEDBACK
[Select and quote up to 3 of the most unique, interesting, or thoughtful text responses from Form 2. Explain why they are valuable.]

### COMBINED ANALYSIS
[Provide a combined analysis of both forms. Explain how the numeric ratings of Form 1 relate to the qualitative learnings of Form 2, highlighting key successes of the speaker/seminar and suggestions for improvements.]
`;

  // Call Gemini
  let summaryText = "";
  try {
    summaryText = await callGemini(prompt);
  } catch (err: any) {
    console.error("Gemini invocation failed:", err);
    throw new Error(`Failed to generate summary via Gemini: ${err.message}`);
  }

  // Clean existing summaries for this request to keep it clean
  await sql`
    DELETE FROM survey_summaries
    WHERE training_request_id = ${requestId}
  `;

  await sql`
    INSERT INTO survey_summaries (
      training_request_id,
      summary_type,
      summary_text,
      chart_data,
      source_response_count,
      model_used
    ) VALUES (
      ${requestId},
      'learning',
      ${summaryText},
      ${JSON.stringify(chartData)},
      ${responses.length},
      'gemini-flash-latest'
    )
  `;

  revalidatePath("/user");
  revalidatePath("/admin/requests");

  return { success: true };
}

export async function initializeSurveyForms(requestId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  let isAuthorized = false;
  if (session.user.role === "admin") {
    isAuthorized = true;
  } else {
    const [request] = (await sql`
      SELECT id FROM training_requests
      WHERE id = ${requestId} AND requested_by_id = ${session.user.id}
    `) as unknown as { id: string }[];
    if (request) isAuthorized = true;
  }

  if (!isAuthorized) throw new Error("Unauthorized");

  await createSurveyFormsForRequest(requestId);

  revalidatePath("/user");
  revalidatePath("/admin/requests");

  return { success: true };
}

export async function syncSurveyResponses(requestId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  let isAuthorized = false;
  if (session.user.role === "admin") {
    isAuthorized = true;
  } else {
    const [request] = (await sql`
      SELECT id FROM training_requests
      WHERE id = ${requestId} AND requested_by_id = ${session.user.id}
    `) as unknown as { id: string }[];
    if (request) isAuthorized = true;
  }

  if (!isAuthorized) throw new Error("Unauthorized");

  const res = await syncGoogleFormResponses(requestId);

  revalidatePath("/user");
  revalidatePath("/admin/requests");

  return res;
}


