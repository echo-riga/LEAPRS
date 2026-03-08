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
} from "@mui/material";
import {
  AddOutlined,
  CalendarMonthOutlined,
  BusinessOutlined,
  ArticleOutlined,
  CheckCircleOutlined,
  PendingActionsOutlined,
  CancelOutlined,
  InboxOutlined,
} from "@mui/icons-material";
import { useState } from "react";

// ── types (will be filled from DB later) ──────────────────────────────────────

export type PpmpSummary = {
  aip_code: string;
  ppa: string;
  department: string;
  pillar: string | null;
  target_quarter: string | null;
  target_month: string | null;
  target_year: string | null;
};

export type TrainingRequest = {
  id: string;
  aip_code: string;
  ppa: string;
  type: "External" | "In-house";
  status: "pending" | "approved" | "rejected" | "completed";
  submitted_at: string;
  remarks: string | null;
};

type Props = {
  user: {
    name: string;
    email: string;
    department: string | null;
  };
  ppmpEntries: PpmpSummary[];
  myRequests: TrainingRequest[];
};

// ── status meta ───────────────────────────────────────────────────────────────

const STATUS_META: Record<
  TrainingRequest["status"],
  {
    label: string;
    color: "warning" | "success" | "error" | "info";
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Pending Review",
    color: "warning",
    icon: <PendingActionsOutlined fontSize="small" />,
  },
  approved: {
    label: "Approved",
    color: "success",
    icon: <CheckCircleOutlined fontSize="small" />,
  },
  rejected: {
    label: "Rejected",
    color: "error",
    icon: <CancelOutlined fontSize="small" />,
  },
  completed: {
    label: "Completed",
    color: "info",
    icon: <CheckCircleOutlined fontSize="small" />,
  },
};

// ── greeting ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── ppmp card ─────────────────────────────────────────────────────────────────

function PpmpCard({
  entry,
  alreadyRequested,
  onRequest,
}: {
  entry: PpmpSummary;
  alreadyRequested: boolean;
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
          {entry.target_quarter && (
            <Chip
              label={entry.target_quarter}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BusinessOutlined sx={{ fontSize: 14, color: "text.disabled" }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {entry.department}
            </Typography>
          </Box>
          {entry.pillar && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ArticleOutlined sx={{ fontSize: 14, color: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {entry.pillar}
              </Typography>
            </Box>
          )}
          {(entry.target_month || entry.target_year) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonthOutlined
                sx={{ fontSize: 14, color: "text.disabled" }}
              />
              <Typography variant="caption" color="text.secondary">
                {[entry.target_month, entry.target_year]
                  .filter(Boolean)
                  .join(" ")}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <Divider sx={{ borderColor: "#f0f0f0" }} />

      <CardActions sx={{ px: 2.5, py: 1.5 }}>
        {alreadyRequested ? (
          <Chip
            label="Requested ✓"
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        ) : (
          <Button
            size="small"
            variant="contained"
            onClick={onRequest}
            sx={{
              bgcolor: "#2e7d32",
              "&:hover": { bgcolor: "#1b5e20" },
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Request This
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

// ── request row ───────────────────────────────────────────────────────────────

function RequestRow({ req }: { req: TrainingRequest }) {
  const meta = STATUS_META[req.status];
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1.5,
        px: 2,
        borderRadius: 2,
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

// ── main client ───────────────────────────────────────────────────────────────

export function DashboardClient({ user, ppmpEntries, myRequests }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState(0);

  const requestedCodes = new Set(myRequests.map((r) => r.aip_code));

  const pendingCount = myRequests.filter((r) => r.status === "pending").length;
  const approvedCount = myRequests.filter(
    (r) => r.status === "approved",
  ).length;

  return (
    <Box>
      {/* Greeting */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="#1b5e20">
          {getGreeting()}, {user.name.split(" ")[0]}!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {user.department
            ? `${user.department} · Browse available training programs below.`
            : "Browse available training programs and submit your requests."}
        </Typography>
      </Box>

      {/* Summary chips */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <Paper
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
          <PendingActionsOutlined sx={{ color: "#e65100", fontSize: 20 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1}>
              {pendingCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending
            </Typography>
          </Box>
        </Paper>
        <Paper
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
          <CheckCircleOutlined sx={{ color: "#2e7d32", fontSize: 20 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1}>
              {approvedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Approved
            </Typography>
          </Box>
        </Paper>
        <Paper
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
          <ArticleOutlined sx={{ color: "#1565c0", fontSize: 20 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1}>
              {myRequests.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Requests
            </Typography>
          </Box>
        </Paper>
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

      {/* Tab: Available Programs */}
      {tab === 0 && (
        <>
          {ppmpEntries.length === 0 ? (
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
                No training programs yet
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                maxWidth={320}
              >
                The Lifelong Head hasn&apos;t posted any PPMP entries yet. Check
                back later.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {ppmpEntries.map((entry) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={entry.aip_code}>
                  <PpmpCard
                    entry={entry}
                    alreadyRequested={requestedCodes.has(entry.aip_code)}
                    onRequest={() =>
                      router.push(
                        `/dashboard/requests/new?aip=${entry.aip_code}`,
                      )
                    }
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Tab: My Requests */}
      {tab === 1 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e8f5e9",
            overflow: "hidden",
          }}
        >
          {myRequests.length === 0 ? (
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
                No requests yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Browse available programs and submit your first request.
              </Typography>
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
            </Box>
          ) : (
            <Box sx={{ py: 1 }}>
              {myRequests.map((req, i) => (
                <Box key={req.id}>
                  <RequestRow req={req} />
                  {i < myRequests.length - 1 && (
                    <Divider sx={{ mx: 2, borderColor: "#f0f0f0" }} />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
