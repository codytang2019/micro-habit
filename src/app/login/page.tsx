import Link from "next/link";
import { GoogleSignInButton } from "./google-button";

const WHY_LOGIN = [
  { icon: "sync", text: "跨裝置同步資料" },
  { icon: "lock", text: "將資料安全儲存喺雲端" },
  { icon: "restore", text: "唔怕資料會唔見" },
  { icon: "crown", text: "登入先可以享受完整功能" },
];

function WhyIcon({ kind }: { kind: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" } as const;
  switch (kind) {
    case "sync":
      return (
        <svg {...common}>
          <path
            d="M4 12a8 8 0 0 1 13.66-5.66M20 6v5h-5M20 12a8 8 0 0 1-13.66 5.66M4 18v-5h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "restore":
      return (
        <svg {...common}>
          <path
            d="M4 12a8 8 0 1 0 2.34-5.66M4 4v5h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path
            d="M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 10h-13L4 8z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-paper">
      <div
        className="flex items-center gap-2.5 px-5 pb-5 pt-11 shadow-lg"
        style={{
          background: "linear-gradient(135deg, #C85C2E 0%, #A84A24 100%)",
          borderRadius: "0 0 26px 26px",
        }}
      >
        <Link
          href="/app"
          className="flex items-center gap-1 rounded-full border border-white/40 bg-white/20 px-4 py-2 text-[13.5px] font-bold text-white"
        >
          <span className="text-[17px] leading-none">‹</span> 主頁
        </Link>
        <div className="flex-1 text-center font-serif text-[15px] font-bold text-white">登入</div>
        <div className="w-[76px]" />
      </div>

      <div className="flex-1 px-6 pb-10 pt-8">
        {params.error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="mb-4 rounded-md bg-stamp/10 px-3 py-2 text-[13px] text-stamp">
            {params.message}
          </p>
        )}

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stamp text-white">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="#fff" strokeWidth="1.8" />
              <path d="M8 11V8a4 4 0 0 1 7.5-2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-serif text-[22px] font-black text-ink">歡迎！</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
            登入就唔驚無咗你嘅小事紀錄
          </p>
        </div>

        <GoogleSignInButton />

        <div className="my-5 flex items-center gap-3 text-xs text-ink-faint">
          <div className="h-px flex-1 bg-line" />
          或者
          <div className="h-px flex-1 bg-line" />
        </div>

        <Link
          href="/app"
          className="block w-full rounded-xl border-[1.6px] border-dashed border-line py-3 text-center text-[13px] font-bold text-ink-soft active:bg-paper-card"
        >
          唔登入（繼續睇 preview）
        </Link>

        <div className="mt-9">
          <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
            點解要登入？
          </div>
          <div className="space-y-3">
            {WHY_LOGIN.map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-[13.5px] text-ink">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-stamp/10 text-stamp">
                  <WhyIcon kind={item.icon} />
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
