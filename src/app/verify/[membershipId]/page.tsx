"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { publicServices } from "@/services/public.services";
import { queryKeys } from "@/services/queryKeys";
import { PublicHeader, PublicFooter } from "@/components/PublicHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ShieldAlert, ShieldQuestion, BadgeCheck, Calendar, MapPin, Star, Loader2, Mail, Phone,
} from "lucide-react";
import { useState } from "react";

function formatMembershipClass(cls?: string | null) {
  if (!cls) return "";
  const map: Record<string, string> = {
    Firm_Local_Small: "Rwandan Small Firm",
    Firm_Local_Medium: "Rwandan Medium Firm",
    Firm_Local_Large: "Rwandan Large Firm",
    Firm_Foreign_Small: "Non-Rwandan Small Firm",
    Firm_Foreign_Medium: "Non-Rwandan Medium Firm",
    Firm_Foreign_Large: "Non-Rwandan Large Firm",
  };
  return map[cls] || cls.replace(/_/g, " ");
}

export default function VerifyMemberPage() {
  const params = useParams();
  const membershipId = decodeURIComponent(String(params.membershipId || ""));

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.public.verifyMember(membershipId),
    queryFn: () => publicServices.verifyMember(membershipId),
    enabled: !!membershipId,
    retry: false,
  });

  const found = data?.found;
  const isActive = data?.status === "Active";
  const honorsSet = new Set<string>(data?.honors || []);
  const honorsArray = Array.from(honorsSet);
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(data?.hasPhoto) && !photoFailed;
  const initials = (data?.fullName || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden brand-gradient text-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-fade" />
          <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative mx-auto max-w-3xl px-4 py-14 text-center animate-fade-in z-10">
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
              <ShieldCheck className="mr-1 h-3 w-3 text-gold" /> Membership Authenticity Check
            </Badge>
            <h1 className="mt-4 text-3xl font-bold md:text-4xl leading-tight">Member Verification</h1>
            <p className="mt-3 text-white/80 leading-relaxed font-sans">
              Confirming the details behind RIQS membership ID <span className="font-semibold gold-text">{membershipId}</span>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-4 -mt-10 relative z-10 pb-20">
          {isLoading ? (
            <Card className="shadow-navy border-0 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
                <p className="text-sm text-muted-foreground">Checking the register…</p>
              </CardContent>
            </Card>
          ) : found ? (
            <Card className="shadow-navy border-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 animate-slide-up">
              <div className={isActive ? "h-2 bg-emerald-500" : "h-2 bg-amber-500"} />
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {showPhoto ? (
                      <img
                        src={publicServices.getVerifyPhotoUrl(membershipId)}
                        alt={data?.fullName || "Member photo"}
                        onError={() => setPhotoFailed(true)}
                        className="h-20 w-20 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900 shadow-sm"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-navy to-[#14467f] text-xl font-bold text-white ring-2 ring-white dark:ring-zinc-900 shadow-sm">
                        {initials || <ShieldCheck className="h-8 w-8" />}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-900 ${isActive ? "bg-emerald-500" : "bg-amber-500"}`}>
                      {isActive ? (
                        <ShieldCheck className="h-4 w-4 text-white" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-navy dark:text-white">{data?.fullName}</h2>
                  <div className="mt-1 text-xs font-semibold tracking-wider gold-text">{data?.membershipId}</div>
                  {(data?.email || data?.phoneNumber) && (
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {data?.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-gold" /> {data.email}
                        </span>
                      )}
                      {data?.phoneNumber && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-gold" /> {data.phoneNumber}
                        </span>
                      )}
                    </div>
                  )}

                  <Badge
                    className={`mt-4 border-none font-semibold ${isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"}`}
                  >
                    <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
                    {isActive ? "Active — Registered RIQS Member" : "Membership Expired"}
                  </Badge>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <Badge variant="outline" className="border-navy/20 bg-navy/5 text-navy dark:border-zinc-700 dark:text-zinc-300 font-semibold">
                      {data?.categoryName || formatMembershipClass(data?.membershipClass)}
                    </Badge>
                    {honorsArray.map((honor) => (
                      <Badge
                        key={honor}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 shadow-sm bg-amber-100 text-amber-800 border-amber-300 shadow-amber-500/20 uppercase tracking-wider font-bold"
                      >
                        <Star className="h-2.5 w-2.5 mr-1 fill-amber-600 text-amber-600" />
                        {honor}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-8 w-full space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-6 text-left">
                    {data?.practiceLocation && (
                      <div className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                        <MapPin className="h-4 w-4 text-gold shrink-0" />
                        {data.practiceLocation === "Non_Rwandan"
                          ? `Non-Rwandan${data.countryOfOrigin ? ` · ${data.countryOfOrigin}` : ""}`
                          : "Rwandan"}
                      </div>
                    )}
                    {data?.membershipExpiresAt && (
                      <div className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                        <Calendar className="h-4 w-4 text-gold shrink-0" />
                        {isActive ? "Valid until " : "Expired on "}
                        {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(data.membershipExpiresAt))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-navy border-0 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 animate-slide-up">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                  <ShieldQuestion className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-navy dark:text-white">No Match Found</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground font-sans">
                  We could not find a registered RIQS member with the membership ID <span className="font-semibold text-zinc-700 dark:text-zinc-300">{membershipId}</span>. This ID may be incorrect, or the credential is not genuine.
                </p>
              </CardContent>
            </Card>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground font-sans">
            This page verifies membership status only, using the official RIQS register. For any concerns about a specific credential, contact the Secretariat at <span className="font-semibold">info@riqs.rw</span>.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
