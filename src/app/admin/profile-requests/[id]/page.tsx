"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, UserCog, User, GraduationCap, Briefcase, Check, X, Clock,
  CheckCircle2, XCircle, Loader2, FileText, MoveHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import PDFViewer from "@/components/ui/pdf-viewer";
import ImageViewer from "@/components/ui/image-viewer";
import { getProfileEditRequests, reviewProfileEditRequest } from "@/lib/api/admin";

interface PageProps {
  params: Promise<{ id: string }>;
}

function isImageFile(url?: string) {
  if (!url) return false;
  return /\.(jpe?g|png|gif|webp)$/i.test(url.split("?")[0]);
}

function formatMonthYear(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function formatAddress(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const parts = [v.village, v.cell, v.sector, v.district].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

function DiffRow({ label, current, proposed }: { label: string; current?: string | null; proposed?: string | null }) {
  if (!proposed) return null;
  return (
    <div className="grid grid-cols-2 gap-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div>
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current — {label}</div>
        <div className="text-sm text-zinc-500 dark:text-zinc-500">{current || "Not set"}</div>
      </div>
      <div>
        <div className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1">Proposed — {label}</div>
        <div className="text-sm font-semibold text-navy dark:text-white">{proposed}</div>
      </div>
    </div>
  );
}

export default function ProfileRequestDetail({ params }: PageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeDoc, setActiveDoc] = useState(0);
  const [decisionDialog, setDecisionDialog] = useState<null | "Approve" | "Reject">(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["profileEditRequests", "admin", "all"],
    queryFn: () => getProfileEditRequests("all", 1, 200),
  });

  const request = useMemo(() => (data?.requests || []).find((r: any) => r.id === id) || null, [data, id]);

  const decisionMutation = useMutation({
    mutationFn: () => reviewProfileEditRequest(id, decisionDialog as "Approve" | "Reject", reviewNotes),
    onSuccess: () => {
      toast.success(decisionDialog === "Approve" ? "Profile update approved and applied." : "Profile update request rejected.");
      queryClient.invalidateQueries({ queryKey: ["profileEditRequests"] });
      setDecisionDialog(null);
      setReviewNotes("");
      router.push("/admin/profile-requests");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to submit decision."),
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center animate-pulse">
        <div className="mx-auto flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-gold border-t-transparent" />
        <h3 className="mt-4 font-bold text-navy text-lg">Loading request...</h3>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-navy">Request not found</h2>
        <Link href="/admin/profile-requests" className="inline-flex items-center text-sm font-medium text-navy hover:text-navy/80 dark:text-gold dark:hover:text-gold/80 transition-colors mt-3">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to requests
        </Link>
      </div>
    );
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  const token = typeof window !== "undefined" ? localStorage.getItem("riqs.auth.token") : "";
  const buildUrl = (path: string) => `${apiBase}/files/downloadByUrl?url=${encodeURIComponent(path)}&token=${token}`;

  const proposedEducation: any[] = request.proposedEducation || [];
  const proposedEmployment: any[] = request.proposedEmployment || [];

  const docs: { name: string; url: string; isImage: boolean }[] = [];
  if (request.proposedProfilePhotoUrl) {
    docs.push({ name: "New Passport Photo", url: buildUrl(request.proposedProfilePhotoUrl), isImage: isImageFile(request.proposedProfilePhotoUrl) });
  }
  proposedEducation.forEach((edu: any, i: number) => {
    if (edu.certificateUrl) {
      docs.push({ name: `${edu.qualificationType || "Qualification"} Certificate`, url: buildUrl(edu.certificateUrl), isImage: isImageFile(edu.certificateUrl) });
    }
  });

  const safeActiveDoc = Math.min(activeDoc, Math.max(docs.length - 1, 0));
  const isPending = request.status === "Pending";

  return (
    <div className="space-y-4 font-sans max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/profile-requests">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-navy dark:hover:text-gold hover:bg-navy/5">
              <ArrowLeft className="mr-2 h-4 w-4" /> Requests
            </Button>
          </Link>
          <div className="hidden sm:block w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
          <div>
            <h1 className="text-xl font-bold text-navy dark:text-zinc-100">{request.member?.fullName}</h1>
            <div className="text-xs text-muted-foreground">{request.member?.email} · Submitted {new Date(request.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPending ? (
            <>
              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/30" onClick={() => setDecisionDialog("Reject")}>
                <X className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setDecisionDialog("Approve")}>
                <Check className="mr-2 h-4 w-4" /> Approve
              </Button>
            </>
          ) : request.status === "Approved" ? (
            <Badge variant="outline" className="gap-1.5 font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Approved
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 font-semibold bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400">
              <XCircle className="h-3 w-3" /> Rejected
            </Badge>
          )}
        </div>
      </div>

      {/* Decision Dialog */}
      <Dialog open={!!decisionDialog} onOpenChange={(o) => !o && setDecisionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decisionDialog === "Approve" ? "Approve profile update" : "Reject profile update"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {decisionDialog === "Approve" && (
              <p className="text-sm text-muted-foreground">
                This will immediately apply the proposed changes to {request.member?.fullName}'s profile, including any new education/employment records.
              </p>
            )}
            <div className="space-y-1.5">
              <Label>{decisionDialog === "Reject" ? "Reason for rejection (required)" : "Review notes (optional)"}</Label>
              <Textarea rows={3} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder={decisionDialog === "Reject" ? "Explain what needs to be corrected..." : "Add any internal notes..."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionDialog(null)} disabled={decisionMutation.isPending}>Cancel</Button>
            <Button
              className={decisionDialog === "Approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              disabled={decisionMutation.isPending || (decisionDialog === "Reject" && !reviewNotes.trim())}
              onClick={() => decisionMutation.mutate()}
            >
              {decisionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm {decisionDialog}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mt-2">
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
                  <User className="h-4 w-4 text-gold" /> Member
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-sm">
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Full Name</div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{request.member?.fullName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Membership ID</div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{request.member?.membershipId || "Not yet assigned"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Class</div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{request.member?.membershipClass || "—"}</div>
                </div>
              </CardContent>
            </Card>

            {request.memberNotes && (
              <Card className="border-blue-200 dark:border-blue-900/50 shadow-sm">
                <CardHeader className="py-3 px-4 border-b border-blue-100 dark:border-blue-900/40">
                  <CardTitle className="text-sm font-bold text-navy dark:text-blue-200">Note from member</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-sm text-muted-foreground whitespace-pre-wrap">{request.memberNotes}</CardContent>
              </Card>
            )}

            {!isPending && (
              <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
                <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold text-navy">Review Outcome</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="text-muted-foreground">Reviewed by <span className="font-medium text-zinc-700 dark:text-zinc-300">{request.reviewedByEmail}</span></div>
                  {request.reviewedAt && <div className="text-muted-foreground">On {new Date(request.reviewedAt).toLocaleString()}</div>}
                  {request.reviewNotes && <div className="mt-2 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{request.reviewNotes}</div>}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {/* Proposed field changes */}
          <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-bold text-navy">Proposed Changes</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {!request.proposedFullName && !request.proposedResidencyAddress && !request.proposedWorkAddress ? (
                <p className="text-sm text-muted-foreground italic">No profile field changes — only new education/employment records were submitted.</p>
              ) : (
                <>
                  <DiffRow label="Full Name" current={request.member?.fullName} proposed={request.proposedFullName} />
                  <DiffRow label="Residence Address" current={formatAddress(request.member?.residencyAddress)} proposed={formatAddress(request.proposedResidencyAddress)} />
                  <DiffRow label="Work Address" current={formatAddress(request.member?.workAddress)} proposed={formatAddress(request.proposedWorkAddress)} />
                </>
              )}
            </CardContent>
          </Card>

          {/* New education */}
          {proposedEducation.length > 0 && (
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold text-navy flex items-center gap-2"><GraduationCap className="h-4 w-4 text-gold" /> New Education Records</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {proposedEducation.map((edu: any, i: number) => (
                  <div key={i} className="rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3 text-xs">
                    <div className="font-semibold text-navy dark:text-zinc-100">{edu.qualificationType} in {edu.fieldOfStudy}</div>
                    <div className="text-muted-foreground mt-0.5">{edu.institution}</div>
                    <div className="text-muted-foreground mt-0.5">{formatMonthYear(edu.startDate)} to {formatMonthYear(edu.endDate)}</div>
                    {!edu.certificateUrl && <div className="text-amber-600 mt-1">No supporting certificate attached</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* New employment */}
          {proposedEmployment.length > 0 && (
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold text-navy flex items-center gap-2"><Briefcase className="h-4 w-4 text-gold" /> New Employment Records</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {proposedEmployment.map((emp: any, i: number) => (
                  <div key={i} className="rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3 text-xs">
                    <div className="font-semibold text-navy dark:text-zinc-100">{emp.jobTitle} — {emp.companyName}</div>
                    <div className="text-muted-foreground mt-0.5">{formatMonthYear(emp.startDate)} to {emp.isCurrent ? "Present" : formatMonthYear(emp.endDate)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Document viewer */}
          <Card className="border-zinc-100 dark:border-zinc-800 flex flex-col h-[calc(100vh-5rem)] shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 py-3 px-4 shrink-0">
              <CardTitle className="text-sm font-bold text-navy">Submitted Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col overflow-hidden bg-zinc-50/30 dark:bg-zinc-950/30">
              {docs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-full mb-4">
                    <FileText className="h-8 w-8 opacity-50" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No documents attached</h3>
                  <p className="text-sm max-w-xs mx-auto">This request did not include a new photo or supporting certificates.</p>
                </div>
              ) : (
                <Tabs
                  value={String(safeActiveDoc)}
                  onValueChange={(v) => setActiveDoc(+v)}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex flex-col mb-4">
                    <div className="flex items-center gap-1.5 px-2 pb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      <MoveHorizontal className="w-3.5 h-3.5 opacity-70" />
                      <span>Scroll horizontally to view all documents</span>
                    </div>
                    <TabsList className="flex w-full h-auto overflow-x-auto justify-start bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {docs.map((d, i) => (
                        <TabsTrigger key={i} value={String(i)} className="shrink-0 text-sm font-semibold px-5 py-2.5 whitespace-nowrap">{d.name}</TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  {/* Pre-render all documents (carousel slide, no reload on switch) */}
                  <div className="relative flex-1 mt-0 overflow-hidden">
                    {docs.map((d, i) => {
                      const isActive = safeActiveDoc === i;
                      const xPos = isActive ? "0%" : i < safeActiveDoc ? "-100%" : "100%";
                      return (
                        <motion.div
                          key={i}
                          initial={false}
                          animate={{ x: xPos, opacity: isActive ? 1 : 0 }}
                          transition={{ duration: 0.32, ease: "easeInOut" }}
                          className="absolute inset-0"
                          style={{ pointerEvents: isActive ? "auto" : "none" }}
                        >
                          <div className="relative h-full w-full rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
                            {d.isImage ? (
                              <ImageViewer src={d.url} alt={d.name} fileName={d.name} />
                            ) : (
                              <PDFViewer src={d.url} fileName={`${d.name}.pdf`} />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
