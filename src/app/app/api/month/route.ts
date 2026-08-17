import { NextResponse } from "next/server";
import { fetchMonthRecords, getCurrentUserId } from "@/lib/habits/queries";

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return NextResponse.json({ error: "Invalid year/month" }, { status: 400 });
  }

  const records = await fetchMonthRecords(userId, year, month);
  const obj = Object.fromEntries(records);
  return NextResponse.json(obj);
}
