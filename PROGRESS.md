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
- **swipe-to-reveal 未完整實現**：prototype 原本有 swipe 手勢顯示編輯/刪除按鈕，Next.js 版本簡化成一個 `⋯` 按鈕 toggle 顯示（因為 web 版 swipe 手勢複雜度高，優先做返功能齊全）。
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
- [ ] 完善 swipe 手勢（如果想更貼近原 prototype 體驗）
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

### 4. 新增第一個小事嗰刻先要求登入 —— 之前應該俾用戶 preview 成個 app

**狀態：確認係缺口，而家完全冇 preview / guest 模式。**

現時流程好硬：

- `src/app/page.tsx`（首頁）一見到冇登入用戶，即刻 `redirect("/login")`，冇畀機會睇任何內容。
- `src/middleware.ts` + `src/lib/supabase/middleware.ts` 將 `/app` 成個路徑都鎖死，未登入即刻彈去 `/login`。

即係而家用戶未登入連主頁、月曆、已成為習慣呢啲畫面嘅樣都睇唔到，同用戶想要嘅「先畀我睇下個 app 大概點，撳到某啲動作（加第一件小事 / 打卡）先叫我登入」完全相反。

**建議做法（唔改 DB schema，主要係前端 + middleware 邏輯）：**

1. `middleware.ts` 嘅 `protectedPaths` 由成個 `/app` 改做只鎖寫入類 API（或者乾脆唔喺 middleware 層鎖 `/app`，改為喺頁面/元件層判斷）。
2. `/app` 頁面（`src/app/app/page.tsx`）容許冇登入用戶進入，用一組**假資料 / demo habits**（可以攞 `PRESETS` 嗰 4 個分類範本現成內容）取代 `fetchHabits` 等 server 查詢結果，等用戶可以撳日曆／主頁／已成為習慣三個 tab 隨便睇。
3. 主要互動入口收緊做「登入閘」：撳「新增你的小事」（`openAdd`）、撳蓋章打卡（`handleStamp`）、拖超額滑桿呢幾個會寫資料嘅動作，先檢查有冇登入，冇就彈去 `/login`（可以用 query param 話返用戶「登入之後幫你留低呢個習慣」）。
4. UI 層面：喺底部 nav bar 度加多一個「登入」入口（類似用戶提供嘅參考圖，登入做獨立一粒放喺 bar 度，唔係淨係擋成個頁面），等用戶隨時知道自己仲未登入、想登入隨時撳到。

呢個改動牽涉 middleware、`/app/page.tsx`（由 server component 判斷登入與否揀真資料定 demo 資料）、`HabitTracker.tsx`（加登入態 prop，控制邊啲動作要彈登入閘）幾個檔案，建議獨立一個 PR/session 處理，唔好同 pain point 2 嘅計分邏輯改動一齊落。

### 優先順序建議

1. ~~**Pain point 2**（超額計分 bug）~~ —— ✅ 已修好，見上面。
2. **Pain point 4**（preview-before-login）—— 產品體驗缺口，牽涉範圍中等，建議獨立一輪處理。
3. **Pain point 3**（auto-login）—— 需要用戶提供多啲資訊（裝置/瀏覽器/情境）先可以判斷係咪真係要改碼，定係 Supabase 設定問題。
4. **Pain point 1**（carry forward）—— 睇落已經係現有行為，等用戶提供具體「消失咗」嘅例子先再跟進，暫時唔需要改碼。
