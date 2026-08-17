import { redirect } from "next/navigation";
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
import { HabitTracker } from "./components/HabitTracker";
import { signOut } from "../login/actions";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

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
      />
    </div>
  );
}
