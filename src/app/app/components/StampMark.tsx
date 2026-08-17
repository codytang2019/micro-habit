"use client";

import { useMemo } from "react";

export function StampMark({ char }: { char: string }) {
  const rot = useMemo(() => (Math.random() * 10 - 5).toFixed(1), []);
  return (
    <svg
      className="stamp-mark"
      style={{ ["--rot" as string]: `${rot}deg` }}
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
    >
      <circle cx="50" cy="50" r="42" fill="#C85C2E" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="1.6"
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Noto Serif TC',serif"
        fontWeight="700"
        fontSize="40"
        fill="#fff"
      >
        {char}
      </text>
    </svg>
  );
}
