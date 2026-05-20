"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { MonthYearPicker } from "@/components/ui/month-picker";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Application() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<any>({
    practiceLocation: "Local",
    entityType: "Individual",
    category: "Graduate",
    personal: {
      fullName: "",
      nationalId: "",
      dob: "",
      phone: "",
      email: "",
      residentAddress: { district: "", sector: "", cell: "", village: "" },
      yearsInProfession: "",
      countryOfOrigin: "Rwanda",
      firmName: "",
      firmAddress: "",
      shareholders: [{ fullName: "", email: "", phone: "", membershipId: "" }],
    },
    education: [
      {
        degree: "",
        institution: "",
        year: 2026,
        studyField: "",
        startMonthYear: "",
      },
    ],
    employment: [{ company: "", role: "", from: "", to: "" }],
    mentor: { name: "", regId: "", plan: "" },
    docs: {},
  });

  const STEPS = useMemo(() => {
    const list = [
      "Practice Location",
      "Entity Type",
      "Category",
      "Profile Details",
      "Employment Record",
    ];
    if (data.entityType === "Individual") {
      list.push("Education History");
      if (data.category === "Graduate") {
        list.push("Mentorship Plan");
      }
    }
    list.push("Document Vault");
    list.push("Review & Submit");
    return list;
  }, [data.entityType, data.category]);

  useEffect(() => {
    if (step >= STEPS.length) {
      setStep(STEPS.length - 1);
    }
  }, [STEPS, step]);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  const categoriesList = useMemo(() => {
    if (data.entityType === "Individual") {
      if (data.practiceLocation === "Local") {
        return ["Graduate", "Technologist", "Professional"];
      } else {
        return ["Technologist", "Professional"];
      }
    } else {
      if (data.practiceLocation === "Local") {
        return [
          "Small Firm - Annual turnover less than 50 Million RWF",
          "Medium Firm - Annual turnover between 50-100 Million RWF",
          "Large Firm - Annual turnover above 100 Million RWF",
        ];
      } else {
        return [
          "Small Firm - Annual turnover less than 100,000 USD",
          "Medium Firm - Annual turnover between 100,000-500,000 USD",
          "Large Firm - Annual turnover above 500,000 USD",
        ];
      }
    }
  }, [data.practiceLocation, data.entityType]);

  const updateLocation = (loc: string) => {
    const nextCat =
      data.entityType === "Individual"
        ? loc === "Local"
          ? "Graduate"
          : "Technologist"
        : loc === "Local"
          ? "Small Firm - Annual turnover less than 50 Million RWF"
          : "Small Firm - Annual turnover less than 100,000 USD";
    setData((d: any) => ({ ...d, practiceLocation: loc, category: nextCat }));
  };

  const updateEntity = (ent: string) => {
    const nextCat =
      ent === "Individual"
        ? data.practiceLocation === "Local"
          ? "Graduate"
          : "Technologist"
        : data.practiceLocation === "Local"
          ? "Small Firm - Annual turnover less than 50 Million RWF"
          : "Small Firm - Annual turnover less than 100,000 USD";
    setData((d: any) => ({ ...d, entityType: ent, category: nextCat }));
  };

  const documentChecklist = useMemo(() => {
    const list = [];
    if (data.entityType === "Individual") {
      if (data.practiceLocation === "Local") {
        if (data.category === "Graduate") {
          list.push({
            k: "degree",
            l: "Notarized Degree/Diploma (HEC equivalency if foreign)",
            r: true,
          });
          list.push({
            k: "transcripts",
            l: "Notarized Academic Transcripts showing subjects",
            r: false,
          });
          list.push({
            k: "rqssa",
            l: "Certificate of RQSSA (or equivalent student membership proof)",
            r: true,
          });
          list.push({ k: "letter", l: "Application Letter", r: true });
          list.push({ k: "id", l: "Copy of ID / Passport", r: true });
          list.push({ k: "photo", l: "Passport Photo", r: true });
          list.push({ k: "cv", l: "Curriculum Vitae (CV)", r: false });
          list.push({
            k: "payment",
            l: "Proof of Momo Payment (10,000 RWF via Momo Code: 604516)",
            r: false,
          });
        } else if (data.category === "Technologist") {
          list.push({
            k: "degree",
            l: "Diploma Certificate (HEC equivalency if foreign)",
            r: true,
          });
          list.push({
            k: "transcripts",
            l: "Notarized Academic Transcripts showing subjects",
            r: true,
          });
          list.push({
            k: "rqssa",
            l: "Certificate of RQSSA (not foreign)",
            r: false,
          });
          list.push({
            k: "cpd",
            l: "At least 2 CPD Activities certificate copies",
            r: false,
          });
          list.push({ k: "logbook", l: "Logbook of records", r: false });
          list.push({ k: "letter", l: "Application Letter", r: true });
          list.push({ k: "id", l: "Copy of ID / Passport", r: true });
          list.push({ k: "photo", l: "Passport Photo", r: true });
          list.push({ k: "cv", l: "Curriculum Vitae (CV)", r: false });
          list.push({
            k: "payment",
            l: "Proof of Momo Payment (10,000 RWF via Momo Code: 604516)",
            r: false,
          });
        } else {
          // Professional
          list.push({
            k: "degree",
            l: "Notarized Degree Certificate (HEC equivalent if foreign)",
            r: true,
          });
          list.push({
            k: "transcripts",
            l: "Notarized Academic Transcripts showing subjects",
            r: true,
          });
          list.push({
            k: "rqssa",
            l: "Certificate of RQSSA (not foreign)",
            r: false,
          });
          list.push({
            k: "cpd",
            l: "At least 2 CPD Activities certificate copies",
            r: false,
          });
          list.push({ k: "logbook", l: "Logbook of records", r: false });
          list.push({ k: "letter", l: "Application Letter", r: true });
          list.push({ k: "id", l: "Copy of ID / Passport", r: true });
          list.push({ k: "photo", l: "Passport Photo", r: true });
          list.push({ k: "cv", l: "Curriculum Vitae (CV)", r: false });
          list.push({
            k: "payment",
            l: "Proof of Momo Payment (10,000 RWF via Momo Code: 604516)",
            r: false,
          });
        }
      } else {
        // Foreign Individual
        const isProf = data.category === "Professional";
        list.push({
          k: "degree",
          l: isProf
            ? "Notarized Degree Certificate"
            : "Notarized Diploma Certificate",
          r: true,
        });
        list.push({
          k: "membershipOrigin",
          l: "Valid Membership Certificate from country of origin",
          r: true,
        });
        list.push({ k: "permit", l: "Visa & Work Permit (PDF)", r: true });
        list.push({ k: "photo", l: "Passport Photo (JPG/PNG)", r: true });
        list.push({ k: "cv", l: "CV & References (PDF)", r: false });
        list.push({
          k: "payment",
          l: `Proof of Payment (${isProf ? "50 USD" : "30 USD"} Application Fee)`,
          r: false,
        });
      }
    } else {
      // Firm Application
      const isLocal = data.practiceLocation === "Local";
      list.push({
        k: "firmCert",
        l: isLocal
          ? "Firm Business Registration Certificate by RDB"
          : "Firm Business Registration Certificate",
        r: true,
      });
      list.push({ k: "taxClearance", l: "Tax Clearance Certificate", r: true });
      list.push({
        k: "socialSecurity",
        l: isLocal
          ? "RSSB Tax Clearance Certificate"
          : "Social Security Clearance Certificate",
        r: false,
      });
      if (isLocal) {
        list.push({
          k: "staffCertificates",
          l: "RIQS Members working in the firm (Certificates)",
          r: false,
        });
      }
      const fee = data.category.includes("Small")
        ? isLocal
          ? "100,000 RWF"
          : "100 USD"
        : data.category.includes("Medium")
          ? isLocal
            ? "200,000 RWF"
            : "200 USD"
          : isLocal
            ? "300,000 RWF"
            : "300 USD";
      list.push({
        k: "payment",
        l: `Proof of Payment (${fee} Application Fee)`,
        r: false,
      });
    }
    return list;
  }, [data.practiceLocation, data.entityType, data.category]);

  const submit = () => {
    toast.success(
      "Application successfully submitted! You will receive confirmation updates via email.",
    );
  };

  const currentStepName = STEPS[step];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header title */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy">
            Membership Application
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            Complete the steps below — your progress is saved automatically.
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-gold/40 bg-gold/10 text-gold font-bold"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-gold fill-gold" /> Draft
        </Badge>
      </div>

      {/* Stepper overview */}
      <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-navy font-bold">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-muted-foreground">{pct}% complete</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 w-full bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-4 lg:flex-nowrap lg:justify-between">
            {STEPS.map((s, i) => {
              const done = i < step,
                active = i === step;
              return (
                <button
                  key={s}
                  onClick={() => i <= step && setStep(i)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 transition-all outline-none",
                    "w-[calc(33.333%-1rem)] md:w-[calc(25%-1rem)] lg:w-auto lg:flex-1",
                    i > step && "cursor-default opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center text-xs font-bold transition-all duration-300",
                      done && "bg-gold text-[#1a1a1a] shadow-gold",
                      active &&
                        "bg-navy text-white scale-110 ring-4 ring-navy/15 animate-pulse-gold",
                      !done &&
                        !active &&
                        "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border border-zinc-200 dark:border-zinc-700",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] text-center leading-tight transition-colors block mt-1 max-w-[110px] break-words whitespace-normal font-sans",
                      active ? "text-navy font-bold" : "text-muted-foreground",
                    )}
                  >
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
          <CardTitle className="text-xl text-navy">{currentStepName}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepName}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {currentStepName === "Practice Location" && (
                <RadioGroup
                  value={data.practiceLocation}
                  onValueChange={updateLocation}
                  className="grid gap-3 md:grid-cols-2"
                >
                  {["Local", "Foreign"].map((o) => (
                    <label
                      key={o}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border p-5 transition-all rounded-md",
                        data.practiceLocation === o
                          ? "border-gold bg-gold/5 shadow-gold/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-navy/35 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10",
                      )}
                    >
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <div>
                        <div className="font-semibold text-navy">
                          {o} Practitioner
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5 font-sans">
                          {o === "Local"
                            ? "Practicing Quantity Surveying inside Rwanda"
                            : "Practicing/based outside Rwanda"}
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}

              {currentStepName === "Entity Type" && (
                <RadioGroup
                  value={data.entityType}
                  onValueChange={updateEntity}
                  className="grid gap-3 md:grid-cols-2"
                >
                  {["Individual", "Firm"].map((o) => (
                    <label
                      key={o}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 border p-5 transition-all rounded-md",
                        data.entityType === o
                          ? "border-gold bg-gold/5 shadow-gold/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-navy/35 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10",
                      )}
                    >
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <div>
                        <div className="font-semibold text-navy">
                          {o} Application
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5 font-sans">
                          {o === "Individual"
                            ? "Apply for individual Quantity Surveyor credentials"
                            : "Apply as a corporate firm / practice group"}
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}

              {currentStepName === "Category" && (
                <div className="max-w-md space-y-1.5">
                  <Label htmlFor="app-cat">Membership Category Level</Label>
                  <Select
                    value={data.category}
                    onValueChange={(v) => setData({ ...data, category: v })}
                  >
                    <SelectTrigger
                      id="app-cat"
                      className="mt-1 h-11 border-zinc-200 dark:border-zinc-800"
                    >
                      <SelectValue placeholder="Select Category Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesList.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground pt-1 leading-normal font-sans">
                    Required document checklist and assessment tiers vary based
                    on candidate level.
                  </p>
                </div>
              )}

              {currentStepName === "Profile Details" &&
                (data.entityType === "Individual" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="app-name">Full Names</Label>
                      <Input
                        id="app-name"
                        placeholder="e.g. John Doe"
                        value={data.personal.fullName}
                        onChange={(e) =>
                          setData({
                            ...data,
                            personal: {
                              ...data.personal,
                              fullName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="app-nid">
                        National ID / Passport Number
                      </Label>
                      <Input
                        id="app-nid"
                        placeholder="e.g. 1199080012345678"
                        value={data.personal.nationalId}
                        onChange={(e) =>
                          setData({
                            ...data,
                            personal: {
                              ...data.personal,
                              nationalId: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="app-dob">Date of Birth</Label>
                      <Input
                        id="app-dob"
                        type="date"
                        placeholder="Select birth date"
                        value={data.personal.dob}
                        onChange={(e) =>
                          setData({
                            ...data,
                            personal: { ...data.personal, dob: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="app-phone">
                        Mobile Phone (with country code)
                      </Label>
                      <Input
                        id="app-phone"
                        placeholder="e.g. +250 788 000 000"
                        value={data.personal.phone}
                        onChange={(e) =>
                          setData({
                            ...data,
                            personal: {
                              ...data.personal,
                              phone: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="app-email">Primary Email Address</Label>
                      <Input
                        id="app-email"
                        placeholder="e.g. john.doe@example.com"
                        type="email"
                        value={data.personal.email}
                        onChange={(e) =>
                          setData({
                            ...data,
                            personal: {
                              ...data.personal,
                              email: e.target.value,
                            },
                          })
                        }
                      />
                    </div>

                    {data.practiceLocation === "Foreign" && (
                      <div className="space-y-1">
                        <Label htmlFor="app-origin">Country of Origin</Label>
                        <Input
                          id="app-origin"
                          placeholder="e.g. Kenya"
                          value={data.personal.countryOfOrigin}
                          onChange={(e) =>
                            setData({
                              ...data,
                              personal: {
                                ...data.personal,
                                countryOfOrigin: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    )}

                    {(data.category === "Technologist" ||
                      data.category === "Professional") && (
                      <div className="space-y-1">
                        <Label htmlFor="app-years">Years in Profession</Label>
                        <Input
                          id="app-years"
                          type="number"
                          min={0}
                          placeholder="e.g. 5"
                          value={data.personal.yearsInProfession}
                          onChange={(e) =>
                            setData({
                              ...data,
                              personal: {
                                ...data.personal,
                                yearsInProfession: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    )}

                    {data.practiceLocation === "Local" && (
                      <div className="md:col-span-2 border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 dark:bg-zinc-950/20 space-y-3">
                        <h4 className="font-semibold text-sm text-navy">
                          Resident Address (Optional)
                        </h4>
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                          <div className="space-y-1">
                            <Label htmlFor="addr-dist">District</Label>
                            <Input
                              id="addr-dist"
                              placeholder="e.g. Gasabo"
                              value={data.personal.residentAddress.district}
                              onChange={(e) =>
                                setData({
                                  ...data,
                                  personal: {
                                    ...data.personal,
                                    residentAddress: {
                                      ...data.personal.residentAddress,
                                      district: e.target.value,
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="addr-sect">Sector</Label>
                            <Input
                              id="addr-sect"
                              placeholder="e.g. Kimihurura"
                              value={data.personal.residentAddress.sector}
                              onChange={(e) =>
                                setData({
                                  ...data,
                                  personal: {
                                    ...data.personal,
                                    residentAddress: {
                                      ...data.personal.residentAddress,
                                      sector: e.target.value,
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="addr-cell">Cell</Label>
                            <Input
                              id="addr-cell"
                              placeholder="e.g. Rugando"
                              value={data.personal.residentAddress.cell}
                              onChange={(e) =>
                                setData({
                                  ...data,
                                  personal: {
                                    ...data.personal,
                                    residentAddress: {
                                      ...data.personal.residentAddress,
                                      cell: e.target.value,
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="addr-vill">Village</Label>
                            <Input
                              id="addr-vill"
                              placeholder="e.g. Altena"
                              value={data.personal.residentAddress.village}
                              onChange={(e) =>
                                setData({
                                  ...data,
                                  personal: {
                                    ...data.personal,
                                    residentAddress: {
                                      ...data.personal.residentAddress,
                                      village: e.target.value,
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Representative details */}
                    <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 dark:bg-zinc-950/20 space-y-4">
                      <h3 className="font-semibold text-base text-navy">
                        Personal / Representative Information
                      </h3>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                          <Label htmlFor="rep-name">Full Names</Label>
                          <Input
                            id="rep-name"
                            placeholder="e.g. Jane Doe"
                            value={data.personal.fullName}
                            onChange={(e) =>
                              setData({
                                ...data,
                                personal: {
                                  ...data.personal,
                                  fullName: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="rep-email">
                            Representative Email
                          </Label>
                          <Input
                            id="rep-email"
                            placeholder="e.g. representative@firm.com"
                            type="email"
                            value={data.personal.email}
                            onChange={(e) =>
                              setData({
                                ...data,
                                personal: {
                                  ...data.personal,
                                  email: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="rep-phone">
                            Representative Phone
                          </Label>
                          <Input
                            id="rep-phone"
                            placeholder="e.g. +250 788 000 000"
                            value={data.personal.phone}
                            onChange={(e) =>
                              setData({
                                ...data,
                                personal: {
                                  ...data.personal,
                                  phone: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Firm credentials */}
                    <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 dark:bg-zinc-950/20 space-y-4">
                      <h3 className="font-semibold text-base text-navy">
                        Firm Information
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="firm-name">
                            Registered Firm Name
                          </Label>
                          <Input
                            id="firm-name"
                            placeholder="e.g. Apex Surveyors Ltd"
                            value={data.personal.firmName}
                            onChange={(e) =>
                              setData({
                                ...data,
                                personal: {
                                  ...data.personal,
                                  firmName: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="firm-addr">Firm Office Address</Label>
                          <Input
                            id="firm-addr"
                            placeholder="e.g. KN 3 Rd, Kigali"
                            value={data.personal.firmAddress}
                            onChange={(e) =>
                              setData({
                                ...data,
                                personal: {
                                  ...data.personal,
                                  firmAddress: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shareholders */}
                    <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 dark:bg-zinc-950/20 space-y-4">
                      <h3 className="font-semibold text-base text-navy">
                        Firm Shareholders
                      </h3>
                      {data.personal.shareholders.map((sh: any, i: number) => (
                        <div
                          key={i}
                          className="relative grid gap-3 border border-zinc-100 dark:border-zinc-800 p-4 rounded-md md:grid-cols-12 bg-white dark:bg-zinc-900 shadow-sm"
                        >
                          <div className="md:col-span-3 space-y-1">
                            <Label htmlFor={`sh-name-${i}`}>
                              Shareholder Name
                            </Label>
                            <Input
                              id={`sh-name-${i}`}
                              placeholder="e.g. Alice Umuhoza"
                              value={sh.fullName}
                              onChange={(e) => {
                                const v = [...data.personal.shareholders];
                                v[i].fullName = e.target.value;
                                setData({
                                  ...data,
                                  personal: {
                                    ...data.personal,
                                    shareholders: v,
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <Label htmlFor={`sh-email-${i}`}>
                              Email Address
                            </Label>
                            <Input
                              id={`sh-email-${i}`}
                              placeholder="e.g. alice@example.com"
                              type="email"
                              value={sh.email}
                              onChange={(e) => {
                                const v = [...data.personal.shareholders];
                                v[i].email = e.target.value;
                                setData({
                                  ...data,
                                  personal: {
                                    ...data.personal,
                                    shareholders: v,
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="md:col-span-3 space-y-1">
                            <Label htmlFor={`sh-phone-${i}`}>
                              Phone Number
                            </Label>
                            <Input
                              id={`sh-phone-${i}`}
                              placeholder="e.g. +250 788 000 000"
                              value={sh.phone}
                              onChange={(e) => {
                                const v = [...data.personal.shareholders];
                                v[i].phone = e.target.value;
                                setData({
                                  ...data,
                                  personal: {
                                    ...data.personal,
                                    shareholders: v,
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <Label htmlFor={`sh-id-${i}`}>
                              RIQS ID (Optional)
                            </Label>
                            <Input
                              id={`sh-id-${i}`}
                              placeholder="e.g. RIQS-2026-M-045"
                              value={sh.membershipId}
                              onChange={(e) => {
                                const v = [...data.personal.shareholders];
                                v[i].membershipId = e.target.value;
                                setData({
                                  ...data,
                                  personal: {
                                    ...data.personal,
                                    shareholders: v,
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                            {data.personal.shareholders.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const v = data.personal.shareholders.filter(
                                    (_: any, idx: number) => idx !== i,
                                  );
                                  setData({
                                    ...data,
                                    personal: {
                                      ...data.personal,
                                      shareholders: v,
                                    },
                                  });
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
                        onClick={() =>
                          setData({
                            ...data,
                            personal: {
                              ...data.personal,
                              shareholders: [
                                ...data.personal.shareholders,
                                {
                                  fullName: "",
                                  email: "",
                                  phone: "",
                                  membershipId: "",
                                },
                              ],
                            },
                          })
                        }
                        className="border-zinc-200 dark:border-zinc-800"
                      >
                        + Add Shareholder
                      </Button>
                    </div>
                  </div>
                ))}

              {currentStepName === "Employment Record" && (
                <div className="space-y-4">
                  <div className="border border-zinc-150 dark:border-zinc-800 bg-amber-50/20 text-amber-900 dark:text-amber-400 p-4 text-xs rounded-md">
                    Please provide employment details. If currently not
                    employed, you can provide previously active employment
                    history.
                  </div>
                  {data.employment.map((em: any, i: number) => (
                    <div
                      key={i}
                      className="relative grid gap-4 border border-zinc-150 dark:border-zinc-800 p-4 rounded-md md:grid-cols-12 bg-zinc-50/50 dark:bg-zinc-950/20"
                    >
                      {/* Row 1 */}
                      <div className="md:col-span-6 space-y-1">
                        <Label
                          htmlFor={`emp-co-${i}`}
                          className="whitespace-nowrap truncate"
                        >
                          Company / Firm Name
                        </Label>
                        <Input
                          id={`emp-co-${i}`}
                          placeholder="e.g. Horizon Construction"
                          value={em.company}
                          onChange={(e) => {
                            const v = [...data.employment];
                            v[i].company = e.target.value;
                            setData({ ...data, employment: v });
                          }}
                        />
                      </div>
                      <div className="md:col-span-6 space-y-1">
                        <Label
                          htmlFor={`emp-ro-${i}`}
                          className="whitespace-nowrap truncate"
                        >
                          Job Title / Role
                        </Label>
                        <Input
                          id={`emp-ro-${i}`}
                          placeholder="e.g. Senior Quantity Surveyor"
                          value={em.role}
                          onChange={(e) => {
                            const v = [...data.employment];
                            v[i].role = e.target.value;
                            setData({ ...data, employment: v });
                          }}
                        />
                      </div>

                      {/* Row 2 */}
                      <div className="md:col-span-5 space-y-1">
                        <Label
                          htmlFor={`emp-fr-${i}`}
                          className="whitespace-nowrap truncate"
                        >
                          From (Month/Year)
                        </Label>
                        <MonthYearPicker
                          id={`emp-fr-${i}`}
                          value={em.from}
                          placeholder="Select start date"
                          onChange={(val) => {
                            const v = [...data.employment];
                            v[i].from = val;
                            setData({ ...data, employment: v });
                          }}
                        />
                      </div>
                      <div className="md:col-span-6 space-y-1">
                        <Label
                          htmlFor={`emp-to-${i}`}
                          className="whitespace-nowrap truncate"
                        >
                          To (Month/Year)
                        </Label>
                        <MonthYearPicker
                          id={`emp-to-${i}`}
                          value={em.to}
                          allowPresent={true}
                          placeholder="Select end date or 'Present'"
                          onChange={(val) => {
                            const v = [...data.employment];
                            v[i].to = val;
                            setData({ ...data, employment: v });
                          }}
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                        {data.employment.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const v = data.employment.filter(
                                (_: any, idx: number) => idx !== i,
                              );
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
                    onClick={() =>
                      setData({
                        ...data,
                        employment: [
                          ...data.employment,
                          { company: "", role: "", from: "", to: "" },
                        ],
                      })
                    }
                    className="border-zinc-200 dark:border-zinc-800"
                  >
                    + Add employment record
                  </Button>
                </div>
              )}

              {currentStepName === "Education History" && (
                <div className="space-y-4">
                  {data.education.map((ed: any, i: number) => (
                    <div
                      key={i}
                      className="relative grid gap-4 border border-zinc-150 dark:border-zinc-800 p-4 rounded-md md:grid-cols-12 bg-zinc-50/50 dark:bg-zinc-950/20"
                    >
                      {/* Row 1 */}
                      <div className="md:col-span-6 space-y-1">
                        <Label
                          htmlFor={`inst-${i}`}
                          className="whitespace-nowrap truncate"
                        >
                          University / Polytechnic
                        </Label>
                        <Input
                          id={`inst-${i}`}
                          placeholder="e.g. University of Rwanda"
                          value={ed.institution}
                          onChange={(e) => {
                            const v = [...data.education];
                            v[i].institution = e.target.value;
                            setData({ ...data, education: v });
                          }}
                        />
                      </div>
                      <div className="md:col-span-6 space-y-1">
                        <Label
                          htmlFor={`field-${i}`}
                          className="whitespace-nowrap truncate"
                        >
                          Field Of Study
                        </Label>
                        <Input
                          id={`field-${i}`}
                          placeholder="e.g. Quantity Surveying"
                          value={ed.studyField}
                          onChange={(e) => {
                            const v = [...data.education];
                            v[i].studyField = e.target.value;
                            setData({ ...data, education: v });
                          }}
                        />
                      </div>

                      {/* Row 2 */}
                      <div className="md:col-span-6 space-y-1">
                        <Label
                          htmlFor={`deg-${i}`}
                          className="whitespace-nowrap truncate"
                        >
                          Degree Type
                        </Label>
                        <Select
                          value={ed.degree}
                          onValueChange={(val) => {
                            const v = [...data.education];
                            v[i].degree = val;
                            setData({ ...data, education: v });
                          }}
                        >
                          <SelectTrigger
                            id={`deg-${i}`}
                            className="h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                          >
                            <SelectValue placeholder="Select Degree Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Diploma",
                              "Bachelor’s Degree",
                              "Master's Degree",
                              "Doctoral Degree (PhD)",
                            ].map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-5 space-y-1">
                        <Label
                          htmlFor={`yr-${i}`}
                          className="whitespace-nowrap truncate"
                        >
                          End Date (Month/Year)
                        </Label>
                        <MonthYearPicker
                          id={`yr-${i}`}
                          value={ed.startMonthYear}
                          allowPresent={true}
                          placeholder="Select end date or 'Present'"
                          onChange={(val) => {
                            const v = [...data.education];
                            v[i].startMonthYear = val;
                            if (val && val.toLowerCase() !== "present") {
                              const parsedYear = parseInt(
                                val.split("-")[0],
                                10,
                              );
                              if (!isNaN(parsedYear)) {
                                v[i].year = parsedYear;
                              }
                            }
                            setData({ ...data, education: v });
                          }}
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                        {data.education.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const v = data.education.filter(
                                (_: any, idx: number) => idx !== i,
                              );
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
                    onClick={() =>
                      setData({
                        ...data,
                        education: [
                          ...data.education,
                          {
                            degree: "Bachelor’s Degree",
                            institution: "",
                            year: 2026,
                            studyField: "",
                            startMonthYear: "",
                          },
                        ],
                      })
                    }
                    className="border-zinc-200 dark:border-zinc-800"
                  >
                    + Add Academic Record
                  </Button>
                </div>
              )}

              {currentStepName === "Mentorship Plan" && (
                <div className="space-y-4">
                  <div className="border border-dashed border-zinc-250 dark:border-zinc-800 p-4 text-xs text-muted-foreground rounded-md leading-relaxed font-sans">
                    As a Graduate applicant, local mentorship is highly
                    recommended for promotion to Technologist or Professional
                    standing. You can register up to{" "}
                    <strong className="text-navy">5 Mentors</strong> maximum.
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="ment-name">Mentor's Full Name</Label>
                      <Input
                        id="ment-name"
                        placeholder="Leave blank if none"
                        value={data.mentor.name}
                        onChange={(e) =>
                          setData({
                            ...data,
                            mentor: { ...data.mentor, name: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ment-id">
                        Mentor's RIQS Registration ID
                      </Label>
                      <Input
                        id="ment-id"
                        placeholder="e.g. RIQS-2023-P-022"
                        value={data.mentor.regId}
                        onChange={(e) =>
                          setData({
                            ...data,
                            mentor: { ...data.mentor, regId: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label htmlFor="ment-plan">
                        Mentorship Goal / Plan Summary
                      </Label>
                      <Textarea
                        id="ment-plan"
                        rows={4}
                        placeholder="Briefly summarize your practical experience milestones..."
                        value={data.mentor.plan}
                        onChange={(e) =>
                          setData({
                            ...data,
                            mentor: { ...data.mentor, plan: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStepName === "Document Vault" && (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {documentChecklist.map((d) => {
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
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center transition-colors rounded-md",
                              done
                                ? "bg-emerald-500 text-white"
                                : "bg-gold/15 text-navy",
                            )}
                          >
                            {done ? (
                              <Check className="h-5 w-5 text-white" />
                            ) : (
                              <Upload className="h-5 w-5 text-gold" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-250 flex items-center gap-1.5">
                              {d.l}
                              {d.r && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 font-sans">
                              {done
                                ? "File uploaded · click to replace"
                                : "Click to select and upload file"}
                            </div>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            onChange={() => {
                              setData({
                                ...data,
                                docs: { ...data.docs, [d.k]: true },
                              });
                              toast.success("Document uploaded successfully!");
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStepName === "Review & Submit" && (
                <div className="space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-950/40 p-5 text-sm space-y-2.5 rounded-md border border-zinc-100 dark:border-zinc-800">
                    {[
                      ["Practice Location Status", data.practiceLocation],
                      ["Entity Registration Mode", data.entityType],
                      ["Assessment Category", data.category],
                      [
                        "Full Name on Application",
                        data.personal.fullName || "Not Entered",
                      ],
                      [
                        "Contact Phone Number",
                        data.personal.phone || "Not Entered",
                      ],
                      [
                        "Primary Contact Email",
                        data.personal.email || "Not Entered",
                      ],
                      ...(data.entityType === "Individual"
                        ? [
                            [
                              "Academic Credentials Added",
                              `${data.education.filter((x: any) => x.institution).length} items`,
                            ],
                            [
                              "Employment Record Rows",
                              `${data.employment.filter((x: any) => x.company).length} items`,
                            ],
                          ]
                        : [
                            [
                              "Registered Shareholders",
                              `${data.personal.shareholders.filter((x: any) => x.fullName).length} items`,
                            ],
                            [
                              "Firm Office Location",
                              data.personal.firmAddress || "Not Entered",
                            ],
                          ]),
                      [
                        "Attached Document Safe Files",
                        `${Object.values(data.docs).filter(Boolean).length} uploads completed`,
                      ],
                    ].map(([k, v]) => (
                      <div
                        key={k as string}
                        className="grid grid-cols-2 gap-2 pb-2 border-b border-zinc-50 dark:border-zinc-800/40 last:border-0 last:pb-0 font-sans"
                      >
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-semibold text-navy text-right truncate">
                          {v as any}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-l-4 border-gold bg-gold/10 p-4 text-sm text-[#8a5c00] rounded-r-md leading-relaxed font-sans">
                    <FileText className="mr-2 inline h-4 w-4 text-gold" />
                    By submitting this application, you declare that all
                    uploaded certifications and declarations represent legal
                    facts. RIQS Councils will complete the review queue within
                    5–10 working days.
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
