# 開發進度 & 架構筆記

最後更新：2026-08-17

這份文件記錄「點解咁做」同「做到邊」，畀之後接手（自己或者其他 AI/開發者）快速上手，唔使重新摸索。

## 專案是什麼

「1%習慣」（micro-habit）—— 一個微習慣追蹤 app。設計靈感來自 James Clear《原子習慣》：重複次數（唔係連續天數）驅動習慣養成，累積完成 24 次一件小事就算「已成為習慣」。

- Production 網址：https://micro-habit-prototype.vercel.app
- GitHub repo：https://github.com/codytang2019/micro-habit（`main` branch，已連 Vercel 自動部署）
- Database：Supabase（project ref `qcervgkkfxqbqukyyanp`）

## 技術棧

- **Next.js 15**（App Router，TypeScript，Tailwind CSS）
- **Supabase**：Postgres database + Auth（email/password + Google OAuth）
- 部署：Vercel，git-linked（push 去 `main` 就自動 build & deploy production）

## 為什麼咁揀

- 原本個 project 喺 Vercel 度已經有一個「prototype」deployment（可能係 v0.dev 或者類似 AI builder 直接產生，冇經 git，源碼攞唔返）。因為冇辦法攞返舊源碼，決定由零起一個新嘅 Next.js app，重新實現。
- 揀 Supabase 係因為要「account 概念 + Google 登入 + database」，Supabase 內建 Auth（含 Google OAuth provider）同 Postgres，一次過解決，唔使自己起 auth server。
- 揀 `@supabase/ssr`（而唔係舊嘅 `auth-helpers-nextjs`）係因為呢個係 Supabase 官方現時建議嘅 Next.js App Router 整合方式，支援 Server Components / Route Handlers / Middleware 分別讀寫 cookie-based session。

## 架構總覽

```
src/
  middleware.ts              — 保護 /dashboard、/app：未登入自動彈去 /login
  lib/supabase/
    client.ts                — browser Supabase client（Client Components 用）
    server.ts                — server Supabase client（Server Components/Actions 用）
    middleware.ts            — session refresh 邏輯
  lib/habits/
    types.ts                 — 共用型別、預設分類、範本習慣、常數（MASTERY_THRESHOLD_REPS=24 等）
    dates.ts                 — 日期工具（todayStr、getPeriod 早/午/晚 分段等）
    queries.ts                — 讀取邏輯（server-only，經 Supabase RLS 自動限定當前用戶）
    actions.ts                — 寫入邏輯（"use server" Server Actions：打卡、加/改/刪習慣等）
  app/
    page.tsx                 — 首頁，已登入 → redirect /app，未登入 → 導向 /login
    login/                   — 登入頁（email/password + Google OAuth 按鈕）
    auth/callback/route.ts   — OAuth / email 確認後嘅 callback route
    dashboard/page.tsx        — 純 redirect 去 /app（歷史包袱，保留畀舊連結用）
    app/
      page.tsx                — 主要習慣追蹤頁（Server Component，一次過 fetch 晒 habits/categories/today entries/月曆資料）
      api/month/route.ts      — 月曆換月份時，前端 fetch 呢個 API 攞新月份資料
      components/
        HabitTracker.tsx      — 主 client 組件，管理 home/calendar/mastery/add 四個 view 切換
        HabitCard.tsx          — 單一習慣卡片：蓋章打卡、超額滑桿、編輯/刪除
        CalendarView.tsx       — 集章月曆 + 日期詳情
        MasteryView.tsx        — 「已成為習慣」進度頁
        AddHabitForm.tsx       — 新增/編輯習慣表單（範本 + 自訂造句）
        StampMark.tsx / DayFace.tsx — SVG 視覺組件
```

## Database Schema（Supabase）

三個 migration，按順序喺 Supabase SQL Editor 跑（`supabase/migrations/`）：

1. **`0001_profiles.sql`** — `profiles` table，一對一連 `auth.users`。新用戶註冊（email 或 Google）時用 trigger 自動建立一條 profile row。有 Row Level Security：用戶只可以睇/改自己嗰行。
2. **`0002_habits.sql`** — 最初版 `habits` + `habit_logs` table（簡單版：name/emoji + 完成日期）。
3. **`0003_habit_details.sql`** — 擴充版，支援移植返嚟嘅完整 UI：
   - `categories` table：4 個內建分類（work/health/mind/life）+ 用戶自訂分類，用 RLS 分開 built-in（人人可讀）同用戶專屬。
   - `habits` 加咗 `category_id`、`trigger_phrase`（造句用嘅觸發語句）、`time_of_day`、`unit`、`floor_target`、`sort_order`、`archived_at`（軟刪除，唔係真刪）。
   - `habit_logs` 加咗 `bonus_count`（超額完成次數，即係「盖章之後仲想加多幾下」嗰個滑桿）。

全部 table 都開咗 RLS，用戶淨係睇到/改到自己嘅資料。

## 已知問題 / 決策記錄

- **`.env.local.txt` 事件**：早期不小心將含 Supabase anon key 嘅檔案（`.env.local.txt`，副檔名唔喺 `.gitignore` 排除範圍）commit 咗上公開 repo。已提醒用戶用 `git rm` 清走。**風險評估：低** —— 洩漏嘅係 Supabase publishable/anon key，呢類 key 本身設計就係俾前端公開用，真正防護喺 RLS policies，唔靠隱藏呢條 key。
- **Next.js 版本**：原本用 `15.0.3`，Vercel deploy 時偵測到 CVE-2025-66478（已知安全漏洞）直接封鎖部署，已升級去 `^15.4.7`（patched）。**之後升級 Next.js 記得留意有冇新 CVE 封鎖。**
- **Vercel 「Production Overrides」陷阱**：Project Settings 入面雖然 Framework Preset 已經係 Next.js，但 project 曾經有一個獨立嘅 production-only override（Framework: "Other"，Output Directory: "public"），源於最初嗰個非 git deployment 遺留嘅設定，一度令 build 成功但 deploy 報 "No Output Directory named public" 錯誤。已修正。
- ~~**swipe-to-reveal 未完整實現**~~：已於 2026-08-20 實裝（見下面 pain points 記錄），`HabitCard.tsx` 而家用 Pointer Events 做真・swipe 手勢，`⋯` 按鈕已移除。
- **`fetchMonthRecords` 嘅歷史習慣數限制**：月曆判斷某日係咪「全部完成」，係攞「現有」習慣總數嚟比較，冇追蹤某日當時實際有幾多個習慣存在（例如你舊時有 3 個習慣，而家得返 2 個，舊日子嘅「全部完成」判斷會用而家嘅 2 個嚟計，可能唔準確）。日後如果要精確歷史統計，需要另外儲存「某日有效習慣快照」。

## 部署流程備忘

因為呢個 session 冇獲授權直接 push 去 `codytang2019/micro-habit`（git proxy 未加入呢個 repo 嘅 authorized 名單），流程係：

1. AI 喺 cloud workspace 度修改代碼、驗證（brace/paren balance check、手動 review，因為冇 npm registry 網絡權限跑唔到 `tsc`/`next build`）
2. 用 `SendUserFile` 將改動咗嘅檔案傳去用戶電腦
3. 用戶喺自己電腦 PowerShell 手動 `git add / commit / push`
4. Vercel 見到 `main` 有新 push，自動 build + deploy production

用戶電腦 project 路徑：`C:\Users\codyt\OneDrive\文件\mirco-habit`

## 下一步可以做嘅嘢

- [ ] 手機 UI 微調（現有設計主要跟 prototype 嘅 phone-frame 尺寸，響應式表現未特別測試過闊 viewport）
- [x] ~~完善 swipe 手勢~~ —— 已完成，見 2026-08-20 pain points 記錄。
- [ ] 加返「音效／震動回饋」（原 prototype 有蓋章音效，Web Audio API + navigator.vibrate，Next.js 版未移植）
- [ ] 加通知／提醒功能（原 prototype UI 有 notif-banner 樣式但未接實際推播邏輯）
- [ ] 歷史月曆準確度優化（見上面「已知問題」）
- [ ] 清理 GitHub repo 入面殘留嘅 `.env.local.txt`（如果用戶仲未刪）

## Pain points 記錄（2026-08-19）

用戶回報 4 個痛點，逐一 code review 咗根源，記錄喺呢度方便之後接手實裝。

### 1. 「小事」應該 carry forward 到每一日，直到用戶主動刪除

**狀態：程式碼睇落已經係咁做，唔係 bug —— 需要用戶實測確認邊個情況唔啱。**

`fetchHabits()`（`src/lib/habits/queries.ts`）本身冇按日期 filter，攞返嘅係「而家仲未 archive」嘅全部 habit（`archived_at is null`），冇話個 habit 幾時 create 就淨係嗰日之後先出現。`deleteHabit()`（`src/lib/habits/actions.ts`）都係軟刪除（set `archived_at`），唔係真刪，用戶刪走之後先會喺列表消失。換句話講，加咗嘅小事理論上會每日出現，直到用戶按刪除為止 —— 呢個同用戶想要嘅行為一致。

如果用戶實測發現有啲小事無端無故消失咗，可能嘅原因反而喺「已知問題」嗰段提過嘅 `fetchMonthRecords` 歷史快照問題（月曆用「現有」habit 數量倒推歷史某日狀態，唔係當日真實快照）—— 但呢個只影響月曆嘅「全部完成」判斷顏色，唔影響主頁「今天的小事」列表本身。建議：用戶下次見到呢個情況時記低係邊個畫面（主頁 / 月曆）、邊件小事，先好落手改。

### 2. 累積次數應該以「日」為單位計，同一件小事一日超額完成 5 次都只計 1 次

**狀態：已修好（2026-08-19）。**

`fetchTotalReps()` 同 `fetchRepsByHabit()`（`src/lib/habits/queries.ts`）已經改咗：唔再用 `1 + bonus_count` 計，改為淨計「有打卡嘅記錄數」（一件小事一日一條 `habit_logs` 記錄，唔理當日 `bonus_count` 係幾多都只計 1 次）。`bonus_count` 而家淨係用喺主頁嗰粒 emoji／滑桿做「今日超額視覺回饋」（`HabitCard.tsx`、`CalendarView.tsx` 嗰個「超額 +N」標籤），唔會再谷大「累積完成 X 次」同「已成為習慣」24 次門檻。

⚠️ **注意：** 呢個係計分邏輯變動，會令現有用戶嘅「累積次數」同「已成為習慣」數字比之前細（因為之前用 bonus 谷大咗嗰部分會被扣走）。落地前提提用戶呢個改動嘅影響。

問題喺 `src/lib/habits/queries.ts` 嘅 `fetchTotalReps()` 同 `fetchRepsByHabit()`：

```ts
data.reduce((sum, r) => sum + 1 + (r.bonus_count ?? 0), 0);
```

依家係「每條 `habit_logs` 記錄」計 `1 + bonus_count`。因為 `bonus_count` 最大可以去到 `BONUS_MAX = 5`（`types.ts`），一日之內一件小事最多可以貢獻 `1 + 5 = 6` 次去「累積完成 X 次」（主頁）同「已成為習慣」24 次門檻（`MasteryView.tsx` 用嘅就係 `fetchRepsByHabit` 呢個數）。即係用戶想避免嘅「超額完成 5 次都計晒」而家真係會發生。

**建議修法：** 「累積次數 / 已成為習慣」呢兩個統計應該改成計「有打卡嘅日數」（distinct `completed_on` per habit），唔理當日 `bonus_count` 係幾多；`bonus_count` 淨係做主頁嗰粒 emoji／滑桿嘅「今日超額視覺回饋」，唔應該計入 24 次門檻。改法大致：

```ts
export async function fetchRepsByHabit(userId: string): Promise<Map<string, number>> {
  // 淨係計日數，唔加 bonus_count
  const { data } = await supabase
    .from("habit_logs")
    .select("habit_id")
    .eq("user_id", userId);
  const map = new Map<string, number>();
  (data ?? []).forEach((log) => {
    map.set(log.habit_id, (map.get(log.habit_id) ?? 0) + 1);
  });
  return map;
}
```

`fetchTotalReps()` 可以同樣改成 `data.length`（一條 log = 一日 = 1 次）。要留意呢個係計分邏輯變動，會令現有用戶嘅「已成為習慣」數字倒退（因為之前用 bonus 谷大咗），落地前要諗清楚點同用戶溝通呢個改動。

### 3. Login 應該 keep auto login，唔應該每次開瀏覽器都要重新登入

**狀態：程式碼用嘅係標準 pattern，理論上應該已經會 persist —— 需要進一步診斷先知邊度斷咗。**

`src/lib/supabase/client.ts`、`server.ts`、`middleware.ts` 用嘅係 Supabase 官方建議嘅 `@supabase/ssr` cookie-based session（唔係得個 in-memory / localStorage token），`middleware.ts` 每個 request 都會 `getUser()` 順便 refresh session cookie —— 呢個係跨瀏覽器關閉都應該記得登入嘅正確寫法，源碼層面睇唔到明顯錯處。

用戶會不斷被踢返去 login，比較可能係以下幾個原因，需要逐個排查：

- **Supabase Auth 設定嘅 session/JWT 過期時間** 太短（Supabase Dashboard → Authentication → Sessions，睇 "Time-box user sessions" 同 refresh token 設定）。
- **瀏覽器本身清 cookie**（無痕模式 / iOS Safari 嘅 ITP / 用戶手動清瀏覽紀錄）—— 如果係手機加咗「加到主畫面」用緊 PWA 模式，部分瀏覽器對 PWA 嘅 cookie 儲存策略同一般分頁唔一樣，值得確認用戶係用緊邊種方式開個 app。
- Cookie 嘅 `sameSite` / `secure` / `domain` 設定如果同 production domain 唔夾（例如自訂 domain 冇設好），都會令 session cookie 收唔到。

建議下一步：先問用戶「係邊部裝置 / 邊個瀏覽器 / 幾耐冇開會被踢」，再去 Supabase Dashboard 睇返 session 過期設定，先好埋手改碼。

**相關但獨立嘅 bug，已修好（2026-08-20）：本機測試 Google 登入要撳兩次先得。**

根源同上面「keep auto login」呢個 pain point 唔同，係一個具體、已經搵到嘅設定錯配問題：`.env.local` 嘅 `NEXT_PUBLIC_SITE_URL` 設咗做 production 網址（`https://micro-habit-prototype.vercel.app`），但 `src/app/login/google-button.tsx` 撳「用 Google 帳號登入」嗰陣，`redirectTo` 一律用返 `NEXT_PUBLIC_SITE_URL`（如果有設）。結果本機開 `localhost:3000` 測試，Google 授權完會俾人拉去 **production** 個 `/auth/callback`，本機瀏覽器收唔到 session cookie，第一次撳好似冇反應；第二次撳（或者 reload）先「好似得咗」，其實係搭正之前殘留低嘅狀態，唔係真係修復咗。

**已修法：**

- `src/app/login/google-button.tsx` —— 呢個 button 淨係喺瀏覽器行，改用 `window.location.origin`（用戶而家實際嗰個 domain，本機／preview／production 都啱）,唔再理 `NEXT_PUBLIC_SITE_URL`。
- `src/app/login/actions.ts` 嘅 `signUpWithEmail`（email 確認連結用嘅 redirect）—— 呢個係 server action，冇 `window`，改用新增嘅 `getRequestOrigin()` helper，靠 `next/headers` 嘅 `host`/`x-forwarded-host` 攞返呢個 request 實際嘅 origin，一樣唔再靠 `NEXT_PUBLIC_SITE_URL`（得喺攞唔到 header 嗰種極端情況先 fallback 用返佢）。

**注意：** `.env.local` 嘅 `NEXT_PUBLIC_SITE_URL` 而家已經冇任何程式碼會讀（`auth/callback/route.ts` 一直都係用返 request 嘅 `origin`，冇呢個問題）。可以考慮之後直接喺 `.env.local` 刪走呢個變數，減少之後再撞到同一種「本機/production 設定唔夾」嘅陷阱；但因為佢而家已經冇被讀，唔刪都唔會再出事。

### 4. 新增第一個小事嗰刻先要求登入 —— 之前應該俾用戶 preview 成個 app

**狀態：已實裝（2026-08-19）。**

改咗嘅檔案：

- `src/lib/supabase/middleware.ts` —— 移除咗「未登入即刻 redirect 去 `/login`」嘅邏輯，而家淨係負責 refresh session cookie，唔再鎖 `/app`。
- `src/app/page.tsx` —— 首頁唔再判斷登入狀態，一律 `redirect("/app")`。
- `src/app/app/page.tsx` —— 未登入用戶唔再被踢，而係用新增嘅 `getGuestPreviewData()`（`src/lib/habits/guest-preview.ts`）畀一組靜態 demo 資料（4 件示範小事，攞自 `PRESETS`），連 `HabitTracker` 一個新 `isGuest` prop。
- `src/lib/habits/guest-preview.ts`（新檔案）—— 純前端假資料，唔碰 database，包括 demo habits／今日打卡狀態／累積次數／單一個月嘅集章月曆記錄。
- `src/app/app/components/HabitTracker.tsx` —— 加咗 `isGuest` prop 同 `requireLogin()`（redirect 去 `/login`，帶友善提示文字）。Guest 模式下：
  - 主頁上方多一格「你而家睇緊預覽模式，資料唔會儲存」提示 + 登入連結。
  - 右上角「登出」變返做「登入」。
  - 「新增你的小事」（`openAdd`）、編輯（`openEdit`）、「清除所有資料」（`handleReset`）、換月曆月份（`handleNavigateMonth`，因為 `/app/api/month` 要登入）呢幾個動作撳落會轉去登入頁。
  - 底部 nav bar 多一粒「登入」（跟返用戶提供嘅參考圖，做獨立一格放喺 bar 度，唔係成頁擋晒）。
- `src/app/app/components/HabitCard.tsx` —— 加咗 `isGuest` / `onRequireLogin` prop，蓋章打卡（`handleStamp`）、超額滑桿放手（`handleBonusCommit`）、刪除（`handleDelete`）呢幾個寫資料動作喺 guest 模式會轉去登入頁；滑桿本身仲可以拖動睇下效果（`handleBonusChange` 淨係更新本地 state），但唔會真係儲存。
- `src/app/login/actions.ts` 嘅 `signOut()` —— 本機測試時發現登出之後仲係彈返去 `/login`，同「/app 而家支援 guest preview」呢個新行為唔一致（用戶會以為登出即刻被逼去登入畫面）。已改成登出後 `redirect("/app")`，登出即刻見返主頁 preview，唔會再彈登入頁。
- `src/app/login/page.tsx` —— 本機測試後用戶要求登入頁重新設計，跟返一張參考圖，整個換咗：
  - 頂部橙色 header 加返「‹ 主頁」button（`Link href="/app"`），撳到會返去 preview，唔會再冇路可返。
  - 「歡迎！」歡迎文案 + 副標題鼓勵登入。
  - **淨係保留 Google 登入一個按鈕**（`GoogleSignInButton`），移除咗 email/password 表單同 sign in / sign up 呢兩粒 button（`signInWithEmail`/`signUpWithEmail` 呢兩個 server action 喺 `actions.ts` 保留咗底層邏輯冇刪，淨係而家個頁面冇用到）。
  - 「或者」分隔線之後加多一個「唔登入（繼續睇 preview）」button，一樣係 `Link href="/app"`，等用戶明確可以揀唔登入。
  - 底部加返一段「點解要登入？」提示文字（跨裝置同步、安全儲存雲端、唔怕資料唔見、登入先有完整功能），用返 icon + 文字列表。
  - 視覺風格改用返成個 app 嘅紙質印章色系（`bg-paper`、`bg-stamp` 橙色 header），唔再係之前純白 neutral 風格。
  - `google-button.tsx` 順便配合改咗樣式（跟返紙質卡片風格）同文字（改做中文「用 Google 帳號登入」）。

**未完成 / 之後可以再打磨：**

- Demo 資料而家淨係得一個靜態月份（今日嗰個月），guest 撳「換月」會直接彈去登入，冇畀佢睇歷史月份嘅 demo 樣式 —— 如果想 preview 更完整，可以擴充 `guest-preview.ts` 畀多幾個月嘅假資料。
- Email/password 登入而家喺 UI 層面完全隱藏咗（用戶明確要求淨係得 Google 按鈕），但底層 `signInWithEmail`/`signUpWithEmail` action 冇刪，如果之後想加返，`login/page.tsx` 需要再加返表單。
- `/app/dashboard` 舊連結冇改動，行為不變。
- 呢個改動未跑過實際 `next build`（呢個 cloud session 冇成個 repo 嘅 `node_modules`，只做咗 brace/paren balance check 同人手 review type 用法），落地前記得喺你電腦跑一次 `npm run build` 或者靠 Vercel preview deployment 確認冇 type error。

### 5. 蓋章打卡有 3-4 秒 delay 先反應

**狀態：已修好（2026-08-20）。**

`HabitCard.tsx` 之前撳蓋章之後，要等成個 `checkInHabit` server action 完成 → `revalidatePath("/app")` 重新 fetch 成頁 7 條 Supabase query（`fetchHabits`/`fetchCategories`/`fetchTodayEntries`/`fetchTotalReps`/`fetchRepsByHabit`/`fetchFirstUseDate`/`fetchMonthRecords`）→ RSC payload 傳返嚟 → 先會見到蓋章變咗做已完成。呢個完整 round trip 就係 3-4 秒 delay 嘅來源。

**修法：** 加咗樂觀更新（optimistic UI）。撳蓋章嗰刻本地 state（`optimisticDone`）即刻變 true，畫面即刻反應；server action 背景繼續行，成功就冇事，如果真係失敗（`checkInHabit` 拋錯）先跌返做未完成，等用戶知道要重試。加咗一個 `useEffect` 監聽 `entry` prop 變化，等 server 真係 revalidate 完之後本地 state 會同步返做準（例如喺第二部裝置打咗卡之後呢邊 refresh 到）。

### 6. Swipe left 顯示編輯/刪除按鈕，取代右上角「⋯」按鈕

**狀態：已實裝（2026-08-20）。**

`HabitCard.tsx` 之前用一粒「⋯」button toggle 顯示編輯/刪除（PROGRESS.md 舊版「已知問題」提過呢個係簡化版，原 prototype 有真・swipe 手勢）。而家改用 Pointer Events（`onPointerDown`/`onPointerMove`/`onPointerUp`/`onPointerCancel`）做真正嘅左滑手勢：

- 用 `setPointerCapture` 等隻手指拖出張卡範圍之外都仲追蹤到。
- 開嘅門檻要拖過 `REVEAL_WIDTH` 一半（等用戶唔會唔小心碰到就開咗），關嘅門檻淨係拖返一啲少少就得（等用戶容易保持顯示）。
- 拖緊嗰陣即時跟手（`transition: none`），放手先做 0.2s ease-out snap 動畫。
- 已經 swipe 開住嗰陣，撳返張卡本身（唔係撳蓋章/滑桿）會即刻收返去，唔使特登再 swipe 一次先蓋到章。
- 「⋯」button 已經完全移除。

呢個用 Pointer Events（唔係分開寫 touch/mouse handler）係因為佢喺觸控裝置同滑鼠都work，唔使重複邏輯。

### 優先順序建議

1. ~~**Pain point 2**（超額計分 bug）~~ —— ✅ 已修好，見上面。
2. ~~**Pain point 4**（preview-before-login）~~ —— ✅ 已實裝，見上面，落地前記得本機 build 一次。
3. ~~**Pain point 5**（蓋章 delay）~~ —— ✅ 已修好。
4. ~~**Pain point 6**（swipe-to-reveal）~~ —— ✅ 已實裝。
5. **Pain point 3**（auto-login）—— 需要用戶提供多啲資訊（裝置/瀏覽器/情境）先可以判斷係咪真係要改碼，定係 Supabase 設定問題；Google 登入要撳兩次嗰個獨立 bug 已經搵到根源同修好。
6. **Pain point 1**（carry forward）—— 睇落已經係現有行為，等用戶提供具體「消失咗」嘅例子先再跟進，暫時唔需要改碼。
