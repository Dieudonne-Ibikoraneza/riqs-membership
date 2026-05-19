"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight, Upload, FileText, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  "Practice Location", "Entity Type", "Category", "Personal Info",
  "Education", "Employment", "Mentorship", "Documents", "Review & Submit",
];

export default function Application() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<any>({
    practiceLocation: "Local",
    entityType: "Individual",
    category: "Professional",
    personal: { fullName: "", nationalId: "", dob: "", phone: "", email: "" },
    education: [{ degree: "", institution: "", year: 2026 }],
    employment: [{ company: "", role: "", from: "", to: "" }],
    mentor: { name: "", contact: "" },
    docs: { id: false, photo: false, degree: false, cv: false },
  });

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));
  const pct = Math.round(((step + 1) / STEPS.length) * 100);
  const showMentorship = data.category === "Graduate";
  
  const submit = () => {
    toast.success("Application successfully submitted! You will receive confirmation updates via email.");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header title */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy">Membership Application</h1>
          <p className="text-sm text-muted-foreground font-sans">Complete the steps below — your progress is saved automatically.</p>
        </div>
        <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold font-bold">
          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-gold fill-gold" /> Draft
        </Badge>
      </div>

      {/* Stepper overview */}
      <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-navy font-bold">Step {step + 1} of {STEPS.length}</span>
            <span className="text-muted-foreground">{pct}% complete</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 w-full bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Stepper pills grid */}
          <div className="mt-6 grid grid-cols-3 gap-2 md:grid-cols-9">
            {STEPS.map((s, i) => {
              const done = i < step, active = i === step;
              return (
                <button
                  key={s}
                  onClick={() => i <= step && setStep(i)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 transition-all outline-none",
                    i > step && "cursor-default opacity-60",
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center text-xs font-bold transition-all duration-300",
                    done && "bg-gold text-[#1a1a1a] shadow-gold",
                    active && "bg-navy text-white scale-110 ring-4 ring-navy/15 animate-pulse-gold",
                    !done && !active && "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border border-zinc-200 dark:border-zinc-700",
                  )}>
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn(
                    "text-[10px] text-center leading-tight transition-colors hidden md:block",
                    active ? "font-semibold text-navy" : "text-muted-foreground",
                  )}>
                    {s}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Steps contents */}
      <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
        <CardHeader className="border-b border-zinc-50 dark:border-zinc-800/50 py-4">
          <CardTitle className="text-xl text-navy">{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step}
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {step === 0 && (
                <RadioGroup 
                  value={data.practiceLocation} 
                  onValueChange={v => setData({ ...data, practiceLocation: v })} 
                  className="grid gap-3 md:grid-cols-2"
                >
                  {["Local", "Foreign"].map(o => (
                    <label 
                      key={o} 
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border p-5 transition-all rounded-md",
                        data.practiceLocation === o 
                          ? "border-gold bg-gold/5 shadow-gold/20" 
                          : "border-zinc-250 hover:border-navy/35 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10",
                      )}
                    >
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <div>
                        <div className="font-semibold text-navy">{o} Practitioner</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {o === "Local" ? "Practicing Quantity Surveying inside Rwanda" : "Practicing/based outside Rwanda"}
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}

              {step === 1 && (
                <RadioGroup 
                  value={data.entityType} 
                  onValueChange={v => setData({ ...data, entityType: v })} 
                  className="grid gap-3 md:grid-cols-2"
                >
                  {["Individual", "Firm"].map(o => (
                    <label 
                      key={o} 
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border p-5 transition-all rounded-md",
                        data.entityType === o 
                          ? "border-gold bg-gold/5 shadow-gold/20" 
                          : "border-zinc-250 hover:border-navy/35 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10",
                      )}
                    >
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <div>
                        <div className="font-semibold text-navy">{o} Application</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {o === "Individual" ? "Apply for individual Quantity Surveyor credentials" : "Apply as a corporate firm / practice group"}
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}

              {step === 2 && (
                <div className="max-w-md space-y-1.5">
                  <Label htmlFor="app-cat">Membership category</Label>
                  <Select value={data.category} onValueChange={v => setData({ ...data, category: v })}>
                    <SelectTrigger id="app-cat" className="mt-1 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(data.entityType === "Firm" ? ["Firm"] : ["Student", "Graduate", "Technologist", "Professional", "Fellow"]).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground pt-1 leading-normal">
                    Documentation standards vary based on candidate level.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="app-name">Full Name</Label>
                    <Input id="app-name" value={data.personal.fullName} onChange={e => setData({ ...data, personal: { ...data.personal, fullName: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="app-nid">National ID / Passport</Label>
                    <Input id="app-nid" value={data.personal.nationalId} onChange={e => setData({ ...data, personal: { ...data.personal, nationalId: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="app-dob">Date of Birth</Label>
                    <Input id="app-dob" type="date" value={data.personal.dob} onChange={e => setData({ ...data, personal: { ...data.personal, dob: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="app-phone">Mobile Phone</Label>
                    <Input id="app-phone" value={data.personal.phone} onChange={e => setData({ ...data, personal: { ...data.personal, phone: e.target.value } })} />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="app-email">Email Address</Label>
                    <Input id="app-email" type="email" value={data.personal.email} onChange={e => setData({ ...data, personal: { ...data.personal, email: e.target.value } })} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  {data.education.map((ed: any, i: number) => (
                    <div key={i} className="relative grid gap-3 border border-zinc-150 dark:border-zinc-800 p-4 rounded-md md:grid-cols-12 bg-zinc-50/50 dark:bg-zinc-950/20">
                      <div className="md:col-span-5 space-y-1">
                        <Label htmlFor={`deg-${i}`}>Degree/Qualification</Label>
                        <Input id={`deg-${i}`} value={ed.degree} onChange={e => { const v = [...data.education]; v[i].degree = e.target.value; setData({ ...data, education: v }); }} />
                      </div>
                      <div className="md:col-span-4 space-y-1">
                        <Label htmlFor={`inst-${i}`}>Institution</Label>
                        <Input id={`inst-${i}`} value={ed.institution} onChange={e => { const v = [...data.education]; v[i].institution = e.target.value; setData({ ...data, education: v }); }} />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label htmlFor={`yr-${i}`}>Graduation Year</Label>
                        <Input id={`yr-${i}`} type="number" value={ed.year} onChange={e => { const v = [...data.education]; v[i].year = +e.target.value; setData({ ...data, education: v }); }} />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                        {data.education.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const v = data.education.filter((_: any, idx: number) => idx !== i);
                              setData({ ...data, education: v });
                            }}
                            className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 h-10 w-10 shrink-0"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setData({ ...data, education: [...data.education, { degree: "", institution: "", year: 2026 }] })}
                    className="border-zinc-200 dark:border-zinc-800"
                  >
                    + Add another qualification
                  </Button>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  {data.employment.map((em: any, i: number) => (
                    <div key={i} className="relative grid gap-3 border border-zinc-150 dark:border-zinc-800 p-4 rounded-md md:grid-cols-12 bg-zinc-50/50 dark:bg-zinc-950/20">
                      <div className="md:col-span-3 space-y-1">
                        <Label htmlFor={`emp-co-${i}`}>Company</Label>
                        <Input id={`emp-co-${i}`} value={em.company} onChange={e => { const v = [...data.employment]; v[i].company = e.target.value; setData({ ...data, employment: v }); }} />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <Label htmlFor={`emp-ro-${i}`}>Role</Label>
                        <Input id={`emp-ro-${i}`} value={em.role} onChange={e => { const v = [...data.employment]; v[i].role = e.target.value; setData({ ...data, employment: v }); }} />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label htmlFor={`emp-fr-${i}`}>From</Label>
                        <Input id={`emp-fr-${i}`} type="month" value={em.from} onChange={e => { const v = [...data.employment]; v[i].from = e.target.value; setData({ ...data, employment: v }); }} />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <Label htmlFor={`emp-to-${i}`}>To</Label>
                        <Input id={`emp-to-${i}`} type="month" value={em.to} onChange={e => { const v = [...data.employment]; v[i].to = e.target.value; setData({ ...data, employment: v }); }} />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                        {data.employment.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const v = data.employment.filter((_: any, idx: number) => idx !== i);
                              setData({ ...data, employment: v });
                            }}
                            className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 h-10 w-10 shrink-0"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setData({ ...data, employment: [...data.employment, { company: "", role: "", from: "", to: "" }] })}
                    className="border-zinc-200 dark:border-zinc-800"
                  >
                    + Add employment record
                  </Button>
                </div>
              )}

              {step === 6 && (
                showMentorship ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="ment-name">Mentor's full name</Label>
                      <Input id="ment-name" value={data.mentor.name} onChange={e => setData({ ...data, mentor: { ...data.mentor, name: e.target.value } })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ment-cnt">Mentor's contact (email/phone)</Label>
                      <Input id="ment-cnt" value={data.mentor.contact} onChange={e => setData({ ...data, mentor: { ...data.mentor, contact: e.target.value } })} />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label htmlFor="ment-plan">Mentorship plan</Label>
                      <Textarea id="ment-plan" rows={4} placeholder="Briefly describe your mentorship plan..." />
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-250 dark:border-zinc-800 p-8 text-center text-sm text-muted-foreground rounded-md">
                    Mentorship competency plan is only mandatory for candidate applications under the <strong className="text-navy">Graduate</strong> category. Click Next to continue.
                  </div>
                )
              )}

              {step === 7 && (
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { k: "id", l: "National ID / Passport (PDF)" },
                    { k: "photo", l: "Passport photo (JPG/PNG)" },
                    { k: "degree", l: "Notarized degree / diploma (PDF)" },
                    { k: "cv", l: "Curriculum Vitae (PDF)" },
                  ].map(d => {
                    const done = (data.docs as any)[d.k];
                    return (
                      <label 
                        key={d.k} 
                        className={cn(
                          "flex cursor-pointer items-center gap-3 border border-dashed p-4 transition-all rounded-md",
                          done 
                            ? "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/10" 
                            : "border-zinc-200 dark:border-zinc-800 hover:border-gold hover:bg-gold/5",
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center transition-colors rounded-md",
                          done ? "bg-emerald-500 text-white" : "bg-gold/15 text-navy",
                        )}>
                          {done ? <Check className="h-5 w-5 text-white" /> : <Upload className="h-5 w-5 text-gold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-250">{d.l}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {done ? "File uploaded · click to replace" : "Click to select and upload file"}
                          </div>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={() => { 
                            setData({ ...data, docs: { ...data.docs, [d.k]: true } }); 
                            toast.success("File uploaded successfully"); 
                          }} 
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {step === 8 && (
                <div className="space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-950/40 p-5 text-sm space-y-2.5 rounded-md border border-zinc-100 dark:border-zinc-800">
                    {[
                      ["Practice location", data.practiceLocation],
                      ["Entity type", data.entityType],
                      ["Category Level", data.category],
                      ["Full name on record", data.personal.fullName || "—"],
                      ["Qualifications submitted", `${data.education.length} entry`],
                      ["Uploaded credentials", `${Object.values(data.docs).filter(Boolean).length} of 4 files`],
                    ].map(([k, v]) => (
                      <div key={k as string} className="grid grid-cols-2 gap-2 pb-2 border-b border-zinc-50 dark:border-zinc-800/40 last:border-0 last:pb-0">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-semibold text-navy text-right">{v as any}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-l-4 border-gold bg-gold/10 p-4 text-sm text-[#8a5c00] rounded-r-md leading-relaxed">
                    <FileText className="mr-2 inline h-4 w-4 text-gold" />
                    Once submitted, your membership record and application files will be audited and reviewed by the Council within 5–10 working days.
                  </div>
                  <Button 
                    onClick={submit} 
                    className="w-full h-12 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-bold border-none"
                  >
                    Submit final application
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-2">
        <Button 
          variant="outline" 
          onClick={back} 
          disabled={step === 0}
          className="border-zinc-200 dark:border-zinc-800"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 && (
          <Button 
            onClick={next} 
            className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
