// src/app/(protected)/user/requests/new/page.tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { NewRequestClient } from "./NewRequestClient";

export const dynamic = "force-dynamic";

export type PpmpDetail = {
  id: string;
  aip_code: string;
  ppa: string;
  department_name: string | null;
  school_year_name: string | null;
  pillar: string | null;
  intended_outcome: string | null;
  planned_outputs: string | null;
  ppa_owner: string | null;
  target_implementation: string | null;
};

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ aip?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { aip } = await searchParams;
  if (!aip) redirect("/user");

  const [entry] = (await sql`
    SELECT
      p.id,
      p.aip_code,
      p.ppa,
      d.name  AS department_name,
      sy.name AS school_year_name,
      p.pillar,
      p.intended_outcome,
      p.planned_outputs,
      p.ppa_owner,
      p.target_implementation
    FROM ppmp p
    LEFT JOIN departments  d  ON d.id  = p.department_id
    LEFT JOIN school_years sy ON sy.id = p.school_year_id
    WHERE p.aip_code = ${aip}
    LIMIT 1
  `) as unknown as PpmpDetail[];

  if (!entry) redirect("/user");

  return <NewRequestClient entry={entry} />;
}
