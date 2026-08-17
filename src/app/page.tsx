import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold">Micro Habit</h1>
      <p className="max-w-md text-neutral-600">
        Build tiny habits that stick. Sign in to start tracking.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-neutral-900 px-6 py-3 text-white transition hover:bg-neutral-700"
      >
        Get started
      </Link>
    </main>
  );
}
