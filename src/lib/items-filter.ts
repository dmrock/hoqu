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

export function isStatusFilterActive(status: ItemStatus[]): boolean {
  return status.length > 0 && status.length < ALL_STATUSES.length;
}
