// src/app/dashboard/actions.ts
"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Types matching your DashboardClient
export type PpmpSummary = {
  aip_code: string;
  ppa: string;
  department: string;
  pillar: string | null;
  target_quarter: string | null;
  target_month: string | null;
  target_year: string | null;
};

export type TrainingRequest = {
  id: string;
  aip_code: string;
  ppa: string;
  type: "External" | "In-house";
  status: "pending" | "approved" | "rejected" | "completed";
  submitted_at: string;
  remarks: string | null;
};

/**
 * Get current user's session and info
 */
async function getUserSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

/**
 * Fetch PPMP entries available for the current user
 */
export async function getAvailablePpmpEntries() {
  try {
    const session = await getUserSession();

    const entries = (await sql`
      SELECT 
        p.aip_code,
        p.ppa,
        d.name as department,
        p.pillar,
        NULL as target_quarter,
        NULL as target_month,
        NULL as target_year
      FROM ppmp p
      JOIN departments d ON p.department_id = d.id
      WHERE p.school_year_id = (
        SELECT id FROM school_years ORDER BY name DESC LIMIT 1
      )
      ORDER BY p.created_at DESC
    `) as unknown as PpmpSummary[];

    return { entries, error: null };
  } catch (error) {
    return { entries: [], error: "Failed to fetch programs" };
  }
}

/**
 * Fetch current user's training requests
 */
export async function getMyRequests() {
  try {
    const session = await getUserSession();

    const requests = (await sql`
      SELECT 
        tr.id,
        p.aip_code,
        p.ppa,
        INITCAP(tr.type) as type,
        COALESCE(rst.status, 'pending') as status,
        tr.submitted_at,
        tr.remarks
      FROM training_requests tr
      JOIN ppmp p ON tr.ppmp_id = p.id
      LEFT JOIN LATERAL (
        SELECT status FROM request_status_track
        WHERE request_id = tr.id
        ORDER BY actioned_at DESC
        LIMIT 1
      ) rst ON true
      WHERE tr.requested_by_id = ${session.user.id}
      ORDER BY tr.submitted_at DESC
    `) as unknown as TrainingRequest[];

    return { requests, error: null };
  } catch (error) {
    return { requests: [], error: "Failed to fetch requests" };
  }
}

/**
 * Get all dashboard data in one call
 */
export async function getDashboardData() {
  try {
    const session = await getUserSession();

    const [entriesResult, requestsResult] = await Promise.all([
      getAvailablePpmpEntries(),
      getMyRequests(),
    ]);

    return {
      user: {
        name: session.user.name,
        email: session.user.email,
        department: (session.user as any).department ?? null,
      },
      ppmpEntries: entriesResult.entries,
      myRequests: requestsResult.requests,
      error: entriesResult.error || requestsResult.error,
    };
  } catch (error) {
    return {
      user: null,
      ppmpEntries: [],
      myRequests: [],
      error: "Failed to load dashboard",
    };
  }
}
