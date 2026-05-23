"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApplicationDetail, submitReviewDecision } from "@/lib/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PDFViewer from "@/components/ui/pdf-viewer";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [app, setApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeDoc, setActiveDoc] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [dialog, setDialog] = useState<
    null | "approve" | "reject" | "correction"
  >(null);
  const [note, setNote] = useState("");

  const prevDoc = useRef(activeDoc);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getApplicationDetail(id);
        const mappedApp = {
          id: res.application.id,
          applicantName: res.application.full_name,
          email: res.application.email,
          phone: res.application.phone_number || "Not provided",
          national_id_or_passport: res.application.national_id_or_passport || "Not provided",
          category: res.application.category_name,
          entityType: res.application.cat_entity_type || "Individual",
          practiceLocation: res.application.location,
          status: res.application.status.replace("_", " "),
          submittedAt: res.application.submittedAt ? new Date(res.application.submittedAt).toISOString().split('T')[0] : "Unknown",
          education: (res.education || []).map((e: any) => ({
            degree: e.qualificationType,
            institution: e.institution,
            startMonthYear: new Date(e.startDate).toISOString().slice(0, 7)
          })),
          employment: (res.employment || []).map((e: any) => ({
            role: e.jobTitle,
            company: e.companyName,
            from: new Date(e.startDate).toISOString().slice(0, 7),
            to: e.endDate ? new Date(e.endDate).toISOString().slice(0, 7) : undefined
          })),
          mentorship: res.mentorship ? {
            mentor: "Assigned Mentor",
            startedAt: new Date(res.mentorship.createdAt).toISOString().split('T')[0],
            progress: 0
          } : null,
          documents: (res.documents || []).map((d: any) => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : '';
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
            return {
              name: d.documentType,
              type: d.documentType.split('_').pop() || "DOC",
              url: `${baseUrl}/files/download/${d.id}?token=${token}`,
              originalFileUrl: d.fileUrl
            };
          })
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

  const handle = async (action: "approve" | "reject" | "correction") => {
    if (action !== "approve" && !note.trim()) {
      return toast.error("Please add a note explaining the reason");
    }

    const apiAction = action === "approve" ? "Approve" : action === "reject" ? "Reject" : "Flag";

    try {
      await submitReviewDecision(app.id, apiAction, note);
      const msg =
        action === "approve"
          ? `Application successfully approved`
          : action === "reject"
            ? "Application successfully rejected"
            : "Correction request successfully sent to applicant";

      toast.success(msg);
      setDialog(null);
      setNote("");

      setTimeout(() => router.push("/admin/applications"), 650);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to process decision");
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
          <Button
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-950/20"
            onClick={() => setDialog("correction")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Flag correction
          </Button>
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
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left column: Form data */}
        <div className="space-y-4 lg:col-span-2">
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
                <Row k="National ID/Passport" v={app.national_id_or_passport} />
                <Row k="Practice location" v={app.practiceLocation} />
              </CardContent>
            </Card>
          </motion.div>

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
                {app.education.map((e: any, i: number) => (
                  <div
                    key={i}
                    className="rounded border border-zinc-100 dark:border-zinc-800 p-2.5 bg-zinc-50/55"
                  >
                    <div className="font-semibold text-zinc-850 dark:text-zinc-200">
                      {e.degree}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {e.institution} ·{" "}
                      {e.startMonthYear
                        ? formatMonthYear(e.startMonthYear)
                        : e.year}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

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
                {app.employment.map((e: any, i: number) => (
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
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {app.mentorship && (
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
                    Mentor:{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {app.mentorship.mentor}
                    </strong>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Started {app.mentorship.startedAt} ·{" "}
                    {app.mentorship.progress}% progress logs submitted
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
              <TabsList className="flex w-full h-auto flex-wrap bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg mb-4 gap-1">
                {app.documents.map((d: any, i: number) => {
                  const formatName = (n: string) => {
                    if (n.toLowerCase() === 'id') return 'ID Document';
                    const spaced = n.replace(/([a-z])([A-Z])/g, '$1 $2');
                    return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
                  };
                  return (
                  <TabsTrigger
                    key={i}
                    value={String(i)}
                    className="flex-1 text-xs font-semibold px-3 py-2 whitespace-nowrap"
                  >
                    {formatName(d.name)}
                  </TabsTrigger>
                )})}
              </TabsList>
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
                                <div className="relative w-full h-full bg-white shadow-sm rounded-md overflow-hidden flex flex-col group">
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
            </p>
            <Textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                dialog === "approve"
                  ? "Optional congratulatory note..."
                  : "Describe outstanding issues..."
              }
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => dialog && handle(dialog)}
              className={
                dialog === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-emerald"
                  : dialog === "reject"
                    ? "bg-red-600 hover:bg-red-700 text-white border-none shadow-destructive"
                    : "bg-orange-600 hover:bg-orange-700 text-white border-none shadow-orange"
              }
            >
              Confirm
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
