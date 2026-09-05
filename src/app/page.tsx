"use client";

import Link from "next/link";
import { PublicHeader, PublicFooter } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, ShieldCheck, Users, Award, FileCheck, BookOpen, Building2,
  ChevronRight, Quote, Sparkles, Globe2, Calendar, Briefcase,
  Sprout, Crown, CheckCircle2, Landmark,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicServices } from "@/services/public.services";
import { queryKeys } from "@/services/queryKeys";
import { cn } from "@/lib/utils";
import { isGraduateApplicationCategory } from "@/lib/application-categories";

// The Graduate step genuinely forks into two different tracks (see
// membershipUtils.ts/deriveMemberClass on the backend): Route 2 (GrQS) leads to Associate QS →
// Professional QS → Fellow, while Route 1 (GrQST) leads to Associate QS Technologist → QS
// Technologist. Everything before and after that fork is shared.
const JOURNEY_ROUTES: Record<"Professional" | "Technologist", { i: any; t: string; d: string; color: string }[]> = {
  Professional: [
    { i: Sprout, t: "Graduate QS", d: "Build your knowledge and develop core competencies.", color: "#059669" },
    { i: Users, t: "Associate QS", d: "Gain practical experience, strengthen your skills and advance your career.", color: "#f1a500" },
    { i: Award, t: "Professional QS", d: "Achieve professional recognition through the APC assessment.", color: "#2563eb" },
    { i: Crown, t: "Fellow / Leader", d: "Lead the profession and inspire the next generation.", color: "#9333ea" },
  ],
  Technologist: [
    { i: Sprout, t: "Graduate QS Technologist", d: "Build your knowledge and develop core competencies.", color: "#059669" },
    { i: Users, t: "Associate QS Technologist", d: "Gain practical experience, strengthen your skills and advance your career.", color: "#f1a500" },
    { i: Award, t: "QS Technologist", d: "Achieve professional recognition through the APC assessment.", color: "#2563eb" },
    { i: Crown, t: "Leader", d: "Lead the profession and inspire the next generation.", color: "#9333ea" },
  ],
};

export default function Home() {
  const [location, setLocation] = useState<"Rwandan" | "Non_Rwandan">("Rwandan");
  const [entityType, setEntityType] = useState<"Individual" | "Firm">("Individual");
  // The individual career path genuinely branches in two at Graduate — Route 2 (QS) leads to
  // Professional QS / Fellow, Route 1 (QS Technologist) leads to QS Technologist — it was
  // misleading to show one single fixed line as if every member follows the same steps.
  const [journeyRoute, setJourneyRoute] = useState<"Professional" | "Technologist">("Professional");

  // Live counts for the hero stats, instead of hardcoded placeholder numbers. Both come from
  // the same public directory endpoint the Members Directory page itself uses
  // (getPublicMembersDirectory), which already only ever returns members that are actually
  // publicly visible (membershipId not null — i.e. approved — and excludes internal staff
  // roles). "limit: 1" is enough since only pagination.totalCount is needed, not the rows.
  // `memberCount`/`firmCount` hold the real fetched target; `displayMemberCount`/
  // `displayFirmCount` are what's actually rendered, animated up from 0 to that target once it
  // arrives (previously the number just popped in instantly with no animation at all).
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [firmCount, setFirmCount] = useState<number | null>(null);
  const [displayMemberCount, setDisplayMemberCount] = useState(0);
  const [displayFirmCount, setDisplayFirmCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allRes, firmsRes] = await Promise.all([
          publicServices.getPublicMembers({ category: "all", page: 1, limit: 1 }),
          publicServices.getPublicMembers({ category: "Firm", page: 1, limit: 1 }),
        ]);
        if (!cancelled) {
          setMemberCount(allRes?.pagination?.totalCount ?? 0);
          setFirmCount(firmsRes?.pagination?.totalCount ?? 0);
        }
      } catch {
        // Leave both null on failure — the stats simply render their loading skeleton
        // indefinitely rather than showing a wrong/fabricated number.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Counts up from 0 to each target over ~1.2s (eased) once it's known, instead of the number
  // just popping in instantly.
  useEffect(() => {
    if (memberCount === null) return;
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayMemberCount(Math.round(eased * memberCount));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [memberCount]);

  useEffect(() => {
    if (firmCount === null) return;
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayFirmCount(Math.round(eased * firmCount));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [firmCount]);

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: queryKeys.public.categories({ location, entityType }),
    queryFn: () => publicServices.getCategories({ location, entityType }),
  });

  // An individual can only ever self-apply as a Graduate (GrQS/GrQST) — every other
  // individual class (Associate, Professional, Fellow, Student, Life/Honorary/Visiting) is
  // reached later through mentorship progression, or is created directly by an Admin/Approver
  // or Teacher, never by the applicant themselves. Firms have no such restriction — they apply
  // directly at their own size tier. Same rule the application wizard itself enforces
  // (isGraduateApplicationCategory, dashboard/application/page.tsx), reused here so the public
  // homepage never advertises a category nobody can actually walk in and apply for.
  const displayCategories = (categories || []).filter((c: any) =>
    entityType !== "Individual" || isGraduateApplicationCategory(c)
  );
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
              <h1 className="mt-6 text-3xl font-bold leading-tight md:text-4xl">
                Rwanda Institute of <span className="gold-text">Quantity Surveyors</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/80 leading-relaxed font-sans">
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
              <div className="mt-12 grid max-w-sm grid-cols-2 gap-6 stagger">
                {[
                  { n: memberCount, display: displayMemberCount, l: "Registered Members" },
                  { n: firmCount, display: displayFirmCount, l: "Licensed Firms" },
                ].map(s => (
                  <div key={s.l}>
                    <div className="text-3xl font-bold gold-text tabular-nums">
                      {s.n === null ? (
                        <span className="inline-block h-8 w-14 rounded bg-white/10 animate-pulse align-middle" />
                      ) : (
                        `${s.display}+`
                      )}
                    </div>
                    <div className="text-xs text-white/70 mt-1 font-sans">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Empty on purpose — just preserves this grid's second column width so the text
                column doesn't stretch full-width. The actual hero image sits outside this grid
                (see below), so it can reach the section's true bottom edge on desktop regardless
                of how tall this row ends up. */}
            <div className="hidden md:block" />
          </div>

          {/* On small screens the image is just a normal block in flow, right after the text —
              no absolute positioning, so it can never overlap the CTA buttons/stats above it.
              At md and up it switches to being pinned against the section's own true bottom
              edge instead (not just its grid column's height, which stretches to match the text
              column and would otherwise leave the image floating short of the section's actual
              bottom). aspect-video matches hero.png's real 2048×1152 (16:9) proportions exactly,
              with only one dimension set and the other left auto — so the browser derives it
              from that real ratio instead of a fixed w+h pair distorting the photo, and
              object-contain is just a safety net rather than doing any actual cropping. */}
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            src="/hero.png"
            alt="A quantity surveying professional reviewing site plans on a tablet, on a construction site"
            className="relative bottom-0 mt-10 w-full h-auto aspect-video object-contain md:absolute md:mt-0 md:right-0 md:z-0 md:w-auto md:h-[60%] md:max-h-[420px]"
          />
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
              Individuals join RIQS as Graduates and progress through mentorship to Associate and Professional status — or register your firm directly at its own tier.
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
            ) : displayCategories.length ? (
              displayCategories.map(x => (
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

        {/* ───── Why Join RIQS ───── */}
        <section className="bg-navy/[0.02] dark:bg-zinc-900/10 border-t border-b border-zinc-50 dark:border-zinc-800/40 py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-12 xl:px-6">
            <div className="mx-auto max-w-2xl text-center animate-slide-up">
              <Badge variant="outline" className="border-navy/30 bg-navy/5 text-navy dark:border-zinc-700 dark:text-zinc-300 font-semibold">
                Why RIQS
              </Badge>
              <h2 className="mt-4 text-4xl font-bold text-navy dark:text-white">Why Join RIQS?</h2>
              <p className="mt-3 text-muted-foreground font-sans leading-relaxed">
                RIQS upholds professional standards across the Rwandan construction industry — our portal makes membership verifiable, transparent and accessible.
              </p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
              {[
                { i: Award, t: "Professional Recognition", d: "Gain credibility and be recognised as a competent professional." },
                { i: BookOpen, t: "Continuous Development", d: "Access CPD, training, mentorship and knowledge that grow your expertise." },
                { i: Users, t: "Connect & Collaborate", d: "Network with professionals, employers, institutions and industry leaders." },
                { i: Briefcase, t: "Career & Business Opportunities", d: "Increase your visibility and open doors to new opportunities." },
                { i: Globe2, t: "Beyond Rwanda", d: "Be part of a profession aspiring to regional and international excellence." },
                { i: Landmark, t: "Shape the Future", d: "Contribute to standards, innovation and the future of Quantity Surveying." },
              ].map(x => (
                <Card key={x.t} className="group hover-lift text-center bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                  <CardContent className="p-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center bg-gold/15 text-navy dark:text-white transition-colors group-hover:bg-gold group-hover:text-[#1a1a1a] rounded-md">
                      <x.i className="h-6 w-6 text-gold group-hover:text-[#1a1a1a]" />
                    </div>
                    <h3 className="mt-4 font-bold text-navy dark:text-white text-sm uppercase tracking-wide">{x.t}</h3>
                    <p className="mt-2 text-sm text-muted-foreground font-sans leading-relaxed">{x.d}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Membership Journey ───── */}
        <section className="mx-auto max-w-7xl px-6 md:px-12 xl:px-6 py-24">
          <div className="mx-auto max-w-2xl text-center animate-slide-up">
            <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold font-bold">Your growth path</Badge>
            <h2 className="mt-4 text-4xl font-bold text-navy dark:text-white">Your Membership Journey</h2>
            <p className="mt-3 text-muted-foreground font-sans leading-relaxed">
              Every professional journey is unique — the path forks at Graduate level depending on your route. RIQS is here to support you every step of the way.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 p-1 rounded-md bg-white dark:bg-zinc-950 shadow-sm">
              <button
                onClick={() => setJourneyRoute("Professional")}
                className={cn("px-4 py-1.5 text-sm font-semibold transition-colors rounded", journeyRoute === "Professional" ? "bg-navy text-white shadow" : "text-muted-foreground hover:text-navy dark:hover:text-white")}
              >
                QS Route
              </button>
              <button
                onClick={() => setJourneyRoute("Technologist")}
                className={cn("px-4 py-1.5 text-sm font-semibold transition-colors rounded", journeyRoute === "Technologist" ? "bg-navy text-white shadow" : "text-muted-foreground hover:text-navy dark:hover:text-white")}
              >
                QS Technologist Route
              </button>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-stretch justify-center gap-3 lg:flex-nowrap stagger">
            {JOURNEY_ROUTES[journeyRoute].map((x, i, arr) => (
              <div key={x.t} className="flex items-center gap-3">
                <Card className="hover-lift text-center bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 w-[180px]">
                  <CardContent className="p-5">
                    <div
                      className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-full shadow-sm", x.color === "#f1a500" ? "text-[#1a1a1a]" : "text-white")}
                      style={{ backgroundColor: x.color }}
                    >
                      <x.i className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 font-bold text-navy dark:text-white text-sm uppercase tracking-wide">{x.t}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground font-sans leading-relaxed">{x.d}</p>
                  </CardContent>
                </Card>
                {i < arr.length - 1 && (
                  <ChevronRight className="hidden lg:block h-5 w-5 text-gold shrink-0" />
                )}
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground font-sans">
            Firms follow a separate track — they register directly at their own organizational tier rather than progressing through these individual stages.
          </p>
        </section>

        {/* ───── Who Can Join ───── */}
        <section className="bg-navy/[0.02] dark:bg-zinc-900/10 border-t border-b border-zinc-50 dark:border-zinc-800/40 py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-12 xl:px-6">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-md aspect-[4/3] shadow-xl"
              >
                <img
                  src="https://images.pexels.com/photos/4049519/pexels-photo-4049519.png?auto=compress&cs=tinysrgb&w=1200"
                  alt="A modern glass office building exterior at dusk"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/5 to-transparent" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <Badge variant="outline" className="border-navy/30 bg-navy/5 text-navy dark:border-zinc-700 dark:text-zinc-300 font-semibold">
                  Eligibility
                </Badge>
                <h2 className="mt-4 text-4xl font-bold text-navy dark:text-white leading-tight">Who Can Join?</h2>
                <p className="mt-4 text-muted-foreground font-sans leading-relaxed">
                  RIQS membership is open to individuals and organizations passionate about professional Quantity Surveying.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    "Students", "Firms & Organizations",
                    "Graduates", "Retired Professionals",
                    "Associates", "Academics & Researchers",
                    "Professional Quantity Surveyors",
                  ].map(x => (
                    <div key={x} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                      <span className="text-sm text-foreground/85 dark:text-zinc-300 font-sans">{x}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
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
