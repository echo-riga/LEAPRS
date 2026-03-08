import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";
import CssBaseline from "@mui/material/CssBaseline";

export const metadata: Metadata = {
  title: {
    default: "LEAPRS",
    template:
      "%s | LEAPRS - Lifelong Education Advancement Program Requisition System",
  },
  description:
    "LEAPRS is a system for managing training requests, approvals, budget requisitions, implementation monitoring, and post-completion documentation for Lifelong Education programs.",
  keywords: [
    "LEAPRS",
    "Lifelong Education Advancement Program",
    "Training Requisition System",
    "Training Management",
    "Strategic Planning",
    "PPMP",
    "Budget Monitoring",
  ],
  metadataBase: new URL("https://leaprs.vercel.app"),
  openGraph: {
    title: "LEAPRS - Lifelong Education Advancement Program Requisition System",
    description:
      "Manage training requests, approvals workflow, budgets, implementation tracking, and post-completion documents using LEAPRS.",
    url: "https://leaprs.vercel.app",
    siteName: "LEAPRS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
