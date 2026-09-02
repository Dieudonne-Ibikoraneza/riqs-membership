"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MonthYearPicker } from "@/components/ui/month-picker";
import PDFViewer from "@/components/ui/pdf-viewer";
import ImageViewer from "@/components/ui/image-viewer";
import {
  Lock, Plus, Loader2, User, Pencil, Upload, Trash2, Send, Clock,
  XCircle, GraduationCap, Briefcase, Info, FileText, Eye, ChevronUp,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import { cn } from "@/lib/utils";

type Address = { district: string; sector: string; cell: string; village: string };
const emptyAddress: Address = { district: "", sector: "", cell: "", village: "" };

function isAddressObject(v: any): v is Address {
  return v && typeof v === "object" && !Array.isArray(v);
}

function formatMonthYear(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function LockedField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
        {label} <Lock className="h-3 w-3 text-gold" />
      </Label>
      <Input value={value} disabled readOnly className="mt-1 bg-zinc-50 dark:bg-zinc-950 cursor-not-allowed border-zinc-200 dark:border-zinc-800" />
    </div>
  );
}

function RequestStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { icon: any; cls: string }> = {
    Pending: { icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400" },
    Rejected: { icon: XCircle, cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400" },
  };
  const c = cfg[status] || cfg.Pending;
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-semibold", c.cls)}>
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
}

interface DraftEducation {
  institution: string;
  qualificationType: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  certificateFile: File | null;
  // Set only on entries hydrated from a pending/rejected request — points
  // to the certificate already uploaded to storage (no local File to preview).
  certificateUrl?: string;
}

interface DraftEmployment {
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

const emptyEducation: DraftEducation = { institution: "", qualificationType: "", fieldOfStudy: "", startDate: "", endDate: "", certificateFile: null };
const emptyEmployment: DraftEmployment = { companyName: "", jobTitle: "", startDate: "", endDate: "", isCurrent: false };

export default function Profile() {
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.applicant.profile(),
    queryFn: applicantServices.getProfile,
  });

  const { data: requestsData } = useQuery({
    queryKey: ["profileEditRequests", "mine"],
    queryFn: applicantServices.getMyProfileEditRequests,
  });

  // The backend guarantees at most one ProfileEditRequest row per member —
  // a resubmission updates that same row rather than creating a new one,
  // and an approval deletes it outright. So there is never more than one
  // request to reason about here: if it exists it's either the thing
  // currently awaiting review (Pending) or the last rejection (Rejected,
  // still editable so the member can fix and resubmit). If it doesn't
  // exist, the live member profile is the source of truth.
  const requests = requestsData?.requests || [];
  const myRequest = requests[0] || null;
  const pendingRequest = myRequest?.status === "Pending" ? myRequest : undefined;
  const rejectedRequest = myRequest?.status === "Rejected" ? myRequest : undefined;
  const restoreSource = myRequest;
  const isRwandan = data?.application?.practiceLocation !== "Non_Rwandan";

  // Editable field state — unlocked from the start, no separate "edit mode".
  const [name, setName] = useState("");
  const [residentAddress, setResidentAddress] = useState<Address>(emptyAddress);
  const [residentAddressText, setResidentAddressText] = useState("");
  const [workAddress, setWorkAddress] = useState<Address>(emptyAddress);
  const [workAddressText, setWorkAddressText] = useState("");
  // Identity fields a member created outside the normal application flow (e.g. bulk-imported
  // from the legacy roster) never had a chance to submit — only proposable here while still
  // empty on their record; once set, they show as a LockedField like email/phone always have.
  const [nationalId, setNationalId] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [memberNotes, setMemberNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [newEducation, setNewEducation] = useState<DraftEducation[]>([]);
  const [expandedCert, setExpandedCert] = useState<string | null>(null);
  const [eduDraft, setEduDraft] = useState<DraftEducation>(emptyEducation);
  const certificatePreviewUrl = useMemo(
    () => (eduDraft.certificateFile ? URL.createObjectURL(eduDraft.certificateFile) : null),
    [eduDraft.certificateFile]
  );
  const [newEmployment, setNewEmployment] = useState<DraftEmployment[]>([]);
  const [empDraft, setEmpDraft] = useState<DraftEmployment>(emptyEmployment);

  // Baselines to diff against for "is this dirty" detection.
  const [baseline, setBaseline] = useState<{ name: string; residentAddress: Address; residentAddressText: string; workAddress: Address; workAddressText: string; nationalId: string; dob: string; gender: string } | null>(null);

  useEffect(() => {
    if (!data?.profile) return;
    const m = data.profile;
    const resAddr = isAddressObject(m.residencyAddress) ? (m.residencyAddress as Address) : emptyAddress;
    const resText = typeof m.residencyAddress === "string" ? m.residencyAddress : "";
    const workAddr = isAddressObject(m.workAddress) ? (m.workAddress as Address) : emptyAddress;
    const workText = typeof m.workAddress === "string" ? m.workAddress : "";
    const dobValue = m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().slice(0, 10) : "";

    setName(m.fullName || "");
    setResidentAddress(resAddr);
    setResidentAddressText(resText);
    setWorkAddress(workAddr);
    setWorkAddressText(workText);
    setNationalId(m.nationalIdOrPassport || "");
    setDob(dobValue);
    setGender(m.gender || "");
    setBaseline({
      name: m.fullName || "", residentAddress: resAddr, residentAddressText: resText, workAddress: workAddr, workAddressText: workText,
      nationalId: m.nationalIdOrPassport || "", dob: dobValue, gender: m.gender || "",
    });
  }, [data]);

  // While a request is pending review, keep showing exactly what was
  // submitted — otherwise a refresh (or the state-reset after submitting)
  // makes it look like the education/employment/photo/name changes just
  // vanished, when really they're sitting in the pending request.
  useEffect(() => {
    if (!restoreSource) return;
    if (restoreSource.proposedFullName) setName(restoreSource.proposedFullName);
    if (restoreSource.proposedResidencyAddress) {
      if (isAddressObject(restoreSource.proposedResidencyAddress)) setResidentAddress(restoreSource.proposedResidencyAddress as Address);
      else setResidentAddressText(restoreSource.proposedResidencyAddress as string);
    }
    if (restoreSource.proposedWorkAddress) {
      if (isAddressObject(restoreSource.proposedWorkAddress)) setWorkAddress(restoreSource.proposedWorkAddress as Address);
      else setWorkAddressText(restoreSource.proposedWorkAddress as string);
    }
    if (restoreSource.proposedNationalIdOrPassport) setNationalId(restoreSource.proposedNationalIdOrPassport);
    if (restoreSource.proposedDateOfBirth) setDob(new Date(restoreSource.proposedDateOfBirth).toISOString().slice(0, 10));
    if (restoreSource.proposedGender) setGender(restoreSource.proposedGender);
    if (restoreSource.proposedProfilePhotoUrl) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const token = typeof window !== "undefined" ? localStorage.getItem("riqs.auth.token") : "";
      setPhotoPreview(`${apiBase}/files/downloadByUrl?url=${encodeURIComponent(restoreSource.proposedProfilePhotoUrl)}&token=${token}`);
    }
    if (restoreSource.proposedEducation?.length > 0) {
      setNewEducation(restoreSource.proposedEducation.map((e: any) => ({ ...e, certificateFile: null })));
    }
    if (restoreSource.proposedEmployment?.length > 0) {
      setNewEmployment(restoreSource.proposedEmployment);
    }
  }, [restoreSource?.id]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Photo must be less than 5MB");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const addEducationDraft = () => {
    if (!eduDraft.institution || !eduDraft.qualificationType || !eduDraft.fieldOfStudy || !eduDraft.startDate || !eduDraft.endDate) {
      return toast.error("Fill in institution, field of study, degree type, start date, and end date.");
    }
    setNewEducation([...newEducation, eduDraft]);
    setEduDraft(emptyEducation);
  };

  const addEmploymentDraft = () => {
    if (!empDraft.companyName || !empDraft.jobTitle || !empDraft.startDate) {
      return toast.error("Fill in company, job title, and start date.");
    }
    if (!empDraft.isCurrent && !empDraft.endDate) {
      return toast.error("Add an end date, or mark this as your current role.");
    }
    setNewEmployment([...newEmployment, empDraft]);
    setEmpDraft(emptyEmployment);
  };

  // A draft is "filled" the moment the member starts typing into it — even
  // before they click "Add" — and "complete" once it has every required
  // field. Both states matter: filled-but-incomplete drafts must still
  // surface the submit button (so the member knows they have unsaved work)
  // but must block submission until finished, otherwise the typed data
  // would silently vanish since only newEducation/newEmployment get sent.
  const isEducationDraftFilled = (d: DraftEducation) => !!(d.institution || d.qualificationType || d.fieldOfStudy || d.startDate || d.endDate || d.certificateFile);
  const isEducationDraftComplete = (d: DraftEducation) => !!(d.institution && d.qualificationType && d.fieldOfStudy && d.startDate && d.endDate);
  const isEmploymentDraftFilled = (d: DraftEmployment) => !!(d.companyName || d.jobTitle || d.startDate || d.endDate || d.isCurrent);
  const isEmploymentDraftComplete = (d: DraftEmployment) => !!(d.companyName && d.jobTitle && d.startDate && (d.isCurrent || d.endDate));

  const hasChanges = useMemo(() => {
    if (!baseline) return false;
    return (
      name !== baseline.name ||
      JSON.stringify(residentAddress) !== JSON.stringify(baseline.residentAddress) ||
      residentAddressText !== baseline.residentAddressText ||
      JSON.stringify(workAddress) !== JSON.stringify(baseline.workAddress) ||
      workAddressText !== baseline.workAddressText ||
      nationalId !== baseline.nationalId ||
      dob !== baseline.dob ||
      gender !== baseline.gender ||
      !!photoFile ||
      newEducation.length > 0 ||
      newEmployment.length > 0 ||
      isEducationDraftFilled(eduDraft) ||
      isEmploymentDraftFilled(empDraft)
    );
  }, [name, residentAddress, residentAddressText, workAddress, workAddressText, nationalId, dob, gender, photoFile, newEducation, newEmployment, eduDraft, empDraft, baseline]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Fold in-progress drafts that were never explicitly "Added" into the
      // submission too, so filling the form is enough — the member doesn't
      // have to remember to click Add before requesting the update.
      const allEducation = isEducationDraftComplete(eduDraft) ? [...newEducation, eduDraft] : newEducation;
      const allEmployment = isEmploymentDraftComplete(empDraft) ? [...newEmployment, empDraft] : newEmployment;

      const certificates: Record<number, File> = {};
      allEducation.forEach((e, i) => { if (e.certificateFile) certificates[i] = e.certificateFile; });

      const finalResidentAddress = isRwandan ? residentAddress : residentAddressText;
      const finalWorkAddress = isRwandan ? workAddress : workAddressText;
      const baselineResident = isRwandan ? baseline?.residentAddress : baseline?.residentAddressText;
      const baselineWork = isRwandan ? baseline?.workAddress : baseline?.workAddressText;

      return applicantServices.submitProfileEditRequest({
        fullName: name !== baseline?.name ? name : undefined,
        residencyAddress: JSON.stringify(finalResidentAddress) !== JSON.stringify(baselineResident) ? finalResidentAddress : undefined,
        workAddress: JSON.stringify(finalWorkAddress) !== JSON.stringify(baselineWork) ? finalWorkAddress : undefined,
        nationalIdOrPassport: nationalId !== baseline?.nationalId ? nationalId : undefined,
        dateOfBirth: dob !== baseline?.dob ? dob : undefined,
        gender: gender !== baseline?.gender ? gender : undefined,
        memberNotes: memberNotes || undefined,
        education: allEducation.length > 0 ? allEducation.map(e => ({
          institution: e.institution, qualificationType: e.qualificationType, fieldOfStudy: e.fieldOfStudy,
          startDate: e.startDate, endDate: e.endDate
        })) : undefined,
        employment: allEmployment.length > 0 ? allEmployment.map(e => ({
          companyName: e.companyName, jobTitle: e.jobTitle, startDate: e.startDate,
          endDate: e.isCurrent ? undefined : e.endDate, isCurrent: e.isCurrent
        })) : undefined,
        photo: photoFile,
        certificates: Object.keys(certificates).length > 0 ? certificates : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Profile update request submitted for review.");
      queryClient.invalidateQueries({ queryKey: ["profileEditRequests", "mine"] });
      // Don't clear photoPreview/newEducation/newEmployment here — the
      // request is now Pending, and the hydration effect above will keep
      // showing exactly what was submitted (from the server) once the
      // invalidated query refetches, instead of the page looking like the
      // changes just disappeared.
      setPhotoFile(null);
      setEduDraft(emptyEducation);
      setEmpDraft(emptyEmployment);
      setMemberNotes("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to submit profile update request"),
  });

  const handleSubmitClick = () => {
    if (isEducationDraftFilled(eduDraft) && !isEducationDraftComplete(eduDraft)) {
      return toast.error("Finish the education entry you started (institution, field of study, degree type, start date, and end date) or clear it before submitting.");
    }
    if (isEmploymentDraftFilled(empDraft) && !isEmploymentDraftComplete(empDraft)) {
      return toast.error("Finish the employment entry you started (company, job title, start date, and end date or current role) or clear it before submitting.");
    }
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-2"></div>
          <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
        </div>
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
                <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-900 rounded-md"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center space-y-4 text-center">
        <p className="text-muted-foreground">Unable to load profile data.</p>
      </div>
    );
  }

  const member = data.profile;
  const eduRecords = data.education || [];
  const empRecords = data.employment || [];
  const isFirm = data.application?.entityType === "Firm" || member.membershipClass?.includes("Firm");
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  const token = typeof window !== "undefined" ? localStorage.getItem("riqs.auth.token") : "";
  const locked = !!pendingRequest;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Profile</h1>
        <p className="text-sm text-muted-foreground font-sans">Update your details below. Changes are reviewed by RIQS staff before they take effect.</p>
      </div>

      {pendingRequest && (
        <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/10 dark:border-amber-900/40">
          <CardContent className="p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-400 text-sm">Profile update request pending review</p>
              <p className="text-xs text-amber-800/80 dark:text-amber-500/80 mt-0.5">
                Submitted {new Date(pendingRequest.createdAt).toLocaleDateString()}. Fields are locked until this request is resolved.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {rejectedRequest && (
        <div className="space-y-2">
          <Card className="border-red-200 bg-red-50/30 dark:bg-red-950/10 dark:border-red-900/40">
            <CardContent className="p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-400 text-sm">Your last profile update request was rejected</p>
                {rejectedRequest.reviewNotes && <p className="text-xs text-red-800/80 dark:text-red-500/80 mt-0.5">Reason: {rejectedRequest.reviewNotes}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Profile Section ── */}
      <Card className="border-zinc-100 dark:border-zinc-800">
        <CardHeader className="border-b border-zinc-50 dark:border-zinc-800/50 py-4">
          <CardTitle className="text-navy flex items-center gap-2"><User className="h-4.5 w-4.5 text-gold" /> Profile</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-7 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="prof-name">Full Name</Label>
                <Input id="prof-name" placeholder="e.g. Demo Member" value={name} disabled={locked} onChange={e => setName(e.target.value)} />
              </div>
              <LockedField label="Primary Email Address" value={member.email || ""} />
              <LockedField label="Mobile Phone" value={member.phoneNumber || ""} />
              {member.nationalIdOrPassport ? (
                <LockedField label="National ID / Passport" value={member.nationalIdOrPassport} />
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="prof-national-id">National ID / Passport</Label>
                  <Input id="prof-national-id" placeholder="Not on file — add yours" value={nationalId} disabled={locked} onChange={e => setNationalId(e.target.value)} />
                </div>
              )}
              {member.dateOfBirth ? (
                <LockedField label="Date of Birth" value={new Date(member.dateOfBirth).toLocaleDateString()} />
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="prof-dob">Date of Birth</Label>
                  <Input id="prof-dob" type="date" value={dob} disabled={locked} onChange={e => setDob(e.target.value)} />
                </div>
              )}
              {member.gender ? (
                <LockedField label="Gender" value={member.gender} />
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="prof-gender">Gender</Label>
                  <Select value={gender} disabled={locked} onValueChange={setGender}>
                    <SelectTrigger id="prof-gender"><SelectValue placeholder="Not on file — select yours" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <LockedField label="Practice Category" value={data.application?.category_name || member.membershipClass || ""} />
            </div>

            {!isFirm && (
              <div className="md:col-span-5 flex flex-col">
                <Label className="mb-1">Passport Size Photo</Label>
                <input type="file" accept="image/jpeg, image/png" className="hidden" ref={photoInputRef} onChange={handlePhotoSelect} disabled={locked} />
                <div
                  onClick={() => { if (!locked) photoInputRef.current?.click(); }}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 text-center transition-colors min-h-[180px] relative overflow-hidden group",
                    !locked && "cursor-pointer",
                    "border-zinc-200 hover:border-navy/50 dark:border-zinc-800 bg-zinc-50/50 hover:bg-zinc-100/50 dark:bg-zinc-900/50"
                  )}
                >
                  {photoPreview || member.profilePhotoUrl ? (
                    <>
                      <img
                        src={photoPreview || `${apiBase}/files/downloadByUrl?url=${encodeURIComponent(member.profilePhotoUrl!)}&token=${token}`}
                        alt="Passport preview"
                        className="w-full h-full object-cover absolute inset-0"
                      />
                      {!locked && (
                        <div
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 p-2 rounded-full backdrop-blur-sm transition-colors shadow-sm cursor-pointer z-10"
                          onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
                        >
                          <Pencil className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <User className="h-12 w-12 mb-3 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400" />
                      <span className="text-sm font-semibold text-navy dark:text-zinc-300">Click to select a photo</span>
                      <Button variant="outline" size="sm" className="mt-4 border-zinc-200 dark:border-zinc-700 pointer-events-none" tabIndex={-1}>
                        <Upload className="h-4 w-4 mr-2" /> Select File
                      </Button>
                    </>
                  )}
                </div>
                {photoFile && <p className="text-xs text-gold mt-1.5 font-semibold">New photo selected — applies once approved.</p>}
              </div>
            )}

            <div className="md:col-span-12 border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3">
              <h4 className="font-semibold text-sm text-navy">Residence Address</h4>
              {isRwandan ? (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                  {(["district", "sector", "cell", "village"] as const).map((field) => (
                    <div key={field} className="space-y-1">
                      <Label className="capitalize">{field}</Label>
                      <Input
                        disabled={locked}
                        placeholder={`e.g. ${field === "district" ? "Gasabo" : field === "sector" ? "Kacyiru" : field === "cell" ? "Kamatamu" : "Amahoro"}`}
                        value={residentAddress[field]}
                        onChange={(e) => setResidentAddress({ ...residentAddress, [field]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Textarea rows={2} disabled={locked} value={residentAddressText} onChange={(e) => setResidentAddressText(e.target.value)} placeholder="Street, city, country" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!isFirm && (
        <>
          {/* ── Education ── */}
          <Card className="border-zinc-100 dark:border-zinc-800">
            <CardHeader className="border-b border-zinc-50 dark:border-zinc-800/50 py-4">
              <CardTitle className="text-navy flex items-center gap-2"><GraduationCap className="h-4.5 w-4.5 text-gold" /> Education</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {eduRecords.map((e: any) => {
                const certKey = `verified-${e.id}`;
                const isExpanded = expandedCert === certKey;
                const certUrl = e.certificateUrl
                  ? `${apiBase}/files/downloadByUrl?url=${encodeURIComponent(e.certificateUrl)}&token=${token}`
                  : null;
                const certIsImage = /\.(jpe?g|png|gif|webp)$/i.test((e.certificateUrl || "").split("?")[0]);

                return (
                  <div key={e.id} className="rounded-md border border-zinc-100 dark:border-zinc-850 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200">{e.qualificationType} in {e.fieldOfStudy}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{e.institution} &middot; {new Date(e.endDate).getFullYear()}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/50">Verified</Badge>
                        {certUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] gap-1.5"
                            onClick={() => setExpandedCert(isExpanded ? null : certKey)}
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {isExpanded ? "Hide" : "View"} Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {isExpanded && certUrl && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 420, opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="mt-3 rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                        >
                          <div className="h-[420px] w-full bg-zinc-50 dark:bg-zinc-950">
                            {certIsImage ? (
                              <ImageViewer src={certUrl} alt={`${e.qualificationType} certificate`} fileName={`${e.qualificationType}_certificate`} />
                            ) : (
                              <PDFViewer src={certUrl} fileName={`${e.qualificationType}_certificate.pdf`} />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {newEducation.map((e, i) => {
                const certKey = `pending-${i}`;
                const isExpanded = expandedCert === certKey;
                const localCertUrl = e.certificateFile ? URL.createObjectURL(e.certificateFile) : null;
                const remoteCertUrl = !e.certificateFile && e.certificateUrl
                  ? `${apiBase}/files/downloadByUrl?url=${encodeURIComponent(e.certificateUrl)}&token=${token}`
                  : null;
                const certUrl = localCertUrl || remoteCertUrl;
                const certIsImage = e.certificateFile
                  ? e.certificateFile.type.startsWith("image/")
                  : /\.(jpe?g|png|gif|webp)$/i.test((e.certificateUrl || "").split("?")[0]);
                const certFileName = e.certificateFile?.name || `${e.qualificationType || "certificate"}`;

                return (
                  <div key={`new-${i}`} className="rounded-md border border-dashed border-gold/50 bg-gold/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200">{e.qualificationType} in {e.fieldOfStudy}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{e.institution}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{formatMonthYear(e.startDate)} to {formatMonthYear(e.endDate)}</div>
                        {!certUrl && <div className="text-xs text-amber-600 mt-1">No supporting certificate attached</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="border-gold/50 text-gold bg-transparent">{locked ? "Pending review" : "Not yet submitted"}</Badge>
                        {certUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] gap-1.5"
                            onClick={() => setExpandedCert(isExpanded ? null : certKey)}
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {isExpanded ? "Hide" : "View"} Certificate
                          </Button>
                        )}
                        {!locked && (
                          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 h-9 w-9" onClick={() => setNewEducation(newEducation.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {isExpanded && certUrl && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 420, opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="mt-3 rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                        >
                          <div className="h-[420px] w-full bg-zinc-50 dark:bg-zinc-950">
                            {certIsImage ? (
                              <ImageViewer src={certUrl} alt={`${certFileName} certificate`} fileName={certFileName} />
                            ) : (
                              <PDFViewer src={certUrl} fileName={`${certFileName}.pdf`} />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {!locked && (
                <div className="relative grid gap-4 border border-zinc-150 dark:border-zinc-800 p-4 rounded-md md:grid-cols-12 bg-zinc-50/50 dark:bg-zinc-900/40">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground md:col-span-12 mb-1">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-navy/60" />
                    <span>Add a new qualification and attach the supporting certificate.</span>
                  </div>

                  {/* Left: form fields */}
                  <div className="md:col-span-7 grid gap-4">
                    <div className="space-y-1">
                      <Label>University / Polytechnic</Label>
                      <Input placeholder="e.g. University of Rwanda" value={eduDraft.institution} onChange={e => setEduDraft({ ...eduDraft, institution: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Field Of Study</Label>
                      <Input placeholder="e.g. Quantity Surveying" value={eduDraft.fieldOfStudy} onChange={e => setEduDraft({ ...eduDraft, fieldOfStudy: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Degree Type</Label>
                      <Select value={eduDraft.qualificationType} onValueChange={(val) => setEduDraft({ ...eduDraft, qualificationType: val })}>
                        <SelectTrigger className="h-10 border-zinc-200 bg-white dark:bg-zinc-950"><SelectValue placeholder="Select Degree Type" /></SelectTrigger>
                        <SelectContent>
                          {["Diploma", "Bachelor's Degree", "Master's Degree", "Doctoral Degree (PhD)"].map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Start Date</Label>
                        <MonthYearPicker value={eduDraft.startDate} placeholder="Select start date" onChange={(val) => setEduDraft({ ...eduDraft, startDate: val })} />
                      </div>
                      <div className="space-y-1">
                        <Label>End Date</Label>
                        <MonthYearPicker value={eduDraft.endDate} placeholder="Select end date" onChange={(val) => setEduDraft({ ...eduDraft, endDate: val })} />
                      </div>
                    </div>
                    <div>
                      <Button size="sm" className="bg-navy text-white hover:bg-navy/90 border-none text-xs" onClick={addEducationDraft}>
                        <Plus className="mr-1 h-3 w-3" /> Add education record
                      </Button>
                    </div>
                  </div>

                  {/* Right: supporting certificate upload + live preview */}
                  <div className="md:col-span-5 flex flex-col">
                    <Label className="mb-1">Supporting Certificate <span className="font-normal text-muted-foreground">(PDF or image)</span></Label>
                    <input type="file" accept=".pdf,image/jpeg,image/png" className="hidden" ref={certificateInputRef} onChange={e => setEduDraft({ ...eduDraft, certificateFile: e.target.files?.[0] || null })} />
                    {eduDraft.certificateFile ? (
                      <div className="h-[380px] rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
                        {eduDraft.certificateFile.type === "application/pdf" ? (
                          <PDFViewer src={certificatePreviewUrl!} fileName={eduDraft.certificateFile.name} />
                        ) : (
                          <ImageViewer src={certificatePreviewUrl!} alt="Certificate preview" fileName={eduDraft.certificateFile.name} />
                        )}
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 p-2 rounded-full backdrop-blur-sm transition-colors shadow-sm z-20"
                          onClick={() => { setEduDraft({ ...eduDraft, certificateFile: null }); if (certificateInputRef.current) certificateInputRef.current.value = ""; }}
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => certificateInputRef.current?.click()}
                        className="h-[380px] flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 text-center transition-colors cursor-pointer border-zinc-200 hover:border-navy/50 dark:border-zinc-800 bg-zinc-50/50 hover:bg-zinc-100/50 dark:bg-zinc-900/50 group"
                      >
                        <FileText className="h-12 w-12 mb-3 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400" />
                        <span className="text-sm font-semibold text-navy dark:text-zinc-300">Click to attach certificate</span>
                        <span className="text-xs mt-1 font-sans text-muted-foreground">PDF, JPG, or PNG (Max 10MB)</span>
                        <Button variant="outline" size="sm" className="mt-4 border-zinc-200 dark:border-zinc-700 pointer-events-none" tabIndex={-1}>
                          <Upload className="h-4 w-4 mr-2" /> Select File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Employment ── */}
          <Card className="border-zinc-100 dark:border-zinc-800">
            <CardHeader className="border-b border-zinc-50 dark:border-zinc-800/50 py-4">
              <CardTitle className="text-navy flex items-center gap-2"><Briefcase className="h-4.5 w-4.5 text-gold" /> Employment</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-md bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3">
                <h4 className="font-semibold text-sm text-navy">Work Address</h4>
                {isRwandan ? (
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    {(["district", "sector", "cell", "village"] as const).map((field) => (
                      <div key={`work-${field}`} className="space-y-1">
                        <Label className="capitalize">{field}</Label>
                        <Input
                          disabled={locked}
                          placeholder={`e.g. ${field === "district" ? "Nyarugenge" : field === "sector" ? "Muhima" : field === "cell" ? "Nyabugogo" : "Kinyaga"}`}
                          value={workAddress[field]}
                          onChange={(e) => setWorkAddress({ ...workAddress, [field]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Textarea rows={2} disabled={locked} value={workAddressText} onChange={(e) => setWorkAddressText(e.target.value)} placeholder="Firm/office address" />
                )}
              </div>

              {empRecords.map((emp: any) => (
                <div key={emp.id} className="rounded-md border border-zinc-100 dark:border-zinc-850 p-4">
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">{emp.jobTitle} &mdash; {emp.companyName}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {new Date(emp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    &mdash;
                    {emp.isCurrent ? ' Present' : emp.endDate ? ` ${new Date(emp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` : ''}
                  </div>
                </div>
              ))}

              {newEmployment.map((emp, i) => (
                <div key={`new-emp-${i}`} className="flex items-start justify-between rounded-md border border-dashed border-gold/50 bg-gold/5 p-4">
                  <div>
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">{emp.jobTitle} &mdash; {emp.companyName}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{formatMonthYear(emp.startDate)} to {emp.isCurrent ? "Present" : formatMonthYear(emp.endDate)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-gold/50 text-gold bg-transparent">{locked ? "Pending review" : "Not yet submitted"}</Badge>
                    {!locked && (
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 h-9 w-9" onClick={() => setNewEmployment(newEmployment.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {!locked && (
                <div className="relative grid gap-4 border border-zinc-150 dark:border-zinc-800 p-4 rounded-md md:grid-cols-12 bg-zinc-50/50 dark:bg-zinc-900/40">
                  <div className="md:col-span-6 space-y-1">
                    <Label>Company / Firm Name</Label>
                    <Input placeholder="e.g. Apex Construction" value={empDraft.companyName} onChange={e => setEmpDraft({ ...empDraft, companyName: e.target.value })} />
                  </div>
                  <div className="md:col-span-6 space-y-1">
                    <Label>Job Title / Role</Label>
                    <Input placeholder="e.g. Site Quantity Surveyor" value={empDraft.jobTitle} onChange={e => setEmpDraft({ ...empDraft, jobTitle: e.target.value })} />
                  </div>
                  <div className="md:col-span-6 space-y-1">
                    <Label>Start Date</Label>
                    <MonthYearPicker value={empDraft.startDate} placeholder="Select start date" onChange={(val) => setEmpDraft({ ...empDraft, startDate: val })} />
                  </div>
                  <div className="md:col-span-6 space-y-1">
                    <Label>End Date</Label>
                    <MonthYearPicker
                      value={empDraft.isCurrent ? "present" : empDraft.endDate}
                      allowPresent
                      placeholder="Select end date or Present"
                      onChange={(val) => setEmpDraft({ ...empDraft, endDate: val.toLowerCase() === "present" ? "" : val, isCurrent: val.toLowerCase() === "present" })}
                    />
                  </div>
                  <div className="md:col-span-12 flex items-center gap-2">
                    <Checkbox id="current-role" checked={empDraft.isCurrent} onCheckedChange={(c) => setEmpDraft({ ...empDraft, isCurrent: c === true, endDate: c === true ? "" : empDraft.endDate })} />
                    <Label htmlFor="current-role" className="text-sm font-medium cursor-pointer">This is my current role</Label>
                  </div>
                  <div className="md:col-span-12">
                    <Button size="sm" className="bg-navy text-white hover:bg-navy/90 border-none text-xs" onClick={addEmploymentDraft}>
                      <Plus className="mr-1 h-3 w-3" /> Add employment record
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Submit bar — appears only once something has changed ── */}
      {hasChanges && !locked && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="sticky bottom-4 z-20">
          <Card className="border-gold/40 shadow-lg bg-white dark:bg-zinc-900">
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="member-notes" className="text-xs">Note to reviewer <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Textarea id="member-notes" rows={2} placeholder="Add any context for RIQS staff reviewing this request..." value={memberNotes} onChange={e => setMemberNotes(e.target.value)} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">You have unsaved changes.</p>
                <Button
                  onClick={handleSubmitClick}
                  disabled={submitMutation.isPending}
                  className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold disabled:opacity-50"
                >
                  {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {submitMutation.isPending ? "Submitting..." : "Request Profile Update"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Documents notice */}
      <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
        <CardHeader className="py-4">
          <CardTitle className="text-amber-900 dark:text-amber-400 text-base font-bold">Documents on file</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <p className="text-sm text-amber-900/80 dark:text-amber-400/80 leading-relaxed">
            {isFirm
              ? "Your company registration certificates, tax clearance, ownership documentation, and other corporate verification records are locked for security. Visit the Documents page to view copies or request replacement options."
              : "Your notarized academic degree scans, National ID/passport duplicates, and primary verification records are locked for security. Visit the Documents page to view copies or request replacement options."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
