import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Server-rendered pager: plain links so the hobby page stays an RSC. Hidden
 * entirely for single-page collections. `prevHref`/`nextHref` are prebuilt by
 * the page so filter params survive navigation.
 */
export function ItemsPagination({
  page,
  totalPages,
  prevHref,
  nextHref,
}: {
  page: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
      {prevHref ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={prevHref}>
            <ChevronLeft />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft />
          Previous
        </Button>
      )}
      <p className="font-mono text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      {nextHref ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={nextHref}>
            Next
            <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
          <ChevronRight />
        </Button>
      )}
    </nav>
  );
}
