"use client";

import { useState, useRef } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
  CircularProgress,
  Divider,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ListItemText,
  ListItemSecondaryAction,
  Popover,
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
  createDepartmentAction,
  deleteDepartmentAction,
  createSchoolYearAction,
  deleteSchoolYearAction,
} from "@/app/admin/ppmp/actions";
import type { PpmpEntry, Department, SchoolYear } from "./page";

// ── constants ──────────────────────────────────────────────────────────────────

const emptyForm = {
  aip_code: "",
  school_year_id: "",
  department_id: "",
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
  target_implementation: "",
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

// ── inline-addable dropdown ────────────────────────────────────────────────────
function InlineDropdown({
  label,
  value,
  onChange,
  items,
  onAdd,
  onDelete,
  addPlaceholder,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  items: { id: string; name: string }[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  addPlaceholder: string;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const open = Boolean(anchorEl);

  const selectedItem = items.find((i) => i.id === value);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    await onAdd(newName.trim());
    setNewName("");
    setAdding(false);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(id);
    await onDelete(id);
    if (value === id) onChange("");
    setDeleting(null);
  }

  function handleSelect(id: string) {
    onChange(id);
    setAnchorEl(null);
  }

  return (
    <>
      <FormControl variant="standard" fullWidth>
        <InputLabel shrink>{label}</InputLabel>
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            mt: "18px",
            pb: 0.5,
            borderBottom: "1px solid rgba(0,0,0,0.42)",
            cursor: "pointer",
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: value ? "text.primary" : "text.disabled",
              fontSize: "1rem",
            }}
          >
            {selectedItem?.name ?? ""}
          </Typography>
          <Box
            component="span"
            sx={{ color: "text.disabled", fontSize: 18, lineHeight: 1 }}
          >
            ▾
          </Box>
        </Box>
      </FormControl>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        disableAutoFocus
        disableEnforceFocus
        PaperProps={{
          sx: {
            width: anchorEl?.offsetWidth ?? 200,
            maxHeight: 360,
            overflow: "auto",
          },
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.id}
            selected={item.id === value}
            onClick={() => handleSelect(item.id)}
            sx={{ pr: 5, position: "relative" }}
          >
            <ListItemText primary={item.name} />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                size="small"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => handleDelete(item.id, e)}
                disabled={deleting === item.id}
                sx={{
                  color: "text.disabled",
                  "&:hover": { color: "error.main" },
                }}
              >
                {deleting === item.id ? (
                  <CircularProgress size={12} />
                ) : (
                  <CloseOutlined sx={{ fontSize: 14 }} />
                )}
              </IconButton>
            </ListItemSecondaryAction>
          </MenuItem>
        ))}

        <Divider />
        <Box
          sx={{ px: 2, py: 1.5, display: "flex", gap: 1, alignItems: "center" }}
        >
          <TextField
            inputRef={inputRef}
            size="small"
            variant="standard"
            placeholder={addPlaceholder}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            sx={{ flex: 1 }}
            autoComplete="off"
          />
          <IconButton
            size="small"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            sx={{ color: "#2e7d32" }}
          >
            {adding ? (
              <CircularProgress size={14} />
            ) : (
              <AddOutlined fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Popover>
    </>
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

  const sections = [
    {
      label: "BASIC INFORMATION",
      fields: [
        { key: "AIP Code", value: entry.aip_code },
        { key: "School Year", value: entry.school_year_name },
        { key: "Department", value: entry.department_name },
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
        {
          key: "Target Implementation (Quarter/Month/Year)",
          value: entry.target_implementation,
        },
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
        <Typography variant="caption" color="text.disabled">
          Created by {entry.created_by ?? "—"}
        </Typography>
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
  departments,
  schoolYears,
  onAddDepartment,
  onDeleteDepartment,
  onAddSchoolYear,
  onDeleteSchoolYear,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: FormState;
  setForm: (f: FormState) => void;
  isEdit: boolean;
  loading: boolean;
  error: string | null;
  departments: Department[];
  schoolYears: SchoolYear[];
  onAddDepartment: (name: string) => Promise<void>;
  onDeleteDepartment: (id: string) => Promise<void>;
  onAddSchoolYear: (name: string) => Promise<void>;
  onDeleteSchoolYear: (id: string) => Promise<void>;
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
            <InlineDropdown
              label="School Year"
              value={form.school_year_id}
              onChange={(id) => setForm({ ...form, school_year_id: id })}
              items={schoolYears}
              onAdd={onAddSchoolYear}
              onDelete={onDeleteSchoolYear}
              addPlaceholder="e.g. 2025-2026"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <InlineDropdown
              label="Responsible Department"
              value={form.department_id}
              onChange={(id) => setForm({ ...form, department_id: id })}
              items={departments}
              onAdd={onAddDepartment}
              onDelete={onDeleteDepartment}
              addPlaceholder="e.g. College of Education"
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
              fullWidth
              value={form.initiative_level}
              onChange={set("initiative_level")}
              placeholder="e.g. Institution-wide"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="MFO Category"
              variant="standard"
              fullWidth
              value={form.mfo_category}
              onChange={set("mfo_category")}
              placeholder="e.g. Higher Education Services"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Pillar"
              variant="standard"
              fullWidth
              value={form.pillar}
              onChange={set("pillar")}
              placeholder="e.g. Instruction"
            />
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
          <Grid size={{ xs: 12, sm: 4 }}>
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
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              label="Target Implementation (Quarter/Month/Year)"
              variant="standard"
              fullWidth
              value={form.target_implementation}
              onChange={set("target_implementation")}
              placeholder="e.g. Q1 - January 2025"
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
        </Box>

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

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BusinessOutlined sx={{ fontSize: 14, color: "text.disabled" }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {entry.department_name ?? "—"}
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
          {entry.school_year_name && (
            <Typography variant="caption" color="text.disabled">
              SY {entry.school_year_name}
              {entry.target_implementation
                ? ` · ${entry.target_implementation}`
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

export function PpmpClient({
  entries: initialEntries,
  departments: initialDepartments,
  schoolYears: initialSchoolYears,
}: {
  entries: PpmpEntry[];
  departments: Department[];
  schoolYears: SchoolYear[];
}) {
  const router = useRouter();

  const [departments, setDepartments] =
    useState<Department[]>(initialDepartments);
  const [schoolYears, setSchoolYears] =
    useState<SchoolYear[]>(initialSchoolYears);

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterSY, setFilterSY] = useState("");

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

  async function handleAddDepartment(name: string) {
    await createDepartmentAction(name);
    setDepartments((prev) => [...prev, { id: "__pending__", name }]);
    router.refresh();
  }

  async function handleDeleteDepartment(id: string) {
    await deleteDepartmentAction(id);
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    router.refresh();
  }

  async function handleAddSchoolYear(name: string) {
    await createSchoolYearAction(name);
    setSchoolYears((prev) => [...prev, { id: "__pending__", name }]);
    router.refresh();
  }

  async function handleDeleteSchoolYear(id: string) {
    await deleteSchoolYearAction(id);
    setSchoolYears((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  const filtered = initialEntries.filter((e) => {
    const matchSearch =
      !search ||
      e.aip_code.toLowerCase().includes(search.toLowerCase()) ||
      e.ppa.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || e.department_id === filterDept;
    const matchSY = !filterSY || e.school_year_id === filterSY;
    return matchSearch && matchDept && matchSY;
  });

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
      school_year_id: entry.school_year_id ?? "",
      department_id: entry.department_id ?? "",
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
      target_implementation: entry.target_implementation ?? "",
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
      if (isEdit) {
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
          placeholder="Search AIP code or PPA…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          size="small"
          variant="outlined"
          sx={{ width: 280, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
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

      {/* Cards */}
      {filtered.length === 0 ? (
        <Box
          sx={{
            py: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body1" fontWeight={500} color="text.secondary">
            {initialEntries.length === 0
              ? "No PPMP entries yet."
              : "No entries match your filters."}
          </Typography>
          {initialEntries.length === 0 && (
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
        departments={departments}
        schoolYears={schoolYears}
        onAddDepartment={handleAddDepartment}
        onDeleteDepartment={handleDeleteDepartment}
        onAddSchoolYear={handleAddSchoolYear}
        onDeleteSchoolYear={handleDeleteSchoolYear}
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
