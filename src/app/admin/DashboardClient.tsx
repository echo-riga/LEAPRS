"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Divider,
  Button,
} from "@mui/material";
import {
  ArticleOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  HourglassEmptyOutlined,
  AccountBalanceWalletOutlined,
  PendingActionsOutlined,
  TrendingUpOutlined,
  DownloadOutlined,
} from "@mui/icons-material";
import { fetchDashboardStats, fetchAipReport } from "./action";
import * as XLSX from "xlsx";

type Stats = {
  total_requests: number;
  submitted: number;
  waiting_approval: number;
  approved: number;
  rejected: number;
  training_ongoing: number;
  pending_completion_docs: number;
  pending_completion_approval: number;
  completed: number;
  total_budget: number;
  utilized_budget: number;
  external_count: number;
  inhouse_count: number; // ← add this
  total_requested: number;
  in_progress_budget: number;
  monthly_trends: {
    month: string;
    submitted: number;
    waiting_approval: number;
    completed: number;
    rejected: number;
  }[];
};

type PpmpOption = {
  id: string;
  aip_code: string;
  ppa: string;
  department_id: string | null;
  school_year_id: string | null;
};

type Props = {
  departments: { id: string; name: string }[];
  schoolYears: { id: string; name: string }[];
  ppmpOptions: PpmpOption[];
  user: {
    role: string;
    department_id?: string | null;
  };
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(n);
}

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
  sub?: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: "white",
        display: "flex",
        alignItems: "center",
        gap: 2,
        height: "100%",
        transition: "all 0.25s ease",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(27, 122, 61, 0.08)",
          borderColor: "rgba(27, 122, 61, 0.12)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          borderRadius: 2.5,
          p: 1.4,
          display: "flex",
          color,
          flexShrink: 0,
          border: `1px solid ${color}15`,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        {loading ? (
          <Skeleton width={60} height={32} sx={{ borderRadius: 1 }} />
        ) : (
          <Typography variant="h5" fontWeight={700} lineHeight={1.2} color="text.primary">
            {value}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.disabled" display="block">
            {sub}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <Box
      sx={{
        height: 6,
        borderRadius: 3,
        bgcolor: "rgba(27, 122, 61, 0.06)",
        overflow: "hidden",
        mt: 0.5,
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: `${Math.min(value, 100)}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 3,
          transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </Box>
  );
}

export function AdminDashboardClient({ departments, schoolYears, ppmpOptions, user }: Props) {
  const searchParams = useSearchParams();
  const [filterDept, setFilterDept] = useState(user.role === "dept_viewer" ? (user.department_id || "force-none-exist") : "");
  const [filterSY, setFilterSY] = useState("");
  const [filterPpmp, setFilterPpmp] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ppmpParam = searchParams.get("ppmp");
    if (ppmpParam) {
      setFilterPpmp(ppmpParam);
      const option = ppmpOptions.find((o) => o.id === ppmpParam);
      if (option) {
        if (option.department_id && user.role !== "dept_viewer") setFilterDept(option.department_id);
        if (option.school_year_id) setFilterSY(option.school_year_id);
      }
    }
  }, [searchParams, ppmpOptions, user.role]);

  const filteredPpmpOptions = ppmpOptions.filter((p) => {
    const matchDept = user.role === "dept_viewer" ? p.department_id === user.department_id : (!filterDept || p.department_id === filterDept);
    const matchSY = !filterSY || p.school_year_id === filterSY;
    return matchDept && matchSY;
  });

  const selectedPpmp = ppmpOptions.find((p) => p.id === filterPpmp);
  const effectivePpmp =
    selectedPpmp &&
    ((filterDept && selectedPpmp.department_id !== filterDept) ||
      (filterSY && selectedPpmp.school_year_id !== filterSY))
      ? ""
      : filterPpmp;

  useEffect(() => {
    setLoading(true);
    fetchDashboardStats({
      departmentId: filterDept,
      schoolYearId: filterSY,
      ppmpId: effectivePpmp,
    })
      .then(setStats)
      .finally(() => setLoading(false));
  }, [filterDept, filterSY, effectivePpmp]);

  async function handleDownloadAip() {
    const rows = await fetchAipReport({
      departmentId: filterDept,
      schoolYearId: filterSY,
      ppmpId: effectivePpmp,
    });

    const fmt = (n: number) =>
      Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    const wsData = [
      ["AIP Code", "Department", "Description", "Allocated", "Requested", "Balance"],
      ...rows.map((r) => [
        r.aip_code,
        r.department ?? "",
        r.description,
        fmt(r.allocated),
        fmt(r.requested),
        fmt(r.balance),
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws["!cols"] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 50 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AIP Report");
    XLSX.writeFile(wb, `AIP_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  }


  const statusRows = stats
    ? [
      { label: "Submitted", value: stats.submitted, color: "#1565c0" },
      {
        label: "Waiting Approval",
        value: stats.waiting_approval,
        color: "#e65100",
      },
      { label: "Approved", value: stats.approved, color: "#2e7d32" },
      {
        label: "Training Ongoing",
        value: stats.training_ongoing,
        color: "#6a1b9a",
      },
      {
        label: "Pending Completion Docs",
        value: stats.pending_completion_docs,
        color: "#f9a825",
      },
      {
        label: "Pending Completion Approval",
        value: stats.pending_completion_approval,
        color: "#f57f17",
      },
      { label: "Completed", value: stats.completed, color: "#1b5e20" },
      { label: "Rejected", value: stats.rejected, color: "#b71c1c" },
    ]
    : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Overview of training requests and budget utilization.
        </Typography>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 4,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        {user.role !== "dept_viewer" && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel shrink>Department</InputLabel>
            <Select
              value={filterDept}
              label="Department"
              displayEmpty
              onChange={(e) => setFilterDept(e.target.value)}
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
        )}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel shrink>School Year</InputLabel>
          <Select
            value={filterSY}
            label="School Year"
            displayEmpty
            onChange={(e) => setFilterSY(e.target.value)}
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

        <FormControl size="small" sx={{ minWidth: 320 }}>
          <InputLabel shrink>PPMP</InputLabel>
          <Select
            value={effectivePpmp}
            label="PPMP"
            displayEmpty
            onChange={(e) => setFilterPpmp(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All PPMP</MenuItem>
            {filteredPpmpOptions.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.ppa} - {p.aip_code}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<DownloadOutlined />}
          onClick={handleDownloadAip}
          color="primary"
          sx={{ borderRadius: 2.5 }}
        >
          Download AIP Report
        </Button>
      </Box>

      {/* Top stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Requests"
            value={stats?.total_requests ?? 0}
            icon={<ArticleOutlined />}
            color="#1565c0"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Completed"
            value={stats?.completed ?? 0}
            icon={<CheckCircleOutlined />}
            color="#2e7d32"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Pending Actions"
            value={
              stats
                ? stats.submitted +
                stats.waiting_approval +
                stats.pending_completion_docs +
                stats.pending_completion_approval
                : 0
            }
            icon={<PendingActionsOutlined />}
            color="#e65100"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Rejected"
            value={stats?.rejected ?? 0}
            icon={<CancelOutlined />}
            color="#b71c1c"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Status breakdown */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              height: "100%",
            }}
          >
            <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 2.5 }}>
              Request Status Breakdown
            </Typography>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={36} sx={{ mb: 1 }} />
              ))
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
                {statusRows.map(({ label, value, color }) => (
                  <Box key={label}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.3,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={color}
                      >
                        {value}
                        {stats && stats.total_requests > 0 && (
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.disabled"
                            sx={{ ml: 0.5 }}
                          >
                            ({((value / stats.total_requests) * 100).toFixed(0)}
                            %)
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                    <ProgressBar
                      value={
                        stats && stats.total_requests > 0
                          ? (value / stats.total_requests) * 100
                          : 0
                      }
                      color={color}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Budget */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              height: "100%",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}
            >
              <AccountBalanceWalletOutlined sx={{ color: "primary.main" }} />
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Budget Overview
              </Typography>
            </Box>

            {loading ? (
              <Skeleton height={120} />
            ) : (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}
                    sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                    Total Allocated Budget (PPMP)
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.dark" sx={{ mt: 0.5 }}>
                    {fmt(stats?.total_budget ?? 0)}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Utilized */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Utilized (Completed)</Typography>
                    <Typography variant="body2" fontWeight={700} color="#2e7d32">
                      {stats && stats.total_budget > 0
                        ? ((stats.utilized_budget / stats.total_budget) * 100).toFixed(1)
                        : "0.0"}%
                    </Typography>
                  </Box>
                  <ProgressBar
                    value={stats && stats.total_budget > 0
                      ? (stats.utilized_budget / stats.total_budget) * 100
                      : 0}
                    color="#2e7d32"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    {fmt(stats?.utilized_budget ?? 0)}
                  </Typography>
                </Box>

                {/* In Progress */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">In Progress</Typography>
                    <Typography variant="body2" fontWeight={700} color="#6a1b9a">
                      {stats && stats.total_budget > 0
                        ? ((stats.in_progress_budget / stats.total_budget) * 100).toFixed(1)
                        : "0.0"}%
                    </Typography>
                  </Box>
                  <ProgressBar
                    value={stats && stats.total_budget > 0
                      ? (stats.in_progress_budget / stats.total_budget) * 100
                      : 0}
                    color="#6a1b9a"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    {fmt(stats?.in_progress_budget ?? 0)}
                  </Typography>
                </Box>

                {/* Remaining */}
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Remaining</Typography>
                    <Typography variant="body2" fontWeight={700} color="#e65100">
                      {stats && stats.total_budget > 0
                        ? (((stats.total_budget - stats.utilized_budget - stats.in_progress_budget) / stats.total_budget) * 100).toFixed(1)
                        : "0.0"}%
                    </Typography>
                  </Box>
                  <ProgressBar
                    value={stats && stats.total_budget > 0
                      ? ((stats.total_budget - stats.utilized_budget - stats.in_progress_budget) / stats.total_budget) * 100
                      : 0}
                    color="#e65100"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    {fmt((stats?.total_budget ?? 0) - (stats?.utilized_budget ?? 0) - (stats?.in_progress_budget ?? 0))}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3 }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}
            >
              <HourglassEmptyOutlined sx={{ color: "primary.main" }} />
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Training Type Distribution
              </Typography>
            </Box>

            {loading ? (
              <Skeleton height={200} />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexWrap: "wrap",
                }}
              >
                <PieChart width={200} height={200}>
                  <Pie
                    data={[
                      { name: "External", value: stats?.external_count || 0 },
                      { name: "In-house", value: stats?.inhouse_count || 0 },
                    ]}
                    cx={95}
                    cy={95}
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={
                      stats?.external_count && stats?.inhouse_count ? 3 : 0
                    }
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#1565c0" />
                    <Cell fill="#6a1b9a" />
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}`, `${name}`]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e8f5e9",
                      fontSize: 13,
                    }}
                  />
                </PieChart>

                {/* Legend */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[
                    {
                      label: "External",
                      value: stats?.external_count ?? 0,
                      color: "#1565c0",
                      bg: "#e3f2fd",
                      border: "#bbdefb",
                    },
                    {
                      label: "In-house",
                      value: stats?.inhouse_count ?? 0,
                      color: "#6a1b9a",
                      bg: "#f3e5f5",
                      border: "#e1bee7",
                    },
                  ].map(({ label, value, color, bg, border }) => (
                    <Box
                      key={label}
                      sx={{ display: "flex", alignItems: "center", gap: 2 }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: color,
                          flexShrink: 0,
                        }}
                      />
                      <Box
                        sx={{
                          px: 2.5,
                          py: 1.2,
                          borderRadius: 2,
                          bgcolor: bg,
                          border: `1px solid ${border}`,
                          minWidth: 140,
                        }}
                      >
                        <Typography variant="h5" fontWeight={700} color={color}>
                          {value}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={color}
                          fontWeight={600}
                        >
                          {label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stats && stats.total_requests > 0
                            ? `${((value / stats.total_requests) * 100).toFixed(1)}% of total`
                            : "0% of total"}
                        </Typography>
                      </Box>
                    </Box>
                  ))}

                  <Typography variant="caption" color="text.disabled">
                    Total: {stats?.total_requests ?? 0} requests
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>

        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, height: "100%" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              <TrendingUpOutlined sx={{ color: "primary.main" }} />
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Monthly Request Trends
              </Typography>
            </Box>

            {loading ? (
              <Skeleton height={300} />
            ) : !stats?.monthly_trends?.length ? (
              <Box sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="body2" color="text.disabled">No data available</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={stats.monthly_trends}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e8f5e9", fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16 }} />
                  <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#1565c0" strokeWidth={2.5} dot={{ r: 4, fill: "#1565c0" }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#2e7d32" strokeWidth={2.5} dot={{ r: 4, fill: "#2e7d32" }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#b71c1c" strokeWidth={2.5} dot={{ r: 4, fill: "#b71c1c" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
