import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Hey{profile?.full_name ? `, ${profile.full_name}` : ""} 👋
          </h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-neutral-200 p-6 text-sm text-neutral-600">
        Your account is set up. This is a placeholder dashboard — habit
        tracking UI goes here.
      </div>
    </main>
  );
}
