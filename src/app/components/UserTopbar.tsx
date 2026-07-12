"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
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
        bgcolor: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(27, 122, 61, 0.06)",
        boxShadow: "0 1px 8px rgba(0, 0, 0, 0.03)",
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
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "9px",
            bgcolor: "rgba(27, 122, 61, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(27, 122, 61, 0.08)",
          }}
        >
          <Image
            src="/login-logo.png"
            alt="LEAPRS"
            width={22}
            height={22}
            style={{ objectFit: "contain" }}
          />
        </Box>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ color: "#145a2c", letterSpacing: 1 }}
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
          px: 1.5,
          py: 0.5,
          borderRadius: 2.5,
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: "rgba(27, 122, 61, 0.04)",
          },
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            background: "linear-gradient(135deg, #1b7a3d 0%, #145a2c 100%)",
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
            color="#1a2e1a"
            lineHeight={1.2}
          >
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            Employee
          </Typography>
        </Box>
        <KeyboardArrowDownOutlined
          fontSize="small"
          sx={{ color: "text.disabled", fontSize: 18 }}
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
            elevation: 0,
            sx: {
              mt: 1.5,
              minWidth: 200,
              borderRadius: 3,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(27, 122, 61, 0.06)",
              overflow: "visible",
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 20,
                width: 10,
                height: 10,
                bgcolor: "white",
                transform: "translateY(-50%) rotate(45deg)",
                border: "1px solid rgba(27, 122, 61, 0.06)",
                borderBottom: "none",
                borderRight: "none",
              },
            },
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          sx={{
            gap: 1.5,
            color: "#c62828",
            py: 1.2,
            mx: 1,
            my: 0.5,
            borderRadius: 2,
            transition: "all 0.15s ease",
            "&:hover": {
              bgcolor: "rgba(198, 40, 40, 0.06)",
            },
          }}
        >
          <LogoutOutlined fontSize="small" />
          <Typography variant="body2" fontWeight={500}>
            Sign out
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
