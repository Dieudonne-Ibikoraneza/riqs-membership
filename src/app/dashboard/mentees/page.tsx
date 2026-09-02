"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  AlertCircle,
  Check,
  Mail,
  Phone,
  GraduationCap,
  ArrowUpCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import { logbookServices } from "@/services/logbook.services";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

function MenteeCard({ mentee }: { mentee: any }) {
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [recommend, setRecommend] = useState(false);
  const [mentorNotes, setMentorNotes] = useState("");
  const queryClient = useQueryClient();

  const recommendMutation = useMutation({
    mutationFn: async () => {
      return logbookServices.submitMentorRecommendation({
        applicationId: mentee.applicationId,
        recommend: recommend === true,
        mentorNotes: mentorNotes.trim() || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentorship.mentees() });
      toast.success(recommend ? "Applicant recommended for reviewer assessment." : "Recommendation declined; the request remains with you.");
      setIsRecommendOpen(false);
      setRecommend(false);
      setMentorNotes("");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to submit recommendation")
  });

  const canRecommend = mentee.entriesCount >= 2 && mentee.upgradeRequested && !mentee.mentorRecommended;

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
            Review Recommendation
          </Button>
        ) : mentee.mentorRecommended || mentee.mentorRecommendationUrl ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-900/50 transition-colors">
            <Check className="h-3 w-3 mr-1" /> Recommended for Review
          </Badge>
        ) : null}

        <Link href={`/dashboard/mentees/${mentee.id}`}>
          <Button variant="outline" size="sm" className="font-semibold text-xs md:text-sm h-8 gap-1.5">
            <FileText className="h-4 w-4" /> View Full Details <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>

        <Dialog open={isRecommendOpen} onOpenChange={setIsRecommendOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Mentor Recommendation</DialogTitle>
              <DialogDescription>Review the applicant’s details, then confirm whether you recommend {mentee.name} for the requested upgrade.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <label className="flex items-center gap-3 rounded border p-4 cursor-pointer">
                <Checkbox checked={recommend} onCheckedChange={(checked) => setRecommend(checked === true)} />
                <span className="text-sm font-semibold">Do you recommend this applicant?</span>
              </label>
              <div className="space-y-2">
                <Label htmlFor="mentor-notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Textarea id="mentor-notes" value={mentorNotes} onChange={(event) => setMentorNotes(event.target.value)} placeholder="Add any relevant observations for the reviewers..." />
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
      </div>
    </div>
  );
}

export default function Mentees() {
  const { data: menteesData, isLoading: isMenteesLoading, error: menteesError } = useQuery({
    queryKey: queryKeys.mentorship.mentees(),
    queryFn: applicantServices.getMentees,
  });

  // ================= MENTOR DASHBOARD VIEW =================
  const mentees = menteesData?.mentees || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy dark:text-zinc-150">Mentor Dashboard</h1>
        <p className="text-sm text-muted-foreground font-sans font-normal mt-1">
          Supervise assigned graduates, review their application evidence, and confirm upgrade recommendations.
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
                      <MenteeCard mentee={mentee} />
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
