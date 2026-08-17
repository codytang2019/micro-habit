import { MASTERY_THRESHOLD_REPS } from "@/lib/habits/types";
import type { Category, Habit } from "@/lib/habits/types";

export function MasteryView({
  habits,
  repsByHabit,
  categories,
}: {
  habits: Habit[];
  repsByHabit: Map<string, number>;
  categories: Category[];
}) {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const withReps = habits.map((h) => ({ h, reps: repsByHabit.get(h.id) ?? 0 }));
  const mastered = withReps.filter((x) => x.reps >= MASTERY_THRESHOLD_REPS);
  const building = withReps.filter((x) => x.reps < MASTERY_THRESHOLD_REPS);

  return (
    <div>
      <p className="mb-[18px] text-[12.5px] leading-relaxed text-ink-soft">
        重複次數才是重點，不是連續天數。累積完成 {MASTERY_THRESHOLD_REPS}{" "}
        次，這件小事就會列在這裡——就算中間斷過一天，之前累積的次數也不會歸零。
      </p>

      <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
        已成為習慣
      </div>
      {mastered.length === 0 ? (
        <div className="mb-1 rounded-2xl border border-dashed border-line bg-paper-card p-3.5 text-center text-xs text-ink-soft">
          還沒有小事升級，繼續累積次數，很快就有第一個了。
        </div>
      ) : (
        mastered.map(({ h, reps }) => {
          const cat = h.categoryId ? catById.get(h.categoryId) : undefined;
          return (
            <div
              key={h.id}
              className="mb-2.5 flex items-center gap-3 rounded-2xl border p-3"
              style={{ borderColor: "rgba(189,142,46,.4)" }}
            >
              <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-gold/20 text-gold">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M9 13.5L7.5 21 12 18.5 16.5 21 15 13.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium">{h.name}</div>
                <div className="mt-0.5 text-[11px]" style={{ color: cat?.color ?? "#8A7A6D" }}>
                  已經累積完成 {reps} 次
                </div>
              </div>
            </div>
          );
        })
      )}

      {building.length > 0 && (
        <>
          <div className="mb-2.5 mt-[18px] font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
            培養緊
          </div>
          {building.map(({ h, reps }) => {
            const pct = Math.min(100, Math.round((reps / MASTERY_THRESHOLD_REPS) * 100));
            const left = MASTERY_THRESHOLD_REPS - reps;
            return (
              <div key={h.id} className="mb-2.5 flex items-center gap-3 rounded-2xl border border-line bg-paper-card p-3">
                <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-paper-deep text-ink-faint">
                  {reps}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium">{h.name}</div>
                  <div className="mt-0.5 text-[11px] text-ink-soft">
                    {reps}/{MASTERY_THRESHOLD_REPS} 次 · 再 {left} 次就成為習慣
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-deep">
                    <div className="h-full rounded-full bg-indigo" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
