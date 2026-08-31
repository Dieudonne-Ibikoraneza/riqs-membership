"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardCheck,
  User,
  Award,
  Loader2,
  Check,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  Download,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PDFViewer from "@/components/ui/pdf-viewer";
import ImageViewer from "@/components/ui/image-viewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MonthYearPicker } from "@/components/ui/month-picker";
import { scheduleApc, gradeApc, getApplicationDetail } from "@/lib/api/admin";
import { axiosClient } from "@/lib/axiosClient";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

function StatusIcon({ status }: { status: string }) {
  const map: Record<string, any> = {
    Requested: Clock,
    Scheduled: Calendar,
    Passed: CheckCircle2,
    Failed: XCircle,
    No_Show: AlertCircle,
    Attended: ClipboardCheck,
  };
  const Icon = map[status] || ClipboardCheck;
  const colors: Record<string, string> = {
    Requested: "text-amber-500",
    Scheduled: "text-blue-500",
    Passed: "text-emerald-500",
    Failed: "text-red-500",
    No_Show: "text-zinc-400",
    Attended: "text-purple-500",
  };
  return <Icon className={cn("h-8 w-8", colors[status] || "text-zinc-400")} />;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-6 py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 w-32">{label}</span>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 text-right break-words break-all">{value}</span>
    </div>
  );
}

export default function ApcDetailPage({ params }: PageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const { role } = useAuth();
  const [apc, setApc] = useState<any>(null);
  const [apcDocs, setApcDocs] = useState<any[]>([]);
  const [mentorshipInfo, setMentorshipInfo] = useState<any>(null);
  const [activeDoc, setActiveDoc] = useState(0);
  const [direction, setDirection] = useState(0);
  const prevDoc = useRef(activeDoc);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [gradeDialog, setGradeDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ periodStart: "", periodEnd: "" });
  const [gradeForm, setGradeForm] = useState({ status: "Passed", score: "", notes: "" });

  const loadApc = async () => {
    try {
      // Fetch the single APC record by apcId from the system-wide endpoint
      const { data } = await axiosClient.get(`/admin/apc?page=1&limit=200`);
      const found = (data.assessments || []).find((a: any) => a.id === id);
      if (!found) throw new Error("Not found");
      setApc(found);

      if (found.application?.id) {
        const appDetails = await getApplicationDetail(found.application.id);
        const token = typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : '';
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

        const mentorshipDocuments: any[] = [];
        
        if (appDetails.logbookEntries) {
          appDetails.logbookEntries.forEach((entry: any) => {
            if (entry.documentUrl) {
              mentorshipDocuments.push({
                name: `${entry.period} Logbook`,
                url: `${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(entry.documentUrl)}&token=${token}`,
                originalFileUrl: entry.documentUrl,
                documentType: 'Logbook'
              });
            }
          });
        }
        
        const mAssignment = appDetails.mentorship || appDetails.application?.mentorshipAssignment;
        setMentorshipInfo(mAssignment ? {
          agreedReviewPeriodStart: mAssignment.agreedReviewPeriodStart,
          agreedReviewPeriodEnd: mAssignment.agreedReviewPeriodEnd
        } : null);
        if (mAssignment) {
          if (mAssignment.yearOneReportUrl) {
            mentorshipDocuments.push({
              name: 'Year 1 Annual Report',
              url: `${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(mAssignment.yearOneReportUrl)}&token=${token}`,
              originalFileUrl: mAssignment.yearOneReportUrl,
              documentType: 'Annual_Report'
            });
          }
          if (mAssignment.yearTwoReportUrl) {
            mentorshipDocuments.push({
              name: 'Year 2 Annual Report',
              url: `${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(mAssignment.yearTwoReportUrl)}&token=${token}`,
              originalFileUrl: mAssignment.yearTwoReportUrl,
              documentType: 'Annual_Report'
            });
          }
          if (mAssignment.mentorRecommendationUrl) {
            mentorshipDocuments.push({
              name: 'Mentor Recommendation Letter',
              url: `${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(mAssignment.mentorRecommendationUrl)}&token=${token}`,
              originalFileUrl: mAssignment.mentorRecommendationUrl,
              documentType: 'Recommendation'
            });
          }
        }
        setApcDocs(mentorshipDocuments);
      }
    } catch {
      toast.error("Could not load this APC record.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadApc(); }, [id]);

  const handleSchedule = async () => {
    if (!scheduleForm.periodStart) return toast.error("Please select an assessment period.");
    setIsSubmitting(true);
    try {
      await scheduleApc({
        applicationId: apc.application.id,
        assessmentPeriodStart: scheduleForm.periodStart,
        assessmentPeriodEnd: scheduleForm.periodEnd || undefined,
      });
      toast.success("APC Board successfully scheduled.");
      setScheduleDialog(false);
      setScheduleForm({ periodStart: "", periodEnd: "" });
      await loadApc();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to schedule APC board.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrade = async () => {
    if (["Passed", "Failed"].includes(gradeForm.status)) {
      if (gradeForm.score === "" || gradeForm.score === null || gradeForm.score === undefined) {
        toast.error("Score percentage is required.");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      await gradeApc({
        assessmentId: apc.id,
        status: gradeForm.status as any,
        scorePercentage: gradeForm.score ? Number(gradeForm.score) : undefined,
        assessmentNotes: gradeForm.notes,
      });
      toast.success("APC results recorded. If passed, the upgrade is pending the candidate's first-year fee payment.");
      setGradeDialog(false);
      await loadApc();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to record APC results.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-gold mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">Loading assessment record...</p>
      </div>
    );
  }

  if (!apc) {
    return (
      <div className="p-10 text-center">
        <GraduationCap className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
        <p className="font-semibold text-zinc-600">APC record not found.</p>
        <Link href="/admin/apc" className="text-navy dark:text-gold underline text-sm mt-3 inline-block">Back to APC Assessments</Link>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    Requested: "This candidate has requested an APC board assessment and is awaiting scheduling.",
    Scheduled: "The APC board is scheduled. Grade the result after the session.",
    Passed: "Candidate passed their APC assessment. The upgrade is approved, pending payment of the new class's first-year fee.",
    Failed: "Candidate did not pass. Review feedback below and consider scheduling a re-sit.",
    No_Show: "Candidate did not attend their scheduled board.",
    Attended: "Candidate attended — awaiting final result grading.",
  };

  const statusColors: Record<string, string> = {
    Requested: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50",
    Scheduled: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50",
    Passed: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50",
    Failed: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50",
    No_Show: "bg-zinc-100 border-zinc-200 dark:bg-zinc-800/30 dark:border-zinc-700",
    Attended: "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/50",
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 max-w-6xl mx-auto pb-10">
      <div className="lg:col-span-3 space-y-6">
      {/* Back */}
      <Link href="/admin/apc">
        <Button variant="ghost" size="sm" className="text-navy dark:text-gold hover:bg-navy/5 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> APC Assessments
        </Button>
      </Link>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex items-start gap-4 p-5 rounded-xl border", statusColors[apc.status] || "bg-zinc-50 border-zinc-200")}
      >
        <StatusIcon status={apc.status} />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-bold text-navy dark:text-white text-base">{apc.status.replace("_", " ")}</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{statusLabels[apc.status]}</p>
          <div className="flex gap-2 mt-3">
            {apc.status === "Requested" && ["Admin", "Approver", "Admin_Assistant"].includes(role || "") && (
              <Button size="sm" className="bg-gold text-[#1a1a1a] hover:bg-gold/90 border-none font-bold h-8 text-xs" onClick={() => setScheduleDialog(true)}>
                Schedule Board
              </Button>
            )}
            {["Scheduled", "Attended"].includes(apc.status) && ["Admin", "Approver", "Admin_Assistant"].includes(role || "") && (
              <Button size="sm" className="bg-navy text-white hover:bg-navy/90 border-none font-bold h-8 text-xs" onClick={() => setGradeDialog(true)}>
                Grade Result
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Candidate Details */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
              <User className="h-4 w-4 text-gold" /> Candidate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-0">
            <DetailRow label="Full Name" value={apc.member?.fullName} />
            <DetailRow label="Email" value={apc.member?.email} />
            <DetailRow label="Membership ID" value={apc.member?.membershipId || "Not yet assigned"} />
            <DetailRow label="Category" value={apc.application?.category?.categoryName} />
            <DetailRow label="Membership Class" value={apc.member?.membershipClass} />
            <div className="pt-2">
              <Link href={`/admin/applications/${apc.application?.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy dark:text-gold hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> View Full Application
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reviewer Board Recommended Period */}
      {mentorshipInfo?.agreedReviewPeriodStart && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-blue-200 dark:border-blue-900/50">
            <CardHeader className="pb-3 border-b border-blue-100 dark:border-blue-900/40">
              <CardTitle className="text-sm font-bold text-navy dark:text-blue-200 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-gold" /> Reviewer Board Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground">
                Final period agreed by the Head Reviewer when forwarding this mentorship upgrade to the Approver:
              </p>
              <p className="text-sm font-semibold text-navy dark:text-white">
                {(() => {
                  const start = new Date(mentorshipInfo.agreedReviewPeriodStart).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
                  if (mentorshipInfo.agreedReviewPeriodEnd) {
                    const end = new Date(mentorshipInfo.agreedReviewPeriodEnd).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
                    return `${start} – ${end}`;
                  }
                  return start;
                })()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Board Details (only if Scheduled/Completed) */}
      {apc.status !== "Requested" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gold" /> Board Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-0">
              <DetailRow
                label="Assessment Period"
                value={apc.assessmentPeriodStart ? (() => {
                  const start = new Date(apc.assessmentPeriodStart).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
                  if (apc.assessmentPeriodEnd) {
                    const end = new Date(apc.assessmentPeriodEnd).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
                    return `${start} – ${end}`;
                  }
                  return start;
                })() : undefined}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results (only if Completed) */}
      {["Passed", "Failed", "No_Show"].includes(apc.status) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
                <Award className="h-4 w-4 text-gold" /> Assessment Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-0">
              <DetailRow label="Score" value={apc.scorePercentage ? `${apc.scorePercentage}%` : "N/A"} />
              <DetailRow label="Stamp Fee Paid" value={(apc.application?.category?.stampFee === 0 || apc.application?.category?.stampFee === null) ? "N/A (Exempt)" : (apc.stampFeePaid ? "Yes" : "No")} />
              <DetailRow label="License Issued" value={apc.licenseIssued ? "Yes" : "No"} />
              {apc.assessmentNotes && (
                <div className="pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs text-muted-foreground mb-1.5">Panel Feedback</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{apc.assessmentNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
      </div>

      {/* Right Column: Document viewer */}
      <div className="lg:col-span-4">
        <Card className="border-zinc-100 dark:border-zinc-800 flex flex-col sticky top-6 h-[calc(100vh-8rem)]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-3 px-4 shrink-0">
            <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
              <FileText className="h-4 w-4 text-gold" /> Uploaded Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
            {apcDocs.length > 0 ? (
              <Tabs 
                value={String(activeDoc)} 
                onValueChange={(v) => {
                  const idx = +v;
                  const dir = idx === prevDoc.current ? 0 : idx > prevDoc.current ? 1 : -1;
                  setDirection(dir);
                  setActiveDoc(idx);
                  prevDoc.current = idx;
                }} 
                className="flex-1 flex flex-col"
              >
                <div className="flex flex-col mb-4">
                  <div className="flex items-center gap-1.5 px-2 pb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <MoveHorizontal className="w-3.5 h-3.5 opacity-70" />
                    <span>Scroll horizontally to view documents</span>
                  </div>
                  <TabsList className="flex w-full h-auto overflow-x-auto justify-start bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {apcDocs.map((d, i) => {
                      const formatLabel = (name: string) => name.replace(/[-_]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
                      return (
                        <TabsTrigger key={i} value={String(i)} className="shrink-0 text-sm font-semibold px-5 py-2.5 whitespace-nowrap">
                          {formatLabel(d.name)}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
                <div className="relative flex-1 mt-0 overflow-hidden">
                  {apcDocs.map((doc, i) => {
                    const isActive = activeDoc === i;
                    const xPos = isActive ? "0%" : i < activeDoc ? "-100%" : "100%";
                    const url = doc.url;
                    const checkUrl = doc.originalFileUrl || url;
                    const isImage = checkUrl?.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/i) || checkUrl?.startsWith("data:image");
                    return (
                      <motion.div 
                        key={i} 
                        initial={false}
                        animate={{
                          x: xPos,
                          opacity: isActive ? 1 : 0,
                        }}
                        transition={{ duration: 0.32, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2"
                        style={{ pointerEvents: isActive ? "auto" : "none", zIndex: isActive ? 10 : 0 }}
                      >
                        {isImage ? (
                          <ImageViewer src={url} alt={doc.name} fileName={doc.name + ".png"} />
                        ) : (
                          <PDFViewer src={url} fileName={doc.name + ".pdf"} />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </Tabs>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-full mb-4">
                  <FileText className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No documents uploaded</h3>
                <p className="text-sm max-w-xs mx-auto">This candidate does not have any documents attached to their APC assessment yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

      {/* Schedule Board Dialog */}
      <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule APC Board — {apc.member?.fullName}</DialogTitle></DialogHeader>
          {mentorshipInfo?.agreedReviewPeriodStart && (
            <div className="rounded-md border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 p-3 text-xs">
              <span className="font-semibold text-blue-800 dark:text-blue-300">Reviewer board recommended:</span>{" "}
              <span className="text-blue-900 dark:text-blue-200">
                {(() => {
                  const start = new Date(mentorshipInfo.agreedReviewPeriodStart).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
                  if (mentorshipInfo.agreedReviewPeriodEnd) {
                    const end = new Date(mentorshipInfo.agreedReviewPeriodEnd).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
                    return `${start} – ${end}`;
                  }
                  return start;
                })()}
              </span>
            </div>
          )}
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Assessment Period</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <MonthYearPicker monthOnly value={scheduleForm.periodStart} onChange={(v) => setScheduleForm({ ...scheduleForm, periodStart: v })} placeholder="Start month" />
                </div>
                <div>
                  <MonthYearPicker monthOnly value={scheduleForm.periodEnd} onChange={(v) => setScheduleForm({ ...scheduleForm, periodEnd: v })} placeholder="End month (optional)" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Choose one month for a single-month period, or add an end month for a range.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialog(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={isSubmitting || !scheduleForm.periodStart} className="bg-navy hover:bg-navy/90 text-white">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Result Dialog */}
      <Dialog open={gradeDialog} onOpenChange={setGradeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grade APC Assessment — {apc.member?.fullName}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Final Outcome</Label>
              <select
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:border-zinc-800 dark:bg-zinc-950"
                value={gradeForm.status}
                onChange={(e) => setGradeForm({ ...gradeForm, status: e.target.value })}
              >
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="No Show">No Show</option>
                <option value="Attended">Attended (Awaiting Results)</option>
              </select>
            </div>
            {["Passed", "Failed"].includes(gradeForm.status) && (
              <div className="space-y-2">
                <Label>Score Percentage (%)</Label>
                <Input type="number" min="0" max="100" placeholder="e.g. 78.5" value={gradeForm.score} onChange={(e) => {
                  let v = e.target.value;
                  if (parseFloat(v) > 100) v = "100";
                  if (parseFloat(v) < 0) v = "0";
                  setGradeForm({ ...gradeForm, score: v });
                }} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Panel Feedback / Notes</Label>
              <Textarea rows={3} placeholder="Enter examiner feedback or rationale..." value={gradeForm.notes} onChange={(e) => setGradeForm({ ...gradeForm, notes: e.target.value })} />
            </div>
            {gradeForm.status === "Passed" && (
              <p className="text-xs text-emerald-600 font-medium p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                ✓ Saving as "Passed" will approve this candidate's upgrade. Their new membership ID is issued once they pay the new class's first-year fee.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleGrade} disabled={isSubmitting} className="bg-navy hover:bg-navy/90 text-white">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Save Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
