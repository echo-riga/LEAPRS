import { AdminSettingsClient } from "@/app/admin/settings/SettingsClient";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/unauthorized");

  return <AdminSettingsClient />;
}
