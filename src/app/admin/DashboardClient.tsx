"use client";

import { useEffect, useState } from "react";
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
} from "@mui/material";
import {
  ArticleOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  HourglassEmptyOutlined,
  AccountBalanceWalletOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import { fetchDashboardStats } from "./action";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
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
};

type Props = {
  departments: { id: string; name: string }[];
  schoolYears: { id: string; name: string }[];
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
        border: "1px solid #e8f5e9",
        bgcolor: "white",
        display: "flex",
        alignItems: "center",
        gap: 2,
        height: "100%",
      }}
    >
      <Box
        sx={{
          bgcolor: `${color}18`,
          borderRadius: 2,
          p: 1.4,
          display: "flex",
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        {loading ? (
          <Skeleton width={60} height={32} />
        ) : (
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            {value}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
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
        height: 8,
        borderRadius: 4,
        bgcolor: "#e8f5e9",
        overflow: "hidden",
        mt: 0.5,
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: `${Math.min(value, 100)}%`,
          bgcolor: color,
          borderRadius: 4,
          transition: "width 0.6s ease",
        }}
      />
    </Box>
  );
}

export function AdminDashboardClient({ departments, schoolYears }: Props) {
  const [filterDept, setFilterDept] = useState("");
  const [filterSY, setFilterSY] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDashboardStats({ departmentId: filterDept, schoolYearId: filterSY })
      .then(setStats)
      .finally(() => setLoading(false));
  }, [filterDept, filterSY]);

  const utilizedPct =
    stats && stats.total_budget > 0
      ? ((stats.utilized_budget / stats.total_budget) * 100).toFixed(1)
      : "0.0";

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
        <Typography variant="h4" fontWeight={700} color="#1b5e20">
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
              border: "1px solid #e8f5e9",
              height: "100%",
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5 }}>
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
              border: "1px solid #e8f5e9",
              height: "100%",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}
            >
              <AccountBalanceWalletOutlined sx={{ color: "#2e7d32" }} />
              <Typography variant="h6" fontWeight={600}>
                Budget Overview
              </Typography>
            </Box>

            {loading ? (
              <Skeleton height={120} />
            ) : (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    fontWeight={600}
                    sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                  >
                    Total Allocated Budget
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color="#1b5e20"
                    sx={{ mt: 0.5 }}
                  >
                    {fmt(stats?.total_budget ?? 0)}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3, borderColor: "#e8f5e9" }} />

                <Box sx={{ mb: 1.5 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Utilized (Completed)
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#2e7d32"
                    >
                      {utilizedPct}%
                    </Typography>
                  </Box>
                  <ProgressBar value={Number(utilizedPct)} color="#2e7d32" />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {fmt(stats?.utilized_budget ?? 0)}
                  </Typography>
                </Box>

                <Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Remaining
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#e65100"
                    >
                      {stats ? (100 - Number(utilizedPct)).toFixed(1) : "0.0"}%
                    </Typography>
                  </Box>
                  <ProgressBar
                    value={100 - Number(utilizedPct)}
                    color="#e65100"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {fmt(
                      (stats?.total_budget ?? 0) -
                        (stats?.utilized_budget ?? 0),
                    )}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid #e8f5e9" }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}
            >
              <HourglassEmptyOutlined sx={{ color: "#2e7d32" }} />
              <Typography variant="h6" fontWeight={600}>
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
      </Grid>
    </Box>
  );
}
