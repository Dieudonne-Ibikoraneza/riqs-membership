"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/lib/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Audit() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["adminAuditLogs", page],
    queryFn: () => getAuditLogs(page, pageSize),
  });

  const logs = data?.logs || [];
  const total = data?.pagination.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Format actionType to friendly title case
  const formatActionType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Format details text (shorten UUIDs to look beautiful and professional)
  const formatDetails = (text: string | null) => {
    if (!text) return "Administrative Action";
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    return text.replace(uuidRegex, (match) => `${match.substring(0, 8)}...`);
  };

  // Clean date formatter
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Badge colors depending on action type
  const getBadgeVariant = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("approve") || t.includes("accept")) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
    }
    if (t.includes("reject") || t.includes("fail") || t.includes("delete")) {
      return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400";
    }
    if (t.includes("correction") || t.includes("flag") || t.includes("update")) {
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    }
    if (t.includes("email") || t.includes("mail") || t.includes("send")) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    }
    return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Audit Log</h1>
        <p className="text-sm text-muted-foreground font-sans">
          A chronological record of all secure administrative actions.
        </p>
      </div>

      {isLoading ? (
        <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10">
          <CardContent className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="mt-4 text-sm text-muted-foreground font-sans">
              Loading system audit logs...
            </p>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10">
          <CardContent className="py-16 text-center text-sm text-muted-foreground font-sans">
            No audit logs found in the database registry.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border border-zinc-150 dark:border-zinc-800/80 overflow-hidden shadow-sm bg-white dark:bg-zinc-900 animate-fade-in">
            <CardContent className="p-0">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.map((l, i) => (
                  <motion.li
                    key={l.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-4 p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy/10 text-navy dark:bg-gold/15 dark:text-gold">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm md:text-base leading-snug">
                          {formatDetails(l.details)}
                        </span>
                        <span
                          className={cn(
                            "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            getBadgeVariant(l.actionType)
                          )}
                        >
                          {formatActionType(l.actionType)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground font-sans">
                        Performed by: <strong className="text-zinc-700 dark:text-zinc-300">{l.actionByEmail}</strong>
                        {l.member?.fullName && (
                          <>
                            {" "}· Affected member: <strong className="text-zinc-700 dark:text-zinc-300">{l.member.fullName}</strong>
                          </>
                        )}
                        {" "}· {formatDate(l.createdAt)}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="text-sm text-muted-foreground font-sans">
                Showing page <span className="font-semibold text-navy dark:text-gold">{page}</span> of{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalPages}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1}
                  onClick={() => setPage(1)}
                  className="h-9 w-9 border-zinc-200 dark:border-zinc-800"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4 text-gold" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="h-9 w-9 border-zinc-200 dark:border-zinc-800"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4 text-gold" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="h-9 w-9 border-zinc-200 dark:border-zinc-800"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4 text-gold" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === totalPages}
                  onClick={() => setPage(totalPages)}
                  className="h-9 w-9 border-zinc-200 dark:border-zinc-800"
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4 text-gold" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
