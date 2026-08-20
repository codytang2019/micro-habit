import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session cookie on every request.
 * Does NOT redirect unauthenticated users anymore — /app allows guest
 * preview; the login gate lives in the page/component layer instead.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do not run code between createServerClient and getUser().
  // A simple mistake could cause random logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 呢度刻意冇「未登入就 redirect 去 /login」嘅邏輯：/app 而家容許未登入
  // 用戶進入睇 preview（demo 資料），/dashboard 淨係做返舊連結嘅 redirect。
  // 真正嘅登入閘喺 /app 頁面／元件層 —— 撳到「新增/打卡/超額/刪除/清除」
  // 呢啲會寫資料嘅動作先會被指引去 /login（見 HabitTracker.tsx 嘅
  // requireLogin）。呢個 middleware 現時淨係負責 refresh session cookie。
  void user;

  // IMPORTANT: You *must* return the supabaseResponse object as it is,
  // and not create a new response object.
  return supabaseResponse;
}
