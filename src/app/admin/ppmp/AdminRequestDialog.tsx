"use client";

import { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, TextField, Divider, Grid,
  ToggleButton, ToggleButtonGroup, Alert, CircularProgress,
  Chip, List, ListItem, ListItemIcon, ListItemText,
  IconButton, Paper,
} from "@mui/material";
import {
  CloseOutlined, BusinessOutlined, CalendarMonthOutlined,
  SchoolOutlined, UploadFileOutlined, CheckCircleOutlined,
  DeleteOutlined, AttachFileOutlined,
} from "@mui/icons-material";
import type { PpmpEntry } from "./page";
import { adminSubmitTrainingRequest } from "./requestAction";

type PreReq = {
  key: string;
  label: string;
  for: ("external" | "in-house")[];
  required: boolean;
};

const PRE_REQUIREMENTS: PreReq[] = [
  { key: "activity_design", label: "Activity Design", for: ["external", "in-house"], required: true },
  { key: "attendees", label: "Attendees (as participant/speaker)", for: ["in-house"], required: true },
  { key: "market_study", label: "Market Study", for: ["external", "in-house"], required: true },
  { key: "tor", label: "Terms of Reference (TOR)", for: ["in-house"], required: true },
  { key: "transportation", label: "Transportation", for: ["external"], required: false },
  { key: "dte_travel", label: "DTE / Travel Allowance (EO 77)", for: ["external"], required: true },
  { key: "bir", label: "BIR", for: ["external"], required: true },
  { key: "invitation_training", label: "Invitation Training", for: ["external"], required: true },
  { key: "invitation_speaker", label: "Invitation Letter, CV, Honorarium & Acceptance", for: ["in-house"], required: true },
  { key: "capdev_budget", label: "CapDev Budget", for: ["external", "in-house"], required: true },
  { key: "lb_form", label: "LB Form", for: ["external", "in-house"], required: true },
];

const FILE_LABELS: Record<string, string> = {
  activity_design: "Activity Design",
  attendees: "Attendees",
  market_study: "Market Study",
  tor: "Terms of Reference (TOR)",
  transportation: "Transportation",
  dte_travel: "DTE Travel Allowance (EO 77)",
  bir: "BIR",
  invitation_training: "Invitation Training",
  invitation_speaker: "Invitation Letter CV Honorarium Acceptance",
  capdev_budget: "CapDev Budget",
  lb_form: "LB Form",
};

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography variant="caption" sx={{ color: "#2e7d32", fontWeight: 700, letterSpacing: 1.5, display: "block", mb: 0.5 }}>
      {label}
    </Typography>
  );
}

type UploadedFile = { key: string; file: File };

export function AdminRequestDialog({
  entry,
  open,
  onClose,
  onSubmitted,
}: {
  entry: PpmpEntry | null;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [type, setType] = useState<"external" | "in-house">("external");
  const [trainingStart, setTrainingStart] = useState("");
  const [trainingEnd, setTrainingEnd] = useState("");
  const [remarks, setRemarks] = useState("");
  const [budgetWanted, setBudgetWanted] = useState("");
  const [requestorName, setRequestorName] = useState("");
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setType("external");
    setTrainingStart("");
    setTrainingEnd("");
    setRemarks("");
    setBudgetWanted("");
    setRequestorName("");
    setUploads([]);
    setError(null);
    setUploadStatus("");
    setDone(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  if (!entry) return null;

  const activeReqs = PRE_REQUIREMENTS.filter((r) => r.for.includes(type));
  const requiredKeys = activeReqs.filter((r) => r.required).map((r) => r.key);
  const uploadedKeys = uploads.map((u) => u.key);
  const missingRequired = requiredKeys.filter((k) => !uploadedKeys.includes(k));
  const budgetAllocation = entry.budget_allocation ? Number(entry.budget_allocation) : null;
  const budgetWantedNum = parseFloat(budgetWanted);
  const budgetExceeded = budgetAllocation !== null && !isNaN(budgetWantedNum) && budgetWantedNum >= budgetAllocation;
  const budgetValid = budgetAllocation === null || (budgetWanted !== "" && !isNaN(budgetWantedNum) && !budgetExceeded);
  const allRequiredUploaded = missingRequired.length === 0 && budgetValid && budgetWanted !== "" && requestorName.trim() !== "";

  function getUpload(key: string) {
    return uploads.find((u) => u.key === key);
  }

  function handleFileChange(key: string, file: File | null) {
    if (!file) return;
    setUploads((prev) => [...prev.filter((u) => u.key !== key), { key, file }]);
  }

  function removeFile(key: string) {
    setUploads((prev) => prev.filter((u) => u.key !== key));
  }

  async function handleSubmit() {
    if (!allRequiredUploaded) { setError("Please fill all required fields and upload all required documents."); return; }
    if (!trainingStart || !trainingEnd) { setError("Please set both training start and end dates."); return; }

    setLoading(true);
    setError(null);

    try {
      setUploadStatus("Creating folder on Google Drive…");
      const initRes = await fetch("/api/drive/init", { method: "POST" });
      if (!initRes.ok) throw new Error("Failed to create Drive folder");
      const { folderId, accessToken } = await initRes.json();

      for (let i = 0; i < uploads.length; i++) {
        const { key, file } = uploads[i];
        const label = FILE_LABELS[key] ?? key;
        const ext = file.name.split(".").pop() ?? "bin";
        const name = `${label}.${ext}`;
        setUploadStatus(`Uploading ${i + 1}/${uploads.length}: ${name}…`);
        const metadata = JSON.stringify({ name, parents: [folderId] });
        const form = new FormData();
        form.append("metadata", new Blob([metadata], { type: "application/json" }));
        form.append("file", file);
        const uploadRes = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form }
        );
        if (!uploadRes.ok) throw new Error(`Failed to upload ${name}`);
      }

      setUploadStatus("Saving request…");

      if (!entry) return; // ← add this line

      const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
      await adminSubmitTrainingRequest({
        ppmpId: entry.id ?? (entry as any).aip_code,
        type,
        trainingStart,
        trainingEnd,
        remarks,
        folderUrl,
        budgetWanted: budgetWanted ? parseFloat(budgetWanted) : null,
        requestorName: requestorName.trim(),
      });

      setDone(true);
      onSubmitted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setUploadStatus("");
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle component="div" sx={{
        bgcolor: "#1b5e20", color: "white", px: 3, py: 2.5,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start"
      }}>
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.6, letterSpacing: 1.5, fontSize: 11 }}>
            TRAINING REQUEST
          </Typography>
          <Typography variant="h6" fontWeight={700}>{entry.aip_code}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.25 }}>{entry.ppa}</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: "white" }} disabled={loading}>
          <CloseOutlined />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {done ? (
          <Box sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <CheckCircleOutlined sx={{ color: "#2e7d32", fontSize: 56 }} />
            <Typography variant="h6" fontWeight={700} color="#2e7d32">Request Submitted!</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              The training request has been submitted successfully.
            </Typography>
            <Button variant="contained" onClick={handleClose}
              sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" }, textTransform: "none", borderRadius: 2 }}>
              Done
            </Button>
          </Box>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* PPMP Info */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: "#f9fbe7", borderRadius: 2, border: "1px solid #e8f5e9" }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {entry.department_name && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <BusinessOutlined sx={{ fontSize: 15, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary">{entry.department_name}</Typography>
                  </Box>
                )}
                {entry.school_year_name && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <SchoolOutlined sx={{ fontSize: 15, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary">SY {entry.school_year_name}</Typography>
                  </Box>
                )}
                {entry.target_implementation && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <CalendarMonthOutlined sx={{ fontSize: 15, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary">{entry.target_implementation}</Typography>
                  </Box>
                )}
                {entry.pillar && (
                  <Chip label={entry.pillar} size="small" variant="outlined"
                    sx={{ borderColor: "#c8e6c9", color: "#2e7d32", fontSize: 11 }} />
                )}
              </Box>
            </Paper>

            {/* Requestor Name */}
            <SectionLabel label="REQUESTOR" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <TextField
              label="Requestor Name *"
              variant="standard"
              fullWidth
              value={requestorName}
              onChange={(e) => setRequestorName(e.target.value)}
              placeholder="Full name of the requestor"
              sx={{ mb: 3 }}
            />

            {/* Training Type */}
            <SectionLabel label="TRAINING TYPE" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <ToggleButtonGroup value={type} exclusive
              onChange={(_, val) => { if (val) { setType(val); setUploads([]); } }}
              sx={{ mb: 3 }}>
              {["external", "in-house"].map((v) => (
                <ToggleButton key={v} value={v} sx={{
                  textTransform: "none", fontWeight: 600, px: 3,
                  "&.Mui-selected": { bgcolor: "#e8f5e9", color: "#2e7d32", borderColor: "#2e7d32" },
                }}>
                  {v === "external" ? "External (E)" : "In-house (I)"}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {/* Schedule */}
            <SectionLabel label="TRAINING SCHEDULE" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Training Start Date"
                    value={trainingStart ? dayjs(trainingStart) : null}
                    onChange={(newValue) =>
                      setTrainingStart(newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "")
                    }
                    slotProps={{
                      textField: {
                        variant: "standard",
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Training End Date"
                    value={trainingEnd ? dayjs(trainingEnd) : null}
                    onChange={(newValue) =>
                      setTrainingEnd(newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "")
                    }
                    slotProps={{
                      textField: {
                        variant: "standard",
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            {/* Remarks */}
            <SectionLabel label="REMARKS" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <TextField label="Remarks / Notes" variant="standard" fullWidth multiline minRows={2}
              value={remarks} onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional — add any notes or special instructions" sx={{ mb: 3 }} />

            {/* Budget */}
            <SectionLabel label="BUDGET REQUESTED *" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            {budgetAllocation !== null && (
              <Box sx={{
                mb: 2, p: 1.5, bgcolor: "#f1f8e9", borderRadius: 2, border: "1px solid #c8e6c9",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <Typography variant="body2" color="text.secondary">Allocated Budget (PPMP)</Typography>
                <Typography variant="body2" fontWeight={700} color="#2e7d32">
                  ₱{budgetAllocation.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            )}
            <TextField
              label="Budget Requested (₱)" type="number" variant="standard" fullWidth
              value={budgetWanted} onChange={(e) => setBudgetWanted(e.target.value)}
              error={budgetExceeded}
              helperText={budgetExceeded
                ? `Must be less than ₱${budgetAllocation?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                : budgetValid && budgetWanted !== "" ? "✓ Within allocated budget" : "Required"}
              slotProps={{
                htmlInput: { min: 0, step: "0.01" },
                formHelperText: { sx: { color: budgetExceeded ? "error.main" : budgetValid && budgetWanted !== "" ? "#2e7d32" : "text.secondary" } },
              }}
              sx={{ mb: 3 }}
            />

            {/* Pre-requisite Documents */}
            <SectionLabel label="PRE-REQUISITE DOCUMENTS" />
            <Divider sx={{ mb: 1, borderColor: "#e8f5e9" }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              Upload all required documents. Files will be saved to Google Drive.
            </Typography>

            <List disablePadding>
              {activeReqs.map((req) => {
                const uploaded = getUpload(req.key);
                return (
                  <ListItem key={req.key} disablePadding sx={{
                    mb: 1.5, border: "1px solid",
                    borderColor: uploaded ? "#c8e6c9" : req.required ? "#ffccbc" : "#e0e0e0",
                    borderRadius: 2, p: 1.5, bgcolor: uploaded ? "#f1f8e9" : "white",
                  }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {uploaded
                        ? <CheckCircleOutlined sx={{ color: "#2e7d32", fontSize: 20 }} />
                        : <AttachFileOutlined sx={{ color: req.required ? "#e64a19" : "text.disabled", fontSize: 20 }} />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{req.label}</Typography>
                          {req.required && !uploaded && (
                            <Chip label="Required" size="small"
                              sx={{ fontSize: 10, height: 18, bgcolor: "#ffccbc", color: "#bf360c" }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color={uploaded ? "#2e7d32" : "text.disabled"}>
                          {uploaded ? uploaded.file.name : "No file uploaded"}
                        </Typography>
                      }
                    />
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      {uploaded && (
                        <IconButton size="small" onClick={() => removeFile(req.key)}
                          sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      )}
                      <Button component="label" size="small"
                        variant={uploaded ? "outlined" : "contained"}
                        startIcon={<UploadFileOutlined />}
                        sx={{
                          textTransform: "none", fontSize: 12, borderRadius: 2,
                          bgcolor: uploaded ? undefined : "#2e7d32",
                          borderColor: uploaded ? "#c8e6c9" : undefined,
                          color: uploaded ? "#2e7d32" : "white",
                          "&:hover": { bgcolor: uploaded ? "#f1f8e9" : "#1b5e20" },
                        }}>
                        {uploaded ? "Replace" : "Upload"}
                        <input type="file" hidden accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(req.key, e.target.files?.[0] ?? null)} />
                      </Button>
                    </Box>
                  </ListItem>
                );
              })}
            </List>

            {/* Summary */}
            <Box sx={{
              mt: 2, p: 2, borderRadius: 2, border: "1px solid",
              bgcolor: allRequiredUploaded ? "#f1f8e9" : "#fff3e0",
              borderColor: allRequiredUploaded ? "#c8e6c9" : "#ffe0b2"
            }}>
              <Typography variant="body2" fontWeight={600}
                color={allRequiredUploaded ? "#2e7d32" : "#e65100"}>
                {allRequiredUploaded
                  ? `✓ All required documents uploaded (${uploads.length} file${uploads.length !== 1 ? "s" : ""})`
                  : missingRequired.length > 0
                    ? `${missingRequired.length} required document${missingRequired.length !== 1 ? "s" : ""} still missing`
                    : !requestorName.trim()
                      ? "Requestor name is required"
                      : "Budget requested is required before submitting"}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      {!done && (
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={handleClose} sx={{ textTransform: "none" }} disabled={loading}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}
            disabled={loading || !allRequiredUploaded}
            sx={{ textTransform: "none", bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" }, minWidth: 160 }}>
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} color="inherit" />
                <Typography variant="caption" color="inherit" noWrap>{uploadStatus || "Processing…"}</Typography>
              </Box>
            ) : "Submit Request"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}