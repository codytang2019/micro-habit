export type Category = {
  id: string;
  label: string;
  color: string;
  isBuiltin: boolean;
};

export type Habit = {
  id: string;
  name: string;
  char: string; // stamp glyph, defaults to first char of name
  unit: string;
  floorTarget: number;
  categoryId: string | null;
  timeOfDay: string; // 'HH:MM'
  triggerPhrase: string | null;
  sortOrder: number;
};

export type TodayEntry = {
  habitId: string;
  done: boolean;
  bonus: number;
  logId: string | null;
};

export type DayStatus = "done" | "bonus" | "partial" | "missed" | "pending";

export type DayRecord = {
  date: string; // 'YYYY-MM-DD'
  status: DayStatus;
  records: {
    habitId: string;
    name: string;
    char: string;
    categoryId: string | null;
    done: boolean;
    bonus: number;
  }[];
};

export const MASTERY_THRESHOLD_REPS = 24;
export const BONUS_MAX = 5;

export const POPULAR_TRIGGERS = [
  "刷牙後",
  "喝完咖啡後",
  "搭地鐵時",
  "洗澡前",
];

export const PRESETS: Record<
  string,
  { name: string; unit: string; time: string; trigger: string }[]
> = {
  work: [
    { name: "清空電腦桌面 1 個檔案", unit: "個", time: "09:00", trigger: "打開電腦" },
    { name: "讀完 1 頁書", unit: "頁", time: "09:30", trigger: "泡好一杯咖啡或茶" },
    { name: "背 1 個新單字", unit: "個", time: "12:30", trigger: "吃完午餐" },
    { name: "寫下 1 句話", unit: "句", time: "10:00", trigger: "打開筆記本" },
    { name: "關閉 3 個不需要的分頁", unit: "個", time: "11:00", trigger: "覺得思緒有點亂" },
  ],
  health: [
    { name: "早上喝 1 滿杯溫水", unit: "杯", time: "07:00", trigger: "起床後" },
    { name: "雙手高舉伸展 5 秒", unit: "次", time: "14:00", trigger: "久坐超過 1 小時" },
    { name: "做 1 次伏地挺身", unit: "次", time: "17:00", trigger: "下班脫鞋後" },
    { name: "遠眺 20 呎外物體 20 秒", unit: "次", time: "15:30", trigger: "覺得眼睛有點累" },
    { name: "睡前把手機放到拿不到的地方", unit: "次", time: "22:30", trigger: "刷完牙" },
  ],
  mind: [
    { name: "想出 1 件值得感謝的小事", unit: "件", time: "21:00", trigger: "關燈躺下後" },
    { name: "閉眼做 3 次深呼吸", unit: "次", time: "12:00", trigger: "開會前" },
    { name: "用 1 個詞形容現在心情", unit: "次", time: "18:00", trigger: "下班打卡後" },
    { name: "睡前對自己說一句讚美", unit: "句", time: "23:00", trigger: "刷完牙" },
  ],
  life: [
    { name: "把 1 件擺錯位置的東西歸位", unit: "件", time: "20:00", trigger: "換睡衣時" },
    { name: "確認一次帳戶餘額", unit: "次", time: "20:30", trigger: "洗完澡" },
    { name: "刪除 1 張模糊或重複的照片", unit: "張", time: "21:30", trigger: "滑手機等車時" },
    { name: "飯後順手洗 1 個碗", unit: "個", time: "19:00", trigger: "放下筷子後" },
  ],
};

export const CUSTOM_CAT_PALETTE = [
  "#7C5A78",
  "#4C7A76",
  "#7C8C4A",
  "#8C6239",
  "#5A7A94",
  "#9C5B5B",
];
