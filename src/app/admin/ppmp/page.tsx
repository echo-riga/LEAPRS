import { PpmpClient } from "@/app/admin/ppmp/PpmpClient";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export type PpmpEntry = {
  aip_code: string;
  school_year: string;
  department: string;
  ppa: string;
  initiative_level: string | null;
  mfo_category: string | null;
  pillar: string | null;
  intended_outcome: string | null;
  sdg_coding: string | null;
  joint_initiative: string | null;
  planned_outputs: string | null;
  success_indicator: string | null;
  milestone: string | null;
  budget_allocation: string | null;
  ppa_owner: string | null;
  target_implementation: string | null; // ← single field, matches DB
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export default async function AdminPpmpPage() {
  const entries = (await sql`
    SELECT
      p.aip_code,
      p.school_year,
      p.department,
      p.ppa,
      p.initiative_level,
      p.mfo_category,
      p.pillar,
      p.intended_outcome,
      p.sdg_coding,
      p.joint_initiative,
      p.planned_outputs,
      p.success_indicator,
      p.milestone,
      p.budget_allocation,
      p.ppa_owner,
      p.target_implementation,
      u.name AS created_by,
      p.created_at,
      p.updated_at
    FROM ppmp p
    LEFT JOIN "user" u ON u.id = p.created_by_id
    ORDER BY p.created_at DESC
  `) as unknown as PpmpEntry[];

  return <PpmpClient entries={entries} />;
}
