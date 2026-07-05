import type { ItemStatus } from "@/lib/points";

export type ExportedProfile = {
  username: string | null;
  totalPoints: number;
  moviesCompleted: number;
  showsCompleted: number;
  gamesCompleted: number;
  booksCompleted: number;
  itemsRated: number;
};

export type ExportedItem = {
  title: string;
  hobby: string;
  externalId: string;
  status: ItemStatus | null;
  userRating: number | null;
  note: string | null;
  wouldRevisit: boolean;
  year: number | null;
  seasonNumber: number | null;
  seasonCount: number | null;
  /** For TV season rows: the parent show's externalId / title. Null elsewhere. */
  parentExternalId: string | null;
  parentTitle: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type ExportedAchievement = {
  slug: string;
  unlockedAt: string;
};

export type DataExport = {
  exportedAt: string;
  profile: ExportedProfile;
  items: ExportedItem[];
  achievements: ExportedAchievement[];
};

const CSV_COLUMNS = [
  "title",
  "hobby",
  "externalId",
  "status",
  "userRating",
  "note",
  "wouldRevisit",
  "year",
  "seasonNumber",
  "seasonCount",
  "parentExternalId",
  "parentTitle",
  "completedAt",
  "createdAt",
] as const satisfies readonly (keyof ExportedItem)[];

function csvField(value: string | number | boolean | null): string {
  if (value === null) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** Flatten items to CSV, one row per item — season rows included as-is. */
export function itemsToCsv(items: ExportedItem[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const item of items) {
    lines.push(CSV_COLUMNS.map((key) => csvField(item[key])).join(","));
  }
  return `${lines.join("\n")}\n`;
}
