"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { takeOverApplication } from "@/lib/api/admin";
import {
  CheckCircle2, ArrowRight, Activity,
  ClipboardList, AlertTriangle, Clock, Users, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, Tooltip, Legend,
  CartesianGrid, XAxis, YAxis, RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";

const GOLD = "#f1a500";
const NAVY = "#0b3363";
const MUTED = "#94a3b8";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/* ── Tooltip ─────────────────────────────────────────────────── */
const tooltipStyle = {
  background: NAVY,
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 6,
  color: "#fff",
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={tooltipStyle}>
        <p style={{ margin: 0, marginBottom: 6, fontWeight: 600, color: "#fff" }}>{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: entry.dataKey === "applications" ? GOLD : "#93c5fd" }} />
            <span style={{ color: entry.dataKey === "applications" ? GOLD : "#93c5fd", fontWeight: 500 }}>
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* ── Skeleton ─────────────────────────────────────────────────── */
const Skeleton = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <div className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 ${className}`} style={style} />
);

/* ── Main Page ─────────────────────────────────────────────────── */
export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>("Admin");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("riqs.auth.token");
    if (!token) { setError("Not authenticated"); setLoading(false); return; }

    // Decode role from JWT payload
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role || "Admin");
    } catch (_) {}

    const fetchStats = () => {
      fetch(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => { setStats(data); setLoading(false); })
        .catch((err) => { setError(err.message); setLoading(false); });
    };

    fetchStats();
    const intervalId = setInterval(fetchStats, 15000);

    return () => clearInterval(intervalId);
  }, []);

  // Pick the right role slice
  const isAdmin    = role === "Admin" || !!stats?.admin;
  const isReviewer = role === "Reviewer" || !!stats?.reviewer;
  const isApprover = role === "Approver" || !!stats?.approver;
  const d = stats?.admin || stats?.reviewer || stats?.approver || null;

  // Derived values — reviewers use reviewRate, others use approvalRate
  const rateData        = d?.reviewRate || d?.approvalRate || {};
  const forwardedCount  = rateData?.forwarded ?? 0;
  const approvedCount   = rateData?.approved ?? forwardedCount;
  const rejectedCount   = rateData?.rejected ?? 0;
  const totalDecided    = rateData?.total ?? 0;
  // For reviewer: rate is forwarded/total; for others: approved/total
  const ratePct         = totalDecided > 0
    ? Math.round(((isReviewer ? forwardedCount : approvedCount) / totalDecided) * 100)
    : 0;
  const approvalPct     = ratePct;
  const radial          = [{ name: isReviewer ? "Review rate" : "Approval rate", value: approvalPct, fill: GOLD }];
  // Total applications received (used in reviewer card)
  const totalReceived   = d?.totalReceived ?? totalDecided;



  const pending         = stats?.admin?.pendingApplications ?? stats?.reviewer?.pendingReviews ?? 0;
  const underReview     = stats?.reviewer?.assignedApplications ?? 0;
  const correction      = 0; // not yet a separate counter on reviewer/approver
  const pendingApproval = stats?.admin?.pendingApc ?? stats?.approver?.pendingApproval ?? 0;
  const approvedStat    = approvedCount;

  const kpiStats = [
    ...(isAdmin ? [
      { i: Users,         label: "Total Members",     desc: "Registered in system",     v: d?.totalMembers       ?? 0, c: "text-[#0b3363]",   bg: "bg-[#0b3363]/10", border: "hover:border-[#0b3363]/30" },
      { i: ClipboardList, label: "Pending",            desc: "Awaiting initial check",   v: d?.pendingApplications?? 0, c: "text-amber-600",   bg: "bg-amber-50",     border: "hover:border-amber-200" },
      { i: AlertTriangle, label: "Pending APC",        desc: "Awaiting APC assessment",  v: d?.pendingApc         ?? 0, c: "text-orange-600",  bg: "bg-orange-50",    border: "hover:border-orange-200" },
      { i: Clock,         label: "Unpaid Invoices",    desc: "Outstanding payments",     v: d?.unpaidInvoices     ?? 0, c: "text-red-600",     bg: "bg-red-50",       border: "hover:border-red-200" },
      { i: CheckCircle2,  label: "Mentorship Queue",   desc: "Upgrade requests",         v: d?.mentorshipQueue    ?? 0, c: "text-purple-600",  bg: "bg-purple-50",    border: "hover:border-purple-200" },
    ] : []),
    ...(isReviewer ? [
      { i: ClipboardList, label: "Assigned to Me",     desc: "Currently under review",   v: d?.assignedApplications?? 0, c: "text-blue-600",    bg: "bg-blue-50",      border: "hover:border-blue-200" },
      { i: Clock,         label: "Pending Queue",       desc: "Awaiting reviewer",        v: d?.pendingReviews     ?? 0, c: "text-amber-600",   bg: "bg-amber-50",     border: "hover:border-amber-200" },
      { i: CheckCircle2,  label: "My Reviewed",         desc: "Total I've processed",     v: d?.myReviewed         ?? 0, c: "text-emerald-600", bg: "bg-emerald-50",   border: "hover:border-emerald-200" },
    ] : []),
    ...(isApprover ? [
      { i: Clock,         label: "Pending Approval",    desc: "Awaiting final decision",  v: d?.pendingApproval    ?? 0, c: "text-purple-600",  bg: "bg-purple-50",    border: "hover:border-purple-200" },
      { i: CheckCircle2,  label: "I've Approved",       desc: "Total signed off",         v: d?.recentlyApproved   ?? 0, c: "text-emerald-600", bg: "bg-emerald-50",   border: "hover:border-emerald-200" },
    ] : []),
  ];

  // Active queue total for the banner
  const activeQueue = isAdmin
    ? (d?.pendingApplications ?? 0)
    : isReviewer
    ? (d?.assignedApplications ?? 0) + (d?.pendingReviews ?? 0)
    : (d?.pendingApproval ?? 0);

  // Chart data: always use applicationsVsApprovals (available for all roles)
  const chartData = (d?.applicationsVsApprovals ?? []).map((m: any) => ({ ...m, m: m.month }));

  // Recent applications
  const recentApps = d?.recentApplications ?? [];
  const recentActivity = d?.recentActivity ?? [];

  // Banner label
  const bannerLabel = isAdmin ? "Administrator Workspace" : isReviewer ? "Reviewer Workspace" : "Approver Workspace";
  const bannerDesc  = isAdmin
    ? "Manage incoming applications, oversee mentorship progress, and approve professional upgrades across the institution."
    : isReviewer
    ? "Review assigned applications, take over pending cases, and track your approval history."
    : "Review applications that have cleared the reviewer stage and make final approval decisions.";

  const handleTakeOver = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await takeOverApplication(id);
      router.push(`/admin/applications/${id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to take over application.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Brand Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl brand-gradient p-6 text-white md:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm text-white/70">{bannerLabel}</div>
            <h1 className="text-2xl font-bold md:text-3xl">System Overview</h1>
            <div className="mt-2 text-sm text-white/80 max-w-md font-sans">{bannerDesc}</div>
          </div>
          <div className="rounded-lg bg-white/10 px-5 py-3 backdrop-blur border border-white/10 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-md shrink-0">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-white/70">Active Queue</div>
              {loading
                ? <Skeleton className="h-7 w-12 mt-1" />
                : <div className="text-lg font-bold">{activeQueue} items</div>
              }
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load dashboard data: {error}
        </div>
      )}

      {/* Grid Stats */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${kpiStats.length <= 3 ? "lg:grid-cols-3" : kpiStats.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
        {loading
          ? Array.from({ length: isReviewer ? 3 : isApprover ? 2 : 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))
          : kpiStats.map((s, i) => (
              <motion.div
                key={s.label}
                className="h-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`border transition-all h-full flex flex-col ${s.border}`}>
                  <CardContent className="p-4">
                    <div className={`inline-flex rounded-md p-2 mb-3 ${s.bg}`}>
                      <s.i className={`h-5 w-5 ${s.c}`} />
                    </div>
                    <div className={`text-3xl font-bold ${s.c}`}>{s.v}</div>
                    <div className="font-medium text-[#0b3363] text-sm mt-0.5">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
        }
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg text-[#0b3363]">
                {loading ? <Skeleton className="h-6 w-48" /> : (isReviewer ? "My Reviews" : "Applications vs Approvals")}
              </CardTitle>
              <CardDescription className="mt-1">
                {loading ? <Skeleton className="h-4 w-64" /> : (isReviewer ? "Total applications & forwarded — last 12 months" : "Monthly throughput — last 12 months")}
              </CardDescription>
            </div>
            <Badge className="bg-[#f1a500]/20 text-[#a26d00]">12 mo</Badge>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-hidden">
            <div className="h-72">
              {loading
                ? <Skeleton className="h-full w-full" />
                : <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gApp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={NAVY} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="month" stroke={MUTED} fontSize={12} />
                      <YAxis stroke={MUTED} fontSize={12} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: GOLD, strokeWidth: 1 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="applications" name={isReviewer ? "Received" : "Applications"} stroke={GOLD} strokeWidth={2} fill="url(#gApps)" />
                      <Area type="monotone" dataKey="approved" name={isReviewer ? "Forwarded" : "Approved"} stroke={NAVY} strokeWidth={2} fill="url(#gApp)" />
                    </AreaChart>
                  </ResponsiveContainer>
              }
            </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg text-[#0b3363]">
              {loading ? <Skeleton className="h-6 w-32" /> : (isReviewer ? "Review rate" : "Approval rate")}
            </CardTitle>
            <CardDescription className="mt-1">
              {loading ? <Skeleton className="h-4 w-48" /> : (isReviewer ? "Applications you forwarded" : "Overall pipeline conversion")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-hidden">
            <div className="h-52 relative">
              {loading
                ? <Skeleton className="h-full w-full rounded-full mx-auto" style={{ width: "10rem", height: "10rem", borderRadius: "9999px" }} />
                : <>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="70%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar background={{ fill: '#f3f4f6' }} dataKey="value" cornerRadius={0} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="font-display text-3xl font-bold text-[#0b3363]">{approvalPct}%</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {isReviewer ? "Forwarded" : "Approved"} of {totalDecided}
                      </div>
                    </div>
                  </>
              }
            </div>
            </div>
            {isReviewer ? (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="border-l-2 border-emerald-500 bg-emerald-50 px-2 py-1.5">
                  <div className="text-emerald-700 font-semibold">{forwardedCount} forwarded</div>
                  <div className="text-emerald-600 text-[10px]">to approval</div>
                </div>
                <div className="border-l-2 border-[#0b3363] bg-[#0b3363]/5 px-2 py-1.5">
                  <div className="text-[#0b3363] font-semibold">{totalReceived} received</div>
                  <div className="text-[#0b3363]/70 text-[10px]">total applications</div>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="border-l-2 border-emerald-500 bg-emerald-50 px-2 py-1.5">
                  <div className="text-emerald-700 font-semibold">{approvedCount} approved</div>
                </div>
                <div className="border-l-2 border-red-500 bg-red-50 px-2 py-1.5">
                  <div className="text-red-700 font-semibold">{rejectedCount} rejected</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live activity + Recent applications */}
      <div className="grid gap-4 lg:grid-cols-2 items-start max-w-screen">
        {/* Live Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg text-[#0b3363] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#f1a500]" /> 
              {loading ? <Skeleton className="h-6 w-32" /> : "Live activity"}
            </CardTitle>
            <CardDescription className="mt-1">
              {loading ? <Skeleton className="h-4 w-40" /> : "Recent system events"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : recentActivity.length === 0
              ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground text-sm">
                  <Activity className="h-8 w-8 mb-2 opacity-30" />
                  No recent activity yet
                </div>
              )
              : recentActivity.map((a: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border-l-2 border-[#f1a500]/60 bg-accent/30 px-3 py-2 text-sm transition-all hover:bg-accent/60 overflow-hidden"
                  style={{ animation: `fadeIn .4s ${i * 80}ms both` }}
                >
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-[#f1a500] animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[#0b3363] text-sm break-all whitespace-normal">
                      <span className="font-semibold">{a.actionByEmail}</span>
                      {" "}<span className="text-muted-foreground">{a.actionType?.toLowerCase().replace(/_/g, " ")}</span>
                    </div>
                    {a.details && (
                      <div className="text-[#0b3363] font-semibold text-sm mt-0.5 leading-snug break-all whitespace-normal">
                        {typeof a.details === "object" ? JSON.stringify(a.details) : String(a.details)}
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            }
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="font-display text-lg text-[#0b3363]">
                {loading ? <Skeleton className="h-6 w-40" /> : "Recent applications"}
              </CardTitle>
              <CardDescription className="mt-1">
                {loading ? <Skeleton className="h-4 w-32" /> : "Latest submissions"}
              </CardDescription>
            </div>
            <Link href="/admin/applications" className="text-sm font-medium text-[#0b3363] hover:underline flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              : recentApps.length === 0
              ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground text-sm">
                  <ClipboardList className="h-8 w-8 mb-2 opacity-30" />
                  No recent applications
                </div>
              )
              : recentApps.map((a: any, i: number) => (
                <Link
                  key={a.id}
                  href={`/admin/applications/${a.id}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-zinc-200 bg-white p-4 transition-all hover:border-[#f1a500] hover:shadow-md gap-3"
                  style={{ animation: `fadeUp .4s ${i * 60}ms both` }}
                >
                  <div className="min-w-0 w-full sm:w-auto">
                    <div className="truncate text-[17px] font-semibold text-[#0b3363] mb-0.5">{a.applicantName}</div>
                    <div className="truncate text-[13px] text-muted-foreground">
                      {a.id?.slice(0, 8)}… · {a.category} · {a.practiceLocation}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    <Badge variant="outline" className="rounded-full px-3 py-0.5 border-[#f1a500] text-[#a26d00] bg-transparent">
                      {a.status?.replace(/_/g, " ")}
                    </Badge>
                    {a.status === "Pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-semibold text-[#0b3363] hover:bg-[#0b3363]/10"
                        onClick={(e) => handleTakeOver(e, a.id)}
                      >
                        Take Over
                      </Button>
                    )}
                  </div>
                </Link>
              ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
