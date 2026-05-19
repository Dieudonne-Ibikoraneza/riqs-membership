"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, Award } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Certificate() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Membership Certificate</h1>
          <p className="text-sm text-muted-foreground font-sans">
            Your official, digitally signed RIQS membership certificate.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
          >
            <Printer className="mr-2 h-4 w-4 text-gold" />Print Certificate
          </Button>
          <Button 
            onClick={() => toast.success("Certificate downloaded as PDF")} 
            className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold"
          >
            <Download className="mr-2 h-4 w-4" />Download PDF
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-zinc-155 dark:border-zinc-800 shadow-md">
        <CardContent className="p-0">
          <div 
            className="relative mx-auto aspect-[1.414/1] w-full bg-white dark:bg-zinc-900 p-8 md:p-14 transition-colors" 
            style={{ backgroundImage: "linear-gradient(135deg, rgba(11,51,99,0.03) 0%, rgba(241,165,0,0.03) 100%)" }}
          >
            {/* Ornate decorative borders */}
            <div className="absolute inset-3 border-2 border-navy" />
            <div className="absolute inset-5 border border-gold" />

            <div className="relative flex h-full flex-col items-center text-center">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-navy text-gold">
                  <Award className="h-8 w-8 text-gold" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-navy">Rwanda Institute of</div>
                  <div className="text-lg font-bold text-navy leading-none mt-0.5">QUANTITY SURVEYORS</div>
                </div>
              </div>

              <div className="mt-8 text-xs uppercase tracking-[0.3em] text-zinc-550 dark:text-zinc-400">
                Certificate of Membership
              </div>
              <div className="mt-3 text-3xl font-bold text-navy md:text-4xl" style={{ fontFamily: "Georgia, serif" }}>
                This certifies that
              </div>

              <div className="mt-6 text-4xl font-bold text-gold dark:text-gold md:text-5xl" style={{ fontFamily: "Georgia, serif" }}>
                Demo Member
              </div>

              <p className="mt-6 max-w-2xl text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed md:text-base">
                has been duly registered as a <strong>Professional Member</strong> of the Rwanda Institute of Quantity Surveyors and is hereby authorized to practice Quantity Surveying in the Republic of Rwanda.
              </p>

              {/* Certificate Footer grid */}
              <div className="mt-auto grid w-full grid-cols-3 items-end gap-6 pt-8">
                <div className="text-left font-sans">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Membership ID</div>
                  <div className="font-mono text-sm font-bold text-navy mt-0.5">RIQS-2025-001</div>
                  <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">Date of Issue</div>
                  <div className="text-sm font-semibold mt-0.5 text-zinc-800 dark:text-zinc-200">15 Jan 2025</div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="h-20 w-20 rounded-md bg-white p-1 ring-2 ring-navy shadow-inner">
                    {/* Simulated digital matrix QR */}
                    <div className="grid h-full w-full grid-cols-8 gap-0.5">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div key={i} className={((i * 7 + 3) % 5 === 0 || i % 7 === 0) ? "bg-navy" : "bg-transparent"} />
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] tracking-wider text-muted-foreground uppercase">Scan to verify</div>
                </div>
                
                <div className="text-right font-sans">
                  <div className="mx-auto mb-1 h-8 border-b border-zinc-200 dark:border-zinc-800 w-36" />
                  <div className="text-xs font-semibold text-navy">President, RIQS</div>
                  <div className="mx-auto mb-1 mt-3 h-8 border-b border-zinc-200 dark:border-zinc-800 w-36" />
                  <div className="text-xs font-semibold text-navy">Registrar, RIQS</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
