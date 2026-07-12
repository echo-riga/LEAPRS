"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Email, Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import Image from "next/image";

/* ── floating shape (CSS-only decorative element) ─────────────────────────── */
function FloatingShape({
  size,
  top,
  left,
  delay,
  color,
}: {
  size: number;
  top: string;
  left: string;
  delay: number;
  color: string;
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size > 80 ? "30%" : "50%",
        background: color,
        top,
        left,
        opacity: 0,
        animation: `floatShape 20s ease-in-out ${delay}s infinite, fadeShapeIn 1s ease ${delay}s forwards`,
        "@keyframes floatShape": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-20px) rotate(120deg)" },
          "66%": { transform: "translateY(10px) rotate(240deg)" },
        },
        "@keyframes fadeShapeIn": {
          to: { opacity: 1 },
        },
      }}
    />
  );
}

export function LoginClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const creds = {
      email: form.get("email") as string,
      password: form.get("password") as string,
    };

    let result = await authClient.signIn.email(creds);

    // Retry once on first-call failure
    if (result.error) {
      await new Promise((r) => setTimeout(r, 500));
      result = await authClient.signIn.email(creds);
    }

    if (result.error) {
      setError(result.error.message ?? "Invalid email or password");
      setLoading(false);
      return;
    }

    const role = result.data?.user?.role;
    if (role === "admin") router.push("/admin");
    else router.push("/user");
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#f5f7f5",
      }}
    >
      {/* LEFT — animated gradient panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1,
          position: "relative",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #0d4f1c 0%, #1b7a3d 40%, #145a2c 70%, #0a3a14 100%)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 30% 20%, rgba(67, 160, 71, 0.3) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(212, 160, 23, 0.15) 0%, transparent 50%)",
          },
        }}
      >
        {/* Floating shapes */}
        <FloatingShape size={120} top="10%" left="15%" delay={0} color="rgba(255,255,255,0.04)" />
        <FloatingShape size={80} top="60%" left="75%" delay={2} color="rgba(255,255,255,0.05)" />
        <FloatingShape size={60} top="30%" left="65%" delay={4} color="rgba(212,160,23,0.08)" />
        <FloatingShape size={100} top="75%" left="20%" delay={1} color="rgba(255,255,255,0.03)" />
        <FloatingShape size={40} top="15%" left="80%" delay={3} color="rgba(67,160,71,0.12)" />
        <FloatingShape size={50} top="50%" left="40%" delay={5} color="rgba(255,255,255,0.04)" />

        {/* Content */}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            px: 6,
            maxWidth: 520,
            animation: "slideInLeft 0.8s ease-out",
            "@keyframes slideInLeft": {
              from: { opacity: 0, transform: "translateX(-30px)" },
              to: { opacity: 1, transform: "translateX(0)" },
            },
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "20px",
              bgcolor: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 4,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Image
              src="/login-logo.png"
              alt="LEAPRS logo"
              width={44}
              height={44}
              style={{ objectFit: "contain" }}
            />
          </Box>

          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              color: "white",
              mb: 2,
              letterSpacing: "0.04em",
            }}
          >
            LEAPRS
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "rgba(255,255,255,0.75)",
              mb: 6,
              lineHeight: 1.7,
              fontSize: "1.05rem",
            }}
          >
            Lifelong Education Advancement Program
            <br />
            Requisition System
          </Typography>

          {/* Feature highlights */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 2,
            }}
          >
            {[
              "Streamline training requests & approvals",
              "Track budgets and monitor progress",
              "Manage post-completion documentation",
            ].map((text, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  opacity: 0,
                  animation: `fadeFeatureIn 0.5s ease ${0.8 + i * 0.15}s forwards`,
                  "@keyframes fadeFeatureIn": {
                    to: { opacity: 1 },
                  },
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "#d4a017",
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.6)", textAlign: "left" }}
                >
                  {text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Bottom copyright */}
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            bottom: 32,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          © {new Date().getFullYear()} LEAPRS. All rights reserved.
        </Typography>
      </Box>

      {/* RIGHT — login form panel */}
      <Box
        sx={{
          width: { xs: "100%", md: 520 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 3, sm: 6 },
          py: 6,
          bgcolor: "#f5f7f5",
          position: "relative",
        }}
      >
        {/* Form card with glassmorphism */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 400,
            animation: "slideInRight 0.6s ease-out",
            "@keyframes slideInRight": {
              from: { opacity: 0, transform: "translateY(20px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {/* Mobile logo (only on small screens) */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1.5,
              mb: 4,
              justifyContent: "center",
            }}
          >
            <Image
              src="/login-logo.png"
              alt="LEAPRS logo"
              width={36}
              height={36}
              style={{ objectFit: "contain" }}
            />
            <Typography variant="h6" fontWeight={700} color="primary">
              LEAPRS
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "white",
              borderRadius: 4,
              p: { xs: 3.5, sm: 5 },
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(27, 122, 61, 0.06)",
            }}
          >
            <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
              Welcome back
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              Sign in to access your account
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
            >
              <TextField
                name="email"
                label="Email address"
                type="email"
                required
                fullWidth
                autoComplete="email"
                variant="outlined"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: "text.disabled", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                fullWidth
                autoComplete="current-password"
                variant="outlined"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: "text.disabled", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: 2.5,
                    "& .MuiAlert-message": { fontSize: 13 },
                  }}
                >
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                size="large"
                sx={{
                  mt: 1,
                  py: 1.5,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  borderRadius: 2.5,
                  background: "linear-gradient(135deg, #1b7a3d 0%, #145a2c 100%)",
                  boxShadow: "0 4px 14px rgba(27, 122, 61, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #1f8c45 0%, #1b7a3d 100%)",
                    boxShadow: "0 6px 20px rgba(27, 122, 61, 0.4)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Sign in"
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
