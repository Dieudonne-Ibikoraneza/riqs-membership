"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Star, StarOff, User, Mail, Phone, MapPin, Calendar,
  CreditCard, FileText, Shield, Clock, AlertTriangle, CheckCircle2, MessageSquare,
  Ticket, TrendingUp, Award, ExternalLink, BadgeCheck, MoreVertical,
  Building2, Globe, IdCard, Activity, ChevronRight, Download, Send,
  Maximize2, Minus, X, Loader2, Medal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getMemberById, awardFellowStatus, revokeFellowStatus, changeMembershipCategory, sendAdminEmail, updateMemberHonors } from "@/lib/api/admin";
import { axiosClient } from "@/lib/axiosClient";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const getImageUrl = (url: string) => {
  if (!url) return "";
  const token = typeof window !== "undefined" ? localStorage.getItem("riqs.auth.token") : "";
  return `${API_URL}/files/downloadByUrl?url=${encodeURIComponent(url)}&token=${token}`;
};

const getInitials = (name: string) =>
  (name || "?").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

const classBadgeColor: Record<string, string> = {
  Fellow: "bg-amber-100 text-amber-800 border-amber-300 shadow-amber-500/20",
  Professional: "bg-blue-100 text-blue-800 border-blue-300 shadow-blue-500/20",
  Technologist: "bg-purple-100 text-purple-800 border-purple-300 shadow-purple-500/20",
  Associate: "bg-teal-100 text-teal-800 border-teal-300 shadow-teal-500/20",
  Student: "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-emerald-500/20",
  "Honorable Mention": "bg-rose-100 text-rose-800 border-rose-300 shadow-rose-500/20",
};

const txStatusColor: Record<string, string> = {
  Cleared: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Unpaid: "bg-amber-50 text-amber-700 border-amber-200",
  Pending_Verification: "bg-blue-50 text-blue-700 border-blue-200",
  Failed: "bg-red-50 text-red-700 border-red-200",
  Refunded: "bg-zinc-50 text-zinc-700 border-zinc-200",
};

const formatAddress = (addr: any) => {
  if (!addr) return "Not provided";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    return [addr.district, addr.sector, addr.cell, addr.village].filter(Boolean).join(", ");
  }
  return String(addr);
};

const AUDIT_PAGE_SIZE = 5;
const TICKET_PAGE_SIZE = 5;

export default function AdminMemberProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const canManageMemberStatus = ["Admin", "Approver"].includes(role || "");
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedHonors, setSelectedHonors] = useState<string[]>([]);
  const [dialog, setDialog] = useState<null | "award-fellow" | "revoke-fellow" | "change-class" | "manage-honors">(null);
  const [newCategoryId, setNewCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);

  // Email state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchMember = async () => {
    try {
      const data = await getMemberById(id as string);
      setMember(data);
    } catch {
      toast.error("Failed to load member profile.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("recipientType", "selected");
      formData.append("memberIds", JSON.stringify([member.id]));
      formData.append("subject", emailSubject);
      formData.append("body", emailBody);

      await sendAdminEmail(formData);

      toast.success(`Email successfully sent to ${member.fullName}!`);
      setComposeOpen(false);
      setEmailSubject("");
      setEmailBody("");
    } catch (err) {
      toast.error("Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchMember();
    fetchCategories();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data } = await axiosClient.get("/categories");
      if (data && data.categories) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error("Failed to fetch categories");
    }
  };

  
  const handleOpenHonors = () => {
    setSelectedHonors(member?.honors || []);
    setDialog("manage-honors");
  };


  const handleSaveHonors = async () => {
    setActionLoading(true);
    try {
      await updateMemberHonors(id as string, selectedHonors);
      toast.success("Honorable mentions updated successfully!");
      setDialog(null);
      fetchMember();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update honors.");
    } finally {
      setActionLoading(false);
    }
  };


  const handleAwardFellow = async () => {
    setActionLoading(true);
    try {
      await awardFellowStatus(id as string);
      toast.success("Fellow status awarded successfully!");
      setDialog(null);
      fetchMember();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to award Fellow status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeFellow = async () => {
    setActionLoading(true);
    try {
      await revokeFellowStatus(id as string);
      toast.success("Fellow status revoked.");
      setDialog(null);
      fetchMember();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to revoke Fellow status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeCategory = async () => {
    if (!newCategoryId) return;
    setActionLoading(true);
    try {
      await changeMembershipCategory(id as string, newCategoryId);
      toast.success("Membership category updated successfully.");
      setDialog(null);
      fetchMember();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update membership category.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-navy/20" />
          <div className="relative h-16 w-16 animate-spin rounded-full border-4 border-navy/20 border-t-navy shadow-lg" />
        </div>
      </div>
    );
  }

  if (!member) return null;

  const app = member.applications?.[0];
  const category = app?.category;
  const isFellow = member.membershipClass === "Fellow";

  const totalPaid = member.financialTransactions
    ?.filter((t: any) => t.status === "Cleared")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

  const coverGradient = isFellow 
    ? "from-[#B8860B] via-[#DAA520] to-[#FFD700]" 
    : "from-slate-900 via-navy to-blue-800";

  return (
    <div className="relative">
      {/* PAGE HEADER — standard card, normal flow */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm mb-0">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 md:p-5 flex flex-col sm:flex-row justify-between items-center gap-3"
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()} 
              className="rounded-full h-10 w-10 border-slate-200 bg-white hover:bg-slate-100 hover:text-navy transition-colors shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Member Profile</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Administrative View</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {app && (
              <Button variant="outline" className="hidden sm:flex gap-2" onClick={() => router.push(`/admin/applications/${app.id}`)}>
                <FileText className="h-4 w-4" /> View Application
              </Button>
            )}
            {canManageMemberStatus && (
              <>
                <Button variant="outline" className="gap-2 hidden sm:flex" onClick={handleOpenHonors}>
                  <Medal className="h-4 w-4" /> Manage Honors
                </Button>
                <Button className="bg-navy hover:bg-blue-800 text-white gap-2" onClick={() => setDialog("change-class")}>
                  <TrendingUp className="h-4 w-4" /> Change Membership
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto pb-12 px-2 sm:px-4 lg:px-8 relative pt-6">


      {/* FLOATING EMAIL ICON */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-10 right-10 z-[150]"
      >
        <Button
          size="icon"
          onClick={() => {
            if (composeOpen && composeMinimized) {
              setComposeMinimized(false);
            } else if (!composeOpen) {
              setComposeOpen(true);
              setComposeMinimized(false);
            }
          }}
          className={`h-14 w-14 rounded-full shadow-xl border-2 border-white transition-colors ${composeOpen && !composeMinimized ? "bg-slate-600 hover:bg-slate-700" : "bg-navy hover:bg-blue-800"} text-white shadow-navy/20`}
        >
          <Mail className="h-6 w-6" />
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8 items-start">
        
        {/* LEFT COLUMN - Identity Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-4 space-y-6"
        >
          {/* Identity Card */}
          <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white/50 backdrop-blur-xl">
            <div className={`h-32 bg-gradient-to-br ${coverGradient} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
              {/* Abstract decorative circles */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-xl" />
            </div>
            
            <CardContent className="px-6 pb-8 -mt-16 relative z-10">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-700 text-4xl font-black flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105">
                    {member.profilePhotoUrl ? (
                      <img src={getImageUrl(member.profilePhotoUrl)} alt={member.fullName} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(member.fullName)
                    )}
                  </div>
                  {isFellow && (
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#FFD700] to-[#DAA520] p-2 rounded-full border-[3px] border-white shadow-sm">
                      <Star className="h-4 w-4 text-white fill-white" />
                    </div>
                  )}
                </div>

                <h2 className="text-lg font-bold text-slate-900 text-center mb-1">{member.fullName}</h2>
                <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-4">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="text-sm">{member.email}</span>
                </div>

                <div className="flex flex-wrap gap-2 justify-center w-full bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <Badge variant="outline" className="font-semibold text-xs bg-white border-slate-200 text-slate-700 px-3 py-1 shadow-sm">
                    {member.membershipId || "Awaiting ID"}
                  </Badge>
                  {(member.honors || []).map((honor: string) => (
                    <Badge
                      key={honor}
                      variant="outline"
                      className="text-xs px-3 py-1 shadow-sm bg-amber-100 text-amber-800 border-amber-300 shadow-amber-500/20 mr-1"
                    >
                      <Star className="h-3 w-3 mr-1.5 fill-amber-600 text-amber-600" />
                      {honor}
                    </Badge>
                  ))}
                  {member.membershipClass && (
                    <Badge
                      variant="outline"
                      className={`text-xs px-3 py-1 shadow-sm ${classBadgeColor[member.membershipClass] || "bg-slate-100 text-slate-700 border-slate-200"}`}
                    >
                      {isFellow && <Star className="h-3 w-3 mr-1.5 fill-amber-600 text-amber-600" />}
                      {member.membershipClass}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Contact & Identity</h3>
                <div className="space-y-3 p-1">
                  {[
                    { icon: Phone, label: member.phoneNumber },
                    { icon: Globe, label: member.countryOfOrigin },
                    { icon: User, label: member.gender },
                    { icon: Calendar, label: member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : null },
                    { icon: IdCard, label: member.nationalIdOrPassport },
                  ].map((item, i) => item.label && (
                    <div key={i} className="flex items-center gap-3 text-slate-600 group">
                      <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-navy group-hover:bg-blue-50 transition-colors">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6" />

                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Locations</h3>
                <div className="space-y-4 p-1">
                  {member.residencyAddress && (
                    <div className="flex items-start gap-3 text-slate-600">
                      <div className="p-2 rounded-lg bg-slate-50 text-slate-400 mt-0.5">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">Residence</p>
                        <p className="text-sm font-medium leading-tight">{formatAddress(member.residencyAddress)}</p>
                      </div>
                    </div>
                  )}
                  {member.workAddress && (
                    <div className="flex items-start gap-3 text-slate-600">
                      <div className="p-2 rounded-lg bg-slate-50 text-slate-400 mt-0.5">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">Workplace</p>
                        <p className="text-sm font-medium leading-tight">{formatAddress(member.workAddress)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <div className="bg-slate-50 border-t border-slate-100 p-4">
              <div className="grid grid-cols-2 divide-x divide-slate-200">
                <div className="flex flex-col items-center justify-center">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-slate-400 mb-1">Joined</span>
                  <span className="text-slate-900 text-sm font-semibold">{new Date(member.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-slate-400 mb-1">Expires</span>
                  {member.membershipExpiresAt ? (
                    <span className={`text-sm font-semibold ${new Date(member.membershipExpiresAt) < new Date() ? 'text-red-600' : 'text-slate-900'}`}>
                      {new Date(member.membershipExpiresAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-sm font-semibold">—</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* RIGHT COLUMN - Data Panels */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-8 space-y-6"
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Class", value: member.membershipClass || "—", icon: BadgeCheck, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Category", value: category?.categoryCode || "—", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Total Paid", value: `${totalPaid.toLocaleString()} RWF`, icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Txns", value: member.financialTransactions?.length || 0, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                whileHover={{ y: -2 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 relative overflow-hidden group"
              >
                <div className={`absolute -right-4 -top-4 w-12 h-12 rounded-full ${stat.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`} />
                <stat.icon className={`h-5 w-5 mb-3 ${stat.color} relative z-10`} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 relative z-10">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 relative z-10 leading-tight">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Application Details Panel */}
          {app && (
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-navy" /> Application Record
                </h3>
                <Badge variant="outline" className={`uppercase tracking-widest text-[10px] font-bold px-2 py-0.5 ${app.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-50 text-zinc-600"}`}>
                  {app.status}
                </Badge>
              </div>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-sm">
                  <div className="p-5 space-y-5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Entity Type</p>
                      <p className="font-medium text-slate-900">{app.entityType || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Practice Location</p>
                      <p className="font-medium text-slate-900">{app.practiceLocation || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Category & Focus</p>
                      <p className="font-medium text-slate-900">{category?.categoryName || "—"}</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-5 bg-slate-50/50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Submission Date</p>
                      <p className="font-medium text-slate-900">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Approval Date</p>
                      <p className="font-medium text-slate-900">{app.approvedAt ? new Date(app.approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education & Employment Records */}
          {app && (app.educationRecords?.length > 0 || app.employmentRecords?.length > 0) && (
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-white px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" /> Background & Experience
                </h3>
              </div>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  {/* Education */}
                  <div className="p-5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Education</h4>
                    {app.educationRecords?.length > 0 ? (
                      <div className="space-y-4">
                        {app.educationRecords.map((edu: any) => (
                          <div key={edu.id} className="relative pl-4 border-l-2 border-slate-200">
                            <div className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                            <p className="font-semibold text-sm text-slate-900">{edu.qualificationType} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{edu.institution}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">
                              {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No education records provided.</p>
                    )}
                  </div>
                  
                  {/* Employment */}
                  <div className="p-5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Employment</h4>
                    {app.employmentRecords?.length > 0 ? (
                      <div className="space-y-4">
                        {app.employmentRecords.map((emp: any) => (
                          <div key={emp.id} className="relative pl-4 border-l-2 border-slate-200">
                            <div className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-blue-300 ring-4 ring-white" />
                            <p className="font-semibold text-sm text-slate-900">{emp.jobTitle}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{emp.companyName}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">
                              {new Date(emp.startDate).getFullYear()} - {emp.isCurrent || !emp.endDate ? "Present" : new Date(emp.endDate).getFullYear()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No employment records provided.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Transactions */}
          <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" /> Financial History
              </h3>
            </div>
            <div className="bg-slate-50 p-2">
              {member.financialTransactions?.length === 0 ? (
                <div className="text-center py-10 px-4 bg-white rounded-lg">
                  <div className="h-10 w-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">No financial records found.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {member.financialTransactions?.map((tx: any) => (
                    <div key={tx.id} className="bg-white rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${tx.status === 'Cleared' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {tx.status === 'Cleared' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-display font-semibold text-sm text-slate-900">{tx.txType.replace(/_/g, " ")}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{tx.transactionReference}</p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                        <p className="text-sm font-bold text-slate-900">{Number(tx.amount).toLocaleString()} <span className="text-[10px] text-slate-500 font-semibold">{tx.currency}</span></p>
                        <Badge variant="outline" className={`mt-0.5 uppercase tracking-wider text-[9px] font-bold px-1.5 py-0.5 ${txStatusColor[tx.status] || "bg-slate-100"}`}>
                          {tx.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* BOTTOM SECTION - Activity Log & Support Tickets */}
      <div className="w-full mt-8 space-y-8">
        
        {/* Audit Log */}
        {(() => {
          const logs = member.auditLogs || [];
          const totalPages = Math.ceil(logs.length / AUDIT_PAGE_SIZE);
          const paginated = logs.slice((auditPage - 1) * AUDIT_PAGE_SIZE, auditPage * AUDIT_PAGE_SIZE);
          return (
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden w-full">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Activity Log</h3>
                </div>
                {logs.length > 0 && (
                  <Badge variant="outline" className="text-slate-500 border-slate-200 text-[10px]">{logs.length} entries</Badge>
                )}
              </div>
              <div className="bg-white p-5 space-y-3">
                {logs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No activity recorded.</p>
                ) : (
                  paginated.map((log: any) => (
                    <div key={log.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-slate-200">
                          {log.actionType.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-400">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {log.details && <p className="text-sm text-slate-700 font-medium leading-snug mb-3">{log.details}</p>}
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> {log.actionByEmail}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Page {auditPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1}>Previous</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAuditPage(p => Math.min(totalPages, p + 1))} disabled={auditPage === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })()}

        {/* Support Tickets */}
        {(() => {
          const tickets = member.supportTickets || [];
          const totalPages = Math.ceil(tickets.length / TICKET_PAGE_SIZE);
          const paginated = tickets.slice((ticketPage - 1) * TICKET_PAGE_SIZE, ticketPage * TICKET_PAGE_SIZE);
          return (
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden w-full">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Support Tickets</h3>
                </div>
                {tickets.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">{tickets.length}</Badge>
                )}
              </div>
              <div className="bg-white p-5 space-y-3">
                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No support tickets.</p>
                  </div>
                ) : (
                  paginated.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => router.push(`/admin/support/${ticket.id}`)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                          {ticket.subject}
                        </h4>
                        <Badge variant="outline" className={`shrink-0 uppercase tracking-wider text-[9px] font-bold ${ticket.status === "Resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ticket.status === "In Progress" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">{ticket.category}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {ticket._count?.replies || 0}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Page {ticketPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setTicketPage(p => Math.max(1, p - 1))} disabled={ticketPage === 1}>Previous</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setTicketPage(p => Math.min(totalPages, p + 1))} disabled={ticketPage === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })()}

      </div>

      {/* Dialogs */}

      <Dialog open={dialog === "manage-honors"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[420px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-navy">
              <Medal className="h-5 w-5 text-gold" />
              Assign Honor Badges
            </DialogTitle>
          </DialogHeader>

          {(() => {
            const supportedHonors: { name: string; description?: string }[] =
              ((category?.supportedHonors as any[]) || []).map((honor: any) => 
                typeof honor === 'string' ? { name: honor } : honor
              );

            if (supportedHonors.length === 0) {
              return (
                <>
                  <div className="py-6 text-center space-y-3">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                    <p className="text-sm font-semibold text-navy">No honors configured</p>
                    <p className="text-xs text-muted-foreground leading-relaxed px-4">
                      The category <span className="font-bold text-navy">{category?.categoryName?.replace(/_/g, " ") || member?.membershipClass?.replace(/_/g, " ")}</span> has no supported honorable mentions.
                    </p>
                  </div>
                  <DialogFooter className="mt-2 border-t pt-4">
                    <Button variant="outline" className="text-xs w-full sm:w-auto" onClick={() => setDialog(null)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </>
              );
            }

            return (
              <>
                <p className="text-sm text-muted-foreground -mt-1 mb-1">
                  Select the honors to assign to <span className="font-semibold text-navy dark:text-white">{member?.fullName}</span>.
                  Unchecking an honor will remove it.
                </p>
                <div className="space-y-2 my-2">
                  {supportedHonors.map((h) => (
                    <label
                      key={h.name}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedHonors.includes(h.name)
                          ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Checkbox
                        checked={selectedHonors.includes(h.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedHonors([...selectedHonors, h.name]);
                          } else {
                            setSelectedHonors(selectedHonors.filter(x => x !== h.name));
                          }
                        }}
                        className="mt-0.5 focus-visible:ring-gold"
                      />
                      <div>
                        <p className="text-sm font-semibold text-navy dark:text-white">{h.name}</p>
                        {h.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{h.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <DialogFooter className="mt-4 border-t pt-4">
                  <Button variant="outline" className="text-xs" onClick={() => setDialog(null)}>
                    Cancel
                  </Button>
                  <Button className="bg-navy hover:bg-navy/90 text-white text-xs font-bold" onClick={handleSaveHonors} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Medal className="h-3.5 w-3.5 mr-1.5" />}
                    Save Honors
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "award-fellow"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Award Fellow Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <DialogDescription className="text-slate-600 text-base">
              You are about to upgrade <strong>{member.fullName}</strong> from <strong>Professional</strong> to <strong>Fellow</strong>.
            </DialogDescription>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleAwardFellow} disabled={actionLoading}>
                {actionLoading ? "Awarding..." : "Confirm Upgrade"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "revoke-fellow"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke Fellow Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <DialogDescription className="text-slate-600 text-base">
              You are about to revoke Fellow status from <strong>{member.fullName}</strong> and revert them to <strong>Professional</strong>.
            </DialogDescription>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRevokeFellow} disabled={actionLoading}>
                {actionLoading ? "Revoking..." : "Confirm Revoke"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "change-class"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Membership</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <DialogDescription className="text-slate-600 text-sm">
              Update the membership category for <strong>{member.fullName}</strong>.
            </DialogDescription>
            
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Category:</span>
                <span className="font-semibold text-slate-900">{app?.category?.categoryName || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Membership ID:</span>
                <span className="font-semibold text-navy">{member.membershipId || "Not assigned"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900">New Membership Category</label>
              <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                <SelectTrigger className="w-full bg-white border-slate-200 focus:ring-navy">
                  <SelectValue placeholder="Select new category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <strong>Note:</strong> Changing the category will automatically assign a new Membership ID reflecting the updated classification. The member will be notified via email about this change, and the action will be recorded in the system audits.
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button className="bg-navy hover:bg-blue-900 text-white" onClick={handleChangeCategory} disabled={actionLoading || !newCategoryId || newCategoryId === app?.categoryId}>
                {actionLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Email Button - removed (icon in header handles this) */}

      {/* Gmail-style Compose Box */}
      <AnimatePresence>
        {composeOpen && member && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: 1,
              height: composeMinimized ? 48 : 500,
            }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              damping: 28, 
              stiffness: 220,
              height: { type: "spring", damping: 30, stiffness: 250 }
            }}
            className="fixed bottom-6 right-6 z-[200] w-full sm:w-[480px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
            style={{ maxHeight: "80vh" }}
          >
            {/* Header */}
            <div 
              className="h-12 bg-navy text-white flex items-center justify-between px-4 cursor-pointer shrink-0"
              onClick={() => setComposeMinimized(!composeMinimized)}
            >
              <div className="font-semibold text-sm">
                New Message to {member.fullName}
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setComposeMinimized(!composeMinimized);
                  }}
                >
                  <motion.span
                    animate={{ rotate: composeMinimized ? 180 : 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    className="inline-flex"
                  >
                    {composeMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  </motion.span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setComposeOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto flex flex-col bg-zinc-50 dark:bg-zinc-950">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <input
                  type="text"
                  placeholder="Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-normal"
                />
              </div>
              <textarea
                placeholder="Write your message here..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="flex-1 w-full bg-transparent border-none outline-none resize-none p-4 text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
              />
            </div>

            {/* Footer */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="text-xs text-muted-foreground">
                Email will be sent via system
              </div>
              <Button 
                onClick={handleSendEmail} 
                disabled={isSending || !emailSubject.trim() || !emailBody.trim()}
                className="bg-navy hover:bg-navy/90 text-white rounded-none px-6"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>{/* end max-w-7xl content */}
    </div>
  );
}
