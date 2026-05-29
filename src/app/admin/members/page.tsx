"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { getMembersRegistry, type AdminMemberRegistryResponse } from "@/lib/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Search,
  Filter,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "name" | "id" | "expiry" | "status";

export default function AdminMembers() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [locFilter, setLocFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminMemberRegistryResponse | null>(null);

  useEffect(() => {
    let active = true;
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const response = await getMembersRegistry(
          page,
          pageSize,
          q,
          statusFilter,
          catFilter,
          locFilter,
          sortKey,
          sortDir
        );
        if (active) setData(response);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    // Simple debounce for search
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);
    
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [page, pageSize, q, statusFilter, catFilter, locFilter, sortKey, sortDir]);

  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const pageData = data?.members || [];

  const resetFilters = () => {
    setQ("");
    setStatusFilter("all");
    setCatFilter("all");
    setLocFilter("all");
    setSortKey("name");
    setSortDir("asc");
    setPage(1);
  };

  const activeFiltersCount =
    (q ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (catFilter !== "all" ? 1 : 0) +
    (locFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
      {/* Header section */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">
            Members Register
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            Manage approved Quantity Surveying practitioners, monitor
            credentials, and review statuses.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/members">
            <Button
              variant="outline"
              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-semibold"
            >
              View public directory
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and sorting bar */}
      <Card className="border border-zinc-150 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* Search bar */}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members by name, ID or email..."
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

              {/* Advanced Filter selections */}
              <div className="flex flex-wrap gap-2.5">
                {/* Status Selector */}
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-[150px] border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="In Mentorship">In Mentorship</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Selector */}
                <Select
                  value={catFilter}
                  onValueChange={(v) => {
                    setCatFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-[160px] border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {Object.entries({
                      Graduate: "Graduate",
                      Technologist: "Technologist",
                      Professional: "Professional",
                      Firm_Local_Small: "Rwandan Small Firm",
                      Firm_Local_Medium: "Rwandan Medium Firm",
                      Firm_Local_Large: "Rwandan Large Firm",
                      Firm_Foreign_Small: "Non-Rwandan Small Firm",
                      Firm_Foreign_Medium: "Non-Rwandan Medium Firm",
                      Firm_Foreign_Large: "Non-Rwandan Large Firm",
                    }).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Location Selector */}
                <Select
                  value={locFilter}
                  onValueChange={(v) => {
                    setLocFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-[150px] border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    <SelectItem value="Rwandan">Rwandan (Local)</SelectItem>
                    <SelectItem value="Non_Rwandan">Non-Rwandan (Foreign)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sorting options */}
                <Select
                  value={`${sortKey}-${sortDir}`}
                  onValueChange={(v) => {
                    const [key, dir] = v.split("-") as [
                      SortKey,
                      "asc" | "desc",
                    ];
                    setSortKey(key);
                    setSortDir(dir);
                  }}
                >
                  <SelectTrigger className="h-11 w-[180px] border-zinc-200 dark:border-zinc-800">
                    <ArrowUpDown className="mr-2 h-4 w-4 text-gold shrink-0" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z–A)</SelectItem>
                    <SelectItem value="id-asc">Member ID (Asc)</SelectItem>
                    <SelectItem value="id-desc">Member ID (Desc)</SelectItem>
                    <SelectItem value="expiry-asc">
                      Expiry Date (Oldest)
                    </SelectItem>
                    <SelectItem value="expiry-desc">
                      Expiry Date (Newest)
                    </SelectItem>
                    <SelectItem value="status-asc">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground font-sans">
                  Showing{" "}
                  <span className="font-semibold text-navy dark:text-gold">
                    {data?.pagination.total || 0}
                  </span>{" "}
                  member{(data?.pagination.total || 0) !== 1 && "s"} in directory
                </span>
                {activeFiltersCount > 0 && (
                  <>
                    <Badge
                      variant="outline"
                      className="border-gold/45 bg-gold/10 text-gold font-bold"
                    >
                      <Filter className="mr-1.5 h-3 w-3 text-gold" />{" "}
                      {activeFiltersCount} filter{activeFiltersCount > 1 && "s"}{" "}
                      active
                    </Badge>
                    <button
                      onClick={resetFilters}
                      className="text-xs text-navy dark:text-gold font-semibold underline-offset-4 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members table card */}
      {loading ? (
        <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10">
          <CardContent className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="mt-4 text-sm text-muted-foreground font-sans">
              Loading members...
            </p>
          </CardContent>
        </Card>
      ) : pageData.length === 0 ? (
        <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10">
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
              <Search className="h-5 w-5 text-gold" />
            </div>
            <h3 className="mt-4 font-bold text-navy text-lg">
              No admin members match your query
            </h3>
            <p className="mt-1 text-sm text-muted-foreground font-sans">
              Try expanding your search criteria or adjusting the status,
              category, and location filters.
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
                  {[
                    "Member",
                    "Membership ID",
                    "Category",
                    "Location",
                    "Expires",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((m, i) => (
                  <tr
                    key={m.id}
                    className={cn(
                      "border-b border-zinc-100 dark:border-zinc-800/80 transition-colors hover:bg-gold/5",
                      i % 2 === 1 && "bg-zinc-50/20 dark:bg-zinc-950/10",
                    )}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.fullName} url={m.photo} />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {m.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-navy dark:text-gold">
                      {m.membershipId}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className="border-navy/20 bg-navy/5 text-navy dark:border-zinc-700 dark:text-zinc-300 font-semibold"
                      >
                        {m.category}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-350">
                        <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                        {m.practiceLocation}
                        {m.country &&
                          m.practiceLocation === "Non_Rwandan" &&
                          ` · ${m.country}`}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                      {m.expiresAt}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-semibold border-none px-2.5 py-1 text-xs flex items-center w-fit gap-1",
                          m.status === "Active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : m.status === "In Mentorship"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
                        )}
                      >
                        {m.status === "Active" && (
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {m.status === "In Mentorship" && (
                          <Clock className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                        )}
                        {m.status === "Expired" && (
                          <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600 dark:text-rose-400" />
                        )}
                        {m.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Advanced Pagination controls */}
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
