import { AdminSidebar } from "@/app/components/AdminSidebar";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin" && session.user.role !== "dept_viewer") redirect("/unauthorized");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7f5 0%, #eef2ee 100%)",
      }}
    >
      <AdminSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
      />
      <main
        style={{
          marginLeft: "260px",
          flex: 1,
          minHeight: "100vh",
          overflowY: "auto",
          padding: "32px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
