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
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PDFViewer from "@/components/ui/pdf-viewer";
import ImageViewer from "@/components/ui/image-viewer";
import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import { logbookServices, LogbookEntry } from "@/services/logbook.services";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";



export default function Mentorship() {
  const { isMentor } = useAuth();
  const queryClient = useQueryClient();

  // Logbook form state
  const [selectedLogbookFile, setSelectedLogbookFile] = useState<File | null>(null);
  const [collapsedDocs, setCollapsedDocs] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'year1' | 'year2'>('year1');
  const [reportUploadProgress, setReportUploadProgress] = useState<{ year: "1" | "2" | null, progress: number }>({ year: null, progress: 0 });


  // 2. Fetch profile data (Graduate scope)
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: queryKeys.applicant.profile(),
    queryFn: applicantServices.getProfile,
  });

  // 2b. Fetch APC status
  const { data: apcData, isLoading: isApcLoading } = useQuery({
    queryKey: ["apcStatus"],
    queryFn: applicantServices.getApcStatus,
  });

  // 2c. Fetch Mentorship Progress (Logbooks + Assignment)
  const { data: mentorshipProgress, isLoading: isLogbookLoading } = useQuery({
    queryKey: ["mentorshipProgress", profileData?.application?.id],
    queryFn: () => logbookServices.getMentorshipProgress(profileData!.application!.id),
    enabled: !!profileData?.application?.id
  });

  const isAssociate = profileData?.profile?.membershipClass === "Associate" || profileData?.application?.category_name?.includes("Associate");
  const isFullyUpgraded = ["Professional", "Fellow", "Technologist"].includes(profileData?.profile?.membershipClass || "");

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
      
      setReportUploadProgress({ year, progress: 0 });
      
      return logbookServices.uploadAnnualReport(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setReportUploadProgress({ year, progress: percentCompleted });
        }
      });
    },
    onSuccess: (_, variables) => {
      toast.success(`Year ${variables.year} Report uploaded successfully!`);
      queryClient.invalidateQueries({ queryKey: ["mentorshipProgress"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to upload annual report.");
    },
    onSettled: () => {
      setTimeout(() => setReportUploadProgress({ year: null, progress: 0 }), 1000);
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
      setSelectedLogbookFile(null);
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



  // ================= GRADUATE / MENTEE PROGRESSION VIEW =================
  const mentorship = profileData?.mentorship;
  const assignment = mentorshipProgress?.assignment;
  const hasYear1Report = !!assignment?.yearOneReportUrl;
  const hasYear2Report = !!assignment?.yearTwoReportUrl;
  const hasReport = hasYear1Report && hasYear2Report;
  const approvedAt = profileData?.application?.approvedAt;
  const financialTransactions = profileData?.financialTransactions || [];

  const renewalCleared = financialTransactions.some(
    (tx: any) => tx.txType === 'Annual_Renewal' && tx.status === 'Paid'
  );

  const monthsElapsed = approvedAt
    ? Math.floor((Date.now() - new Date(approvedAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : 0;

  const renewalDue = monthsElapsed >= 12;
  const isRenewalLocked = renewalDue && !renewalCleared;

  const logbookComplete = (mentorshipProgress?.entriesCount || 0) >= 2;
  const logbookPercentage = Math.min(100, (mentorshipProgress?.entriesCount || 0) * 50);
  const twoYearsElapsed = monthsElapsed >= 24;
  const monthsToGo = Math.max(0, 24 - monthsElapsed);
  const upgradeEligible = logbookComplete;
  const upgradeRequested = assignment?.upgradeRequested;

  const hasActiveApc = apcData?.assessments?.some(
    (a: any) => a.status === "Requested" || a.status === "Scheduled"
  );

  // The logbook/report progress query only starts once the profile query
  // resolves and hands it an applicationId — treat the page as still
  // loading until that chained fetch completes too, otherwise the report
  // and logbook sections briefly render as "not submitted yet" before the
  // real data arrives.
  const isPageLoading = isProfileLoading || (!!profileData?.application?.id && isLogbookLoading);

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

      {isPageLoading ? (
        <div className="grid gap-4 animate-pulse">
          <Card className="h-24 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
          <Card className="h-40 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
          <Card className="h-56 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Banner: Assigned Mentor details */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              {mentorship?.mentorName ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-navy text-white flex items-center justify-center font-bold text-lg">
                      {mentorship.mentorName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-navy dark:text-zinc-100 flex items-center gap-2">
                        {mentorship.mentorName}
                        <Badge variant="outline" className="text-[10px] font-normal bg-zinc-50 dark:bg-zinc-900">
                          Your Mentor
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-sans">
                        {mentorship.mentorQualification || "PQS"}
                        {mentorship.mentorEmployer ? ` • ${mentorship.mentorEmployer}` : ""}
                      </div>
                    </div>
                  </div>
                  
                  {mentorship.mentorContact && (
                    <div className="flex flex-col sm:items-end text-xs text-muted-foreground space-y-1 font-sans border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 pt-3 sm:pt-0 sm:pl-4">
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gold shrink-0" /> {mentorship.mentorContact}</span>
                      {mentorship.mentorRegistrationNumber && (
                        <div className="font-semibold text-navy dark:text-gold">
                          REG: #{mentorship.mentorRegistrationNumber}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-yellow-200/60 dark:border-yellow-900/30 p-4 bg-yellow-50/30 dark:bg-yellow-950/10 text-yellow-800 dark:text-yellow-400 text-sm leading-relaxed flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Mentor Assignment Pending</strong>
                    <p className="mt-1 text-xs">The institutional review board is currently matching your credentials to auto-assign a certified mentor. Once your application is fully cleared, your mentor assignment will update here.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logbooks Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-navy dark:text-zinc-150 font-sans flex items-center gap-2">
              <FileText className="h-5 w-5 text-gold" /> Logbook Submissions
            </h2>
            
            <div className="flex flex-col gap-4 w-full">
              {/* Existing Submissions */}
              {mentorshipProgress?.entries?.map((entry: any, index: number) => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : '';
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
                
                // Construct secure URL or use image directly if not a document
                const isImage = entry.documentUrl?.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/i);
                const fileUrl = entry.documentUrl ? `${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(entry.documentUrl)}&token=${token}` : null;
                const isCollapsed = collapsedDocs[entry.id] ?? index !== ((mentorshipProgress?.entries?.length || 0) - 1);
                
                return (
                 <div key={entry.id} className="relative border border-dashed border-zinc-300 dark:border-zinc-700 rounded-sm p-4 bg-white dark:bg-zinc-950 transition-all w-full shadow-sm">
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                           className="w-10 h-10 flex items-center justify-center bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-sm shrink-0 cursor-pointer" 
                           onClick={() => setCollapsedDocs(prev => ({ ...prev, [entry.id]: !isCollapsed }))}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="select-none flex-1 min-w-0 cursor-pointer" onClick={() => setCollapsedDocs(prev => ({ ...prev, [entry.id]: !isCollapsed }))}>
                          <p className="text-sm font-semibold text-navy dark:text-zinc-100 flex items-center gap-1">
                            <span className="truncate">{entry.period}</span>
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 truncate">
                            Successfully uploaded on {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setCollapsedDocs(prev => ({ ...prev, [entry.id]: !isCollapsed }))} className="text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 hidden sm:flex">
                          {isCollapsed ? <><ChevronDown className="h-4 w-4 mr-1" /> Expand</> : <><ChevronUp className="h-4 w-4 mr-1" /> Collapse</>}
                        </Button>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="w-full h-[450px] border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-zinc-50 dark:bg-zinc-900 relative mt-2 flex items-center justify-center">
                             {fileUrl ? (
                                 isImage ? (
                                     <ImageViewer src={fileUrl} alt="Document" fileName={`logbook_${index + 1}.png`} />
                                 ) : (
                                     <PDFViewer 
                                        src={fileUrl} 
                                        thumbnailMode={false} 
                                        fileName={`${entry.period} • Submitted on ${new Date(entry.createdAt).toLocaleDateString()}`}
                                     />
                                 )
                             ) : (
                                 <div className="text-center text-zinc-400 dark:text-zinc-500 py-20">
                                     <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                     <p className="text-sm">No document provided</p>
                                 </div>
                             )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                 </div>
              )})}

              {/* Dynamic Uploader Card */}
              {!upgradeRequested && (mentorshipProgress?.entriesCount || 0) < 2 && (
                <div 
                  className={cn(
                    "relative group rounded-xl border-2 border-dashed transition-all w-full flex flex-col justify-center items-center py-12 px-6 cursor-pointer overflow-hidden",
                    isRenewalLocked ? "opacity-50 pointer-events-none bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" : 
                    isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]" : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 hover:border-gold hover:bg-gold/5 dark:hover:bg-gold/5"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isRenewalLocked && !submitLogbookMutation.isPending) {
                      setIsDragging(true);
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (isRenewalLocked || submitLogbookMutation.isPending) return;
                    
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    setSelectedLogbookFile(file);
                    
                    const periodName = 
                      (mentorshipProgress?.entriesCount || 0) === 0 ? "Year 1" : "Year 2";
                    
                    submitLogbookMutation.mutate({
                      file: file,
                      period: periodName,
                      appId: profileData!.application!.id
                    });
                  }}
                >
                  <input 
                    type="file" 
                    accept=".pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSelectedLogbookFile(file);
                      
                      const periodName = 
                        (mentorshipProgress?.entriesCount || 0) === 0 ? "Year 1" : "Year 2";
                      
                      submitLogbookMutation.mutate({
                        file: file,
                        period: periodName,
                        appId: profileData!.application!.id
                      });
                    }}
                    disabled={isRenewalLocked || submitLogbookMutation.isPending}
                  />

                  {!selectedLogbookFile ? (
                    <>
                      <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-8 w-8" />
                      </div>
                      <h3 className="font-bold text-lg text-navy dark:text-zinc-100 mb-2">
                        Submit {
                          (mentorshipProgress?.entriesCount || 0) === 0 ? "Year 1" : "Year 2"
                        } Logbook
                      </h3>
                      <p className="text-sm text-muted-foreground font-sans text-center max-w-sm">
                        Click to browse or drag and drop your compiled PDF report here.
                      </p>
                    </>
                  ) : (
                    <div className="w-full max-w-md flex flex-col items-center relative z-20">
                      {submitLogbookMutation.isPending ? (
                        <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl shadow-sm w-full relative overflow-hidden">
                          <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-800/30 animate-pulse"></div>
                          <div className="h-12 w-12 rounded-lg bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 relative z-10 shadow-inner">
                            <FileText className="h-6 w-6 animate-bounce" />
                          </div>
                          <div className="flex-1 min-w-0 relative z-10">
                            <p className="text-sm font-bold truncate text-navy dark:text-zinc-100 mb-1">{selectedLogbookFile.name}</p>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                              <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold tracking-wide">
                                Uploading securely...
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm w-full">
                          <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-navy dark:text-zinc-100">{selectedLogbookFile.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-sans">
                              {(selectedLogbookFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 rounded-full" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedLogbookFile(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
        <CardContent className="p-6">
          {/* Timeline & eligibility status */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch text-sm">
            <div className="w-full lg:w-1/4 flex flex-col gap-4">
              <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-5 bg-white/80 dark:bg-zinc-900/60 flex flex-col justify-center space-y-1.5 shadow-sm">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Time in Programme</div>
                <div className="font-bold text-2xl text-navy dark:text-zinc-100">{monthsElapsed} <span className="text-sm font-normal text-muted-foreground">months</span></div>
                <div className="text-xs text-muted-foreground font-sans flex items-center">
                  {twoYearsElapsed ? (
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" /><span className="text-emerald-700 dark:text-emerald-400 font-medium">2-year requirement met</span></div>
                  ) : (
                    `${monthsToGo} months remaining`
                  )}
                </div>
              </div>
              
              <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-5 bg-white/80 dark:bg-zinc-900/60 flex flex-col justify-center space-y-1.5 shadow-sm">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Logbook Completion</div>
                <div className="font-bold text-2xl text-navy dark:text-zinc-100">{logbookPercentage}<span className="text-sm font-normal text-muted-foreground">%</span></div>
                <div className="text-xs text-muted-foreground font-sans flex items-center">
                  {logbookComplete ? (
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" /><span className="text-emerald-700 dark:text-emerald-400 font-medium">2 Logbooks uploaded</span></div>
                  ) : (
                    `${100 - logbookPercentage}% still needed`
                  )}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-3/4 rounded-lg border border-zinc-100 dark:border-zinc-800 p-6 bg-white/80 dark:bg-zinc-900/60 flex flex-col shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                <div className="flex gap-6">
                  <button 
                    onClick={() => setActiveReportTab('year1')}
                    className={cn("text-xs font-bold uppercase tracking-wider pb-3 -mb-[13px] border-b-2 transition-all cursor-pointer", activeReportTab === 'year1' ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-navy dark:hover:text-zinc-200")}
                  >
                    Year 1 Report
                  </button>
                  {hasYear1Report && (
                    <button 
                      onClick={() => setActiveReportTab('year2')}
                      className={cn("text-xs font-bold uppercase tracking-wider pb-3 -mb-[13px] border-b-2 transition-all cursor-pointer", activeReportTab === 'year2' ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-navy dark:hover:text-zinc-200")}
                    >
                      Year 2 Report
                    </button>
                  )}
                </div>
                <span className={cn("font-bold text-xs flex items-center gap-1.5", 
                  (activeReportTab === 'year1' ? hasYear1Report : hasYear2Report) ? "text-emerald-600" : "text-gold")}>
                  {(activeReportTab === 'year1' ? hasYear1Report : hasYear2Report) ? <><CheckCircle2 className="h-4 w-4" /> Uploaded</> : <><Clock className="h-4 w-4" /> Pending</>}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col justify-center min-h-[300px]">
                {(() => {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : '';
                  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
                  const isYear1Image = assignment?.yearOneReportUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i) !== null;
                  const isYear2Image = assignment?.yearTwoReportUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i) !== null;
                  
                  return (
                    <>
                      {/* Year 1 Tab Content */}
                      <div className={activeReportTab === 'year1' ? "block h-[500px] w-full" : "hidden"}>
                        {hasYear1Report ? (
                          <div className="h-[500px] w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50">
                            {isYear1Image ? (
                              <ImageViewer src={`${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(assignment?.yearOneReportUrl)}&token=${token}`} alt="Year 1 Report" fileName="Year_1_Report.png" />
                            ) : (
                              <PDFViewer 
                                  src={`${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(assignment?.yearOneReportUrl)}&token=${token}`} 
                                  thumbnailMode={false} 
                                  className="h-[500px] w-full"
                              />
                            )}
                          </div>
                        ) : reportUploadProgress.year === '1' ? (
                          <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-zinc-50 dark:bg-zinc-900/50 h-[500px]">
                            <div className="w-full max-w-sm space-y-4">
                              <div className="flex justify-between items-center text-sm font-semibold text-navy dark:text-zinc-200">
                                <span>Upload progress</span>
                                <span>{reportUploadProgress.progress}%</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-navy dark:bg-gold transition-all duration-300"
                                  style={{ width: `${reportUploadProgress.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-gold transition-all h-[500px]"
                            onClick={() => {
                              if ((mentorshipProgress?.entriesCount || 0) < 1) return toast.error("Upload Year 1 logbook before attaching Year 1 Report.");
                              document.getElementById("report-upload-input-1")?.click();
                            }}
                          >
                            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                              <Upload className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-navy dark:text-zinc-200">Upload Year 1 Report</p>
                            <p className="text-xs text-muted-foreground mt-1">Click to browse or drag and drop</p>
                          </div>
                        )}
                      </div>

                      {/* Year 2 Tab Content */}
                      <div className={activeReportTab === 'year2' ? "block h-[500px] w-full" : "hidden"}>
                        {hasYear2Report ? (
                          <div className="h-[500px] w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50">
                            {isYear2Image ? (
                              <ImageViewer src={`${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(assignment?.yearTwoReportUrl)}&token=${token}`} alt="Year 2 Report" fileName="Year_2_Report.png" />
                            ) : (
                              <PDFViewer 
                                  src={`${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(assignment?.yearTwoReportUrl)}&token=${token}`} 
                                  thumbnailMode={false} 
                                  className="h-[500px] w-full"
                              />
                            )}
                          </div>
                        ) : reportUploadProgress.year === '2' ? (
                          <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-zinc-50 dark:bg-zinc-900/50 h-[500px]">
                            <div className="w-full max-w-sm space-y-4">
                              <div className="flex justify-between items-center text-sm font-semibold text-navy dark:text-zinc-200">
                                <span>Upload progress</span>
                                <span>{reportUploadProgress.progress}%</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-navy dark:bg-gold transition-all duration-300"
                                  style={{ width: `${reportUploadProgress.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-gold transition-all h-[500px]"
                            onClick={() => {
                              if (!upgradeEligible) return toast.error("You must upload both logbooks before attaching Year 2 Report.");
                              document.getElementById("report-upload-input-2")?.click();
                            }}
                          >
                            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                              <Upload className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-navy dark:text-zinc-200">Upload Year 2 Report</p>
                            <p className="text-xs text-muted-foreground mt-1">Click to browse or drag and drop</p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Not yet eligible message */}
          {!isFullyUpgraded && !upgradeEligible && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-sm mt-5">
              <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-blue-800 dark:text-blue-300 font-sans">
                <strong className="font-semibold">Not yet eligible for upgrade.</strong>{" "}
                You need <strong>2 submitted logbooks</strong> to initiate an upgrade. You currently have {mentorshipProgress?.entriesCount || 0}. Keep logging your progress.
              </div>
            </div>
          )}

          {/* Two upgrade paths — only shown when eligible and not yet requested */}
          {!isFullyUpgraded && upgradeEligible && (!upgradeRequested || assignment?.status === 'Approved' || assignment?.status === 'Correction_Required') && (
            <div className="space-y-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-zinc-100">Ready to Upgrade?</h3>
                <p className="text-sm text-muted-foreground mt-1">You have met the requirements. Choose your next membership path below.</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 mt-4">

                {/* Path A: Associate (no APC) */}
                {!isAssociate && (
                <div className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1 h-full bg-zinc-300 dark:bg-zinc-700 transition-all group-hover:w-1.5"></div>
                  <div className="p-6 pl-8">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-600 dark:text-zinc-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="font-bold text-navy dark:text-zinc-100 text-lg">Associate Membership</div>
                    <div className="text-sm text-muted-foreground font-sans leading-relaxed mt-2">
                      For members not yet ready for APC. You become an <strong className="text-navy dark:text-zinc-200">Associate QS / Associate QS Technologist</strong>. Lower annual fee, no board assessment required.
                    </div>
                  </div>
                  <div className="p-6 pt-0 pl-8">
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold group-hover:border-zinc-300 transition-colors"
                      disabled={!hasReport || isRenewalLocked || requestUpgradeMutation.isPending}
                      onClick={() => {
                        if (!hasReport) return toast.error("Please upload both Year 1 and Year 2 Reports first.");
                        requestUpgradeMutation.mutate("Not_Ready");
                      }}
                    >
                      <ArrowUpCircle className="h-4 w-4 text-navy dark:text-zinc-300" /> Apply for Associate
                    </Button>
                  </div>
                </div>
                )}

                {/* Path B: Full Professional (with APC) */}
                <div className="group relative rounded-xl border border-gold/30 bg-gradient-to-b from-gold/5 to-transparent dark:from-gold/10 dark:to-zinc-900/50 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md hover:border-gold/60 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold to-yellow-600 opacity-80"></div>
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-gold/10 rounded-full blur-2xl group-hover:bg-gold/20 transition-all"></div>
                  <div className="p-6 relative">
                    <div className="h-10 w-10 rounded-full bg-gold/20 dark:bg-gold/20 flex items-center justify-center mb-4 text-gold dark:text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="font-bold text-navy dark:text-zinc-100 text-lg flex items-center gap-2">
                      Full Professional
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-gold text-[#1a1a1a] px-2 py-0.5 rounded-full">Recommended</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-sans leading-relaxed mt-2">
                      Sit for the APC board assessment. If you pass, you become a <strong className="text-navy dark:text-zinc-200">Professional QS / QS Technologist</strong> — the highest individual membership tier.
                    </div>
                  </div>
                  <div className="p-6 pt-0 relative">
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-gold to-yellow-600 text-[#1a1a1a] hover:from-yellow-500 hover:to-gold font-bold shadow-md hover:shadow-lg transition-all border-none"
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
          {!isFullyUpgraded && upgradeRequested && assignment?.status !== 'Approved' && (
            <div className="flex items-center gap-3 mt-4 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="text-emerald-800 dark:text-emerald-300 font-sans">
                <strong>{assignment?.status === 'Correction_Required' ? 'Corrections requested.' : 'Upgrade request submitted!'}</strong> Your mentorship upgrade is {assignment?.status === 'Correction_Required' ? 'ready to be resubmitted after you address the review notes.' : `pending ${assignment?.status === 'Pending_Mentor' ? 'Mentor final recommendation' : assignment?.status === 'Pending_Reviewer_Board' ? 'Reviewer Board review' : 'Admin board review'}.`} Check the APC Assessment History section below for status updates once approved.
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
                      {apc.assessmentPeriodStart ? (() => {
                        const start = new Date(apc.assessmentPeriodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                        if (apc.assessmentPeriodEnd) {
                          const end = new Date(apc.assessmentPeriodEnd).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                          return `${start} – ${end}`;
                        }
                        return start;
                      })() : "Pending Schedule"}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">

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
