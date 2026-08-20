import { createClient } from "@/lib/supabase/server";
import {
  fetchCategories,
  fetchFirstUseDate,
  fetchHabits,
  fetchMonthRecords,
  fetchRepsByHabit,
  fetchTodayEntries,
  fetchTotalReps,
} from "@/lib/habits/queries";
import { getGuestPreviewData } from "@/lib/habits/guest-preview";
import { HabitTracker } from "./components/HabitTracker";
import { signOut } from "../login/actions";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // 未登入：唔再彈去 /login，改為畀一組 demo 資料，等用戶可以先睇晒
  // 主頁／日曆／已成為習慣三個畫面點樣運作，撳到會寫資料嘅動作
  // （新增/打卡/超額/刪除/清除）先喺元件層彈登入閘。
  if (!user) {
    const guest = getGuestPreviewData();
    return (
      <div className="min-h-screen bg-paper">
        <HabitTracker
          habits={guest.habits}
          categories={guest.categories}
          todayEntries={guest.todayEntries}
          totalReps={guest.totalReps}
          repsByHabit={guest.repsByHabit}
          firstUseDate={guest.firstUseDate}
          initialMonthRecords={guest.monthRecords}
          initialYear={year}
          initialMonth={month}
          userLabel=""
          signOutAction={signOut}
          isGuest
        />
      </div>
    );
  }

  const [habits, categories, todayEntriesMap, totalReps, repsByHabitMap, firstUseDate, monthRecordsMap] =
    await Promise.all([
      fetchHabits(user.id),
      fetchCategories(user.id),
      fetchTodayEntries(user.id),
      fetchTotalReps(user.id),
      fetchRepsByHabit(user.id),
      fetchFirstUseDate(user.id),
      fetchMonthRecords(user.id, year, month),
    ]);

  const todayEntries = Object.fromEntries(todayEntriesMap);
  const repsByHabit = Object.fromEntries(repsByHabitMap);
  const monthRecords = Object.fromEntries(monthRecordsMap);

  return (
    <div className="min-h-screen bg-paper">
      <HabitTracker
        habits={habits}
        categories={categories}
        todayEntries={todayEntries}
        totalReps={totalReps}
        repsByHabit={repsByHabit}
        firstUseDate={firstUseDate}
        initialMonthRecords={monthRecords}
        initialYear={year}
        initialMonth={month}
        userLabel={user.email ?? ""}
        signOutAction={signOut}
        isGuest={false}
      />
    </div>
  );
}
