"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { getApplicationsQueue, takeOverApplication } from "@/lib/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  Mail,
  ArrowRight,
  ArrowUpDown,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  XCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const STATUSES = [
  "Pending",
  "Under Review",
  "Correction Required",
  "Approved",
  "Rejected",
];

type SortKey =
  | "applicant"
  | "id"
  | "submitted"
  | "status"
  | "category"
  | "reviewer";

export default function AdminApps() {
  const { role } = useAuth();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [loc, setLoc] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("submitted");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [takingOverId, setTakingOverId] = useState<string | null>(null);
  const [view, setView] = useState<"queue" | "assigned" | "all">("queue");
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getApplicationsQueue(page, pageSize, status, view);
        const mapped = res.queue.map(a => ({
          id: a.id,
          applicantName: a.full_name,
          email: a.email,
          category: a.category_name,
          practiceLocation: a.location,
          submittedAt: new Date(a.submitted_at).toISOString().split('T')[0],
          status: a.status.replace("_", " "),
          reviewer: a.reviewer || "Unassigned",
          photoId: a.photoId
        }));
        setApplications(mapped);
        setTotalPages(Math.max(1, Math.ceil(res.pagination.total / pageSize)));
      } catch (err) {
        toast.error("Failed to load applications");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [page, status, view]);

  const handleReviewClick = async (a: any) => {
    if (a.status !== "Pending") {
      router.push(`/admin/applications/${a.id}`);
      return;
    }
    try {
      setTakingOverId(a.id);
      await takeOverApplication(a.id);
      router.push(`/admin/applications/${a.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to take over application.");
      setTakingOverId(null);
    }
  };

  const filtered = useMemo(
    () =>
      applications.filter((a) => {
        if (
          q &&
          !`${a.applicantName} ${a.id} ${a.email}`
            .toLowerCase()
            .includes(q.toLowerCase())
        )
          return false;
        // Backend filters by status, but we can do it locally if needed, though we already pass status to backend.
        if (status !== "all" && a.status !== status.replace("_", " ")) return false;
        if (loc !== "all" && a.practiceLocation !== loc) return false;
        if (cat !== "all" && !a.category.includes(cat)) return false;
        return true;
      }),
    [applications, q, status, loc, cat],
  );

  const sortedApplications = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let comparison = 0;
      if (sortKey === "applicant") {
        comparison = a.applicantName.localeCompare(b.applicantName);
      } else if (sortKey === "id") {
        comparison = a.id.localeCompare(b.id);
      } else if (sortKey === "submitted") {
        comparison = a.submittedAt.localeCompare(b.submittedAt);
      } else if (sortKey === "status") {
        comparison = a.status.localeCompare(b.status);
      } else if (sortKey === "category") {
        comparison = a.category.localeCompare(b.category);
      } else if (sortKey === "reviewer") {
        comparison = (a.reviewer ?? "").localeCompare(b.reviewer ?? "");
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const safePage = page;
  const pageData = sortedApplications;

  const selectedIds = Object.keys(sel).filter((k) => sel[k]);

  const exportCsv = () => {
    const rows = [
      ["Application ID", "Name", "Category", "Location", "Status", "Submitted"],
    ];
    sortedApplications.forEach((a) =>
      rows.push([
        a.id,
        a.applicantName,
        a.category,
        a.practiceLocation,
        a.status,
        a.submittedAt,
      ]),
    );
    const blob = new Blob(
      [rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "applications.csv";
    link.click();
    toast.success(`Exported ${sortedApplications.length} records to CSV`);
  };

  const resetFilters = () => {
    setQ("");
    setStatus("all");
    setLoc("all");
    setCat("all");
    setSortKey("submitted");
    setSortDir("asc");
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">
            {view === 'queue' ? 'Application Queue' : view === 'assigned' ? 'My Assigned Applications' : 'All Applications'}
          </h1>
          <p className="text-sm text-muted-foreground font-sans mt-1">
            {view === 'queue' ? 'Review, verify, and take over incoming practice applications.' : 
             view === 'assigned' ? 'Applications currently assigned to you for review or correction.' : 
             'Complete global view of all applications in the registry.'}
          </p>
        </div>
        <Tabs value={view} onValueChange={(v) => { setView(v as any); setPage(1); }} className="w-full sm:w-auto">
          <TabsList className={cn("grid w-full bg-zinc-100 dark:bg-zinc-800", role?.toLowerCase() === "approver" ? "grid-cols-2" : "grid-cols-3")}>
            <TabsTrigger value="queue">Queue</TabsTrigger>
            {role?.toLowerCase() !== "approver" && (
              <TabsTrigger value="assigned">My Assigned</TabsTrigger>
            )}
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="border border-zinc-150 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search applications by name, ID or email..."
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 h-11 border-zinc-200 dark:border-zinc-800 focus-visible:ring-gold"
                />
                {q && (
                  <button
                    onClick={() => {
                      setQ("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-[150px] border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={cat}
                  onValueChange={(v) => {
                    setCat(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-[160px] border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {[
                      "Graduate",
                      "Technologist",
                      "Professional",
                      "Firm_Local_Small",
                      "Firm_Local_Medium",
                      "Firm_Local_Large",
                      "Firm_Foreign_Small",
                      "Firm_Foreign_Medium",
                      "Firm_Foreign_Large",
                    ].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={loc}
                  onValueChange={(v) => {
                    setLoc(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-[150px] border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Local">Local (Rwanda)</SelectItem>
                    <SelectItem value="Foreign">Foreign</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={`${sortKey}-${sortDir}`}
                  onValueChange={(v) => {
                    const [key, dir] = v.split("-") as [
                      SortKey,
                      "asc" | "desc",
                    ];
                    setSortKey(key);
                    setSortDir(dir);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-[220px] border-zinc-200 dark:border-zinc-800">
                    <ArrowUpDown className="mr-2 h-4 w-4 text-gold shrink-0" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted-asc">
                      Submitted date (oldest)
                    </SelectItem>
                    <SelectItem value="submitted-desc">
                      Submitted date (newest)
                    </SelectItem>
                    <SelectItem value="applicant-asc">
                      Applicant (A–Z)
                    </SelectItem>
                    <SelectItem value="applicant-desc">
                      Applicant (Z–A)
                    </SelectItem>
                    <SelectItem value="id-asc">Application ID (Asc)</SelectItem>
                    <SelectItem value="id-desc">
                      Application ID (Desc)
                    </SelectItem>
                    <SelectItem value="status-asc">Status</SelectItem>
                    <SelectItem value="category-asc">Category</SelectItem>
                    {role === "Admin" && (
                      <SelectItem value="reviewer-asc">Reviewer</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="text-muted-foreground font-sans">
                Found{" "}
                <span className="font-semibold text-navy dark:text-gold">
                  {filtered.length}
                </span>{" "}
                application{filtered.length !== 1 && "s"}
                {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                  className="h-9 border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50"
                >
                  <Download className="mr-2 h-4 w-4 text-gold" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedIds.length === 0}
                  onClick={() =>
                    toast.success(
                      `Bulk email queued to ${selectedIds.length} applicants`,
                    )
                  }
                  className="h-9 border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50"
                >
                  <Mail className="mr-2 h-4 w-4 text-gold" />
                  Bulk email
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="border border-zinc-150 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm animate-pulse">
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-gold border-t-transparent" />
            <h3 className="mt-4 font-bold text-navy text-lg">
              Loading applications...
            </h3>
          </CardContent>
        </Card>
      ) : pageData.length === 0 ? (
        <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10">
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
              <Search className="h-5 w-5 text-gold" />
            </div>
            <h3 className="mt-4 font-bold text-navy text-lg">
              No pending applications match filters
            </h3>
            <p className="mt-1 text-sm text-muted-foreground font-sans">
              Try expanding your search query or modifying active selections.
            </p>
            <Button
              onClick={resetFilters}
              variant="outline"
              className="mt-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
            >
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-zinc-150 dark:border-zinc-800/80 overflow-hidden shadow-sm bg-white dark:bg-zinc-900 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-10">
                    <div className="flex items-center">
                      <Checkbox
                        checked={
                          selectedIds.length === pageData.length &&
                          pageData.length > 0
                        }
                        onCheckedChange={(v) => {
                          const next: Record<string, boolean> = {};
                          if (v) pageData.forEach((f) => (next[f.id] = true));
                          setSel(next);
                        }}
                        className="border-white/50 data-[state=checked]:bg-gold data-[state=checked]:text-[#1a1a1a]"
                      />
                    </div>
                  </th>
                  {[
                    "Applicant",
                    "Category",
                    "Location",
                    "Submitted",
                    ...(role === "Admin" ? ["Reviewer"] : []),
                    "Status",
                    "",
                  ].map((h, idx) => (
                    <th
                      key={idx}
                      className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((a, index) => (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-b border-zinc-100 dark:border-zinc-800/80 transition-colors hover:bg-gold/5",
                      index % 2 === 1 && "bg-zinc-50/20 dark:bg-zinc-950/10",
                    )}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center">
                        <Checkbox
                          checked={!!sel[a.id]}
                          onCheckedChange={(v) =>
                            setSel({ ...sel, [a.id]: !!v })
                          }
                          className="focus-visible:ring-gold"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={a.applicantName} url={a.photoId} />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {a.applicantName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {a.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <div 
                        className="truncate text-zinc-700 dark:text-zinc-300 font-medium"
                        title={a.category}
                      >
                        {a.category}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-350">
                        <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                        {a.practiceLocation}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-650 dark:text-zinc-400">
                      {a.submittedAt}
                    </td>
                    {role === "Admin" && (
                      <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
                        {a.reviewer}
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleReviewClick(a)}
                        disabled={takingOverId === a.id}
                        className="inline-flex items-center text-xs font-semibold text-navy dark:text-gold hover:underline group disabled:opacity-50"
                      >
                        {takingOverId === a.id ? "Loading..." : "Review"}
                        {takingOverId !== a.id && (
                          <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}

function Avatar({ name, url }: { name: string; url?: string }) {
  const [token, setToken] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("riqs.auth.token") || "");
    }
  }, []);

  const fullUrl = url && token ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/files/download/${url}?token=${token}` : null;

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

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold border-none px-2.5 py-1 text-xs flex items-center w-fit gap-1",
        status === "Approved"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          : status === "Pending"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
            : status === "Under Review"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
              : status === "Correction Required"
                ? "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
      )}
    >
      {status === "Approved" && (
        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
      )}
      {status === "Pending" && (
        <Clock className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
      )}
      {status === "Under Review" && (
        <Eye className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
      )}
      {status === "Correction Required" && (
        <AlertTriangle className="h-3 w-3 shrink-0 text-orange-600 dark:text-orange-400" />
      )}
      {status === "Rejected" && (
        <XCircle className="h-3 w-3 shrink-0 text-rose-600 dark:text-rose-400" />
      )}
      {status}
    </Badge>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (n: number) => void;
}) {
  const range = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const arr: (number | string)[] = [];
    if (page <= 4) {
      arr.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      arr.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      );
    } else {
      arr.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
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
