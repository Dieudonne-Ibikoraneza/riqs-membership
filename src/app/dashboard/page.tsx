"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  Wallet,
  FileText,
  GraduationCap,
  BadgeCheck,
  ArrowRight,
  Calendar,
  Loader2,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "@/lib/axiosClient";
import { applicantServices } from "@/services/applicant.services";
import { logbookServices } from "@/services/logbook.services";
import { queryKeys } from "@/services/queryKeys";
import { motion } from "framer-motion";
import { MembershipCard } from "@/components/MembershipCard";

export default function Overview() {
  const { data: profileData, isLoading } = useQuery({
    queryKey: queryKeys.applicant.profile(),
    queryFn: applicantServices.getProfile,
  });

  const isFirm = profileData?.application?.entityType === "Firm" || profileData?.profile?.membershipClass?.includes("Firm");
  const membershipCategory = profileData?.application?.category_name || profileData?.profile?.membershipClass || "None";
  const name = profileData?.profile?.fullName || "Member";
  const memberId = profileData?.profile?.membershipId || null;
  const rawStatus = profileData?.application?.status || "Pending";
  const appStatus = rawStatus.replace(/_/g, " ");
  const isGraduate = membershipCategory.includes("Graduate");
  const isAssociate = membershipCategory.includes("Associate");
  const isMentor = (profileData?.profile as any)?.systemRole === "Mentor" || membershipCategory.includes("Professional") || membershipCategory.includes("Fellow");

  const { data: logbookProgress } = useQuery({
    queryKey: ["logbook-progress", profileData?.application?.id],
    queryFn: () => logbookServices.getMentorshipProgress(profileData!.application!.id),
    enabled: !!profileData?.application?.id && (isGraduate || isAssociate)
  });

  const { data: menteesData } = useQuery({
    queryKey: queryKeys.mentorship.mentees(),
    queryFn: async () => {
      const res = await axiosClient.get("/progression/mentees");
      return res.data;
    },
    enabled: !isGraduate && !isFirm
  });
  
  const activeMenteesCount = menteesData?.mentees?.length || 0;

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>;

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
            <div className="text-sm text-white/70">Welcome back,</div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {name}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              {memberId && (
                <>
                  <BadgeCheck className="h-4 w-4 text-gold fill-gold" />
                  <span className="text-sm">{memberId}</span>
                </>
              )}
              <Badge className="bg-gold text-[#1a1a1a] hover:bg-gold/90 border-none font-bold">
                {appStatus}
              </Badge>
            </div>
          </div>
          {!["Admin", "Reviewer", "Approver"].includes((profileData?.profile as any)?.systemRole) && (
            <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur border border-white/10">
              <div className="text-xs text-white/70">Membership expires</div>
              <div className="flex items-center gap-2 text-lg font-semibold mt-0.5">
                <Calendar className="h-4 w-4 text-gold" />
                {(profileData?.profile as any)?.membershipExpiresAt ? (
                  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date((profileData?.profile as any).membershipExpiresAt))
                ) : (
                  <span className="text-sm">Not Set</span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Membership Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <MembershipCard profileData={profileData} />
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger">
        {[
          {
            i: Award,
            label: "Membership Category",
            v: membershipCategory,
            c: "text-navy",
          },
          {
            i: Wallet,
            label: "Application Status",
            v: appStatus,
            c: "text-emerald-600",
          },
          ...(isFirm ? [] : [{
            i: isGraduate ? GraduationCap : Users,
            label: isGraduate ? "Logbook Progress" : "Active Mentees",
            v: isGraduate ? `${((logbookProgress?.entriesCount || 0) / 2) * 100}%` : activeMenteesCount.toString(),
            c: isGraduate ? "text-navy dark:text-gold" : "text-emerald-600",
          }]),
          {
            i: FileText,
            label: "Uploaded Documents",
            v: `${profileData?.documents?.length || 0} on file`,
            c: "text-navy dark:text-gold",
          },
        ].map((s, index) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover-lift border-zinc-100 dark:border-zinc-800 h-full flex flex-col justify-between">
              <CardContent className="p-5 flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {s.label}
                  </span>
                  <s.i className={`h-4 w-4 ${s.c}`} />
                </div>
                <div className="mt-2 text-lg lg:text-xl font-bold text-navy dark:text-zinc-100">{s.v}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Grid: CPD and Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {!isFirm ? (
          (isGraduate || isAssociate) ? (
            <Card className="md:col-span-2 border-zinc-100 dark:border-zinc-800 flex flex-col h-full shadow-sm">
              <CardHeader>
                <CardTitle className="text-navy dark:text-zinc-100">
                  Logbook & Progression
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex items-center justify-between text-sm font-sans">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Overall Completion
                  </span>
                  <span className="font-semibold text-navy dark:text-gold">
                    {((logbookProgress?.entriesCount || 0) / 2) * 100}% completed
                  </span>
                </div>
                <Progress value={((logbookProgress?.entriesCount || 0) / 2) * 100} className="mt-2 h-2" />

                <div className="mt-6 flex-1 flex flex-col items-center justify-center py-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-dashed border-zinc-200 dark:border-zinc-800">
                  <FileText className="h-8 w-8 text-gold mb-2" />
                  <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Track your logbook</div>
                  <div className="text-[11px] text-muted-foreground mt-1 mb-4 font-sans">Complete your competencies to request a professional upgrade.</div>
                  <Link href="/dashboard/mentorship">
                    <Button size="sm" className="bg-navy hover:bg-navy/90 text-white font-semibold">View Logbook Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : isMentor ? (
            <Card className="md:col-span-2 border-zinc-100 dark:border-zinc-800 flex flex-col h-full shadow-sm">
              <CardHeader>
                <CardTitle className="text-navy dark:text-zinc-100">
                  Mentorship & Supervision
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex items-center justify-between text-sm font-sans">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Capacity Allocation
                  </span>
                  <span className="font-semibold text-navy dark:text-gold">
                    {activeMenteesCount} / 5 mentees
                  </span>
                </div>
                <Progress value={(activeMenteesCount / 5) * 100} className="mt-2 h-2.5 bg-zinc-150 dark:bg-zinc-800" />

                <div className="mt-6 flex-1 flex flex-col items-center justify-center py-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-md border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Users className="h-8 w-8 text-emerald-600 mb-2" />
                  <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mentorship Dashboard</div>
                  <div className="text-[11px] text-muted-foreground mt-1 mb-4 font-sans">Review logbooks and supervise your assigned graduates.</div>
                  <Link href="/dashboard/mentees">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Manage Mentees</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null
        ) : (
          <Card className="md:col-span-2 border-zinc-100 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-navy">
                Firm Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm font-sans mb-4">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Status Tracking
                </span>
                <span className="font-semibold text-emerald-600">
                  In Good Standing
                </span>
              </div>
              <div className="space-y-4">
                <div className="rounded-md border border-zinc-100 p-4 bg-emerald-50/50">
                  <h4 className="text-sm font-semibold text-navy">Annual Subscription</h4>
                  <p className="text-xs text-muted-foreground mt-1">Ensure your firm's annual membership subscription is paid promptly to maintain compliance and public registry listing.</p>
                </div>
                <div className="rounded-md border border-zinc-100 p-4 bg-blue-50/50">
                  <h4 className="text-sm font-semibold text-navy">Key Personnel</h4>
                  <p className="text-xs text-muted-foreground mt-1">All practicing partners and shareholders within your firm must maintain active individual practicing certificates.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-zinc-100 dark:border-zinc-800 flex flex-col h-full shadow-sm">
          <CardHeader>
            <CardTitle className="text-navy dark:text-zinc-100">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col">
            {[
              { to: "/dashboard/certificate", l: "Download Certificate", d: "Get your official cert", i: BadgeCheck, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
              { to: "/dashboard/payments", l: "Pay Annual Renewal", d: "Clear your 2025 dues", i: Wallet, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
              { to: "/dashboard/profile", l: "Update Profile", d: "Edit personal details", i: FileText, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
              { to: "/dashboard/documents", l: "Manage Documents", d: "Upload files & IDs", i: FileText, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
            ].map((a) => (
              <Link key={a.to} href={a.to} className="group block">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-gold/30 hover:shadow-sm transition-all duration-200">
                  <div className={`p-2 rounded-lg ${a.bg}`}>
                    <a.i className={`h-[18px] w-[18px] ${a.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-gold transition-colors">{a.l}</div>
                    <div className="text-[10px] text-muted-foreground font-sans">{a.d}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
