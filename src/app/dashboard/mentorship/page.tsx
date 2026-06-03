"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Users, 
  CheckCircle2, 
  FileText, 
  Download, 
  Loader2, 
  AlertCircle, 
  Check, 
  Mail, 
  Phone,
  GraduationCap,
  Calendar,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import { logbookServices } from "@/services/logbook.services";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function MenteeCard({ mentee, onUploadClick, onDownloadClick, isUploading }: { 
  mentee: any; 
  onUploadClick: (applicationId: string) => void;
  onDownloadClick: (fileId: string, fileName: string) => void;
  isUploading: boolean;
}) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rejectingEntryId, setRejectingEntryId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const queryClient = useQueryClient();

  const { data: logEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ["logbook-entries", mentee.applicationId],
    queryFn: () => logbookServices.getLogbookEntries(mentee.applicationId),
    enabled: isReviewOpen
  });

  const reviewMutation = useMutation({
    mutationFn: logbookServices.reviewLogbookEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logbook-entries", mentee.applicationId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorship.mentees() });
      toast.success("Logbook entry updated");
    },
    onError: () => toast.error("Failed to update entry")
  });

  const handleRejectConfirm = () => {
    if (!rejectingEntryId) return;
    reviewMutation.mutate({ entryId: rejectingEntryId, status: "Rejected", rejectionReason });
    setRejectingEntryId(null);
    setRejectionReason("");
  };

  const pendingEntries = logEntries?.filter((e: any) => e.status === "Pending_Approval") || [];
  const reviewedEntries = logEntries?.filter((e: any) => e.status !== "Pending_Approval") || [];
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="space-y-2">
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {mentee.name}
            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              {mentee.category}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1 font-sans">
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-gold" /> {mentee.email}</span>
            {mentee.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gold" /> {mentee.phone}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-zinc-650 dark:text-zinc-400 font-sans">Logbook Completion:</span>
          <Progress value={mentee.progress} className="h-1.5 w-28 bg-zinc-150 dark:bg-zinc-850" />
          <span className="text-xs font-bold text-navy dark:text-gold">{mentee.progress}%</span>
        </div>
        <div className="text-[11px] text-muted-foreground font-sans">
          Assigned since {mentee.joined}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3 md:mt-0 md:justify-end">
        {mentee.recommendationSent ? (
          <>
            <Button 
              variant="outline" 
              className="bg-emerald-50/20 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50 gap-1.5 font-semibold text-xs md:text-sm"
              disabled
            >
              <CheckCircle2 className="h-4 w-4" /> Letter Sent
            </Button>
            {mentee.recommendationDocId && (
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                onClick={() => onDownloadClick(mentee.recommendationDocId, mentee.recommendationFileName || "recommendation.pdf")}
              >
                <Download className="h-4 w-4 text-gold" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-navy hover:underline"
              onClick={() => onUploadClick(mentee.applicationId)}
            >
              Replace
            </Button>
          </>
        ) : (
          <Button 
            className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-sm border-none font-semibold text-xs md:text-sm gap-1.5 transition-transform active:scale-[0.98]"
            onClick={() => {
              if (mentee.progress < 100) {
                toast.error("Logbook must be 100% complete before uploading the recommendation letter.");
                return;
              }
              onUploadClick(mentee.applicationId);
            }}
            disabled={isUploading}
          >
            {isUploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload Recommendation</>
            )}
          </Button>
        )}

        {mentee.pendingLogsCount > 0 && (
          <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2 font-semibold text-xs md:text-sm h-8 bg-zinc-50 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700">
                <FileText className="h-4 w-4 mr-1.5" />
                Review Logbook
                <Badge variant="destructive" className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500 text-white border-none text-[10px] leading-none">
                  {mentee.pendingLogsCount}
                </Badge>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Logbook Entries: {mentee.name}</DialogTitle>
              <DialogDescription>Review and approve graduate training hours.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 py-4">
              {entriesLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-navy dark:text-zinc-200 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" /> Pending Approval ({pendingEntries.length})
                    </h3>
                    {pendingEntries.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pl-6">No entries waiting for your review.</p>
                    ) : (
                      <div className="grid gap-3 pl-6">
                        {pendingEntries.map((entry: any) => (
                          <div key={entry.id} className="p-4 rounded-lg border border-orange-100 bg-orange-50/30 dark:border-orange-900/40 dark:bg-orange-950/20 space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 pr-4">
                                <div className="font-semibold text-sm text-navy dark:text-zinc-100">{entry.competency?.name}</div>
                                {entry.supervisorName && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    Supervised by: <span className="font-medium text-zinc-600 dark:text-zinc-300">{entry.supervisorName}</span>
                                  </div>
                                )}
                                <div className="text-xs text-zinc-700 dark:text-zinc-300 mt-2 p-3 rounded-md bg-white/60 border border-zinc-100 dark:bg-black/20 dark:border-zinc-800/60 leading-relaxed whitespace-pre-wrap">
                                  {entry.descriptionOfWork}
                                </div>
                                <div className="flex gap-4 mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                  <span>{new Date(entry.date).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span className="text-navy dark:text-gold font-bold">{entry.hoursCompleted} hours</span>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50" onClick={() => setRejectingEntryId(entry.id)} disabled={reviewMutation.isPending}>Reject</Button>
                                <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => reviewMutation.mutate({ entryId: entry.id, status: "Approved" })} disabled={reviewMutation.isPending}>Approve</Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <h3 className="font-semibold text-sm text-navy dark:text-zinc-200 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Past Reviews ({reviewedEntries.length})
                    </h3>
                    {reviewedEntries.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pl-6">No past reviews.</p>
                    ) : (
                      <div className="grid gap-3 pl-6">
                        {reviewedEntries.map((entry: any) => (
                          <div key={entry.id} className="p-3 rounded-lg border border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-sm">{entry.competency?.name}</div>
                                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                  <span>{new Date(entry.date).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{entry.hoursCompleted} hours</span>
                                </div>
                              </div>
                              <Badge variant={entry.status === "Approved" ? "default" : "destructive"} className={entry.status === "Approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-none" : "border-none"}>
                                {entry.status}
                              </Badge>
                            </div>
                            {entry.status === "Rejected" && entry.rejectionReason && (
                              <div className="mt-2 p-2.5 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-md border border-red-100 dark:border-red-900/30">
                                <span className="font-semibold text-[11px] uppercase tracking-wider block mb-0.5">Reason for rejection:</span> 
                                {entry.rejectionReason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="pt-4 mt-auto border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}

        <Dialog open={!!rejectingEntryId} onOpenChange={(o) => !o && setRejectingEntryId(null)}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Reject Logbook Entry</DialogTitle>
              <DialogDescription>Please provide a reason for rejecting this entry so the mentee can correct it.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Textarea 
                id="reason" 
                placeholder="e.g. Needs more detail about your specific role..." 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
                className="mt-2"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectingEntryId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectionReason.trim() || reviewMutation.isPending}>
                {reviewMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function Mentorship() {
  const { isMentor, name } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadAppId, setActiveUploadAppId] = useState<string | null>(null);

  // Logbook form state
  const [isLogbookModalOpen, setIsLogbookModalOpen] = useState(false);
  const [logbookForm, setLogbookForm] = useState({
    competencyId: "",
    hoursCompleted: 0,
    descriptionOfWork: "",
    supervisorName: "",
    date: new Date().toISOString().split("T")[0]
  });

  // 1. Fetch Mentees list (Mentor scope)
  const { data: menteesData, isLoading: isMenteesLoading, error: menteesError } = useQuery({
    queryKey: queryKeys.mentorship.mentees(),
    queryFn: applicantServices.getMentees,
    enabled: !!isMentor,
  });

  // 2. Fetch profile data (Graduate scope)
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.applicant.profile(),
    queryFn: applicantServices.getProfile,
    enabled: !isMentor,
  });

  // 2b. Fetch APC status
  const { data: apcData, isLoading: isApcLoading } = useQuery({
    queryKey: ["apcStatus"],
    queryFn: applicantServices.getApcStatus,
    enabled: !isMentor,
  });

  // 2c. Fetch Logbook Progress
  const { data: logbookProgress, isLoading: isLogbookLoading } = useQuery({
    queryKey: ["logbookProgress", profileData?.application?.id],
    queryFn: () => logbookServices.getLogbookProgress(profileData!.application!.id),
    enabled: !!profileData?.application?.id && !isMentor
  });

  const { data: competencies } = useQuery({
    queryKey: ["competencies"],
    queryFn: logbookServices.getCompetencies,
    enabled: !isMentor
  });

  // 3. Mutation: Upload Recommendation Letter (Mentor scope)
  const uploadRecMutation = useMutation({
    mutationFn: async ({ appId, file }: { appId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", appId);
      formData.append("documentType", "MentorRecommendation");
      return applicantServices.uploadDocument(formData);
    },
    onSuccess: () => {
      toast.success("Recommendation letter uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorship.mentees() });
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to upload recommendation letter.");
    },
    onSettled: () => {
      setActiveUploadAppId(null);
    }
  });

  // 4. Mutation: Upload Annual Report (Graduate scope)
  const uploadReportMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!profileData?.application?.id) {
        throw new Error("No active application draft found to sync annual report.");
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", profileData.application.id);
      formData.append("documentType", "AnnualReport");
      return applicantServices.uploadDocument(formData);
    },
    onSuccess: () => {
      toast.success("Annual report uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload annual report.");
    }
  });

  // 5. Mutation: Request APC Upgrade
  const requestUpgradeMutation = useMutation({
    mutationFn: applicantServices.requestApc,
    onSuccess: () => {
      toast.success("Professional status upgrade request successfully submitted to the RIQS Council!", {
        description: "You will receive an email notice once your board assessment is scheduled."
      });
      queryClient.invalidateQueries({ queryKey: ["apcStatus"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to submit upgrade request. Please try again.");
    }
  });

  // 6. Mutation: Submit Logbook Entry
  const submitLogbookMutation = useMutation({
    mutationFn: (data: any) => logbookServices.submitLogbookEntry(data),
    onSuccess: () => {
      toast.success("Logbook entry submitted for approval!");
      setIsLogbookModalOpen(false);
      setLogbookForm({ competencyId: "", hoursCompleted: 0, descriptionOfWork: "", supervisorName: "", date: new Date().toISOString().split("T")[0] });
      queryClient.invalidateQueries({ queryKey: ["logbookProgress"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to submit logbook entry.");
    }
  });

  const handleUploadClick = (appId: string) => {
    setActiveUploadAppId(appId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadAppId) return;
    
    uploadRecMutation.mutate({ appId: activeUploadAppId, file });
    e.target.value = ""; // Reset
  };

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadReportMutation.mutate(file);
    e.target.value = "";
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const blob = await applicantServices.downloadDocument(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download document.");
    }
  };

  // ================= MENTOR DASHBOARD VIEW =================
  if (isMentor) {
    const mentees = menteesData?.mentees || [];

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Hidden inputs for mentor uploading */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".pdf,.png,.jpg,.jpeg" 
          className="hidden" 
        />

        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-zinc-150">Mentor Dashboard</h1>
          <p className="text-sm text-muted-foreground font-sans font-normal mt-1">
            Supervise assigned graduates, track their logbook progress, and upload official letters of recommendation.
          </p>
        </div>

        {isMenteesLoading ? (
          <div className="grid gap-4 md:grid-cols-3 animate-pulse">
            <Card className="h-44 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
            <Card className="md:col-span-2 h-72 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
          </div>
        ) : menteesError ? (
          <Card className="border-red-200 bg-red-50/20 dark:bg-red-950/20 dark:border-red-900/50 p-6 flex flex-col items-center text-center gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h3 className="font-bold text-red-800 dark:text-red-400">Failed to load Mentees</h3>
            <p className="text-sm text-red-600 dark:text-red-300">Internal server error fetching progression records. Please refresh the page.</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Card: Capacity Tracking */}
            <Card className="md:col-span-1 h-fit border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-navy dark:text-zinc-150 text-base font-bold flex items-center gap-2 font-sans">
                  <Users className="h-4.5 w-4.5 text-gold" /> Capacity Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-navy dark:text-gold">
                  {mentees.length} <span className="text-sm text-muted-foreground font-normal">/ 5 Mentees</span>
                </div>
                <Progress value={(mentees.length / 5) * 100} className="h-2.5 bg-zinc-150 dark:bg-zinc-800" />
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Under RIQS council guidelines, a registered Professional Quantity Surveyor may supervise a maximum of 5 Graduate members concurrently to ensure high-quality training and mentoring standards.
                </p>
              </CardContent>
            </Card>

            {/* Right Card: Your Mentees */}
            <Card className="md:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-navy dark:text-zinc-150 text-base font-bold flex items-center gap-2 font-sans">
                  <GraduationCap className="h-4.5 w-4.5 text-gold" /> Mentees under your supervision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mentees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-center gap-3">
                    <Users className="h-10 w-10 text-zinc-300" />
                    <p className="text-sm">You do not have any graduates assigned to you at the moment.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 stagger">
                    {mentees.map((mentee: any) => (
                      <motion.div
                        key={mentee.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <MenteeCard 
                          mentee={mentee} 
                          onUploadClick={handleUploadClick}
                          onDownloadClick={handleDownload}
                          isUploading={uploadRecMutation.isPending && activeUploadAppId === mentee.applicationId}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // ================= GRADUATE / MENTEE PROGRESSION VIEW =================
  const mentorship = profileData?.mentorship;
  const docs = profileData?.documents || [];
  const hasRecommendation = docs.some(d => d.documentType === "MentorRecommendation");
  const recommendationDoc = docs.find((d: any) => d.documentType === "MentorRecommendation");
  const hasReport = docs.some((d: any) => d.documentType === "AnnualReport");
  const isUpgradeRequested = apcData?.assessments?.some((a: any) => a.status === "Requested");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hidden input for report uploading */}
      <input 
        type="file" 
        onChange={handleReportFileChange} 
        accept=".pdf,.png,.jpg,.jpeg" 
        id="report-upload-input" 
        className="hidden" 
      />

      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-zinc-150">Mentorship & Progression</h1>
        <p className="text-sm text-muted-foreground font-sans font-normal mt-1">
          Track your professional logbook progress, view your assigned mentor, and manage upgrades from Graduate to Professional tier.
        </p>
      </div>

      {isProfileLoading ? (
        <div className="grid gap-4 md:grid-cols-3 animate-pulse">
          <Card className="h-56 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
          <Card className="md:col-span-2 h-56 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Assigned Mentor details */}
          <Card className="md:col-span-1 h-fit border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-navy dark:text-zinc-150 text-base font-bold font-sans">Your Assigned Mentor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
              {mentorship?.mentorName ? (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm md:text-base">{mentorship.mentorName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-sans leading-relaxed">
                      {mentorship.mentorQualification || "PQS"} · {mentorship.mentorEmployer || "RIQS Registered Firm"}
                    </div>
                  </div>
                  
                  {mentorship.mentorContact && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-muted-foreground space-y-1.5 font-sans">
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gold shrink-0" /> {mentorship.mentorContact}</span>
                      {mentorship.mentorRegistrationNumber && (
                        <div className="text-[10px] uppercase font-bold text-navy dark:text-gold pt-1">
                          RIQS REG: #{mentorship.mentorRegistrationNumber}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-yellow-200/60 dark:border-yellow-900/30 p-4 bg-yellow-50/30 dark:bg-yellow-950/10 text-yellow-800 dark:text-yellow-400 text-xs leading-relaxed flex gap-2.5">
                  <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
                  <div>
                    <strong className="font-semibold">Assignment Pending:</strong>
                    <p className="mt-0.5">The institutional review board is currently matching your credentials to auto-assign a certified mentor. Once your application is fully cleared, your mentor assignment will update here.</p>
                  </div>
                </div>
              )}

              {/* Recommendation Alert Block */}
              {hasRecommendation ? (
                <div className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/40 text-xs leading-relaxed flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Recommendation Status:</strong> Received & Verified.<br />
                      Your mentor has officially submitted the recommendation letter!
                    </div>
                  </div>
                  {recommendationDoc && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownload(recommendationDoc.id, recommendationDoc.fileName)}
                      className="border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 w-full font-semibold gap-1.5 mt-1"
                    >
                      <Download className="h-3.5 w-3.5 text-gold" /> Download Letter
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-blue-50/45 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-900/40 text-xs leading-relaxed flex gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Recommendation Status:</strong> Pending.<br />
                    Once your logbook achievements reach 100% completion, your mentor can securely upload your official professional upgrade endorsement letter.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: progression logbook competencies */}
          <Card className="md:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60">
              <CardTitle className="text-navy dark:text-zinc-150 text-base font-bold font-sans">Logbook Competency Progress</CardTitle>
              <Dialog open={isLogbookModalOpen} onOpenChange={setIsLogbookModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-navy text-white hover:bg-navy/90 gap-1.5 shadow-sm rounded-full px-4 font-semibold">
                    <Award className="h-4 w-4" /> Log Hours
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle>Submit Logbook Entry</DialogTitle>
                    <DialogDescription>
                      Log hours against a specific competency for your mentor's review.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="competency">Competency Domain</Label>
                      <select 
                        id="competency" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={logbookForm.competencyId}
                        onChange={(e) => setLogbookForm({...logbookForm, competencyId: e.target.value})}
                      >
                        <option value="">Select a competency...</option>
                        {competencies?.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="date">Date Completed</Label>
                        <Input 
                          id="date" 
                          type="date" 
                          value={logbookForm.date}
                          onChange={(e) => setLogbookForm({...logbookForm, date: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hours">Hours Completed</Label>
                        <Input 
                          id="hours" 
                          type="number" 
                          min="0"
                          step="0.5"
                          placeholder="e.g. 8"
                          value={logbookForm.hoursCompleted || ""}
                          onChange={(e) => setLogbookForm({...logbookForm, hoursCompleted: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="supervisor">Supervisor Name (Optional)</Label>
                      <Input 
                        id="supervisor" 
                        placeholder="e.g. John Doe, PQS" 
                        value={logbookForm.supervisorName}
                        onChange={(e) => setLogbookForm({...logbookForm, supervisorName: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description of Work</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Describe the tasks completed, tools used, and outcomes..."
                        rows={3}
                        value={logbookForm.descriptionOfWork}
                        onChange={(e) => setLogbookForm({...logbookForm, descriptionOfWork: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsLogbookModalOpen(false)}>Cancel</Button>
                    <Button 
                      className="bg-gold text-[#1a1a1a] hover:bg-gold/90"
                      onClick={() => {
                        if (!logbookForm.competencyId || logbookForm.hoursCompleted <= 0 || logbookForm.descriptionOfWork.length < 10) {
                          toast.error("Please complete all required fields (Description must be at least 10 chars).");
                          return;
                        }
                        submitLogbookMutation.mutate({
                          ...logbookForm,
                          applicationId: profileData!.application!.id,
                          date: new Date(logbookForm.date).toISOString()
                        });
                      }}
                      disabled={submitLogbookMutation.isPending}
                    >
                      {submitLogbookMutation.isPending ? "Submitting..." : "Submit for Approval"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-6 pt-5 flex-1 max-h-[290px] overflow-y-auto">
              {isLogbookLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !logbookProgress?.competencies || logbookProgress.competencies.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <Award className="h-10 w-10 text-zinc-200 dark:text-zinc-800" />
                  No logbook competencies assigned.
                </div>
              ) : (
                logbookProgress.competencies.map((comp: any) => (
                  <div key={comp.competencyId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 font-sans">{comp.name}</span>
                      <span className="font-semibold text-navy dark:text-gold font-sans">{comp.percentage}% complete</span>
                    </div>
                    <Progress value={comp.percentage} className="h-2.5 bg-zinc-150 dark:bg-zinc-800" />
                    <div className="text-[10px] text-right text-muted-foreground">{comp.completedHours} / {comp.targetHours} hours</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade CTA Panel */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-6 relative z-10">
          <div className="flex-1 space-y-1.5">
            <div className="font-bold text-navy dark:text-gold text-lg md:text-xl font-sans">Ready for a Professional Upgrade?</div>
            <p className="text-sm text-muted-foreground leading-relaxed font-sans max-w-2xl">
              Ensure your mentor has uploaded your recommendation letter and that you have uploaded your final annual logbook report. Once all criteria are met, submit your request to schedule your board review.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5 w-full md:w-auto shrink-0">
            {hasReport ? (
              <Button 
                variant="outline" 
                className="bg-emerald-50/20 text-emerald-600 border-emerald-250 hover:bg-emerald-50 dark:bg-emerald-950/10 dark:text-emerald-400 dark:border-emerald-900/50 w-full sm:w-auto font-semibold gap-1.5"
                disabled
              >
                <Check className="h-4 w-4" /> Report Uploaded
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => {
                  if ((logbookProgress?.overallProgress || 0) < 100) {
                    toast.error("Your logbook must be 100% complete before uploading the annual report.");
                    return;
                  }
                  document.getElementById("report-upload-input")?.click();
                }}
                disabled={uploadReportMutation.isPending}
                className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 w-full sm:w-auto gap-1.5 text-zinc-700 dark:text-zinc-300 font-semibold"
              >
                {uploadReportMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="h-4 w-4 text-gold" /> Upload Annual Report</>
                )}
              </Button>
            )}

            <Button 
              className={cn("w-full sm:w-auto font-bold transition-transform active:scale-[0.98]", isUpgradeRequested ? "bg-zinc-200 text-zinc-600 cursor-not-allowed border-none shadow-none" : "bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none")}
              disabled={requestUpgradeMutation.isPending || isUpgradeRequested}
              onClick={() => {
                if ((logbookProgress?.overallProgress || 0) < 100) {
                  toast.error("Your logbook must be 100% complete before requesting an upgrade.");
                } else if (!hasRecommendation) {
                  toast.error("Your mentor has not uploaded your letter of recommendation yet.", {
                    description: "Your recommendation status must be Approved before requesting an upgrade."
                  });
                } else if (!hasReport) {
                  toast.error("Please upload your annual logbook report first.");
                } else {
                  requestUpgradeMutation.mutate();
                }
              }}
            >
              {requestUpgradeMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Requesting...</>
              ) : isUpgradeRequested ? (
                "Upgrade Requested"
              ) : (
                "Request Upgrade"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* APC Assessment History Panel */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm mt-8">
        <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
          <CardTitle className="text-navy dark:text-zinc-150 text-base font-bold font-sans flex items-center gap-2">
            <Award className="h-5 w-5 text-gold" /> APC Assessment History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isApcLoading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !apcData?.assessments || apcData.assessments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No APC assessments scheduled yet. Request an upgrade to initiate your board review.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {apcData.assessments.map((apc: any) => (
                <div key={apc.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-sans">Board Review Assessment</span>
                      {apc.status === "Requested" && <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">Requested</span>}
                      {apc.status === "Passed" && <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">Passed</span>}
                      {apc.status === "Failed" && <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">Failed</span>}
                      {apc.status === "Scheduled" && <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">Scheduled</span>}
                      {apc.status === "No_Show" && <span className="text-xs font-semibold px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">No Show</span>}
                    </div>
                    <div className="text-xs text-muted-foreground font-sans flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> 
                      {apc.assessmentDate ? new Date(apc.assessmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Pending Schedule"}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                      <div><span className="font-medium">Chair:</span> {apc.panelChairName || "Pending"}</div>
                      <div><span className="font-medium">Examiners:</span> {apc.examiner1Name ? `${apc.examiner1Name}, ${apc.examiner2Name || 'Pending'}` : "Pending"}</div>
                    </div>
                    
                    {apc.status !== "Scheduled" && apc.status !== "Requested" && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-navy dark:text-gold">{apc.scorePercentage ? `${apc.scorePercentage}%` : 'N/A'}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Final Score</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
