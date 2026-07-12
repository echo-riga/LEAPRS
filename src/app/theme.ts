"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#1b7a3d",
      light: "#43a047",
      dark: "#145a2c",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#d4a017",
      light: "#f0c040",
      dark: "#a67c00",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f5f7f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a2e1a",
      secondary: "#5a6e5a",
    },
    divider: "rgba(27, 122, 61, 0.08)",
    success: {
      main: "#2e7d32",
      light: "#4caf50",
      dark: "#1b5e20",
    },
    error: {
      main: "#c62828",
      light: "#ef5350",
      dark: "#b71c1c",
    },
    warning: {
      main: "#e65100",
      light: "#ff9800",
      dark: "#bf360c",
    },
    info: {
      main: "#1565c0",
      light: "#42a5f5",
      dark: "#0d47a1",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontWeight: 700, letterSpacing: "-0.005em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, letterSpacing: "0.02em" },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
    caption: {
      letterSpacing: "0.02em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(27, 122, 61, 0.2) transparent",
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(27, 122, 61, 0.2)",
            borderRadius: 3,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(27, 122, 61, 0.08)",
          transition: "box-shadow 0.25s ease, border-color 0.25s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "8px 20px",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(27, 122, 61, 0.2)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        contained: {
          boxShadow: "0 2px 8px rgba(27, 122, 61, 0.15)",
          "&:hover": {
            boxShadow: "0 4px 16px rgba(27, 122, 61, 0.25)",
          },
        },
        outlined: {
          borderWidth: "1.5px",
          "&:hover": {
            borderWidth: "1.5px",
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            transition: "box-shadow 0.2s ease",
            "&:hover": {
              boxShadow: "0 0 0 3px rgba(27, 122, 61, 0.06)",
            },
            "&.Mui-focused": {
              boxShadow: "0 0 0 3px rgba(27, 122, 61, 0.12)",
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(27, 122, 61, 0.08)",
          transition: "all 0.25s ease",
          "&:hover": {
            borderColor: "rgba(27, 122, 61, 0.15)",
            boxShadow: "0 8px 24px rgba(27, 122, 61, 0.08)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: "#1a2e1a",
          borderBottomColor: "rgba(27, 122, 61, 0.12)",
        },
        root: {
          borderBottomColor: "rgba(27, 122, 61, 0.06)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.12)",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(27, 122, 61, 0.08)",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: "0.75rem",
          fontWeight: 500,
          padding: "6px 12px",
        },
      },
    },
  },
});