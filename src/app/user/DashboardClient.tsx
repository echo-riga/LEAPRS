// src/app/(protected)/user/DashboardClient.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  Divider,
  Paper,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  AddOutlined,
  BusinessOutlined,
  ArticleOutlined,
  CheckCircleOutlined,
  PendingActionsOutlined,
  InboxOutlined,
  CalendarMonthOutlined,
  SearchOutlined,
  VisibilityOutlined,
  ArrowForwardOutlined,
  CancelOutlined,
  FolderOutlined,
  CloseOutlined,
  WarningAmberOutlined,
  UploadFileOutlined,
  AttachFileOutlined,
  DeleteOutlined,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { fetchMyRequestTrack, submitPostCompletionDocs } from "./action";

// ── types ─────────────────────────────────────────────────────────────────────

export type PpmpSummary = {
  id: string;
  aip_code: string;
  ppa: string;
  department: string | null;
  department_id: string | null;
  school_year_name: string | null;
  school_year_id: string | null;
  pillar: string | null;
  intended_outcome: string | null;
  planned_outputs: string | null;
  ppa_owner: string | null;
  target_implementation: string | null;
  has_active_request: boolean;
};

export type TrainingRequest = {
  id: string;
  aip_code: string;
  ppa: string;
  type: "external" | "in-house";
  status: string;
  submitted_at: string;
  remarks: string | null;
};

type TrackEntry = {
  id: string;
  office: string | null;
  status: string;
  file_url: string | null;
  remarks: string | null;
  actioned_at: string;
};

type Props = {
  user: { name: string; email: string; department: string | null };
  ppmpEntries: PpmpSummary[];
  myRequests: TrainingRequest[];
  departments: { id: string; name: string }[];
  schoolYears: { id: string; name: string }[];
};

// ── constants ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; color: "warning" | "success" | "error" | "info" | "default" }
> = {
  submitted: { label: "Submitted", color: "info" },
  waiting_approval: { label: "Waiting Approval", color: "warning" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "error" },
  training_ongoing: { label: "Training Ongoing", color: "info" },
  pending_completion_docs: { label: "Pending Docs", color: "warning" },
  pending_completion_approval: {
    label: "Pending Final Approval",
    color: "warning",
  },
  completed: { label: "Completed", color: "success" },
};

const TRACK_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  submitted: { label: "Submitted", color: "#1565c0", bg: "#e3f2fd" },
  waiting_approval: {
    label: "Waiting Approval",
    color: "#e65100",
    bg: "#fff3e0",
  },
  approved: { label: "Approved", color: "#2e7d32", bg: "#e8f5e9" },
  rejected: { label: "Rejected", color: "#b71c1c", bg: "#ffebee" },
  training_ongoing: {
    label: "Training Ongoing",
    color: "#6a1b9a",
    bg: "#f3e5f5",
  },
  pending_completion_docs: {
    label: "Pending Docs",
    color: "#f9a825",
    bg: "#fffde7",
  },
  pending_completion_approval: {
    label: "Pending Final Approval",
    color: "#f57f17",
    bg: "#fff8e1",
  },
  completed: { label: "Completed", color: "#1b5e20", bg: "#f1f8e9" },
};

type PostCompletionDoc = {
  key: string;
  label: string;
  required: boolean;
  inhouseOnly?: boolean;
};

const POST_COMPLETION_DOCS: PostCompletionDoc[] = [
  { key: "attendance", label: "Attendance", required: true },
  { key: "closeout_report", label: "Close-out Report", required: true },
  { key: "photos", label: "Photos (including food)", required: true },
  {
    key: "training_evaluation",
    label: "Training Evaluation (computerized for in-house)",
    required: true,
  },
  { key: "par", label: "PAR", required: true },
  {
    key: "initial_docs",
    label: "Initial Documents (Activity Design w/ complete sign-up)",
    required: true,
  },
  {
    key: "honorarium_docs",
    label: "Speaker Honorarium & Other Finance Documents",
    required: false,
    inhouseOnly: true,
  },
  { key: "certificate", label: "Certificate of Attendance", required: true },
  { key: "obr", label: "OBR (Obligation Request)", required: true },
  {
    key: "cash_advance_letter",
    label: "Approved Cash Advance Letter (if applicable)",
    required: false,
  },
];

// ── post-completion upload dialog ─────────────────────────────────────────────

function PostCompletionDialog({
  request,
  onClose,
  onSubmitted,
}: {
  request: TrainingRequest | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [tracks, setTracks] = useState<TrackEntry[]>([]);
  const [uploads, setUploads] = useState<{ key: string; file: File }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTrack, setFetchingTrack] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!request) return;
    setFetchingTrack(true);
    fetchMyRequestTrack(request.id)
      .then(setTracks)
      .finally(() => setFetchingTrack(false));
  }, [request?.id]);

  if (!request) return null;

  const activeDocs = POST_COMPLETION_DOCS.filter(
    (d) => !d.inhouseOnly || request.type === "in-house",
  );
  const requiredKeys = activeDocs.filter((d) => d.required).map((d) => d.key);
  const uploadedKeys = uploads.map((u) => u.key);
  const missingRequired = requiredKeys.filter((k) => !uploadedKeys.includes(k));
  const allRequiredDone = missingRequired.length === 0;
  const parentFolderUrl = tracks[0]?.file_url ?? null;

  function getUpload(key: string) {
    return uploads.find((u) => u.key === key) ?? null;
  }

  function handleFile(key: string, file: File | null) {
    if (!file) return;
    setUploads((prev) => [...prev.filter((u) => u.key !== key), { key, file }]);
  }

  function removeFile(key: string) {
    setUploads((prev) => prev.filter((u) => u.key !== key));
  }

  function extractFolderId(url: string) {
    return url.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1] ?? null;
  }

  function reset() {
    setUploads([]);
    setError(null);
    setUploadMsg("");
    setDone(false);
  }

  async function handleSubmit() {
    if (!request) return; // ← add this line
    setError(null);
    if (!allRequiredDone) {
      setError("Please upload all required documents.");
      return;
    }
    if (!parentFolderUrl) {
      setError("Could not find the original request folder. Contact admin.");
      return;
    }

    const parentFolderId = extractFolderId(parentFolderUrl);
    if (!parentFolderId) {
      setError("Invalid parent folder URL.");
      return;
    }

    setLoading(true);
    try {
      // 1. create "Post Completion Docs" subfolder
      setUploadMsg("Creating Post Completion Docs folder…");
      const initRes = await fetch("/api/drive/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentFolderId,
          subfolderName: "Post Completion Docs",
        }),
      });
      if (!initRes.ok) throw new Error("Failed to create subfolder.");
      const { folderId, accessToken } = await initRes.json();

      // 2. upload each file directly to GDrive
      for (let i = 0; i < uploads.length; i++) {
        const { key, file } = uploads[i];
        const doc = activeDocs.find((d) => d.key === key);
        const ext = file.name.split(".").pop() ?? "bin";
        const name = `${doc?.label ?? key}.${ext}`;

        setUploadMsg(`Uploading ${i + 1} of ${uploads.length}: ${name}…`);
        const metadata = JSON.stringify({ name, parents: [folderId] });
        const form = new FormData();
        form.append(
          "metadata",
          new Blob([metadata], { type: "application/json" }),
        );
        form.append("file", file);

        const res = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form,
          },
        );
        if (!res.ok) throw new Error(`Failed to upload ${name}.`);
      }

      // 3. update status → pending_completion_approval
      setUploadMsg("Finalising submission…");
      const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
      await submitPostCompletionDocs({ requestId: request.id, folderUrl });

      setDone(true);
      onSubmitted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setUploadMsg("");
    }
  }

  return (
    <Dialog
      open={!!request}
      onClose={done ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                bgcolor: "#fff3e0",
                color: "#e65100",
                px: 1.2,
                py: 0.4,
                borderRadius: 1,
                fontWeight: 700,
              }}
            >
              {request.aip_code}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
              Post-Completion Documents
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {request.ppa}
            </Typography>
          </Box>
          <IconButton
            size="small"
            disabled={loading}
            onClick={() => {
              reset();
              onClose();
            }}
          >
            <CloseOutlined />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {done ? (
          /* ── success state ── */
          <Box
            sx={{
              py: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CheckCircleOutlined sx={{ color: "#2e7d32", fontSize: 56 }} />
            <Typography variant="h6" fontWeight={700} color="#2e7d32">
              Documents Submitted!
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Your post-completion documents have been uploaded successfully.
              <br />
              The request is now pending final approval.
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                reset();
                onClose();
              }}
              sx={{
                bgcolor: "#2e7d32",
                "&:hover": { bgcolor: "#1b5e20" },
                textTransform: "none",
                borderRadius: 2,
                mt: 1,
              }}
            >
              Done
            </Button>
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {fetchingTrack ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} sx={{ color: "#2e7d32" }} />
              </Box>
            ) : (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 2 }}
                >
                  Upload all required documents. They will be saved to a{" "}
                  <strong>Post Completion Docs</strong> subfolder in your
                  request&apos;s Google Drive folder.
                </Typography>

                <List disablePadding sx={{ mb: 2 }}>
                  {activeDocs.map((doc) => {
                    const up = getUpload(doc.key);
                    return (
                      <ListItem
                        key={doc.key}
                        disablePadding
                        sx={{
                          mb: 1,
                          border: "1px solid",
                          borderColor: up
                            ? "#c8e6c9"
                            : doc.required
                              ? "#ffccbc"
                              : "#e0e0e0",
                          borderRadius: 2,
                          p: 1.5,
                          bgcolor: up ? "#f1f8e9" : "white",
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          {up ? (
                            <CheckCircleOutlined
                              sx={{ fontSize: 18, color: "#2e7d32" }}
                            />
                          ) : (
                            <AttachFileOutlined
                              sx={{
                                fontSize: 18,
                                color: doc.required ? "#e64a19" : "#bdbdbd",
                              }}
                            />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.8,
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ fontSize: 12 }}
                              >
                                {doc.label}
                              </Typography>
                              {doc.required && !up && (
                                <Chip
                                  label="Required"
                                  size="small"
                                  sx={{
                                    fontSize: 9,
                                    height: 16,
                                    bgcolor: "#ffccbc",
                                    color: "#bf360c",
                                  }}
                                />
                              )}
                              {!doc.required && (
                                <Chip
                                  label="Optional"
                                  size="small"
                                  sx={{
                                    fontSize: 9,
                                    height: 16,
                                    bgcolor: "#f5f5f5",
                                    color: "#757575",
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color={up ? "#2e7d32" : "text.disabled"}
                            >
                              {up ? up.file.name : "No file chosen"}
                            </Typography>
                          }
                        />
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            alignItems: "center",
                            ml: 1,
                          }}
                        >
                          {up && (
                            <IconButton
                              size="small"
                              onClick={() => removeFile(doc.key)}
                              sx={{
                                color: "#bdbdbd",
                                "&:hover": { color: "error.main" },
                              }}
                            >
                              <DeleteOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                          <Button
                            component="label"
                            size="small"
                            variant={up ? "outlined" : "contained"}
                            startIcon={
                              <UploadFileOutlined sx={{ fontSize: 14 }} />
                            }
                            sx={{
                              textTransform: "none",
                              fontSize: 11,
                              borderRadius: 2,
                              py: 0.4,
                              bgcolor: up ? undefined : "#2e7d32",
                              borderColor: up ? "#c8e6c9" : undefined,
                              color: up ? "#2e7d32" : "white",
                              "&:hover": {
                                bgcolor: up ? "#f1f8e9" : "#1b5e20",
                              },
                            }}
                          >
                            {up ? "Replace" : "Upload"}
                            <input
                              type="file"
                              hidden
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                              onChange={(e) =>
                                handleFile(doc.key, e.target.files?.[0] ?? null)
                              }
                            />
                          </Button>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>

                {/* progress summary */}
                <Box
                  sx={{
                    p: 1.5,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: allRequiredDone ? "#f1f8e9" : "#fff3e0",
                    border: "1px solid",
                    borderColor: allRequiredDone ? "#c8e6c9" : "#ffe0b2",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={allRequiredDone ? "#2e7d32" : "#e65100"}
                  >
                    {allRequiredDone
                      ? `✓ All required documents ready (${uploads.length} file${uploads.length !== 1 ? "s" : ""} total)`
                      : `${missingRequired.length} required document${missingRequired.length !== 1 ? "s" : ""} still missing`}
                  </Typography>
                </Box>

                <Box
                  sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}
                >
                  <Button
                    onClick={() => {
                      reset();
                      onClose();
                    }}
                    sx={{ textTransform: "none" }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !allRequiredDone}
                    sx={{
                      textTransform: "none",
                      bgcolor: "#2e7d32",
                      "&:hover": { bgcolor: "#1b5e20" },
                      minWidth: 160,
                    }}
                  >
                    {loading ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CircularProgress size={14} color="inherit" />
                        <Typography variant="caption" color="inherit" noWrap>
                          {uploadMsg || "Working…"}
                        </Typography>
                      </Box>
                    ) : (
                      "Submit Documents"
                    )}
                  </Button>
                </Box>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── ppmp card ─────────────────────────────────────────────────────────────────

function PpmpCard({
  entry,
  onView,
  onRequest,
}: {
  entry: PpmpSummary;
  onView: () => void;
  onRequest: () => void;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e8f5e9",
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(46,125,50,0.1)" },
      }}
    >
      <CardContent sx={{ flex: 1, p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.5,
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
          {entry.school_year_name && (
            <Chip
              label={`SY ${entry.school_year_name}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: 11, borderColor: "#c8e6c9", color: "#2e7d32" }}
            />
          )}
        </Box>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          color="#1a1a1a"
          sx={{
            mb: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {entry.ppa}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {entry.department && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BusinessOutlined sx={{ fontSize: 14, color: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {entry.department}
              </Typography>
            </Box>
          )}
          {entry.pillar && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ArticleOutlined sx={{ fontSize: 14, color: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {entry.pillar}
              </Typography>
            </Box>
          )}
          {entry.target_implementation && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonthOutlined
                sx={{ fontSize: 14, color: "text.disabled" }}
              />
              <Typography variant="caption" color="text.secondary">
                {entry.target_implementation}
              </Typography>
            </Box>
          )}
          {entry.intended_outcome && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                mt: 0.5,
              }}
            >
              {entry.intended_outcome}
            </Typography>
          )}
        </Box>
      </CardContent>
      <Divider sx={{ borderColor: "#f0f0f0" }} />
      <CardActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityOutlined />}
          onClick={onView}
          sx={{
            textTransform: "none",
            borderColor: "#c8e6c9",
            color: "#2e7d32",
            borderRadius: 2,
            fontSize: 12,
          }}
        >
          View Details
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={entry.has_active_request}
          onClick={onRequest}
          sx={{
            textTransform: "none",
            fontSize: 12,
            borderRadius: 2,
            bgcolor: entry.has_active_request ? undefined : "#2e7d32",
            "&:hover": { bgcolor: "#1b5e20" },
            color: "white",
          }}
        >
          {entry.has_active_request ? "Requested" : "Request This"}
        </Button>
      </CardActions>
    </Card>
  );
}

// ── request row ───────────────────────────────────────────────────────────────

function RequestRow({
  req,
  onClick,
}: {
  req: TrainingRequest;
  onClick: () => void;
}) {
  const meta = STATUS_META[req.status] ?? {
    label: req.status,
    color: "default",
  };
  const needsDocs = req.status === "pending_completion_docs";
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1.5,
        px: 2,
        borderRadius: 2,
        cursor: "pointer",
        transition: "background 0.15s",
        bgcolor: needsDocs ? "#fffde7" : "white",
        borderLeft: `3px solid ${needsDocs ? "#f9a825" : "transparent"}`,
        "&:hover": { bgcolor: needsDocs ? "#fff9c4" : "#f9fbe7" },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          flexShrink: 0,
          bgcolor: needsDocs ? "#fff3e0" : "#e8f5e9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: needsDocs ? "#e65100" : "#2e7d32",
        }}
      >
        {needsDocs ? (
          <WarningAmberOutlined fontSize="small" />
        ) : (
          <ArticleOutlined fontSize="small" />
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {req.ppa}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {req.aip_code} · {req.type} ·{" "}
          {new Date(req.submitted_at).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Typography>
        {needsDocs && (
          <Typography
            variant="caption"
            fontWeight={700}
            color="#e65100"
            display="block"
          >
            ⚠ Action required — submit post-completion documents
          </Typography>
        )}
      </Box>
      <Chip
        label={meta.label}
        color={meta.color}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 600, fontSize: 11, flexShrink: 0 }}
      />
    </Box>
  );
}

// ── ppmp detail dialog ────────────────────────────────────────────────────────

function PpmpDetailDialog({
  entry,
  onClose,
  onRequest,
  alreadyRequested,
}: {
  entry: PpmpSummary | null;
  onClose: () => void;
  onRequest: () => void;
  alreadyRequested: boolean;
}) {
  if (!entry) return null;
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        bgcolor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
      onClick={onClose}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 600,
          width: "100%",
          borderRadius: 3,
          p: 3,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
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
            }}
          >
            {entry.aip_code}
          </Typography>
          <Button
            size="small"
            onClick={onClose}
            sx={{ textTransform: "none", color: "text.secondary", minWidth: 0 }}
          >
            ✕
          </Button>
        </Box>
        <Typography
          variant="h6"
          fontWeight={700}
          color="#1a1a1a"
          sx={{ mb: 2 }}
        >
          {entry.ppa}
        </Typography>
        <Divider sx={{ mb: 2, borderColor: "#e8f5e9" }} />
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2.5 }}
        >
          {entry.department && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <BusinessOutlined sx={{ fontSize: 16, color: "text.disabled" }} />
              <Typography variant="body2" color="text.secondary">
                {entry.department}
              </Typography>
            </Box>
          )}
          {entry.school_year_name && (
            <Typography variant="body2" color="text.secondary">
              SY {entry.school_year_name}
            </Typography>
          )}
          {entry.target_implementation && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <CalendarMonthOutlined
                sx={{ fontSize: 16, color: "text.disabled" }}
              />
              <Typography variant="body2" color="text.secondary">
                {entry.target_implementation}
              </Typography>
            </Box>
          )}
          {entry.ppa_owner && (
            <Typography variant="body2" color="text.secondary">
              PPA Owner: {entry.ppa_owner}
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
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              color="text.disabled"
              fontWeight={600}
              sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}
            >
              Intended Outcome
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {entry.intended_outcome}
            </Typography>
          </Box>
        )}
        {entry.planned_outputs && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              color="text.disabled"
              fontWeight={600}
              sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}
            >
              Planned Outputs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {entry.planned_outputs}
            </Typography>
          </Box>
        )}
        <Divider sx={{ my: 2, borderColor: "#e8f5e9" }} />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Close
          </Button>
          {alreadyRequested ? (
            <Chip
              label="Already Requested ✓"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Button
              variant="contained"
              onClick={onRequest}
              sx={{
                bgcolor: "#2e7d32",
                "&:hover": { bgcolor: "#1b5e20" },
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              Request This
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

// ── track box ─────────────────────────────────────────────────────────────────

function TrackBox({ track, index }: { track: TrackEntry; index: number }) {
  const meta = TRACK_STATUS_META[track.status] ?? {
    label: track.status,
    color: "#555",
    bg: "#f5f5f5",
  };
  return (
    <Box
      sx={{
        border: `2px solid ${meta.color}40`,
        borderRadius: 3,
        p: 2,
        bgcolor: meta.bg,
        minWidth: 180,
        maxWidth: 220,
        flexShrink: 0,
        position: "relative",
      }}
    >
      {track.office && (
        <Typography
          variant="caption"
          color="text.disabled"
          fontWeight={600}
          sx={{
            textTransform: "uppercase",
            letterSpacing: 0.8,
            display: "block",
            mb: 0.5,
          }}
        >
          {track.office}
        </Typography>
      )}
      <Chip
        label={meta.label}
        size="small"
        sx={{
          bgcolor: meta.color,
          color: "white",
          fontWeight: 700,
          fontSize: 11,
          mb: 1.5,
        }}
      />
      {track.file_url && (
        <Box
          component="a"
          href={track.file_url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: meta.color,
            fontSize: 12,
            textDecoration: "none",
            mb: 1,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          <FolderOutlined sx={{ fontSize: 14 }} />
          View Files
        </Box>
      )}
      {track.remarks && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", fontStyle: "italic" }}
        >
          {track.remarks}
        </Typography>
      )}
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: "block", mt: 1 }}
      >
        {new Date(track.actioned_at).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </Typography>
    </Box>
  );
}

// ── request timeline dialog ───────────────────────────────────────────────────

function RequestTimelineDialog({
  request,
  onClose,
  onUploadDocs,
}: {
  request: TrainingRequest | null;
  onClose: () => void;
  onUploadDocs: (req: TrainingRequest) => void;
}) {
  const [tracks, setTracks] = useState<TrackEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!request) return;
    setLoading(true);
    fetchMyRequestTrack(request.id)
      .then(setTracks)
      .finally(() => setLoading(false));
  }, [request?.id]);

  if (!request) return null;

  const lastStatus = tracks[tracks.length - 1]?.status;
  const isFinal = lastStatus === "completed" || lastStatus === "rejected";
  const needsDocs = lastStatus === "pending_completion_docs";

  return (
    <Dialog
      open={!!request}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                bgcolor: "#e8f5e9",
                color: "#2e7d32",
                px: 1.2,
                py: 0.4,
                borderRadius: 1,
                fontWeight: 700,
              }}
            >
              {request.aip_code}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
              {request.ppa}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
              <Chip
                label={request.type === "external" ? "External" : "In-house"}
                size="small"
                sx={{
                  fontSize: 11,
                  bgcolor: request.type === "external" ? "#e3f2fd" : "#f3e5f5",
                  color: request.type === "external" ? "#1565c0" : "#6a1b9a",
                }}
              />
              {(() => {
                const meta = STATUS_META[request.status];
                return (
                  <Chip
                    label={meta?.label ?? request.status}
                    color={meta?.color ?? "default"}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: 11 }}
                  />
                );
              })()}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseOutlined />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {needsDocs && (
          <Alert
            severity="warning"
            sx={{ mb: 2, borderRadius: 2 }}
            action={
              <Button
                size="small"
                variant="contained"
                onClick={() => onUploadDocs(request)}
                startIcon={<UploadFileOutlined sx={{ fontSize: 14 }} />}
                sx={{
                  textTransform: "none",
                  bgcolor: "#e65100",
                  "&:hover": { bgcolor: "#bf360c" },
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                Upload Now
              </Button>
            }
          >
            <Typography variant="body2" fontWeight={600}>
              Action Required
            </Typography>
            <Typography variant="caption">
              Your training has concluded. Please upload post-completion
              documents to proceed.
            </Typography>
          </Alert>
        )}

        <Typography
          variant="caption"
          color="text.disabled"
          fontWeight={600}
          sx={{
            textTransform: "uppercase",
            letterSpacing: 1,
            display: "block",
            mb: 2,
          }}
        >
          Request Timeline
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4 }}>
            <CircularProgress size={20} sx={{ color: "#2e7d32" }} />
            <Typography variant="body2" color="text.secondary">
              Loading timeline…
            </Typography>
          </Box>
        ) : tracks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No timeline entries yet.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto", pb: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                minWidth: "max-content",
              }}
            >
              {tracks.map((track, i) => (
                <Box
                  key={track.id}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <TrackBox track={track} index={i} />
                  {i < tracks.length - 1 && (
                    <ArrowForwardOutlined
                      sx={{ color: "#c8e6c9", fontSize: 28, flexShrink: 0 }}
                    />
                  )}
                </Box>
              ))}
              {isFinal && (
                <>
                  <ArrowForwardOutlined
                    sx={{ color: "#c8e6c9", fontSize: 28, flexShrink: 0 }}
                  />
                  <Box
                    sx={{
                      border: "2px solid #c8e6c9",
                      borderRadius: 3,
                      p: 2,
                      minWidth: 130,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      bgcolor:
                        lastStatus === "completed" ? "#f1f8e9" : "#ffebee",
                    }}
                  >
                    {lastStatus === "completed" ? (
                      <CheckCircleOutlined
                        sx={{ color: "#2e7d32", fontSize: 28 }}
                      />
                    ) : (
                      <CancelOutlined sx={{ color: "#b71c1c", fontSize: 28 }} />
                    )}
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color={lastStatus === "completed" ? "#2e7d32" : "#b71c1c"}
                    >
                      {lastStatus === "completed" ? "Completed" : "Rejected"}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export function DashboardClient({
  user,
  ppmpEntries,
  myRequests,
  departments,
  schoolYears,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterSY, setFilterSY] = useState("");
  const [ppmpPage, setPpmpPage] = useState(0);
  const [ppmpRows, setPpmpRows] = useState(6);
  const [reqSearch, setReqSearch] = useState("");
  const [reqPage, setReqPage] = useState(0);
  const [reqRows, setReqRows] = useState(8);

  const [viewEntry, setViewEntry] = useState<PpmpSummary | null>(null);
  const [viewRequest, setViewRequest] = useState<TrainingRequest | null>(null);
  const [uploadDocReq, setUploadDocReq] = useState<TrainingRequest | null>(
    null,
  );

  const requestedCodes = new Set(myRequests.map((r) => r.aip_code));
  const pendingCount = myRequests.filter((r) =>
    ["submitted", "waiting_approval"].includes(r.status),
  ).length;
  const approvedCount = myRequests.filter((r) =>
    ["approved", "completed"].includes(r.status),
  ).length;
  const pendingDocsList = myRequests.filter(
    (r) => r.status === "pending_completion_docs",
  );

  const filteredPpmp = ppmpEntries.filter((e) => {
    const matchSearch =
      !search ||
      e.aip_code.toLowerCase().includes(search.toLowerCase()) ||
      e.ppa.toLowerCase().includes(search.toLowerCase());
    return (
      matchSearch &&
      (!filterDept || e.department_id === filterDept) &&
      (!filterSY || e.school_year_id === filterSY)
    );
  });
  const paginatedPpmp = filteredPpmp.slice(
    ppmpPage * ppmpRows,
    ppmpPage * ppmpRows + ppmpRows,
  );

  const filteredReqs = myRequests.filter(
    (r) =>
      !reqSearch ||
      r.aip_code.toLowerCase().includes(reqSearch.toLowerCase()) ||
      r.ppa.toLowerCase().includes(reqSearch.toLowerCase()),
  );
  const paginatedReqs = filteredReqs.slice(
    reqPage * reqRows,
    reqPage * reqRows + reqRows,
  );

  function handleDocsSubmitted() {
    setUploadDocReq(null);
    setViewRequest(null);
    router.refresh();
  }

  return (
    <Box>
      {/* Greeting */}
      <Box sx={{ mb: pendingDocsList.length > 0 ? 2 : 4 }}>
        <Typography variant="h4" fontWeight={700} color="#1b5e20">
          {greeting}, {user.name.split(" ")[0]}!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {user.department
            ? `${user.department} · Browse available training programs below.`
            : "Browse available training programs and submit your requests."}
        </Typography>
      </Box>

      {/* ── Notification banners — pending completion docs ── */}
      {pendingDocsList.length > 0 && (
        <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 1 }}>
          {pendingDocsList.map((req) => (
            <Alert
              key={req.id}
              severity="warning"
              icon={<WarningAmberOutlined />}
              sx={{ borderRadius: 2, alignItems: "flex-start" }}
              action={
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setUploadDocReq(req)}
                  startIcon={<UploadFileOutlined sx={{ fontSize: 14 }} />}
                  sx={{
                    textTransform: "none",
                    bgcolor: "#e65100",
                    "&:hover": { bgcolor: "#bf360c" },
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    mt: 0.5,
                  }}
                >
                  Upload Documents
                </Button>
              }
            >
              <Typography variant="body2" fontWeight={700}>
                Action Required: {req.ppa}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                {req.aip_code} · Your training has concluded — please submit
                post-completion documents to proceed.
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Summary chips */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        {[
          {
            icon: (
              <PendingActionsOutlined sx={{ color: "#e65100", fontSize: 20 }} />
            ),
            count: pendingCount,
            label: "Pending",
          },
          {
            icon: (
              <CheckCircleOutlined sx={{ color: "#2e7d32", fontSize: 20 }} />
            ),
            count: approvedCount,
            label: "Approved",
          },
          {
            icon: <ArticleOutlined sx={{ color: "#1565c0", fontSize: 20 }} />,
            count: myRequests.length,
            label: "Total Requests",
          },
        ].map(({ icon, count, label }) => (
          <Paper
            key={label}
            elevation={0}
            sx={{
              px: 2.5,
              py: 1.5,
              borderRadius: 3,
              border: "1px solid #e8f5e9",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {icon}
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1}>
                {count}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: 14,
          },
          "& .Mui-selected": { color: "#2e7d32" },
          "& .MuiTabs-indicator": { bgcolor: "#2e7d32" },
        }}
      >
        <Tab label={`Available Programs (${ppmpEntries.length})`} />
        <Tab label={`My Requests (${myRequests.length})`} />
      </Tabs>

      {/* Tab 0 */}
      {tab === 0 && (
        <Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <TextField
              placeholder="Search AIP code or PPA…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPpmpPage(0);
              }}
              size="small"
              sx={{
                width: 260,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined
                        fontSize="small"
                        sx={{ color: "text.disabled" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel shrink>Department</InputLabel>
              <Select
                value={filterDept}
                label="Department"
                displayEmpty
                onChange={(e) => {
                  setFilterDept(e.target.value);
                  setPpmpPage(0);
                }}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel shrink>School Year</InputLabel>
              <Select
                value={filterSY}
                label="School Year"
                displayEmpty
                onChange={(e) => {
                  setFilterSY(e.target.value);
                  setPpmpPage(0);
                }}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Years</MenuItem>
                {schoolYears.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {(search || filterDept || filterSY) && (
              <Button
                size="small"
                onClick={() => {
                  setSearch("");
                  setFilterDept("");
                  setFilterSY("");
                  setPpmpPage(0);
                }}
                sx={{ textTransform: "none", color: "text.secondary" }}
              >
                Clear filters
              </Button>
            )}
          </Box>

          {filteredPpmp.length === 0 ? (
            <Box
              sx={{
                py: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: "#e8f5e9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2e7d32",
                }}
              >
                <InboxOutlined sx={{ fontSize: 30 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} color="#1b5e20">
                {ppmpEntries.length === 0
                  ? "No training programs yet"
                  : "No entries match your filters"}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={2.5}>
                {paginatedPpmp.map((entry) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={entry.aip_code}>
                    <PpmpCard
                      entry={entry}
                      onView={() => setViewEntry(entry)}
                      onRequest={() =>
                        router.push(`/user/requests/new?aip=${entry.aip_code}`)
                      }
                    />
                  </Grid>
                ))}
              </Grid>
              <TablePagination
                component="div"
                count={filteredPpmp.length}
                page={ppmpPage}
                rowsPerPage={ppmpRows}
                onPageChange={(_, p) => setPpmpPage(p)}
                onRowsPerPageChange={(e) => {
                  setPpmpRows(parseInt(e.target.value, 10));
                  setPpmpPage(0);
                }}
                rowsPerPageOptions={[6, 9, 12, 24]}
                sx={{ mt: 2, borderTop: "1px solid #e8f5e9" }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Tab 1 */}
      {tab === 1 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <TextField
              placeholder="Search AIP code or PPA…"
              value={reqSearch}
              onChange={(e) => {
                setReqSearch(e.target.value);
                setReqPage(0);
              }}
              size="small"
              sx={{
                width: 260,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined
                        fontSize="small"
                        sx={{ color: "text.disabled" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e8f5e9",
              overflow: "hidden",
            }}
          >
            {filteredReqs.length === 0 ? (
              <Box
                sx={{
                  py: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: "#e8f5e9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2e7d32",
                  }}
                >
                  <ArticleOutlined />
                </Box>
                <Typography variant="body1" fontWeight={600} color="#1b5e20">
                  {myRequests.length === 0
                    ? "No requests yet"
                    : "No requests match your search"}
                </Typography>
                {myRequests.length === 0 && (
                  <Button
                    variant="contained"
                    startIcon={<AddOutlined />}
                    onClick={() => setTab(0)}
                    sx={{
                      bgcolor: "#2e7d32",
                      "&:hover": { bgcolor: "#1b5e20" },
                      borderRadius: 2,
                      textTransform: "none",
                    }}
                  >
                    Browse Programs
                  </Button>
                )}
              </Box>
            ) : (
              <Box sx={{ py: 1 }}>
                {paginatedReqs.map((req, i) => (
                  <Box key={req.id}>
                    <RequestRow req={req} onClick={() => setViewRequest(req)} />
                    {i < paginatedReqs.length - 1 && (
                      <Divider sx={{ mx: 2, borderColor: "#f0f0f0" }} />
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>

          {filteredReqs.length > 0 && (
            <TablePagination
              component="div"
              count={filteredReqs.length}
              page={reqPage}
              rowsPerPage={reqRows}
              onPageChange={(_, p) => setReqPage(p)}
              onRowsPerPageChange={(e) => {
                setReqRows(parseInt(e.target.value, 10));
                setReqPage(0);
              }}
              rowsPerPageOptions={[8, 16, 24]}
              sx={{ mt: 1, borderTop: "1px solid #e8f5e9" }}
            />
          )}
        </Box>
      )}

      {/* Dialogs */}
      <PpmpDetailDialog
        entry={viewEntry}
        onClose={() => setViewEntry(null)}
        alreadyRequested={
          viewEntry ? requestedCodes.has(viewEntry.aip_code) : false
        }
        onRequest={() => {
          if (viewEntry)
            router.push(`/user/requests/new?aip=${viewEntry.aip_code}`);
        }}
      />

      <RequestTimelineDialog
        request={viewRequest}
        onClose={() => setViewRequest(null)}
        onUploadDocs={(req) => {
          setViewRequest(null);
          setUploadDocReq(req);
        }}
      />

      <PostCompletionDialog
        request={uploadDocReq}
        onClose={() => setUploadDocReq(null)}
        onSubmitted={handleDocsSubmitted}
      />
    </Box>
  );
}
