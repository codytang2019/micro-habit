import "server-only";
import { createClient } from "@/lib/supabase/server";
import { todayStr } from "./dates";
import type { Category, DayRecord, Habit, TodayEntry } from "./types";

export async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function fetchCategories(userId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, label, color, is_builtin, user_id")
    .or(`is_builtin.eq.true,user_id.eq.${userId}`)
    .order("is_builtin", { ascending: false });

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    label: c.label,
    color: c.color,
    isBuiltin: c.is_builtin,
  }));
}

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habits")
    .select(
      "id, name, emoji, unit, floor_target, category_id, time_of_day, trigger_phrase, sort_order",
    )
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((h) => ({
    id: h.id,
    name: h.name,
    char: h.emoji || h.name.charAt(0),
    unit: h.unit || "次",
    floorTarget: h.floor_target ?? 1,
    categoryId: h.category_id,
    timeOfDay: (h.time_of_day || "08:00:00").slice(0, 5),
    triggerPhrase: h.trigger_phrase,
    sortOrder: h.sort_order ?? 0,
  }));
}

export async function fetchTodayEntries(
  userId: string,
): Promise<Map<string, TodayEntry>> {
  const supabase = await createClient();
  const today = todayStr();
  const { data, error } = await supabase
    .from("habit_logs")
    .select("id, habit_id, bonus_count")
    .eq("user_id", userId)
    .eq("completed_on", today);

  const map = new Map<string, TodayEntry>();
  if (error || !data) return map;

  data.forEach((log) => {
    map.set(log.habit_id, {
      habitId: log.habit_id,
      done: true,
      bonus: log.bonus_count ?? 0,
      logId: log.id,
    });
  });
  return map;
}

export async function fetchTotalReps(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habit_logs")
    .select("bonus_count")
    .eq("user_id", userId);

  if (error || !data) return 0;
  return data.reduce((sum, r) => sum + 1 + (r.bonus_count ?? 0), 0);
}

export async function fetchRepsByHabit(
  userId: string,
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habit_logs")
    .select("habit_id, bonus_count")
    .eq("user_id", userId);

  const map = new Map<string, number>();
  if (error || !data) return map;

  data.forEach((log) => {
    const prev = map.get(log.habit_id) ?? 0;
    map.set(log.habit_id, prev + 1 + (log.bonus_count ?? 0));
  });
  return map;
}

export async function fetchFirstUseDate(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habit_logs")
    .select("completed_on")
    .eq("user_id", userId)
    .order("completed_on", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.completed_on;
}

/**
 * Fetch day-level status for every day in [startDate, endDate] (inclusive),
 * derived from habit_logs grouped by day, compared against how many habits
 * existed on that day (approximated using the current habit set, since we
 * don't track historical habit membership per day).
 */
export async function fetchMonthRecords(
  userId: string,
  year: number,
  month: number, // 0-indexed
): Promise<Map<string, DayRecord>> {
  const supabase = await createClient();
  const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDate = new Date(year, month + 1, 0).getDate();
  const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;

  const [{ data: logs }, habits] = await Promise.all([
    supabase
      .from("habit_logs")
      .select("habit_id, completed_on, bonus_count, habits(name, emoji, category_id)")
      .eq("user_id", userId)
      .gte("completed_on", firstDay)
      .lte("completed_on", lastDay),
    fetchHabits(userId),
  ]);

  const byDay = new Map<string, DayRecord["records"]>();
  (logs ?? []).forEach((log) => {
    const habitInfo = Array.isArray(log.habits) ? log.habits[0] : log.habits;
    const entry = {
      habitId: log.habit_id,
      name: habitInfo?.name ?? "",
      char: habitInfo?.emoji ?? "",
      categoryId: habitInfo?.category_id ?? null,
      done: true,
      bonus: log.bonus_count ?? 0,
    };
    const list = byDay.get(log.completed_on) ?? [];
    list.push(entry);
    byDay.set(log.completed_on, list);
  });

  const result = new Map<string, DayRecord>();
  const totalHabits = habits.length;

  byDay.forEach((records, date) => {
    const doneCount = records.length;
    const anyBonus = records.some((r) => r.bonus > 0);
    let status: DayRecord["status"] = "missed";
    if (totalHabits > 0 && doneCount >= totalHabits) {
      status = anyBonus ? "bonus" : "done";
    } else if (doneCount > 0) {
      status = "partial";
    }
    result.set(date, { date, status, records });
  });

  return result;
}
