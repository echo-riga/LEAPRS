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
} from "@mui/material";
import { SaveOutlined } from "@mui/icons-material";

const toggleSettings = [
  {
    key: "emailNotifications",
    label: "Email Notifications",
    description: "Receive alerts via email",
  },
  {
    key: "twoFactor",
    label: "Two Factor Authentication",
    description: "Require 2FA for all admins",
  },
  {
    key: "maintenanceMode",
    label: "Maintenance Mode",
    description: "Disable access for regular users",
  },
];

export function AdminSettingsClient() {
  const [toggles, setToggles] = useState({
    emailNotifications: false,
    twoFactor: false,
    maintenanceMode: false,
  });

  function handleToggle(key: string) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Configure system preferences
        </Typography>
      </Box>

      {/* Toggle Settings */}
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 1.5, letterSpacing: 1.5, fontSize: 11, fontWeight: 700 }}
      >
        SYSTEM
      </Typography>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          mb: 4,
        }}
      >
        <List disablePadding>
          {toggleSettings.map((setting, index) => (
            <Box key={setting.key}>
              <ListItem
                sx={{
                  px: 3,
                  py: 2,
                  transition: "background 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(27, 122, 61, 0.02)",
                  },
                }}
              >
                <ListItemText
                  primary={setting.label}
                  secondary={setting.description}
                  slotProps={{
                    primary: { fontWeight: 600, color: "text.primary" },
                    secondary: { fontSize: 13, color: "text.secondary" },
                  }}
                />
                <Switch
                  color="success"
                  checked={toggles[setting.key as keyof typeof toggles]}
                  onChange={() => handleToggle(setting.key)}
                />
              </ListItem>
              {index < toggleSettings.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Paper>

      {/* App Info */}
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 1.5, letterSpacing: 1.5, fontSize: 11, fontWeight: 700 }}
      >
        APPLICATION
      </Typography>
      <Paper
        elevation={0}
        sx={{ borderRadius: 3, p: 3, mb: 4 }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            label="App Name"
            defaultValue="LEAPRS"
            fullWidth
          />
          <TextField
            label="Support Email"
            defaultValue="support@leaprs.com"
            fullWidth
          />
          <Button
            variant="contained"
            startIcon={<SaveOutlined />}
            color="primary"
            sx={{
              alignSelf: "flex-start",
              borderRadius: 2.5,
            }}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
