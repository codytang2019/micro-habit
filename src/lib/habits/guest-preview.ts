import { PRESETS } from "./types";
import { todayStr } from "./dates";
import type { Category, DayRecord, Habit, TodayEntry } from "./types";

/**
 * 未登入用戶嘅 preview 資料 —— 純前端假資料，唔碰 database。
 * 目的係等用戶未登入之前都可以睇下主頁／集章月曆／已成為習慣三個畫面
 * 大概點運作，撳到會寫資料嘅動作（新增/打卡/超額/刪除）先要求登入。
 */

const GUEST_CATEGORIES: Category[] = [
  { id: "health", label: "健康與運動", color: "#4C7A76", isBuiltin: true },
  { id: "mind", label: "心靈與情緒", color: "#7C5A78", isBuiltin: true },
  { id: "work", label: "工作與學習", color: "#8C6239", isBuiltin: true },
  { id: "life", label: "生活與理財", color: "#5A7A94", isBuiltin: true },
];

function buildGuestHabits(): Habit[] {
  let sortOrder = 0;
  const habits: Habit[] = [];

  const pick = (catKey: keyof typeof PRESETS, index: number, id: string) => {
    const preset = PRESETS[catKey][index];
    habits.push({
      id,
      name: preset.name,
      char: preset.name.charAt(0),
      unit: preset.unit,
      floorTarget: 1,
      categoryId: catKey,
      timeOfDay: preset.time,
      triggerPhrase: preset.trigger,
      sortOrder: sortOrder++,
    });
  };

  pick("health", 0, "guest-1");
  pick("mind", 1, "guest-2");
  pick("work", 2, "guest-3");
  pick("life", 3, "guest-4");

  return habits;
}

export function getGuestPreviewData() {
  const habits = buildGuestHabits();
  const today = todayStr();

  // 示範今日狀態：頭兩件已打卡（其中一件仲有超額），後面未打
  const todayEntries: Record<string, TodayEntry> = {
    [habits[0].id]: { habitId: habits[0].id, done: true, bonus: 2, logId: null },
    [habits[1].id]: { habitId: habits[1].id, done: true, bonus: 0, logId: null },
  };

  const repsByHabit: Record<string, number> = {
    [habits[0].id]: 9,
    [habits[1].id]: 24,
    [habits[2].id]: 3,
    [habits[3].id]: 15,
  };
  const totalReps = Object.values(repsByHabit).reduce((a, b) => a + b, 0);

  const monthRecords: Record<string, DayRecord> = {
    [today]: {
      date: today,
      status: "partial",
      records: habits.slice(0, 2).map((h) => ({
        habitId: h.id,
        name: h.name,
        char: h.char,
        categoryId: h.categoryId,
        done: true,
        bonus: todayEntries[h.id]?.bonus ?? 0,
      })),
    },
  };

  return {
    habits,
    categories: GUEST_CATEGORIES,
    todayEntries,
    totalReps,
    repsByHabit,
    firstUseDate: today,
    monthRecords,
  };
}
