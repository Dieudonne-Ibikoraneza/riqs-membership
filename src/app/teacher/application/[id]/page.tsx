"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  Sparkles,
  Trash2,
  Plus,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
  Loader2,
  User,
  Pencil,
  Save,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { MonthYearPicker } from "@/components/ui/month-picker";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { teacherServices } from "@/services/teacher.services";
import { useParams, useRouter } from "next/navigation";

import { publicServices } from "@/services/public.services";
import { DocumentTabsViewer } from "@/components/ui/document-tabs-viewer";
import PDFViewer from "@/components/ui/pdf-viewer";

// ─── Status Banner ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bg: string;
  badge: string;
}> = {
  Pending: {
    icon: <Clock className="h-12 w-12" />,
    title: "Application Submitted — Awaiting Review",
    description:
      "The student's application has been successfully submitted and is now in the RIQS secretariat queue. Our team will begin the formal review process within 5–10 business days. You will receive email notifications at each stage of the review.",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    badge: "border-blue-300 bg-blue-100 text-blue-800",
  },
  Under_Review: {
    icon: <Search className="h-12 w-12" />,
    title: "Under Active Review",
    description:
      "A qualified RIQS reviewer is actively assessing the submitted application and verifying the student's credentials. This process ensures the integrity of RIQS membership. You will be contacted via your registered email if any additional information or clarification is required.",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
    badge: "border-purple-300 bg-purple-100 text-purple-800",
  },
  Pending_Approval: {
    icon: <CheckCircle2 className="h-12 w-12" />,
    title: "Awaiting Final Board Approval",
    description:
      "Excellent news! The application has successfully passed the reviewer assessment stage and has been forwarded to the RIQS Board for final approval. This is the last step before the student's membership is confirmed. You will be notified once a decision has been made.",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    badge: "border-emerald-300 bg-emerald-100 text-emerald-800",
  },
  Approved: {
    icon: <Trophy className="h-12 w-12" />,
    title: "Congratulations — Membership Approved!",
    description:
      "The student's RIQS membership application has been officially approved! Their membership certificate and ID are now available. Thank you for your support in registering this new member.",
    color: "text-gold dark:text-gold",
    bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-700",
    badge: "border-amber-300 bg-amber-100 text-amber-800",
  },
  Rejected: {
    icon: <XCircle className="h-12 w-12" />,
    title: "Application Not Approved",
    description:
      "We regret to inform you that this application was not approved at this time. This decision may be based on eligibility criteria, documentation, or other assessment factors. Please contact the RIQS secretariat at info@riqs.rw or call +250 788 XXX XXX for detailed feedback and to understand the options for reapplication.",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    badge: "border-red-300 bg-red-100 text-red-800",
  },
  "Correction_Required": {
    icon: <AlertTriangle className="h-12 w-12" />,
    title: "Corrections Required",
    description:
      "The RIQS reviewer has flagged this application and requires corrections or additional information from you before it can proceed. Please review the feedback provided, update the application accordingly, and resubmit. Your previous entries have been preserved.",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
    badge: "border-orange-300 bg-orange-100 text-orange-800",
  },
};

function StatusBanner({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Pending"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy">Membership Application</h1>
          <p className="text-sm text-muted-foreground font-sans">
            Track the status of the student's submitted application below.
          </p>
        </div>
        <Badge variant="outline" className={cn("font-bold text-sm px-3 py-1", cfg.badge)}>
          {status.replace(/_/g, " ")}
        </Badge>
      </div>
      <Card className={cn("border-2", cfg.bg)}>
        <CardContent className="p-10 flex flex-col items-center text-center space-y-5">
          <div className={cfg.color}>{cfg.icon}</div>
          <h2 className={cn("text-2xl font-bold", cfg.color)}>{cfg.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            {cfg.description}
          </p>
          {status === "Approved" && (
            <Button
              className="mt-2 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold font-bold border-none"
              onClick={() => window.location.href = "/dashboard/certificate"}
            >
              <Trophy className="mr-2 h-4 w-4" /> View My Certificate
            </Button>
          )}
          {status === "Correction_Required" && (
            <p className={cn("text-sm font-semibold", cfg.color)}>
              Scroll down to continue editing your application.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Application Component ──────────────────────────────────────────────
export default function Application() {
  const queryClient = useQueryClient();

  const { id } = useParams() as { id: string };

  // Fetch existing application data
  const { data: appData, isLoading: profileLoading } = useQuery({
    queryKey: ["teacherApp", id],
    queryFn: () => teacherServices.getApplicationDetail(id),
  });

  const activeApp = appData?.application;

  const appStatus = appData?.application?.status;
  const appId = appData?.application?.id;
  const reviewerNotes = appData?.application?.reviewerNotes;
  const isEditable = !appStatus || appStatus === "Draft" || appStatus === "Correction_Required";

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: queryKeys.public.categories(),
    queryFn: () => publicServices.getCategories(),
  });

  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [data, setData] = useState<any>({
    practiceLocation: "Rwandan",
    entityType: "Individual",
    categoryId: "",
    categoryName: "",
    personal: {
      fullName: "",
      nationalId: "",
      dob: "",
      phone: "",
      email: "",
      residentAddress: { district: "", sector: "", cell: "", village: "" },
      workAddress: { district: "", sector: "", cell: "", village: "" },
      yearsInProfession: "",
      countryOfOrigin: "Rwanda",
      firmName: "",
      firmAddress: "",
      shareholders: [{ fullName: "", email: "", phone: "", membershipId: "", shareholdingPercentage: "" }],
    },
    education: [{ institution: "", studyField: "", degree: "", startMonthYear: "" }],
    employment: [{ company: "", role: "", from: "", to: "" }],
    hasNoEmployment: false,
    agreedToTerms: false,
    mentors: [{ membershipId: "", name: "", contact: "" }],
    mentorPlan: "",
    docs: {},
    dynamicTabs: [],
  });

  // Pre-populate from backend data
  useEffect(() => {
    if (!appData || hasLoaded) return;
    const application = appData.application;
    const profile = application?.member;
    const education = application?.educationRecords || [];
    const employment = application?.employmentRecords || [];
    const mentorship = application?.mentorshipAssignment || null;
    const uploadedDocs = application?.uploadedDocuments || [];

    let savedLocal: any = null;
    let savedStep = 0;
    try {
      const stored = localStorage.getItem(`riqs_app_draft_${id}`);
      if (stored) savedLocal = JSON.parse(stored);
      const sStep = localStorage.getItem(`riqs_app_step_${id}`);
      if (sStep) savedStep = Number(sStep);

      // Force step 0 if application just switched to Correction Required
      if (application?.status === "Correction_Required") {
        const lastSeen = localStorage.getItem("riqs_app_last_correction");
        // We use application.id + string length or similar as a simple check
        // Or simpler, just check if the last status wasn't Correction_Required
        if (savedLocal?.status !== "Correction_Required") {
           savedStep = 0;
           // We'll also tag savedLocal so we don't reset it again until status changes
           if (savedLocal) savedLocal.status = "Correction_Required";
        }
      } else if (application?.status) {
        if (savedLocal) savedLocal.status = application.status;
      }
    } catch (e) {}

    // Find the category name from the categories list
    const catName = savedLocal?.categoryName || application?.category?.categoryName || "";

    setData((prev: any) => ({
      ...prev,
      practiceLocation: savedLocal?.practiceLocation || application?.practiceLocation || "Rwandan",
      entityType: savedLocal?.entityType || application?.entityType || "Individual",
      categoryId: savedLocal?.categoryId || application?.categoryId || "",
      categoryName: catName,
      personal: {
        ...prev.personal,
        fullName: savedLocal?.personal?.fullName || profile?.fullName || "",
        nationalId: savedLocal?.personal?.nationalId || profile?.nationalIdOrPassport || "",
        dob: savedLocal?.personal?.dob || (profile?.dateOfBirth ? profile.dateOfBirth.split("T")[0] : ""),
        phone: savedLocal?.personal?.phone || profile?.phoneNumber || "",
        email: savedLocal?.personal?.email || profile?.email || "",
        yearsInProfession: savedLocal?.personal?.yearsInProfession || "",
        countryOfOrigin: savedLocal?.personal?.countryOfOrigin || "Rwanda",
        residentAddress: savedLocal?.personal?.residentAddress || profile?.residencyAddress || prev.personal.residentAddress,
        workAddress: savedLocal?.personal?.workAddress || profile?.workAddress || prev.personal.workAddress,
        firmName: savedLocal?.personal?.firmName || "",
        firmAddress: savedLocal?.personal?.firmAddress || "",
        shareholders: savedLocal?.personal?.shareholders || prev.personal.shareholders,
      },
      hasNoEmployment: savedLocal?.hasNoEmployment || false,
      dynamicTabs: savedLocal?.dynamicTabs || [],
      education: savedLocal?.education?.length ? savedLocal.education : 
        (education?.length ? education.map((e: any) => ({
          id: e.id,
          degree: e.qualificationType,
          institution: e.institution,
          studyField: e.fieldOfStudy,
          startMonthYear: e.endDate ? e.endDate.split("T")[0] : "",
          startDateRaw: e.startDate ? e.startDate.split("T")[0] : "",
          year: e.endDate ? new Date(e.endDate).getFullYear() : 2026,
        })) : [{ institution: "", studyField: "", degree: "Bachelor's Degree", startMonthYear: "", startDateRaw: "" }]),
      employment: savedLocal?.employment?.length ? savedLocal.employment : 
        (employment?.length ? employment.map((emp: any) => ({
          id: emp.id,
          company: emp.companyName,
          role: emp.jobTitle,
          from: emp.startDate ? emp.startDate.split("T")[0].substring(0, 7) : "",
          to: emp.isCurrent ? "Present" : (emp.endDate ? emp.endDate.split("T")[0].substring(0, 7) : ""),
        })) : [{ company: "", role: "", from: "", to: "" }]),
      mentors: (() => {
        const backendMentors = mentorship?.preferredMentors || [];
        const localMentors = savedLocal?.mentors?.length ? savedLocal.mentors : null;
        
        if (localMentors) {
           return localMentors.map((m: any) => {
              const backendMatch = backendMentors.find((b: any) => b.regNumber === m.membershipId);
              return { ...m, isSaved: !!backendMatch || m.isSaved };
           });
        }
        
        if (backendMentors.length > 0) {
           return backendMentors.map((m: any) => ({
             membershipId: m.regNumber, name: m.name, contact: m.contact, isSaved: true
           }));
        }
        
        return [{ membershipId: "", name: "", contact: "", isSaved: false }];
      })(),
      mentorPlan: savedLocal?.mentorPlan || mentorship?.mentorshipPlan || "",
      docs: savedLocal?.docs || (() => {
        const loadedDocs: any = {};
        if (uploadedDocs.length > 0) {
          uploadedDocs.forEach((d: any) => {
            loadedDocs[d.documentType] = d.fileName; // Put filename as placeholder to make hasDoc truthy
          });
        }
        return loadedDocs;
      })(),
    }));
    
    setStep(savedStep);
    setHasLoaded(true);
  }, [appData, hasLoaded]);

  // Sync to local storage on every change once loaded
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(`riqs_app_draft_${id}`, JSON.stringify(data));
      localStorage.setItem(`riqs_app_step_${id}`, step.toString());
    }
  }, [data, step, hasLoaded]);

  const STEPS = useMemo(() => {
    const list = [
      "Personal Info",
    ];
    if (data.entityType === "Individual") {
      list.push("Education");
      list.push("Employment Record");
    }
    if (data.entityType === "Individual" && (data.categoryName === "Graduate" || data.categoryName?.toLowerCase().includes("graduate"))) {
      list.push("Mentorship Plan");
    }
    list.push("Other Documents");
    list.push("Review & Submit");
    return list;
  }, [data.entityType, data.categoryName]);

  useEffect(() => {
    if (step >= STEPS.length) setStep(STEPS.length - 1);
  }, [STEPS, step]);

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  // Filtered categories based on location + entityType
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(
      (c: any) =>
        c.location === data.practiceLocation &&
        (c.entityType || c.entity_type) === data.entityType
    );
  }, [categories, data.practiceLocation, data.entityType]);

  // Display list for Category step (fallback to hardcoded if backend empty)
  const categoriesList = useMemo(() => {
    if (filteredCategories.length > 0) {
      return filteredCategories.map((c: any) => ({ id: c.id, name: c.category_name }));
    }
    // Fallback hardcoded
    if (data.entityType === "Individual") {
      if (data.practiceLocation === "Local") {
        return [{ id: "", name: "Graduate" }, { id: "", name: "Technologist" }, { id: "", name: "Professional" }];
      } else {
        return [{ id: "", name: "Technologist" }, { id: "", name: "Professional" }];
      }
    } else {
      if (data.practiceLocation === "Local") {
        return [
          { id: "", name: "Small Firm - Annual turnover less than 50 Million RWF" },
          { id: "", name: "Medium Firm - Annual turnover between 50-100 Million RWF" },
          { id: "", name: "Large Firm - Annual turnover above 100 Million RWF" },
        ];
      } else {
        return [
          { id: "", name: "Small Firm - Annual turnover less than 100,000 USD" },
          { id: "", name: "Medium Firm - Annual turnover between 100,000-500,000 USD" },
          { id: "", name: "Large Firm - Annual turnover above 500,000 USD" },
        ];
      }
    }
  }, [filteredCategories, data.entityType, data.practiceLocation]);

  const updateLocation = (loc: string) => {
    setData((d: any) => ({ ...d, practiceLocation: loc, categoryId: "", categoryName: "" }));
  };

  const updateEntity = (ent: string) => {
    setData((d: any) => ({ ...d, entityType: ent, categoryId: "", categoryName: "" }));
  };

  const addMentor = () => {
    if (data.mentors.length >= 5) return toast.error("Maximum 5 mentors allowed");
    setData({ ...data, mentors: [...data.mentors, { membershipId: "", name: "", contact: "" }] });
  };
  const removeMentor = (i: number) =>
    setData({ ...data, mentors: data.mentors.filter((_: any, idx: number) => idx !== i) });

  // ─── Auto-save mutation ────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: teacherServices.saveApplication,
    onSuccess: (res) => {
      // Update appId if newly created
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to save progress");
    },
  });

  // ─── Education mutations ───────────────────────────────────────────────────
  const addEduMutation = useMutation({
    mutationFn: (data: any) => teacherServices.addEducation(data.applicationId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
      toast.success("Education record saved");
      if (res.education?.id) {
        setData((prev: any) => {
          const newEdu = prev.education.map((e: any) => {
             if (!e.id && e.institution === res.education.institution && e.studyField === res.education.fieldOfStudy) {
                return { ...e, id: res.education.id };
             }
             return e;
          });
          return { ...prev, education: newEdu };
        });
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to add education"),
  });

  const delEduMutation = useMutation({
    mutationFn: (recordId: string) => teacherServices.deleteEducation(appId!, recordId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
      toast.success("Education record removed");
      setData((prev: any) => {
        const newEdu = prev.education.filter((e: any) => e.id !== deletedId);
        return {
          ...prev,
          education: newEdu.length > 0 ? newEdu : [{ degree: "Bachelor's Degree", institution: "", year: new Date().getFullYear(), studyField: "", startMonthYear: "" }]
        };
      });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to remove education"),
  });

  // ─── Employment mutations ──────────────────────────────────────────────────
  const addEmpMutation = useMutation({
    mutationFn: (data: any) => teacherServices.addEmployment(data.applicationId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
      toast.success("Employment record saved");
      if (res.employmentRecord?.id) {
        setData((prev: any) => {
          const newEmp = prev.employment.map((e: any) => {
             if (!e.id && e.company === res.employmentRecord.companyName && e.role === res.employmentRecord.jobTitle) {
                return { ...e, id: res.employmentRecord.id };
             }
             return e;
          });
          return { ...prev, employment: newEmp };
        });
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to add employment"),
  });

  const delEmpMutation = useMutation({
    mutationFn: (recordId: string) => teacherServices.deleteEmployment(appId!, recordId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
      toast.success("Employment record removed");
      setData((prev: any) => {
        const newEmp = prev.employment.filter((e: any) => e.id !== deletedId);
        return {
          ...prev,
          employment: newEmp.length > 0 ? newEmp : [{ company: "", role: "", from: "", to: "" }]
        };
      });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to remove employment"),
  });

  // ─── Mentorship mutation ───────────────────────────────────────────────────
  const mentorshipMutation = useMutation({
    mutationFn: (data: any) => teacherServices.saveMentorship(data.applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
      toast.success("Mentor saved successfully!");
      setData((prev: any) => ({
        ...prev,
        mentors: prev.mentors.map((m: any) => ({
          ...m,
          isSaved: m.name ? true : m.isSaved
        }))
      }));
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to save mentor"),
  });

  const delMentorMutation = useMutation({
    mutationFn: (regNumber: string) => teacherServices.deleteMentorshipOption(appId!, regNumber),
    onSuccess: (_, deletedRegNumber) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
      toast.success("Mentor removed successfully!");
      setData((prev: any) => {
        const newMentors = prev.mentors.filter((m: any) => m.membershipId !== deletedRegNumber);
        return {
          ...prev,
          mentors: newMentors.length > 0 ? newMentors : [{ membershipId: "", name: "", contact: "", isSaved: false }]
        };
      });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to remove mentor"),
  });

  // ─── Submit mutation ───────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: teacherServices.submitApplication,
    onSuccess: () => {
      localStorage.removeItem(`riqs_app_draft_${appId}`);
      localStorage.removeItem(`riqs_app_step_${appId}`);
      queryClient.invalidateQueries({ queryKey: ["teacherApp", appId] });
      toast.success("Application submitted successfully!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to submit application"),
  });

  // ─── Save & advance ────────────────────────────────────────────────────────
  const next = () => {
    if (data.entityType === "Firm" && currentStepName === "Personal Info") {
      let sum = 0;
      for (const sh of data.personal.shareholders) {
        sum += parseFloat(sh.shareholdingPercentage || "0") || 0;
      }
      const rounded = Math.round(sum * 100) / 100;
      if (rounded < 99.9 || rounded > 100.1) {
         return toast.error("The firm shareholders' shares must sum to 100%.");
      }
    }
    // Note: Firm shareholders not supported in teacher registration flow

    if (!data.categoryId && step >= 2) {
      // Skip auto-save if no categoryId yet (steps 0-1)
    }
    if (data.categoryId) {
      // Fire and forget, no await or loading state to ensure instant transition
      saveMutation.mutate({
        applicationId: appId,
        practiceLocation: data.practiceLocation,
        entityType: data.entityType,
        categoryId: data.categoryId,
        fullName: data.personal.fullName,
        phoneNumber: data.personal.phone,
        dob: data.personal.dob,
        nationalIdOrPassport: data.personal.nationalId,
        yearsInProfession: data.personal.yearsInProfession,
        residencyAddress: data.personal.residentAddress,
        workAddress: data.personal.workAddress,
        countryOfOrigin: data.personal.countryOfOrigin,
        firmName: data.entityType === "Firm" ? data.personal.firmName : undefined,
        firmAddress: data.entityType === "Firm" ? data.personal.firmAddress : undefined,
      } as any);
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = () => {
    if (!appId) return toast.error("Application not found. Please complete all steps first.");
    if (!data.agreedToTerms) return toast.error("Please agree to the terms and conditions.");
    submitMutation.mutate(appId);
  };

  const documentChecklist = useMemo(() => {
    // Find active category from backend configuration if loaded
    const activeCategory = categories?.find((c: any) => c.id === data.categoryId);
    
    // If active category exists and has dynamic required documents, use them!
    if (activeCategory && activeCategory.required_documents && activeCategory.required_documents.length > 0) {
      return activeCategory.required_documents.map((docName: string) => {
        let k = docName.toLowerCase().replace(/[^a-z0-9]/g, "_");
        // Maintain compatibility for the uploader step routing keys
        if (docName.toLowerCase().includes("degree") || docName.toLowerCase().includes("diploma")) {
          k = "degree";
        } else if (docName.toLowerCase().includes("passport") || docName.toLowerCase().includes("photo")) {
          k = "photo";
        }
        return {
          k,
          l: docName.replace(/_/g, " "),
          r: true
        };
      });
    }

    const catName = data.categoryName || "";
    const list = [];
    if (data.entityType === "Individual") {
      if (data.practiceLocation === "Rwandan") {
        if (catName === "Graduate") {
          list.push({ k: "degree", l: "Notarized Degree/Diploma (HEC equivalency if foreign)", r: true });
          list.push({ k: "transcripts", l: "Notarized Academic Transcripts showing subjects", r: false });
          list.push({ k: "rqssa", l: "Certificate of RQSSA (or equivalent student membership proof)", r: true });
          list.push({ k: "letter", l: "Application Letter", r: true });
          list.push({ k: "id", l: "Copy of ID / Passport", r: true });
          list.push({ k: "cv", l: "Curriculum Vitae (CV)", r: false });
          list.push({ k: "payment", l: "Proof of Momo Payment (10,000 RWF via Momo Code: 604516)", r: true });
        } else if (catName === "Technologist") {
          list.push({ k: "degree", l: "Diploma Certificate (HEC equivalency if foreign)", r: true });
          list.push({ k: "transcripts", l: "Notarized Academic Transcripts showing subjects", r: true });
          list.push({ k: "cpd", l: "At least 2 CPD Activities certificate copies", r: false });
          list.push({ k: "logbook", l: "Logbook of records", r: false });
          list.push({ k: "letter", l: "Application Letter", r: true });
          list.push({ k: "id", l: "Copy of ID / Passport", r: true });
          list.push({ k: "cv", l: "Curriculum Vitae (CV)", r: false });
          list.push({ k: "payment", l: "Proof of Momo Payment (10,000 RWF via Momo Code: 604516)", r: true });
        } else {
          list.push({ k: "degree", l: "Notarized Degree Certificate (HEC equivalent if foreign)", r: true });
          list.push({ k: "transcripts", l: "Notarized Academic Transcripts showing subjects", r: true });
          list.push({ k: "cpd", l: "At least 2 CPD Activities certificate copies", r: false });
          list.push({ k: "logbook", l: "Logbook of records", r: false });
          list.push({ k: "letter", l: "Application Letter", r: true });
          list.push({ k: "id", l: "Copy of ID / Passport", r: true });
          list.push({ k: "cv", l: "Curriculum Vitae (CV)", r: false });
          list.push({ k: "payment", l: "Proof of Momo Payment (10,000 RWF via Momo Code: 604516)", r: true });
        }
      } else {
        const isProf = catName === "Professional";
        list.push({ k: "degree", l: isProf ? "Notarized Degree Certificate" : "Notarized Diploma Certificate", r: true });
        list.push({ k: "membershipOrigin", l: "Valid Membership Certificate from country of origin", r: true });
        list.push({ k: "permit", l: "Visa & Work Permit (PDF)", r: true });
        list.push({ k: "cv", l: "CV & References (PDF)", r: false });
        list.push({ k: "payment", l: `Proof of Payment (${isProf ? "50 USD" : "30 USD"} Application Fee)`, r: true });
      }
    } else {
      const isLocal = data.practiceLocation === "Rwandan";
      list.push({ k: "firmCert", l: isLocal ? "Firm Business Registration Certificate by RDB" : "Firm Business Registration Certificate", r: true });
      list.push({ k: "taxClearance", l: "Tax Clearance Certificate", r: true });
      list.push({ k: "beneficialOwnerIds", l: "Identity documents of beneficial owners / shareholders", r: true });
      list.push({ k: "shareCertificates", l: "Share certificates or company registry extract", r: true });
      list.push({ k: "socialSecurity", l: isLocal ? "RSSB Tax Clearance Certificate" : "Social Security Clearance Certificate", r: false });
      if (isLocal) list.push({ k: "staffCertificates", l: "RIQS Members working in the firm (Certificates)", r: false });
      const fee = catName.includes("Small") ? (isLocal ? "50,000 RWF" : "100 USD")
        : catName.includes("Medium") ? (isLocal ? "100,000 RWF" : "200 USD")
        : isLocal ? "200,000 RWF" : "400 USD";
      list.push({ k: "payment", l: isLocal ? `Proof of Momo Payment (${fee} via Momo Code: 604516)` : `Proof of Payment (${fee} Application Fee)`, r: true });
    }
    return list;
  }, [categories, data.categoryId, data.practiceLocation, data.entityType, data.categoryName]);

  const currentStepName = STEPS[step];

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
        <div className="h-10 w-72 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 space-y-6 h-48" />
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 h-80" />
      </div>
    );
  }

  // Show status banner for non-editable statuses (but still show wizard if Correction Required)
  if (appStatus && appStatus !== "Draft") {
    return (
      <div className="space-y-6">
        <StatusBanner status={appStatus} />
        
        <div className="flex justify-center mt-6">
           <Button 
             className="bg-navy text-white hover:bg-navy/90 h-11 px-8 text-sm font-semibold rounded-md shadow-sm"
             onClick={() => window.location.href = "/teacher"}
           >
             <UserPlus className="mr-2 h-5 w-5" /> Register Another Student
           </Button>
        </div>

        {appStatus === "Correction_Required" && (
          <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <WizardContent
              step={step}
              STEPS={STEPS}
              pct={pct}
              data={data}
              setData={setData}
              categoriesList={categoriesList}
              documentChecklist={documentChecklist}
              currentStepName={currentStepName}
              updateLocation={updateLocation}
              updateEntity={updateEntity}
              addMentor={addMentor}
              removeMentor={removeMentor}
              appId={appId}
              isSaving={isSaving}
              addEduMutation={addEduMutation}
              delEduMutation={delEduMutation}
              addEmpMutation={addEmpMutation}
              delEmpMutation={delEmpMutation}
              mentorshipMutation={mentorshipMutation}
              delMentorMutation={delMentorMutation}
              submitMutation={submitMutation}
              submit={submit}
              next={next}
              back={back}
              documents={appData?.application?.uploadedDocuments || []}
              reviewerNotes={reviewerNotes}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <WizardContent
      goToStep={setStep}
      step={step}
      STEPS={STEPS}
      pct={pct}
      data={data}
      setData={setData}
      categoriesList={categoriesList}
      documentChecklist={documentChecklist}
      currentStepName={currentStepName}
      updateLocation={updateLocation}
      updateEntity={updateEntity}
      addMentor={addMentor}
      removeMentor={removeMentor}
      appId={appId}
      isSaving={isSaving}
      addEduMutation={addEduMutation}
      delEduMutation={delEduMutation}
      addEmpMutation={addEmpMutation}
      delEmpMutation={delEmpMutation}
      mentorshipMutation={mentorshipMutation}
      delMentorMutation={delMentorMutation}
      submitMutation={submitMutation}
      submit={submit}
      next={next}
      back={back}
      documents={appData?.application?.uploadedDocuments || []}
      reviewerNotes={reviewerNotes}
    />
  );
}

// ─── Wizard Content (extracted for reuse) ────────────────────────────────────
function WizardContent({
  step, STEPS, pct, data, setData, categoriesList, documentChecklist,
  currentStepName, updateLocation, updateEntity, addMentor, removeMentor,
  appId, isSaving, addEduMutation, delEduMutation, addEmpMutation, delEmpMutation, mentorshipMutation, delMentorMutation,
  submitMutation, submit, next, back, documents, goToStep, reviewerNotes
}: any) {
  const queryClient = useQueryClient();
  const [photoDragActive, setPhotoDragActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [verifyingMentorIdx, setVerifyingMentorIdx] = useState<number | null>(null);
  const [collapsedDocs, setCollapsedDocs] = useState<Record<string, boolean>>({});

  const verifyMentor = async (index: number, membershipId: string) => {
    if (!membershipId) return;

    // Check for duplicates
    const isDuplicate = data.mentors.some((m: any, i: number) => i !== index && m.membershipId === membershipId);
    if (isDuplicate) {
      toast.error("This mentor has already been added.");
      const v = [...data.mentors];
      v[index].membershipId = "";
      v[index].name = "";
      v[index].contact = "";
      setData({ ...data, mentors: v });
      return;
    }
    try {
      setVerifyingMentorIdx(index);
      const member = await publicServices.getMentorById(membershipId);
      const v = [...data.mentors];
      if (member) {
        v[index].name = member.fullName;
        v[index].contact = member.contact;
        setData({ ...data, mentors: v });
        toast.success("Mentor found!");
      } else {
        toast.error("Mentor not found or unavailable.");
        v[index].name = "";
        v[index].contact = "";
        setData({ ...data, mentors: v });
      }
    } catch (err) {
      toast.error("Failed to verify mentor. They may not be eligible.");
      const v = [...data.mentors];
      v[index].name = "";
      v[index].contact = "";
      setData({ ...data, mentors: v });
    } finally {
      setVerifyingMentorIdx(null);
    }
  };

  useEffect(() => {
    if (documents?.length > 0) {
      documents.forEach((d: any) => {
        if (d.documentType === "PassportPhoto") {
          if (!photoPreview) {
            setIsPhotoLoading(true);
            teacherServices.downloadDocument(d.id)
              .then((blob) => setPhotoPreview(URL.createObjectURL(blob)))
              .catch((err) => console.error("Failed to load passport photo", err))
              .finally(() => setIsPhotoLoading(false));
          }
        } else {
          setData((prev: any) => {
            if (!prev.docs[d.documentType]) {
              teacherServices.downloadDocument(d.id)
                .then((blob) => {
                  const isImg = blob.type.startsWith("image/") || d.fileName?.match(/\.(jpeg|jpg|gif|png)$/i);
                  setData((curr: any) => ({
                    ...curr,
                    docs: { ...curr.docs, [d.documentType]: URL.createObjectURL(blob) + (isImg ? "#image" : "#pdf") }
                  }));
                })
                .catch((err) => console.error(`Failed to load ${d.documentType}`, err));
              
              return { ...prev, docs: { ...prev.docs, [d.documentType]: "loading_from_backend" } };
            }
            return prev;
          });
        }
      });
    }
  }, [documents]);

  // Contextual checklist mapping
  const getContextualChecklist = () => {
    if (currentStepName === "Education") {
      return documentChecklist.filter((d: any) => ["degree"].includes(d.k));
    }
    if (currentStepName === "Other Documents") {
      return documentChecklist.filter((d: any) => !["photo", "degree"].includes(d.k));
    }
    return [];
  };

  const contextualChecklist = getContextualChecklist();

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!appId) {
        throw new Error("Please complete the first step to save the application draft before uploading a photo.");
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", appId);
      formData.append("documentType", "PassportPhoto");
      return teacherServices.uploadDocument(formData);
    },
    onSuccess: () => {
      toast.success("Passport photo uploaded successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.message || "Failed to upload photo");
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File, documentType: string }) => {
      if (!appId) {
        throw new Error("Please complete the first step to save the application draft before uploading documents.");
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", appId);
      formData.append("documentType", documentType);
      return teacherServices.uploadDocument(formData);
    },
    onSuccess: (data, variables) => {
      toast.success(variables.file.name + " uploaded successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.message || "Failed to upload document");
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async ({ appId, documentType }: { appId: string, documentType: string }) => {
      return teacherServices.deleteDocumentByType(appId, documentType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.message || "Failed to delete document");
    }
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoPreview(URL.createObjectURL(file));
      uploadPhotoMutation.mutate(file);
    }
  };

  const handlePhotoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setPhotoDragActive(true);
    } else if (e.type === "dragleave") {
      setPhotoDragActive(false);
    }
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setPhotoPreview(URL.createObjectURL(file));
      uploadPhotoMutation.mutate(file);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy">Membership Application</h1>
          <p className="text-sm text-muted-foreground font-sans">
            {reviewerNotes 
              ? "Review the feedback below and update your application." 
              : "Complete the steps below — your progress is saved automatically."}
          </p>
        </div>
        {!reviewerNotes && (
          <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold font-bold">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-gold fill-gold" /> Draft
          </Badge>
        )}
      </div>

      {reviewerNotes && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-5 text-orange-900 rounded-r shadow-sm">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="font-bold text-lg">Corrections Required</h3>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{reviewerNotes}</p>
        </div>
      )}

      {/* Stepper */}
      <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-navy font-bold">Step {step + 1} of {STEPS.length}</span>
            <span className="text-muted-foreground">{pct}% complete</span>
          </div>
          <div className="mt-3 h-2 w-full bg-muted dark:bg-zinc-800 relative overflow-hidden">
            <div className="h-full gold-gradient transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-4 lg:flex-nowrap lg:justify-between">
            {STEPS.map((s: string, i: number) => {
              const done = i < step, active = i === step;
              return (
                <button
                  key={s}
                  onClick={() => i <= step && goToStep(i)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 transition-all outline-none",
                    "w-[calc(33.333%-1rem)] md:w-[calc(25%-1rem)] lg:w-auto lg:flex-1",
                    i > step && "cursor-default opacity-60",
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center text-xs font-bold transition-all duration-300",
                    done && "bg-gold text-[#1a1a1a] shadow-gold",
                    active && "bg-navy text-white scale-110 ring-4 ring-navy/15 animate-pulse-gold",
                    !done && !active && "bg-muted text-muted-foreground border border-border",
                  )}>
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn(
                    "text-[10px] text-center leading-tight transition-colors hidden md:block mt-1 max-w-[110px] break-words whitespace-normal font-sans",
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

      {/* Main Content Grid */}
      <div className={cn("grid gap-6 items-start", (contextualChecklist.length > 0 && currentStepName !== "Other Documents") ? "lg:grid-cols-12" : "grid-cols-1")}>
        {/* Left Side: Step Content */}
        <div className={cn("flex flex-col", (contextualChecklist.length > 0 && currentStepName !== "Other Documents") ? "lg:col-span-5 pr-2" : "w-full")}>
          <div className="space-y-6">
          <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 mb-4">
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
              {/* ── Practice Location ── */}
              {currentStepName === "Practice Location" && (
                <RadioGroup value={data.practiceLocation} onValueChange={updateLocation} className="grid gap-3 md:grid-cols-2">
                  {["Rwandan", "Non_Rwandan"].map((o) => (
                    <label key={o} className={cn(
                      "flex cursor-pointer items-start gap-3 border p-5 transition-all rounded-md",
                      data.practiceLocation === o ? "border-gold bg-gold/5 shadow-gold/20" : "border-zinc-200 dark:border-zinc-800 hover:border-navy/35 hover:bg-zinc-50/50",
                    )}>
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <div>
                        <div className="font-semibold text-navy">{o === "Rwandan" ? "Rwandan" : "Non-Rwandan"} Practitioner</div>
                        <div className="text-sm text-muted-foreground mt-0.5 font-sans">
                          {o === "Rwandan" ? "Practicing Quantity Surveying inside Rwanda" : "Practicing/based outside Rwanda"}
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}

              {/* ── Entity Type ── */}
              {currentStepName === "Entity Type" && (
                <RadioGroup value={data.entityType} onValueChange={updateEntity} className="grid gap-3 md:grid-cols-2">
                  {["Individual", "Firm"].map((o) => (
                    <label key={o} className={cn(
                      "flex cursor-pointer items-start gap-3 border p-5 transition-all rounded-md",
                      data.entityType === o ? "border-gold bg-gold/5 shadow-gold/20" : "border-zinc-200 dark:border-zinc-800 hover:border-navy/35 hover:bg-zinc-50/50",
                    )}>
                      <RadioGroupItem value={o} className="mt-0.5" />
                      <div>
                        <div className="font-semibold text-navy">{o} Application</div>
                        <div className="text-sm text-muted-foreground mt-0.5 font-sans">
                          {o === "Individual" ? "Apply for individual Quantity Surveyor credentials" : "Apply as a corporate firm / practice group"}
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              )}

              {/* ── Category ── */}
              {currentStepName === "Category" && (
                <div className="max-w-md space-y-1.5">
                  <Label htmlFor="app-cat">Membership Category Level</Label>
                  <Select
                    value={data.categoryId || data.categoryName}
                    onValueChange={(v) => {
                      const found = categoriesList.find((c: any) => c.id === v || c.name === v);
                      setData({ ...data, categoryId: found?.id || "", categoryName: found?.name || v });
                    }}
                  >
                    <SelectTrigger id="app-cat" className="mt-1 h-11 border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Category Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesList.map((c: any) => (
                        <SelectItem key={c.id || c.name} value={c.id || c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground pt-1 leading-normal font-sans">
                    Required document checklist and assessment tiers vary based on candidate level.
                  </p>
                </div>
              )}

              {/* ── Personal Info ── */}
              {currentStepName === "Personal Info" && (
                data.entityType === "Individual" ? (
                  <div className="grid gap-6 md:grid-cols-12">
                    {/* Left Side: Profile Fields */}
                    <div className="md:col-span-7 grid gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <Label htmlFor="app-name">Full Names</Label>
                        <Input id="app-name" placeholder="e.g. John Doe" value={data.personal.fullName}
                          onChange={(e) => setData({ ...data, personal: { ...data.personal, fullName: e.target.value } })} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="app-email">Primary Email Address</Label>
                        <Input id="app-email" type="email" placeholder="e.g. john.doe@example.com" value={data.personal.email} disabled className="bg-zinc-100" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="app-phone">Mobile Phone</Label>
                        <Input id="app-phone" placeholder="e.g. +250 788 000 000" value={data.personal.phone}
                          onChange={(e) => setData({ ...data, personal: { ...data.personal, phone: e.target.value } })} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="app-nid">National ID / Passport Number</Label>
                        <Input id="app-nid" placeholder="e.g. 1199080012345678" value={data.personal.nationalId}
                          onChange={(e) => setData({ ...data, personal: { ...data.personal, nationalId: e.target.value } })} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="app-dob">Date of Birth</Label>
                        <MonthYearPicker
                          id="app-dob"
                          value={data.personal.dob}
                          onChange={(v) => setData({ ...data, personal: { ...data.personal, dob: v } })}
                          placeholder="Select Date of Birth"
                        />
                      </div>
                    </div>

                    {/* Right Side: Passport Photo */}
                    <div className="md:col-span-5 flex flex-col">
                      <Label className="mb-1">Passport Size Photo</Label>
                      <input
                        type="file"
                        accept="image/jpeg, image/png"
                        className="hidden"
                        ref={photoInputRef}
                        onChange={handlePhotoSelect}
                      />
                      <div
                        onClick={() => {
                          if (!photoPreview && !isPhotoLoading) {
                            photoInputRef.current?.click();
                          }
                        }}
                        onDragEnter={!photoPreview ? handlePhotoDrag : undefined}
                        onDragLeave={!photoPreview ? handlePhotoDrag : undefined}
                        onDragOver={!photoPreview ? handlePhotoDrag : undefined}
                        onDrop={!photoPreview ? handlePhotoDrop : undefined}
                        className={cn(
                          "flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 text-center transition-colors min-h-[220px] relative overflow-hidden group",
                          !photoPreview && "cursor-pointer",
                          photoDragActive ? "border-navy bg-navy/5 dark:border-gold dark:bg-gold/5" : "border-zinc-200 hover:border-navy/50 dark:border-zinc-800 bg-zinc-50/50 hover:bg-zinc-100/50 dark:bg-zinc-900/50"
                        )}
                      >
                        {isPhotoLoading ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50">
                            <Loader2 className="h-8 w-8 text-navy/40 animate-spin mb-3" />
                            <span className="text-xs text-muted-foreground font-semibold">Loading photo...</span>
                          </div>
                        ) : photoPreview ? (
                          <>
                            <img src={photoPreview} alt="Passport preview" className="w-full h-full object-cover absolute inset-0" />
                            {uploadPhotoMutation.isPending && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                              </div>
                            )}
                            <div 
                              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 p-2 rounded-full backdrop-blur-sm transition-colors shadow-sm cursor-pointer z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                photoInputRef.current?.click();
                              }}
                            >
                              <Pencil className="h-4 w-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <User className={cn("h-12 w-12 mb-3 transition-colors", photoDragActive ? "text-navy dark:text-gold" : "text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400")} />
                            <span className={cn("text-sm font-semibold", photoDragActive ? "text-navy dark:text-gold" : "text-navy dark:text-zinc-300")}>
                              {photoDragActive ? "Drop photo here" : "Drag & Drop photo here"}
                            </span>
                            <span className="text-xs mt-1 font-sans text-muted-foreground">or click anywhere to browse (Max 5MB)</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4 border-zinc-200 dark:border-zinc-700 pointer-events-none"
                              tabIndex={-1}
                            >
                              <Upload className="h-4 w-4 mr-2" /> Select File
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="md:col-span-12 grid gap-4 mt-2">
                      {data.practiceLocation === "Non_Rwandan" && (
                      <div className="space-y-1">
                        <Label htmlFor="app-origin">Country of Origin</Label>
                        <Input id="app-origin" placeholder="e.g. Kenya" value={data.personal.countryOfOrigin}
                           onChange={(e) => setData({ ...data, personal: { ...data.personal, countryOfOrigin: e.target.value } })} />
                      </div>
                    )}
                    {(data.categoryName === "Technologist" || data.categoryName === "Professional") && (
                      <div className="space-y-1">
                        <Label htmlFor="app-years">Years in Profession</Label>
                        <Input id="app-years" type="number" min={0} placeholder="e.g. 5" value={data.personal.yearsInProfession}
                           onChange={(e) => setData({ ...data, personal: { ...data.personal, yearsInProfession: e.target.value } })} />
                      </div>
                    )}
                    {data.practiceLocation === "Rwandan" && (
                      <>
                        <div className="md:col-span-2 border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 space-y-3">
                          <h4 className="font-semibold text-sm text-navy">Resident Address (Optional)</h4>
                          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            {["district", "sector", "cell", "village"].map((field) => (
                              <div key={field} className="space-y-1">
                                <Label className="capitalize">{field}</Label>
                                <Input placeholder={`e.g. ${field === "district" ? "Gasabo" : field === "sector" ? "Kacyiru" : field === "cell" ? "Kamatamu" : "Amahoro"}`}
                                  value={data.personal.residentAddress[field]}
                                  onChange={(e) => setData({ ...data, personal: { ...data.personal, residentAddress: { ...data.personal.residentAddress, [field]: e.target.value } } })} />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2 border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 space-y-3">
                          <h4 className="font-semibold text-sm text-navy">Work Address (Optional)</h4>
                          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            {["district", "sector", "cell", "village"].map((field) => (
                              <div key={`work-${field}`} className="space-y-1">
                                <Label className="capitalize">{field}</Label>
                                <Input placeholder={`e.g. ${field === "district" ? "Nyarugenge" : field === "sector" ? "Muhima" : field === "cell" ? "Nyabugogo" : "Kinyaga"}`}
                                  value={data.personal.workAddress[field]}
                                  onChange={(e) => setData({ ...data, personal: { ...data.personal, workAddress: { ...data.personal.workAddress, [field]: e.target.value } } })} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 space-y-4">
                      <h3 className="font-semibold text-base text-navy">Representative Information</h3>
                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          { id: "rep-name", label: "Full Names", field: "fullName", placeholder: "e.g. John Doe" },
                          { id: "rep-email", label: "Representative Email", field: "email", placeholder: "e.g. rep@firm.com", type: "email" },
                          { id: "rep-phone", label: "Representative Phone", field: "phone", placeholder: "e.g. +250 788 000 000" },
                        ].map(({ id, label, field, placeholder, type }) => (
                          <div key={id} className="space-y-1">
                            <Label htmlFor={id}>{label}</Label>
                            <Input id={id} type={type} placeholder={placeholder} value={data.personal[field]}
                              disabled={field === "email"}
                              className={field === "email" ? "bg-zinc-100" : ""}
                              onChange={(e) => setData({ ...data, personal: { ...data.personal, [field]: e.target.value } })} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 space-y-4">
                      <h3 className="font-semibold text-base text-navy">Firm Information</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label>Registered Firm Name</Label>
                          <Input placeholder="e.g. Apex Surveyors Ltd" value={data.personal.firmName}
                            onChange={(e) => setData({ ...data, personal: { ...data.personal, firmName: e.target.value } })} />
                        </div>
                        <div className="space-y-1">
                          <Label>Firm Office Address</Label>
                          <Input placeholder="e.g. KN 3 Rd, Kigali" value={data.personal.firmAddress}
                            onChange={(e) => setData({ ...data, personal: { ...data.personal, firmAddress: e.target.value } })} />
                        </div>
                      </div>
                    </div>
                    {/* Shareholders */}
                    <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 space-y-4">
                      <h3 className="font-semibold text-base text-navy">Firm Shareholders</h3>
                      {data.personal.shareholders.map((sh: any, i: number) => {
                        const hasDelete = data.personal.shareholders.length > 1;
                        return (
                        <div key={i} className="relative grid gap-3 border border-zinc-100 dark:border-zinc-800 p-4 rounded-md md:grid-cols-12 bg-white dark:bg-zinc-900 shadow-sm">
                          {[
                            { className: "md:col-span-3", label: "Shareholder Name", field: "fullName", placeholder: "e.g. Alice Umuhoza" },
                            { className: "md:col-span-3", label: "Email Address", field: "email", placeholder: "e.g. alice@example.com", type: "email" },
                            { className: "md:col-span-2", label: "Phone Number", field: "phone", placeholder: "e.g. +250 788 000 000" },
                            { className: "md:col-span-1", label: "Share (%)", field: "shareholdingPercentage", placeholder: "e.g. 50", type: "number" },
                            { className: hasDelete ? "md:col-span-2" : "md:col-span-3", label: "RIQS ID (Optional)", field: "membershipId", placeholder: "e.g. RIQS-2026-M-045" },
                          ].map(({ className, label, field, placeholder, type }) => (
                            <div key={field} className={`${className} space-y-1`}>
                              <Label>{label}</Label>
                              <Input type={type} placeholder={placeholder} value={sh[field]}
                                onChange={(e) => {
                                  const v = [...data.personal.shareholders];
                                  v[i][field] = e.target.value;
                                  setData({ ...data, personal: { ...data.personal, shareholders: v } });
                                }} />
                            </div>
                          ))}
                          {hasDelete && (
                            <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                              <Button variant="ghost" size="icon"
                                onClick={() => {
                                  const v = data.personal.shareholders.filter((_: any, idx: number) => idx !== i);
                                  setData({ ...data, personal: { ...data.personal, shareholders: v } });
                                }}
                                className="text-red-500 hover:bg-red-50 h-10 w-10 shrink-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )})}
                      <Button variant="outline" size="sm"
                        onClick={() => setData({ ...data, personal: { ...data.personal, shareholders: [...data.personal.shareholders, { fullName: "", email: "", phone: "", membershipId: "", shareholdingPercentage: "" }] } })}
                        className="border-zinc-200 dark:border-zinc-800">
                        + Add Shareholder
                      </Button>
                    </div>
                  </div>
                )
              )}

              {/* ── Employment Record ── */}
              {currentStepName === "Employment Record" && (
                <div className="space-y-4">
                  <div className="border border-zinc-150 dark:border-zinc-800 bg-amber-50/20 text-amber-900 p-4 text-xs rounded-md">
                    Please provide employment details. If currently not employed, you can provide previously active employment history.
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox id="no-employment" checked={data.hasNoEmployment}
                      onCheckedChange={(checked) => setData({ ...data, hasNoEmployment: checked === true })} />
                    <Label htmlFor="no-employment" className="text-sm font-medium leading-none cursor-pointer">
                      I have never been employed
                    </Label>
                  </div>
                  {!data.hasNoEmployment && (
                    <>
                      {data.employment.map((em: any, i: number) => (
                        <div key={em.id || i} className="relative grid gap-4 border border-zinc-150 p-4 rounded-md md:grid-cols-12 bg-zinc-50/50">
                          <div className="md:col-span-6 space-y-1">
                            <Label>Company / Firm Name</Label>
                            <Input placeholder="e.g. Apex Construction" value={em.company}
                              onChange={(e) => { const v = [...data.employment]; v[i].company = e.target.value; setData({ ...data, employment: v }); }} />
                          </div>
                          <div className="md:col-span-6 space-y-1">
                            <Label>Job Title / Role</Label>
                            <Input placeholder="e.g. Senior Quantity Surveyor" value={em.role}
                              onChange={(e) => { const v = [...data.employment]; v[i].role = e.target.value; setData({ ...data, employment: v }); }} />
                          </div>
                          <div className="md:col-span-5 space-y-1">
                            <Label>From</Label>
                            <MonthYearPicker value={em.from} placeholder="Select start date"
                              onChange={(val) => { const v = [...data.employment]; v[i].from = val; setData({ ...data, employment: v }); }} />
                          </div>
                          <div className="md:col-span-5 space-y-1">
                            <Label>To</Label>
                            <MonthYearPicker value={em.to} allowPresent={true} placeholder="Select end date or 'Present'"
                              onChange={(val) => { const v = [...data.employment]; v[i].to = val; setData({ ...data, employment: v }); }} />
                          </div>
                          <div className="md:col-span-2 flex items-end gap-1 pb-0.5">
                            {em.id ? (
                              <Button variant="ghost" size="icon"
                                onClick={() => delEmpMutation.mutate(em.id)}
                                disabled={delEmpMutation.isPending}
                                className="text-red-500 hover:bg-red-50 h-10 w-10 shrink-0">
                                {delEmpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            ) : (
                              <>
                                <Button size="sm"
                                  className="bg-navy text-white hover:bg-navy/90 border-none text-xs"
                                  disabled={!appId || addEmpMutation.isPending || !em.company || !em.role || !em.from}
                                  onClick={() => {
                                    if (!appId) return toast.error("Save the classifiers first (step 3)");
                                    if (!em.company || !em.role || !em.from) return toast.error("Fill in company, role, and start date");
                                    const isCurrent = em.to?.toLowerCase() === "present";
                                    addEmpMutation.mutate({
                                      applicationId: appId,
                                      companyName: em.company,
                                      jobTitle: em.role,
                                      startDate: em.from.split('-').length === 3 ? em.from : `${em.from}-01`,
                                      endDate: isCurrent ? undefined : (em.to ? (em.to.split('-').length === 3 ? em.to : `${em.to}-01`) : undefined),
                                      isCurrent,
                                    });
                                  }}>
                                  {addEmpMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                                </Button>
                                {data.employment.length > 1 && (
                                  <Button variant="ghost" size="icon"
                                    onClick={() => { const v = data.employment.filter((_: any, idx: number) => idx !== i); setData({ ...data, employment: v }); }}
                                    className="text-red-500 hover:bg-red-50 h-10 w-10 shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm"
                        onClick={() => setData({ ...data, employment: [...data.employment, { company: "", role: "", from: "", to: "" }] })}>
                        <Plus className="mr-1 h-3 w-3" /> Add employment record
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* ── Education ── */}
              {currentStepName === "Education" && (
                <div className="space-y-4">
                  {data.education.map((ed: any, i: number) => (
                    <div key={ed.id || i} className="relative grid gap-4 border border-zinc-150 p-4 rounded-md md:grid-cols-12 bg-zinc-50/50">
                      <div className="md:col-span-12 space-y-1">
                        <Label>University / Polytechnic</Label>
                        <Input placeholder="e.g. University of Rwanda" value={ed.institution}
                          onChange={(e) => { const v = [...data.education]; v[i].institution = e.target.value; setData({ ...data, education: v }); }} />
                      </div>
                      <div className="md:col-span-12 space-y-1">
                        <Label>Field Of Study</Label>
                        <Input placeholder="e.g. Quantity Surveying" value={ed.studyField}
                          onChange={(e) => { const v = [...data.education]; v[i].studyField = e.target.value; setData({ ...data, education: v }); }} />
                      </div>
                      <div className="md:col-span-12 space-y-1">
                        <Label>Degree Type</Label>
                        <Select value={ed.degree} onValueChange={(val) => { const v = [...data.education]; v[i].degree = val; setData({ ...data, education: v }); }}>
                          <SelectTrigger className="h-10 border-zinc-200 bg-white"><SelectValue placeholder="Select Degree Type" /></SelectTrigger>
                          <SelectContent>
                            {["Diploma", "Bachelor's Degree", "Master's Degree", "Doctoral Degree (PhD)"].map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-6 space-y-1">
                        <Label>Start Date</Label>
                        <MonthYearPicker value={ed.startDateRaw} placeholder="Select start date"
                          onChange={(val) => {
                            const v = [...data.education];
                            v[i].startDateRaw = val;
                            setData({ ...data, education: v });
                          }} />
                      </div>
                      <div className="md:col-span-6 space-y-1">
                        <Label>End Date</Label>
                        <MonthYearPicker value={ed.startMonthYear} placeholder="Select end date"
                          onChange={(val) => {
                            const v = [...data.education];
                            v[i].startMonthYear = val;
                            setData({ ...data, education: v });
                          }} />
                      </div>
                      <div className="md:col-span-2 flex items-end gap-1 pb-0.5">
                        {ed.id ? (
                          <Button variant="ghost" size="icon"
                            onClick={() => delEduMutation.mutate(ed.id)}
                            disabled={delEduMutation.isPending}
                            className="text-red-500 hover:bg-red-50 h-10 w-10 shrink-0">
                            {delEduMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        ) : (
                          <>
                            <Button size="sm"
                              className="bg-navy text-white hover:bg-navy/90 border-none text-xs"
                              disabled={!appId || addEduMutation.isPending || !ed.institution || !ed.studyField || !ed.degree || !ed.startDateRaw}
                              onClick={() => {
                                if (!appId) return toast.error("Save the classifiers first (step 3)");
                                if (!ed.institution || !ed.studyField || !ed.degree || !ed.startDateRaw) return toast.error("Fill in institution, field, degree type, and start date");
                                const endDate = ed.startMonthYear && ed.startMonthYear.toLowerCase() !== "present" 
                                  ? (ed.startMonthYear.split('-').length === 3 ? ed.startMonthYear : `${ed.startMonthYear}-01`) 
                                  : new Date().toISOString().split("T")[0];
                                addEduMutation.mutate({
                                  applicationId: appId,
                                  institution: ed.institution,
                                  qualificationType: ed.degree,
                                  fieldOfStudy: ed.studyField,
                                  startDate: ed.startDateRaw.split('-').length === 3 ? ed.startDateRaw : `${ed.startDateRaw}-01`,
                                  endDate,
                                });
                              }}>
                              {addEduMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                            </Button>
                            {data.education.length > 1 && (
                              <Button variant="ghost" size="icon"
                                onClick={() => { const v = data.education.filter((_: any, idx: number) => idx !== i); setData({ ...data, education: v }); }}
                                className="text-red-500 hover:bg-red-50 h-10 w-10 shrink-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm"
                    onClick={() => setData({ ...data, education: [...data.education, { degree: "Bachelor's Degree", institution: "", studyField: "", startMonthYear: "", startDateRaw: "" }] })}>
                    <Plus className="mr-1 h-3 w-3" /> Add Academic Record
                  </Button>
                </div>
              )}

              {/* ── Mentorship Plan ── */}
              {currentStepName === "Mentorship Plan" && (
                <div className="space-y-4">
                  <div className="border-l-4 border-gold bg-gold/10 p-4 text-sm text-[#8a5c00]">
                    As a Graduate applicant, you must be assigned to a registered Mentor (a Professional or Technologist) for promotion to Technologist or Professional standing. Each Mentor can supervise <strong>up to 5 graduates</strong>. Nominate your preferred mentor below — the secretariat will confirm availability.
                  </div>
                  {data.mentors.map((m: any, i: number) => (
                    <div key={i} className="grid gap-3 border p-4 rounded-md md:grid-cols-[1fr_1fr_1fr_auto] bg-zinc-50/50">
                      <div>
                        <Label>Membership ID</Label>
                        <div className="flex gap-2">
                          <Input placeholder="e.g. RQIS-001" value={m.membershipId || ""}
                            onChange={(e) => { const v = [...data.mentors]; v[i].membershipId = e.target.value; setData({ ...data, mentors: v }); }}
                            onBlur={() => verifyMentor(i, m.membershipId)}
                          />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => verifyMentor(i, m.membershipId)}
                            disabled={verifyingMentorIdx === i || !m.membershipId}
                            title="Verify Mentor"
                          >
                            {verifyingMentorIdx === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Mentor's full name</Label>
                        <Input placeholder="Auto-filled" value={m.name} disabled className="bg-zinc-100" />
                      </div>
                      <div>
                        <Label>Contact (email/phone)</Label>
                        <Input placeholder="Auto-filled" value={m.contact} disabled className="bg-zinc-100" />
                      </div>
                      <div className="flex items-end gap-1 pb-0.5">
                        {m.isSaved ? (
                          <Button variant="ghost" size="icon" 
                            onClick={() => delMentorMutation.mutate(m.membershipId)}
                            disabled={delMentorMutation.isPending}
                            className="text-red-500 hover:bg-red-50 shrink-0 h-10 w-10">
                            {delMentorMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        ) : (
                          <>
                            {m.name && (
                              <Button size="sm"
                                className="bg-navy text-white hover:bg-navy/90 border-none text-xs"
                                disabled={!appId || mentorshipMutation.isPending}
                                onClick={() => {
                                  mentorshipMutation.mutate({
                                    applicationId: appId,
                                    mentorshipPlan: data.mentorPlan,
                                    options: data.mentors.map((opt: any) => ({
                                      regNumber: opt.membershipId,
                                      name: opt.name,
                                      contact: opt.contact
                                    })).filter((opt: any) => opt.regNumber)
                                  });
                                }}>
                                {mentorshipMutation.isPending ? "..." : "Save"}
                              </Button>
                            )}
                            {data.mentors.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeMentor(i)} className="text-red-500 hover:bg-red-50 shrink-0 h-10 w-10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{data.mentors.length} / 5 mentor nominations</p>
                    <Button variant="outline" size="sm" onClick={addMentor} disabled={data.mentors.length >= 5}>
                      <Plus className="mr-1 h-3 w-3" /> Add another mentor option
                    </Button>
                  </div>
                  <div>
                    <Label>Mentorship plan</Label>
                    <Textarea rows={4} value={data.mentorPlan}
                      onChange={(e) => setData({ ...data, mentorPlan: e.target.value })}
                      placeholder="Briefly describe your mentorship plan and learning goals..." />
                  </div>
                </div>
              )}

              {/* ── Other Documents ── */}
              {currentStepName === "Other Documents" && (
                <div className="space-y-4">
                  <div className="border-l-4 border-gold bg-gold/10 p-5 text-sm text-[#8a5c00] rounded-r-md">
                    <h3 className="font-bold text-navy mb-2">Final Documentation</h3>
                    <p className="leading-relaxed">
                      Please upload any remaining documents required for your application below. These may include your Application Letter, CPD Activities, Membership Certificates from other countries, Visas, and Proof of Payment depending on your category.
                    </p>
                    <p className="mt-2 font-semibold">
                      Once all required documents are marked with a green checkmark, you may proceed to Review & Submit.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {contextualChecklist.map((d: any) => {
                      const hasDoc = !!data.docs[d.k];
                      const isUploading = data.docs[d.k] === "uploading_from_client";
                      const isLoadingBackend = data.docs[d.k] === "loading_from_backend";
                      const isPending = isUploading || isLoadingBackend;
                      const isCollapsed = collapsedDocs[d.k] || false;
                      return (
                        <div key={d.k} className={cn("relative border border-dashed border-zinc-300 rounded-sm p-4 bg-white transition-all", hasDoc ? "col-span-1 md:col-span-2" : "")}>
                          {!hasDoc ? (
                            <div className="flex items-center gap-4">
                              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    if (!appId) { toast.error("Please save first step before uploading."); return; }
                                    setData({ ...data, docs: { ...data.docs, [d.k]: "uploading_from_client" } });
                                    uploadFileMutation.mutate({ file, documentType: d.k }, {
                                      onSuccess: () => {
                                        const isImg = file.type.startsWith("image/") || file.name.match(/\.(jpeg|jpg|gif|png)$/i);
                                        setData((prev: any) => ({ ...prev, docs: { ...prev.docs, [d.k]: URL.createObjectURL(file) + (isImg ? "#image" : "#pdf") } }));
                                        // Ensure it's expanded when a new file is uploaded
                                        setCollapsedDocs(prev => ({ ...prev, [d.k]: false }));
                                      }
                                    });
                                  }
                                }}
                              />
                              <div className="w-12 h-12 flex items-center justify-center bg-[#fef4e5] text-navy rounded-sm shrink-0">
                                <Upload className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className="text-sm font-semibold text-navy truncate">{d.l}</p>
                                  {d.r && <span className="text-red-500 shrink-0">*</span>}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">Click to upload</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 relative z-10">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 rounded-sm shrink-0 cursor-pointer" onClick={() => !isPending && setCollapsedDocs(prev => ({ ...prev, [d.k]: !prev[d.k] }))}>
                                    {isPending ? <Loader2 className="h-5 w-5 animate-spin text-gold" /> : <CheckCircle2 className="h-5 w-5" />}
                                  </div>
                                  <div className={cn("select-none flex-1", !isPending && "cursor-pointer")} onClick={() => !isPending && setCollapsedDocs(prev => ({ ...prev, [d.k]: !prev[d.k] }))}>
                                    <p className="text-sm font-semibold text-navy truncate">{d.l}</p>
                                    <p className="text-xs text-green-600">
                                      {isUploading ? "Uploading document..." : isLoadingBackend ? "Loading document..." : "Successfully uploaded"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!isPending && (
                                    <Button variant="ghost" size="sm" onClick={() => setCollapsedDocs(prev => ({ ...prev, [d.k]: !prev[d.k] }))} className="text-muted-foreground hover:bg-zinc-100 hidden sm:flex">
                                      {isCollapsed ? <><ChevronDown className="h-4 w-4 mr-1" /> Expand</> : <><ChevronUp className="h-4 w-4 mr-1" /> Collapse</>}
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    const newDocs = { ...data.docs };
                                    delete newDocs[d.k];
                                    setData({ ...data, docs: newDocs });
                                    if (appId) {
                                      deleteDocumentMutation.mutate({ appId, documentType: d.k });
                                    }
                                  }} className="text-red-500 hover:bg-red-50" disabled={isPending || deleteDocumentMutation.isPending}>
                                    {deleteDocumentMutation.isPending && deleteDocumentMutation.variables?.documentType === d.k ? <Loader2 className="h-4 w-4 mr-1 md:mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 sm:mr-2" />} <span className="hidden sm:inline">Remove</span>
                                  </Button>
                                </div>
                              </div>
                              <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                  >
                                    <div className="w-full h-[450px] border rounded-md overflow-hidden bg-zinc-50 relative mt-2">
                                      {isPending ? (
                                        <div className="w-full h-full p-4 flex flex-col gap-4 bg-zinc-100 animate-pulse">
                                          <div className="w-full h-12 bg-zinc-200 rounded-md" />
                                          <div className="w-full flex-1 bg-zinc-200 rounded-md" />
                                        </div>
                                      ) : data.docs[d.k].match(/\.(jpeg|jpg|gif|png)$/i) != null || data.docs[d.k].startsWith('data:image') || data.docs[d.k].includes('#image') ? (
                                        <img src={data.docs[d.k]} className="w-full h-full object-contain pointer-events-auto" />
                                      ) : (
                                        <PDFViewer src={data.docs[d.k]} fileName={d.l} />
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Review & Submit ── */}
              {currentStepName === "Review & Submit" && (
                <div className="space-y-4">
                  <div className="bg-zinc-50 p-5 text-sm space-y-2.5 rounded-md border border-zinc-100">
                    {[
                      ["Practice Location Status", data.practiceLocation],
                      ["Entity Registration Mode", data.entityType],
                      ["Assessment Category", data.categoryName || "Not selected"],
                      ["Full Name on Application", data.personal.fullName || "Not Entered"],
                      ["Contact Phone Number", data.personal.phone || "Not Entered"],
                      ["Primary Contact Email", data.personal.email || "Not Entered"],
                      ...(data.entityType === "Individual"
                        ? [
                            ["Academic Credentials Added", `${data.education.filter((x: any) => x.id).length} verified`],
                            ["Employment Record Rows", data.hasNoEmployment ? "None (Never Employed)" : `${data.employment.filter((x: any) => x.id).length} verified`],
                          ]
                        : [
                            ["Registered Shareholders", `${data.personal.shareholders.filter((x: any) => x.fullName).length} items`],
                            ["Firm Office Location", data.personal.firmAddress || "Not Entered"],
                          ]),
                      ["Attached Document Safe Files", `${Object.values(data.docs).filter(Boolean).length} uploads completed`],
                    ].map(([k, v]) => (
                      <div key={k as string} className="grid grid-cols-2 gap-2 pb-2 border-b border-zinc-100 last:border-0 last:pb-0">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-semibold text-navy text-right truncate">{v as any}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-l-4 border-gold bg-gold/10 p-4 text-sm text-[#8a5c00] rounded-r-md leading-relaxed">
                    <FileText className="mr-2 inline h-4 w-4 text-gold" />
                    By submitting this application, you declare that all uploaded certifications and declarations represent legal facts. RIQS Councils will complete the review queue within 5–10 working days.
                  </div>
                  <div className="flex items-start space-x-3 mt-4 mb-2">
                    <Checkbox id="terms" checked={data.agreedToTerms}
                      onCheckedChange={(checked) => setData({ ...data, agreedToTerms: checked === true })} />
                    <Label htmlFor="terms" className="text-sm leading-snug cursor-pointer -mt-0.5 text-navy">
                      I agree to the terms and conditions of RIQS. I declare that all provided information is true. I understand that submitting false information will lead to application rejection and potential legal action.
                    </Label>
                  </div>
                  <Button
                    disabled={!data.agreedToTerms || submitMutation.isPending || !appId}
                    onClick={submit}
                    className="w-full h-12 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-bold border-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : "Submit final application"}
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>



      </div>
      </div>

    {/* Right Side: Contextual Document Uploader */}
    {(contextualChecklist.length > 0 && currentStepName !== "Other Documents") && (
      <div className="lg:col-span-7 flex flex-col relative sticky top-6 h-[calc(100vh-48px)]">
        <DocumentTabsViewer 
          tabs={[
            ...contextualChecklist.map((d: any) => {
              let label = d.l;
              if (d.k === "degree") label = "Degree 1";
              if (d.k === "transcripts") label = "Transcript 1";
              return {
                k: d.k,
                l: label,
                r: d.r,
                url: data.docs[d.k] || null
              };
            }),
            ...(data.dynamicTabs || [])
              .filter((t: any) => contextualChecklist.some((c: any) => c.k === t.base))
              .map((t: any) => ({
                k: t.k,
                l: t.l,
                r: false,
                url: data.docs[t.k] || null
              }))
          ]}
          onUpload={(key, file) => {
            if (!appId) {
              toast.error("Please save the first step before uploading documents.");
              return;
            }
            const isImg = file.type.startsWith("image/") || file.name.match(/\.(jpeg|jpg|gif|png)$/i);
            const url = URL.createObjectURL(file) + (isImg ? "#image" : "#pdf");
            setData({ ...data, docs: { ...data.docs, [key]: url } });
            uploadFileMutation.mutate({ file, documentType: key });
          }}
          onDelete={(key) => {
            const newDocs = { ...data.docs };
            delete newDocs[key];
            const newDynamicTabs = (data.dynamicTabs || []).filter((t: any) => t.k !== key);
            setData({ ...data, docs: newDocs, dynamicTabs: newDynamicTabs });
            if (appId) {
              deleteDocumentMutation.mutate({ appId, documentType: key });
            }
            toast.success("Document removed");
          }}
          onAddTab={(activeTabKey, file) => {
            let baseTab = contextualChecklist.find((c: any) => c.k === activeTabKey);
            if (!baseTab) {
              const dTab = (data.dynamicTabs || []).find((t: any) => t.k === activeTabKey);
              if (dTab) {
                baseTab = contextualChecklist.find((c: any) => c.k === dTab.base);
              }
            }
            if (!baseTab) baseTab = contextualChecklist[0];
            if (!baseTab) return;
            
            const existingDynamicCount = (data.dynamicTabs || []).filter((t: any) => t.base === baseTab.k).length;
            const newKey = `${baseTab.k}_${Date.now()}`;
            
            let cleanLabel = baseTab.l;
            if (cleanLabel.toLowerCase().includes("degree") && cleanLabel.includes("supporting")) cleanLabel = "Degrees supporting documents";
            else if (cleanLabel.toLowerCase().includes("degree")) cleanLabel = "Degree";
            if (cleanLabel.toLowerCase().includes("certificate")) cleanLabel = "Certificate";
            
            const newLabel = `${cleanLabel} ${existingDynamicCount + 2}`;

            const isImg = file.type.startsWith("image/") || file.name.match(/\.(jpeg|jpg|gif|png)$/i);
            const url = URL.createObjectURL(file) + (isImg ? "#image" : "#pdf");

            if (!appId) {
              toast.error("Please save the first step before uploading documents.");
              return;
            }

            setData({
              ...data,
              docs: { ...data.docs, [newKey]: url },
              dynamicTabs: [
                ...(data.dynamicTabs || []),
                { k: newKey, l: newLabel, base: baseTab.k }
              ]
            });
            uploadFileMutation.mutate({ file, documentType: newKey });
          }}
        />
      </div>
    )}
    </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 mt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <Button variant="outline" onClick={back} disabled={step === 0} className="border-zinc-200 bg-white dark:bg-zinc-900">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 && (() => {
          const isNextDisabled = () => {
            if (isSaving) return true;
            if (contextualChecklist.filter((d: any) => d.r).some((d: any) => !data.docs[d.k] || data.docs[d.k] === "loading_from_backend" || data.docs[d.k] === "uploading_from_client")) return true;
            return false;
          };
          return (
            <Button onClick={next} disabled={isNextDisabled()}
              className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold">
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <>Next <ChevronRight className="ml-2 h-4 w-4" /></>}
            </Button>
          );
        })()}
      </div>
    </div>
  );
}
