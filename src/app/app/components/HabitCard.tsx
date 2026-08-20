"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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
  isGuest,
  onRequireLogin,
}: {
  habit: Habit;
  entry: TodayEntry | undefined;
  category: Category | undefined;
  onEdit: (habit: Habit) => void;
  isGuest: boolean;
  onRequireLogin: () => void;
}) {
  // 樂觀更新：蓋章嗰刻即刻喺本地將 done 變 true，唔使等成個 server action
  // + revalidatePath（會重新 fetch 成頁 7 條 query）行完先郁畫面 ——
  // 之前就係因為咁樣先會覺得撳蓋章有 3-4 秒 delay。如果 server action
  // 真係失敗，先跌返做未完成，等用戶知道要再試。
  const [optimisticDone, setOptimisticDone] = useState(entry?.done ?? false);
  const done = optimisticDone;
  const [bonus, setBonus] = useState(entry?.bonus ?? 0);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const catColor = category?.color ?? "#F0D6BA";

  // Swipe-left-to-reveal 編輯/刪除按鈕，取代之前個「⋯」button。
  // REVEAL_WIDTH 要同下面兩粒按鈕嗰邊 `right-0 ... pr-2.5` 嘅闊度夾（9+9+gap-2+pr-2.5 ≈ 84px）。
  const REVEAL_WIDTH = 84;
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef<{ startX: number; startedOpen: boolean; pointerId: number } | null>(null);

  // 撳落去嗰個位如果係按鈕／輸入元件（蓋章、編輯、刪除、超額滑桿），
  // 完全唔開始 swipe 追蹤，等呢啲元件嘅原生 click/input 事件正常行，
  // 唔會俾 pointer capture 或者 drag 邏輯搶咗轉個 gesture。
  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof Element && !!target.closest("button, input, a, [role='button']");

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // 淨係響應主要輸入（左鍵/單指觸控）。
    if (e.button !== undefined && e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;
    dragStateRef.current = { startX: e.clientX, startedOpen: open, pointerId: e.pointerId };
    setDragging(true);
    // 用 pointer capture 等隻手指/滑鼠拖出張卡範圍之外都仲追蹤到，
    // 唔會半途斷咗個 swipe 手勢。
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || !dragging || e.pointerId !== state.pointerId) return;
    const delta = e.clientX - state.startX;
    const base = state.startedOpen ? -REVEAL_WIDTH : 0;
    const next = Math.min(0, Math.max(-REVEAL_WIDTH, base + delta));
    setDragX(next);
  };

  const endDrag = () => {
    const state = dragStateRef.current;
    if (!state) {
      setDragging(false);
      return;
    }
    // 開嘅門檻遠啲（要拖過一半先開），關嘅門檻近啲（本身開住，
    // 拖返少少就收），等用戶容易保持顯示、亦唔會唔小心就開咗。
    const threshold = state.startedOpen ? -REVEAL_WIDTH * 0.2 : -REVEAL_WIDTH * 0.5;
    setOpen(dragX <= threshold);
    setDragX(0);
    setDragging(false);
    dragStateRef.current = null;
  };

  // 一旦 server 真係 revalidate 完、帶住新嘅 entry props 落嚟，用返
  // server 嘅版本做準（例如喺第二部裝置打咗卡，或者成頁 refresh 過）。
  useEffect(() => {
    setOptimisticDone(entry?.done ?? false);
    setBonus(entry?.bonus ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.done, entry?.bonus]);

  const handleStamp = () => {
    if (isGuest) return onRequireLogin();
    if (done) return;
    setOptimisticDone(true);
    startTransition(async () => {
      try {
        await checkInHabit(habit.id);
      } catch {
        setOptimisticDone(false);
      }
    });
  };

  const handleBonusChange = (v: number) => {
    if (isGuest) return;
    setBonus(v);
  };
  const handleBonusCommit = (v: number) => {
    if (isGuest) return onRequireLogin();
    startTransition(async () => {
      await setBonusCount(habit.id, v);
    });
  };

  const handleDelete = () => {
    if (isGuest) return onRequireLogin();
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={() => {
          // 已經 swipe 開住嗰陣，撳返張卡（唔係撳蓋章/滑桿）即刻收返去，
          // 方便用戶唔使特登再 swipe 返一次先可以蓋章。
          if (open && !dragging) setOpen(false);
        }}
        className="relative flex items-center gap-3 border bg-paper-card p-3 pl-2.5"
        style={{
          borderColor: done ? "rgba(200,92,46,0.35)" : "#F0D6BA",
          borderLeftWidth: "4px",
          borderLeftColor: catColor,
          transform: `translateX(${dragging ? dragX : open ? -REVEAL_WIDTH : 0}px)`,
          transition: dragging ? "none" : "transform 0.2s ease-out",
          touchAction: "pan-y",
        }}
      >
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
