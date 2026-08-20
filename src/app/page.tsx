import { redirect } from "next/navigation";

// 首頁唔再分「已登入 → /app」／「未登入 → /login」，
// 而係一律去 /app —— 未登入用戶會喺嗰度見到 preview（demo 資料），
// 撳到會寫資料嘅動作先會被指引去 /login。
export default function Home() {
  redirect("/app");
}
