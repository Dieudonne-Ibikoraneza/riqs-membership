"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight, Upload, FileText, Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useConfig } from "@/lib/config-store";

const STEPS = [
  "Practice Location", "Entity Type", "Category", "Personal Info",
  "Education", "Employment", "Mentorship", "Documents", "Review & Submit",
];

export default function Application() {
  const { config } = useConfig();
  const [step, setStep] = useState(0);
  const firstIndividualCat = config.categories.find(c => c.id !== "firm")?.id || config.categories[0]?.id;
  const [data, setData] = useState<any>({
    practiceLocationId: config.practiceLocations[0]?.id,
    entityTypeId: config.entityTypes[0]?.id,
    categoryId: firstIndividualCat,
    personal: { fullName: "", nationalId: "", dob: "", phone: "", email: "" },
    education: [{ degree: "", institution: "", year: 2024 }],
    employment: [{ company: "", role: "", from: "", to: "" }],
    mentors: [{ name: "", contact: "", category: "Professional" }],
    docs: {} as Record<string, boolean>,
  });

  const selectedCategory = useMemo(
    () => config.categories.find(c => c.id === data.categoryId),
    [config.categories, data.categoryId]
  );
  const isFirm = data.entityTypeId === "firm";
  const availableCategories = isFirm
    ? config.categories.filter(c => c.id === "firm")
    : config.categories.filter(c => c.id !== "firm");

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));
  const pct = Math.round(((step + 1) / STEPS.length) * 100);
  const isGraduate = selectedCategory?.id === "graduate";
  const submit = () => toast.success("Application submitted! You will be notified via email.");

  const addMentor = () => {
    if (data.mentors.length >= 5) return toast.error("Maximum 5 mentors allowed");
    setData({ ...data, mentors: [...data.mentors, { name: "", contact: "", category: "Professional" }] });
  };
  const removeMentor = (i: number) => setData({ ...data, mentors: data.mentors.filter((_: any, idx: number) => idx !== i) });

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy">Membership Application</h1>
          <p className="text-sm text-muted-foreground">Complete the steps below — your progress is saved automatically.</p>
        </div>
        <Badge variant="outline" className="border-gold/40 bg-gold/10 text-[#8a5c00]">
          <Sparkles className="mr-1 h-3 w-3" /> Draft
        </Badge>
      </div>

      {/* Animated stepper */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-navy">Step {step + 1} of {STEPS.length}</span>
            <span className="text-muted-foreground">{pct}% complete</span>
          </div>
          {/* progress bar */}
          <div className="mt-3 h-2 w-full bg-muted relative overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Step pills */}
          <div className="mt-6 grid grid-cols-3 gap-2 md:grid-cols-9">
            {STEPS.map((s, i) => {
              const done = i < step, active = i === step;
              return (
                <button
                  key={s}
                  onClick={() => i <= step && setStep(i)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 transition-all",
                    i > step && "cursor-default opacity-60",
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center text-xs font-bold transition-all duration-300",
                    done && "bg-gold text-[#1a1a1a] shadow-gold",
                    active && "bg-navy text-white scale-110 ring-4 ring-navy/15",
                    !done && !active && "bg-muted text-muted-foreground border border-border",
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

      {/* Step body */}
      <Card key={step} className="border-0 shadow-sm bg-white animate-slide-up">
        <CardHeader className="border-b">
          <CardTitle className="text-xl text-navy">{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {step === 0 && (
            <RadioGroup value={data.practiceLocationId} onValueChange={v => setData({ ...data, practiceLocationId: v })} className="grid gap-3 md:grid-cols-2">
              {config.practiceLocations.map(o => (
                <label key={o.id} className={cn(
                  "flex cursor-pointer items-start gap-3 border p-5 transition-all",
                  data.practiceLocationId === o.id ? "border-gold bg-gold/5 shadow-gold" : "hover:border-navy/30",
                )}>
                  <RadioGroupItem value={o.id} className="mt-0.5" />
                  <div>
                    <div className="font-semibold text-navy">{o.name}</div>
                    <div className="text-sm text-muted-foreground">{o.description}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          )}

          {step === 1 && (
            <RadioGroup value={data.entityTypeId} onValueChange={v => {
              const nextCats = v === "firm" ? config.categories.filter(c => c.id === "firm") : config.categories.filter(c => c.id !== "firm");
              setData({ ...data, entityTypeId: v, categoryId: nextCats[0]?.id });
            }} className="grid gap-3 md:grid-cols-2">
              {config.entityTypes.map(o => (
                <label key={o.id} className={cn(
                  "flex cursor-pointer items-start gap-3 border p-5 transition-all",
                  data.entityTypeId === o.id ? "border-gold bg-gold/5 shadow-gold" : "hover:border-navy/30",
                )}>
                  <RadioGroupItem value={o.id} className="mt-0.5" />
                  <div>
                    <div className="font-semibold text-navy">{o.name}</div>
                    <div className="text-sm text-muted-foreground">{o.description}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          )}

          {step === 2 && (
            <div className="max-w-xl">
              <Label>Membership category</Label>
              <Select value={data.categoryId} onValueChange={v => setData({ ...data, categoryId: v })}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <p className="mt-2 text-xs text-muted-foreground">{selectedCategory.description}</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Full Name</Label><Input value={data.personal.fullName} onChange={e => setData({ ...data, personal: { ...data.personal, fullName: e.target.value } })} /></div>
              <div><Label>National ID / Passport</Label><Input value={data.personal.nationalId} onChange={e => setData({ ...data, personal: { ...data.personal, nationalId: e.target.value } })} /></div>
              <div><Label>Date of Birth</Label><Input type="date" value={data.personal.dob} onChange={e => setData({ ...data, personal: { ...data.personal, dob: e.target.value } })} /></div>
              <div><Label>Phone</Label><Input value={data.personal.phone} onChange={e => setData({ ...data, personal: { ...data.personal, phone: e.target.value } })} /></div>
              <div className="md:col-span-2"><Label>Email</Label><Input type="email" value={data.personal.email} onChange={e => setData({ ...data, personal: { ...data.personal, email: e.target.value } })} /></div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              {data.education.map((ed: any, i: number) => (
                <div key={i} className="grid gap-3 border p-4 md:grid-cols-3">
                  <div><Label>Degree</Label><Input value={ed.degree} onChange={e => { const v = [...data.education]; v[i].degree = e.target.value; setData({ ...data, education: v }); }} /></div>
                  <div><Label>Institution</Label><Input value={ed.institution} onChange={e => { const v = [...data.education]; v[i].institution = e.target.value; setData({ ...data, education: v }); }} /></div>
                  <div><Label>Year</Label><Input type="number" value={ed.year} onChange={e => { const v = [...data.education]; v[i].year = +e.target.value; setData({ ...data, education: v }); }} /></div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setData({ ...data, education: [...data.education, { degree: "", institution: "", year: 2024 }] })}>+ Add another qualification</Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              {data.employment.map((em: any, i: number) => (
                <div key={i} className="grid gap-3 border p-4 md:grid-cols-4">
                  <div><Label>Company</Label><Input value={em.company} onChange={e => { const v = [...data.employment]; v[i].company = e.target.value; setData({ ...data, employment: v }); }} /></div>
                  <div><Label>Role</Label><Input value={em.role} onChange={e => { const v = [...data.employment]; v[i].role = e.target.value; setData({ ...data, employment: v }); }} /></div>
                  <div><Label>From</Label><Input type="month" value={em.from} onChange={e => { const v = [...data.employment]; v[i].from = e.target.value; setData({ ...data, employment: v }); }} /></div>
                  <div><Label>To</Label><Input type="month" value={em.to} onChange={e => { const v = [...data.employment]; v[i].to = e.target.value; setData({ ...data, employment: v }); }} /></div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setData({ ...data, employment: [...data.employment, { company: "", role: "", from: "", to: "" }] })}>+ Add employment</Button>
            </div>
          )}

          {step === 6 && (
            isGraduate ? (
              <div className="space-y-4">
                <div className="border-l-4 border-gold bg-gold/10 p-4 text-sm text-[#8a5c00]">
                  As a Graduate applicant, you must be assigned to a registered Mentor (a Professional or Technologist) for promotion to Technologist or Professional standing. Each Mentor can supervise <strong>up to 5 graduates</strong>. Nominate your preferred mentor below — the secretariat will confirm availability.
                </div>
                {data.mentors.map((m: any, i: number) => (
                  <div key={i} className="grid gap-3 border p-4 md:grid-cols-[1fr_1fr_180px_auto]">
                    <div><Label>Mentor's full name</Label><Input value={m.name} onChange={e => { const v = [...data.mentors]; v[i].name = e.target.value; setData({ ...data, mentors: v }); }} /></div>
                    <div><Label>Contact (email/phone)</Label><Input value={m.contact} onChange={e => { const v = [...data.mentors]; v[i].contact = e.target.value; setData({ ...data, mentors: v }); }} /></div>
                    <div>
                      <Label>Mentor category</Label>
                      <Select value={m.category} onValueChange={val => { const v = [...data.mentors]; v[i].category = val; setData({ ...data, mentors: v }); }}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Technologist">Technologist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      {data.mentors.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeMentor(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{data.mentors.length} / 5 mentor nominations</p>
                  <Button variant="outline" size="sm" onClick={addMentor} disabled={data.mentors.length >= 5}><Plus className="mr-1 h-3 w-3" /> Add another mentor option</Button>
                </div>
                <div><Label>Mentorship plan</Label><Textarea rows={4} placeholder="Briefly describe your mentorship plan and learning goals..." /></div>
              </div>
            ) : (
              <div className="border border-dashed p-8 text-center text-sm text-muted-foreground">
                Mentorship is only required for the <strong className="text-navy">Graduate</strong> category. Click Next to continue.
              </div>
            )
          )}

          {step === 7 && (
            <div className="grid gap-3 md:grid-cols-2">
              {selectedCategory?.documents.map(d => {
                const done = !!data.docs[d.id];
                return (
                  <label key={d.id} className={cn(
                    "flex cursor-pointer items-center gap-3 border border-dashed p-4 transition-all",
                    done ? "border-emerald-300 bg-emerald-50/40" : "hover:border-gold hover:bg-gold/5",
                  )}>
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center transition-colors",
                      done ? "bg-emerald-500 text-white" : "bg-gold/15 text-navy",
                    )}>
                      {done ? <Check className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{d.name} {d.required && <span className="text-destructive">*</span>}</div>
                      <div className="text-xs text-muted-foreground">{done ? "Uploaded · click to replace" : "Click to upload"}</div>
                    </div>
                    <input type="file" className="hidden" onChange={() => { setData({ ...data, docs: { ...data.docs, [d.id]: true } }); toast.success("File uploaded"); }} />
                  </label>
                );
              })}
              {!selectedCategory?.documents.length && (
                <div className="md:col-span-2 border border-dashed p-6 text-center text-sm text-muted-foreground">No documents required for this category.</div>
              )}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-muted/40 p-5 text-sm space-y-2">
                {[
                  ["Practice location", config.practiceLocations.find(p => p.id === data.practiceLocationId)?.name],
                  ["Entity type", config.entityTypes.find(p => p.id === data.entityTypeId)?.name],
                  ["Category", selectedCategory?.name],
                  ["Full name", data.personal.fullName || "—"],
                  ["Qualifications", data.education.length],
                  ["Mentor nominations", isGraduate ? data.mentors.length : "N/A"],
                  ["Documents uploaded", `${Object.values(data.docs).filter(Boolean).length} / ${selectedCategory?.documents.length || 0}`],
                ].map(([k, v]) => (
                  <div key={k as string} className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-navy">{v as any}</span>
                  </div>
                ))}
              </div>
              <div className="border-l-4 border-gold bg-gold/10 p-4 text-sm text-[#8a5c00]">
                <FileText className="mr-2 inline h-4 w-4" />
                Once submitted, your application will be reviewed within 5–10 working days.
              </div>
              <Button onClick={submit} className="w-full h-12 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold">
                Submit application
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={back} disabled={step === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 && (
          <Button onClick={next} className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold">
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
