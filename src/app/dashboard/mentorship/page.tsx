"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Upload, Users, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function Mentorship() {
  const { isMentor, name } = useAuth();

  // Mock mentees list (Max 5)
  const mockMentees = [
    { id: 1, name: "Jean Mugisha", category: "Graduate", joined: "Jan 2025", progress: 85, recommendationSent: false },
    { id: 2, name: "Aline Uwase", category: "Graduate", joined: "Mar 2025", progress: 40, recommendationSent: false },
  ];

  if (isMentor) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Mentor Dashboard</h1>
          <p className="text-sm text-muted-foreground font-sans font-normal">
            Manage your mentees and provide recommendation letters. You can mentor up to 5 graduates.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-1 border-zinc-100 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-navy text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-gold" /> Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-navy">{mockMentees.length} <span className="text-sm text-muted-foreground font-normal">/ 5 Mentees</span></div>
              <Progress value={(mockMentees.length / 5) * 100} className="h-2 mt-4" />
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                As a Mentor, you are allowed to mentor a maximum of 5 graduate members simultaneously.
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-zinc-100 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-navy text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-gold" /> Your Mentees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockMentees.map(mentee => (
                <div key={mentee.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{mentee.name}</div>
                    <div className="text-sm text-muted-foreground">{mentee.category} · Since {mentee.joined}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Logbook Progress:</span>
                      <Progress value={mentee.progress} className="h-1.5 w-24" />
                      <span className="text-xs font-bold text-navy">{mentee.progress}%</span>
                    </div>
                  </div>
                  <Button 
                    variant={mentee.recommendationSent ? "outline" : "default"} 
                    className={mentee.recommendationSent ? "bg-white text-emerald-600 border-emerald-200" : "bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-sm border-none"}
                    onClick={() => toast.success(`Recommendation letter uploaded for ${mentee.name}`)}
                  >
                    {mentee.recommendationSent ? (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Letter Sent</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" /> Upload Recommendation</>
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Mentorship & Progression</h1>
        <p className="text-sm text-muted-foreground font-sans font-normal">
          Track your journey and competency logs from Graduate status to a full Professional member.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Mentor Info */}
        <Card className="md:col-span-1 border-zinc-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-navy text-base font-bold">Your assigned mentor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-zinc-100 dark:border-zinc-850 p-4 bg-zinc-50/50 dark:bg-zinc-950/20">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">Eng. Patrick Nshuti, MRIQS</div>
              <div className="text-sm text-muted-foreground mt-0.5">Professional Quantity Surveyor · Kigali Build Ltd</div>
              <div className="mt-3 text-xs text-zinc-500 font-medium">Started Mentorship: Feb 2024</div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-md border border-blue-100 dark:border-blue-900/50 text-xs leading-relaxed">
              <strong>Recommendation Status:</strong> Pending.<br /> 
              Once your logbook is 100% complete, your mentor can upload a recommendation letter for your professional upgrade.
            </div>
          </CardContent>
        </Card>

        {/* Progression Progress */}
        <Card className="md:col-span-2 border-zinc-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-navy text-base font-bold">Logbook competency tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-305">Cost planning & Estimation</span>
                <span className="font-semibold text-navy">80% complete</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-305">Contract administration</span>
                <span className="font-semibold text-navy">55% complete</span>
              </div>
              <Progress value={55} className="h-2" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-305">Procurement methods</span>
                <span className="font-semibold text-navy">40% complete</span>
              </div>
              <Progress value={40} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Call to action */}
      <Card className="border-navy/20 dark:border-zinc-800">
        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6">
          <div className="flex-1 space-y-1">
            <div className="font-bold text-navy text-lg">Ready for a professional upgrade?</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ensure your mentor has uploaded your recommendation letter before submitting your final upgrade request to the Council.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={() => toast.success("Annual report successfully uploaded")}
              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 w-full sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4 text-gold" />Upload annual report
            </Button>
            <Button 
              className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold w-full sm:w-auto"
              onClick={() => toast.success("Professional status upgrade request successfully submitted to Council")}
            >
              Request upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
