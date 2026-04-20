import type { ItemStatus } from "@/lib/points";

export type ItemRow = {
  id: string;
  externalId: string;
  title: string;
  imageUrl: string | null;
  year: number | null;
  addedYear: number;
  externalRating: number | null;
  userRating: number | null;
  note: string | null;
  wouldRevisit: boolean;
  status: ItemStatus;
};
