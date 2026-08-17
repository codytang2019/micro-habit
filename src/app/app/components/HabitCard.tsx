"use client";

import { useState, useTransition } from "react";
import { StampMark } from "./StampMark";
import { checkInHabit, deleteHabit, setBonusCount } from "@/lib/habits/actions";
import { BONUS_MAX } from "@/lib/habits/types";
import type { Category, Habit, TodayEntry } from "@/lib/habits/types";

function bonusEmoji(n: number) {
  if (n <= 0) return "💤";
  if (n <= 2) return "✨".repeat(n);
  if (n <= 4) return "🔥".repeat(n - 1);
  return "🚀";
}

export function HabitCard({
  habit,
  entry,
  category,
  onEdit,
}: {
  habit: Habit;
  entry: TodayEntry | undefined;
  category: Category | undefined;
  onEdit: (habit: Habit) => void;
}) {
  const done = entry?.done ?? false;
  const [bonus, setBonus] = useState(entry?.bonus ?? 0);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const catColor = category?.color ?? "#F0D6BA";

  const handleStamp = () => {
    if (done) return;
    startTransition(async () => {
      await checkInHabit(habit.id);
    });
  };

  const handleBonusChange = (v: number) => {
    setBonus(v);
  };
  const handleBonusCommit = (v: number) => {
    startTransition(async () => {
      await setBonusCount(habit.id, v);
    });
  };

  const handleDelete = () => {
    if (!confirm(`確定要刪除「${habit.name}」嗎？`)) return;
    startTransition(async () => {
      await deleteHabit(habit.id);
    });
  };

  return (
    <div className="relative mb-2.5 overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2.5">
        <button
          type="button"
          onClick={() => onEdit(habit)}
          aria-label="編輯"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink-soft active:scale-95"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="刪除"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-stamp active:scale-95"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path
              d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div
        className="relative flex items-center gap-3 border bg-paper-card p-3 pl-2.5 transition-transform"
        style={{
          borderColor: done ? "rgba(200,92,46,0.35)" : "#F0D6BA",
          borderLeftWidth: "4px",
          borderLeftColor: catColor,
          transform: open ? "translateX(-84px)" : "translateX(0)",
        }}
      >
        <button
          type="button"
          aria-label="更多選項"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-ink-faint"
        >
          ⋯
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="text-[14.5px] font-medium">{habit.name}</div>
            {category && (
              <span
                className="whitespace-nowrap rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                style={{ background: `${catColor}33`, color: catColor }}
              >
                {category.label}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[11.5px] text-ink-soft">
            {habit.triggerPhrase ? (
              <span className="text-ink">
                {habit.triggerPhrase}了嗎？順便{habit.name}
              </span>
            ) : (
              <span>
                {habit.timeOfDay} ·{" "}
                {done ? `已完成 · 目標 ${habit.floorTarget} ${habit.unit}` : `目標 ${habit.floorTarget} ${habit.unit}`}
              </span>
            )}
            {bonus > 0 && <span className="font-bold text-gold"> · 超額 +{bonus}</span>}
            {habit.triggerPhrase && done && <span className="font-bold text-moss"> · 已完成</span>}
          </div>

          {done && (
            <div className="mt-2 flex items-center gap-2">
              <span className="min-w-4 flex-none text-center text-xs">{bonusEmoji(bonus)}</span>
              <input
                type="range"
                min={0}
                max={BONUS_MAX}
                step={1}
                value={bonus}
                onChange={(e) => handleBonusChange(Number(e.target.value))}
                onMouseUp={(e) => handleBonusCommit(Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => handleBonusCommit(Number((e.target as HTMLInputElement).value))}
                aria-label={`超額次數：${habit.name}`}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-md outline-none"
                style={{
                  background: `linear-gradient(to right, #C85C2E ${Math.round((bonus / BONUS_MAX) * 100)}%, rgba(224,164,40,0.2) ${Math.round((bonus / BONUS_MAX) * 100)}%)`,
                }}
              />
              <span className="min-w-[52px] flex-none text-right font-mono text-[11px] text-gold">
                {bonus > 0 ? `超額 +${bonus}` : "加多幾下？"}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleStamp}
          disabled={isPending}
          aria-label={`打卡：${habit.name}`}
          className={`flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full ${
            done ? "" : "border-2 border-dashed border-stamp bg-stamp/10 opacity-55 active:scale-95"
          }`}
        >
          {done ? (
            <StampMark char={habit.char} />
          ) : (
            <span className="font-mono text-[9px] text-ink-faint">蓋章</span>
          )}
        </button>
      </div>
    </div>
  );
}
