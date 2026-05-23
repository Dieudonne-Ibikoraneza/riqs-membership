"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
  GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";

function MenteeCard({ mentee, onUploadClick, onDownloadClick, isUploading }: { 
  mentee: any; 
  onUploadClick: (applicationId: string) => void;
  onDownloadClick: (fileId: string, fileName: string) => void;
  isUploading: boolean;
}) {
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

      <div className="flex items-center gap-2 shrink-0">
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
            onClick={() => onUploadClick(mentee.applicationId)}
            disabled={isUploading}
          >
            {isUploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload Recommendation</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Mentorship() {
  const { isMentor, name } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadAppId, setActiveUploadAppId] = useState<string | null>(null);

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
            <Card className="md:col-span-1 border-zinc-200 dark:border-zinc-800 shadow-sm">
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
  const recommendationDoc = docs.find(d => d.documentType === "MentorRecommendation");
  const hasReport = docs.some(d => d.documentType === "AnnualReport");

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
          <Card className="md:col-span-1 border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
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
          <Card className="md:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-navy dark:text-zinc-150 text-base font-bold font-sans">Logbook Competency Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 font-sans">Cost Planning & Estimation</span>
                  <span className="font-semibold text-navy dark:text-gold font-sans">80% complete</span>
                </div>
                <Progress value={80} className="h-2.5 bg-zinc-150 dark:bg-zinc-800" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 font-sans">Contract Administration</span>
                  <span className="font-semibold text-navy dark:text-gold font-sans">55% complete</span>
                </div>
                <Progress value={55} className="h-2.5 bg-zinc-150 dark:bg-zinc-800" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 font-sans">Procurement & Tender Evaluation</span>
                  <span className="font-semibold text-navy dark:text-gold font-sans">40% complete</span>
                </div>
                <Progress value={40} className="h-2.5 bg-zinc-150 dark:bg-zinc-800" />
              </div>
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
                onClick={() => document.getElementById("report-upload-input")?.click()}
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
              className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-bold w-full sm:w-auto transition-transform active:scale-[0.98]"
              onClick={() => {
                if (!hasRecommendation) {
                  toast.error("Your mentor has not uploaded your letter of recommendation yet.", {
                    description: "Your recommendation status must be Approved before requesting an upgrade."
                  });
                } else if (!hasReport) {
                  toast.error("Please upload your annual logbook report first.");
                } else {
                  toast.success("Professional status upgrade request successfully submitted to the RIQS Council!", {
                    description: "You will receive an email notice once your board assessment is scheduled."
                  });
                }
              }}
            >
              Request Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
