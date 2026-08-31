"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  UserPlus, Clock, CheckCircle2, XCircle, Loader2, GraduationCap, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMentorApplicationsQueue, reviewMentorApplication } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TabId = "Pending" | "Approved" | "Rejected" | "all";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "Pending", label: "Awaiting Review", icon: Clock },
  { id: "Approved", label: "Approved", icon: CheckCircle2 },
  { id: "Rejected", label: "Rejected", icon: XCircle },
  { id: "all", label: "All Applications", icon: UserPlus },
];

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    Rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
  };
  const icons: Record<string, any> = { Pending: Clock, Approved: CheckCircle2, Rejected: XCircle };
  const Icon = icons[status] || Clock;
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-semibold shrink-0", cfg[status] || "bg-zinc-100")}>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
}

export default function MentorApplicationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("Pending");
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["mentorApplications", "admin", activeTab],
    queryFn: () => getMentorApplicationsQueue(activeTab, 1, 50),
    staleTime: 15_000,
  });

  const applications: any[] = data?.applications || [];

  const decisionMutation = useMutation({
    mutationFn: ({ id, decision, reviewNotes }: { id: string; decision: "Approve" | "Reject"; reviewNotes?: string }) =>
      reviewMentorApplication(id, decision, reviewNotes),
    onSuccess: (res, variables) => {
      toast.success(res.message || (variables.decision === "Approve" ? "Mentor application approved." : "Mentor application rejected."));
      setRejectTarget(null);
      setApproveTarget(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["mentorApplications"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to process this application."),
  });

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-navy dark:text-white tracking-tight flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-gold" />
          Mentor Applications
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-sans">
          Review requests from Technologist/Professional members to become a mentor. An Admin or Approver can also grant mentor status directly from a member&rsquo;s profile without an application.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all",
                activeTab === tab.id
                  ? "bg-navy text-white border-navy shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Failed to load mentor applications. Please refresh.</div>
          ) : applications.length === 0 ? (
            <div className="py-20 text-center">
              <GraduationCap className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="font-semibold text-zinc-500 dark:text-zinc-400">No applications found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === "Pending" ? "No members have pending mentor applications." : "Nothing here yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {applications.map((app: any, i: number) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-navy text-white flex items-center justify-center font-bold shrink-0">
                      {app.member?.fullName?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/members/${app.memberId}`}
                          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-navy dark:hover:text-gold hover:underline inline-flex items-center gap-1 group/profile"
                        >
                          {app.member?.fullName}
                          <ExternalLink className="h-3 w-3 text-zinc-400 opacity-0 group-hover/profile:opacity-100 transition-opacity" />
                        </Link>
                        <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400">
                          {app.member?.membershipClass}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{app.member?.email} {app.member?.membershipId ? `· ${app.member.membershipId}` : ""}</div>
                      {app.motivation && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 max-w-lg italic">&ldquo;{app.motivation}&rdquo;</p>
                      )}
                      {app.status === "Rejected" && app.reviewNotes && (
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1.5 max-w-lg">
                          <span className="font-semibold">Rejection reason: </span>{app.reviewNotes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 sm:pl-4">
                    <div className="text-xs text-muted-foreground hidden md:block">
                      {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <StatusBadge status={app.status} />
                    {app.status === "Pending" && (
                      <div className="flex items-center gap-2 ml-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20"
                          onClick={() => { setRejectTarget(app); setRejectReason(""); }}
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setApproveTarget(app)}
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve confirmation */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Mentor Application</DialogTitle>
            <DialogDescription>
              <strong>{approveTarget?.member?.fullName}</strong> will be granted the Mentor role and may be assigned Graduate members to supervise.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)} disabled={decisionMutation.isPending}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={decisionMutation.isPending}
              onClick={() => decisionMutation.mutate({ id: approveTarget.id, decision: "Approve" })}
            >
              {decisionMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Mentor Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting <strong>{rejectTarget?.member?.fullName}</strong>&rsquo;s mentor application. They will see this and may reapply.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (required)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="resize-none"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={decisionMutation.isPending}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={decisionMutation.isPending || !rejectReason.trim()}
              onClick={() => decisionMutation.mutate({ id: rejectTarget.id, decision: "Reject", reviewNotes: rejectReason.trim() })}
            >
              {decisionMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1.5 h-3.5 w-3.5" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
