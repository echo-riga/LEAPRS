"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function loginAction({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
    
    const role = result.user.role;
    return { error: null, role };
  } catch (err: any) {
    return { error: err?.message ?? "Invalid email or password", role: null };
  }
}
