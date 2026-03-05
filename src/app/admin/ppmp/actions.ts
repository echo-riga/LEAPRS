"use server";

import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createPpmpAction(data: {
  aip_code: string;
  school_year: string;
  department: string;
  ppa: string;
  initiative_level: string;
  mfo_category: string;
  pillar: string;
  intended_outcome: string;
  sdg_coding: string;
  joint_initiative: string;
  planned_outputs: string;
  success_indicator: string;
  milestone: string;
  budget_allocation: string;
  ppa_owner: string;
  target_quarter: string;
  target_month: string;
  target_year: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  await sql`
    INSERT INTO ppmp (
      aip_code, school_year, department, ppa, initiative_level,
      mfo_category, pillar, intended_outcome, sdg_coding, joint_initiative,
      planned_outputs, success_indicator, milestone, budget_allocation,
      ppa_owner, target_quarter, target_month, target_year, created_by_id
    ) VALUES (
      ${data.aip_code}, ${data.school_year}, ${data.department}, ${data.ppa},
      ${data.initiative_level}, ${data.mfo_category}, ${data.pillar},
      ${data.intended_outcome}, ${data.sdg_coding}, ${data.joint_initiative},
      ${data.planned_outputs}, ${data.success_indicator}, ${data.milestone},
      ${data.budget_allocation}, ${data.ppa_owner}, ${data.target_quarter},
      ${data.target_month}, ${data.target_year}, ${session.user.id}
    )
  `;

  revalidatePath("/admin/ppmp");
  return { error: null };
}

export async function updatePpmpAction(data: {
  aip_code: string;
  school_year: string;
  department: string;
  ppa: string;
  initiative_level: string;
  mfo_category: string;
  pillar: string;
  intended_outcome: string;
  sdg_coding: string;
  joint_initiative: string;
  planned_outputs: string;
  success_indicator: string;
  milestone: string;
  budget_allocation: string;
  ppa_owner: string;
  target_quarter: string;
  target_month: string;
  target_year: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  await sql`
    UPDATE ppmp SET
      school_year       = ${data.school_year},
      department        = ${data.department},
      ppa               = ${data.ppa},
      initiative_level  = ${data.initiative_level},
      mfo_category      = ${data.mfo_category},
      pillar            = ${data.pillar},
      intended_outcome  = ${data.intended_outcome},
      sdg_coding        = ${data.sdg_coding},
      joint_initiative  = ${data.joint_initiative},
      planned_outputs   = ${data.planned_outputs},
      success_indicator = ${data.success_indicator},
      milestone         = ${data.milestone},
      budget_allocation = ${data.budget_allocation},
      ppa_owner         = ${data.ppa_owner},
      target_quarter    = ${data.target_quarter},
      target_month      = ${data.target_month},
      target_year       = ${data.target_year},
      updated_at        = NOW()
    WHERE aip_code = ${data.aip_code}
  `;

  revalidatePath("/admin/ppmp");
  return { error: null };
}

export async function deletePpmpAction(aip_code: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  try {
    await sql`DELETE FROM ppmp WHERE aip_code = ${aip_code}`;
    revalidatePath("/admin/ppmp");
    return { error: null };
  } catch (err: unknown) {
    console.error("Delete error:", err);
    throw new Error(err instanceof Error ? err.message : "Delete failed");
  }
}
