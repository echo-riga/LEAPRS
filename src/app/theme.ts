"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#2e7d32", // deep green
      light: "#4caf50",
      dark: "#1b5e20",
    },
    background: {
      default: "#f1f8e9",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
});
