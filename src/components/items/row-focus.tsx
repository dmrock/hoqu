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

    // The table row and the stacked card both carry this id and only one is
    // rendered at a time, so getElementById would keep returning the hidden
    // one. offsetParent is null for a `display: none` subtree.
    const candidates = document.querySelectorAll<HTMLElement>(`[id="item-${CSS.escape(focusId)}"]`);
    const el = Array.from(candidates).find((c) => c.offsetParent !== null) ?? candidates[0];
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
