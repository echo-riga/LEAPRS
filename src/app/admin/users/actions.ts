"use server";

import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createUserAction(data: {
  name: string;
  email: string;
  password: string;
  department_id: string;
  role: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  await auth.api.signUpEmail({
    body: { name: data.name, email: data.email, password: data.password },
  });

  await sql`
    UPDATE "user"
    SET department_id = ${data.department_id || null}, role = ${data.role}
    WHERE email = ${data.email}
  `;

  revalidatePath("/admin/users");
  return { error: null };
}

export async function updateUserAction(data: {
  id: string;
  name: string;
  email: string;
  department_id: string;
  role: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  await sql`
    UPDATE "user"
    SET
      name = ${data.name},
      email = ${data.email},
      department_id = ${data.department_id || null},
      role = ${data.role},
      "updatedAt" = NOW()
    WHERE id = ${data.id}
  `;

  revalidatePath("/admin/users");
  return { error: null };
}

export async function deleteUserAction(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  try {
    await sql`DELETE FROM session WHERE "userId" = ${id}`;
    await sql`DELETE FROM account WHERE "userId" = ${id}`;
    await sql`DELETE FROM verification WHERE identifier = (
      SELECT email FROM "user" WHERE id = ${id}
    )`;
    await sql`DELETE FROM "user" WHERE id = ${id}`;

    revalidatePath("/admin/users");
    return { error: null };
  } catch (err: unknown) {
    throw new Error(err instanceof Error ? err.message : "Delete failed");
  }
  
}
export async function createDepartmentAction(name: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");
  const [row] = (await sql`
    INSERT INTO departments (name) VALUES (${name}) RETURNING id
  `) as unknown as { id: string }[];
  revalidatePath("/admin/users");
  return { id: row.id };
}

export async function deleteDepartmentAction(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");
  await sql`DELETE FROM departments WHERE id = ${id}`;
  revalidatePath("/admin/users");
}