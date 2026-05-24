"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getApplicationsQueue } from "@/lib/api/admin";
import { useQuery } from "@tanstack/react-query";
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

  const stats = [
    {
      i: ClipboardList,
      label: "Pending",
      v: pending,
      c: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      i: Users,
      label: "Under Review",
      v: review,
      c: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      i: AlertTriangle,
      label: "Correction Required",
      v: correction,
      c: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/20",
    },
    {
      i: Clock,
      label: "Pending Approval",
      v: pendingApproval,
      c: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      i: CheckCircle2,
      label: "Approved",
      v: approved,
      c: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Administrator Overview</h1>
        <p className="text-sm text-muted-foreground font-sans">
          Snapshot of current applications and member activity.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 stagger">
        {stats.map((s, index) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover-lift border-zinc-100 dark:border-zinc-800">
              <CardContent className="p-5">
                <div
                  className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md ${s.bg} ${s.c}`}
                >
                  <s.i className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-navy">{s.v}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
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
          ) : recentApplications.map((a, index) => (
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
                <Badge
                  variant="outline"
                  className="border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-black/50"
                >
                  {a.status.replace(/_/g, " ")}
                </Badge>
              </Link>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
