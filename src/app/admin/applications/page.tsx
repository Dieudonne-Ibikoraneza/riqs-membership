"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { getApplicationsQueue, sendAdminEmail } from "@/lib/api/admin";
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
  Send,
  Minimize2,
  Maximize2,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

const STATUSES = [
  "Pending",
  "Under Review",
  "Correction Required",
  "Approved",
  "Rejected",
  "Mentorship Upgrade",
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
  const pathname = usePathname();
  const isMentorshipRoute = pathname?.includes("mentorship");
  
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>(isMentorshipRoute ? "Mentorship Upgrade" : "all");
  const [loc, setLoc] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("submitted");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState<"queue" | "all">("queue");
  
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getApplicationsQueue(page, pageSize, status, view);
        const mapped = res.queue.map(a => ({
          id: a.id,
          memberId: a.member_id,
          applicantName: a.full_name,
          email: a.email,
          category: a.category_name,
          practiceLocation: a.location,
          submittedAt: new Date(a.submitted_at).toISOString().split('T')[0],
          status: a.status.replace("_", " "),
          reviewer: a.reviewer || "Unassigned",
          photoId: a.photoId,
          profilePhotoUrl: a.profilePhotoUrl
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
  }, [page, status, view, role]);

  const handleSendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    
    setIsSending(true);
    try {
      const selectedMemberIds = applications
        .filter(app => sel[app.id])
        .map(app => app.memberId);

      const formData = new FormData();
      formData.append("recipientType", "selected");
      formData.append("memberIds", JSON.stringify(selectedMemberIds));
      formData.append("subject", emailSubject);
      formData.append("body", emailBody);

      await sendAdminEmail(formData);

      toast.success(`Email successfully sent to ${selectedMemberIds.length} applicants!`);
      setComposeOpen(false);
      setEmailSubject("");
      setEmailBody("");
      setSel({});
    } catch (err) {
      toast.error("Failed to send bulk email.");
    } finally {
      setIsSending(false);
    }
  };

  const handleReviewClick = async (a: any) => {
    if (a.status === "Mentorship Upgrade") {
      router.push(`/admin/mentorship/${a.id}`);
      return;
    }
    router.push(`/admin/applications/${a.id}`);
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
    setSortDir("desc");
    setPage(1);
  };

  return (
    <>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">
            {isMentorshipRoute ? 'Mentorship Queue' :
             role === 'Admin' ? (view === 'queue' ? 'Incoming Applications' : 'All Applications') :
             role === 'Admin_Assistant' ? (view === 'queue' ? 'Front Desk Applications' : 'All Submitted Applications') :
             role?.toLowerCase() === 'head_reviewer' || role === 'Reviewer' ? (view === 'queue' ? 'Review Queue' : 'All Applications') :
             role === 'Approver' ? (view === 'queue' ? 'Approval Queue' : 'All Applications') :
             view === 'queue' ? 'Application Queue' : 'All Applications'}
          </h1>
          <p className="text-sm text-muted-foreground font-sans mt-1">
            {isMentorshipRoute ? 'Review, assign mentors, and track APC readiness for candidates.' :
             role === 'Admin' ? (view === 'queue' ? 'Review newly submitted applications and forward complete ones to the Review Team.' : 'Complete global view of all applications in the registry.') :
             role === 'Admin_Assistant' ? (view === 'queue' ? 'Check incoming applications, request corrections, and forward complete submissions to the Review Team.' : 'Read-only view of all submitted applications.') :
             role?.toLowerCase() === 'head_reviewer' || role === 'Reviewer' ? (view === 'queue' ? 'Applications forwarded by Admin for technical review and assessment.' : 'Complete view of all reviewed applications.') :
             role === 'Approver' ? (view === 'queue' ? 'Applications forwarded by the Review Team awaiting your final decision.' : 'Complete view of all decisions made.') :
             'Review and verify incoming practice applications.'}
          </p>
        </div>
        <Tabs value={view} onValueChange={(v) => { setView(v as any); setPage(1); }} className="w-full sm:w-auto">
          <TabsList className={cn("grid w-full bg-zinc-100 dark:bg-zinc-800", "grid-cols-2")}>
            <TabsTrigger value="queue">{role === 'Admin' || role === 'Admin_Assistant' ? 'Pending Review' : role === 'Approver' ? 'Pending Approval' : 'Under Review'}</TabsTrigger>
            <TabsTrigger value="all">All Records</TabsTrigger>
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
                    <SelectItem value="Rwandan">Rwandan (Local)</SelectItem>
                    <SelectItem value="Non_Rwandan">Non-Rwandan (Foreign)</SelectItem>
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
                        <Avatar name={a.applicantName} url={a.profilePhotoUrl || a.photoId} />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug flex items-center gap-2">
                            {a.applicantName}
                            {a.apcRequested && (
                              <Badge className="bg-gold/10 text-gold hover:bg-gold/20 border-gold/20 text-[10px] uppercase tracking-wider px-1.5 py-0">
                                APC Requested
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {a.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <div className="flex flex-col items-start gap-1">
                        <div 
                          className="truncate text-zinc-700 dark:text-zinc-300 font-medium w-full"
                          title={a.category}
                        >
                          {a.category}
                        </div>
                        <div className="flex flex-wrap gap-1">
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
                        className="inline-flex items-center text-xs font-semibold text-navy dark:text-gold hover:underline group"
                      >
                        Review
                        <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
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
      
      {/* Floating Bulk Email Button */}
      <AnimatePresence>
        {selectedIds.length > 0 && !composeOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => {
                setComposeOpen(true);
                setComposeMinimized(false);
              }}
              className="bg-navy hover:bg-navy/90 text-white rounded-none shadow-lg px-6 h-14 text-base font-semibold"
            >
              <Mail className="mr-2 h-5 w-5" />
              Email {selectedIds.length} Applicant{selectedIds.length !== 1 ? 's' : ''}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gmail-style Compose Box */}
      <AnimatePresence>
        {composeOpen && selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              height: composeMinimized ? 56 : 500
            }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 right-6 w-[500px] z-50 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-t-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div 
              className="bg-navy text-white px-4 py-3 flex items-center justify-between cursor-pointer shrink-0"
              onClick={() => setComposeMinimized(!composeMinimized)}
            >
              <span className="font-semibold text-sm flex items-center">
                New Message
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                  {selectedIds.length} Recipients
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setComposeMinimized(!composeMinimized); }}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  {composeMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setComposeOpen(false); }}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            {!composeMinimized && (
              <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
                <div className="border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
                  <input
                    type="text"
                    placeholder="Subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-normal"
                  />
                </div>
                <textarea
                  placeholder="Write your message here..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="flex-1 w-full bg-transparent border-none outline-none resize-none p-4 text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                />
              </div>
            )}

            {/* Footer */}
            {!composeMinimized && (
              <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="text-xs text-muted-foreground">
                  Email will be sent via system
                </div>
                <Button 
                  onClick={handleSendBulkEmail} 
                  disabled={isSending || !emailSubject.trim() || !emailBody.trim() || selectedIds.length === 0}
                  className="bg-navy hover:bg-navy/90 text-white rounded-none px-6"
                >
                  {isSending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

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

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold border-none px-2.5 py-1 text-xs flex items-center w-fit gap-1",
        status === "Approved"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          : status === "Mentorship Upgrade"
            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
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
      {status === "Mentorship Upgrade" && (
        <Clock className="h-3 w-3 shrink-0 text-purple-600 dark:text-purple-400" />
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
