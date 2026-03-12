import { PpmpClient } from "@/app/admin/ppmp/PpmpClient";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export type PpmpEntry = {
  aip_code: string;
  school_year_id: string;
  school_year_name: string | null;
  department_id: string | null;
  department_name: string | null;
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
  target_implementation: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Department = {
  id: string;
  name: string;
};

export type SchoolYear = {
  id: string;
  name: string;
};

export default async function AdminPpmpPage() {
  const [entries, departments, schoolYears] = await Promise.all([
    sql`
      SELECT
        p.aip_code,
        p.school_year_id,
        sy.name         AS school_year_name,
        p.department_id,
        d.name          AS department_name,
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
        u.name          AS created_by,
        p.created_at,
        p.updated_at
      FROM ppmp p
      LEFT JOIN school_years sy ON sy.id = p.school_year_id
      LEFT JOIN departments  d  ON d.id  = p.department_id
      LEFT JOIN "user"       u  ON u.id  = p.created_by_id
      ORDER BY p.created_at DESC
    `,
    sql`SELECT id, name FROM departments  ORDER BY name ASC`,
    sql`SELECT id, name FROM school_years ORDER BY name ASC`,
  ]);

  return (
    <PpmpClient
      entries={entries as unknown as PpmpEntry[]}
      departments={departments as unknown as Department[]}
      schoolYears={schoolYears as unknown as SchoolYear[]}
    />
  );
}
