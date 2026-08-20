"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    // 呢個 button 淨係喺瀏覽器行，`window.location.origin` 已經係
    // 用戶而家實際嗰個 domain（本機 localhost:3000 / Vercel preview /
    // production 都啱），唔應該再靠 NEXT_PUBLIC_SITE_URL —— 之前
    // 因為 `.env.local` 個 NEXT_PUBLIC_SITE_URL 設咗做 production
    // 網址，搞到本機測試登入完會彈去 production 個 callback，
    // 本機收唔到 session，要撳多次先似係「得」（其實係搭正第一次
    // 遺留低嘅狀態）。
    const siteUrl = window.location.origin;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="flex w-full items-center justify-center gap-3 rounded-xl border-[1.6px] border-line bg-paper-card px-4 py-3.5 text-[14px] font-bold text-ink shadow-sm transition active:scale-[.99]"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.61z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
        />
      </svg>
      用 Google 帳號登入
    </button>
  );
}
