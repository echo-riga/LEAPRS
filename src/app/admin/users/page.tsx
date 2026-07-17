import { AdminUsersClient } from "@/app/admin/users/UsersClient";
import { sql } from "@/lib/db";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type User = {
  id: string;
  name: string;
  email: string;
  department_id: string | null;
  department_name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/unauthorized");

  const [users, departments] = await Promise.all([
    sql`
      SELECT u.id, u.name, u.email, u.department_id, d.name AS department_name,
             u.role, u."createdAt", u."updatedAt"
      FROM "user" u
      LEFT JOIN departments d ON d.id = u.department_id
      ORDER BY u."createdAt" DESC
    `,
    sql`SELECT id, name FROM departments ORDER BY name ASC`,
  ]);

  return (
    <AdminUsersClient
      users={users as unknown as User[]}
      departments={departments as unknown as { id: string; name: string }[]}
    />
  );
}