"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  UserCog, Clock, CheckCircle2, XCircle, Loader2, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProfileEditRequests } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

type TabId = "Pending" | "Rejected" | "all";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "Pending", label: "Awaiting Review", icon: Clock },
  { id: "Rejected", label: "Rejected", icon: XCircle },
  { id: "all", label: "All Requests", icon: UserCog },
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
    <Badge variant="outline" className={cn("gap-1.5 font-semibold", cfg[status] || "bg-zinc-100")}>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
}

function changeSummary(req: any): string[] {
  const parts: string[] = [];
  if (req.proposedFullName) parts.push("Name");
  if (req.proposedResidencyAddress) parts.push("Residence address");
  if (req.proposedWorkAddress) parts.push("Work address");
  if (req.proposedProfilePhotoUrl) parts.push("Photo");
  const eduCount = Array.isArray(req.proposedEducation) ? req.proposedEducation.length : 0;
  if (eduCount > 0) parts.push(`${eduCount} education record${eduCount !== 1 ? "s" : ""}`);
  const empCount = Array.isArray(req.proposedEmployment) ? req.proposedEmployment.length : 0;
  if (empCount > 0) parts.push(`${empCount} employment record${empCount !== 1 ? "s" : ""}`);
  return parts;
}

export default function ProfileRequestsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("Pending");

  const { data, isLoading, error } = useQuery({
    queryKey: ["profileEditRequests", "admin", activeTab],
    queryFn: () => getProfileEditRequests(activeTab, 1, 50),
    staleTime: 15_000,
  });

  const requests: any[] = data?.requests || [];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-navy dark:text-white tracking-tight flex items-center gap-3">
          <UserCog className="h-8 w-8 text-gold" />
          Profile Update Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-sans">
          Review member-submitted changes to name, addresses, photo, education, and employment history.
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
            <div className="py-16 text-center text-sm text-muted-foreground">Failed to load requests. Please refresh.</div>
          ) : requests.length === 0 ? (
            <div className="py-20 text-center">
              <UserCog className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="font-semibold text-zinc-500 dark:text-zinc-400">No requests found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === "Pending" ? "No members have pending profile update requests." : "Nothing here yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {requests.map((req: any, i: number) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Link
                    href={`/admin/profile-requests/${req.id}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-gold/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-navy text-white flex items-center justify-center font-bold shrink-0">
                        {req.member?.fullName?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{req.member?.fullName}</div>
                        <div className="text-xs text-muted-foreground truncate">{req.member?.email} {req.member?.membershipId ? `· ${req.member.membershipId}` : ""}</div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {changeSummary(req).map((c) => (
                            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      <StatusBadge status={req.status} />
                      <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
