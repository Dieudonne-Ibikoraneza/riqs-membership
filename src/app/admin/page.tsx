"use client";

import React, { useState } from "react";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getApplicationsQueue, takeOverApplication } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminOverview() {
  const { role } = useAuth();

  const { data: pendingData } = useQuery({
    queryKey: ["adminQueue", "Pending"],
    queryFn: () => getApplicationsQueue(1, 1, "Pending", "all"),
  });
  
  const { data: reviewData } = useQuery({
    queryKey: ["adminQueue", "Under_Review"],
    queryFn: () => getApplicationsQueue(1, 1, "Under_Review", "all"),
  });
  
  const { data: correctionData } = useQuery({
    queryKey: ["adminQueue", "Correction_Required"],
    queryFn: () => getApplicationsQueue(1, 1, "Correction_Required", "all"),
  });

  const { data: approvedData } = useQuery({
    queryKey: ["adminQueue", "Approved"],
    queryFn: () => getApplicationsQueue(1, 1, "Approved", "all"),
  });
  
  const { data: pendingApprovalData } = useQuery({
    queryKey: ["adminQueue", "Pending_Approval"],
    queryFn: () => getApplicationsQueue(1, 1, "Pending_Approval", "all"),
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ["adminQueue", "recent"],
    queryFn: () => getApplicationsQueue(1, 6, "all", "all"),
  });

  const pending = pendingData?.pagination.total || 0;
  const review = reviewData?.pagination.total || 0;
  const correction = correctionData?.pagination.total || 0;
  const pendingApproval = pendingApprovalData?.pagination.total || 0;
  const approved = approvedData?.pagination.total || 0;
  const recentApplications = recentData?.queue || [];
  const queryClient = useQueryClient();
  const router = useRouter();
  const [takingOverId, setTakingOverId] = useState<string | null>(null);

  const handleReviewClick = async (e: React.MouseEvent, a: any) => {
    e.preventDefault();
    e.stopPropagation();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none";
      case "Under_Review": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-none";
      case "Correction_Required": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-none";
      case "Pending_Approval": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-none";
      case "Approved": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none";
      case "Rejected": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-none";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-none";
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
            <div className="text-sm text-white/70">{role === "Admin" ? "Administrator" : role} Workspace</div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {role === "Admin" ? "System Overview" : `${role} Overview`}
            </h1>
            <div className="mt-2 text-sm text-white/80 max-w-md font-sans">
              {role === "Reviewer" 
                ? "Evaluate incoming applications, verify submitted documentation, and prepare candidates for final board approval."
                : role === "Approver"
                ? "Finalize professional upgrades, issue certificates, and oversee the integrity of the institutional registry."
                : "Manage incoming applications, oversee mentorship progress, and approve professional upgrades across the institution."}
            </div>
          </div>
          <div className="rounded-lg bg-white/10 px-5 py-3 backdrop-blur border border-white/10 flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-md">
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

      {/* Recent Applications */}
      <Card className="border-zinc-100 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-navy">Recent applications</CardTitle>
          <Link href="/admin/applications">
            <Button
              variant="ghost"
              size="sm"
              className="text-navy dark:text-gold hover:bg-navy/5"
            >
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentLoading ? (
            <div className="flex h-32 items-center justify-center">
               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentApplications.length > 0 ? (
            recentApplications.map((a: any, index: number) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  href={`/admin/applications/${a.id}`}
                  className="flex items-center justify-between rounded-md border border-zinc-100 dark:border-zinc-800 p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                >
                  <div>
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {a.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {a.id.split('-')[0]} · {a.category_name} · {a.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`font-semibold ${getStatusColor(a.status)}`}
                    >
                      {a.status.replace(/_/g, " ")}
                    </Badge>
                    {(role === "Admin" || role === "Reviewer") && a.status === "Pending" && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs text-navy dark:text-gold hover:bg-navy/5"
                        onClick={(e) => handleReviewClick(e, a)}
                        disabled={takingOverId === a.id}
                      >
                        {takingOverId === a.id ? "Taking over..." : "Take Over"}
                      </Button>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-full mb-3">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-navy">No recent applications</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
                There are currently no recent applications to review.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
