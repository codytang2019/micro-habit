"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// 攞返呢個 request 實際嘅 origin（本機 localhost:3000 / Vercel preview /
// production 都啱），唔靠 NEXT_PUBLIC_SITE_URL —— 舊寫法如果嗰個環境變數
// 設咗做 production 網址，本機測試 email 確認連結就會指去 production，
// 本機收唔到 session。呢個做法同 google-button.tsx 用
// `window.location.origin` 嘅諗法一致，淨係呢度係 server action，
// 冇 `window`，改用 request header 嚟攞返真正 host。
async function getRequestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocol = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/app");
}

export async function signUpWithEmail(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const siteUrl = await getRequestOrigin();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Check your email to confirm your account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 登出之後留喺 /app（而家支援未登入 preview），唔再彈去 /login，
  // 用戶會見返主頁，只係少咗登入後先有嘅個人資料。
  redirect("/app");
}
