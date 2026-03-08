import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserTopbar } from "@/app/components/UserTopbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role === "admin") redirect("/admin");

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f0" }}>
      <UserTopbar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
      />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}
