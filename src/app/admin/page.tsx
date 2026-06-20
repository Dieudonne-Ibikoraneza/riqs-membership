"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, ArrowRight, ArrowUpRight, Activity,
  Users, FileText, CheckSquare, CreditCard, GraduationCap,
  ClipboardList, AlertTriangle, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, Tooltip, Legend,
  CartesianGrid, XAxis, YAxis, RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";

const GOLD = "#f1a500";
const NAVY = "#0b3363";
const MUTED = "#94a3b8";

const monthly = [
  { m: "Jan", apps: 12, approved: 8 },
  { m: "Feb", apps: 18, approved: 14 },
  { m: "Mar", apps: 22, approved: 17 },
  { m: "Apr", apps: 19, approved: 15 },
  { m: "May", apps: 27, approved: 22 },
  { m: "Jun", apps: 31, approved: 26 },
  { m: "Jul", apps: 24, approved: 20 },
  { m: "Aug", apps: 29, approved: 23 },
  { m: "Sep", apps: 34, approved: 28 },
  { m: "Oct", apps: 38, approved: 31 },
  { m: "Nov", apps: 41, approved: 35 },
  { m: "Dec", apps: 45, approved: 38 },
];

const APPLICATIONS = [
  { id: "APP-1001", applicantName: "Diane Kayitesi", category: "Graduate", practiceLocation: "Foreign", status: "Pending" },
  { id: "APP-1002", applicantName: "Claude Niyonsenga", category: "Technologist", practiceLocation: "Local", status: "Under_Review" },
  { id: "APP-1003", applicantName: "Yves Ishimwe", category: "Professional", practiceLocation: "Local", status: "Correction Required" },
  { id: "APP-1004", applicantName: "Sandrine Rugamba", category: "Fellow", practiceLocation: "Local", status: "Approved" },
  { id: "APP-1005", applicantName: "Nshuti QS Group", category: "Firm", practiceLocation: "Local", status: "Rejected" },
  { id: "APP-1006", applicantName: "Grace Mutoni", category: "Graduate", practiceLocation: "Foreign", status: "Pending" },
];

const tooltipStyle = {
  background: NAVY,
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 6,
  color: "#fff",
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={tooltipStyle}>
        <p style={{ margin: 0, marginBottom: 6, fontWeight: 600, color: "#fff" }}>{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: entry.dataKey === "apps" ? GOLD : "#93c5fd" }} />
            <span style={{ color: entry.dataKey === "apps" ? GOLD : "#93c5fd", fontWeight: 500 }}>
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminOverview() {
  const approved = APPLICATIONS.filter(a => a.status === "Approved").length;
  const rejected = APPLICATIONS.filter(a => a.status === "Rejected").length;
  const total = APPLICATIONS.length;
  
  const pending = APPLICATIONS.filter(a => a.status === "Pending").length;
  const review = APPLICATIONS.filter(a => a.status === "Under_Review").length;
  const correction = APPLICATIONS.filter(a => a.status === "Correction Required").length;
  const pendingApproval = 0;

  const radial = [
    { name: "Approval rate", value: Math.round((approved / total) * 100) || 0, fill: GOLD },
  ];

  const stats = [
    {
      i: ClipboardList,
      label: "Pending",
      desc: "Awaiting initial check",
      v: pending,
      c: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "hover:border-amber-200 dark:hover:border-amber-500/30",
    },
    {
      i: Users,
      label: "Under Review",
      desc: "Panel assessment",
      v: review,
      c: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "hover:border-blue-200 dark:hover:border-blue-500/30",
    },
    {
      i: AlertTriangle,
      label: "Corrections",
      desc: "Waiting on applicant",
      v: correction,
      c: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-500/10",
      border: "hover:border-orange-200 dark:hover:border-orange-500/30",
    },
    {
      i: Clock,
      label: "Pending Approval",
      desc: "Awaiting final board",
      v: pendingApproval,
      c: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-500/10",
      border: "hover:border-purple-200 dark:hover:border-purple-500/30",
    },
    {
      i: CheckCircle2,
      label: "Approved",
      desc: "Successfully closed",
      v: approved,
      c: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "hover:border-emerald-200 dark:hover:border-emerald-500/30",
    },
  ];

  const activity = [
    { who: "Eng. P. Nshuti", what: "approved", target: "APP-1003", time: "2m ago" },
    { who: "Eng. C. Mukamana", what: "requested correction on", target: "APP-1008", time: "14m ago" },
    { who: "Admin", what: "updated email template", target: "Welcome", time: "1h ago" },
    { who: "System", what: "auto-renewed", target: "12 memberships", time: "3h ago" },
    { who: "Eng. P. Nshuti", what: "assigned reviewer to", target: "APP-1011", time: "5h ago" },
    { who: "Admin", what: "exported members CSV", target: "47 rows", time: "1d ago" },
  ];

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
            <div className="text-sm text-white/70">Administrator Workspace</div>
            <h1 className="text-2xl font-bold md:text-3xl">System Overview</h1>
            <div className="mt-2 text-sm text-white/80 max-w-md font-sans">
              Manage incoming applications, oversee mentorship progress, and approve professional upgrades across the institution.
            </div>
          </div>
          <div className="rounded-lg bg-white/10 px-5 py-3 backdrop-blur border border-white/10 flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-md shrink-0">
               <ClipboardList className="h-5 w-5 text-white" />
             </div>
             <div>
               <div className="text-xs text-white/70">Active Queue</div>
               <div className="text-lg font-bold">{pending + review + correction + pendingApproval} items</div>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Grid Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 stagger">
        {stats.map((s, index) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`hover-lift transition-all duration-200 border border-zinc-100 dark:border-zinc-800 ${s.border}`}>
              <CardContent className="p-5 flex flex-col items-start">
                <div
                  className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.bg} ${s.c}`}
                >
                  <s.i className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-navy dark:text-zinc-100 leading-tight">{s.v}</div>
                <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-1">{s.label}</div>
                <div className="text-[11px] text-muted-foreground font-sans mt-0.5">{s.desc}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg text-[#0b3363]">Applications vs Approvals</CardTitle>
              <CardDescription>Monthly throughput — last 12 months</CardDescription>
            </div>
            <Badge className="bg-[#f1a500]/20 text-[#a26d00]">+18% YoY</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <XAxis dataKey="m" stroke={MUTED} fontSize={12} />
                  <YAxis stroke={MUTED} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: GOLD, strokeWidth: 1 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="apps" name="Applications" stroke={GOLD} strokeWidth={2} fill="url(#gApps)" />
                  <Area type="monotone" dataKey="approved" name="Approved" stroke={NAVY} strokeWidth={2} fill="url(#gApp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg text-[#0b3363]">Approval rate</CardTitle>
            <CardDescription>Overall pipeline conversion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: '#f3f4f6' }} dataKey="value" cornerRadius={0} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="font-display text-3xl font-bold text-[#0b3363]">{radial[0].value}%</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Approved of {total}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="border-l-2 border-emerald-500 bg-emerald-50 px-2 py-1.5">
                <div className="text-emerald-700 font-semibold">{approved} approved</div>
              </div>
              <div className="border-l-2 border-red-500 bg-red-50 px-2 py-1.5">
                <div className="text-red-700 font-semibold">{rejected} rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live activity + Recent applications */}
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg text-[#0b3363] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#f1a500]" /> Live activity
            </CardTitle>
            <CardDescription>Reviewer & system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 border-l-2 border-[#f1a500]/60 bg-accent/30 px-3 py-2 text-sm transition-all hover:bg-accent/60" style={{ animation: `fadeIn .4s ${i * 80}ms both` }}>
                <div className="h-2 w-2 mt-1.5 rounded-full bg-[#f1a500] animate-pulse" />
                <div className="flex-1">
                  <div className="text-[#0b3363]">
                    <span className="font-semibold">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>{" "}
                    <span className="font-semibold">{a.target}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{a.time}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="font-display text-lg text-[#0b3363]">Recent applications</CardTitle>
              <CardDescription>Latest 6 submissions</CardDescription>
            </div>
            <Link href="/admin/applications" className="text-sm font-medium text-[#0b3363] hover:underline flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {APPLICATIONS.slice(0, 6).map((a, i) => (
              <Link
                key={a.id}
                href={`/admin/review/${a.id}`}
                className="flex items-center justify-between border border-zinc-200 bg-white p-4 transition-all hover:border-[#f1a500] hover:shadow-md"
                style={{ animation: `fadeUp .4s ${i * 60}ms both` }}
              >
                <div className="min-w-0">
                  <div className="truncate text-[17px] font-semibold text-[#0b3363] mb-0.5">{a.applicantName}</div>
                  <div className="truncate text-[13px] text-muted-foreground">{a.id} · {a.category} · {a.practiceLocation}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="shrink-0 rounded-full px-3 py-0.5 border-[#f1a500] text-[#a26d00] bg-transparent">
                    {a.status.replace(/_/g, ' ')}
                  </Badge>
                  {a.status === "Pending" && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs font-semibold text-[#0b3363] hover:bg-[#0b3363]/10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      Take Over
                    </Button>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
