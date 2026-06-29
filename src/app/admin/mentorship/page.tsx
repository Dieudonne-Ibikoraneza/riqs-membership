"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { getMentorshipQueue } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

const APC_READINESS_BADGE: Record<string, { label: string; className: string }> = {
  Ready:    { label: "Ready for APC",  className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  Unknown:  { label: "Unknown",        className: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  Not_Ready: { label: "Not Ready",   className: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" },
};

function Avatar({ name, url }: { name: string; url?: string }) {
  const [token, setToken] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("riqs.auth.token") || "");
    }
  }, []);

  const fullUrl = url && token 
    ? url.includes('/')
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/files/downloadByUrl?url=${encodeURIComponent(url)}&token=${token}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/files/download/${url}?token=${token}`
    : null;

  if (fullUrl) {
    return (
      <img
        src={fullUrl}
        alt={name}
        className="flex h-10 w-10 shrink-0 object-cover rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      />
    );
  }

  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy to-[#14467f] text-xs font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      {initials}
    </div>
  );
}

export default function MentorshipQueuePage() {
  const { role } = useAuth();
  const router = useRouter();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [queue, setQueue] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await getMentorshipQueue(page, pageSize, debouncedQ || undefined, status);
        setQueue(res.queue);
        setTotalCount(res.pagination.total);
        setTotalPages(Math.max(1, Math.ceil(res.pagination.total / pageSize)));
      } catch {
        toast.error("Failed to load mentorship queue.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [page, debouncedQ, status]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Mentorship Queue</h1>
          <p className="text-sm text-muted-foreground font-sans mt-1">
            Review upgrade requests, inspect submitted documents, and approve candidates to sit the APC.
          </p>
        </div>
        <Tabs value={status} onValueChange={setStatus} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-100 dark:bg-zinc-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="Approved">Approved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="border border-zinc-150 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email…"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                  }}
                  className="pl-10 h-11 border-zinc-200 dark:border-zinc-800 focus-visible:ring-gold"
                />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="text-muted-foreground font-sans">
                Found{" "}
                <span className="font-semibold text-navy dark:text-gold">
                  {queue.length}
                </span>{" "}
                candidate{queue.length !== 1 && "s"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Card className="border border-zinc-150 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm animate-pulse">
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-gold border-t-transparent" />
            <h3 className="mt-4 font-bold text-navy text-lg">
              Loading mentorship queue...
            </h3>
          </CardContent>
        </Card>
      ) : queue.length === 0 ? (
        <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10">
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
              <BookOpen className="h-5 w-5 text-gold" />
            </div>
            <h3 className="mt-4 font-bold text-navy text-lg">
              {status === "all" ? "No candidates found" : `No candidates ${status.toLowerCase()}`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground font-sans">
              {status === "all" ? "There are no mentorship candidates in the system." : `There are no candidates with a ${status.toLowerCase()} status.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-zinc-150 dark:border-zinc-800/80 overflow-hidden shadow-sm bg-white dark:bg-zinc-900 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Candidate</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Mentor</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Duration</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">APC Readiness</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Submitted</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((a, index) => {
                  const readiness = APC_READINESS_BADGE[a.apc_readiness] ?? APC_READINESS_BADGE["Unknown"];
                  return (
                    <tr
                      key={a.id}
                      className={cn(
                        "border-b border-zinc-100 dark:border-zinc-800/80 transition-colors hover:bg-gold/5",
                        index % 2 === 1 && "bg-zinc-50/20 dark:bg-zinc-950/10",
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={a.full_name} url={(a as any).profilePhotoUrl || a.photoId} />
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                              {a.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {a.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <div className="truncate text-zinc-700 dark:text-zinc-300 font-medium">
                          {a.category_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-350 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                          {a.location}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                          {a.mentor_name}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-350">
                          <Clock className="h-3.5 w-3.5 text-gold shrink-0" />
                          {a.duration_months} months
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={cn("font-semibold border-none px-2.5 py-1 text-xs flex items-center w-fit gap-1", readiness.className)}
                        >
                          {a.apc_readiness === "Ready" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                          {a.apc_readiness === "Unknown" && <Clock className="h-3 w-3 shrink-0" />}
                          {a.apc_readiness === "Not_Ready" && <XCircle className="h-3 w-3 shrink-0" />}
                          {readiness.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-650 dark:text-zinc-400">
                        {new Date(a.submitted_at).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-5 py-4">
                        {a.status === 'Approved' ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                            Approved
                          </span>
                        ) : a.status === 'Correction_Required' ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/10">
                            Flagged
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/admin/mentorship/${a.id}`}>
                          <button
                            className="inline-flex items-center text-xs font-semibold text-navy dark:text-gold hover:underline group"
                          >
                            {a.status === 'Pending_Admin_Review' ? 'Review' : 'View Details'}
                            <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {totalCount} total
          </p>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
