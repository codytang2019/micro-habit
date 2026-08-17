import { signInWithEmail, signUpWithEmail } from "./actions";
import { GoogleSignInButton } from "./google-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Welcome to Micro Habit</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Sign in or create an account to continue
          </p>
        </div>

        {params.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {params.message}
          </p>
        )}

        <GoogleSignInButton />

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" />
          OR
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form className="space-y-3">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              formAction={signInWithEmail}
              className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
            >
              Sign in
            </button>
            <button
              formAction={signUpWithEmail}
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
