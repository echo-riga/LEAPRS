"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  TablePagination,
  Divider,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  SearchOutlined,
  ArticleOutlined,
  AddCircleOutlined,
  FolderOutlined,
  ArrowForwardOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import type { AdminRequest } from "./page";
import { fetchStatusTrack, addStatusTrack } from "./action";

const STATUS_OPTIONS = [
  "submitted",
  "waiting_approval",
  "approved",
  "rejected",
  "training_ongoing",
  "pending_completion_docs",
  "pending_completion_approval",
  "completed",
];

const OFFICE_OPTIONS = [
  "Finance",
  "Academic Affairs",
  "Office of the President",
];

const STATUS_META: Record<
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

type StatusTrack = {
  id: string;
  request_id: string;
  office: string | null;
  status: string;
  file_url: string | null;
  remarks: string | null;
  actioned_at: string;
};

type Props = {
  requests: AdminRequest[];
  departments: { id: string; name: string }[];
  schoolYears: { id: string; name: string }[];
};

// ── status track box ──────────────────────────────────────────────────────────

function TrackBox({ track, index }: { track: StatusTrack; index: number }) {
  const meta = STATUS_META[track.status] ?? {
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
        minWidth: 200,
        maxWidth: 240,
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

// ── add track dialog ──────────────────────────────────────────────────────────
function AddTrackDialog({
  open,
  requestId,
  parentFolderUrl,
  onClose,
  onAdded,
}: {
  open: boolean;
  requestId: string;
  parentFolderUrl: string | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [office, setOffice] = useState("");
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOffice("");
    setStatus("");
    setFile(null);
    setRemarks("");
    setError(null);
    setUploadMsg("");
  }

  // extract folder ID from url like https://drive.google.com/drive/folders/FOLDER_ID
  function extractFolderId(url: string) {
    const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match?.[1] ?? null;
  }

  async function handleAdd() {
    if (!status) {
      setError("Status is required.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let fileUrl: string | null = null;

      if (file && parentFolderUrl) {
        const parentFolderId = extractFolderId(parentFolderUrl);
        if (!parentFolderId)
          throw new Error("Could not determine parent folder.");

        // subfolder name: office or status
        const subfolderName = office || STATUS_META[status]?.label || status;
        setUploadMsg("Creating subfolder…");

        const initRes = await fetch("/api/drive/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentFolderId, subfolderName }),
        });
        if (!initRes.ok) throw new Error("Failed to create subfolder");
        const { folderId, accessToken } = await initRes.json();

        setUploadMsg("Uploading file…");
        const ext = file.name.split(".").pop() ?? "bin";
        const name = `${subfolderName}.${ext}`;

        const metadata = JSON.stringify({ name, parents: [folderId] });
        const form = new FormData();
        form.append(
          "metadata",
          new Blob([metadata], { type: "application/json" }),
        );
        form.append("file", file);

        const uploadRes = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form,
          },
        );
        if (!uploadRes.ok) throw new Error("Failed to upload file");

        fileUrl = `https://drive.google.com/drive/folders/${folderId}`;
      }

      setUploadMsg("Saving…");
      await addStatusTrack({
        requestId,
        office: office || null,
        status,
        fileUrl,
        remarks: remarks || null,
      });

      reset();
      onAdded();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setLoading(false);
    setUploadMsg("");
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: "#1b5e20", pb: 1 }}>
        Add Next Stage
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          pt: "12px !important",
        }}
      >
        {error && <Alert severity="error">{error}</Alert>}

        <FormControl variant="standard" fullWidth>
          <InputLabel shrink>Office</InputLabel>
          <Select
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">No specific office</MenuItem>
            {OFFICE_OPTIONS.map((o) => (
              <MenuItem key={o} value={o}>
                {o}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="standard" fullWidth required>
          <InputLabel shrink>Status *</InputLabel>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="" disabled>
              Select status
            </MenuItem>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {STATUS_META[s]?.label ?? s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* File upload */}
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ display: "block", mb: 1 }}
          >
            Attach File (optional)
          </Typography>
          <Button
            component="label"
            variant={file ? "outlined" : "contained"}
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              bgcolor: file ? undefined : "#2e7d32",
              borderColor: file ? "#c8e6c9" : undefined,
              color: file ? "#2e7d32" : "white",
              "&:hover": { bgcolor: file ? "#f1f8e9" : "#1b5e20" },
            }}
          >
            {file ? `✓ ${file.name}` : "Upload File"}
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Button>
          {file && (
            <Button
              size="small"
              onClick={() => setFile(null)}
              sx={{ textTransform: "none", color: "text.disabled", ml: 1 }}
            >
              Remove
            </Button>
          )}
          {!parentFolderUrl && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: "block", mt: 0.5 }}
            >
              No request folder found — file upload unavailable.
            </Typography>
          )}
        </Box>

        <TextField
          label="Remarks"
          variant="standard"
          fullWidth
          multiline
          minRows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Optional notes"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
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
          onClick={handleAdd}
          disabled={loading || !status}
          sx={{
            textTransform: "none",
            bgcolor: "#2e7d32",
            "&:hover": { bgcolor: "#1b5e20" },
            minWidth: 110,
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={14} color="inherit" />
              <Typography variant="caption" color="inherit">
                {uploadMsg || "Saving…"}
              </Typography>
            </Box>
          ) : (
            "Add Stage"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
// ── request detail panel ──────────────────────────────────────────────────────

function RequestDetailPanel({
  request,
  onClose,
}: {
  request: AdminRequest;
  onClose: () => void;
}) {
  const [tracks, setTracks] = useState<StatusTrack[] | null>(null);
  const [loadingTrack, setLoadingTrack] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  async function loadTracks() {
    setLoadingTrack(true);
    const data = await fetchStatusTrack(request.id);
    setTracks(data);
    setLoadingTrack(false);
  }

  useState(() => {
    loadTracks();
  });

  const lastStatus = tracks?.[tracks.length - 1]?.status;
  const isFinal = lastStatus === "completed" || lastStatus === "rejected";
  const parentFolderUrl = tracks?.[0]?.file_url ?? null; // ← add here
  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
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
          <Typography
            variant="h6"
            fontWeight={700}
            color="#1a1a1a"
            sx={{ mt: 1 }}
          >
            {request.ppa}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
            <Chip
              label={request.type === "external" ? "External" : "In-house"}
              size="small"
              sx={{
                fontSize: 11,
                bgcolor: request.type === "external" ? "#e3f2fd" : "#f3e5f5",
                color: request.type === "external" ? "#1565c0" : "#6a1b9a",
              }}
            />
            {request.department_name && (
              <Chip
                label={request.department_name}
                size="small"
                variant="outlined"
                sx={{ fontSize: 11, borderColor: "#c8e6c9", color: "#2e7d32" }}
              />
            )}
            {request.school_year_name && (
              <Chip
                label={`SY ${request.school_year_name}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: 11 }}
              />
            )}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1 }}
          >
            Requested by <strong>{request.requester_name}</strong> (
            {request.requester_email}) ·{" "}
            {new Date(request.submitted_at).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseOutlined />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3, borderColor: "#e8f5e9" }} />

      {/* Track chain */}
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

      {loadingTrack ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 4 }}>
          <CircularProgress size={20} sx={{ color: "#2e7d32" }} />
          <Typography variant="body2" color="text.secondary">
            Loading timeline…
          </Typography>
        </Box>
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
            {tracks?.map((track, i) => (
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

            {/* Add next stage */}
            {!isFinal && (
              <>
                {tracks && tracks.length > 0 && (
                  <ArrowForwardOutlined
                    sx={{ color: "#c8e6c9", fontSize: 28, flexShrink: 0 }}
                  />
                )}
                <Box
                  onClick={() => setAddOpen(true)}
                  sx={{
                    border: "2px dashed #c8e6c9",
                    borderRadius: 3,
                    p: 2,
                    minWidth: 160,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    cursor: "pointer",
                    color: "#2e7d32",
                    bgcolor: "white",
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: "#e8f5e9", borderColor: "#2e7d32" },
                  }}
                >
                  <AddCircleOutlined sx={{ fontSize: 28 }} />
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    textAlign="center"
                  >
                    Add Next Stage
                  </Typography>
                </Box>
              </>
            )}

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
                    minWidth: 140,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: lastStatus === "completed" ? "#f1f8e9" : "#ffebee",
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

      <AddTrackDialog
        open={addOpen}
        requestId={request.id}
        parentFolderUrl={parentFolderUrl}
        onClose={() => setAddOpen(false)}
        onAdded={loadTracks}
      />
    </Box>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export function RequestsClient({ requests, departments, schoolYears }: Props) {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterSY, setFilterSY] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<AdminRequest | null>(null);

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      r.aip_code.toLowerCase().includes(q) ||
      r.ppa.toLowerCase().includes(q) ||
      r.requester_name.toLowerCase().includes(q) ||
      r.requester_email.toLowerCase().includes(q);
    const matchDept =
      !filterDept ||
      r.department_name === departments.find((d) => d.id === filterDept)?.name;
    const matchSY =
      !filterSY ||
      r.school_year_name === schoolYears.find((s) => s.id === filterSY)?.name;
    return matchSearch && matchDept && matchSY;
  });

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="#1b5e20">
          Training Requests
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage and track all employee training requests.
        </Typography>
      </Box>

      {/* Filters */}
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
          placeholder="Search name, email, AIP code, PPA…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          size="small"
          variant="outlined"
          sx={{ width: 300, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
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
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel shrink>Department</InputLabel>
          <Select
            value={filterDept}
            label="Department"
            displayEmpty
            onChange={(e) => {
              setFilterDept(e.target.value);
              setPage(0);
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
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel shrink>School Year</InputLabel>
          <Select
            value={filterSY}
            label="School Year"
            displayEmpty
            onChange={(e) => {
              setFilterSY(e.target.value);
              setPage(0);
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
              setPage(0);
            }}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Clear filters
          </Button>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: selected ? "380px 1fr" : "1fr",
          gap: 3,
          alignItems: "flex-start",
        }}
      >
        {/* Request list */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e8f5e9",
            overflow: "hidden",
          }}
        >
          {paginated.length === 0 ? (
            <Box
              sx={{
                py: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <ArticleOutlined sx={{ fontSize: 36, color: "#c8e6c9" }} />
              <Typography variant="body1" fontWeight={600} color="#1b5e20">
                No requests found
              </Typography>
            </Box>
          ) : (
            paginated.map((req, i) => {
              const meta = STATUS_META[req.latest_status] ?? {
                label: req.latest_status,
                color: "#555",
                bg: "#f5f5f5",
              };
              const isActive = selected?.id === req.id;
              return (
                <Box key={req.id}>
                  <Box
                    onClick={() => setSelected(isActive ? null : req)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      px: 2.5,
                      py: 2,
                      cursor: "pointer",
                      bgcolor: isActive ? "#f1f8e9" : "white",
                      borderLeft: isActive
                        ? "3px solid #2e7d32"
                        : "3px solid transparent",
                      "&:hover": { bgcolor: "#f9fbe7" },
                      transition: "all 0.15s",
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: "#e8f5e9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#2e7d32",
                        flexShrink: 0,
                      }}
                    >
                      <ArticleOutlined fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {req.ppa}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {req.aip_code} · {req.requester_name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        display="block"
                        noWrap
                      >
                        {new Date(req.submitted_at).toLocaleDateString(
                          "en-PH",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </Typography>
                    </Box>
                    <Chip
                      label={meta.label}
                      size="small"
                      sx={{
                        bgcolor: meta.bg,
                        color: meta.color,
                        fontWeight: 600,
                        fontSize: 10,
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                  {i < paginated.length - 1 && (
                    <Divider sx={{ borderColor: "#f0f0f0" }} />
                  )}
                </Box>
              );
            })
          )}
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            sx={{ borderTop: "1px solid #e8f5e9" }}
          />
        </Paper>

        {/* Detail panel */}
        {selected && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e8f5e9",
              p: 3,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <RequestDetailPanel
              request={selected}
              onClose={() => setSelected(null)}
            />
          </Paper>
        )}
      </Box>
    </Box>
  );
}
