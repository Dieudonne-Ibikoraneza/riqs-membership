"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Mentorship() {
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
              <div className="text-sm text-muted-foreground mt-0.5">Senior Quantity Surveyor · Kigali Build Ltd</div>
              <div className="mt-3 text-xs text-zinc-500 font-medium">Started Mentorship: Feb 2024</div>
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
              Submit your annual progression logs and final reports to be considered for active Professional Quantity Surveyor credentials.
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
