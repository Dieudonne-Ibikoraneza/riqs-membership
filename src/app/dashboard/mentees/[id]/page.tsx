"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MoveHorizontal,
  Phone,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import PDFViewer from "@/components/ui/pdf-viewer";
import ImageViewer from "@/components/ui/image-viewer";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import { logbookServices } from "@/services/logbook.services";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatMonthYear(val?: string) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function isImageFile(url?: string) {
  if (!url) return false;
  return /\.(jpe?g|png|gif|webp)$/i.test(url.split("?")[0]);
}

export default function MenteeDetail({ params }: PageProps) {
  const { id } = React.use(params);
  const queryClient = useQueryClient();

  const [activeDoc, setActiveDoc] = useState(0);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [recommend, setRecommend] = useState(false);
  const [mentorNotes, setMentorNotes] = useState("");

  const { data: menteesData, isLoading, error } = useQuery({
    queryKey: queryKeys.mentorship.mentees(),
    queryFn: applicantServices.getMentees,
  });

  const mentee = useMemo(() => {
    const list = menteesData?.mentees || [];
    return list.find((m: any) => m.id === id) || null;
  }, [menteesData, id]);

  const formatLabel = (name: string): string => {
    if (!name) return "";
    return name
      .replace(/[-_]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  };

  const recommendMutation = useMutation({
    mutationFn: async () => {
      return logbookServices.submitMentorRecommendation({
        applicationId: mentee.applicationId,
        recommend: recommend === true,
        mentorNotes: mentorNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorship.mentees() });
      toast.success(recommend ? "Applicant recommended for reviewer assessment." : "Recommendation declined; the request remains with you.");
      setIsRecommendOpen(false);
      setRecommend(false);
      setMentorNotes("");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to submit recommendation"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 font-sans max-w-7xl mx-auto animate-pulse">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="hidden sm:block w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
            <div className="space-y-1.5">
              <div className="h-5 w-40 rounded bg-zinc-150 dark:bg-zinc-800" />
              <div className="h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="h-8 w-36 rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mt-2">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm h-56 bg-zinc-50 dark:bg-zinc-950" />
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm h-44 bg-zinc-50 dark:bg-zinc-950" />
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm h-36 bg-zinc-50 dark:bg-zinc-950" />
          </div>
          <div className="lg:col-span-3">
            <Card className="border-zinc-100 dark:border-zinc-800 h-[calc(100vh-5rem)] shadow-sm">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 py-3 px-4">
                <div className="h-4 w-48 rounded bg-zinc-100 dark:bg-zinc-800" />
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex gap-2">
                  <div className="h-9 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-9 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-9 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                </div>
                <div className="h-[calc(100%-3.5rem)] rounded-md bg-zinc-100 dark:bg-zinc-800" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mentee) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-navy">Mentee not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This mentee record does not exist, or is not assigned to you.
        </p>
        <Link
          href="/dashboard/mentees"
          className="inline-flex items-center text-sm font-medium text-navy hover:text-navy/80 dark:text-gold dark:hover:text-gold/80 transition-colors mt-3"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to mentees
        </Link>
      </div>
    );
  }

  const canRecommend = mentee.entriesCount >= 2 && mentee.upgradeRequested && !mentee.mentorRecommended;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  const token = typeof window !== "undefined" ? localStorage.getItem("riqs.auth.token") : "";

  const docs: { name: string; url: string; documentType: string }[] = [];

  (mentee.logbooks || []).forEach((entry: any) => {
    if (entry.documentUrl) {
      docs.push({
        name: `${entry.period} Logbook`,
        url: `${apiBase}/files/downloadByUrl?url=${encodeURIComponent(entry.documentUrl)}&token=${token}`,
        documentType: "Logbook",
      });
    }
  });

  if (mentee.yearOneReportUrl) {
    docs.push({
      name: "Year 1 Annual Report",
      url: `${apiBase}/files/downloadByUrl?url=${encodeURIComponent(mentee.yearOneReportUrl)}&token=${token}`,
      documentType: "Annual_Report",
    });
  }
  if (mentee.yearTwoReportUrl) {
    docs.push({
      name: "Year 2 Annual Report",
      url: `${apiBase}/files/downloadByUrl?url=${encodeURIComponent(mentee.yearTwoReportUrl)}&token=${token}`,
      documentType: "Annual_Report",
    });
  }
  const safeActiveDoc = Math.min(activeDoc, Math.max(docs.length - 1, 0));

  return (
    <div className="space-y-4 font-sans max-w-7xl mx-auto">
      {/* Back to mentees (mobile only) */}
      <div className="sm:hidden mb-2">
        <Link href="/dashboard/mentees">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground hover:text-navy dark:hover:text-gold hover:bg-navy/5">
            <ArrowLeft className="mr-2 h-4 w-4" /> Mentees
          </Button>
        </Link>
      </div>

      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/mentees" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2 text-muted-foreground hover:text-navy dark:hover:text-gold hover:bg-navy/5">
              <ArrowLeft className="mr-2 h-4 w-4" /> Mentees
            </Button>
          </Link>
          <div className="hidden sm:block w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
          <div>
            <h1 className="text-xl font-bold text-navy dark:text-zinc-100">{mentee.name}</h1>
            <div className="text-xs text-muted-foreground">Assigned since {mentee.joined}</div>
          </div>
          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400 ml-2">
            {mentee.category}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {canRecommend ? (
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border-none font-semibold"
              onClick={() => setIsRecommendOpen(true)}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" /> Review Recommendation
            </Button>
          ) : mentee.mentorRecommended || mentee.mentorRecommendationUrl ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50">
              <Check className="h-3 w-3 mr-1" /> Recommended for Review
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Recommend Dialog */}
      <Dialog open={isRecommendOpen} onOpenChange={setIsRecommendOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Mentor Recommendation</DialogTitle>
            <DialogDescription>
              Review the applicant&apos;s details, then confirm whether you recommend {mentee.name} for the requested upgrade.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <label className="flex items-center gap-3 rounded border p-4 cursor-pointer">
              <Checkbox checked={recommend} onCheckedChange={(checked) => setRecommend(checked === true)} />
              <span className="text-sm font-semibold">Do you recommend this applicant?</span>
            </label>
            <div className="space-y-2">
              <Label htmlFor="mentor-notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="mentor-notes" value={mentorNotes} onChange={(e) => setMentorNotes(e.target.value)} placeholder="Add any relevant observations for the reviewers..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecommendOpen(false)}>Cancel</Button>
            <Button
              className="bg-gold text-[#1a1a1a] hover:bg-gold/90"
              onClick={() => recommendMutation.mutate()}
              disabled={recommendMutation.isPending}
            >
              {recommendMutation.isPending ? "Submitting..." : "Recommend Applicant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mt-2">
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
            {/* Mentee Summary */}
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
                  <User className="h-4 w-4 text-gold" /> Mentee Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-sm bg-zinc-50/50 dark:bg-zinc-950/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <h4 className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Full Name</h4>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{mentee.name}</div>
                  </div>
                  <div className="col-span-2">
                    <h4 className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Email</h4>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gold shrink-0" /> {mentee.email}</div>
                  </div>
                  {mentee.phone && (
                    <div className="col-span-2">
                      <h4 className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Phone</h4>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gold shrink-0" /> {mentee.phone}</div>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Category</h4>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{mentee.applicant?.category?.categoryName || mentee.category}</div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Upgrade Route</h4>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {mentee.apcReadiness === "Ready" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-none">Full / APC</Badge>
                      ) : mentee.apcReadiness === "Not_Ready" ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-none">Associate</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not yet requested</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gold" /> Mentorship Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Logbook Completion</span>
                    <span className="text-xs font-bold text-navy dark:text-gold">{mentee.progress}%</span>
                  </div>
                  <Progress value={mentee.progress} className="h-2 bg-zinc-150 dark:bg-zinc-850" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Logbook Entries Submitted</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{mentee.entriesCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Upgrade Requested</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{mentee.upgradeRequested ? "Yes" : "Not yet"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Assignment Status</span>
                  <Badge variant="outline" className="text-[10px]">{(mentee.assignmentStatus || "Active").replace(/_/g, " ")}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gold" /> Education
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-sm">
                {mentee.applicant?.education?.length ? (
                  mentee.applicant.education.map((edu: any) => (
                    <div key={edu.id} className="rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3 text-xs">
                      <div className="font-semibold text-navy dark:text-zinc-100">{edu.institution}</div>
                      <div className="text-muted-foreground mt-0.5">{edu.fieldOfStudy} &middot; {edu.qualificationType}</div>
                      <div className="text-muted-foreground mt-1">{formatMonthYear(edu.startDate)} &ndash; {formatMonthYear(edu.endDate)}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No education records submitted.</p>
                )}
              </CardContent>
            </Card>

            {/* Mentor Recommendation Status */}
            {(mentee.mentorRecommended || mentee.mentorNotes) && (
              <Card className="border-blue-200 dark:border-blue-900/50 shadow-sm">
                <CardHeader className="py-3 px-4 border-b border-blue-100 dark:border-blue-900/40">
                  <CardTitle className="text-sm font-bold text-navy dark:text-blue-200 flex items-center gap-2">
                    <Award className="h-4 w-4 text-gold" /> Your Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    {mentee.mentorRecommended ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none"><CheckCircle2 className="h-3 w-3 mr-1" /> Recommended</Badge>
                    ) : (
                      <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-none">Not Recommended</Badge>
                    )}
                  </div>
                  {mentee.mentorNotes && (
                    <p className="text-muted-foreground whitespace-pre-wrap">{mentee.mentorNotes}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-zinc-100 dark:border-zinc-800 flex flex-col sticky top-2 h-[calc(100vh-5rem)] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-3 px-4 shrink-0">
              <CardTitle className="text-sm font-bold text-navy">Logbooks &amp; Annual Reports</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col overflow-hidden bg-zinc-50/30 dark:bg-zinc-950/30">
              {docs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-full mb-4">
                    <FileText className="h-8 w-8 opacity-50" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No logbooks or reports yet</h3>
                  <p className="text-sm max-w-xs mx-auto">This mentee has not submitted any logbook entries or annual reports yet.</p>
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
                      <span>Scroll horizontally to view all logbooks and reports</span>
                    </div>
                    <TabsList className="flex w-full h-auto overflow-x-auto justify-start bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {docs.map((d, i) => (
                        <TabsTrigger key={i} value={String(i)} className="shrink-0 text-sm font-semibold px-5 py-2.5 whitespace-nowrap">
                          {formatLabel(d.name)}
                        </TabsTrigger>
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
                            {isImageFile(d.url) ? (
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
