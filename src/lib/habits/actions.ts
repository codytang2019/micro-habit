"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayStr } from "./dates";
import { CUSTOM_CAT_PALETTE } from "./types";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function checkInHabit(habitId: string) {
  const { supabase, userId } = await requireUserId();
  const today = todayStr();

  const { error } = await supabase.from("habit_logs").upsert(
    {
      habit_id: habitId,
      user_id: userId,
      completed_on: today,
      bonus_count: 0,
    },
    { onConflict: "habit_id,completed_on", ignoreDuplicates: true },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/app");
}

export async function setBonusCount(habitId: string, bonus: number) {
  const { supabase, userId } = await requireUserId();
  const today = todayStr();

  const { error } = await supabase
    .from("habit_logs")
    .update({ bonus_count: Math.max(0, bonus) })
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .eq("completed_on", today);

  if (error) throw new Error(error.message);
  revalidatePath("/app");
}

export async function createHabit(input: {
  name: string;
  unit: string;
  timeOfDay: string;
  categoryId: string;
  triggerPhrase: string;
}) {
  const { supabase, userId } = await requireUserId();

  const { data: maxRow } = await supabase
    .from("habits")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (maxRow?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("habits").insert({
    user_id: userId,
    name: input.name,
    emoji: input.name.charAt(0),
    unit: input.unit || "次",
    time_of_day: input.timeOfDay || "08:00",
    category_id: input.categoryId || null,
    trigger_phrase: input.triggerPhrase || null,
    floor_target: 1,
    sort_order: nextSort,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/app");
}

export async function updateHabit(
  habitId: string,
  input: {
    name: string;
    unit: string;
    timeOfDay: string;
    categoryId: string;
    triggerPhrase: string;
  },
) {
  const { supabase, userId } = await requireUserId();

  const { error } = await supabase
    .from("habits")
    .update({
      name: input.name,
      emoji: input.name.charAt(0),
      unit: input.unit || "次",
      time_of_day: input.timeOfDay || "08:00",
      category_id: input.categoryId || null,
      trigger_phrase: input.triggerPhrase || null,
    })
    .eq("id", habitId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/app");
}

export async function deleteHabit(habitId: string) {
  const { supabase, userId } = await requireUserId();

  const { error } = await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", habitId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/app");
}

export async function createCategory(label: string) {
  const { supabase, userId } = await requireUserId();

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const color = CUSTOM_CAT_PALETTE[(count ?? 0) % CUSTOM_CAT_PALETTE.length];
  const id = `cat-${crypto.randomUUID()}`;

  const { error } = await supabase.from("categories").insert({
    id,
    user_id: userId,
    label,
    color,
    is_builtin: false,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/app");
  return id;
}

export async function resetAllData() {
  const { supabase, userId } = await requireUserId();

  await supabase.from("habit_logs").delete().eq("user_id", userId);
  await supabase.from("habits").delete().eq("user_id", userId);
  await supabase
    .from("categories")
    .delete()
    .eq("user_id", userId)
    .eq("is_builtin", false);

  revalidatePath("/app");
}
