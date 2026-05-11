"use client";

import { useState, useEffect } from "react";
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
  CloudDoneOutlined,
} from "@mui/icons-material";
import type { EditRequestDetail } from "./page";
import { updateTrainingRequest } from "@/app/user/requests/new/action";

// ── types ─────────────────────────────────────────────────────────────────────

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

// A slot can be: existing (on Drive), replaced (new file replacing existing),
// new (no existing, user uploaded), removed (existing marked for deletion), or empty
type SlotState =
  | { status: "existing"; driveFileId: string; driveName: string }
  | { status: "replaced"; driveFileId: string; driveName: string; newFile: File }
  | { status: "new"; newFile: File }
  | { status: "removed"; driveFileId: string }
  | { status: "empty" };

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      sx={{ color: "#2e7d32", fontWeight: 700, letterSpacing: 1.5, display: "block", mb: 0.5 }}
    >
      {label}
    </Typography>
  );
}

function extractFolderId(url: string) {
  return url.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1] ?? null;
}

// ── main component ────────────────────────────────────────────────────────────

export function EditRequestClient({ entry }: { entry: EditRequestDetail }) {
  const router = useRouter();

  const [type, setType] = useState<"external" | "in-house">(entry.type);
  const [trainingStart, setTrainingStart] = useState(
    entry.training_start ? new Date(entry.training_start).toISOString().split("T")[0] : ""
  );
  const [trainingEnd, setTrainingEnd] = useState(
    entry.training_end ? new Date(entry.training_end).toISOString().split("T")[0] : ""
  );
  const [remarks, setRemarks] = useState(entry.remarks ?? "");
  const [budgetWanted, setBudgetWanted] = useState(
    entry.budget_wanted?.toString() ?? ""
  );

  // slots keyed by PRE_REQUIREMENTS key
  const [slots, setSlots] = useState<Record<string, SlotState>>(() =>
    Object.fromEntries(PRE_REQUIREMENTS.map((r) => [r.key, { status: "empty" }]))
  );

  const [loadingFiles, setLoadingFiles] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ── load existing Drive files ─────────────────────────────────────────────

  useEffect(() => {
    async function loadFiles() {
      if (!entry.folder_url) { setLoadingFiles(false); return; }
      const folderId = extractFolderId(entry.folder_url);
      if (!folderId) { setLoadingFiles(false); return; }

      try {
        const res = await fetch(`/api/drive/list?folderId=${folderId}`);
        if (!res.ok) throw new Error("Failed to list files");
        const { files } = await res.json() as {
          files: { id: string; name: string }[]
        };

        // Match Drive files back to PRE_REQUIREMENTS slots by label prefix
        setSlots((prev) => {
          const next = { ...prev };
          for (const req of PRE_REQUIREMENTS) {
            const label = FILE_LABELS[req.key];
            const match = files.find((f) =>
              f.name.toLowerCase().startsWith(label.toLowerCase())
            );
            if (match) {
              next[req.key] = {
                status: "existing",
                driveFileId: match.id,
                driveName: match.name,
              };
            }
          }
          return next;
        });
      } catch {
        setFilesError("Could not load existing files from Drive.");
      } finally {
        setLoadingFiles(false);
      }
    }
    loadFiles();
  }, [entry.folder_url]);

  // ── derived ───────────────────────────────────────────────────────────────

  const activeReqs = PRE_REQUIREMENTS.filter((r) => r.for.includes(type));

  function getSlot(key: string): SlotState {
    return slots[key] ?? { status: "empty" };
  }

  function isSlotFilled(slot: SlotState) {
    return slot.status === "existing" || slot.status === "replaced" || slot.status === "new";
  }

  const requiredKeys = activeReqs.filter((r) => r.required).map((r) => r.key);
  const missingRequired = requiredKeys.filter((k) => !isSlotFilled(getSlot(k)));

  const budgetAllocation = entry.budget_allocation ?? null;
  const budgetWantedNum = parseFloat(budgetWanted);
  const budgetExceeded =
    budgetAllocation !== null && !isNaN(budgetWantedNum) && budgetWantedNum >= budgetAllocation;
  const budgetValid =
    budgetAllocation === null ||
    (budgetWanted !== "" && !isNaN(budgetWantedNum) && !budgetExceeded);

  const allRequiredOk = missingRequired.length === 0 && budgetValid && budgetWanted !== "";

  // ── file handlers ─────────────────────────────────────────────────────────

  function handleFileChange(key: string, file: File | null) {
    if (!file) return;
    setSlots((prev) => {
      const cur = prev[key];
      if (cur.status === "existing") {
        return { ...prev, [key]: { status: "replaced", driveFileId: cur.driveFileId, driveName: cur.driveName, newFile: file } };
      }
      return { ...prev, [key]: { status: "new", newFile: file } };
    });
  }

  function handleRemove(key: string) {
    setSlots((prev) => {
      const cur = prev[key];
      if (cur.status === "existing") {
        return { ...prev, [key]: { status: "removed", driveFileId: cur.driveFileId } };
      }
      if (cur.status === "replaced") {
        return { ...prev, [key]: { status: "removed", driveFileId: cur.driveFileId } };
      }
      // new or empty — just clear
      return { ...prev, [key]: { status: "empty" } };
    });
  }

  function handleRestoreRemoved(key: string) {
    // can't restore without re-uploading — just clear to empty
    setSlots((prev) => ({ ...prev, [key]: { status: "empty" } }));
  }

  // ── submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!allRequiredOk) { setError("Please fill all required fields and documents."); return; }
    if (!trainingStart || !trainingEnd) { setError("Please set both training dates."); return; }

    setLoading(true);
    setError(null);

    try {
      const folderId = entry.folder_url ? extractFolderId(entry.folder_url) : null;

      // 1. Get access token (reuse init route with existing folder — just need the token)
      let accessToken: string | null = null;
      if (folderId) {
        setUploadStatus("Authenticating with Drive…");
        const initRes = await fetch("/api/drive/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Pass existing folder as parent so no new folder is created,
          // but we still get a fresh access token back
          body: JSON.stringify({
            parentFolderId: folderId,
            subfolderName: "__token_only__",
          }),
        });
        // We only need the accessToken, discard the new folder
        // Actually: create a dedicated token endpoint instead
        // For now call init and immediately delete the dummy folder
        if (initRes.ok) {
          const data = await initRes.json();
          accessToken = data.accessToken;
          // delete the dummy folder silently
          if (data.folderId) {
            await fetch("/api/drive/delete", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileId: data.folderId }),
            });
          }
        }
      }

      // 2. Delete removed files from Drive
      const removedSlots = Object.entries(slots).filter(([, s]) => s.status === "removed");
      for (const [, slot] of removedSlots) {
        if (slot.status !== "removed") continue;
        setUploadStatus("Removing deleted files…");
        await fetch("/api/drive/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: slot.driveFileId }),
        });
      }

      // 3. Upload new / replaced files to the EXISTING folder
      if (accessToken && folderId) {
        const toUpload = Object.entries(slots).filter(
          ([, s]) => s.status === "new" || s.status === "replaced"
        );

        for (let i = 0; i < toUpload.length; i++) {
          const [key, slot] = toUpload[i];
          if (slot.status !== "new" && slot.status !== "replaced") continue;
          const file = slot.newFile;
          const label = FILE_LABELS[key] ?? key;
          const ext = file.name.split(".").pop() ?? "bin";
          const name = `${label}.${ext}`;

          setUploadStatus(`Uploading ${i + 1}/${toUpload.length}: ${name}…`);

          // If replacing, delete the old one first
          if (slot.status === "replaced") {
            await fetch("/api/drive/delete", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileId: slot.driveFileId }),
            });
          }

          const metadata = JSON.stringify({ name, parents: [folderId] });
          const form = new FormData();
          form.append("metadata", new Blob([metadata], { type: "application/json" }));
          form.append("file", file);

          const uploadRes = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
              body: form,
            }
          );
          if (!uploadRes.ok) throw new Error(`Failed to upload ${name}`);
        }
      }

      // 4. Update DB record
      setUploadStatus("Saving changes…");
      await updateTrainingRequest({
        requestId: entry.id,
        type,
        trainingStart,
        trainingEnd,
        remarks,
        budgetWanted: budgetWanted ? parseFloat(budgetWanted) : null,
      });

      setSubmitted(true);
      router.push("/user");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setUploadStatus("");
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

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
          Edit Training Request
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Update your request details and documents. Only files you replace or remove will be changed in Drive.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT — PPMP summary (identical to NewRequestClient) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{ border: "1px solid #e8f5e9", borderRadius: 3, p: 3, position: "sticky", top: 24 }}
          >
            <Typography
              variant="caption"
              sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", px: 1.2, py: 0.4, borderRadius: 1, fontWeight: 700, letterSpacing: 0.5 }}
            >
              {entry.aip_code}
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#1a1a1a" sx={{ mt: 1.5, mb: 2 }}>
              {entry.ppa}
            </Typography>
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              {entry.department_name && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BusinessOutlined sx={{ fontSize: 15, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary">{entry.department_name}</Typography>
                </Box>
              )}
              {entry.school_year_name && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SchoolOutlined sx={{ fontSize: 15, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary">SY {entry.school_year_name}</Typography>
                </Box>
              )}
              {entry.target_implementation && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarMonthOutlined sx={{ fontSize: 15, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary">{entry.target_implementation}</Typography>
                </Box>
              )}
              {entry.ppa_owner && (
                <Typography variant="body2" color="text.secondary">Owner: {entry.ppa_owner}</Typography>
              )}
              {entry.pillar && (
                <Chip
                  label={entry.pillar} size="small" variant="outlined"
                  sx={{ alignSelf: "flex-start", borderColor: "#c8e6c9", color: "#2e7d32", fontSize: 11 }}
                />
              )}
            </Box>
            {entry.intended_outcome && (
              <Box sx={{ mt: 2.5 }}>
                <SectionLabel label="INTENDED OUTCOME" />
                <Typography variant="body2" color="text.secondary">{entry.intended_outcome}</Typography>
              </Box>
            )}
            {entry.planned_outputs && (
              <Box sx={{ mt: 2 }}>
                <SectionLabel label="PLANNED OUTPUTS" />
                <Typography variant="body2" color="text.secondary">{entry.planned_outputs}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* RIGHT — form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ border: "1px solid #e8f5e9", borderRadius: 3, p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Type */}
            <SectionLabel label="TRAINING TYPE" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <ToggleButtonGroup
              value={type} exclusive
              onChange={(_, val) => { if (val) setType(val); }}
              sx={{ mb: 3 }}
            >
              {["external", "in-house"].map((v) => (
                <ToggleButton key={v} value={v}
                  sx={{
                    textTransform: "none", fontWeight: 600, px: 3,
                    "&.Mui-selected": { bgcolor: "#e8f5e9", color: "#2e7d32", borderColor: "#2e7d32" },
                  }}
                >
                  {v === "external" ? "External (E)" : "In-house (I)"}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {/* Schedule */}
            <SectionLabel label="TRAINING SCHEDULE" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Training Start Date" type="date" variant="standard" fullWidth
                  value={trainingStart} onChange={(e) => setTrainingStart(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Training End Date" type="date" variant="standard" fullWidth
                  value={trainingEnd} onChange={(e) => setTrainingEnd(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>

            {/* Remarks */}
            <SectionLabel label="REMARKS" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            <TextField
              label="Remarks / Notes" variant="standard" fullWidth multiline minRows={2}
              value={remarks} onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional — add any notes or special instructions"
              sx={{ mb: 3 }}
            />

            {/* Budget */}
            <SectionLabel label="BUDGET REQUESTED *" />
            <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
            {budgetAllocation !== null && (
              <Box sx={{
                mb: 2, p: 1.5, bgcolor: "#f1f8e9", borderRadius: 2,
                border: "1px solid #c8e6c9", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <Typography variant="body2" color="text.secondary">Allocated Budget (PPMP)</Typography>
                <Typography variant="body2" fontWeight={700} color="#2e7d32">
                  ₱{Number(budgetAllocation).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            )}
            <TextField
              label="Budget Requested (₱)" type="number" variant="standard" fullWidth
              value={budgetWanted} onChange={(e) => setBudgetWanted(e.target.value)}
              error={budgetExceeded}
              helperText={
                budgetExceeded
                  ? `Must be less than the allocated budget of ₱${Number(budgetAllocation).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                  : budgetAllocation !== null && budgetValid && budgetWanted !== ""
                  ? "✓ Within allocated budget"
                  : "Required — enter the budget amount for this training request"
              }
              slotProps={{
                htmlInput: { min: 0, step: "0.01" },
                formHelperText: {
                  sx: {
                    color: budgetExceeded ? "error.main"
                      : budgetValid && budgetWanted !== "" ? "#2e7d32"
                      : "text.secondary",
                  },
                },
              }}
              sx={{ mb: 3 }}
            />

            {/* Pre-requirements */}
            <SectionLabel label="PRE-REQUISITE DOCUMENTS" />
            <Divider sx={{ mb: 1, borderColor: "#e8f5e9" }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              Existing files are loaded from your original submission. You can replace or remove them individually.
            </Typography>

            {loadingFiles ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
                <CircularProgress size={20} sx={{ color: "#2e7d32" }} />
                <Typography variant="body2" color="text.secondary">Loading existing files…</Typography>
              </Box>
            ) : (
              <>
                {filesError && (
                  <Alert severity="warning" sx={{ mb: 2 }}>{filesError}</Alert>
                )}
                <List disablePadding>
                  {activeReqs.map((req) => {
                    const slot = getSlot(req.key);
                    const filled = isSlotFilled(slot);
                    const isRemoved = slot.status === "removed";

                    return (
                      <ListItem
                        key={req.key}
                        disablePadding
                        sx={{
                          mb: 1.5,
                          border: "1px solid",
                          borderColor: isRemoved ? "#ffcdd2"
                            : filled ? "#c8e6c9"
                            : req.required ? "#ffccbc" : "#e0e0e0",
                          borderRadius: 2,
                          p: 1.5,
                          bgcolor: isRemoved ? "#fff8f8"
                            : filled ? "#f1f8e9" : "white",
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {isRemoved ? (
                            <DeleteOutlined sx={{ color: "#e53935", fontSize: 20 }} />
                          ) : slot.status === "existing" ? (
                            <CloudDoneOutlined sx={{ color: "#2e7d32", fontSize: 20 }} />
                          ) : filled ? (
                            <CheckCircleOutlined sx={{ color: "#2e7d32", fontSize: 20 }} />
                          ) : (
                            <AttachFileOutlined sx={{ color: req.required ? "#e64a19" : "text.disabled", fontSize: 20 }} />
                          )}
                        </ListItemIcon>

                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {req.label}
                              </Typography>
                              {req.required && !filled && !isRemoved && (
                                <Chip label="Required" size="small"
                                  sx={{ fontSize: 10, height: 18, bgcolor: "#ffccbc", color: "#bf360c" }}
                                />
                              )}
                              {slot.status === "existing" && (
                                <Chip label="On Drive" size="small"
                                  sx={{ fontSize: 10, height: 18, bgcolor: "#e8f5e9", color: "#2e7d32" }}
                                />
                              )}
                              {slot.status === "replaced" && (
                                <Chip label="Replacing" size="small"
                                  sx={{ fontSize: 10, height: 18, bgcolor: "#fff3e0", color: "#e65100" }}
                                />
                              )}
                              {isRemoved && (
                                <Chip label="Will be removed" size="small"
                                  sx={{ fontSize: 10, height: 18, bgcolor: "#ffcdd2", color: "#b71c1c" }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            isRemoved ? (
                              <Typography variant="caption" color="error.main">
                                Marked for removal —{" "}
                                <Box
                                  component="span"
                                  sx={{ cursor: "pointer", textDecoration: "underline" }}
                                  onClick={() => handleRestoreRemoved(req.key)}
                                >
                                  undo
                                </Box>
                              </Typography>
                            ) : slot.status === "existing" ? (
                              <Typography variant="caption" color="#2e7d32">{slot.driveName}</Typography>
                            ) : slot.status === "replaced" ? (
                              <Typography variant="caption" color="#e65100">{slot.newFile.name}</Typography>
                            ) : slot.status === "new" ? (
                              <Typography variant="caption" color="#2e7d32">{slot.newFile.name}</Typography>
                            ) : (
                              <Typography variant="caption" color="text.disabled">No file uploaded</Typography>
                            )
                          }
                        />

                        {!isRemoved && (
                          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                            {filled && (
                              <IconButton size="small" onClick={() => handleRemove(req.key)}
                                sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                              >
                                <DeleteOutlined fontSize="small" />
                              </IconButton>
                            )}
                            <Button
                              component="label" size="small"
                              variant={filled ? "outlined" : "contained"}
                              startIcon={<UploadFileOutlined />}
                              sx={{
                                textTransform: "none", fontSize: 12, borderRadius: 2,
                                bgcolor: filled ? undefined : "#2e7d32",
                                borderColor: filled ? "#c8e6c9" : undefined,
                                color: filled ? "#2e7d32" : "white",
                                "&:hover": { bgcolor: filled ? "#f1f8e9" : "#1b5e20" },
                              }}
                            >
                              {filled ? "Replace" : "Upload"}
                              <input
                                type="file" hidden
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange(req.key, e.target.files?.[0] ?? null)}
                              />
                            </Button>
                          </Box>
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              </>
            )}

            {/* Summary */}
            <Box sx={{
              mt: 2, p: 2,
              bgcolor: allRequiredOk ? "#f1f8e9" : "#fff3e0",
              borderRadius: 2, border: "1px solid",
              borderColor: allRequiredOk ? "#c8e6c9" : "#ffe0b2",
            }}>
              <Typography variant="body2" fontWeight={600} color={allRequiredOk ? "#2e7d32" : "#e65100"}>
                {allRequiredOk
                  ? `✓ All required documents present`
                  : missingRequired.length > 0
                  ? `${missingRequired.length} required document${missingRequired.length !== 1 ? "s" : ""} still missing`
                  : "Budget requested is required before saving"}
              </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
              <Button onClick={() => router.back()} sx={{ textTransform: "none" }} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="contained" onClick={handleSubmit}
                disabled={loading || !allRequiredOk || submitted}
                sx={{
                  textTransform: "none", bgcolor: "#2e7d32",
                  "&:hover": { bgcolor: "#1b5e20" }, px: 4, minWidth: 180,
                }}
              >
                {loading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={14} color="inherit" />
                    <Typography variant="caption" color="inherit" noWrap>
                      {uploadStatus || "Processing…"}
                    </Typography>
                  </Box>
                ) : submitted ? "Saved" : "Save Changes"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}