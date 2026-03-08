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
  initiative_level?: string;
  mfo_category?: string;
  pillar?: string;
  intended_outcome?: string;
  sdg_coding?: string;
  joint_initiative?: string;
  planned_outputs?: string;
  success_indicator?: string;
  milestone?: string;
  budget_allocation?: string;
  ppa_owner?: string;
  target_implementation?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  await sql`
    INSERT INTO ppmp (
      aip_code, school_year, department, ppa, initiative_level,
      mfo_category, pillar, intended_outcome, sdg_coding, joint_initiative,
      planned_outputs, success_indicator, milestone, budget_allocation,
      ppa_owner, target_implementation, created_by_id
    ) VALUES (
      ${data.aip_code}, ${data.school_year}, ${data.department}, ${data.ppa},
      ${data.initiative_level ?? null}, ${data.mfo_category ?? null}, ${data.pillar ?? null},
      ${data.intended_outcome ?? null}, ${data.sdg_coding ?? null}, ${data.joint_initiative ?? null},
      ${data.planned_outputs ?? null}, ${data.success_indicator ?? null}, ${data.milestone ?? null},
      ${data.budget_allocation ?? null}, ${data.ppa_owner ?? null},
      ${data.target_implementation ?? null}, ${session.user.id}
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
  initiative_level?: string;
  mfo_category?: string;
  pillar?: string;
  intended_outcome?: string;
  sdg_coding?: string;
  joint_initiative?: string;
  planned_outputs?: string;
  success_indicator?: string;
  milestone?: string;
  budget_allocation?: string;
  ppa_owner?: string;
  target_implementation?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("Forbidden");

  await sql`
    UPDATE ppmp SET
      school_year            = ${data.school_year},
      department             = ${data.department},
      ppa                    = ${data.ppa},
      initiative_level       = ${data.initiative_level ?? null},
      mfo_category           = ${data.mfo_category ?? null},
      pillar                 = ${data.pillar ?? null},
      intended_outcome       = ${data.intended_outcome ?? null},
      sdg_coding             = ${data.sdg_coding ?? null},
      joint_initiative       = ${data.joint_initiative ?? null},
      planned_outputs        = ${data.planned_outputs ?? null},
      success_indicator      = ${data.success_indicator ?? null},
      milestone              = ${data.milestone ?? null},
      budget_allocation      = ${data.budget_allocation ?? null},
      ppa_owner              = ${data.ppa_owner ?? null},
      target_implementation  = ${data.target_implementation ?? null},
      updated_at             = NOW()
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
