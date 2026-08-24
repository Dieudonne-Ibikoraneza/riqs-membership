"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApplicationDetail, submitReviewerAction, submitApproverDecision, verifyPayment, submitMentorshipReview, forwardMentorshipToApprover } from "@/lib/api/admin";
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
import { Label } from "@/components/ui/label";
import { MonthYearPicker } from "@/components/ui/month-picker";
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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("riqs.auth.token");
    if (!token) return;
    try {
      setUserId(JSON.parse(atob(token.split(".")[1])).id || null);
    } catch {
      setUserId(null);
    }
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
    null | "approve" | "reject" | "correction" | "forward"
  >(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [boardNotes, setBoardNotes] = useState("");
  const [reviewPeriodStart, setReviewPeriodStart] = useState("");
  const [reviewPeriodEnd, setReviewPeriodEnd] = useState("");
  const [agreedReviewPeriodStart, setAgreedReviewPeriodStart] = useState("");
  const [agreedReviewPeriodEnd, setAgreedReviewPeriodEnd] = useState("");
  const [isForwardPeriodDialogOpen, setIsForwardPeriodDialogOpen] = useState(false);
  const [isUpgradeApprovalDialogOpen, setIsUpgradeApprovalDialogOpen] = useState(false);

  const hasSubmittedBoardReview = Boolean(
    userId && app?.mentorshipReviews?.some((review: any) => review.reviewerId === userId)
  );
  const canEditForwardingNote = role === "Head_Reviewer" || !hasSubmittedBoardReview;



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
              mentorRecommendationUrl: mAssignment.mentorRecommendationUrl,
              mentorRecommended: mAssignment.mentorRecommended,
              mentorNotes: mAssignment.mentorNotes,
              agreedReviewPeriodStart: mAssignment.agreedReviewPeriodStart,
              agreedReviewPeriodEnd: mAssignment.agreedReviewPeriodEnd
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
          logbookEntries: res.logbookEntries || [],
          mentorshipReviews: res.mentorshipReviews || []
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
    mutationFn: ({ txId, action }: { txId: string; action: "Paid" | "Failed" | "Refunded" }) =>
      verifyPayment(txId, action),
    onSuccess: (_, variables) => {
      toast.success("Payment status updated successfully");
      // Update local state directly (data is not in useQuery cache)
      setApp((prev: any) => ({
        ...prev,
        processingFeeCleared: variables.action === "Paid",
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
          mentorship: prev.mentorship ? { ...prev.mentorship, status: "Approved" } : prev.mentorship
        }));

        if (app?.mentorship?.apcReadiness !== "Ready") {
          // Do nothing, awardAssociateMutation handles the success toast for Associate route
        } else {
          toast.success("Mentorship upgrade approved! Redirecting to APC assessment…");
          // Navigate to the APC detail page for this candidate
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

  const mentorshipBoardReviewMutation = useMutation({
    mutationFn: () => submitMentorshipReview({
      applicationId: app.id,
      notes: boardNotes,
      reviewPeriodStart,
      reviewPeriodEnd: reviewPeriodEnd || undefined,
    }),
    onSuccess: (data) => {
      toast.success("Reviewer-board recommendation saved.");
      setBoardNotes("");
      setReviewPeriodStart("");
      setReviewPeriodEnd("");
      const newReview = {
        id: data.review.id,
        reviewerId: userId,
        reviewer: { fullName: data.review.reviewer?.fullName || "You" },
        reviewPeriodStart: data.review.reviewPeriodStart,
        reviewPeriodEnd: data.review.reviewPeriodEnd,
        notes: data.review.notes
      };
      setApp((prev: any) => ({
        ...prev,
        mentorshipReviews: [...(prev.mentorshipReviews || []), newReview]
      }));
      queryClient.invalidateQueries({ queryKey: ["application", id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to save reviewer-board recommendation.")
  });

  const forwardMentorshipMutation = useMutation({
    mutationFn: () => forwardMentorshipToApprover(
      app.id,
      boardNotes.trim() || "Forwarded by Head Reviewer after completion of the reviewer-board submissions.",
      agreedReviewPeriodStart,
      agreedReviewPeriodEnd || undefined
    ),
    onSuccess: () => {
      toast.success("Mentorship upgrade forwarded to Admin/Approver.");
      setApp((prev: any) => ({ ...prev, mentorship: { ...prev.mentorship, status: "Pending_Admin_Review" } }));
      setBoardNotes("");
      setIsForwardPeriodDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Unable to forward mentorship upgrade.")
  });

  const awardAssociateMutation = useMutation({
    mutationFn: () => import("@/lib/api/admin").then(m => m.awardAssociate(app?.id)),
    onSuccess: (data) => {
      toast.success(data.message || "Associate class approved. Membership ID will be issued once the first-year fee is paid.");
      setApp((prev: any) => ({
        ...prev,
        status: "Approved",
        mentorship: prev.mentorship ? { ...prev.mentorship, status: "Approved" } : prev.mentorship
      }));
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to approve Associate class")
  });

  const executeUpgradeApproval = () => {
    if (app.mentorship?.apcReadiness !== "Ready") {
      mentorshipUpgradeMutation.mutateAsync({ action: "Approve" }).then(() => {
        awardAssociateMutation.mutate();
      });
    } else {
      mentorshipUpgradeMutation.mutate({ action: "Approve" });
    }
  };

  const handleUpgradeApproval = () => {
    setIsUpgradeApprovalDialogOpen(true);
  };

  const handleUpgradeCorrection = () => {
    const notes = window.prompt("Reason for returning for correction:");
    if (notes) mentorshipUpgradeMutation.mutate({ action: "Reject", notes });
  };

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
          href="/admin/mentorship"
          className="inline-flex items-center text-sm font-medium text-navy hover:text-navy/80 dark:text-gold dark:hover:text-gold/80 transition-colors"
        >
          Back to queue
        </Link>
      </div>
    );
  }

  const handle = async (action: "approve" | "reject" | "correction" | "forward") => {
    if (action !== "approve" && action !== "forward" && !note.trim()) {
      return toast.error("Please add a note explaining the reason");
    }

    setIsSubmitting(true);
    try {
      if (action === "approve" || action === "reject") {
        await submitApproverDecision(app.id, action === "approve" ? "Approve" : "Reject", note);
      } else {
        const actionMap = {
          correction: "ReturnForCorrection",
          forward: "ForwardToApprover"
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
              : "Correction request successfully sent to applicant";

      toast.success(msg);
      
      if (action === "forward") {
        setApp((prev: any) => ({ ...prev, status: "Pending Approval" }));
        setDialog(null);
        setNote("");
        setIsSubmitting(false);
        return;
      }

      setDialog(null);
      setNote("");

      setTimeout(() => router.push("/admin/mentorship"), 650);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to process decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mentorshipDocuments: any[] = [];
  const token = typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : '';
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  if (app?.logbookEntries) {
    app.logbookEntries.forEach((entry: any) => {
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
  if (app?.mentorship?.yearOneReportUrl) {
    mentorshipDocuments.push({
      name: 'Year 1 Annual Report',
      url: `${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(app.mentorship.yearOneReportUrl)}&token=${token}`,
      originalFileUrl: app.mentorship.yearOneReportUrl,
      documentType: 'Annual_Report'
    });
  }
  if (app?.mentorship?.yearTwoReportUrl) {
    mentorshipDocuments.push({
      name: 'Year 2 Annual Report',
      url: `${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(app.mentorship.yearTwoReportUrl)}&token=${token}`,
      originalFileUrl: app.mentorship.yearTwoReportUrl,
      documentType: 'Annual_Report'
    });
  }
  if (app?.mentorship?.mentorRecommendationUrl) {
    mentorshipDocuments.push({
      name: 'Mentor Recommendation Letter',
      url: `${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(app.mentorship.mentorRecommendationUrl)}&token=${token}`,
      originalFileUrl: app.mentorship.mentorRecommendationUrl,
      documentType: 'Recommendation'
    });
  }

  const displayDocs = mentorshipDocuments.length > 0 ? mentorshipDocuments : (app?.documents || []);

  return (
    <div className="space-y-4 font-sans">
      {/* Back to queue (mobile only) */}
      <div className="sm:hidden mb-4">
        <Link href="/admin/mentorship">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground hover:text-navy dark:hover:text-gold hover:bg-navy/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Queue
          </Button>
        </Link>
      </div>
      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/mentorship" className="hidden sm:inline-flex">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-2 mb-2 text-muted-foreground hover:text-navy dark:hover:text-gold hover:bg-navy/5"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Queue
            </Button>
          </Link>
          <div className="hidden sm:block w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
          <div>
            <h1 className="text-xl font-bold text-navy">{app.applicantName}</h1>
            <div className="text-xs text-muted-foreground">
              {app.id} · Submitted {app.submittedAt}
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400 ml-2"
          >
            Mentorship Upgrade
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/applications/${app.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="text-navy dark:text-gold hover:bg-navy/5 border-zinc-200 dark:border-zinc-700 shadow-sm"
            >
              Full Application <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          {app.mentorship?.status === "Pending_Admin_Review" && (role === "Admin" || role === "Approver") && (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleUpgradeApproval}
                disabled={mentorshipUpgradeMutation.isPending || awardAssociateMutation.isPending}
              >
                <Check className="mr-2 h-4 w-4" />
                {app.mentorship.apcReadiness === "Ready" ? "Approve & Move to APC" : "Approve & Award Associate"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/30"
                onClick={handleUpgradeCorrection}
                disabled={mentorshipUpgradeMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" /> Flag for Correction
              </Button>
            </>
          )}
          {role === "Head_Reviewer" && app.mentorship?.apcReadiness === "Ready" && app.mentorship?.status === "Pending_Reviewer_Board" && (app.mentorshipReviews?.length || 0) >= 3 && (
            <Button
              size="sm"
              className="bg-navy text-white hover:bg-navy/90"
              onClick={() => setIsForwardPeriodDialogOpen(true)}
            >
              Forward to Approver <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isForwardPeriodDialogOpen} onOpenChange={setIsForwardPeriodDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Forward mentorship upgrade</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Set the final agreed assessment period before sending this case to the Approver.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Final agreed assessment period</Label>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MonthYearPicker value={agreedReviewPeriodStart} monthOnly placeholder="Start month" onChange={setAgreedReviewPeriodStart} />
                <MonthYearPicker value={agreedReviewPeriodEnd} monthOnly placeholder="End month (optional)" onChange={setAgreedReviewPeriodEnd} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Select one month for a single-month period, or add an end month for a range.
              </p>
            </div>
            <div>
              <Label>Forwarding note <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea className="mt-2" value={boardNotes} onChange={(e) => setBoardNotes(e.target.value)} placeholder="Add a final summary for the Approver..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsForwardPeriodDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-navy text-white hover:bg-navy/90"
              disabled={!agreedReviewPeriodStart || Boolean(agreedReviewPeriodEnd && agreedReviewPeriodEnd < agreedReviewPeriodStart) || forwardMentorshipMutation.isPending}
              onClick={() => forwardMentorshipMutation.mutate()}
            >
              {forwardMentorshipMutation.isPending ? "Forwarding…" : "Confirm & Forward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpgradeApprovalDialogOpen} onOpenChange={setIsUpgradeApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {app.mentorship?.apcReadiness === "Ready" ? "Confirm mentorship approval" : "Confirm Associate award"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {app.mentorship?.apcReadiness === "Ready"
                ? "This will approve the mentorship upgrade and move the applicant to the APC assessment queue."
                : "This will approve the mentorship upgrade to the Associate class for this applicant. Their new membership ID will only be issued once they pay the first-year fee for this class."}
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={mentorshipUpgradeMutation.isPending || awardAssociateMutation.isPending}
              onClick={() => {
                setIsUpgradeApprovalDialogOpen(false);
                executeUpgradeApproval();
              }}
            >
              {mentorshipUpgradeMutation.isPending || awardAssociateMutation.isPending
                ? "Processing…"
                : app.mentorship?.apcReadiness === "Ready" ? "Confirm approval" : "Confirm & Award Associate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mt-6">
          <div className="lg:col-span-1 space-y-6">
            {app.mentorship && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
                <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gold" />
                    Mentorship Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-sm bg-zinc-50/50 dark:bg-zinc-950/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <h4 className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Mentor Name</h4>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{app.mentorship.mentor || "Not assigned"}</div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Duration</h4>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{app.mentorship.completedDurationMonths || 0} Months</div>
                    </div>
                    <div className="col-span-2">
                      <h4 className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">APC Readiness</h4>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {app.mentorship.apcReadiness === "Ready" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-none">Ready for APC</Badge>
                        ) : app.mentorship.apcReadiness === "Not_Ready" ? (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-none">Associate Route</Badge>
                        ) : "Pending"}
                      </div>
                    </div>
                    {app.mentorship.mentorNotes && (
                      <div className="col-span-2 rounded-md border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <h4 className="font-semibold text-[10px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">Mentor Recommendation Note</h4>
                        <p className="text-xs whitespace-pre-wrap text-emerald-900 dark:text-emerald-200">{app.mentorship.mentorNotes}</p>
                      </div>
                    )}
                    {app.mentorship.agreedReviewPeriodStart && (
                      <div className="col-span-2 text-xs text-muted-foreground">
                        Final agreed assessment period: <span className="font-semibold text-navy dark:text-zinc-200">{new Date(app.mentorship.agreedReviewPeriodStart).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}{app.mentorship.agreedReviewPeriodEnd ? ` – ${new Date(app.mentorship.agreedReviewPeriodEnd).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}` : ""}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {app.mentorshipReviews?.length > 0 && (
                <Card className="border-blue-200 dark:border-blue-900/50 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-blue-100 dark:border-blue-900/40">
                    <CardTitle className="text-sm font-bold text-navy dark:text-blue-200">
                      Reviewer Assessment Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {app.mentorshipReviews.map((review: any) => {
                      return (
                        <div key={review.id} className="rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3 text-xs">
                          <div className="font-semibold text-navy dark:text-zinc-100">
                            {review.reviewer?.fullName || "Reviewer"}
                          </div>
                          {review.reviewPeriodStart && (
                            <div className="mt-1 text-muted-foreground">
                              Recommended assessment period: <span className="font-medium text-zinc-700 dark:text-zinc-300">{new Date(review.reviewPeriodStart).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}{review.reviewPeriodEnd ? ` – ${new Date(review.reviewPeriodEnd).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}` : ""}</span>
                            </div>
                          )}
                          {review.notes && (
                            <div className="mt-1 text-muted-foreground">
                              Notes: <span className="font-medium text-zinc-700 dark:text-zinc-300">{review.notes}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {app.mentorship.status === "Pending_Reviewer_Board" && app.mentorship.apcReadiness === "Ready" && (role === "Reviewer" || role === "Head_Reviewer") && !hasSubmittedBoardReview && (
                <div className="bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Reviewer Board</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submit your recommendation and a suggested assessment period (one month, or a range of months). Three board reviews are required before the Head Reviewer forwards this case.
                    </p>
                  </div>
                  <div className="text-xs font-medium text-blue-800 dark:text-blue-300">
                    {app.mentorshipReviews?.length || 0} of 3 reviewer submissions received
                  </div>
                  {hasSubmittedBoardReview && role !== "Head_Reviewer" && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      You have already submitted your board recommendation for this mentorship upgrade.
                    </div>
                  )}
                  <Textarea value={boardNotes} onChange={(e) => setBoardNotes(e.target.value)} disabled={!canEditForwardingNote} placeholder={role === "Head_Reviewer" ? "Board summary or forwarding note" : "Your review recommendation"} />
                  <div>
                    <Label className="text-xs">Your recommended assessment period</Label>
                    <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <MonthYearPicker value={reviewPeriodStart} monthOnly placeholder="Start month" onChange={setReviewPeriodStart} />
                      <MonthYearPicker value={reviewPeriodEnd} monthOnly placeholder="End month (optional)" onChange={setReviewPeriodEnd} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Choose one month for a single-month period, or add an end month for a range.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={hasSubmittedBoardReview || !boardNotes.trim() || !reviewPeriodStart || Boolean(reviewPeriodEnd && reviewPeriodEnd < reviewPeriodStart) || mentorshipBoardReviewMutation.isPending}
                      onClick={() => mentorshipBoardReviewMutation.mutate()}
                    >
                      {hasSubmittedBoardReview ? "Review Submitted" : mentorshipBoardReviewMutation.isPending ? "Saving…" : "Submit Board Review"}
                    </Button>
                  </div>
                </div>
              )}

              {app.mentorship.status === "Pending_Admin_Review" && (role === "Admin" || role === "Approver") && (
                <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Upgrade Decision</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The candidate has completed mentorship and {app.mentorship.apcReadiness === "Ready" ? <strong>requested to sit for the APC.</strong> : <strong>elected NOT to sit for the APC (Associate Route).</strong>}
                  </p>
                </div>
              )}
            </motion.div>
            )}
          </div>

        <div className="lg:col-span-3">
          <Card className="border-zinc-100 dark:border-zinc-800 flex flex-col sticky top-2 h-[calc(100vh-5rem)] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-3 px-4 shrink-0">
              <CardTitle className="text-sm font-bold text-navy">
                Mentorship Documents
              </CardTitle>
            </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden bg-zinc-50/30 dark:bg-zinc-950/30">
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
                  {displayDocs.map((d: any, i: number) => (
                    <TabsTrigger
                      key={i}
                      value={String(i)}
                      className="shrink-0 text-sm font-semibold px-5 py-2.5 whitespace-nowrap"
                    >
                      {formatLabel(d.name || d.documentName || resolveDocName(d.documentType))}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {/* Pre-render all documents so PDFs do not reload when switching tabs */}
              <div className="relative flex-1 mt-0 overflow-hidden">
                {displayDocs.map((doc: any, i: number) => {
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
    </div>
  );
}
