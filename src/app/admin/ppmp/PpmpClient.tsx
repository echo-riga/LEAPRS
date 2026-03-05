"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  TablePagination,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip,
  CircularProgress,
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  VisibilityOutlined,
  SearchOutlined,
  CalendarMonthOutlined,
  BusinessOutlined,
  AccountBalanceWalletOutlined,
} from "@mui/icons-material";
import {
  createPpmpAction,
  updatePpmpAction,
  deletePpmpAction,
} from "@/app/admin/ppmp/actions";
import type { PpmpEntry } from "./page";

// ── constants ──────────────────────────────────────────────────────────────────

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const PILLARS = [
  "Instruction",
  "Research and Innovation",
  "Extension and Community Service",
  "Administration and Governance",
  "Others",
];
const MFO_CATEGORIES = [
  "Higher Education Services",
  "Advanced Education Services",
  "Research Services",
  "Technical Advisory Extension Services",
  "Others",
];
const INITIATIVE_LEVELS = [
  "Institution-wide",
  "College-Based",
  "Department-Based",
];

const emptyForm = {
  aip_code: "",
  school_year: "",
  department: "",
  ppa: "",
  initiative_level: "",
  mfo_category: "",
  pillar: "",
  intended_outcome: "",
  sdg_coding: "",
  joint_initiative: "",
  planned_outputs: "",
  success_indicator: "",
  milestone: "",
  budget_allocation: "",
  ppa_owner: "",
  target_quarter: "",
  target_month: "",
  target_year: "",
};

type FormState = typeof emptyForm;

function formatPeso(value: string | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

// ── section header inside dialog ───────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      sx={{
        color: "#2e7d32",
        fontWeight: 700,
        letterSpacing: 1.5,
        mt: 1,
        display: "block",
      }}
    >
      {label}
    </Typography>
  );
}

// ── view dialog ────────────────────────────────────────────────────────────────

function ViewDialog({
  open,
  entry,
  onClose,
  onEdit,
}: {
  open: boolean;
  entry: PpmpEntry | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  if (!entry) return null;

  const sections: {
    label: string;
    fields: { key: string; value: string | null }[];
  }[] = [
    {
      label: "BASIC INFORMATION",
      fields: [
        { key: "AIP Code", value: entry.aip_code },
        { key: "School Year", value: entry.school_year },
        { key: "Department", value: entry.department },
        { key: "PPA", value: entry.ppa },
        { key: "PPA Owner", value: entry.ppa_owner },
      ],
    },
    {
      label: "CLASSIFICATION",
      fields: [
        { key: "Initiative Level", value: entry.initiative_level },
        { key: "MFO Category", value: entry.mfo_category },
        { key: "Pillar", value: entry.pillar },
        { key: "SDG Coding", value: entry.sdg_coding },
        { key: "Joint Initiative", value: entry.joint_initiative },
      ],
    },
    {
      label: "PLANNING DETAILS",
      fields: [
        { key: "Intended/Expected Outcome", value: entry.intended_outcome },
        { key: "Planned Outputs", value: entry.planned_outputs },
        { key: "Success Indicator", value: entry.success_indicator },
        { key: "Milestone", value: entry.milestone },
      ],
    },
    {
      label: "IMPLEMENTATION",
      fields: [
        {
          key: "Budget Allocation",
          value: formatPeso(entry.budget_allocation),
        },
        { key: "Target Quarter", value: entry.target_quarter },
        { key: "Target Month", value: entry.target_month },
        { key: "Target Year", value: entry.target_year },
      ],
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          bgcolor: "#1b5e20",
          color: "white",
          px: 3,
          py: 2.5,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ opacity: 0.6, letterSpacing: 1.5, fontSize: 11 }}
          >
            PPMP ENTRY
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {entry.aip_code}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.25 }}>
            {entry.ppa}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "white", mt: 0.5 }}
        >
          <CloseOutlined />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {sections.map((section) => (
          <Box key={section.label} sx={{ mb: 3 }}>
            <SectionLabel label={section.label} />
            <Divider sx={{ mb: 2, mt: 0.5, borderColor: "#e8f5e9" }} />
            <Grid container spacing={2}>
              {section.fields.map(({ key, value }) => (
                <Grid size={{ xs: 12, sm: 6 }} key={key}>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    fontWeight={600}
                    sx={{ letterSpacing: 0.8, textTransform: "uppercase" }}
                  >
                    {key}
                  </Typography>
                  <Typography variant="body2" fontWeight={500} color="#1a1a1a">
                    {value ?? "—"}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.disabled">
            Created by {entry.created_by ?? "—"}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={onEdit}
          sx={{ textTransform: "none", bgcolor: "#2e7d32" }}
        >
          Edit Entry
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── add / edit dialog ──────────────────────────────────────────────────────────

function EntryDialog({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  isEdit,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: FormState;
  setForm: (f: FormState) => void;
  isEdit: boolean;
  loading: boolean;
  error: string | null;
}) {
  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [field]: e.target.value });
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#1b5e20",
          color: "white",
          px: 3,
          py: 2.5,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ opacity: 0.6, letterSpacing: 1.5, fontSize: 11 }}
          >
            {isEdit ? "EDIT ENTRY" : "NEW ENTRY"}
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {isEdit ? "Update PPMP Entry" : "Add PPMP Entry"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
          <CloseOutlined />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Basic Info */}
        <SectionLabel label="BASIC INFORMATION" />
        <Divider sx={{ mb: 2, mt: 0.5, borderColor: "#e8f5e9" }} />
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="AIP Code"
              variant="standard"
              fullWidth
              value={form.aip_code}
              onChange={set("aip_code")}
              disabled={isEdit}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="School Year"
              variant="standard"
              fullWidth
              value={form.school_year}
              onChange={set("school_year")}
              placeholder="e.g. 2025-2026"
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Responsible College/Department"
              variant="standard"
              fullWidth
              value={form.department}
              onChange={set("department")}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              label="PPA (Program, Project, Activity)"
              variant="standard"
              fullWidth
              value={form.ppa}
              onChange={set("ppa")}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="PPA Owner"
              variant="standard"
              fullWidth
              value={form.ppa_owner}
              onChange={set("ppa_owner")}
            />
          </Grid>
        </Grid>

        {/* Classification */}
        <SectionLabel label="CLASSIFICATION" />
        <Divider sx={{ mb: 2, mt: 0.5, borderColor: "#e8f5e9" }} />
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Initiative Level"
              variant="standard"
              select
              fullWidth
              value={form.initiative_level}
              onChange={set("initiative_level")}
            >
              {INITIATIVE_LEVELS.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="MFO Category"
              variant="standard"
              select
              fullWidth
              value={form.mfo_category}
              onChange={set("mfo_category")}
            >
              {MFO_CATEGORIES.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Pillar"
              variant="standard"
              select
              fullWidth
              value={form.pillar}
              onChange={set("pillar")}
            >
              {PILLARS.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="SDG Coding"
              variant="standard"
              fullWidth
              value={form.sdg_coding}
              onChange={set("sdg_coding")}
              placeholder="e.g. SDG 4 - Quality Education"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Joint Initiative"
              variant="standard"
              fullWidth
              value={form.joint_initiative}
              onChange={set("joint_initiative")}
              placeholder="e.g. CHED, DOST"
            />
          </Grid>
        </Grid>

        {/* Planning Details */}
        <SectionLabel label="PLANNING DETAILS" />
        <Divider sx={{ mb: 2, mt: 0.5, borderColor: "#e8f5e9" }} />
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Intended/Expected Outcome"
              variant="standard"
              fullWidth
              multiline
              minRows={2}
              value={form.intended_outcome}
              onChange={set("intended_outcome")}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Planned Outputs"
              variant="standard"
              fullWidth
              multiline
              minRows={2}
              value={form.planned_outputs}
              onChange={set("planned_outputs")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Success Indicator"
              variant="standard"
              fullWidth
              multiline
              minRows={2}
              value={form.success_indicator}
              onChange={set("success_indicator")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Milestone"
              variant="standard"
              fullWidth
              multiline
              minRows={2}
              value={form.milestone}
              onChange={set("milestone")}
            />
          </Grid>
        </Grid>

        {/* Implementation */}
        <SectionLabel label="IMPLEMENTATION" />
        <Divider sx={{ mb: 2, mt: 0.5, borderColor: "#e8f5e9" }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Budget Allocation (PHP)"
              variant="standard"
              fullWidth
              type="number"
              value={form.budget_allocation}
              onChange={set("budget_allocation")}
              slotProps={{ htmlInput: { min: 0, step: 100 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Target Quarter"
              variant="standard"
              select
              fullWidth
              value={form.target_quarter}
              onChange={set("target_quarter")}
            >
              {QUARTERS.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Target Month"
              variant="standard"
              select
              fullWidth
              value={form.target_month}
              onChange={set("target_month")}
            >
              {MONTHS.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Target Year"
              variant="standard"
              fullWidth
              value={form.target_year}
              onChange={set("target_year")}
              placeholder="e.g. 2025"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none" }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading}
          sx={{ textTransform: "none", bgcolor: "#2e7d32" }}
        >
          {loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Add Entry"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── delete dialog ──────────────────────────────────────────────────────────────

function DeleteDialog({
  open,
  onClose,
  onConfirm,
  entry,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entry: PpmpEntry | null;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={600}>Delete Entry</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Are you sure you want to delete{" "}
          <strong>&ldquo;{entry?.aip_code}&rdquo;</strong>? This cannot be
          undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none" }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── entry card ─────────────────────────────────────────────────────────────────

function PpmpCard({
  entry,
  onView,
  onEdit,
  onDelete,
}: {
  entry: PpmpEntry;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
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
        {/* AIP code + pillar chip */}
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
          {entry.target_quarter && (
            <Chip
              label={entry.target_quarter}
              size="small"
              variant="outlined"
              sx={{ fontSize: 11, borderColor: "#c8e6c9", color: "#2e7d32" }}
            />
          )}
        </Box>

        {/* PPA title */}
        <Typography
          variant="subtitle2"
          fontWeight={700}
          color="#1a1a1a"
          sx={{
            mb: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {entry.ppa}
        </Typography>

        {/* Meta rows */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BusinessOutlined sx={{ fontSize: 14, color: "text.disabled" }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {entry.department}
            </Typography>
          </Box>

          {entry.pillar && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonthOutlined
                sx={{ fontSize: 14, color: "text.disabled" }}
              />
              <Typography variant="caption" color="text.secondary" noWrap>
                {entry.pillar}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccountBalanceWalletOutlined
              sx={{ fontSize: 14, color: "text.disabled" }}
            />
            <Typography variant="caption" fontWeight={600} color="#2e7d32">
              {formatPeso(entry.budget_allocation)}
            </Typography>
          </Box>

          {entry.school_year && (
            <Typography variant="caption" color="text.disabled">
              SY {entry.school_year}
              {entry.target_month && entry.target_year
                ? ` · ${entry.target_month} ${entry.target_year}`
                : ""}
            </Typography>
          )}
        </Box>
      </CardContent>

      <Divider sx={{ borderColor: "#f0f0f0" }} />

      <CardActions sx={{ px: 2, py: 1, justifyContent: "flex-end" }}>
        <Tooltip title="View">
          <IconButton size="small" onClick={onView} sx={{ color: "#2e7d32" }}>
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={onEdit} sx={{ color: "#1565c0" }}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={onDelete} color="error">
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

// ── main client ────────────────────────────────────────────────────────────────

export function PpmpClient({ entries }: { entries: PpmpEntry[] }) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<PpmpEntry | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const isEdit = !!selected && open;

  const filtered = entries.filter(
    (e) =>
      e.aip_code.toLowerCase().includes(search.toLowerCase()) ||
      e.ppa.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()),
  );
  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  function openAdd() {
    setSelected(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(entry: PpmpEntry) {
    setSelected(entry);
    setForm({
      aip_code: entry.aip_code,
      school_year: entry.school_year,
      department: entry.department,
      ppa: entry.ppa,
      initiative_level: entry.initiative_level ?? "",
      mfo_category: entry.mfo_category ?? "",
      pillar: entry.pillar ?? "",
      intended_outcome: entry.intended_outcome ?? "",
      sdg_coding: entry.sdg_coding ?? "",
      joint_initiative: entry.joint_initiative ?? "",
      planned_outputs: entry.planned_outputs ?? "",
      success_indicator: entry.success_indicator ?? "",
      milestone: entry.milestone ?? "",
      budget_allocation: entry.budget_allocation ?? "",
      ppa_owner: entry.ppa_owner ?? "",
      target_quarter: entry.target_quarter ?? "",
      target_month: entry.target_month ?? "",
      target_year: entry.target_year ?? "",
    });
    setError(null);
    setOpen(true);
  }

  function openView(entry: PpmpEntry) {
    setSelected(entry);
    setViewOpen(true);
  }

  function openDelete(entry: PpmpEntry) {
    setSelected(entry);
    setDeleteOpen(true);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      if (isEdit && selected) {
        await updatePpmpAction(form);
      } else {
        await createPpmpAction(form);
      }
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!selected) return;
    setLoading(true);
    try {
      await deletePpmpAction(selected.aip_code);
      setDeleteOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
    setLoading(false);
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1b5e20">
            PPMP
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Pre-Procurement Management Plan — Training Entries
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={openAdd}
          sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#2e7d32" }}
        >
          Add Entry
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by AIP code, PPA, or department…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          size="small"
          variant="outlined"
          sx={{ width: 360, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
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

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <Box
          sx={{
            py: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            color: "text.secondary",
          }}
        >
          <Typography variant="body1" fontWeight={500}>
            {entries.length === 0
              ? "No PPMP entries yet."
              : "No entries match your search."}
          </Typography>
          {entries.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={openAdd}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                bgcolor: "#2e7d32",
              }}
            >
              Add First Entry
            </Button>
          )}
        </Box>
      ) : (
        <Box>
          <Grid container spacing={2.5}>
            {paginated.map((entry) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={entry.aip_code}>
                <PpmpCard
                  entry={entry}
                  onView={() => openView(entry)}
                  onEdit={() => openEdit(entry)}
                  onDelete={() => openDelete(entry)}
                />
              </Grid>
            ))}
          </Grid>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[6, 9, 12, 24]}
            sx={{
              mt: 2,
              borderTop: "1px solid #e8f5e9",
              "& .MuiTablePagination-toolbar": { px: 0 },
            }}
          />
        </Box>
      )}

      {/* Dialogs */}
      <ViewDialog
        open={viewOpen}
        entry={selected}
        onClose={() => setViewOpen(false)}
        onEdit={() => {
          setViewOpen(false);
          if (selected) openEdit(selected);
        }}
      />

      <EntryDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        isEdit={isEdit}
        loading={loading}
        error={error}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        entry={selected}
        loading={loading}
      />
    </Box>
  );
}
