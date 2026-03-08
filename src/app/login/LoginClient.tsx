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

export function LoginClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const result = await authClient.signIn.email({
      email: form.get("email") as string,
      password: form.get("password") as string,
    });

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
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* LEFT — background image panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1,
          position: "relative",
          flexDirection: "column",
          justifyContent: "flex-end",
          p: 6,
        }}
      >
        <Image
          src="/login-bg.png"
          alt="background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
          }}
        />
        <Box sx={{ position: "relative", zIndex: 1, color: "white" }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            LEAPRS
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 400 }}>
            Lifelong Education Advancement Program Requisition System
          </Typography>
        </Box>
      </Box>

      {/* RIGHT — login form panel */}
      <Box
        sx={{
          width: { xs: "100%", md: 480 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 3, sm: 6 },
          py: 6,
          bgcolor: "white",
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Image
            src="/login-logo.png"
            alt="LEAF logo"
            width={40}
            height={40}
            style={{ objectFit: "contain" }}
          />
          <Typography variant="h6" fontWeight={700} color="primary">
            LEAPRS
          </Typography>
        </Box>

        <Typography variant="h5" fontWeight={700} gutterBottom>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Enter your credentials to access your account
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <Email sx={{ color: "primary.main", mb: 0.5 }} />
            <TextField
              name="email"
              label="Email address"
              type="email"
              required
              fullWidth
              autoComplete="email"
              variant="standard"
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <Lock sx={{ color: "primary.main", mb: 0.5 }} />
            <TextField
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              required
              fullWidth
              autoComplete="current-password"
              variant="standard"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
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
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            size="large"
            sx={{ mt: 2, py: 1.5, fontSize: "1rem" }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Sign in"
            )}
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ mt: "auto", pt: 6, textAlign: "center" }}
        >
          © {new Date().getFullYear()} LEAPRS. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
