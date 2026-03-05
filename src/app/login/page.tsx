import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    if (session.user.role === "admin") redirect("/admin");
    else redirect("/dashboard");
  }

  return <LoginClient />;
}
