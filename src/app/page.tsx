"use client";

import Link from "next/link";
import { PublicHeader, PublicFooter } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, ShieldCheck, Users, Award, FileCheck, BookOpen, Building2,
  ChevronRight, Quote, Sparkles, TrendingUp, Globe2, Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicServices } from "@/services/public.services";
import { queryKeys } from "@/services/queryKeys";
import { cn } from "@/lib/utils";

export default function Home() {
  const [location, setLocation] = useState<"Rwandan" | "Non_Rwandan">("Rwandan");
  const [entityType, setEntityType] = useState<"Individual" | "Firm">("Individual");

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: queryKeys.public.categories({ location, entityType }),
    queryFn: () => publicServices.getCategories({ location, entityType }),
  });
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        
        {/* ───── Hero ───── */}
        <section className="relative overflow-hidden brand-gradient text-white">
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-fade"
          />
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 md:px-12 xl:px-12 pt-20 pb-32 md:grid-cols-2 md:pt-28 md:pb-40 z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                Official Membership Portal
              </div>
              <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
                Rwanda Institute of <span className="gold-text">Quantity Surveyors</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/80 leading-relaxed font-sans">
                The regulatory home of Quantity Surveying in Rwanda. Apply for membership,
                manage your professional record, and verify accredited QS professionals
                across the country.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button size="lg" className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold h-12 px-7 text-base font-bold border-none">
                    Apply for Membership <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/members">
                  <Button size="lg" variant="outline" className="h-12 border-white/30 bg-white/5 text-white hover:bg-white/15 px-7 text-base font-semibold">
                    View Members Directory
                  </Button>
                </Link>
              </div>
              <div className="mt-12 grid max-w-md grid-cols-3 gap-6 stagger">
                {[
                  { n: "850+", l: "Registered Members" },
                  { n: "120+", l: "Licensed Firms" },
                  { n: "12", l: "Years Active" },
                ].map(s => (
                  <div key={s.l}>
                    <div className="text-3xl font-bold gold-text">{s.n}</div>
                    <div className="text-xs text-white/70 mt-1 font-sans">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="relative hidden md:block"
            >
              <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
              <Card className="relative border-white/10 bg-white/5 backdrop-blur-md text-white shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center bg-gold text-[#1a1a1a] shadow-gold">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/60 font-sans">Latest Certificate Issued</div>
                      <div className="font-semibold text-sm">RIQS-2025-047</div>
                    </div>
                    <Badge className="ml-auto bg-emerald-500/20 text-emerald-200 border-emerald-400/30 font-semibold">
                      Verified
                    </Badge>
                  </div>
                  <div className="mt-6 space-y-3 text-sm">
                    {[
                      { i: ShieldCheck, t: "Verified by RIQS Council" },
                      { i: FileCheck, t: "Digitally signed & QR-stamped" },
                      { i: BookOpen, t: "Recognized across East Africa" },
                    ].map((x, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/10 font-sans">
                        <x.i className="h-4 w-4 gold-text shrink-0" />
                        <span className="text-white/85">{x.t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Issued on</span><span>14 May 2026</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Valid until</span><span>31 Dec 2026</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* ───── Quick Actions ───── */}
        <section className="mx-auto max-w-7xl px-6 md:px-12 xl:px-6 -mt-20 relative z-10">
          <div className="grid gap-4 md:grid-cols-3 stagger">
            {[
              { i: Users, t: "Public Directory", d: "Browse all approved RIQS members.", to: "/members", cta: "Open directory" },
              { i: FileCheck, t: "Apply / Register", d: "Start a new membership application.", to: "/register", cta: "Begin application" },
              { i: ShieldCheck, t: "Member Login", d: "Manage your profile and certificate.", to: "/login", cta: "Sign in" },
            ].map(x => (
              <Card key={x.t} className="hover-lift bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center bg-gradient-to-br from-gold to-[#d18a00] text-[#1a1a1a] shadow-gold">
                    <x.i className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-navy dark:text-gold">{x.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground font-sans leading-relaxed">{x.d}</p>
                  <Link href={x.to} className="mt-4 inline-flex items-center text-sm font-bold text-navy dark:text-gold group">
                    {x.cta}
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ───── Categories ───── */}
        <section className="mx-auto max-w-7xl px-6 md:px-12 xl:px-6 py-24">
          <div className="mx-auto max-w-2xl text-center animate-slide-up">
            <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold font-bold">
              <Sparkles className="mr-1.5 h-3 w-3 text-gold" /> Membership tiers
            </Badge>
            <h2 className="mt-4 text-4xl font-bold text-navy dark:text-white">Find your category</h2>
            <p className="mt-3 text-muted-foreground font-sans leading-relaxed">
              Whether you are a student, a graduate, or a registered firm — there is a place for you at RIQS.
            </p>

            {/* Filters */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 p-1 rounded-md bg-white dark:bg-zinc-950 shadow-sm">
                <button
                  onClick={() => setLocation("Rwandan")}
                  className={cn("px-4 py-1.5 text-sm font-semibold transition-colors rounded", location === "Rwandan" ? "bg-navy text-white shadow" : "text-muted-foreground hover:text-navy dark:hover:text-white")}
                >
                  Rwandan
                </button>
                <button
                  onClick={() => setLocation("Non_Rwandan")}
                  className={cn("px-4 py-1.5 text-sm font-semibold transition-colors rounded", location === "Non_Rwandan" ? "bg-navy text-white shadow" : "text-muted-foreground hover:text-navy dark:hover:text-white")}
                >
                  Non-Rwandan
                </button>
              </div>

              <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 p-1 rounded-md bg-white dark:bg-zinc-950 shadow-sm">
                <button
                  onClick={() => setEntityType("Individual")}
                  className={cn("px-4 py-1.5 text-sm font-semibold transition-colors rounded", entityType === "Individual" ? "bg-gold text-[#1a1a1a] shadow" : "text-muted-foreground hover:text-navy dark:hover:text-white")}
                >
                  Individual
                </button>
                <button
                  onClick={() => setEntityType("Firm")}
                  className={cn("px-4 py-1.5 text-sm font-semibold transition-colors rounded", entityType === "Firm" ? "bg-gold text-[#1a1a1a] shadow" : "text-muted-foreground hover:text-navy dark:hover:text-white")}
                >
                  Firm
                </button>
              </div>
            </div>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-5 stagger">
            {isLoadingCategories ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse bg-zinc-100 dark:bg-zinc-800 border-none h-[180px]" />
              ))
            ) : categories?.length ? (
              categories.map(x => (
                <Card key={x.id} className="group hover-lift text-center bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                  <CardContent className="p-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center bg-gold/15 text-navy dark:text-white transition-colors group-hover:bg-gold group-hover:text-[#1a1a1a] rounded-md">
                      <Building2 className="h-6 w-6 text-gold group-hover:text-[#1a1a1a]" />
                    </div>
                    <h3 className="mt-4 font-bold text-navy dark:text-white">{x.category_name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground font-sans line-clamp-2">Code: {x.category_code}</p>
                    <div className="mt-3 text-xs font-bold gold-text">{x.currency} {Number(x.annual_renewal_fee).toLocaleString()} / year</div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground font-sans text-sm py-10">
                No categories available at the moment.
              </div>
            )}
          </div>
        </section>

        {/* ───── Why RIQS ───── */}
        <section className="bg-navy/[0.02] dark:bg-zinc-900/10 border-t border-b border-zinc-50 dark:border-zinc-800/40 py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-12 xl:px-6">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <Badge variant="outline" className="border-navy/30 bg-navy/5 text-navy dark:border-zinc-700 dark:text-zinc-300 font-semibold">
                  Why RIQS
                </Badge>
                <h2 className="mt-4 text-4xl font-bold text-navy dark:text-white leading-tight">A trusted, modern register of QS professionals</h2>
                <p className="mt-4 text-muted-foreground font-sans leading-relaxed">
                  RIQS upholds professional standards across the Rwandan construction industry —
                  from pre-contract estimating to dispute resolution. Our portal makes membership
                  verifiable, transparent and accessible.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    { i: ShieldCheck, t: "Verified credentials", d: "Every member is vetted by the RIQS Council." },
                    { i: TrendingUp, t: "Career development", d: "Mentorship, CPD events and accreditation pathways." },
                    { i: Globe2, t: "Regional recognition", d: "Membership recognized across the East African Community." },
                  ].map(x => (
                    <div key={x.t} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-gold text-[#1a1a1a] shadow-gold">
                        <x.i className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-navy dark:text-gold text-base">{x.t}</div>
                        <div className="text-sm text-muted-foreground font-sans leading-normal mt-0.5">{x.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { n: "850+", l: "Active Members", c: "bg-navy text-white" },
                  { n: "120+", l: "Licensed Firms", c: "bg-gold text-[#1a1a1a]" },
                  { n: "40 hrs", l: "Annual CPD", c: "bg-white dark:bg-zinc-900 text-navy dark:text-gold border border-zinc-100 dark:border-zinc-800" },
                  { n: "5–10 days", l: "Review Cycle", c: "bg-white dark:bg-zinc-900 text-navy dark:text-gold border border-zinc-100 dark:border-zinc-800" },
                ].map(s => (
                  <Card key={s.l} className={`${s.c} border-0 hover-lift shadow-sm`}>
                    <CardContent className="p-6">
                      <div className="text-3xl font-bold">{s.n}</div>
                      <div className="mt-1 text-sm font-sans opacity-80">{s.l}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───── Process ───── */}
        <section className="mx-auto max-w-7xl px-6 md:px-12 xl:px-6 py-24">
          <div className="mx-auto max-w-2xl text-center animate-slide-up">
            <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold font-bold">How it works</Badge>
            <h2 className="mt-4 text-4xl font-bold text-navy dark:text-white">Membership in 4 steps</h2>
          </div>
          <div className="relative mt-14 grid gap-6 md:grid-cols-4 stagger">
            <div className="pointer-events-none absolute left-0 right-0 top-7 hidden md:block z-0">
              <div className="mx-auto h-px w-[80%] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            </div>
            {[
              { n: "01", t: "Register", d: "Create your account in under 2 minutes." },
              { n: "02", t: "Submit application", d: "Complete the guided 9-step wizard." },
              { n: "03", t: "Review", d: "RIQS Council reviews within 5–10 working days." },
              { n: "04", t: "Get certified", d: "Receive your digital certificate & QR badge." },
            ].map(x => (
              <Card key={x.n} className="relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover-lift shadow-sm z-10">
                <CardContent className="p-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold to-[#d18a00] text-lg font-bold text-[#1a1a1a] shadow-gold">
                    {x.n}
                  </div>
                  <h3 className="mt-4 text-center font-bold text-navy dark:text-gold">{x.t}</h3>
                  <p className="mt-1 text-center text-sm text-muted-foreground font-sans leading-relaxed">{x.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ───── Testimonials ───── */}
        <section className="bg-navy/[0.02] dark:bg-zinc-900/10 border-t border-b border-zinc-50 dark:border-zinc-800/40 py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-12 xl:px-6">
            <div className="mx-auto max-w-2xl text-center animate-slide-up">
              <Badge variant="outline" className="border-navy/30 bg-white dark:bg-zinc-950 text-navy dark:text-gold font-semibold">Voices</Badge>
              <h2 className="mt-4 text-4xl font-bold text-navy dark:text-white">Trusted by professionals across Rwanda</h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3 stagger">
              {[
                { q: "RIQS gives our practice the recognition we need to bid on major public infrastructure projects.", n: "Aline Mukamana", r: "Managing Partner, BuildCost Ltd" },
                { q: "The digital certificate and QR verification made my international engagement seamless.", n: "Eric Habimana", r: "Senior QS, Kigali Build" },
                { q: "From CPD tracking to renewals — everything is now in one professional portal.", n: "Diane Iradukunda", r: "Chartered QS" },
              ].map(t => (
                <Card key={t.n} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover-lift shadow-sm">
                  <CardContent className="p-6">
                    <Quote className="h-6 w-6 text-gold fill-gold" />
                    <p className="mt-3 text-sm text-foreground/80 dark:text-zinc-350 leading-relaxed font-sans">"{t.q}"</p>
                    <div className="mt-5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                      <div className="text-sm font-bold text-navy dark:text-gold">{t.n}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-sans">{t.r}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ───── News / Events ───── */}
        <section className="mx-auto max-w-7xl px-6 md:px-12 xl:px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold font-bold">Latest</Badge>
              <h2 className="mt-3 text-4xl font-bold text-navy dark:text-white">News & Events</h2>
            </div>
            <Link href="/about" className="text-sm font-bold text-navy dark:text-gold hover:underline">View all →</Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3 stagger">
            {[
              { t: "Annual RIQS Conference 2026", d: "Join 500+ QS professionals in Kigali for the flagship event of the year.", date: "12 Jun 2026", tag: "Event" },
              { t: "New CPD curriculum released", d: "Updated CPD pathways for Professional and Fellow tiers now available.", date: "02 May 2026", tag: "Update" },
              { t: "Council elections concluded", d: "Welcoming the newly elected RIQS Council for 2026–2028.", date: "18 Apr 2026", tag: "News" },
            ].map(n => (
              <Card key={n.t} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover-lift overflow-hidden shadow-sm">
                <div className="brand-gradient h-32 relative">
                  <Badge className="absolute left-4 top-4 bg-gold text-[#1a1a1a] border-none font-bold">{n.tag}</Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                    <Calendar className="h-3.5 w-3.5 text-gold" /> {n.date}
                  </div>
                  <h3 className="mt-2 font-bold text-navy dark:text-gold text-base">{n.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-sans leading-relaxed">{n.d}</p>
                  <div className="mt-4 inline-flex items-center text-sm font-bold text-navy dark:text-gold group cursor-pointer">
                    Read more <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1 text-gold" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ───── CTA banner ───── */}
        <section className="px-6 md:px-12 xl:px-6 pb-24">
          <div className="mx-auto max-w-7xl brand-gradient text-white p-10 md:p-14 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-6 z-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">Ready to join the register?</h2>
                <p className="mt-2 max-w-xl text-white/85 font-sans leading-relaxed">Take the next step in your QS career — apply for membership today.</p>
              </div>
              <div className="flex gap-3">
                <Link href="/register">
                  <Button size="lg" className="h-12 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold px-7 border-none font-bold">
                    Start application
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="h-12 border-white/30 bg-white/5 text-white hover:bg-white/15 px-7 font-semibold">
                    Learn more
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
      </main>
      <PublicFooter />
    </div>
  );
}
