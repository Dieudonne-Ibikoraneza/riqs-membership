"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApplicationDetail, submitReviewerAction, submitApproverDecision, verifyPayment } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicantServices } from "@/services/applicant.services";
import { logbookServices, LogbookEntry } from "@/services/logbook.services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PDFViewer from "@/components/ui/pdf-viewer";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Loader2,
  MoveHorizontal,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

function formatMonthYear(val?: string) {
  if (!val) return "";
  if (val.toLowerCase() === "present") return "Present";
  const [y, m] = val.split("-");
  if (!y || !m) return val;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mIdx = parseInt(m, 10) - 1;
  return months[mIdx] ? `${months[mIdx]} ${y}` : val;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Review({ params }: PageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [app, setApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    try {
      const token = localStorage.getItem("riqs.auth.token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.id) setUserId(payload.id);
      }
    } catch (e) {}
  }, []);

  // Fetch document types to resolve human-readable names
  const { data: docTypes = [] } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: applicantServices.getDocumentTypes,
    staleTime: 5 * 60 * 1000,
  });

  const docTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const dt of docTypes) {
      map[dt.code] = dt.name;
      map[dt.name.toLowerCase().replace(/[^a-z0-9]/g, "_")] = dt.name;
    }
    return map;
  }, [docTypes]);

  const formatLabel = (name: string): string => {
    if (!name) return "";
    return name
      .replace(/[-_]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  };

  // Helper to resolve documentType key -> display name
  const resolveDocName = (documentType: string): string => {
    // If the backend already provided a nice name with spaces, use it if it doesn't look like a raw key
    if (documentType.includes(' ') && documentType.charAt(0) === documentType.charAt(0).toUpperCase()) {
       return documentType;
    }

    // Strip suffix (e.g. certificate_2 -> certificate) for lookup
    const baseKey = documentType.replace(/_\d+$/, "");

    if (docTypeMap[documentType]) return docTypeMap[documentType];
    if (docTypeMap[baseKey]) return docTypeMap[baseKey];

    const sanitized = baseKey.toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (docTypeMap[sanitized]) return docTypeMap[sanitized];
    
    return formatLabel(documentType);
  };

  const [activeDoc, setActiveDoc] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [dialog, setDialog] = useState<
    null | "approve" | "reject" | "correction" | "forward" | "failPayment"
  >(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);



  const prevDoc = useRef(activeDoc);
  const [direction, setDirection] = useState(0);

  const toggleFullscreen = (index: number) => {
    const el = document.getElementById(`viewer-container-${index}`);
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);


  useEffect(() => {
    async function loadData() {
      try {
        const [res, apcRes] = await Promise.all([
          getApplicationDetail(id),
          // Fetch APC records for the status banner
          import("@/lib/api/admin").then(m => m.getApcForApplication(id)).catch(() => ({ assessments: [] }))
        ]);
        const mappedApp = {
          id: res.application.id,
          applicantName: res.application.full_name,
          email: res.application.email,
          phone: res.application.phone_number || "Not provided",
          national_id_or_passport: res.application.national_id_or_passport || "Not provided",
          category: res.application.category_name,
          entityType: res.application.cat_entity_type || "Individual",
          firmName: res.application.firm_name,
          firmAddress: res.application.firm_address,
          practiceLocation: res.application.location,
          residencyAddress: res.application.residency_address,
          workAddress: res.application.work_address,
          gender: res.application.gender,
          nationality: res.application.nationality,
          dateOfBirth: res.application.date_of_birth ? new Date(res.application.date_of_birth).toISOString().split('T')[0] : null,
          yearsInProfession: res.application.years_in_profession,
          countryOfOrigin: res.application.country_of_origin,
          studentAssociation: res.studentAssociation,
          competenceSummary: res.application.competenceSummary,
          status: res.application.status.replace("_", " "),
          assignedReviewerId: res.application.assignedReviewerId,
          submittedAt: res.application.submittedAt ? new Date(res.application.submittedAt).toISOString().split('T')[0] : "Unknown",
          processingFeeCleared: res.application.processing_fee_cleared,
          processingFeeTxId: res.application.processing_fee_tx_id,
          processingFeeStatus: res.application.processing_fee_status,
          education: (res.education || []).map((e: any) => ({
            degree: e.qualificationType,
            institution: e.institution,
            startMonthYear: new Date(e.startDate).toISOString().slice(0, 7),
            endMonthYear: e.endDate ? new Date(e.endDate).toISOString().slice(0, 7) : undefined
          })),
          employment: (res.employment || []).map((e: any) => ({
            role: e.jobTitle,
            company: e.companyName,
            from: new Date(e.startDate).toISOString().slice(0, 7),
            to: e.endDate ? new Date(e.endDate).toISOString().slice(0, 7) : undefined
          })),
          mentorship: (res.mentorship || (res.application && res.application.mentorshipAssignment)) ? (() => {
            const mAssignment = res.mentorship || res.application.mentorshipAssignment;
            return {
              id: mAssignment.id,
              mentor: mAssignment.mentorName || (mAssignment.requestedInstitutionalAssignment ? "Requested Institutional Assignment" : "Unassigned"),
              startedAt: new Date(mAssignment.createdAt).toISOString().split('T')[0],
              progress: mAssignment.completedDurationMonths || 0,
              contact: mAssignment.mentorContact || "",
              qualification: mAssignment.mentorQualification || "",
              preferredMentors: mAssignment.preferredMentors || [],
              isSelfAssigned: mAssignment.isSelfAssigned,
              mentorshipPlan: mAssignment.mentorshipPlan,
              preferredPracticeAreas: mAssignment.preferredPracticeAreas || [],
              upgradeRequested: mAssignment.upgradeRequested,
              apcReadiness: mAssignment.apcReadiness,
              status: mAssignment.status,
              yearOneReportUrl: mAssignment.yearOneReportUrl,
              yearTwoReportUrl: mAssignment.yearTwoReportUrl,
              mentorRecommendationUrl: mAssignment.mentorRecommendationUrl
            };
          })() : null,
          shareholders: res.shareholders || [],
          documents: (res.documents || []).map((d: any) => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : '';
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
            return {
              name: d.documentName || d.documentType,
              documentType: d.documentType,
              documentName: d.documentName,
              type: d.documentType.split('_').pop() || "DOC",
              url: `${baseUrl}/files/download/${d.id}?token=${token}`,
              originalFileUrl: d.fileUrl
            };
          }),
          apcAssessments: apcRes.assessments || [],
          statusHistory: res.statusHistory || [],
          logbookEntries: res.logbookEntries || []
        };
        setApp(mappedApp);
      } catch (err) {
        toast.error("Failed to load application details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);
  const verifyPaymentMutation = useMutation({
    mutationFn: ({ txId, action, rejectionReason }: { txId: string; action: "Cleared" | "Failed" | "Refunded", rejectionReason?: string }) =>
      verifyPayment(txId, action, rejectionReason),
    onSuccess: (_, variables) => {
      toast.success("Payment status updated successfully");
      // Update local state directly (data is not in useQuery cache)
      setApp((prev: any) => ({
        ...prev,
        processingFeeCleared: variables.action === "Cleared",
        processingFeeStatus: variables.action,
      }));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update payment status");
    },
  });


  const mentorshipUpgradeMutation = useMutation({
    mutationFn: ({ action, notes }: { action: "Approve" | "Reject", notes?: string }) => {
      if (action === "Approve") {
        return import("@/lib/api/admin").then(m => m.approveMentorshipUpgrade(app?.id, notes));
      } else {
        return import("@/lib/api/admin").then(m => m.flagMentorshipForCorrection(app?.id, notes || "Flagged for correction."));
      }
    },
    onSuccess: (data: any, variables) => {
      if (variables.action === "Approve") {
        // Update local state so buttons disappear immediately
        setApp((prev: any) => ({
          ...prev,
          mentorshipAssignment: prev.mentorshipAssignment ? { ...prev.mentorshipAssignment, status: "Approved" } : prev.mentorshipAssignment
        }));

        if (app?.mentorshipAssignment?.apcReadiness !== "Ready") {
          // Do nothing, awardAssociateMutation handles the success toast for Associate route
        } else {
          toast.success("Mentorship upgrade approved! Redirecting to APC assessment…");
          if (data?.apcAssessmentId) {
            router.push(`/admin/apc/${data.apcAssessmentId}`);
          } else {
            router.push(`/admin/apc`);
          }
        }
      } else {
        toast.success("Mentorship upgrade flagged for correction.");
        setApp((prev: any) => ({
          ...prev,
          mentorship: { ...prev.mentorship, status: "Correction_Required" }
        }));
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to review mentorship upgrade")
  });

  const awardAssociateMutation = useMutation({
    mutationFn: () => import("@/lib/api/admin").then(m => m.awardAssociate(app?.id)),
    onSuccess: (data) => {
      toast.success(data.message || "Associate class awarded successfully.");
      setApp((prev: any) => ({
        ...prev,
        status: "Approved",
        membership_class: data.memberClass,
        membership_id: data.membershipId,
        mentorshipAssignment: prev.mentorshipAssignment ? { ...prev.mentorshipAssignment, status: "Approved" } : prev.mentorshipAssignment
      }));
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to award Associate class")
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center animate-pulse">
        <div className="mx-auto flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-gold border-t-transparent" />
        <h3 className="mt-4 font-bold text-navy text-lg">Loading application...</h3>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-navy">
          Application not found
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          The requested ID does not exist in the candidate records.
        </p>
        <Link
          href="/admin/applications"
          className="text-navy dark:text-gold underline mt-4 inline-block font-semibold"
        >
          Back to queue
        </Link>
      </div>
    );
  }

  const handle = async (action: "approve" | "reject" | "correction" | "forward" | "start_review" | "failPayment") => {
    if (action !== "approve" && action !== "forward" && action !== "start_review" && !note.trim()) {
      return toast.error("Please add a note explaining the reason");
    }

    if (action === "failPayment") {
      setIsSubmitting(true);
      verifyPaymentMutation.mutate(
        { txId: app.processingFeeTxId, action: "Failed", rejectionReason: note },
        {
          onSettled: () => {
            setIsSubmitting(false);
            setDialog(null);
            setNote("");
          }
        }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === "approve" || action === "reject") {
        await submitApproverDecision(app.id, action === "approve" ? "Approve" : "Reject", note);
      } else {
        const actionMap = {
          correction: "ReturnForCorrection",
          forward: "ForwardToApprover",
          start_review: "StartReview"
        } as const;
        await submitReviewerAction(app.id, actionMap[action as keyof typeof actionMap], note);
      }

      const msg =
        action === "approve"
          ? "Application successfully approved"
          : action === "reject"
            ? "Application successfully rejected"
            : action === "forward"
              ? "Application forwarded to Approver"
              : action === "start_review"
                ? "You have taken over this review"
                : "Correction request successfully sent to applicant";

      toast.success(msg);
      
      if (action === "start_review") {
        setApp((prev: any) => ({ ...prev, status: "Under Review" }));
        setIsSubmitting(false);
        return;
      }
      
      if (action === "forward") {
        setApp((prev: any) => ({ ...prev, status: "Pending Approval" }));
        setDialog(null);
        setNote("");
        setIsSubmitting(false);
        return;
      }

      setDialog(null);
      setNote("");

      setTimeout(() => router.push("/admin/applications"), 650);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to process decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Back to queue (mobile only) */}
      <div className="sm:hidden">
        <Link href="/admin/applications">
          <Button
            variant="ghost"
            size="sm"
            className="text-navy dark:text-gold hover:bg-navy/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Queue
          </Button>
        </Link>
      </div>
      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/applications" className="hidden sm:inline-flex">
            <Button
              variant="ghost"
              size="sm"
              className="text-navy dark:text-gold hover:bg-navy/5"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Queue
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-navy">{app.applicantName}</h1>
            <div className="text-xs text-muted-foreground">
              {app.id} · Submitted {app.submittedAt}
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-zinc-200 dark:border-zinc-700"
          >
            {app.status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end justify-center items-center">
          {app.mentorship && (app.mentorship.upgradeRequested || (app.logbookEntries && app.logbookEntries.length > 0)) && (
            <Link href={`/admin/mentorship/${app.id}`}>
              <Button size="default" variant="default" className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm">
                Mentorship Upgrade Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          {app.status === "Pending" && (role === "Reviewer" || role === "Admin") && (
            <Button
              className="bg-navy hover:bg-navy/90 text-white border-none shadow-sm"
              onClick={() => handle("start_review")}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Take Over Review
            </Button>
          )}

          {app.status === "Under Review" && (role === "Admin" || (role === "Reviewer" && app.assignedReviewerId === userId)) && (
            <>
              <Button
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-950/20"
                onClick={() => setDialog("correction")}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Flag correction
              </Button>
              <Button
                className="bg-navy hover:bg-navy/90 text-white border-none"
                onClick={() => setDialog("forward")}
              >
                <Check className="mr-2 h-4 w-4" />
                Forward to Approver
              </Button>
            </>
          )}

          {app.status === "Pending Approval" && (role === "Approver" || role === "Admin") && (
            <>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20"
                onClick={() => setDialog("reject")}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-emerald"
                onClick={() => setDialog("approve")}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left column: Form data */}
        <div className="space-y-4 lg:col-span-2">
          {/* APC Assessments — link to dedicated module */}
          {app.apcAssessments && app.apcAssessments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className={`flex items-center justify-between gap-3 p-3.5 rounded-lg border ${
                app.apcAssessments.some((a: any) => a.status === "Requested")
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50"
                  : app.apcAssessments.some((a: any) => a.status === "Scheduled")
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50"
                    : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50"
              }`}>
                <div className="text-sm">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">APC Status: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {app.apcAssessments[0]?.status?.replace("_", " ")}
                  </span>
                </div>
                <Link href="/admin/apc">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-zinc-300 hover:border-zinc-400 shrink-0">
                    Manage in APC Module
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Payment Clearance */}
          {role === "Admin" && app.processingFeeTxId && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className={`flex items-center justify-between gap-3 p-3.5 rounded-lg border ${
                app.processingFeeCleared
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                  : app.processingFeeStatus === 'Failed'
                    ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50"
                    : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50"
              }`}>
                <div className="text-sm">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">Processing Fee: </span>
                  <span className="text-zinc-600 dark:text-zinc-400 capitalize">
                    {app.processingFeeStatus?.replace(/_/g, " ")}
                  </span>
                </div>
                {(!app.processingFeeCleared && app.processingFeeStatus === 'Pending_Verification') && (
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setNote("");
                        setDialog("failPayment");
                      }}
                      disabled={verifyPaymentMutation.isPending}
                      variant="outline"
                      className="h-7 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/30"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Failed
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => verifyPaymentMutation.mutate({ txId: app.processingFeeTxId, action: "Cleared" })}
                      disabled={verifyPaymentMutation.isPending}
                      className="h-7 text-xs gap-1 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                    >
                      {verifyPaymentMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Mark as Cleared
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Reviewer Notes */}
          {(() => {
            const latestNote = app.statusHistory?.find((h: any) => h.reviewerNotes && !["Approved by Approver.", "Rejected by Approver."].includes(h.reviewerNotes));
            if (!latestNote) return null;
            return (
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader className="py-3 px-4 border-b border-amber-200/50 dark:border-amber-900/50">
                    <CardTitle className="text-sm font-bold text-amber-900 dark:text-amber-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Latest Reviewer Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-400/90 whitespace-pre-wrap leading-relaxed">
                    {latestNote.reviewerNotes}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })()}

          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-zinc-100 dark:border-zinc-800">
              <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold text-navy">
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-sm">
                <Row k="Full name" v={app.applicantName} />
                <Row k="Email" v={app.email} />
                <Row k="Phone" v={app.phone} />
                <Row k="Category" v={app.category} highlight />
                <Row k="Entity" v={app.entityType} />
                {app.entityType !== "Firm" && (
                  <>
                    <Row k="National ID/Passport" v={app.national_id_or_passport} />
                    {app.gender && <Row k="Gender" v={app.gender} />}
                    {app.nationality && <Row k="Nationality" v={app.nationality} />}
                    {app.dateOfBirth && <Row k="Date of Birth" v={app.dateOfBirth} />}
                    {app.yearsInProfession != null && <Row k="Years in Profession" v={`${app.yearsInProfession} years`} />}
                    {app.countryOfOrigin && <Row k="Country of Origin" v={app.countryOfOrigin} />}
                  </>
                )}
                {app.entityType === "Firm" && app.firmName && <Row k="Firm Name" v={app.firmName} />}
                {app.entityType === "Firm" && app.firmAddress && <Row k="Firm Address" v={app.firmAddress} />}
                {app.residencyAddress && [app.residencyAddress.district, app.residencyAddress.sector, app.residencyAddress.cell, app.residencyAddress.village].filter(Boolean).join(", ").length > 0 && <Row k="Residency Address" v={[app.residencyAddress.district, app.residencyAddress.sector, app.residencyAddress.cell, app.residencyAddress.village].filter(Boolean).join(", ")} />}
                {app.workAddress && [app.workAddress.district, app.workAddress.sector, app.workAddress.cell, app.workAddress.village].filter(Boolean).join(", ").length > 0 && <Row k="Work Address" v={[app.workAddress.district, app.workAddress.sector, app.workAddress.cell, app.workAddress.village].filter(Boolean).join(", ")} />}
                <Row k="Practice location" v={app.practiceLocation} />
              </CardContent>
            </Card>
          </motion.div>

          {app.studentAssociation && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-zinc-100 dark:border-zinc-800 bg-blue-50/30 dark:bg-blue-950/10">
                <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold text-navy">
                    Student Association
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5 text-sm">
                  <Row k="Association Name" v={app.studentAssociation.associationName} />
                  <Row k="Membership No" v={app.studentAssociation.membershipNumber} />
                  <Row k="Registration Date" v={app.studentAssociation.registrationDate ? new Date(app.studentAssociation.registrationDate).toISOString().split('T')[0] : ""} />
                  <Row k="Active Years" v={app.studentAssociation.activeYears?.toString()} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {app.competenceSummary && (app.competenceSummary.preContractDuties || app.competenceSummary.postContractDuties || app.competenceSummary.specialization) && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-zinc-100 dark:border-zinc-800 bg-amber-50/30 dark:bg-amber-950/10">
                <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold text-navy">
                    Professional Competence Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-sm">
                  {app.competenceSummary.preContractDuties && (
                    <div>
                      <div className="font-semibold text-xs text-muted-foreground mb-1">Pre-Contract Duties</div>
                      <div className="text-zinc-850 dark:text-zinc-200">{app.competenceSummary.preContractDuties}</div>
                    </div>
                  )}
                  {app.competenceSummary.postContractDuties && (
                    <div>
                      <div className="font-semibold text-xs text-muted-foreground mb-1">Post-Contract Duties</div>
                      <div className="text-zinc-850 dark:text-zinc-200">{app.competenceSummary.postContractDuties}</div>
                    </div>
                  )}
                  {app.competenceSummary.specialization && (
                    <div>
                      <div className="font-semibold text-xs text-muted-foreground mb-1">Specialization & Technical Skills</div>
                      <div className="text-zinc-850 dark:text-zinc-200">{app.competenceSummary.specialization}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {app.entityType === "Individual" && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-zinc-100 dark:border-zinc-800">
                <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold text-navy">
                    Education Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-sm">
                  {app.education.length > 0 ? app.education.map((e: any, i: number) => (
                    <div
                      key={i}
                      className="rounded border border-zinc-100 dark:border-zinc-800 p-2.5 bg-zinc-50/55"
                    >
                      <div className="font-semibold text-zinc-850 dark:text-zinc-200">
                        {e.degree}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {e.institution} ·{" "}
                        {e.startMonthYear ? formatMonthYear(e.startMonthYear) : e.year} — {e.endMonthYear ? formatMonthYear(e.endMonthYear) : "Present"}
                      </div>
                    </div>
                  )) : (
                    <div className="text-muted-foreground italic">No education records provided.</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {app.entityType === "Individual" && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-zinc-100 dark:border-zinc-800">
                <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold text-navy">
                    Employment History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-sm">
                  {app.employment.length > 0 ? app.employment.map((e: any, i: number) => (
                    <div
                      key={i}
                      className="rounded border border-zinc-100 dark:border-zinc-800 p-2.5 bg-zinc-50/55"
                    >
                      <div className="font-semibold text-zinc-850 dark:text-zinc-200">
                        {e.role}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {e.company} · {formatMonthYear(e.from)} —{" "}
                        {formatMonthYear(e.to) || "Present"}
                      </div>
                    </div>
                  )) : (
                    <div className="text-muted-foreground italic">No employment records provided.</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {app.entityType === "Individual" && app.mentorship && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-zinc-100 dark:border-zinc-800">
                <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold text-navy">
                    Mentorship
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-sm">
                  <div className="font-medium">
                    Assigned Mentor:{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {app.mentorship.mentor}
                    </strong>
                  </div>
                  {app.mentorship.contact && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      {app.mentorship.contact}
                    </div>
                  )}
                  {app.mentorship.qualification && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {app.mentorship.qualification}
                    </div>
                  )}
                  {app.mentorship.preferredMentors?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                      <div className="text-xs font-semibold text-navy mb-1.5">Preferred Mentors:</div>
                      <div className="space-y-1.5">
                        {app.mentorship.preferredMentors.map((pm: any, idx: number) => (
                          <div key={idx} className="text-xs flex flex-col">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {idx + 1}. {pm.name || pm.regNumber}
                            </span>
                            {pm.regNumber && <span className="text-muted-foreground ml-3">ID: {pm.regNumber}</span>}
                            {pm.contact && <span className="text-muted-foreground ml-3">Contact: {pm.contact}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {app.mentorship.preferredPracticeAreas?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                      <div className="text-xs font-semibold text-navy mb-1.5">Preferred Practice Areas:</div>
                      <div className="text-xs text-zinc-800 dark:text-zinc-200">
                        {app.mentorship.preferredPracticeAreas.join(", ")}
                      </div>
                    </div>
                  )}
                  {app.mentorship.mentorshipPlan && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                      <div className="text-xs font-semibold text-navy mb-1.5">Mentorship Plan:</div>
                      <div className="text-xs text-zinc-800 dark:text-zinc-200">
                        {app.mentorship.mentorshipPlan}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                    Started {app.mentorship.startedAt} ·{" "}
                    {app.mentorship.progress} months completed
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </div>

        {/* Right column: Document viewer */}
        <div className="lg:col-span-3">
          <Card className="border-zinc-100 dark:border-zinc-800 flex flex-col sticky top-2 h-[calc(100vh-5rem)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-3 px-4 shrink-0">
              <CardTitle className="text-sm font-bold text-navy">
                Documents Workbench
              </CardTitle>
            </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
            <Tabs
              value={String(activeDoc)}
              onValueChange={(v) => {
                const idx = +v;
                const dir =
                  idx === prevDoc.current ? 0 : idx > prevDoc.current ? 1 : -1;
                setDirection(dir);
                setActiveDoc(idx);
                prevDoc.current = idx;
                setZoom(1);
                setRot(0);
              }}
              className="flex-1 flex flex-col"
            >
              <div className="flex flex-col mb-4">
                <div className="flex items-center gap-1.5 px-2 pb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <MoveHorizontal className="w-3.5 h-3.5 opacity-70" />
                  <span>Scroll horizontally to view all submitted documents</span>
                </div>
                <TabsList className="flex w-full h-auto overflow-x-auto justify-start bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {app.documents.map((d: any, i: number) => (
                    <TabsTrigger
                      key={i}
                      value={String(i)}
                      className="shrink-0 text-sm font-semibold px-5 py-2.5 whitespace-nowrap"
                    >
                      {formatLabel(d.documentName || resolveDocName(d.documentType))}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {/* Pre-render all documents so PDFs do not reload when switching tabs */}
              <div className="relative flex-1 mt-0 overflow-hidden">
                {app.documents.map((doc: any, i: number) => {
                  const isActive = activeDoc === i;
                  const xPos = isActive ? "0%" : i < activeDoc ? "-100%" : "100%";
                  
                  return (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{
                        x: xPos,
                        opacity: isActive ? 1 : 0,
                      }}
                      transition={{ duration: 0.32, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ pointerEvents: isActive ? "auto" : "none" }}
                    >
                      <div className="relative flex h-full w-full items-center justify-center overflow-auto rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                        <div className="flex items-center justify-center h-full w-full">
                          {(() => {
                             const url = doc.url;
                             if (!url) {
                               return <div className="text-zinc-500">Document URL missing</div>;
                             }
                             const checkUrl = doc.originalFileUrl || url;
                             const isImage = checkUrl?.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/i) || checkUrl?.startsWith("data:image");
                             return isImage ? (
                                <div id={`viewer-container-${i}`} className="relative w-full h-full bg-white shadow-sm rounded-md overflow-hidden flex flex-col group">
                                  <div className="flex-1 w-full h-full flex items-center justify-center overflow-auto p-4">
                                    <img 
                                      src={url} 
                                      alt={doc.name} 
                                      className="max-w-full max-h-full object-contain" 
                                      style={{
                                        transform: `scale(${zoom}) rotate(${rot}deg)`,
                                        transition: "transform 0.15s ease-out",
                                        transformOrigin: "center center"
                                      }}
                                    />
                                  </div>
                                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}><ZoomOut className="h-4 w-4 text-zinc-700 dark:text-zinc-300" /></Button>
                                    <span className="text-xs w-12 text-center font-semibold text-zinc-700 dark:text-zinc-300">{Math.round(zoom * 100)}%</span>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setZoom((z) => Math.min(3, z + 0.1))}><ZoomIn className="h-4 w-4 text-zinc-700 dark:text-zinc-300" /></Button>
                                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setRot((r) => (r - 90) % 360)}><RotateCcw className="h-4 w-4 text-zinc-700 dark:text-zinc-300" /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setRot((r) => (r + 90) % 360)}><RotateCw className="h-4 w-4 text-zinc-700 dark:text-zinc-300" /></Button>
                                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => toggleFullscreen(i)}>
                                      {isFullscreen ? <Minimize2 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" /> : <Maximize2 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />}
                                    </Button>
                                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => {
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = doc.name;
                                      a.click();
                                      toast.success("Image downloaded");
                                    }}><Download className="h-4 w-4 text-zinc-700 dark:text-zinc-300" /></Button>
                                  </div>
                                </div>
                             ) : (
                                <PDFViewer src={url} fileName={doc.name + ".pdf"} />
                             );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Tabs>
          </CardContent>
        </Card>
        </div>
      </div>



      {/* Dynamic Action Modals */}
      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "approve" && "Confirm approval"}
              {dialog === "reject" && "Confirm rejection"}
              {dialog === "correction" && "Request corrections"}
              {dialog === "forward" && "Forward to Approver"}
              {dialog === "failPayment" && "Mark Payment as Failed"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm py-2">
            <p className="text-muted-foreground leading-relaxed">
              {dialog === "approve" &&
                "A new membership certificate, practicing license, and membership ID will be generated and dispatched automatically."}
              {dialog === "reject" &&
                "An administrative reason is required and will be sent directly to the candidate."}
              {dialog === "correction" &&
                "Specify the files or descriptions requiring update. The registration process will be suspended until complete."}
              {dialog === "forward" &&
                "The application will be sent to the Approver queue for final decision. You may include an optional note."}
              {dialog === "failPayment" &&
                "A rejection reason is mandatory when failing or refunding a payment. This will be visible to the applicant."}
            </p>
            <Textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                (dialog === "approve" || dialog === "forward")
                  ? "Add an optional note (e.g. well qualified candidate)"
                  : "Please provide a reason for the applicant..."
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handle(dialog!)}
              disabled={isSubmitting}
              className={
                dialog === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : dialog === "reject" || dialog === "correction" || dialog === "failPayment"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-navy hover:bg-navy/90 text-white"
              }
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {dialog === "approve" && "Approve Applicant"}
              {dialog === "reject" && "Reject Applicant"}
              {dialog === "correction" && "Request Corrections"}
              {dialog === "forward" && "Forward Application"}
              {dialog === "failPayment" && "Mark as Failed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function Row({
  k,
  v,
  highlight,
}: {
  k: string;
  v: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded px-2.5 py-1.5 transition-all gap-6 ${highlight ? "bg-gold/15 text-[#1a1a1a] font-semibold" : ""}`}
    >
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{v}</span>
    </div>
  );
}
