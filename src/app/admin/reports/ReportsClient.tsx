"use client";

import { Box, Typography, Paper, Grid, Button } from "@mui/material";
import { AssessmentOutlined, DownloadOutlined } from "@mui/icons-material";

const reports = [
  {
    title: "Monthly Summary",
    description: "Overview of all activity this month",
  },
  {
    title: "User Activity",
    description: "Detailed user login and action logs",
  },
  { title: "System Logs", description: "Server and error logs for the system" },
];

export function AdminReportsClient() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          Reports
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          View and export system reports
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {reports.map((report) => (
          <Grid size={{ xs: 12, md: 4 }} key={report.title}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: "white",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                transition: "all 0.25s ease",
                "&:hover": {
                  borderColor: "rgba(27, 122, 61, 0.2)",
                  boxShadow: "0 8px 24px rgba(27, 122, 61, 0.08)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box
                sx={{
                  background:
                    "linear-gradient(135deg, rgba(27, 122, 61, 0.08), rgba(27, 122, 61, 0.04))",
                  borderRadius: 2.5,
                  p: 1.5,
                  display: "flex",
                  width: "fit-content",
                  color: "primary.main",
                  border: "1px solid rgba(27, 122, 61, 0.06)",
                }}
              >
                <AssessmentOutlined />
              </Box>
              <Box>
                <Typography fontWeight={600} color="text.primary" sx={{ mb: 0.5 }}>
                  {report.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {report.description}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadOutlined />}
                color="primary"
                sx={{
                  mt: "auto",
                  borderRadius: 2,
                }}
              >
                Export
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
