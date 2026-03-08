import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/app/user/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <DashboardClient
      user={{
        name: session.user.name,
        email: session.user.email,
        department: (session.user as any).department ?? null,
      }}
      ppmpEntries={[]}
      myRequests={[]}
    />
  );
}
