import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { AdminDashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export type DashboardStats = {
  total_requests: number;
  submitted: number;
  waiting_approval: number;
  approved: number;
  rejected: number;
  training_ongoing: number;
  pending_completion_docs: number;
  pending_completion_approval: number;
  completed: number;
  total_budget: number;
  utilized_budget: number;
};

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/unauthorized");

  const [departments, schoolYears] = await Promise.all([
    sql`SELECT id, name FROM departments ORDER BY name ASC`,
    sql`SELECT id, name FROM school_years ORDER BY name ASC`,
  ]);

  return (
    <AdminDashboardClient
      departments={departments as unknown as { id: string; name: string }[]}
      schoolYears={schoolYears as unknown as { id: string; name: string }[]}
    />
  );
}
