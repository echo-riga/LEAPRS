import { google } from "googleapis";
import { sql } from "@/lib/db";

export async function createSurveyFormsForRequest(requestId: string) {
  // 1. Get training request info
  const [request] = (await sql`
    SELECT tr.id, p.ppa, tr.requestor_name
    FROM training_requests tr
    JOIN ppmp p ON p.id = tr.ppmp_id
    WHERE tr.id = ${requestId}
  `) as unknown as { id: string; ppa: string; requestor_name: string }[];

  if (!request) throw new Error("Training request not found");

  // Check if survey forms already exist for this request to avoid duplicates
  const existing = await sql`
    SELECT id FROM survey_forms
    WHERE training_request_id = ${requestId}
  `;
  if (existing.length > 0) {
    console.log(`Survey forms already exist for request: ${requestId}`);
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const formsApi = google.forms({ version: "v1", auth: oauth2Client });

  // Create Form 1: Satisfaction Rating
  const form1Title = `Satisfaction Rating - ${request.ppa}`;
  const form1Res = await formsApi.forms.create({
    requestBody: {
      info: {
        title: form1Title,
        documentTitle: form1Title,
      },
    },
  });

  const form1Id = form1Res.data.formId!;
  const form1Url = form1Res.data.responderUri!;

  // Add questions to Form 1
  await formsApi.forms.batchUpdate({
    formId: form1Id,
    requestBody: {
      requests: [
        {
          updateSettings: {
            settings: {
              emailCollectionType: "RESPONDER_INPUT",
            },
            updateMask: "emailCollectionType",
          },
        },
        {
          createItem: {
            location: { index: 0 },
            item: {
              title: "Respondent Name",
              questionItem: {
                question: {
                  required: true,
                  textQuestion: { paragraph: false },
                },
              },
            },
          },
        },
        {
          createItem: {
            location: { index: 1 },
            item: {
              title: "Speaker Rating",
              description: "Rate the speaker from 1 (Poor) to 5 (Excellent).",
              questionItem: {
                question: {
                  required: true,
                  scaleQuestion: {
                    low: 1,
                    high: 5,
                    lowLabel: "Poor",
                    highLabel: "Excellent",
                  },
                },
              },
            },
          },
        },
        {
          createItem: {
            location: { index: 2 },
            item: {
              title: "Overall Seminar Rating",
              description: "Rate the overall seminar quality from 1 (Poor) to 5 (Excellent).",
              questionItem: {
                question: {
                  required: true,
                  scaleQuestion: {
                    low: 1,
                    high: 5,
                    lowLabel: "Poor",
                    highLabel: "Excellent",
                  },
                },
              },
            },
          },
        },
        {
          createItem: {
            location: { index: 3 },
            item: {
              title: "What went well?",
              questionItem: {
                question: {
                  required: false,
                  textQuestion: { paragraph: true },
                },
              },
            },
          },
        },
        {
          createItem: {
            location: { index: 4 },
            item: {
              title: "Suggestions for improvement",
              questionItem: {
                question: {
                  required: false,
                  textQuestion: { paragraph: true },
                },
              },
            },
          },
        },
      ],
    },
  });

  // Create Form 2: Learnings and Takeaways
  const form2Title = `Learnings & Takeaways - ${request.ppa}`;
  const form2Res = await formsApi.forms.create({
    requestBody: {
      info: {
        title: form2Title,
        documentTitle: form2Title,
      },
    },
  });

  const form2Id = form2Res.data.formId!;
  const form2Url = form2Res.data.responderUri!;

  // Add questions to Form 2
  await formsApi.forms.batchUpdate({
    formId: form2Id,
    requestBody: {
      requests: [
        {
          updateSettings: {
            settings: {
              emailCollectionType: "RESPONDER_INPUT",
            },
            updateMask: "emailCollectionType",
          },
        },
        {
          createItem: {
            location: { index: 0 },
            item: {
              title: "Respondent Name",
              questionItem: {
                question: {
                  required: true,
                  textQuestion: { paragraph: false },
                },
              },
            },
          },
        },
        {
          createItem: {
            location: { index: 1 },
            item: {
              title: "What did you learn from the seminar?",
              questionItem: {
                question: {
                  required: true,
                  textQuestion: { paragraph: true },
                },
              },
            },
          },
        },
        {
          createItem: {
            location: { index: 2 },
            item: {
              title: "Key takeaways from the seminar",
              questionItem: {
                question: {
                  required: true,
                  textQuestion: { paragraph: true },
                },
              },
            },
          },
        },
        {
          createItem: {
            location: { index: 3 },
            item: {
              title: "How will you apply this to your work?",
              questionItem: {
                question: {
                  required: true,
                  textQuestion: { paragraph: true },
                },
              },
            },
          },
        },
      ],
    },
  });

  // Save both forms in survey_forms table
  await sql`
    INSERT INTO survey_forms (training_request_id, survey_type, google_form_id, google_form_url)
    VALUES 
      (${requestId}, 'satisfaction', ${form1Id}, ${form1Url}),
      (${requestId}, 'learning', ${form2Id}, ${form2Url})
  `;

  // Register Google Apps Script triggers for both form IDs
  const scriptUrl = "https://script.google.com/macros/s/AKfycbyEMCX12l_mF5XcDPEb1az1JYjSFpVgLtsCK9wu0dZQqHRTCZQwvchvfHyv1xXAhkeEuA/exec";
  
  try {
    await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId: form1Id })
    });
    await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId: form2Id })
    });
    console.log(`Successfully created and registered surveys for request ${requestId}`);
  } catch (err) {
    console.error("Failed to register Apps Script trigger:", err);
  }
}

export async function syncGoogleFormResponses(requestId: string) {
  const forms = (await sql`
    SELECT id, google_form_id, survey_type FROM survey_forms
    WHERE training_request_id = ${requestId}
  `) as unknown as { id: string; google_form_id: string; survey_type: string }[];

  if (forms.length === 0) return { success: false, message: "No forms found for request." };

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const formsApi = google.forms({ version: "v1", auth: oauth2Client });
  let newResponsesCount = 0;

  for (const form of forms) {
    try {
      const formInfo = await formsApi.forms.get({ formId: form.google_form_id });
      const questionMap: Record<string, string> = {};
      formInfo.data.items?.forEach((item) => {
        if (item.questionItem?.question?.questionId) {
          questionMap[item.questionItem.question.questionId] = item.title || "";
        }
      });

      const responsesList = await formsApi.forms.responses.list({ formId: form.google_form_id });
      const responses = responsesList.data.responses || [];

      for (const res of responses) {
        const respondentEmail = res.respondentEmail || null;
        const submittedAt = res.createTime ? new Date(res.createTime) : new Date();

        const answers: Record<string, any> = {};
        Object.entries(res.answers || {}).forEach(([qId, ansObj]: [string, any]) => {
          const title = questionMap[qId] || qId;
          const val = ansObj.textAnswers?.answers?.[0]?.value || "";
          answers[title] = val;
        });

        const respondentName = answers["Respondent Name"] || null;

        const existing = await sql`
          SELECT id FROM survey_responses
          WHERE survey_form_id = ${form.id}
            AND (
              (respondent_email IS NOT NULL AND respondent_email = ${respondentEmail || ""})
              OR (respondent_name IS NOT NULL AND respondent_name = ${respondentName || ""})
            )
            AND EXTRACT(EPOCH FROM (submitted_at - ${submittedAt})) < 60
        `;

        if (existing.length === 0) {
          await sql`
            INSERT INTO survey_responses 
              (survey_form_id, training_request_id, respondent_email, respondent_name, answers, submitted_at)
            VALUES (
              ${form.id},
              ${requestId},
              ${respondentEmail || null},
              ${respondentName},
              ${JSON.stringify(answers)},
              ${submittedAt}
            )
          `;
          newResponsesCount++;
        }
      }
    } catch (err) {
      console.error(`Failed to sync responses for form ${form.google_form_id}:`, err);
    }
  }

  return { success: true, count: newResponsesCount };
}
