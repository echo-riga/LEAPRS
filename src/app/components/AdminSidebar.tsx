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
        bgcolor: "#1b5e20",
        display: "flex",
        flexDirection: "column",
        py: 3,
        px: 2,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1, mb: 4 }}
      >
        <Image
          src="/login-logo.png"
          alt="LEAPRS"
          width={36}
          height={36}
          style={{ objectFit: "contain" }}
        />
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: "white", letterSpacing: 1 }}
        >
          LEAPRS
        </Typography>
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: "rgba(255,255,255,0.4)",
          px: 1,
          mb: 1,
          letterSpacing: 1.5,
        }}
      >
        NAVIGATION
      </Typography>

      {/* Nav Items */}
      <List
        disablePadding
        sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1.2,
                bgcolor: active ? "rgba(255,255,255,0.15)" : "transparent",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                transition: "background 0.2s",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: active ? "white" : "rgba(255,255,255,0.6)",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    fontSize: 14,
                    fontWeight: active ? 700 : 400,
                    color: active ? "white" : "rgba(255,255,255,0.7)",
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Bottom — profile + logout */}
      <Box sx={{ mt: "auto" }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />

        {/* Profile row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1,
            mb: 2,
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: "rgba(255,255,255,0.15)",
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ overflow: "hidden" }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                color: "white",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.5)" }}
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
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} LEAPRS
          </Typography>
          <Tooltip title="Sign out">
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{
                color: "rgba(255,255,255,0.5)",
                "&:hover": { color: "white" },
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
