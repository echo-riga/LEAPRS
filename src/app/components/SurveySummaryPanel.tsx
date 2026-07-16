"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
  Divider,
  LinearProgress,
  Stack,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import {
  AssessmentOutlined,
  OpenInNewOutlined,
  AutoAwesomeOutlined,
  InfoOutlined,
} from "@mui/icons-material";
import { fetchSurveyDetails, generateAiSummary, initializeSurveyForms, syncSurveyResponses } from "../user/action";

type SurveyForm = {
  id: string;
  survey_type: string;
  google_form_url: string;
  google_form_id: string;
};

type ChartData = {
  speakerAverage: number;
  overallAverage: number;
  speakerDistribution: Record<string, number>;
  overallDistribution: Record<string, number>;
  satisfactionResponsesCount: number;
};

type SurveySummary = {
  id: string;
  summary_text: string | null;
  chart_data: ChartData | null;
  source_response_count: number;
  generated_at: string;
};

type Props = {
  requestId: string;
};

export default function SurveySummaryPanel({ requestId }: Props) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [surveyForms, setSurveyForms] = useState<SurveyForm[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [summary, setSummary] = useState<SurveySummary | null>(null);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSurveyDetails(requestId);
      setSurveyForms(data.forms);
      setResponseCount(data.responseCount);
      // Cast response to SurveySummary
      setSummary(data.summary as any);
    } catch (err: any) {
      console.error("Error loading survey details:", err);
      setError("Failed to load survey details.");
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeForms = async () => {
    try {
      setInitializing(true);
      setError(null);
      setSuccessMsg(null);
      await initializeSurveyForms(requestId);
      setSuccessMsg("Google survey forms successfully created and registered!");
      await loadDetails();
    } catch (err: any) {
      console.error("Error creating survey forms:", err);
      setError(err.message || "Failed to create Google survey forms.");
    } finally {
      setInitializing(false);
    }
  };

  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccessMsg(null);
      const res = await syncSurveyResponses(requestId);
      if (res.success) {
        setSuccessMsg(`Successfully synced responses! Added ${res.count} new submissions.`);
        await loadDetails();
      } else {
        setError(res.message || "Failed to sync responses.");
      }
    } catch (err: any) {
      console.error("Error syncing responses:", err);
      setError(err.message || "Failed to sync survey responses.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [requestId]);

  const handleGenerateSummary = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccessMsg(null);
      await generateAiSummary(requestId);
      setSuccessMsg("AI evaluation summary generated successfully!");
      await loadDetails();
    } catch (err: any) {
      console.error("Error generating summary:", err);
      setError(err.message || "Failed to generate AI summary.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} sx={{ color: "#2e7d32" }} />
      </Box>
    );
  }

  // Find forms
  const satisfactionForm = surveyForms.find((f) => f.survey_type === "satisfaction");
  const learningsForm = surveyForms.find((f) => f.survey_type === "learning");

  // Helper to render rating distribution rows
  const renderDistribution = (dist: Record<string, number>, total: number) => {
    const scores = ["5", "4", "3", "2", "1"];
    return (
      <Stack spacing={1} sx={{ width: "100%", mt: 1.5 }}>
        {scores.map((score) => {
          const count = dist[score] ?? 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <Box key={score} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 50, color: "text.secondary", fontWeight: 500 }}>
                {score} Stars
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "#e8f5e9",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "#2e7d32",
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ minWidth: 24, textAlign: "right", fontWeight: 700, color: "text.secondary" }}>
                {count}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    );
  };

  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} style={{ fontWeight: 700, color: "#1a1a1a" }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={index} style={{ fontStyle: "italic" }}>
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  // Helper to format generated markdown summary text into simple typography blocks
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return (
          <Typography
            key={idx}
            variant="subtitle1"
            sx={{ color: "#2e7d32", fontWeight: 700, mt: 3, mb: 1, letterSpacing: 0.5 }}
          >
            {parseInlineMarkdown(trimmed.replace("###", "").trim())}
          </Typography>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <Typography
            key={idx}
            variant="h6"
            sx={{ color: "#1b5e20", fontWeight: 700, mt: 3, mb: 1 }}
          >
            {parseInlineMarkdown(trimmed.replace("##", "").trim())}
          </Typography>
        );
      }
      if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•")) {
        const content = trimmed.substring(1).trim();
        if (content === "") {
          return <Box key={idx} sx={{ height: 4 }} />;
        }
        return (
          <Box key={idx} sx={{ display: "flex", gap: 1, pl: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">•</Typography>
            <Typography variant="body2" color="text.secondary">
              {parseInlineMarkdown(content)}
            </Typography>
          </Box>
        );
      }

      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        const num = numberedMatch[1];
        const content = numberedMatch[2];
        return (
          <Box key={idx} sx={{ display: "flex", gap: 1, pl: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
              {num}.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {parseInlineMarkdown(content)}
            </Typography>
          </Box>
        );
      }

      if (trimmed === "") {
        return <Box key={idx} sx={{ height: 8 }} />;
      }
      return (
        <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.6 }}>
          {parseInlineMarkdown(trimmed)}
        </Typography>
      );
    });
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="subtitle2" sx={{ color: "#2e7d32", fontWeight: 700, mb: 2, letterSpacing: 1 }}>
        POST-TRAINING SURVEY & AI SUMMARY
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

      {/* Survey Form Links */}
      {/* Survey Form Links */}
      {surveyForms.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 3,
            borderStyle: "dashed",
            borderColor: "#a5d6a7",
            bgcolor: "#f9f9f9",
            textAlign: "center",
          }}
        >
          <InfoOutlined fontSize="large" sx={{ color: "#2e7d32", mb: 1.5 }} />
          <Typography variant="subtitle2" fontWeight={700}>
            Google Survey Forms Not Created
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
            This training request was marked as completed before the survey system integration.
            Click below to retroactively generate Google Forms and register trigger webhooks for this request.
          </Typography>
          <Button
            variant="contained"
            disabled={initializing}
            onClick={handleInitializeForms}
            startIcon={
              initializing ? (
                <CircularProgress size={16} sx={{ color: "rgba(255,255,255,0.7)" }} />
              ) : (
                <AutoAwesomeOutlined />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#2e7d32",
              "&:hover": { bgcolor: "#1b5e20" },
              borderRadius: 2,
              px: 3.5,
            }}
          >
            {initializing ? "Generating Forms..." : "Generate Survey Forms"}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {satisfactionForm && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper
                sx={{
                  p: 2,
                  border: "1px solid #c8e6c9",
                  bgcolor: "#f1f8e9",
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#2e7d32">
                    Form 1: Satisfaction Survey
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, mb: 2 }}>
                    Rate the seminar speakers and overall quality.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  color="success"
                  startIcon={<OpenInNewOutlined />}
                  href={satisfactionForm.google_form_url}
                  target="_blank"
                  sx={{ textTransform: "none", fontWeight: 600, mt: 1 }}
                >
                  Open Google Form
                </Button>
              </Paper>
            </Grid>
          )}
          {learningsForm && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper
                sx={{
                  p: 2,
                  border: "1px solid #c8e6c9",
                  bgcolor: "#f1f8e9",
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#2e7d32">
                    Form 2: Learnings & Takeaways
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, mb: 2 }}>
                    Describe key knowledge gained and workplace application.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  color="success"
                  startIcon={<OpenInNewOutlined />}
                  href={learningsForm.google_form_url}
                  target="_blank"
                  sx={{ textTransform: "none", fontWeight: 600, mt: 1 }}
                >
                  Open Google Form
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Response Status / AI Generation Action */}
      <Box
        sx={{
          mb: 4,
          p: 2.5,
          borderRadius: 3,
          border: "1px dashed #a5d6a7",
          bgcolor: "#fafafa",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box
            sx={{
              p: 1,
              borderRadius: "50%",
              bgcolor: "#e8f5e9",
              color: "#2e7d32",
              display: "flex",
            }}
          >
            <AssessmentOutlined />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Survey Submissions Track
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total responses collected: <strong>{responseCount}</strong>. (Min. 2 responses required to generate summary).
            </Typography>
          </Box>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: { xs: "100%", md: "auto" } }}>
          <Button
            variant="outlined"
            color="success"
            disabled={syncing}
            onClick={handleSync}
            startIcon={
              syncing ? (
                <CircularProgress size={16} color="success" />
              ) : (
                <OpenInNewOutlined />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
            }}
          >
            {syncing ? "Syncing..." : "Sync Responses"}
          </Button>

          <Button
            variant="contained"
            disabled={responseCount < 2 || generating}
            onClick={handleGenerateSummary}
            startIcon={
              generating ? (
                <CircularProgress size={16} sx={{ color: "rgba(0,0,0,0.26)" }} />
              ) : (
                <AutoAwesomeOutlined />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#2e7d32",
              "&:hover": { bgcolor: "#1b5e20" },
              px: 3,
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            {generating
              ? "Analyzing..."
              : summary
              ? "Regenerate AI Summary"
              : "Generate AI Summary"}
          </Button>
        </Stack>
      </Box>

      {/* Generated Report Output */}
      {summary ? (
        <Card sx={{ borderRadius: 3, border: "1px solid #e0e0e0", boxShadow: "none" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#1b5e20" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <AutoAwesomeOutlined fontSize="small" /> AI Generated Summary & Charts
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Analyzed {summary.source_response_count} responses on{" "}
                {new Date(summary.generated_at).toLocaleDateString()}
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {/* Satisfaction Visual Charts (Form 1) */}
            {summary.chart_data && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ color: "#2e7d32", fontWeight: 700, mb: 2 }}>
                  SATISFACTION RATING CHARTS
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                        Speaker Rating Average
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="#2e7d32" sx={{ mt: 1, mb: 1 }}>
                        {summary.chart_data.speakerAverage} <Typography variant="body2" component="span" color="text.secondary">/ 5.0</Typography>
                      </Typography>
                      {renderDistribution(
                        summary.chart_data.speakerDistribution || {},
                        summary.chart_data.satisfactionResponsesCount || 0
                      )}
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                        Overall Seminar Rating Average
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="#2e7d32" sx={{ mt: 1, mb: 1 }}>
                        {summary.chart_data.overallAverage} <Typography variant="body2" component="span" color="text.secondary">/ 5.0</Typography>
                      </Typography>
                      {renderDistribution(
                        summary.chart_data.overallDistribution || {},
                        summary.chart_data.satisfactionResponsesCount || 0
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Gemini Summary Content (Form 2 / Combined) */}
            {summary.summary_text && (
              <Box>
                <Typography variant="subtitle1" sx={{ color: "#2e7d32", fontWeight: 700, mb: 1.5 }}>
                  AI FEEDBACK EVALUATION
                </Typography>
                <Box sx={{ bgcolor: "#f9f9f9", p: 2.5, borderRadius: 2, border: "1px solid #f0f0f0" }}>
                  {renderMarkdown(summary.summary_text)}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 3,
            borderStyle: "dashed",
            color: "text.secondary",
          }}
        >
          <InfoOutlined fontSize="large" sx={{ color: "#c8e6c9", mb: 1.5 }} />
          <Typography variant="subtitle2" fontWeight={700}>
            No AI Evaluation Report Generated Yet
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
            {responseCount >= 2
              ? "At least 2 survey responses have been submitted. Click 'Generate AI Summary' above to run the analysis."
              : "An AI generated evaluation report will become available once at least 2 participants submit their responses."}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
