"use client";

import { PublicHeader, PublicFooter } from "@/components/PublicHeader";

export default function About() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 animate-fade-in">
        <h1 className="text-3xl font-bold text-navy">About RIQS</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed font-sans">
          The Rwanda Institute of Quantity Surveyors (RIQS) is the professional body responsible for the regulation, registration and continuous professional development of Quantity Surveyors in Rwanda. We safeguard standards of practice in construction cost management across the public and private sectors.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 hover-lift bg-white dark:bg-zinc-900">
            <h3 className="font-semibold text-navy">Our Mission</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-normal font-sans">To uphold the highest standards of Quantity Surveying practice, ethics and education in Rwanda.</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 hover-lift bg-white dark:bg-zinc-900">
            <h3 className="font-semibold text-navy">Our Vision</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-normal font-sans">A recognized, world-class profession serving Rwanda's sustainable construction industry.</p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
