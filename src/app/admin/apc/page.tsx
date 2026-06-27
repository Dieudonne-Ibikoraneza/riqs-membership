"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  GraduationCap,
  Calendar,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Check,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MonthYearPicker } from "@/components/ui/month-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { getAllApc, scheduleApc, gradeApc } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

type TabId = "all" | "Requested" | "Scheduled" | "completed";

const TABS: { id: TabId; label: string; icon: any; statusFilter?: string }[] = [
  { id: "all", label: "All Assessments", icon: GraduationCap },
  { id: "Requested", label: "Awaiting Scheduling", icon: Clock, statusFilter: "Requested" },
  { id: "Scheduled", label: "Scheduled Boards", icon: Calendar, statusFilter: "Scheduled" },
  { id: "completed", label: "Completed", icon: ClipboardCheck, statusFilter: "Passed,Failed,No_Show,Attended" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    Requested: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    Scheduled: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
    Passed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    Failed: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
    No_Show: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
    Attended: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400",
  };
  const icons: Record<string, any> = {
    Requested: Clock,
    Scheduled: Calendar,
    Passed: CheckCircle2,
    Failed: XCircle,
    No_Show: AlertCircle,
    Attended: ClipboardCheck,
  };
  const Icon = icons[status] || ClipboardCheck;
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-semibold", cfg[status] || "bg-zinc-100")}>
      <Icon className="h-3 w-3" />
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function ApcPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [scheduleDialog, setScheduleDialog] = useState<any>(null); // apc row being scheduled
  const [gradeDialog, setGradeDialog] = useState<any>(null); // apc row being graded
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ date: "", time: "", chair: "", chairEmail: "", exam1: "", exam1Email: "", exam2: "", exam2Email: "" });
  const [gradeForm, setGradeForm] = useState({ status: "Passed", score: "", notes: "" });

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const { data, isLoading, error } = useQuery({
    queryKey: ["apcAll", activeTab],
    queryFn: () => getAllApc(currentTab.statusFilter, 1, 50),
    staleTime: 30_000,
  });

  const assessments: any[] = data?.assessments || [];

  const handleSchedule = async () => {
    if (!scheduleForm.date) return toast.error("Please select an assessment date.");
    setIsSubmitting(true);
    try {
      await scheduleApc({
        applicationId: scheduleDialog.application.id,
        assessmentDate: new Date(`${scheduleForm.date}T${scheduleForm.time || "09:00"}`).toISOString(),
        panelChair: scheduleForm.chair,
        panelChairEmail: scheduleForm.chairEmail,
        examiner1: scheduleForm.exam1,
        examiner1Email: scheduleForm.exam1Email,
        examiner2: scheduleForm.exam2,
        examiner2Email: scheduleForm.exam2Email,
      });
      toast.success("APC Board successfully scheduled.");
      setScheduleDialog(null);
      setScheduleForm({ date: "", time: "", chair: "", chairEmail: "", exam1: "", exam1Email: "", exam2: "", exam2Email: "" });
      queryClient.invalidateQueries({ queryKey: ["apcAll"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to schedule APC board.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGrade = async () => {
    if (["Passed", "Failed"].includes(gradeForm.status) && !gradeForm.score) {
      toast.error("Score percentage is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await gradeApc({
        assessmentId: gradeDialog.id,
        status: gradeForm.status as any,
        scorePercentage: gradeForm.score ? Number(gradeForm.score) : undefined,
        assessmentNotes: gradeForm.notes,
      });
      toast.success("APC results recorded successfully.");
      setGradeDialog(null);
      setGradeForm({ status: "Passed", score: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["apcAll"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to record APC results.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-navy dark:text-white tracking-tight flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-gold" />
          APC Assessments
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-sans">
          Manage all Assessment of Professional Competence boards — from scheduling to grading and membership upgrade.
        </p>
      </div>

      {/* Tabs */}
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

      {/* Requested Banner */}
      {activeTab === "Requested" && assessments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50"
        >
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm">
              {assessments.length} candidate{assessments.length !== 1 ? "s" : ""} awaiting board scheduling
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
              Click "Schedule Board" on each row to assign a date, panel chair, and examiners.
            </p>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Failed to load assessments. Please refresh.
            </div>
          ) : assessments.length === 0 ? (
            <div className="py-20 text-center">
              <GraduationCap className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="font-semibold text-zinc-500 dark:text-zinc-400">No assessments found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === "Requested" ? "No candidates have requested an upgrade yet." : "Nothing here yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-navy text-white">
                  <tr>
                    {["Candidate", "Category", "Status", "Date", "Score", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-white">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((apc: any, i: number) => (
                    <tr
                      key={apc.id}
                      className={cn(
                        "border-b border-zinc-100 dark:border-zinc-800/60 transition-colors hover:bg-gold/5",
                        i % 2 === 1 && "bg-zinc-50/30 dark:bg-zinc-950/10"
                      )}
                    >
                      <td className="px-5 py-4">
                        {(() => {
                          const photoDoc = apc.application?.uploadedDocuments?.find((d: any) => d.documentType === 'Passport_Photo' || d.documentType === 'PassportPhoto');
                          const photoId = photoDoc?.id;
                          return (
                            <div className="flex items-center gap-3">
                              <Avatar name={apc.member?.fullName || ""} url={apc.member?.profilePhotoUrl || photoId} />
                              <div>
                                <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{apc.member?.fullName}</div>
                                <div className="text-xs text-muted-foreground leading-snug">{apc.member?.email}</div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-400 max-w-[180px] truncate">
                        {apc.application?.category?.categoryName}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={apc.status} />
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                        {apc.assessmentDate
                          ? new Date(apc.assessmentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                          : <span className="italic text-zinc-400">Not set</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                        {apc.scorePercentage ? `${apc.scorePercentage}%` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {apc.status === "Requested" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-gold text-[#1a1a1a] hover:bg-gold/90 border-none font-bold"
                              onClick={() => { setScheduleDialog(apc); setScheduleForm({ date: "", time: "", chair: "", chairEmail: "", exam1: "", exam1Email: "", exam2: "", exam2Email: "" }); }}
                            >
                              Schedule Board
                            </Button>
                          )}
                          {["Scheduled", "Attended"].includes(apc.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-navy text-navy hover:bg-navy/5"
                              onClick={() => { setGradeDialog(apc); setGradeForm({ status: "Passed", score: "", notes: "" }); }}
                            >
                              Grade Result
                            </Button>
                          )}
                          <Link href={`/admin/apc/${apc.id}`}>
                            <button className="inline-flex items-center text-xs font-semibold text-zinc-500 hover:text-navy dark:hover:text-gold group">
                              View
                              <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Board Dialog */}
      <Dialog open={!!scheduleDialog} onOpenChange={(o) => !o && setScheduleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule APC Board Assessment</DialogTitle>
          </DialogHeader>
          {scheduleDialog && (
            <div className="space-y-1 py-1 mb-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="font-semibold text-sm text-navy dark:text-white">{scheduleDialog.member?.fullName}</p>
              <p className="text-xs text-muted-foreground">{scheduleDialog.application?.category?.categoryName}</p>
            </div>
          )}
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Assessment Date & Time</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <MonthYearPicker value={scheduleForm.date} onChange={(v) => setScheduleForm({ ...scheduleForm, date: v })} placeholder="Select date" />
                </div>
                <div className="w-[140px]">
                  <TimePicker value={scheduleForm.time} onChange={(v) => setScheduleForm({ ...scheduleForm, time: v })} placeholder="Select time" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Panel Chair Name</Label>
                <Input placeholder="e.g. John Doe (PrQS)" value={scheduleForm.chair} onChange={(e) => setScheduleForm({ ...scheduleForm, chair: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Panel Chair Email</Label>
                <Input placeholder="chair@example.com" value={scheduleForm.chairEmail} onChange={(e) => setScheduleForm({ ...scheduleForm, chairEmail: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Examiner 1 Name</Label>
                <Input placeholder="e.g. Jane Smith (PrQS)" value={scheduleForm.exam1} onChange={(e) => setScheduleForm({ ...scheduleForm, exam1: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Examiner 1 Email</Label>
                <Input placeholder="exam1@example.com" value={scheduleForm.exam1Email} onChange={(e) => setScheduleForm({ ...scheduleForm, exam1Email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Examiner 2 Name</Label>
                <Input placeholder="e.g. Robert Brown (PrQS)" value={scheduleForm.exam2} onChange={(e) => setScheduleForm({ ...scheduleForm, exam2: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Examiner 2 Email</Label>
                <Input placeholder="exam2@example.com" value={scheduleForm.exam2Email} onChange={(e) => setScheduleForm({ ...scheduleForm, exam2Email: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialog(null)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={isSubmitting || !scheduleForm.date} className="bg-navy hover:bg-navy/90 text-white">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Result Dialog */}
      <Dialog open={!!gradeDialog} onOpenChange={(o) => !o && setGradeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade APC Assessment</DialogTitle>
          </DialogHeader>
          {gradeDialog && (
            <div className="space-y-1 py-1 mb-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="font-semibold text-sm text-navy dark:text-white">{gradeDialog.member?.fullName}</p>
              <p className="text-xs text-muted-foreground">
                Board date: {gradeDialog.assessmentDate ? new Date(gradeDialog.assessmentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
          )}
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Final Outcome</Label>
              <select
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent dark:border-zinc-800 dark:bg-zinc-950"
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
              <Textarea rows={3} placeholder="Enter examiner feedback or rationale for the outcome..." value={gradeForm.notes} onChange={(e) => setGradeForm({ ...gradeForm, notes: e.target.value })} />
            </div>
            {gradeForm.status === "Passed" && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                ✓ Saving as "Passed" will automatically upgrade this candidate's membership class in the system.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(null)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleGrade} disabled={isSubmitting} className="bg-navy hover:bg-navy/90 text-white">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Avatar({ name, url }: { name: string; url?: string }) {
  const [token, setToken] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("riqs.auth.token") || "");
    }
  }, []);

  const fullUrl = url && token 
    ? url.includes('/')
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/files/downloadByUrl?url=${encodeURIComponent(url)}&token=${token}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/files/download/${url}?token=${token}`
    : null;

  if (fullUrl) {
    return (
      <img
        src={fullUrl}
        alt={name}
        className="flex h-10 w-10 shrink-0 object-cover rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      />
    );
  }

  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy to-[#14467f] text-xs font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      {initials}
    </div>
  );
}
