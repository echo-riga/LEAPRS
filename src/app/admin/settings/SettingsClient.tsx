"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Switch,
  Divider,
  Button,
  TextField,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { SaveOutlined, AddCircleOutlined } from "@mui/icons-material";

const toggleSettings = [
  {
    key: "systemNotifications",
    label: "System Notifications",
    description: "Receive alerts directly inside the web platform",
    inProgress: true,
  },
  {
    key: "maintenanceMode",
    label: "Maintenance Mode",
    description: "Temporarily restrict access for non-admin users",
    inProgress: true,
  },
];

const ppmpFieldsMock = [
  { name: "AIP Code", type: "Text", required: "Yes", source: "System" },
  { name: "School Year", type: "Dropdown (Select)", required: "Yes", source: "System" },
  { name: "Responsible Department", type: "Dropdown (Select)", required: "Yes", source: "System" },
  { name: "PPA Name", type: "Text", required: "Yes", source: "System" },
  { name: "Budget Allocation", type: "Number", required: "Yes", source: "System" },
  { name: "PPA Owner", type: "Text", required: "No", source: "System" },
  { name: "Initiative Level", type: "Text", required: "No", source: "System" },
  { name: "MFO Category", type: "Text", required: "No", source: "System" },
  { name: "Pillar", type: "Text", required: "No", source: "System" },
  { name: "SDG Coding", type: "Text", required: "No", source: "System" },
  { name: "Joint Initiative", type: "Text", required: "No", source: "System" },
  { name: "Planned Outputs", type: "Text (Multiline)", required: "No", source: "System" },
  { name: "Success Indicator", type: "Text (Multiline)", required: "No", source: "System" },
  { name: "Milestone", type: "Text (Multiline)", required: "No", source: "System" },
  { name: "Target Implementation", type: "Text", required: "No", source: "System" },
];

const requestFilesMock = [
  { name: "PPMP Allocation Linkage", description: "Association with a valid PPMP reference", required: "Yes", type: "System Select" },
  { name: "Budget Request Document", description: "Proof of PPMP budget request details", required: "Yes", type: "File (.pdf, .jpg)" },
  { name: "Training Design / Proposal", description: "Core proposal document for the seminar", required: "Yes", type: "File (.pdf, .docx)" },
  { name: "List of Participants", description: "Target employee participant registry", required: "No", type: "File (.xlsx, .pdf)" },
];

export function AdminSettingsClient() {
  const [toggles, setToggles] = useState({
    systemNotifications: false,
    maintenanceMode: false,
  });

  function handleToggle(key: string) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Configure system configurations and manage preference layouts
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Side: General preferences */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Toggle Settings */}
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 1.5, letterSpacing: 1.5, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}
          >
            Preferences
          </Typography>
          <Box sx={{ position: "relative", mb: 4 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid #e8f5e9",
              }}
            >
              <List disablePadding>
                {toggleSettings.map((setting, index) => (
                  <Box key={setting.key}>
                    <ListItem
                      sx={{
                        px: 3,
                        py: 2.5,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background 0.2s ease",
                        "&:hover": {
                          bgcolor: "rgba(27, 122, 61, 0.02)",
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography fontWeight={600} color="text.primary">
                              {setting.label}
                            </Typography>
                            {setting.inProgress && (
                              <Chip
                                label="In Progress"
                                size="small"
                                variant="outlined"
                                color="warning"
                                sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={setting.description}
                        slotProps={{
                          secondary: { fontSize: 12, color: "text.secondary", sx: { mt: 0.5 } },
                        }}
                      />
                      <Switch
                        color="success"
                        checked={toggles[setting.key as keyof typeof toggles]}
                        onChange={() => handleToggle(setting.key)}
                        disabled={setting.inProgress}
                      />
                    </ListItem>
                    {index < toggleSettings.length - 1 && <Divider sx={{ borderColor: "#e8f5e9" }} />}
                  </Box>
                ))}
              </List>
            </Paper>

            {/* Overlay */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(240, 240, 240, 0.35)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
              }}
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 1,
                  bgcolor: "#e65100",
                  color: "white",
                  borderRadius: 2.5,
                  boxShadow: "0 4px 16px rgba(230, 81, 0, 0.2)",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Feature In Progress
              </Box>
            </Box>
          </Box>

          {/* App Info */}
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 1.5, letterSpacing: 1.5, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}
          >
            Application Information
          </Typography>
          <Paper
            elevation={0}
            sx={{ borderRadius: 3, p: 3, border: "1px solid #e8f5e9", mb: 4 }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="App Name"
                defaultValue="LEAPRS"
                fullWidth
                variant="standard"
              />
              <TextField
                label="Support Email"
                defaultValue="support@leaprs.com"
                fullWidth
                variant="standard"
              />
              <Button
                variant="contained"
                startIcon={<SaveOutlined />}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: 2,
                  bgcolor: "#2e7d32",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#1b5e20" },
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Advanced configurations (Mockups) */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* PPMP Fields Config */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ letterSpacing: 1.5, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}
            >
              PPMP Form Fields Configuration
            </Typography>
            <Chip
              label="In Progress"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 700, height: 20 }}
            />
          </Box>
          <Box sx={{ position: "relative", mb: 4 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e8f5e9",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 2.5, bgcolor: "rgba(27, 122, 61, 0.02)" }}>
                <Typography variant="body2" color="text.secondary">
                  Configure validate rules and swap input types for PPMP entry creations.
                </Typography>
              </Box>
              <Divider sx={{ borderColor: "#e8f5e9" }} />
              <TableContainer sx={{ maxHeight: 300, overflow: "auto" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "white" }}>Field Label</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "white" }}>Input Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "white" }}>Required</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "white" }}>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ppmpFieldsMock.map((field) => (
                      <TableRow key={field.name} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{field.name}</TableCell>
                        <TableCell color="text.secondary">{field.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={field.required === "Yes" ? "Required" : "Optional"}
                            size="small"
                            color={field.required === "Yes" ? "success" : "default"}
                            variant="outlined"
                            sx={{ height: 18, fontSize: 10 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={field.source} size="small" sx={{ height: 18, fontSize: 10 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider sx={{ borderColor: "#e8f5e9" }} />
              <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  color="success"
                  disabled
                  size="small"
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                  Add Custom Field (In Progress)
                </Button>
              </Box>
            </Paper>

            {/* Overlay */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(240, 240, 240, 0.35)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 1.5,
                  bgcolor: "#e65100",
                  color: "white",
                  borderRadius: 2.5,
                  boxShadow: "0 4px 16px rgba(230, 81, 0, 0.2)",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Feature In Progress
              </Box>
            </Box>
          </Box>

          {/* Requests Files Config */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ letterSpacing: 1.5, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}
            >
              Training Request Document Uploads
            </Typography>
            <Chip
              label="In Progress"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 700, height: 20 }}
            />
          </Box>
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e8f5e9",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 2.5, bgcolor: "rgba(27, 122, 61, 0.02)" }}>
                <Typography variant="body2" color="text.secondary">
                  Configure document requirements and upload validations for training request submissions.
                </Typography>
              </Box>
              <Divider sx={{ borderColor: "#e8f5e9" }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Requirement</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Required</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requestFilesMock.map((file) => (
                      <TableRow key={file.name} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{file.name}</TableCell>
                        <TableCell color="text.secondary" sx={{ fontSize: 12 }}>{file.description}</TableCell>
                        <TableCell>
                          <Chip
                            label={file.required === "Yes" ? "Required" : "Optional"}
                            size="small"
                            color={file.required === "Yes" ? "success" : "default"}
                            variant="outlined"
                            sx={{ height: 18, fontSize: 10 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider sx={{ borderColor: "#e8f5e9" }} />
              <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  color="success"
                  disabled
                  size="small"
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                  Add Document Requirement (In Progress)
                </Button>
              </Box>
            </Paper>

            {/* Overlay */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(240, 240, 240, 0.35)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 1.5,
                  bgcolor: "#e65100",
                  color: "white",
                  borderRadius: 2.5,
                  boxShadow: "0 4px 16px rgba(230, 81, 0, 0.2)",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Feature In Progress
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
