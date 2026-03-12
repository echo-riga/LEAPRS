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
} from "@mui/icons-material";
import { useState, useEffect } from "react";
export type PpmpSummary = {
  id: string; // add this
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
  has_active_request: boolean; // add this
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

type Props = {
  user: { name: string; email: string; department: string | null };
  ppmpEntries: PpmpSummary[];
  myRequests: TrainingRequest[];
  departments: { id: string; name: string }[];
  schoolYears: { id: string; name: string }[];
};

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

const [greeting, setGreeting] = useState("Hello");

useEffect(() => {
  const h = new Date().getHours();
  if (h < 12) setGreeting("Good morning");
  else if (h < 18) setGreeting("Good afternoon");
  else setGreeting("Good evening");
}, []);
// ── ppmp card ─────────────────────────────────────────────────────────────────

function PpmpCard({
  entry,
  alreadyRequested,
  onView,
  onRequest,
}: {
  entry: PpmpSummary;
  alreadyRequested: boolean;
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
        "&:hover": { bgcolor: "#f9fbe7" },
        transition: "background 0.15s",
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
        <Typography variant="caption" color="text.secondary">
          {req.aip_code} · {req.type} ·{" "}
          {new Date(req.submitted_at).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Typography>
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

  // ppmp filters
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterSY, setFilterSY] = useState("");
  const [ppmpPage, setPpmpPage] = useState(0);
  const [ppmpRows, setPpmpRows] = useState(6);

  // request filters
  const [reqSearch, setReqSearch] = useState("");
  const [reqPage, setReqPage] = useState(0);
  const [reqRows, setReqRows] = useState(8);

  // detail dialog
  const [viewEntry, setViewEntry] = useState<PpmpSummary | null>(null);

  const requestedCodes = new Set(myRequests.map((r) => r.aip_code));
  const pendingCount = myRequests.filter((r) =>
    ["submitted", "waiting_approval"].includes(r.status),
  ).length;
  const approvedCount = myRequests.filter((r) =>
    ["approved", "completed"].includes(r.status),
  ).length;

  // filtered ppmp
  const filteredPpmp = ppmpEntries.filter((e) => {
    const matchSearch =
      !search ||
      e.aip_code.toLowerCase().includes(search.toLowerCase()) ||
      e.ppa.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || e.department_id === filterDept;
    const matchSY = !filterSY || e.school_year_id === filterSY;
    return matchSearch && matchDept && matchSY;
  });
  const paginatedPpmp = filteredPpmp.slice(
    ppmpPage * ppmpRows,
    ppmpPage * ppmpRows + ppmpRows,
  );

  // filtered requests
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

  return (
    <Box>
      {/* Greeting */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="#1b5e20">
          {greeting}, {user.name.split(" ")[0]}!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {user.department
            ? `${user.department} · Browse available training programs below.`
            : "Browse available training programs and submit your requests."}
        </Typography>
      </Box>

      {/* Summary */}
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

      {/* Tab 0: Available Programs */}
      {tab === 0 && (
        <Box>
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
                setPpmpPage(0);
              }}
              size="small"
              variant="outlined"
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
                      alreadyRequested={requestedCodes.has(entry.aip_code)}
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

      {/* Tab 1: My Requests */}
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
              variant="outlined"
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
                    <RequestRow
                      req={req}
                      onClick={() => router.push(`/user/requests/${req.id}`)}
                    />
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

      {/* PPMP Detail Dialog */}
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
    </Box>
  );
}
