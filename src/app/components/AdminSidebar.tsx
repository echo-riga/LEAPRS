"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
} from "@mui/material";
import {
  DashboardOutlined,
  PeopleOutlined,
  AssessmentOutlined,
  SettingsOutlined,
  LogoutOutlined,
  ArticleOutlined,
  ListAltOutlined,
} from "@mui/icons-material";
import { authClient } from "@/lib/auth-client";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: <DashboardOutlined /> },
  { label: "PPMP", href: "/admin/ppmp", icon: <ArticleOutlined /> },
  { label: "Requests", href: "/admin/requests", icon: <ListAltOutlined /> },
  { label: "Users", href: "/admin/users", icon: <PeopleOutlined /> },
  { label: "Reports", href: "/admin/reports", icon: <AssessmentOutlined /> },
  { label: "Settings", href: "/admin/settings", icon: <SettingsOutlined /> },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Lifelong Head",
  user: "Employee",
};

type Props = {
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Box
      sx={{
        width: 260,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        background: "linear-gradient(180deg, #0d4f1c 0%, #145a2c 50%, #0a3a14 100%)",
        display: "flex",
        flexDirection: "column",
        py: 3,
        px: 2,
        zIndex: 100,
        borderRight: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Logo */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1, mb: 4 }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            bgcolor: "rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Image
            src="/login-logo.png"
            alt="LEAPRS"
            width={24}
            height={24}
            style={{ objectFit: "contain" }}
          />
        </Box>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: "white", letterSpacing: 1.5 }}
        >
          LEAPRS
        </Typography>
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: "rgba(255,255,255,0.3)",
          px: 1,
          mb: 1,
          letterSpacing: 2,
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        NAVIGATION
      </Typography>

      {/* Nav Items */}
      <List
        disablePadding
        sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                borderRadius: 2.5,
                px: 2,
                py: 1.2,
                position: "relative",
                bgcolor: active ? "rgba(255,255,255,0.12)" : "transparent",
                "&::before": active
                  ? {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: "20%",
                      bottom: "20%",
                      width: 3,
                      borderRadius: 2,
                      bgcolor: "#d4a017",
                    }
                  : {},
                "&:hover": {
                  bgcolor: active
                    ? "rgba(255,255,255,0.14)"
                    : "rgba(255,255,255,0.06)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: active ? "white" : "rgba(255,255,255,0.45)",
                  transition: "color 0.2s ease",
                  "& .MuiSvgIcon-root": {
                    fontSize: 20,
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 400,
                    color: active ? "white" : "rgba(255,255,255,0.6)",
                    sx: { transition: "color 0.2s ease, font-weight 0.2s ease" },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Bottom — profile + logout */}
      <Box sx={{ mt: "auto" }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />

        {/* Profile row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1,
            mb: 2,
            py: 1,
            borderRadius: 2.5,
            transition: "background 0.2s ease",
            "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              background: "linear-gradient(135deg, #d4a017 0%, #a67c00 100%)",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ overflow: "hidden", flex: 1 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                color: "white",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: 13,
              }}
            >
              {user.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}
            >
              {ROLE_LABELS[user.role] ?? user.role}
            </Typography>
          </Box>
        </Box>

        {/* Copyright + logout */}
        <Box
          sx={{
            px: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}
          >
            © {new Date().getFullYear()} LEAPRS
          </Typography>
          <Tooltip title="Sign out" arrow>
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{
                color: "rgba(255,255,255,0.35)",
                transition: "all 0.2s ease",
                "&:hover": {
                  color: "#ef5350",
                  bgcolor: "rgba(239, 83, 80, 0.1)",
                },
              }}
            >
              <LogoutOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
