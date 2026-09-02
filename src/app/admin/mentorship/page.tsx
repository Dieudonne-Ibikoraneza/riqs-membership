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
  ArrowUpDown,
  X,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [apcReadiness, setApcReadiness] = useState("all");
  const [location, setLocation] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
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
  }, [debouncedQ, status, apcReadiness, location, category, sort]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await getMentorshipQueue(
          page,
          pageSize,
          debouncedQ || undefined,
          status,
          apcReadiness === "all" ? undefined : apcReadiness,
          location === "all" ? undefined : location,
          sort,
          category === "all" ? undefined : category
        );
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
  }, [page, debouncedQ, status, apcReadiness, location, sort, category]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Mentorship Queue</h1>
          <p className="text-sm text-muted-foreground font-sans mt-1">
            Review upgrade requests, collect reviewer-board recommendations, and process final APC decisions.
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
              <div className="flex flex-wrap gap-2.5">
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                  <SelectTrigger className="h-11 w-[165px] border-zinc-200 dark:border-zinc-800"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Pending_Reviewer_Board">Reviewer board</SelectItem>
                    <SelectItem value="Pending_Admin_Review">Admin review</SelectItem>
                    <SelectItem value="Correction_Required">Correction required</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                  <SelectTrigger className="h-11 w-[165px] border-zinc-200 dark:border-zinc-800"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="Graduate">Graduate</SelectItem>
                    <SelectItem value="Technologist">Technologist</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Associate">Associate</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={apcReadiness} onValueChange={(v) => { setApcReadiness(v); setPage(1); }}>
                  <SelectTrigger className="h-11 w-[165px] border-zinc-200 dark:border-zinc-800"><SelectValue placeholder="APC route" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All APC routes</SelectItem>
                    <SelectItem value="Ready">Ready for APC</SelectItem>
                    <SelectItem value="Not_Ready">Associate route</SelectItem>
                    <SelectItem value="Unknown">Route not set</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={location} onValueChange={(v) => { setLocation(v); setPage(1); }}>
                  <SelectTrigger className="h-11 w-[165px] border-zinc-200 dark:border-zinc-800"><SelectValue placeholder="Location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Rwandan">Rwandan (Local)</SelectItem>
                    <SelectItem value="Non_Rwandan">Non-Rwandan (Foreign)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(v) => { setSort(v as "recent" | "oldest"); setPage(1); }}>
                  <SelectTrigger className="h-11 w-[220px] border-zinc-200 dark:border-zinc-800"><ArrowUpDown className="mr-2 h-4 w-4 text-gold shrink-0" /><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Submitted date (newest)</SelectItem>
                    <SelectItem value="oldest">Submitted date (oldest)</SelectItem>
                  </SelectContent>
                </Select>
                {(category !== "all" || apcReadiness !== "all" || location !== "all" || status !== "all" || sort !== "recent" || q) && (
                  <Button variant="ghost" className="h-11 gap-1.5 text-muted-foreground" onClick={() => { setQ(""); setStatus("all"); setCategory("all"); setApcReadiness("all"); setLocation("all"); setSort("recent"); setPage(1); }}>
                    <X className="h-4 w-4" /> Reset
                  </Button>
                )}
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
                            <Link
                              href={`/admin/members/${a.member_id}`}
                              className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug hover:text-navy dark:hover:text-gold hover:underline inline-flex items-center gap-1 group/profile"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {a.full_name}
                              <ExternalLink className="h-3 w-3 text-zinc-400 opacity-0 group-hover/profile:opacity-100 transition-opacity" />
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {a.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <div className="flex flex-col items-start gap-1">
                          <div className="truncate text-zinc-700 dark:text-zinc-300 font-medium w-full">
                            {a.category_name}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(() => {
                              const honorsSet = new Set<string>(a.honors || []);
                              
                              return Array.from(honorsSet).map((honor: string) => (
                                <Badge 
                                  key={honor} 
                                  variant="outline" 
                                  className="text-[10px] px-2 py-0.5 shadow-sm bg-amber-100 text-amber-800 border-amber-300 shadow-amber-500/20 uppercase tracking-wider font-bold"
                                >
                                  <Star className="h-2.5 w-2.5 mr-1 fill-amber-600 text-amber-600" />
                                  {honor}
                                </Badge>
                              ));
                            })()}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-350 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                            {a.location}
                          </div>
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
                        ) : a.status === 'Pending_Reviewer_Board' ? (
                          <span className="inline-flex items-center rounded-full bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-400 ring-1 ring-inset ring-violet-600/20">
                            Reviewer Board
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
                            {a.status === 'Pending_Reviewer_Board' ? 'Board Review' : a.status === 'Pending_Admin_Review' ? 'Final Review' : 'View Details'}
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
