"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const HIGHLIGHT_CLASS = "row-focus-pulse";
const HIGHLIGHT_MS = 1800;

export function RowFocus({ focusId }: { focusId: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!focusId) return;

    function clearFocusParam() {
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }

    const el = document.getElementById(`item-${focusId}`);
    if (!el) {
      // Item isn't visible under the current filter — drop the param silently.
      clearFocusParam();
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add(HIGHLIGHT_CLASS);

    const timer = window.setTimeout(() => {
      el.classList.remove(HIGHLIGHT_CLASS);
      clearFocusParam();
    }, HIGHLIGHT_MS);

    return () => {
      window.clearTimeout(timer);
      el.classList.remove(HIGHLIGHT_CLASS);
    };
  }, [focusId, pathname, router, searchParams]);

  return null;
}
