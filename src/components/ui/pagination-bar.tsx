"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export function PaginationBar({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (n: number) => void;
}) {
  const range = useMemo(() => {
    // Always-shown pages: the first/last 4-page blocks, plus the active page and its
    // immediate neighbors (so page/page±1 stay visible even when that lands right at the
    // edge of a block — e.g. page 4 of 27 shows 1 2 3 4 5 ... 24 25 26 27, not just the
    // bare block). A gap of exactly one page is filled in rather than turned into "...",
    // since eliding a single number saves no space.
    const EDGE_SIZE = 4;
    if (totalPages <= EDGE_SIZE * 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const show = new Set<number>();
    for (let i = 1; i <= EDGE_SIZE; i++) show.add(i);
    for (let i = totalPages - EDGE_SIZE + 1; i <= totalPages; i++) show.add(i);
    for (const p of [page - 1, page, page + 1]) {
      if (p >= 1 && p <= totalPages) show.add(p);
    }

    const sorted = Array.from(show).sort((a, b) => a - b);
    const arr: (number | string)[] = [];
    sorted.forEach((p, i) => {
      if (i > 0) {
        const diff = p - sorted[i - 1];
        if (diff === 2) arr.push(sorted[i - 1] + 1);
        else if (diff > 2) arr.push("...");
      }
      arr.push(p);
    });
    return arr;
  }, [page, totalPages]);

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-5">
      <div className="text-sm text-muted-foreground font-sans">
        Showing page{" "}
        <span className="font-semibold text-navy dark:text-gold">{page}</span>{" "}
        of{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {totalPages}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* First Page */}
        <Button
          variant="outline"
          size="icon"
          disabled={page === 1}
          onClick={() => onChange(1)}
          className="h-9 w-9 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all duration-200"
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4 text-gold" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="h-9 w-9 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4 text-gold" />
        </Button>

        {/* Page Numbers */}
        {range.map((p, index) => {
          if (p === "...") {
            return (
              <span
                key={`dots-${index}`}
                className="px-2 text-zinc-450 dark:text-zinc-555 text-sm select-none font-bold"
              >
                ...
              </span>
            );
          }

          const isActive = p === page;
          return (
            <Button
              key={`page-${p}`}
              variant={isActive ? "default" : "outline"}
              onClick={() => onChange(p as number)}
              className={cn(
                "h-9 w-9 font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95",
                isActive
                  ? "bg-navy dark:bg-gold text-white dark:text-[#1a1a1a] shadow-md border-transparent cursor-default"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
              )}
            >
              {p}
            </Button>
          );
        })}

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="h-9 w-9 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4 text-gold" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="icon"
          disabled={page === totalPages}
          onClick={() => onChange(totalPages)}
          className="h-9 w-9 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4 text-gold" />
        </Button>
      </div>
    </div>
  );
}
