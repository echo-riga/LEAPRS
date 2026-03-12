"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton,
} from "@mui/material";
import { KeyboardArrowDownOutlined, LogoutOutlined } from "@mui/icons-material";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

type Props = {
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export function UserTopbar({ user }: Props) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <Box
      sx={{
        height: 64,
        bgcolor: "white",
        borderBottom: "1px solid #e8f5e9",
        display: "flex",
        alignItems: "center",
        px: 4,
        gap: 2,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mr: "auto" }}>
        <Image
          src="/login-logo.png"
          alt="LEAPRS"
          width={30}
          height={30}
          style={{ objectFit: "contain" }}
        />
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ color: "#1b5e20", letterSpacing: 1 }}
        >
          LEAPRS
        </Typography>
      </Box>

      {/* Avatar + dropdown */}
      <Box
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          px: 1,
          py: 0.5,
          borderRadius: 2,
          "&:hover": { bgcolor: "#f1f8e9" },
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "#2e7d32",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <Typography
            variant="body2"
            fontWeight={600}
            color="#1a1a1a"
            lineHeight={1.2}
          >
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Employee
          </Typography>
        </Box>
        <KeyboardArrowDownOutlined
          fontSize="small"
          sx={{ color: "text.disabled" }}
        />
      </Box>

      {/* Dropdown menu */}
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            elevation: 2,
            sx: { mt: 1, minWidth: 180, borderRadius: 2 },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" fontWeight={600}>
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          sx={{ gap: 1.5, color: "#c62828", py: 1.2 }}
        >
          <LogoutOutlined fontSize="small" />
          <Typography variant="body2">Sign out</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
