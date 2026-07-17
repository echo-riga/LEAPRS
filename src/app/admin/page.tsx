import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { AdminDashboardClient } from "./DashboardClient";
import { Suspense } from "react";

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
  if (session.user.role !== "admin" && session.user.role !== "dept_viewer") redirect("/unauthorized");

  const [departments, schoolYears, ppmpOptions] = await Promise.all([
    sql`SELECT id, name FROM departments ORDER BY name ASC`,
    sql`SELECT id, name FROM school_years ORDER BY name ASC`,
    sql`
      SELECT id, aip_code, ppa, department_id, school_year_id
      FROM ppmp
      ORDER BY ppa ASC, aip_code ASC
    `,
  ]);

  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <AdminDashboardClient
        departments={departments as unknown as { id: string; name: string }[]}
        schoolYears={schoolYears as unknown as { id: string; name: string }[]}
        ppmpOptions={
          ppmpOptions as unknown as {
            id: string;
            aip_code: string;
            ppa: string;
            department_id: string | null;
            school_year_id: string | null;
          }[]
        }
        user={session.user}
      />
    </Suspense>
  );
}
