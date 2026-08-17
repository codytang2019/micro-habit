import { redirect } from "next/navigation";

// The real habit tracker lives at /app. This route exists so existing
// links/redirects (login, middleware) that point at /dashboard keep working.
export default function DashboardPage() {
  redirect("/app");
}
