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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { applicantServices } from "@/services/applicant.services";
import { queryKeys } from "@/services/queryKeys";
import { motion } from "framer-motion";

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
          <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur border border-white/10">
            <div className="text-xs text-white/70">Membership expires</div>
            <div className="flex items-center gap-2 text-lg font-semibold mt-0.5">
              <Calendar className="h-4 w-4 text-gold" /> 31 Dec 2025
            </div>
          </div>
        </div>
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
            i: GraduationCap,
            label: "CPD Hours Logged",
            v: "0 / 40",
            c: "text-amber-600",
          }]),
          {
            i: FileText,
            label: "Uploaded Documents",
            v: `${profileData?.documents?.length || 0} on file`,
            c: "text-navy",
          },
        ].map((s, index) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover-lift border-zinc-100 dark:border-zinc-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {s.label}
                  </span>
                  <s.i className={`h-4 w-4 ${s.c}`} />
                </div>
                <div className="mt-2 text-xl font-bold text-navy">{s.v}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Grid: CPD and Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {!isFirm ? (
          <Card className="md:col-span-2 border-zinc-100 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-navy">
                Continuing Professional Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm font-sans">
                <span className="text-zinc-600 dark:text-zinc-400">
                  2025 progress
                </span>
                <span className="font-semibold text-navy">
                  0 / 40 hours completed
                </span>
              </div>
              <Progress value={0} className="mt-2 h-2.5" />

              <div className="mt-6 flex flex-col items-center justify-center py-8 text-center bg-zinc-50 rounded-md border border-dashed border-zinc-200">
                <GraduationCap className="h-8 w-8 text-zinc-400 mb-2" />
                <div className="text-sm font-semibold text-zinc-700">No CPD records found</div>
                <div className="text-xs text-muted-foreground mt-1">Attend RIQS events to log CPD hours.</div>
              </div>
            </CardContent>
          </Card>
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

        <Card className="border-zinc-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-navy">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { to: "/dashboard/certificate", l: "Download certificate" },
              { to: "/dashboard/payments", l: "Pay annual renewal" },
              { to: "/dashboard/profile", l: "Update profile" },
              { to: "/dashboard/documents", l: "Manage documents" },
            ].map((a) => (
              <Link key={a.to} href={a.to} className="block w-full">
                <Button
                  variant="outline"
                  className="w-full justify-between border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300"
                >
                  <span>{a.l}</span>
                  <ArrowRight className="h-4 w-4 text-gold" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
