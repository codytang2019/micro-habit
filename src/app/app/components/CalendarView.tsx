"use client";

import { useEffect, useMemo, useState } from "react";
import { DayFace } from "./DayFace";
import { WEEKDAY_CN, todayStr } from "@/lib/habits/dates";
import type { Category, DayRecord, DayStatus } from "@/lib/habits/types";

const STATUS_META: Record<DayStatus, { color: string; label: string }> = {
  done: { color: "#3C8452", label: "全部完成" },
  bonus: { color: "#E0A428", label: "全部完成 · 超額達成" },
  partial: { color: "#D9762F", label: "部分完成" },
  missed: { color: "#B0937A", label: "沒有完成" },
  pending: { color: "#BBA995", label: "進行中 · 今天還沒結束" },
};

export function CalendarView({
  year,
  month,
  monthRecords,
  categories,
  todayStatus,
  onNavigate,
}: {
  year: number;
  month: number; // 0-indexed
  monthRecords: Record<string, DayRecord>;
  categories: Category[];
  todayStatus: DayStatus;
  onNavigate: (year: number, month: number) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const now = todayStr();
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  useEffect(() => {
    setSelectedDate(null);
  }, [year, month]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = first.getDay();
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    const out: { num: number; date: string | null; kind: DayStatus | "empty" }[] = [];
    for (let i = 0; i < leading; i++) {
      out.push({ num: prevMonthLastDate - leading + 1 + i, date: null, kind: "empty" });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = todayStr(new Date(year, month, day));
      let kind: DayStatus | "empty" = "empty";
      if (dateStr === now) {
        kind = todayStatus;
      } else if (dateStr < now) {
        kind = monthRecords[dateStr]?.status ?? "empty";
      }
      out.push({ num: day, date: dateStr <= now ? dateStr : null, kind });
    }
    const trailing = (7 - (out.length % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
      out.push({ num: i, date: null, kind: "empty" });
    }
    return out;
  }, [year, month, monthRecords, now, todayStatus]);

  const detail = selectedDate ? monthRecords[selectedDate] : null;
  const detailDate = selectedDate ? new Date(selectedDate) : null;
  const isToday = selectedDate === now;
  const detailStatus: DayStatus | null = isToday ? todayStatus : (detail?.status ?? null);

  return (
    <div className="rounded-2xl border border-line bg-paper-card p-4 pb-3.5">
      <div className="mb-3.5 flex items-center justify-between">
        <button
          type="button"
          aria-label="上個月"
          onClick={() => onNavigate(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1)}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-line bg-paper text-[13px] text-ink-soft"
        >
          ‹
        </button>
        <span className="font-serif text-[15px] font-bold">
          {year} 年 {month + 1} 月
        </span>
        <button
          type="button"
          aria-label="下個月"
          onClick={() => onNavigate(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1)}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-line bg-paper text-[13px] text-ink-soft"
        >
          ›
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7">
        {WEEKDAY_CN.map((w) => (
          <span key={w} className="text-center font-mono text-[9.5px] text-ink-faint">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-x-0.5 gap-y-2.5">
        {cells.map((cell, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className={`font-mono text-[10.5px] ${cell.date ? "text-ink-soft" : "text-ink-faint opacity-50"}`}
            >
              {cell.num}
            </span>
            <button
              type="button"
              disabled={!cell.date}
              onClick={() => cell.date && setSelectedDate((d) => (d === cell.date ? null : cell.date))}
              className="h-8 w-8 rounded-full"
              style={
                selectedDate === cell.date
                  ? { boxShadow: "0 0 0 2px #FFFFFF, 0 0 0 3.4px #C1567A" }
                  : undefined
              }
            >
              <DayFace kind={cell.kind} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {[
          { color: "#3C8452", label: "全部完成" },
          { color: "#E0A428", label: "超額完成" },
          { color: "#D9762F", label: "部分完成" },
          { color: "#B0937A", label: "沒有完成" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {selectedDate && detailDate && (
        <div className="fade-slide mt-4 border-t border-dashed border-line pt-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-serif text-sm font-bold">
              {detailDate.getMonth() + 1} 月 {detailDate.getDate()} 日 · 星期{WEEKDAY_CN[detailDate.getDay()]}
            </span>
            <button
              type="button"
              aria-label="關閉"
              onClick={() => setSelectedDate(null)}
              className="border-none bg-none text-[15px] text-ink-faint"
            >
              ×
            </button>
          </div>
          {detailStatus && (
            <div className="mb-2.5 flex items-center gap-1.5 text-xs">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: STATUS_META[detailStatus].color }}
              />
              <span className="text-ink-soft">{STATUS_META[detailStatus].label}</span>
            </div>
          )}
          {!detail || detail.records.length === 0 ? (
            <div className="text-xs text-ink-soft">當日沒有設定任何小事。</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {detail.records.map((r) => {
                const cat = r.categoryId ? catById.get(r.categoryId) : undefined;
                return (
                  <div
                    key={r.habitId}
                    className="flex items-center gap-2 rounded-[10px] border border-line-soft bg-paper px-2.5 py-1.5 text-[12.5px]"
                  >
                    <span
                      className="h-1.5 w-1.5 flex-none rounded-full"
                      style={{ background: cat?.color ?? "#BBA995" }}
                    />
                    <span className="flex-1">{r.name}</span>
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: r.bonus > 0 ? "#E0A428" : "#3C8452" }}
                    >
                      {r.bonus > 0 ? `超額 +${r.bonus}` : "已完成"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
