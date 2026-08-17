import type { DayStatus } from "@/lib/habits/types";

const COLORS: Record<string, string> = {
  done: "#3C8452",
  bonus: "#E0A428",
  partial: "#D9762F",
  missed: "#B0937A",
  pending: "#F3E1CC",
};

export function DayFace({ kind }: { kind: DayStatus | "empty" | null }) {
  const bg = kind ? COLORS[kind] : "none";
  const fg = kind === "pending" ? "#8A7A6D" : "#fff";
  let face = null;

  if (kind === "done") {
    face = (
      <>
        <path d="M13 17c1.5 2 3.5 2 5 0" stroke={fg} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M22 17c1.5 2 3.5 2 5 0" stroke={fg} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M14 24c2.5 3 9.5 3 12 0" stroke={fg} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    );
  } else if (kind === "bonus") {
    face = (
      <>
        <circle cx="15" cy="17" r="1.6" fill={fg} />
        <circle cx="25" cy="17" r="1.6" fill={fg} />
        <path d="M13 23c3 4.5 11 4.5 14 0" stroke={fg} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M20 8l1 3M31 15l-3 1M9 15l3 1" stroke={fg} strokeWidth="1.4" strokeLinecap="round" />
      </>
    );
  } else if (kind === "partial") {
    face = (
      <>
        <circle cx="15" cy="17" r="1.6" fill={fg} />
        <circle cx="25" cy="17" r="1.6" fill={fg} />
        <path d="M14 24.5q3 -2.4 6 0t6 0" stroke={fg} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    );
  } else if (kind === "missed") {
    face = (
      <>
        <circle cx="15" cy="17" r="1.6" fill={fg} />
        <circle cx="25" cy="17" r="1.6" fill={fg} />
        <path d="M14 24.5h12" stroke={fg} strokeWidth="2" strokeLinecap="round" />
      </>
    );
  } else if (kind === "pending") {
    face = (
      <>
        <circle cx="15" cy="18" r="1.3" fill={fg} />
        <circle cx="25" cy="18" r="1.3" fill={fg} />
        <circle cx="20" cy="24.5" r="1.3" fill={fg} />
      </>
    );
  }

  const strokeProps =
    kind === "pending"
      ? { stroke: "#BBA995", strokeWidth: 1.3, strokeDasharray: "3,2" }
      : kind === "empty" || !kind
        ? { stroke: "#F0D6BA", strokeWidth: 1.3 }
        : {};

  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%">
      <circle cx="20" cy="20" r="18" fill={kind === "empty" || !kind ? "none" : bg} {...strokeProps} />
      {face}
    </svg>
  );
}
