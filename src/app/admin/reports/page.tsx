import { AdminReportsClient } from "@/app/admin/reports/ReportsClient";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/unauthorized");

  return <AdminReportsClient />;
}
