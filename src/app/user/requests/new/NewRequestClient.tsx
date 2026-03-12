// src/app/(protected)/user/requests/new/NewRequestClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  Grid,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  ArrowBackOutlined,
  BusinessOutlined,
  CalendarMonthOutlined,
  SchoolOutlined,
  UploadFileOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  AttachFileOutlined,
} from "@mui/icons-material";
import type { PpmpDetail } from "./page";
import { submitTrainingRequest } from "./action";
// ── pre-requirement definitions ───────────────────────────────────────────────

type PreReq = {
  key: string;
  label: string;
  for: ("external" | "in-house")[];
  required: boolean;
};

const PRE_REQUIREMENTS: PreReq[] = [
  {
    key: "activity_design",
    label: "Activity Design",
    for: ["external", "in-house"],
    required: true,
  },
  {
    key: "attendees",
    label: "Attendees (as participant/speaker)",
    for: ["in-house"],
    required: true,
  },
  {
    key: "market_study",
    label: "Market Study",
    for: ["external", "in-house"],
    required: true,
  },
  {
    key: "tor",
    label: "Terms of Reference (TOR)",
    for: ["in-house"],
    required: true,
  },
  {
    key: "transportation",
    label: "Transportation",
    for: ["external"],
    required: false,
  },
  {
    key: "dte_travel",
    label: "DTE / Travel Allowance (EO 77)",
    for: ["external"],
    required: true,
  },
  { key: "bir", label: "BIR", for: ["external"], required: true },
  {
    key: "invitation_training",
    label: "Invitation Training",
    for: ["external"],
    required: true,
  },
  {
    key: "invitation_speaker",
    label: "Invitation Letter, CV, Honorarium & Acceptance",
    for: ["in-house"],
    required: true,
  },
  {
    key: "capdev_budget",
    label: "CapDev Budget",
    for: ["external", "in-house"],
    required: true,
  },
  {
    key: "lb_form",
    label: "LB Form",
    for: ["external", "in-house"],
    required: true,
  },
];

type UploadedFile = { key: string; file: File };

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      sx={{
        color: "#2e7d32",
        fontWeight: 700,
        letterSpacing: 1.5,
        display: "block",
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
  );
}

export function NewRequestClient({ entry }: { entry: PpmpDetail }) {
  const router = useRouter();
  const [type, setType] = useState<"external" | "in-house">("external");
  const [trainingStart, setTrainingStart] = useState("");
  const [trainingEnd, setTrainingEnd] = useState("");
  const [remarks, setRemarks] = useState("");
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const activeReqs = PRE_REQUIREMENTS.filter((r) => r.for.includes(type));

  function handleFileChange(key: string, file: File | null) {
    if (!file) return;
    setUploads((prev) => {
      const filtered = prev.filter((u) => u.key !== key);
      return [...filtered, { key, file }];
    });
  }

  function removeFile(key: string) {
    setUploads((prev) => prev.filter((u) => u.key !== key));
  }

  function getUpload(key: string) {
    return uploads.find((u) => u.key === key);
  }

  const requiredKeys = activeReqs.filter((r) => r.required).map((r) => r.key);
  const uploadedKeys = uploads.map((u) => u.key);
  const missingRequired = requiredKeys.filter((k) => !uploadedKeys.includes(k));
  const allRequiredUploaded = missingRequired.length === 0;
  async function handleSubmit() {
    if (!allRequiredUploaded) {
      setError("Please upload all required documents before submitting.");
      return;
    }
    if (!trainingStart || !trainingEnd) {
      setError("Please set both training start and end dates.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("ppmpId", entry.id);
      formData.append("type", type);
      formData.append("trainingStart", trainingStart);
      formData.append("trainingEnd", trainingEnd);
      formData.append("remarks", remarks);

      for (const { key, file } of uploads) {
        formData.append(key, file);
      }

      const { requestId } = await submitTrainingRequest(formData);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }
  return (
    <Box>
      <Button
        startIcon={<ArrowBackOutlined />}
        onClick={() => router.back()}
        sx={{ textTransform: "none", color: "text.secondary", mb: 3, pl: 0 }}
      >
        Back
      </Button>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="#1b5e20">
          New Training Request
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Review the PPMP entry and complete all required pre-requisite
          documents.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT — PPMP summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #e8f5e9",
              borderRadius: 3,
              p: 3,
              position: "sticky",
              top: 24,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                bgcolor: "#e8f5e9",
                color: "#2e7d32",
                px: 1.2,
                py: 0.4,
                borderRadius: 1,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              {entry.aip_code}
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              color="#1a1a1a"
              sx={{ mt: 1.5, mb: 2 }}
            >
              {entry.ppa}
            </Typography>
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              {entry.department_name && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BusinessOutlined
                    sx={{ fontSize: 15, color: "text.disabled" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {entry.department_name}
                  </Typography>
                </Box>
              )}
              {entry.school_year_name && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SchoolOutlined
                    sx={{ fontSize: 15, color: "text.disabled" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    SY {entry.school_year_name}
                  </Typography>
                </Box>
              )}
              {entry.target_implementation && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarMonthOutlined
                    sx={{ fontSize: 15, color: "text.disabled" }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {entry.target_implementation}
                  </Typography>
                </Box>
              )}
              {entry.ppa_owner && (
                <Typography variant="body2" color="text.secondary">
                  Owner: {entry.ppa_owner}
                </Typography>
              )}
              {entry.pillar && (
                <Chip
                  label={entry.pillar}
                  size="small"
                  variant="outlined"
                  sx={{
                    alignSelf: "flex-start",
                    borderColor: "#c8e6c9",
                    color: "#2e7d32",
                    fontSize: 11,
                  }}
                />
              )}
            </Box>

            {entry.intended_outcome && (
              <Box sx={{ mt: 2.5 }}>
                <SectionLabel label="INTENDED OUTCOME" />
                <Typography variant="body2" color="text.secondary">
                  {entry.intended_outcome}
                </Typography>
              </Box>
            )}
            {entry.planned_outputs && (
              <Box sx={{ mt: 2 }}>
                <SectionLabel label="PLANNED OUTPUTS" />
                <Typography variant="body2" color="text.secondary">
                  {entry.planned_outputs}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* RIGHT — form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{ border: "1px solid #e8f5e9", borderRadius: 3, p: 3 }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Type */}
            <SectionLabel label="TRAINING TYPE" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, val) => {
                if (val) {
                  setType(val);
                  setUploads([]);
                }
              }}
              sx={{ mb: 3 }}
            >
              <ToggleButton
                value="external"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  "&.Mui-selected": {
                    bgcolor: "#e8f5e9",
                    color: "#2e7d32",
                    borderColor: "#2e7d32",
                  },
                }}
              >
                External (E)
              </ToggleButton>
              <ToggleButton
                value="in-house"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  "&.Mui-selected": {
                    bgcolor: "#e8f5e9",
                    color: "#2e7d32",
                    borderColor: "#2e7d32",
                  },
                }}
              >
                In-house (I)
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Schedule */}
            <SectionLabel label="TRAINING SCHEDULE" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Training Start Date"
                  type="date"
                  variant="standard"
                  fullWidth
                  value={trainingStart}
                  onChange={(e) => setTrainingStart(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Training End Date"
                  type="date"
                  variant="standard"
                  fullWidth
                  value={trainingEnd}
                  onChange={(e) => setTrainingEnd(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>

            {/* Remarks */}
            <SectionLabel label="REMARKS" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <TextField
              label="Remarks / Notes"
              variant="standard"
              fullWidth
              multiline
              minRows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional — add any notes or special instructions"
              sx={{ mb: 3 }}
            />

            {/* Pre-requirements */}
            <SectionLabel label="PRE-REQUISITE DOCUMENTS" />
            <Divider sx={{ mb: 1, borderColor: "#e8f5e9" }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 2 }}
            >
              Upload all required documents. Files will be compiled and linked
              to a Google Drive folder upon submission.
            </Typography>

            <List disablePadding>
              {activeReqs.map((req) => {
                const uploaded = getUpload(req.key);
                return (
                  <ListItem
                    key={req.key}
                    disablePadding
                    sx={{
                      mb: 1.5,
                      border: "1px solid",
                      borderColor: uploaded
                        ? "#c8e6c9"
                        : req.required
                          ? "#ffccbc"
                          : "#e0e0e0",
                      borderRadius: 2,
                      p: 1.5,
                      bgcolor: uploaded ? "#f1f8e9" : "white",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {uploaded ? (
                        <CheckCircleOutlined
                          sx={{ color: "#2e7d32", fontSize: 20 }}
                        />
                      ) : (
                        <AttachFileOutlined
                          sx={{
                            color: req.required ? "#e64a19" : "text.disabled",
                            fontSize: 20,
                          }}
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {req.label}
                          </Typography>
                          {req.required && !uploaded && (
                            <Chip
                              label="Required"
                              size="small"
                              sx={{
                                fontSize: 10,
                                height: 18,
                                bgcolor: "#ffccbc",
                                color: "#bf360c",
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        uploaded ? (
                          <Typography variant="caption" color="#2e7d32">
                            {uploaded.file.name}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            No file uploaded
                          </Typography>
                        )
                      }
                    />
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      {uploaded && (
                        <IconButton
                          size="small"
                          onClick={() => removeFile(req.key)}
                          sx={{
                            color: "text.disabled",
                            "&:hover": { color: "error.main" },
                          }}
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      )}
                      <Button
                        component="label"
                        size="small"
                        variant={uploaded ? "outlined" : "contained"}
                        startIcon={<UploadFileOutlined />}
                        sx={{
                          textTransform: "none",
                          fontSize: 12,
                          borderRadius: 2,
                          bgcolor: uploaded ? undefined : "#2e7d32",
                          borderColor: uploaded ? "#c8e6c9" : undefined,
                          color: uploaded ? "#2e7d32" : "white",
                          "&:hover": {
                            bgcolor: uploaded ? "#f1f8e9" : "#1b5e20",
                          },
                        }}
                      >
                        {uploaded ? "Replace" : "Upload"}
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            handleFileChange(
                              req.key,
                              e.target.files?.[0] ?? null,
                            )
                          }
                        />
                      </Button>
                    </Box>
                  </ListItem>
                );
              })}
            </List>

            {/* Upload summary */}
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: allRequiredUploaded ? "#f1f8e9" : "#fff3e0",
                borderRadius: 2,
                border: "1px solid",
                borderColor: allRequiredUploaded ? "#c8e6c9" : "#ffe0b2",
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                color={allRequiredUploaded ? "#2e7d32" : "#e65100"}
              >
                {allRequiredUploaded
                  ? `✓ All required documents uploaded (${uploads.length} file${uploads.length !== 1 ? "s" : ""})`
                  : `${missingRequired.length} required document${missingRequired.length !== 1 ? "s" : ""} still missing`}
              </Typography>
            </Box>

            {/* Actions */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                mt: 3,
              }}
            >
              <Button
                onClick={() => router.back()}
                sx={{ textTransform: "none" }}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !allRequiredUploaded || submitted}
                sx={{
                  textTransform: "none",
                  bgcolor: "#2e7d32",
                  "&:hover": { bgcolor: "#1b5e20" },
                  px: 4,
                }}
              >
                {loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : submitted ? (
                  "Submitted"
                ) : (
                  "Submit Request"
                )}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
