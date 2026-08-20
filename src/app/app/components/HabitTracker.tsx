"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HabitCard } from "./HabitCard";
import { CalendarView } from "./CalendarView";
import { MasteryView } from "./MasteryView";
import { AddHabitForm } from "./AddHabitForm";
import { getPeriod, todayStr, WEEKDAY_CN, dateFromStr } from "@/lib/habits/dates";
import { resetAllData } from "@/lib/habits/actions";
import type { Category, DayRecord, Habit, TodayEntry } from "@/lib/habits/types";

type View = "home" | "calendar" | "mastery" | "add";

export function HabitTracker({
  habits,
  categories,
  todayEntries,
  totalReps,
  repsByHabit,
  firstUseDate,
  initialMonthRecords,
  initialYear,
  initialMonth,
  userLabel,
  signOutAction,
  isGuest,
}: {
  habits: Habit[];
  categories: Category[];
  todayEntries: Record<string, TodayEntry>;
  totalReps: number;
  repsByHabit: Record<string, number>;
  firstUseDate: string | null;
  initialMonthRecords: Record<string, DayRecord>;
  initialYear: number;
  initialMonth: number;
  userLabel: string;
  signOutAction: () => Promise<void>;
  isGuest: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [preAddView, setPreAddView] = useState<View>("home");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [monthRecords, setMonthRecords] = useState<Record<string, DayRecord>>(initialMonthRecords);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const repsMap = useMemo(() => new Map(Object.entries(repsByHabit)), [repsByHabit]);

  const today0 = dateFromStr(todayStr());
  const daysSinceStart = firstUseDate
    ? Math.round((today0.getTime() - dateFromStr(firstUseDate).getTime()) / 86400000) + 1
    : 1;

  const doneCount = habits.filter((h) => todayEntries[h.id]?.done).length;
  const anyBonus = habits.some((h) => (todayEntries[h.id]?.bonus ?? 0) > 0);
  const todayStatus =
    habits.length > 0 && doneCount === habits.length
      ? anyBonus
        ? "bonus"
        : "done"
      : "pending";

  const masteredCount = habits.filter((h) => (repsByHabit[h.id] ?? 0) >= 24).length;

  const sortedHabits = useMemo(
    () => [...habits].sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay)),
    [habits],
  );

  const grouped = useMemo(() => {
    const groups: { period: string; habits: Habit[] }[] = [];
    let lastPeriod: string | null = null;
    sortedHabits.forEach((h) => {
      const period = getPeriod(h.timeOfDay);
      if (period !== lastPeriod) {
        groups.push({ period, habits: [] });
        lastPeriod = period;
      }
      groups[groups.length - 1].habits.push(h);
    });
    return groups;
  }, [sortedHabits]);

  const requireLogin = () => {
    router.push("/login?message=" + encodeURIComponent("登入之後就可以儲存你的第一件小事"));
  };

  const handleNavigateMonth = async (y: number, m: number) => {
    if (isGuest) {
      // demo 月曆資料淨得一個月，未登入就唔換月，直接指引去登入
      requireLogin();
      return;
    }
    setYear(y);
    setMonth(m);
    setLoadingMonth(true);
    try {
      const res = await fetch(`/app/api/month?year=${y}&month=${m}`);
      if (res.ok) {
        const data = await res.json();
        setMonthRecords(data);
      }
    } finally {
      setLoadingMonth(false);
    }
  };

  const openAdd = () => {
    if (isGuest) return requireLogin();
    setPreAddView(view);
    setEditingHabit(null);
    setView("add");
  };
  const openEdit = (h: Habit) => {
    if (isGuest) return requireLogin();
    setPreAddView(view);
    setEditingHabit(h);
    setView("add");
  };
  const closeAdd = () => setView(preAddView);

  const handleReset = async () => {
    if (isGuest) return requireLogin();
    if (!confirm("確定要清除所有紀錄，重新開始嗎？呢個動作無法復原。")) return;
    await resetAllData();
    window.location.reload();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-10">
        {view === "home" && (
          <>
            <div className="flex items-center justify-between font-mono text-[11px] tracking-wider text-ink-soft">
              <span>
                {today0.getFullYear()}.{String(today0.getMonth() + 1).padStart(2, "0")}.
                {String(today0.getDate()).padStart(2, "0")}
              </span>
              <span>
                星期{WEEKDAY_CN[today0.getDay()]} · 第 {daysSinceStart} 天
              </span>
            </div>
            <div className="my-1.5 flex items-center justify-between">
              <div className="font-serif text-[34px] font-black tracking-wide">1%習慣</div>
              {isGuest ? (
                <button
                  type="button"
                  onClick={requireLogin}
                  className="text-xs font-bold text-stamp underline"
                >
                  登入
                </button>
              ) : (
                <form action={signOutAction}>
                  <button type="submit" className="text-xs text-ink-soft underline">
                    登出
                  </button>
                </form>
              )}
            </div>
            {isGuest && (
              <div className="mb-3.5 flex items-center gap-2 rounded-xl border border-dashed border-stamp/50 bg-stamp/5 px-3 py-2.5 text-[11.5px] text-ink-soft">
                <span className="flex-none">👀</span>
                <span>
                  你而家睇緊 <b className="text-ink">預覽模式</b>，資料唔會儲存。
                  <button type="button" onClick={requireLogin} className="ml-1 font-bold text-stamp underline">
                    登入
                  </button>{" "}
                  先可以開始記錄自己嘅小事。
                </span>
              </div>
            )}
            <p className="mb-[18px] text-[13px] leading-relaxed text-ink-soft">
              每天進步 1%，一年強大 37 倍。
              <br />
              <b className="text-ink">小到不可能失敗</b>，才能持續累積。
              {!isGuest && userLabel ? ` · ${userLabel}` : ""}
            </p>

            <div className="mb-4 flex gap-2.5">
              <button
                type="button"
                onClick={() => setView("calendar")}
                className="flex-1 rounded-[18px] border-[1.5px] border-line bg-paper-card p-3.5 pb-4 text-left text-stamp"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                      <path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-[15px] opacity-60">›</span>
                </div>
                <div className="mb-1.5 text-[11.5px] text-ink-soft">你已經累積完成</div>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-[28px] font-black leading-none">{totalReps}</span>
                  <span className="text-xs text-ink-soft">次</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setView("mastery")}
                className="flex-1 rounded-[18px] border-[1.5px] border-line bg-paper-card p-3.5 pb-4 text-left text-moss"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                      <circle cx="12" cy="9" r="5" stroke="#fff" strokeWidth="1.8" />
                      <path d="M9 13.5L7.5 21 12 18.5 16.5 21 15 13.5" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-[15px] opacity-60">›</span>
                </div>
                <div className="mb-1.5 text-[11.5px] text-ink-soft">你已經養成了</div>
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-[28px] font-black leading-none">{masteredCount}</span>
                  <span className="text-xs text-ink-soft">個習慣</span>
                </div>
              </button>
            </div>

            <div className="my-5 flex items-center gap-2 font-serif text-[15px] font-bold">
              今天的小事
              <span className="h-px flex-1 bg-line" />
            </div>

            {grouped.map((g) => (
              <div key={g.period}>
                <div className="my-3.5 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-ink-faint first:mt-0">
                  {g.period}
                  <span className="h-px flex-1 bg-line-soft" />
                </div>
                {g.habits.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    entry={todayEntries[h.id]}
                    category={h.categoryId ? catById.get(h.categoryId) : undefined}
                    onEdit={openEdit}
                    isGuest={isGuest}
                    onRequireLogin={requireLogin}
                  />
                ))}
              </div>
            ))}

            <button
              type="button"
              onClick={openAdd}
              className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border-[1.6px] border-dashed border-line py-3.5 text-[13px] text-ink-soft active:bg-paper-card"
            >
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.4px] border-ink-faint text-sm">
                +
              </span>
              新增你的小事
            </button>

            <div
              onClick={handleReset}
              className="my-5 cursor-pointer text-center font-mono text-[10.5px] text-ink-faint underline decoration-dotted"
            >
              清除所有資料，重新開始
            </div>
          </>
        )}

        {view === "calendar" && (
          <>
            <div className="mb-2.5 flex items-center gap-2 font-serif text-[15px] font-bold">
              集章月曆
              <span className="h-px flex-1 bg-line" />
            </div>
            <CalendarView
              year={year}
              month={month}
              monthRecords={monthRecords}
              categories={categories}
              todayStatus={todayStatus}
              onNavigate={handleNavigateMonth}
            />
            {loadingMonth && (
              <div className="mt-2 text-center text-xs text-ink-faint">載入中...</div>
            )}
          </>
        )}

        {view === "mastery" && (
          <MasteryView habits={habits} repsByHabit={repsMap} categories={categories} />
        )}

        {view === "add" && (
          <AddHabitForm
            categories={categories}
            habits={habits}
            editingHabit={editingHabit}
            onClose={closeAdd}
          />
        )}
      </div>

      <div className="flex-none px-3.5 pb-4 pt-2.5">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1 rounded-full border border-line bg-paper-card p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-3xl px-1 py-1.5 text-[9.5px] ${
                view === "calendar" ? "bg-stamp/10 font-bold text-stamp" : "text-ink-faint"
              }`}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
                <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 9.5h16M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              日曆
            </button>
            <button
              type="button"
              onClick={() => setView("home")}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-3xl px-1 py-1.5 text-[9.5px] ${
                view === "home" ? "bg-stamp/10 font-bold text-stamp" : "text-ink-faint"
              }`}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
                <path d="M4 11.5L12 4l8 7.5M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              主頁
            </button>
            <button
              type="button"
              onClick={() => setView("mastery")}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-3xl px-1 py-1.5 text-[9.5px] ${
                view === "mastery" ? "bg-stamp/10 font-bold text-stamp" : "text-ink-faint"
              }`}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
                <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M9 13.5L7.5 21 12 18.5 16.5 21 15 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
              已成為習慣
            </button>
            {isGuest && (
              <button
                type="button"
                onClick={requireLogin}
                className="flex flex-1 flex-col items-center gap-0.5 rounded-3xl px-1 py-1.5 text-[9.5px] text-stamp"
              >
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
                  <path
                    d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-bold">登入</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={openAdd}
            aria-label="新增一個新的小事"
            className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-stamp text-2xl leading-none text-white shadow-lg"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
