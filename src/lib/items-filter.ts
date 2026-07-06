import { z } from "zod";
import type { ItemStatus } from "./points";

export const SORT_OPTIONS = [
  { value: "updated-desc", label: "Recently updated" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "year-desc", label: "Year (newest)" },
  { value: "year-asc", label: "Year (oldest)" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In progress" },
  { value: "planned", label: "Planned" },
  { value: "dropped", label: "Dropped" },
];

const ALL_STATUSES: ItemStatus[] = STATUS_OPTIONS.map((s) => s.value);

const sortSchema = z
  .enum(SORT_OPTIONS.map((o) => o.value) as [SortValue, ...SortValue[]])
  .catch("updated-desc");

const statusEnumSchema = z.enum(["completed", "in_progress", "planned", "dropped"]);

export type ItemsFilter = {
  status: ItemStatus[];
  revisitOnly: boolean;
  sort: SortValue;
};

/** Top-level rows per hobby page; keeps the RSC payload/DOM size flat. */
export const ITEMS_PAGE_SIZE = 50;

export function parsePageParam(searchParams: {
  [key: string]: string | string[] | undefined;
}): number {
  const raw = searchParams.page;
  if (typeof raw !== "string") return 1;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export function pageCount(totalRows: number): number {
  return Math.max(1, Math.ceil(totalRows / ITEMS_PAGE_SIZE));
}

/** Page containing the row at 1-based `rank` in the filtered ordering. */
export function pageForRank(rank: number): number {
  return Math.floor((rank - 1) / ITEMS_PAGE_SIZE) + 1;
}

export function parseItemsFilter(searchParams: {
  [key: string]: string | string[] | undefined;
}): ItemsFilter {
  const statusParam = searchParams.status;
  const revisitParam = searchParams.revisit;
  const sortParam = searchParams.sort;

  const statusRaw =
    typeof statusParam === "string"
      ? statusParam.split(",")
      : Array.isArray(statusParam)
        ? statusParam
        : [];

  const parsedStatuses = statusRaw
    .map((s) => statusEnumSchema.safeParse(s))
    .filter((r) => r.success)
    .map((r) => r.data);

  const status = parsedStatuses.length > 0 ? parsedStatuses : [...ALL_STATUSES];

  return {
    status,
    revisitOnly: revisitParam === "1",
    sort: sortSchema.parse(typeof sortParam === "string" ? sortParam : "updated-desc"),
  };
}
