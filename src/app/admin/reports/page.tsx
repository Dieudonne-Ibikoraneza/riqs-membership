"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText, Download, Loader2, BarChart3, Users, CreditCard,
  GraduationCap, Star, CheckCircle2, Clock, AlertCircle,
  ChevronRight, FileSpreadsheet, Printer
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMembersRegistry, getPendingPayments, getAllApc } from "@/lib/api/admin";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { generateMembershipAssessmentPDF, generateApcAssessmentPDF, generateFormattedExcel } from "@/services/reportGenerator";

// ─── Report Definitions ──────────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    id: "membership_assessment",
    title: "Membership Assessment Report",
    description: "Full breakdown of assessed members by category, location, and status — mirrors the Governing Council report format.",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    tag: "Governing Council",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "member_registry",
    title: "Member Registry Report",
    description: "Complete registry of all active members with membership IDs, categories, and contact details.",
    icon: FileText,
    color: "text-navy",
    bg: "bg-navy/5",
    border: "border-navy/20",
    tag: "Registry",
    tagColor: "bg-navy/10 text-navy",
  },
  {
    id: "financial_summary",
    title: "Financial Summary Report",
    description: "Payment transactions summary showing processing fees, renewals, and pending verifications.",
    icon: CreditCard,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    tag: "Finance",
    tagColor: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "apc_assessments",
    title: "APC Assessments Report",
    description: "Assessment of Professional Competence results, scores, and pass/fail breakdown by period.",
    icon: GraduationCap,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    tag: "Assessments",
    tagColor: "bg-purple-100 text-purple-700",
  },
  {
    id: "honorary_mentions",
    title: "Honorary Mentions Report",
    description: "List of all members with honorary titles — Fellows, Honorary Members, Life Members, and other distinctions.",
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    tag: "Honours",
    tagColor: "bg-amber-100 text-amber-700",
  },
] as const;

type ReportId = typeof REPORT_TYPES[number]["id"];

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatMemberClass(cls: string) {
  const map: Record<string, string> = {
    Fellow: "Fellow", Professional: "Professional", Technologist: "Technologist",
    Graduate: "Graduate", Associate: "Associate", Student: "Student",
    Visiting_Member: "Visiting Member",
    Firm_Local_Small: "Rwandan Small Firm", Firm_Local_Medium: "Rwandan Medium Firm",
    Firm_Local_Large: "Rwandan Large Firm", Firm_Foreign_Small: "Foreign Small Firm",
    Firm_Foreign_Medium: "Foreign Medium Firm", Firm_Foreign_Large: "Foreign Large Firm",
  };
  return map[cls] || cls || "N/A";
}

function csvDownload(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const now = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

// ─── Page ───────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [selected, setSelected] = useState<ReportId | null>(null);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState("all");
  const [location, setLocation] = useState("all");
  const [memCategory, setMemCategory] = useState("all");

  // Data queries
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["reports_members_all"],
    queryFn: () => getMembersRegistry(1, 100000),
    staleTime: 60_000,
  });
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["reports_payments_all"],
    queryFn: () => getPendingPayments(1, 100000, "all"),
    staleTime: 60_000,
  });
  const { data: apcData, isLoading: apcLoading } = useQuery({
    queryKey: ["reports_apc_all"],
    queryFn: () => getAllApc(undefined, 1, 100000),
    staleTime: 60_000,
  });

  const members: any[] = membersData?.members || [];
  const transactions: any[] = (paymentsData as any)?.transactions || [];
  const apcs: any[] = (apcData as any)?.assessments || [];

  // ─── Summary Stats ───────────────────────────────────────────────────────
  const totalMembers = members.length;
  const fellowCount = members.filter(m => m.membershipClass === "Fellow" || m.isFellow).length;
  const honoraryCount = members.filter(m => m.isHonorary || (m.honors || []).length > 0).length;
  const rwandanCount = members.filter(m => m.practiceLocation !== "Non_Rwandan").length;
  const clearedTx = transactions.filter((t: any) => t.status === "Paid");
  const totalRevenue = clearedTx.reduce((s: number, t: any) => s + Number(t.amount), 0);
  const apcPassed = apcs.filter((a: any) => a.status === "Passed").length;

  // ─── Generate Report ─────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 600));
    try {
      const date = now();

      if (selected === "membership_assessment") {
        await generateMembershipAssessmentPDF(members, period);
      } else if (selected === "member_registry") {
        const filtered = members.filter(m => {
          if (location !== "all" && m.practiceLocation !== location) return false;
          if (memCategory !== "all" && m.category !== memCategory) return false;
          return true;
        });
        const rows: string[][] = [];
        filtered.forEach((m, i) => {
          const honorsArray = [
            ...(m.honors || []),
            m.isFellow || m.membershipClass === "Fellow" ? "Fellow" : null,
            m.isHonorary ? "Honorary Member" : null,
          ].filter(Boolean);
          const honors = [...new Set(honorsArray)].join(", ");
          rows.push([String(i + 1), m.membershipId || "", m.fullName || "", m.category || formatMemberClass(m.membershipClass),
            m.practiceLocation || "Rwandan", m.email || "", m.status || "Active", honors]);
        });
        await generateFormattedExcel(
          `RIQS_Member_Registry_${date.replace(/ /g, "_")}.xlsx`,
          "RIQS — Member Registry Report",
          ["No.", "Membership ID", "Full Name", "Category", "Location", "Email", "Status", "Honors"],
          rows
        );
      } else if (selected === "financial_summary") {
        const rows: string[][] = [];
        transactions.forEach(t => {
          rows.push([t.transactionReference || "", new Date(t.createdAt).toLocaleDateString(),
            t.txType?.replace(/_/g, " ") || "", t.paymentMethod?.replace(/_/g, " ") || "",
            String(t.amount), t.currency || "RWF", t.status?.replace(/_/g, " ") || "", t.full_name || ""]);
        });
        rows.push([], ["Total Revenue (Paid):", `RWF ${totalRevenue.toLocaleString()}`],
          ["Paid Transactions:", String(clearedTx.length)],
          ["Pending Transactions:", String(transactions.filter((t: any) => t.status === "Pending_Verification").length)]);
        await generateFormattedExcel(
          `RIQS_Financial_Summary_${date.replace(/ /g, "_")}.xlsx`,
          "RIQS — Financial Summary Report",
          ["Ref", "Date", "Type", "Method", "Amount", "Currency", "Status", "Member"],
          rows
        );
      } else if (selected === "apc_assessments") {
        await generateApcAssessmentPDF(apcs);
      } else if (selected === "honorary_mentions") {
        const honMembers = members.filter(m =>
          m.isFellow || m.isHonorary || (m.honors || []).length > 0 || m.membershipClass === "Fellow"
        );
        const rows: string[][] = [];
        honMembers.forEach((m, i) => {
          const honorsArray = [
            ...(m.honors || []),
            m.isFellow || m.membershipClass === "Fellow" ? "Fellow" : null,
            m.isHonorary ? "Honorary Member" : null,
          ].filter(Boolean);
          const honors = [...new Set(honorsArray)].join(", ");
          rows.push([String(i + 1), m.membershipId || "", m.fullName || m.full_name || "",
            m.category || formatMemberClass(m.membershipClass), honors]);
        });
        await generateFormattedExcel(
          `RIQS_Honorary_Mentions_${date.replace(/ /g, "_")}.xlsx`,
          "RIQS — Honorary Mentions Report",
          ["No.", "Membership ID", "Full Name", "Category", "Distinctions"],
          rows
        );
      }

      toast.success("Report exported successfully!");
    } catch {
      toast.error("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  const selectedReport = REPORT_TYPES.find(r => r.id === selected);
  const isLoading = membersLoading || paymentsLoading || apcLoading;
  const uniqueCategories = [...new Set(members.map(m => m.category || formatMemberClass(m.membershipClass)).filter(Boolean))];

  return (
    <div className="space-y-6 max-w-350 mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and export structured reports as fully formatted PDF or Excel documents — matching official RIQS reporting templates.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: isLoading ? "—" : totalMembers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Revenue", value: isLoading ? "—" : `RWF ${totalRevenue.toLocaleString()}`, icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "APC Passed", value: isLoading ? "—" : apcPassed, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Honoured Members", value: isLoading ? "—" : honoraryCount, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-xl border border-zinc-100 shadow-sm p-4 flex items-center gap-3"
          >
            <div className={cn("p-2.5 rounded-lg shrink-0", s.bg)}>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{s.label}</p>
              <p className="text-lg font-bold text-navy leading-tight">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — Report Type Selector */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">1. Select report type</p>
          {REPORT_TYPES.map((r, i) => (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelected(r.id)}
              className={cn(
                "w-full text-left rounded-xl border p-4 transition-all duration-200 flex items-start gap-4 group",
                selected === r.id
                  ? `${r.border} ${r.bg} ring-2 ring-offset-1 ring-offset-white shadow-md`
                  : "border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-sm"
              )}
            >
              <div className={cn("p-2.5 rounded-lg shrink-0 transition-colors", selected === r.id ? r.bg : "bg-zinc-50 group-hover:bg-zinc-100")}>
                <r.icon className={cn("h-5 w-5", selected === r.id ? r.color : "text-zinc-400")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={cn("font-semibold text-sm", selected === r.id ? "text-zinc-900" : "text-zinc-700")}>
                    {r.title}
                  </span>
                  <Badge className={cn("text-[10px] px-2 py-0 border-0 font-bold", r.tagColor)}>{r.tag}</Badge>
                </div>
                <p className="text-xs text-zinc-500 leading-snug">{r.description}</p>
              </div>
              <ChevronRight className={cn("h-4 w-4 shrink-0 mt-1 transition-transform", selected === r.id ? `${r.color} translate-x-0.5` : "text-zinc-300")} />
            </motion.button>
          ))}
        </div>

        {/* Right — Configure & Generate */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">2. Configure & export</p>

          <Card className="border-zinc-100 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Report Options
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {!selected ? (
                <div className="py-8 text-center text-zinc-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Select a report type to configure options</p>
                </div>
              ) : (
                <>
                  {/* Period filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Period</label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="h-9 text-sm border-zinc-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="2026">Year 2026</SelectItem>
                        <SelectItem value="2025">Year 2025</SelectItem>
                        <SelectItem value="2024">Year 2024</SelectItem>
                        <SelectItem value="Q1 2026">Q1 2026</SelectItem>
                        <SelectItem value="Q2 2026">Q2 2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location filter — only for member reports */}
                  {["membership_assessment", "member_registry"].includes(selected) && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Practice Location</label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger className="h-9 text-sm border-zinc-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          <SelectItem value="Rwandan">Rwandan</SelectItem>
                          <SelectItem value="Non_Rwandan">Non-Rwandan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Category filter — only for registry */}
                  {selected === "member_registry" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</label>
                      <Select value={memCategory} onValueChange={setMemCategory}>
                        <SelectTrigger className="h-9 text-sm border-zinc-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {uniqueCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Data summary */}
                  <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-3 text-xs space-y-1.5">
                    <p className="font-semibold text-zinc-600 uppercase tracking-wider text-[10px]">Preview</p>
                    {selected === "membership_assessment" && (
                      <><p className="text-zinc-700"><span className="font-bold text-navy">{totalMembers}</span> total members across <span className="font-bold text-navy">{[...new Set(members.map(m => m.category))].filter(Boolean).length}</span> categories</p><p className="text-zinc-500">Rwandan: {rwandanCount} · Non-Rwandan: {totalMembers - rwandanCount}</p></>
                    )}
                    {selected === "member_registry" && (
                      <p className="text-zinc-700"><span className="font-bold text-navy">{members.filter(m => {
                        if (location !== "all" && m.practiceLocation !== location) return false;
                        if (memCategory !== "all" && m.category !== memCategory) return false;
                        return true;
                      }).length}</span> members match filters</p>
                    )}
                    {selected === "financial_summary" && (
                      <><p className="text-zinc-700"><span className="font-bold text-navy">{transactions.length}</span> total transactions</p><p className="text-zinc-500">Revenue: RWF {totalRevenue.toLocaleString()}</p></>
                    )}
                    {selected === "apc_assessments" && (
                      <><p className="text-zinc-700"><span className="font-bold text-navy">{apcs.length}</span> APC records</p><p className="text-zinc-500">Passed: {apcPassed} · Failed: {apcs.filter((a: any) => a.status === "Failed").length}</p></>
                    )}
                    {selected === "honorary_mentions" && (
                      <><p className="text-zinc-700"><span className="font-bold text-navy">{members.filter(m => m.isFellow || m.isHonorary || (m.honors || []).length > 0 || m.membershipClass === "Fellow").length}</span> honoured members</p><p className="text-zinc-500">Fellows: {fellowCount} · Honorary: {members.filter(m => m.isHonorary).length}</p></>
                    )}
                  </div>

                  {/* Export button */}
                  <Button
                    className="w-full bg-navy hover:bg-navy/90 text-white font-semibold shadow-sm"
                    onClick={handleGenerate}
                    disabled={generating || isLoading}
                  >
                    {generating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" />Export {selected === "membership_assessment" || selected === "apc_assessments" ? "PDF" : "Excel"}</>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info card */}
          <Card className="border-zinc-100 bg-zinc-50/80">
            <CardContent className="p-4 text-xs text-zinc-500 space-y-2">
              <p className="font-semibold text-zinc-600 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Report Notes</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Reports are automatically exported in fully formatted PDF or Excel documents</li>
                <li>Data reflects live system state at time of generation</li>
                <li>Templates conform to official RIQS Governing Council formats</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
