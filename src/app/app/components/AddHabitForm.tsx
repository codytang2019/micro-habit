"use client";

import { useMemo, useState, useTransition } from "react";
import { createCategory, createHabit, updateHabit } from "@/lib/habits/actions";
import { PRESETS, POPULAR_TRIGGERS } from "@/lib/habits/types";
import type { Category, Habit } from "@/lib/habits/types";

type Props = {
  categories: Category[];
  habits: Habit[];
  editingHabit: Habit | null;
  onClose: () => void;
};

export function AddHabitForm({ categories, habits, editingHabit, onClose }: Props) {
  const [tab, setTab] = useState<"presets" | "custom">(editingHabit ? "custom" : "presets");
  const [name, setName] = useState(editingHabit?.name ?? "");
  const [unit, setUnit] = useState(editingHabit?.unit ?? "");
  const [time, setTime] = useState(editingHabit?.timeOfDay ?? "08:00");
  const [categoryId, setCategoryId] = useState(editingHabit?.categoryId ?? "health");
  const [trigger, setTrigger] = useState(editingHabit?.triggerPhrase ?? "");
  const [customTrigger, setCustomTrigger] = useState("");
  const [showCustomTrigger, setShowCustomTrigger] = useState(
    !!editingHabit?.triggerPhrase && !POPULAR_TRIGGERS.includes(editingHabit.triggerPhrase),
  );
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localCategories, setLocalCategories] = useState(categories);

  const alreadyAdded = useMemo(
    () => new Set(habits.map((h) => h.name)),
    [habits],
  );

  const handlePresetClick = (preset: { name: string; unit: string; time: string; trigger: string }, catKey: string) => {
    setName(preset.name);
    setUnit(preset.unit);
    setTime(preset.time);
    setTrigger(preset.trigger);
    setCategoryId(catKey);
    setShowCustomTrigger(false);
    setTab("custom");
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    setNameError(false);
    const finalUnit = unit.trim() || "次";

    startTransition(async () => {
      if (editingHabit) {
        await updateHabit(editingHabit.id, {
          name: trimmed,
          unit: finalUnit,
          timeOfDay: time,
          categoryId,
          triggerPhrase: trigger.trim(),
        });
      } else {
        await createHabit({
          name: trimmed,
          unit: finalUnit,
          timeOfDay: time,
          categoryId,
          triggerPhrase: trigger.trim(),
        });
      }
      onClose();
    });
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const id = await createCategory(trimmed);
      setLocalCategories((prev) => [
        ...prev,
        { id, label: trimmed, color: "#7C5A78", isBuiltin: false },
      ]);
      setCategoryId(id);
      setShowNewCat(false);
      setNewCatName("");
    });
  };

  return (
    <div>
      <div
        className="-mx-5 mb-[18px] flex items-center gap-2.5 px-5 pb-5 pt-11 shadow-lg"
        style={{
          background: "linear-gradient(135deg, #C85C2E 0%, #A84A24 100%)",
          borderRadius: "0 0 26px 26px",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="返回"
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full border border-white/40 bg-white/20 text-[19px] text-white"
        >
          ‹
        </button>
        <div className="font-serif text-[17px] font-bold text-white">新增你的小事</div>
      </div>

      <div className="mb-5 flex rounded-3xl bg-paper-deep p-1">
        <button
          type="button"
          onClick={() => setTab("presets")}
          className={`flex-1 rounded-[20px] py-2.5 text-[12.5px] ${
            tab === "presets" ? "bg-stamp font-bold text-white shadow" : "text-ink-soft"
          }`}
        >
          選範本
        </button>
        <button
          type="button"
          onClick={() => setTab("custom")}
          className={`flex-1 rounded-[20px] py-2.5 text-[12.5px] ${
            tab === "custom" ? "bg-stamp font-bold text-white shadow" : "text-ink-soft"
          }`}
        >
          編輯 / 自訂
        </button>
      </div>

      {tab === "presets" && (
        <div>
          {Object.entries(PRESETS).map(([catKey, items]) => {
            const meta = localCategories.find((c) => c.id === catKey);
            return (
              <div key={catKey} className="mb-4">
                <div
                  className="mb-2 flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: meta?.color }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: meta?.color }} />
                  {meta?.label}
                </div>
                {items.map((item) => {
                  const added = alreadyAdded.has(item.name);
                  return (
                    <div
                      key={item.name}
                      onClick={() => !added && handlePresetClick(item, catKey)}
                      className={`mb-1.5 flex items-center gap-2.5 rounded-xl border border-line bg-paper-card p-2.5 ${
                        added ? "cursor-default opacity-50" : "cursor-pointer active:scale-[.99]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px]">{item.name}</div>
                        <div className="mt-0.5 font-mono text-[10.5px] text-ink-soft">
                          {item.trigger ? `${item.trigger} → ` : `${item.time} · `}
                          {item.unit}
                        </div>
                      </div>
                      <div className="flex-none whitespace-nowrap font-mono text-[11px] text-ink-faint">
                        {added ? "✓ 已加入" : "編輯 →"}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab === "custom" && (
        <div>
          <div className="mb-3.5 rounded-2xl border border-line bg-paper-card p-4">
            <div className="mb-3 flex items-center gap-1.5 border-b border-line-soft pb-2.5">
              <span className="text-stamp">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                  <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-[13.5px] font-bold">造句</span>
            </div>
            <div className="mb-2.5 text-[15px] leading-loose text-ink-soft">
              在
              <span className={`mx-0.5 border-b-[1.6px] border-dashed px-0.5 font-bold ${trigger ? "border-stamp text-ink" : "border-line text-ink-faint font-medium"}`}>
                {trigger || "舊習慣"}
              </span>
              之後，我要
              <span className={`mx-0.5 border-b-[1.6px] border-dashed px-0.5 font-bold ${name ? "border-stamp text-ink" : "border-line text-ink-faint font-medium"}`}>
                {name || "微習慣"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TRIGGERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTrigger(t);
                    setShowCustomTrigger(false);
                  }}
                  className={`rounded-full border-[1.4px] px-3.5 py-1.5 text-[12.5px] text-stamp ${
                    trigger === t ? "border-current font-bold" : "border-line"
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowCustomTrigger(true);
                  setCustomTrigger(POPULAR_TRIGGERS.includes(trigger) ? "" : trigger);
                }}
                className={`rounded-full border-[1.4px] border-dashed px-3.5 py-1.5 text-[12.5px] text-stamp ${
                  showCustomTrigger || (trigger && !POPULAR_TRIGGERS.includes(trigger)) ? "font-bold" : ""
                }`}
              >
                {trigger && !POPULAR_TRIGGERS.includes(trigger) ? trigger : "其他 ✎"}
              </button>
            </div>
            {showCustomTrigger && (
              <input
                type="text"
                placeholder="輸入你自己的舊習慣，例如：關掉電腦"
                maxLength={14}
                value={customTrigger}
                onChange={(e) => {
                  setCustomTrigger(e.target.value);
                  setTrigger(e.target.value.trim());
                }}
                className="mt-2 w-full rounded-[10px] border border-line bg-paper px-3 py-2.5 text-sm"
              />
            )}
          </div>

          <div className="mb-3.5 rounded-2xl border border-line bg-paper-card p-4">
            <div className="mb-3 flex items-center gap-1.5 border-b border-line-soft pb-2.5">
              <span className="text-stamp">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                  <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-[13.5px] font-bold">
                微習慣<span className="ml-0.5 text-stamp">*</span>
              </span>
            </div>
            <input
              type="text"
              placeholder="例如：伸展 30 秒"
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[10px] border border-line bg-paper px-3 py-2.5 text-sm"
            />
            {nameError && (
              <div className="mt-1.5 text-[11px] text-stamp">請輸入名稱，蓋章需要一個名字</div>
            )}
          </div>

          <div className="mb-3.5 rounded-2xl border border-line bg-paper-card p-4">
            <div className="mb-3 flex items-center gap-1.5 border-b border-line-soft pb-2.5">
              <span className="text-stamp">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                  <path
                    d="M20 12l-7.5 7.5a2 2 0 0 1-2.8 0L4 13.8V5a1 1 0 0 1 1-1h8.8l6.2 6.2a2 2 0 0 1 0 2.8z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <circle cx="8.2" cy="8.2" r="1.3" fill="currentColor" />
                </svg>
              </span>
              <span className="text-[13.5px] font-bold">分類</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {localCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`rounded-full border-[1.4px] px-3.5 py-1.5 text-[12.5px] ${
                    categoryId === c.id ? "border-current font-bold" : "border-line"
                  }`}
                  style={{ color: c.color }}
                >
                  {c.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewCat(true)}
                className="rounded-full border-[1.4px] border-dashed border-line px-3.5 py-1.5 text-[12.5px] text-ink-soft"
              >
                + 新分類
              </button>
            </div>
            {showNewCat && (
              <div className="mt-2 flex gap-1.5">
                <input
                  type="text"
                  placeholder="新分類名稱"
                  maxLength={8}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  className="flex-1 rounded-[10px] border border-line bg-paper-card px-2.5 py-1.5 text-[12.5px]"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="whitespace-nowrap rounded-[10px] bg-ink px-2.5 py-1.5 text-xs text-paper"
                >
                  加入
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCat(false)}
                  className="whitespace-nowrap rounded-[10px] border border-line px-2.5 py-1.5 text-xs text-ink-soft"
                >
                  取消
                </button>
              </div>
            )}
          </div>

          <div className="mb-3.5 rounded-2xl border border-line bg-paper-card p-4">
            <div className="mb-3 flex items-center gap-1.5 border-b border-line-soft pb-2.5">
              <span className="text-stamp">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                  <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-[13.5px] font-bold">時間與計量</span>
            </div>
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className="mb-1.5 block font-mono text-[11.5px] text-ink-soft">大約時間</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-[10px] border border-line bg-paper-card px-3 py-2.5 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block font-mono text-[11.5px] text-ink-soft">計量單位（選填）</label>
                <input
                  type="text"
                  placeholder="次 / 頁 / 杯"
                  maxLength={6}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-[10px] border border-line bg-paper-card px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="mt-0.5 w-full rounded-xl bg-ink py-3 text-[13.5px] font-bold text-paper disabled:opacity-60"
          >
            {editingHabit ? "更新" : "儲存"}
          </button>
          <div className="h-16" />
        </div>
      )}
    </div>
  );
}
