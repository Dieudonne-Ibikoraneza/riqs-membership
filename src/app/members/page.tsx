"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicServices } from "@/services/public.services";
import { queryKeys } from "@/services/queryKeys";
import { PublicHeader, PublicFooter } from "@/components/PublicHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, Download, Mail, Phone, MapPin, BadgeCheck, LayoutGrid, List,
  ArrowUpDown, Filter, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, Star, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "name" | "id" | "category";
type View = "cards" | "table";

// One tab per compliant-member list — mirrors the segmented "Compliant Professional
// Engineers / Technologists / Technicians / Firms" pattern other institutes use, in place of
// the old category dropdown. `title` drives the page heading so it always names exactly the
// list currently shown. Graduate intentionally has no separate "Technologist route" tab: both
// GrQS and GrQST applicants land on the single `Graduate` MemberClass value once approved (the
// route only ever affected which category/certificate they were assessed under), so there's
// nothing to split here.
// `noun` drives the "N compliant ___" line under the title — firms shouldn't be called
// "members".
const CATEGORY_TABS: { id: string; label: string; title: string; noun: string; exportName: string }[] = [
  { id: "Professional", label: "Compliant Professional QS", title: "Compliant Professional Quantity Surveyors", noun: "members", exportName: "Professional Members" },
  { id: "Technologist", label: "Compliant QS Technologist", title: "Compliant Quantity Surveying Technologists", noun: "members", exportName: "QS Technologist Members" },
  { id: "Graduate", label: "Compliant Graduates", title: "Compliant Graduate Members", noun: "members", exportName: "Graduate Members" },
  { id: "Associate", label: "Compliant Associates QS", title: "Compliant Associate Quantity Surveyors", noun: "members", exportName: "Associate Members" },
  { id: "Firm", label: "Compliant Firms", title: "Compliant Firms", noun: "firms", exportName: "Firms" },
];

export default function MembersPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [activeTab, setActiveTab] = useState<string>(CATEGORY_TABS[0].id);
  const [view, setView] = useState<View>("cards");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Debounce search input
  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [q]);

  const activeCat = activeTab;
  const activeTabConfig = CATEGORY_TABS.find(t => t.id === activeTab) || CATEGORY_TABS[0];
  const currentYear = new Date().getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.public.members({ search: debouncedQ, category: activeCat, page, limit: pageSize }),
    queryFn: () => publicServices.getPublicMembers({ search: debouncedQ, category: activeCat, page, limit: pageSize }),
  });

  const members = data?.members || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const safePage = Math.min(page, totalPages);
  const totalCount = pagination?.totalCount || 0;

  const [exporting, setExporting] = useState<null | "active" | "all">(null);

  // This list changes over time (new approvals, lapsed renewals, etc.) — a plain "riqs-members.csv"
  // gives no way to tell how stale a downloaded copy is, so both the file itself and its name
  // carry a generated-on stamp.
  const rowsToCsv = (rows: any[], reportTitle: string) => {
    const csvRows: string[][] = [
      [`${reportTitle}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ["Membership ID", "Full Name", "Category", "Phone", "Email"]
    ];
    rows.forEach(m => {
      const honorsSet = new Set<string>(m.honors || []);
      const honorsArray = Array.from(honorsSet);

      const baseCategory = m.category_name || formatMembershipClass(m.membership_class);
      const fullCategory = honorsArray.length > 0
        ? `${baseCategory}, ${honorsArray.join(", ")}`
        : baseCategory;

      csvRows.push([m.membership_id || m.id, m.full_name, fullCategory, m.phone_number ? m.phone_number.replace(/^\+/, '') : "", m.email]);
    });
    return csvRows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  };

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // Previously this only ever exported whatever page of results happened to be on screen (10
  // rows at a time) — fetches the FULL list instead: "active" respects the current tab/search
  // (whatever's actually being viewed), "all" ignores both entirely for a full-roster dump.
  const exportCsv = async (scope: "active" | "all") => {
    setExporting(scope);
    try {
      const res = await publicServices.getPublicMembers({
        search: scope === "active" ? debouncedQ : undefined,
        category: scope === "active" ? activeCat : "all",
        page: 1,
        limit: 100000,
      });
      const reportTitle = scope === "active" ? `RIQS Compliant ${activeTabConfig.exportName}` : "RIQS All Compliant Members";
      const dateStamp = new Date().toISOString().split("T")[0];
      downloadCsv(rowsToCsv(res?.members || [], reportTitle), `${reportTitle} - ${dateStamp}.csv`);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(null);
    }
  };

  // Category is now a mandatory tab selection rather than an optional filter, so only the
  // search box counts as a dismissable "filter" here.
  const reset = () => { setQ(""); setPage(1); };
  const activeFilters = debouncedQ ? 1 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        {/* Header + description */}
        <section className="border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 flex flex-col lg:flex-row lg:items-start gap-8 animate-fade-in">
            <div className="lg:w-1/2">
              <Badge variant="outline" className="border-navy/20 bg-navy/5 text-navy dark:border-gold/30 dark:bg-gold/10 dark:text-gold">
                <BadgeCheck className="mr-1 h-3 w-3 text-gold fill-gold" /> Verified register
              </Badge>
              <h1 className="mt-4 text-3xl md:text-4xl font-bold text-navy dark:text-white leading-tight">
                {activeTabConfig.title} {currentYear}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground font-sans">
                <Users className="h-4 w-4 text-gold" />
                <span><span className="font-bold text-navy dark:text-gold">{totalCount}</span> compliant {totalCount === 1 ? activeTabConfig.noun.replace(/s$/, "") : activeTabConfig.noun}</span>
              </div>
            </div>
            <div className="lg:w-1/2 lg:pl-8 lg:border-l lg:border-zinc-200 dark:lg:border-zinc-800">
              <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                Compliant members are members of the institute who have paid their applicable membership fees for the current year and are authorized to practice the profession. Contact us at{" "}
                <a href="mailto:info@riqs.rw" className="font-semibold text-navy dark:text-gold hover:underline">info@riqs.rw</a> or{" "}
                <span className="font-semibold text-navy dark:text-gold">+250 788 000 000</span> in case you cannot find your name on the list while you have paid.
              </p>
            </div>
          </div>

          {/* Category tabs */}
          <div className="mx-auto max-w-7xl px-4 pb-6">
            <div className="flex flex-wrap gap-2.5">
              {CATEGORY_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setPage(1); }}
                  className={cn(
                    // Deliberately no transition on background/color/border here: .brand-gradient
                    // sets the `background` shorthand (a gradient) while the inactive state is a
                    // plain `background-color` utility, and animating between those two kinds of
                    // background produces a washed-out gray flash mid-swap instead of a clean
                    // fade — so that swap stays instant. transition-transform is unrelated to
                    // background and animates safely, giving the tabs a tactile press/hover feel.
                    "cursor-pointer rounded-md border px-3.5 py-2 text-xs font-semibold transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-95",
                    activeTab === tab.id
                      ? "brand-gradient border-transparent text-white shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-muted-foreground hover:text-navy dark:hover:text-gold hover:border-navy/30 dark:hover:border-gold/30"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-8 pb-16">
          {/* Filter bar */}
          <Card className="shadow-navy border-0 animate-slide-up bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, membership ID or email…"
                    value={q}
                    onChange={e => { setQ(e.target.value); setPage(1); }}
                    className="pl-9 h-11 border-zinc-200 dark:border-zinc-800"
                  />
                  {q && (
                    <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    onClick={() => exportCsv("active")}
                    disabled={exporting !== null}
                    variant="outline"
                    className="h-11 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    title={`Export ${activeTabConfig.label}`}
                  >
                    {exporting === "active" ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-gold" /> : <Download className="mr-2 h-4 w-4 text-gold" />}
                    Export List
                  </Button>
                  <Button
                    onClick={() => exportCsv("all")}
                    disabled={exporting !== null}
                    variant="outline"
                    className="h-11 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    title="Export every member across all categories"
                  >
                    {exporting === "all" ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-gold" /> : <Download className="mr-2 h-4 w-4 text-gold" />}
                    Export All Members
                  </Button>
                </div>
              </div>

              {/* meta row */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-sans">
                    <span className="font-semibold text-navy dark:text-gold">{totalCount}</span> member{totalCount !== 1 && "s"} found
                  </span>
                  {activeFilters > 0 && (
                    <>
                      <Badge variant="outline" className="px-3 py-1.5 text-sm border-gold/45 bg-gold/10 text-gold font-bold">
                        <Filter className="mr-2 h-4 w-4 text-gold" /> {activeFilters} filter{activeFilters > 1 && "s"} active
                      </Badge>
                      <button onClick={reset} className="text-sm text-navy dark:text-gold underline-offset-4 hover:underline ml-1">Clear all</button>
                    </>
                  )}
                </div>
                {/* View toggle */}
                <div className="inline-flex border border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-0.5">
                  <button
                    onClick={() => setView("table")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all", view === "table" ? "bg-navy text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    <List className="h-3.5 w-3.5" /> Table
                  </button>
                  <button
                    onClick={() => setView("cards")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all", view === "cards" ? "bg-navy text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" /> Cards
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {isLoading ? (
            view === "cards" ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse bg-zinc-100 dark:bg-zinc-800/50 border-none h-[220px]" />
                ))}
              </div>
            ) : (
              <Card className="mt-6 overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-navy text-white">
                      <tr>
                        {["Member", "Membership ID", "Category", "Contact", "Status"].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800/80">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-full shrink-0"></div>
                              <div className="space-y-2">
                                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div>
                                <div className="h-3 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4"><div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div></td>
                          <td className="px-5 py-4"><div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-full"></div></td>
                          <td className="px-5 py-4"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div></td>
                          <td className="px-5 py-4"><div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-full"></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          ) : members.length === 0 ? (
            <Card className="mt-6 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/20 dark:bg-zinc-950/10">
              <CardContent className="py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
                  <Search className="h-5 w-5 text-gold" />
                </div>
                <h3 className="mt-4 font-bold text-navy text-lg">No members match your filters</h3>
                <p className="mt-1 text-sm text-muted-foreground font-sans">Try adjusting your search or clearing filters.</p>
                <Button onClick={reset} variant="outline" className="mt-4 border-zinc-200 dark:border-zinc-800">Reset filters</Button>
              </CardContent>
            </Card>
          ) : view === "cards" ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger">
              {members.map((m: any) => (
                <MemberCard key={m.id} m={m} />
              ))}
            </div>
          ) : (
            <Card className="mt-6 overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-navy text-white">
                    <tr>
                      {["Member", "Membership ID", "Category", "Contact", "Status"].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m: any, i: number) => (
                      <tr key={m.id} className={cn("border-b border-zinc-100 dark:border-zinc-800/80 transition-colors hover:bg-gold/5", i % 2 === 1 && "bg-zinc-50/20 dark:bg-zinc-950/10")}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={m.full_name} url={m.profile_photo_url} />
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{m.full_name}</div>
                              <div className="text-xs text-muted-foreground">{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-navy dark:text-gold">{m.membership_id || m.id}</td>
                        <td className="px-5 py-4 max-w-[200px]">
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant="outline" className="border-navy/20 bg-navy/5 text-navy dark:border-zinc-700 dark:text-zinc-300 font-semibold">{m.category_name || formatMembershipClass(m.membership_class)}</Badge>
                            {(() => {
                              const honorsSet = new Set<string>(m.honors || []);

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
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-400">{m.phone_number}</td>
                        <td className="px-5 py-4">
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-semibold">
                            <BadgeCheck className="mr-1 h-3.5 w-3.5 text-emerald-600 inline shrink-0" /> Approved
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {totalPages > 1 && <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />}

          {/* Join CTA */}
          <Card className="mt-12 brand-gradient text-white border-0 shadow-navy overflow-hidden relative animate-slide-up">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
            <CardContent className="relative p-8 flex flex-wrap items-center justify-between gap-4 z-10">
              <div>
                <h3 className="text-2xl font-bold">Not a member yet?</h3>
                <p className="mt-1 text-sm text-white/80 font-sans">Join the official register of Quantity Surveyors in Rwanda.</p>
              </div>
              <Link href="/register">
                <Button size="lg" className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold h-12 px-6 border-none font-bold">Apply now</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function Avatar({ name, url, className }: { name: string; url?: string; className?: string }) {
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

  const baseClasses = className || "h-10 w-10 text-xs shadow-sm ring-1 ring-black/5 dark:ring-white/10";

  if (fullUrl) {
    return (
      <img
        src={fullUrl}
        alt={name}
        className={cn("flex shrink-0 object-cover rounded-full", baseClasses)}
      />
    );
  }

  const safeName = name || "?";
  const initials = safeName.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy to-[#14467f] font-bold text-white", baseClasses)}>
      {initials}
    </div>
  );
}

function formatMembershipClass(cls: string) {
  if (!cls) return "";
  const map: Record<string, string> = {
    "Fellow": "Professional",
    "Firm_Local_Small": "Rwandan Small Firm",
    "Firm_Local_Medium": "Rwandan Medium Firm",
    "Firm_Local_Large": "Rwandan Large Firm",
    "Firm_Foreign_Small": "Non-Rwandan Small Firm",
    "Firm_Foreign_Medium": "Non-Rwandan Medium Firm",
    "Firm_Foreign_Large": "Non-Rwandan Large Firm",
  };
  return map[cls] || cls.replace(/_/g, " ");
}

function MemberCard({ m }: { m: any }) {
  return (
    <Card className="group hover-lift overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
      <div className="relative h-20 brand-gradient">
        <div className="absolute -bottom-7 left-5">
          <Avatar 
            name={m.full_name} 
            url={m.profile_photo_url} 
            className="h-14 w-14 text-sm ring-4 ring-white dark:ring-zinc-900" 
          />
        </div>
        <Badge className="absolute right-4 top-4 bg-emerald-500/20 text-emerald-100 border-emerald-400/40 backdrop-blur font-semibold">
          <BadgeCheck className="mr-1 h-3 w-3 text-gold fill-gold" /> Approved
        </Badge>
      </div>
      <CardContent className="pt-10 pb-5 px-5">
        <div className="text-[10px] tracking-wider gold-text font-bold">{m.membership_id || m.id}</div>
        <div className="mt-1 text-base font-bold text-navy dark:text-white leading-tight">{m.full_name}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Badge variant="outline" className="border-navy/15 bg-navy/5 text-navy dark:border-zinc-800 dark:text-zinc-350 text-[10px] font-semibold">{m.category_name || formatMembershipClass(m.membership_class)}</Badge>
          {(() => {
            const honorsSet = new Set<string>(m.honors || []);

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
        <div className="mt-4 space-y-2 text-xs text-muted-foreground font-sans">
          <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gold shrink-0" /> {m.phone_number}</div>
          <div className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 text-gold shrink-0" /> <span className="truncate">{m.email}</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (n: number) => void }) {
  const range = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const arr: (number | string)[] = [];
    if (page <= 4) {
      arr.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      arr.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      arr.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return arr;
  }, [page, totalPages]);

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
      <div className="text-sm text-muted-foreground font-sans">
        Showing page <span className="font-semibold text-navy dark:text-gold">{page}</span> of <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalPages}</span>
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
                className="px-2 text-zinc-450 dark:text-zinc-550 text-sm select-none font-bold"
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
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
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
