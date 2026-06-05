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
  Lock,
  ArrowUpCircle,
  Clock,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import { logbookServices, LogbookEntry } from "@/services/logbook.services";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

function MenteeCard({ mentee, onDownloadClick }: { 
  mentee: any; 
  onDownloadClick: (fileId: string, fileName: string) => void;
}) {
  const [isViewLogbooksOpen, setIsViewLogbooksOpen] = useState(false);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: logEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ["logbook-entries", mentee.applicationId],
    queryFn: () => logbookServices.getLogbookEntries(mentee.applicationId),
    enabled: isViewLogbooksOpen
  });

  const recommendMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", mentee.applicationId);
      return logbookServices.submitMentorRecommendation(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorship.mentees() });
      toast.success("Recommendation letter uploaded successfully!");
      setIsRecommendOpen(false);
      setSelectedFile(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to submit recommendation")
  });

  const handleRecommendSubmit = () => {
    if (!selectedFile) return;
    recommendMutation.mutate(selectedFile);
  };

  const canRecommend = mentee.entriesCount >= 4 && !mentee.mentorRecommendationUrl;

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
        {canRecommend ? (
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border-none font-semibold text-xs md:text-sm gap-1.5" onClick={() => setIsRecommendOpen(true)}>
            <ArrowUpCircle className="h-4 w-4 mr-1.5" />
            Submit Recommendation
          </Button>
        ) : mentee.mentorRecommendationUrl ? (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
            <Check className="h-3 w-3 mr-1" /> Recommendation Submitted
          </Badge>
        ) : null}

        <Dialog open={isViewLogbooksOpen} onOpenChange={setIsViewLogbooksOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="font-semibold text-xs md:text-sm h-8" disabled={mentee.entriesCount === 0}>
              <FileText className="h-4 w-4 mr-1.5" /> View Logbooks ({mentee.entriesCount})
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Logbook Entries: {mentee.name}</DialogTitle>
              <DialogDescription>View graduate logbook submissions.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 py-4">
              {entriesLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !logEntries || logEntries.length === 0 ? (
                 <p className="text-sm text-muted-foreground italic text-center py-6">No logbooks submitted.</p>
              ) : (
                <div className="grid gap-3">
                  {logEntries.map((entry: any) => (
                    <div key={entry.id} className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-sm text-navy dark:text-zinc-100">{entry.period}</div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Submitted: {new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs gap-1"
                        onClick={() => onDownloadClick(entry.id, `logbook_${entry.period}.pdf`)}
                      >
                        <Download className="h-3 w-3" /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="pt-4 mt-auto border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="outline" onClick={() => setIsViewLogbooksOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isRecommendOpen} onOpenChange={setIsRecommendOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Submit Final Recommendation</DialogTitle>
              <DialogDescription>Attach your final official letter of recommendation for {mentee.name}'s membership upgrade.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="letter">Recommendation Letter (PDF/Image)</Label>
                <Input 
                  id="letter" 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="mt-2"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRecommendOpen(false)}>Cancel</Button>
              <Button 
                className="bg-gold text-[#1a1a1a] hover:bg-gold/90" 
                onClick={handleRecommendSubmit} 
                disabled={!selectedFile || recommendMutation.isPending}
              >
                {recommendMutation.isPending ? "Submitting..." : "Submit Recommendation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function Mentorship() {
  const { isMentor } = useAuth();
  const queryClient = useQueryClient();

  // Logbook form state
  const [isLogbookModalOpen, setIsLogbookModalOpen] = useState(false);
  const [logbookForm, setLogbookForm] = useState({
    period: "Month 1-6"
  });
  const [selectedLogbookFile, setSelectedLogbookFile] = useState<File | null>(null);

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

  // 2c. Fetch Mentorship Progress (Logbooks + Assignment)
  const { data: mentorshipProgress, isLoading: isLogbookLoading } = useQuery({
    queryKey: ["mentorshipProgress", profileData?.application?.id],
    queryFn: () => logbookServices.getMentorshipProgress(profileData!.application!.id),
    enabled: !!profileData?.application?.id && !isMentor
  });

  // 4. Mutation: Upload Two Year Report (Graduate scope)
  const uploadReportMutation = useMutation({
    mutationFn: async ({ file, year }: { file: File, year: "1" | "2" }) => {
      if (!profileData?.application?.id) {
        throw new Error("No active application found.");
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", profileData.application.id);
      formData.append("year", year);
      return logbookServices.uploadAnnualReport(formData);
    },
    onSuccess: (_, variables) => {
      toast.success(`Year ${variables.year} Report uploaded successfully!`);
      queryClient.invalidateQueries({ queryKey: ["mentorshipProgress"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to upload annual report.");
    }
  });

  // 5. Mutation: Request APC Upgrade (Bundled)
  const requestUpgradeMutation = useMutation({
    mutationFn: async (apcReadiness: "Ready" | "Not_Ready") => {
      if (!profileData?.application?.id) throw new Error("Missing Application ID");
      return logbookServices.requestUpgrade({
        applicationId: profileData.application.id,
        apcReadiness
      });
    },
    onSuccess: () => {
      toast.success("Mentorship Upgrade successfully requested! Waiting for Mentor recommendation.");
      queryClient.invalidateQueries({ queryKey: ["mentorshipProgress"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to submit upgrade request. Please try again.");
    }
  });

  // 6. Mutation: Submit Logbook Entry
  const submitLogbookMutation = useMutation({
    mutationFn: async ({ file, period, appId }: { file: File, period: string, appId: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("period", period);
      formData.append("applicationId", appId);
      return logbookServices.submitLogbookEntry(formData);
    },
    onSuccess: () => {
      toast.success("Logbook submitted successfully!");
      setIsLogbookModalOpen(false);
      setSelectedLogbookFile(null);
      setLogbookForm({ period: "Month 1-6" });
      queryClient.invalidateQueries({ queryKey: ["mentorshipProgress"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to submit logbook.");
    }
  });

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>, year: "1" | "2") => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadReportMutation.mutate({ file, year });
    e.target.value = "";
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      // In a real implementation, you would trigger the download endpoint directly or use the fileUrl.
      toast.success(`Downloading ${fileName}...`);
    } catch (err) {
      toast.error("Failed to download document.");
    }
  };

  // ================= MENTOR DASHBOARD VIEW =================
  if (isMentor) {
    const mentees = menteesData?.mentees || [];

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
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
            <Card className="md:col-span-1 h-fit border-zinc-200 dark:border-zinc-800 shadow-sm md:sticky md:top-6">
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
                          onDownloadClick={handleDownload}
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
  const assignment = mentorshipProgress?.assignment;
  const hasYear1Report = !!assignment?.yearOneReportUrl;
  const hasYear2Report = !!assignment?.yearTwoReportUrl;
  const hasReport = hasYear1Report && hasYear2Report;
  const approvedAt = profileData?.application?.approvedAt;
  const financialTransactions = profileData?.financialTransactions || [];

  const renewalCleared = financialTransactions.some(
    (tx: any) => tx.txType === 'Annual_Renewal' && tx.status === 'Cleared'
  );

  const monthsElapsed = approvedAt
    ? Math.floor((Date.now() - new Date(approvedAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : 0;

  const renewalDue = monthsElapsed >= 12;
  const isRenewalLocked = renewalDue && !renewalCleared;

  const logbookComplete = (mentorshipProgress?.entriesCount || 0) >= 4;
  const logbookPercentage = Math.min(100, (mentorshipProgress?.entriesCount || 0) * 25);
  const twoYearsElapsed = monthsElapsed >= 24;
  const monthsToGo = Math.max(0, 24 - monthsElapsed);
  const upgradeEligible = logbookComplete;
  const upgradeRequested = assignment?.upgradeRequested;

  const hasActiveApc = apcData?.assessments?.some(
    (a: any) => a.status === "Requested" || a.status === "Scheduled"
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <input 
        type="file" 
        onChange={(e) => handleReportFileChange(e, "1")} 
        accept=".pdf,.png,.jpg,.jpeg" 
        id="report-upload-input-1" 
        className="hidden" 
      />
      <input 
        type="file" 
        onChange={(e) => handleReportFileChange(e, "2")} 
        accept=".pdf,.png,.jpg,.jpeg" 
        id="report-upload-input-2" 
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
          <Card className="md:col-span-1 h-fit border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:sticky md:top-6">
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
            </CardContent>
          </Card>

          {/* Right Column: progression logbooks */}
          <Card className="md:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60">
              <CardTitle className="text-navy dark:text-zinc-150 text-base font-bold font-sans">Logbook Submissions</CardTitle>
              <Dialog open={isLogbookModalOpen} onOpenChange={setIsLogbookModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-navy text-white hover:bg-navy/90 gap-1.5 shadow-sm rounded-full px-4 font-semibold" disabled={isRenewalLocked}>
                    <Upload className="h-4 w-4" /> Submit Logbook
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle>Submit 6-Month Logbook</DialogTitle>
                    <DialogDescription>
                      Upload your compiled logbook document for the specified 6-month period.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="period">Logbook Period</Label>
                      <select 
                        id="period" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={logbookForm.period}
                        onChange={(e) => setLogbookForm({...logbookForm, period: e.target.value})}
                      >
                        <option value="Month 1-6">Month 1-6</option>
                        <option value="Month 7-12">Month 7-12</option>
                        <option value="Month 13-18">Month 13-18</option>
                        <option value="Month 19-24">Month 19-24</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="logbookDoc">Logbook Document (PDF)</Label>
                      <Input 
                        id="logbookDoc" 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => setSelectedLogbookFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsLogbookModalOpen(false)}>Cancel</Button>
                    <Button 
                      className="bg-gold text-[#1a1a1a] hover:bg-gold/90"
                      onClick={() => {
                        if (!selectedLogbookFile) {
                          toast.error("Please select a file to upload.");
                          return;
                        }
                        submitLogbookMutation.mutate({
                          file: selectedLogbookFile,
                          period: logbookForm.period,
                          appId: profileData!.application!.id
                        });
                      }}
                      disabled={submitLogbookMutation.isPending || !selectedLogbookFile}
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
              ) : !mentorshipProgress?.entries || mentorshipProgress.entries.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-zinc-200 dark:text-zinc-800" />
                  No logbook submissions yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {mentorshipProgress.entries.map((entry: any) => (
                    <div key={entry.id} className="p-3 rounded-lg border border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-sm">{entry.period}</div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Submitted: {new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-none">
                        Uploaded
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Annual Renewal Lock Banner ─── */}
      {isRenewalLocked && (
        <Card className="border-red-300 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 shadow-sm">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-800 dark:text-red-300 text-sm">Annual Renewal Required — Mentorship Access Locked</div>
                <p className="text-xs text-red-700 dark:text-red-400 font-sans mt-1 leading-relaxed max-w-xl">
                  Your first membership year ended {monthsElapsed} months ago. To continue logging hours and requesting your upgrade, you must pay your annual renewal fee ({((profileData?.application as any)?.annual_renewal_fee || 50000).toLocaleString()} RWF) and upload your Annual Report. Once your payment is verified by RIQS, your access will be restored.
                </p>
              </div>
            </div>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white border-none shrink-0 gap-1.5 font-semibold"
              onClick={() => window.location.href = '/dashboard/checkout'}
            >
              <RefreshCw className="h-4 w-4" /> Pay Renewal Fee
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Upgrade & Annual Report Panel ─── */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-blue-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950/10">
        <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
          <CardTitle className="text-navy dark:text-zinc-150 text-base font-bold font-sans flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-gold" /> Upgrade to Professional Membership
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">

          {/* Timeline & eligibility status */}
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-4 bg-white/80 dark:bg-zinc-900/60 space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time in Programme</div>
              <div className="font-bold text-xl text-navy dark:text-gold">{monthsElapsed} <span className="text-sm font-normal text-muted-foreground">months</span></div>
              <div className="text-xs text-muted-foreground font-sans">{twoYearsElapsed ? "✅ 2-year requirement met" : `${monthsToGo} months remaining`}</div>
            </div>
            <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-4 bg-white/80 dark:bg-zinc-900/60 space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Logbook Completion</div>
              <div className="font-bold text-xl text-navy dark:text-gold">{logbookPercentage}<span className="text-sm font-normal text-muted-foreground">%</span></div>
              <div className="text-xs text-muted-foreground font-sans">{logbookComplete ? "✅ 4 Logbooks uploaded" : `${100 - logbookPercentage}% still needed`}</div>
            </div>
            <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-4 bg-white/80 dark:bg-zinc-900/60 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Annual Reports</div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Year 1 Report:</span>
                  <span className={cn("font-bold text-xs", hasYear1Report ? "text-emerald-600" : "text-zinc-500")}>
                    {hasYear1Report ? "✅ Uploaded" : "⏳ Pending"}
                  </span>
                </div>
                {!hasYear1Report && (
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-7"
                    onClick={() => {
                      if ((mentorshipProgress?.entriesCount || 0) < 2) return toast.error("Upload at least 2 logbooks before attaching Year 1 Report.");
                      document.getElementById("report-upload-input-1")?.click();
                    }}
                    disabled={uploadReportMutation.isPending || isRenewalLocked}>
                    <Upload className="h-3 w-3 text-gold" /> Upload Year 1
                  </Button>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium">Year 2 Report:</span>
                  <span className={cn("font-bold text-xs", hasYear2Report ? "text-emerald-600" : "text-zinc-500")}>
                    {hasYear2Report ? "✅ Uploaded" : "⏳ Pending"}
                  </span>
                </div>
                {!hasYear2Report && (
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-7"
                    onClick={() => {
                      if (!upgradeEligible) return toast.error("You must upload all 4 logbooks before attaching Year 2 Report.");
                      document.getElementById("report-upload-input-2")?.click();
                    }}
                    disabled={uploadReportMutation.isPending || isRenewalLocked}>
                    <Upload className="h-3 w-3 text-gold" /> Upload Year 2
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Not yet eligible message */}
          {!upgradeEligible && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-sm">
              <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-blue-800 dark:text-blue-300 font-sans">
                <strong className="font-semibold">Not yet eligible for upgrade.</strong>{" "}
                You need <strong>4 submitted logbooks</strong> to initiate an upgrade. You currently have {mentorshipProgress?.entriesCount || 0}. Keep logging your progress.
              </div>
            </div>
          )}

          {/* Two upgrade paths — only shown when eligible and not yet requested */}
          {upgradeEligible && !upgradeRequested && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-navy dark:text-zinc-200">Choose your upgrade path:</div>
              <div className="grid gap-3 md:grid-cols-2">

                {/* Path A: Associate (no APC) */}
                <div className="rounded-lg border-2 border-zinc-200 dark:border-zinc-700 p-4 space-y-2 hover:border-navy/50 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="font-semibold text-navy dark:text-zinc-100 text-sm">Associate Membership</div>
                    <div className="text-xs text-muted-foreground font-sans leading-relaxed mt-1">
                      For members not yet ready for APC. You become an <strong>Associate QS / Associate QS Technologist</strong>. Lower annual fee, no board assessment required.
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 font-semibold mt-3"
                    disabled={!hasReport || isRenewalLocked || requestUpgradeMutation.isPending}
                    onClick={() => {
                      if (!hasReport) return toast.error("Please upload both Year 1 and Year 2 Reports first.");
                      requestUpgradeMutation.mutate("Not_Ready");
                    }}
                  >
                    <ArrowUpCircle className="h-4 w-4 text-navy dark:text-zinc-300" /> Apply for Associate
                  </Button>
                </div>

                {/* Path B: Full Professional (with APC) */}
                <div className="rounded-lg border-2 border-gold/40 bg-gold/5 dark:border-gold/20 dark:bg-gold/5 p-4 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="font-semibold text-navy dark:text-zinc-100 text-sm flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-gold" /> Full Professional / Technologist
                    </div>
                    <div className="text-xs text-muted-foreground font-sans leading-relaxed mt-1">
                      Sit for the APC board assessment. If you pass, you become a <strong>Professional QS / QS Technologist</strong> — the highest individual membership tier.
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-1.5 bg-gold text-[#1a1a1a] hover:bg-gold/90 font-bold border-none shadow-sm mt-3"
                    disabled={!hasReport || isRenewalLocked || requestUpgradeMutation.isPending}
                    onClick={() => {
                      if (!hasReport) return toast.error("Please upload both Year 1 and Year 2 Reports first.");
                      requestUpgradeMutation.mutate("Ready");
                    }}
                  >
                    {requestUpgradeMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Requesting...</> : <><ExternalLink className="h-4 w-4" /> Request APC Assessment</>}
                  </Button>
                </div>
              </div>

              {!hasReport && (
                <div className="flex items-start gap-2 p-3 rounded bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-400 font-sans">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Please upload both Annual Reports (Year 1 and Year 2) using the buttons above.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Upgrade already in progress */}
          {upgradeRequested && (
            <div className="flex items-center gap-3 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="text-emerald-800 dark:text-emerald-300 font-sans">
                <strong>Upgrade request submitted!</strong> Your mentorship upgrade is bundled and pending {assignment?.status === 'Pending_Mentor' ? 'Mentor final recommendation' : 'Admin board review'}. Check the APC Assessment History section below for status updates once approved.
              </div>
            </div>
          )}
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
