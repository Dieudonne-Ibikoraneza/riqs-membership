"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APPLICATIONS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Check, X, AlertTriangle, FileText, Download, ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";

function formatMonthYear(val?: string) {
  if (!val) return "";
  if (val.toLowerCase() === "present") return "Present";
  const [y, m] = val.split("-");
  if (!y || !m) return val;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIdx = parseInt(m, 10) - 1;
  return months[mIdx] ? `${months[mIdx]} ${y}` : val;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Review({ params }: PageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const app = APPLICATIONS.find(a => a.id === id);
  
  const [activeDoc, setActiveDoc] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [dialog, setDialog] = useState<null | "approve" | "reject" | "correction">(null);
  const [note, setNote] = useState("");

  if (!app) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-navy">Application not found</h2>
        <p className="text-sm text-muted-foreground mt-1">The requested ID does not exist in the candidate records.</p>
        <Link href="/admin/applications" className="text-navy dark:text-gold underline mt-4 inline-block font-semibold">
          Back to queue
        </Link>
      </div>
    );
  }

  const handle = (action: "approve" | "reject" | "correction") => {
    if (action !== "approve" && !note.trim()) {
      return toast.error("Please add a note explaining the reason");
    }
    
    const msg = action === "approve"
      ? `Approved Jean Mugisha — issued ${app.id.replace("APP", "RIQS")}`
      : action === "reject" 
        ? "Application successfully rejected" 
        : "Correction request successfully sent to applicant";
        
    toast.success(msg); 
    setDialog(null); 
    setNote("");
    
    setTimeout(() => router.push("/admin/applications"), 650);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Back to queue (mobile only) */}
      <div className="sm:hidden">
        <Link href="/admin/applications">
          <Button variant="ghost" size="sm" className="text-navy dark:text-gold hover:bg-navy/5">
            <ArrowLeft className="mr-2 h-4 w-4" />Queue
          </Button>
        </Link>
      </div>
      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/applications" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="text-navy dark:text-gold hover:bg-navy/5">
              <ArrowLeft className="mr-2 h-4 w-4" />Queue
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-navy">{app.applicantName}</h1>
            <div className="text-xs text-muted-foreground">
              {app.id} · Submitted {app.submittedAt}
            </div>
          </div>
          <Badge variant="outline" className="border-zinc-200 dark:border-zinc-700">
            {app.status}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end justify-center items-center">
          <Button 
            variant="outline" 
            className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-950/20" 
            onClick={() => setDialog("correction")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />Flag correction
          </Button>
          <Button 
            variant="outline" 
            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20" 
            onClick={() => setDialog("reject")}
          >
            <X className="mr-2 h-4 w-4" />Reject
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-emerald" 
            onClick={() => setDialog("approve")}
          >
            <Check className="mr-2 h-4 w-4" />Approve
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left column: Form data */}
        <div className="space-y-4 lg:col-span-2">
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-zinc-100 dark:border-zinc-800">
              <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold text-navy">Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-sm">
                <Row k="Full name" v={app.applicantName} />
                <Row k="Email" v={app.email} />
                <Row k="Phone" v={app.phone} />
                <Row k="Category" v={app.category} highlight />
                <Row k="Entity" v={app.entityType} />
                <Row k="Practice location" v={app.practiceLocation} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-zinc-100 dark:border-zinc-800">
              <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold text-navy">Education Background</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                {app.education.map((e: any, i: number) => (
                  <div key={i} className="rounded border border-zinc-100 dark:border-zinc-800 p-2.5 bg-zinc-50/55">
                    <div className="font-semibold text-zinc-850 dark:text-zinc-200">{e.degree}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {e.institution} · {e.startMonthYear ? formatMonthYear(e.startMonthYear) : e.year}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-zinc-100 dark:border-zinc-800">
              <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold text-navy">Employment History</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                {app.employment.map((e: any, i: number) => (
                  <div key={i} className="rounded border border-zinc-100 dark:border-zinc-800 p-2.5 bg-zinc-50/55">
                    <div className="font-semibold text-zinc-850 dark:text-zinc-200">{e.role}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {e.company} · {formatMonthYear(e.from)} — {formatMonthYear(e.to) || "Present"}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {app.mentorship && (
            <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <Card className="border-zinc-100 dark:border-zinc-800">
                <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold text-navy">Mentorship</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-sm">
                  <div className="font-medium">Mentor: <strong className="text-zinc-800 dark:text-zinc-200">{app.mentorship.mentor}</strong></div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Started {app.mentorship.startedAt} · {app.mentorship.progress}% progress logs submitted
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right column: Document viewer */}
        <Card className="lg:col-span-3 border-zinc-100 dark:border-zinc-800 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-3 px-4">
            <CardTitle className="text-sm font-bold text-navy">Documents Workbench</CardTitle>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
              <span className="text-xs w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
              <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setRot(r => (r + 90) % 360)}><RotateCw className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => toast.success("FullScreen preview enabled")}><Maximize2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => toast.success("Document downloaded")}><Download className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col">
            <Tabs value={String(activeDoc)} onValueChange={(v) => setActiveDoc(+v)} className="flex-1 flex flex-col">
              <TabsList className="flex h-auto flex-wrap bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md mb-4 self-start">
                {app.documents.map((d, i) => (
                  <TabsTrigger key={i} value={String(i)} className="text-xs font-semibold px-3 py-1.5">
                    {d.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {app.documents.map((d, i) => (
                <TabsContent key={i} value={String(i)} className="flex-1 flex items-center justify-center mt-0 outline-none">
                  <div className="relative flex h-[500px] w-full items-center justify-center overflow-auto rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                    <div 
                      style={{ transform: `scale(${zoom}) rotate(${rot}deg)`, transition: "transform 0.15s ease-out" }}
                      className="flex h-[400px] w-[300px] shrink-0 flex-col items-center justify-center rounded-md border bg-white p-6 shadow-md"
                    >
                      <FileText className="h-14 w-14 text-navy/20 dark:text-zinc-400/25" />
                      <div className="mt-4 font-semibold text-navy text-center">{d.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground uppercase tracking-wide">
                        {d.type} PREVIEW STATE
                      </div>
                      <div className="mt-6 w-full space-y-2">
                        <div className="h-1.5 w-full rounded bg-zinc-100" />
                        <div className="h-1.5 w-4/5 rounded bg-zinc-100" />
                        <div className="h-1.5 w-3/5 rounded bg-zinc-100" />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
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
              {dialog === "approve" && "A new membership certificate, practicing license, and membership ID will be generated and dispatched automatically."}
              {dialog === "reject" && "An administrative reason is required and will be sent directly to the candidate."}
              {dialog === "correction" && "Specify the files or descriptions requiring update. The registration process will be suspended until complete."}
            </p>
            <Textarea 
              rows={4} 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder={dialog === "approve" ? "Optional congratulatory note..." : "Describe outstanding issues..."} 
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
            <Button 
              onClick={() => dialog && handle(dialog)} 
              className={
                dialog === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-emerald" :
                dialog === "reject" ? "bg-red-600 hover:bg-red-700 text-white border-none shadow-destructive" : 
                "bg-orange-600 hover:bg-orange-700 text-white border-none shadow-orange"
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

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded px-2.5 py-1.5 transition-all ${highlight ? "bg-gold/15 text-[#1a1a1a] font-semibold" : ""}`}>
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{v}</span>
    </div>
  );
}
