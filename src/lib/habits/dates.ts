export const WEEKDAY_CN = ["日", "一", "二", "三", "四", "五", "六"];

export function todayStr(d?: Date): string {
  const date = d ?? new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function dateFromStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getPeriod(time: string): "早上" | "下午" | "晚上" {
  const h = parseInt((time || "08:00").split(":")[0], 10);
  if (h >= 5 && h < 12) return "早上";
  if (h >= 12 && h < 18) return "下午";
  return "晚上";
}
