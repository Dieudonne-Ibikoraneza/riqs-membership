"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { awardFellowStatus, revokeFellowStatus, getMembersRegistry, sendAdminEmail, awardHonoraryStatus, revokeHonoraryStatus, updateMemberHonors, createHonorableMentionMember, type AdminMemberRegistryResponse } from "@/lib/api/admin";
import { axiosClient } from "@/lib/axiosClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Search,
  Filter,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Mail,
  Minus,
  Send,
  Maximize2,
  MoreHorizontal,
  Award,
  Medal,
  Star,
} from "lucide-react";
import { MonthYearPicker } from "@/components/ui/month-picker";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";

type SortKey = "name" | "id" | "expiry" | "status" | "joined";

function formatLabel(val: string | null | undefined): string {
  if (!val) return "—";
  return val
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function AdminMembers() {
  const router = useRouter();
  const { role } = useAuth();
  const canManageMemberStatus = ["Admin", "Approver"].includes(role || "");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [locFilter, setLocFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminMemberRegistryResponse | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axiosClient.get("/categories");
        if (data && data.categories) {
          setCategories(data.categories);
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    };
    fetchCategories();
  }, []);

  // Bulk Email State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [fellowDialog, setFellowDialog] = useState<{ open: boolean, type: 'award' | 'revoke', member: any | null }>({ open: false, type: 'award', member: null });
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Honorable Mention State
  const [honoraryDialog, setHonoraryDialog] = useState<{ open: boolean, type: 'award' | 'revoke', member: any | null }>({ open: false, type: 'award', member: null });

  // Assign Honor Badges dialog
  const [honorsDialog, setHonorsDialog] = useState<{ open: boolean; member: any | null }>({ open: false, member: null });
  const [selectedHonors, setSelectedHonors] = useState<string[]>([]);
  const [isUpdatingHonors, setIsUpdatingHonors] = useState(false);

  // Add Member State
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberPassword, setNewMemberPassword] = useState<{ open: boolean; password: string; email: string }>({ open: false, password: "", email: "" });
  const [addMemberForm, setAddMemberForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    categoryCode: "VQS" as "LQS" | "HQS" | "VQS",
    nationalIdOrPassport: "",
    dateOfBirth: "",
    gender: "",
    countryOfOrigin: ""
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberForm.fullName || !addMemberForm.email || !addMemberForm.phoneNumber) {
      toast.error("Please fill in all required fields (Name, Email, Phone)");
      return;
    }
    
    setIsAddingMember(true);
    try {
      const res = await createHonorableMentionMember(addMemberForm);
      toast.success(res.message || "Member created successfully");
      if (res.temporaryPassword) {
        setNewMemberPassword({ open: true, password: res.temporaryPassword, email: addMemberForm.email });
      }
      setAddMemberDialogOpen(false);
      setAddMemberForm({
        fullName: "",
        email: "",
        phoneNumber: "",
        categoryCode: "VQS",
        nationalIdOrPassport: "",
        dateOfBirth: "",
        gender: "",
        countryOfOrigin: ""
      });
      setPage(1); 
      const response = await getMembersRegistry(1, pageSize, q, statusFilter, catFilter, locFilter, sortKey, sortDir);
      setData(response);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create member");
    } finally {
      setIsAddingMember(false);
    }
  };


  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (!data?.members) return;
    if (selectedIds.length === data.members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.members.map((m) => m.id));
    }
  };

  const handleSendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("recipientType", "selected");
      formData.append("memberIds", JSON.stringify(selectedIds));
      formData.append("subject", emailSubject);
      formData.append("body", emailBody);

      await sendAdminEmail(formData);

      toast.success(`Email successfully sent to ${selectedIds.length} members!`);
      setComposeOpen(false);
      setEmailSubject("");
      setEmailBody("");
      setSelectedIds([]);
    } catch (err) {
      toast.error("Failed to send bulk email.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const response = await getMembersRegistry(
          page,
          pageSize,
          q,
          statusFilter,
          catFilter,
          locFilter,
          sortKey,
          sortDir
        );
        if (active) setData(response);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    // Simple debounce for search
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);
    
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [page, pageSize, q, statusFilter, catFilter, locFilter, sortKey, sortDir]);

  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const pageData = data?.members || [];

  const resetFilters = () => {
    setQ("");
    setStatusFilter("all");
    setCatFilter("all");
    setLocFilter("all");
    setSortKey("joined");
    setSortDir("desc");
    setPage(1);
  };

  const activeFiltersCount =
    (q ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (catFilter !== "all" ? 1 : 0) +
    (locFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
      {/* Header section */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">
            Members Register
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            Manage approved Quantity Surveying practitioners, monitor
            credentials, and review statuses.
          </p>
        </div>
        <div className="flex gap-2">
          {canManageMemberStatus && (
            <Button
              onClick={() => setAddMemberDialogOpen(true)}
              className="bg-gold text-[#1a1a1a] hover:bg-gold/90 transition-all font-semibold"
            >
              <Users className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          )}
          <Link href="/members">
            <Button
              variant="outline"
              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-semibold"
            >
              View public directory
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and sorting bar */}
      <Card className="border border-zinc-150 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* Search bar */}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members by name, ID or email..."
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 h-11 border-zinc-200 dark:border-zinc-800 focus-visible:ring-gold"
                />
                {q && (
                  <button
                    onClick={() => {
                      setQ("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Advanced Filter selections */}
              <div className="flex flex-wrap gap-2.5">
                {/* Status Selector */}
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-[150px] border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                    <SelectItem value="In Mentorship">In Mentorship</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Selector */}
                <Select
                  value={catFilter}
                  onValueChange={(v) => {
                    setCatFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-[160px] border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.category_name}>
                        {cat.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Location Selector */}
                <Select
                  value={locFilter}
                  onValueChange={(v) => {
                    setLocFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-11 w-[150px] border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    <SelectItem value="Rwandan">Rwandan (Local)</SelectItem>
                    <SelectItem value="Non_Rwandan">Non-Rwandan (Foreign)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sorting options */}
                <Select
                  value={`${sortKey}-${sortDir}`}
                  onValueChange={(v) => {
                    const [key, dir] = v.split("-") as [
                      SortKey,
                      "asc" | "desc",
                    ];
                    setSortKey(key);
                    setSortDir(dir);
                  }}
                >
                  <SelectTrigger className="h-11 w-[180px] border-zinc-200 dark:border-zinc-800">
                    <ArrowUpDown className="mr-2 h-4 w-4 text-gold shrink-0" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joined-desc">Joined Date (Newest)</SelectItem>
                    <SelectItem value="joined-asc">Joined Date (Oldest)</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="id-asc">Member ID (Asc)</SelectItem>
                    <SelectItem value="id-desc">Member ID (Desc)</SelectItem>
                    <SelectItem value="expiry-asc">
                      Expiry Date (Oldest)
                    </SelectItem>
                    <SelectItem value="expiry-desc">
                      Expiry Date (Newest)
                    </SelectItem>
                    <SelectItem value="status-asc">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground font-sans">
                  Showing{" "}
                  <span className="font-semibold text-navy dark:text-gold">
                    {data?.pagination.total || 0}
                  </span>{" "}
                  member{(data?.pagination.total || 0) !== 1 && "s"} in directory
                </span>
                {activeFiltersCount > 0 && (
                  <>
                    <Badge
                      variant="outline"
                      className="border-gold/45 bg-gold/10 text-gold font-bold"
                    >
                      <Filter className="mr-1.5 h-3 w-3 text-gold" />{" "}
                      {activeFiltersCount} filter{activeFiltersCount > 1 && "s"}{" "}
                      active
                    </Badge>
                    <button
                      onClick={resetFilters}
                      className="text-xs text-navy dark:text-gold font-semibold underline-offset-4 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members table card */}
      {loading ? (
        <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10">
          <CardContent className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="mt-4 text-sm text-muted-foreground font-sans">
              Loading members...
            </p>
          </CardContent>
        </Card>
      ) : pageData.length === 0 ? (
        <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10">
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
              <Search className="h-5 w-5 text-gold" />
            </div>
            <h3 className="mt-4 font-bold text-navy text-lg">
              No admin members match your query
            </h3>
            <p className="mt-1 text-sm text-muted-foreground font-sans">
              Try expanding your search criteria or adjusting the status,
              category, and location filters.
            </p>
            <Button
              onClick={resetFilters}
              variant="outline"
              className="mt-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
            >
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-zinc-150 dark:border-zinc-800/80 overflow-hidden shadow-sm bg-white dark:bg-zinc-900 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-10">
                    <div className="flex items-center">
                      <Checkbox 
                        checked={data?.members?.length !== undefined && data.members.length > 0 && selectedIds.length === data.members.length}
                        onCheckedChange={toggleAll}
                        className="border-white/50 data-[state=checked]:bg-gold data-[state=checked]:text-[#1a1a1a]"
                        aria-label="Select all"
                      />
                    </div>
                  </th>
                  {[
                    "Member",
                    "Membership ID",
                    "Category",
                    "Location",
                    "Expires",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((m, i) => (
                  <tr
                    key={m.id}
                    onClick={() => router.push(`/admin/members/${m.id}`)}
                    className={cn(
                      "border-b border-zinc-100 dark:border-zinc-800/80 transition-colors hover:bg-gold/5 cursor-pointer",
                      i % 2 === 1 && "bg-zinc-50/20 dark:bg-zinc-950/10",
                      selectedIds.includes(m.id) && "bg-gold/10 dark:bg-gold/20"
                    )}
                  >
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center">
                        <Checkbox 
                          checked={selectedIds.includes(m.id)}
                          onCheckedChange={() => toggleSelection(m.id)}
                          aria-label={`Select ${m.fullName}`}
                          className="focus-visible:ring-gold"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.fullName} url={m.profilePhotoUrl || m.photo} />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {m.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-navy dark:text-gold">
                      {m.membershipId}
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <div 
                        className="flex flex-col items-start gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium"
                        title={formatLabel(m.category)}
                      >
                        <span className="truncate w-full">{formatLabel(m.category)}</span>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const honorsSet = new Set<string>(m.honors || []);
                            
                            return Array.from(honorsSet).map((honor: string) => (
                              <Badge 
                                key={honor} 
                                variant="outline" 
                                className="text-[10px] px-2 py-0.5 shadow-sm bg-amber-100 text-amber-800 border-amber-300 shadow-amber-500/20 uppercase tracking-wider font-bold"
                              >
                                <Star className="h-2.5 w-2.5 mr-1 fill-amber-600 text-amber-600" />
                                {honor}
                              </Badge>
                            ));
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-350">
                        <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                        {formatLabel(m.practiceLocation)}
                        {m.country &&
                          m.practiceLocation === "Non_Rwandan" &&
                          ` · ${m.country}`}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                      {m.expiresAt}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-semibold border-none px-2.5 py-1 text-xs flex items-center w-fit gap-1",
                          m.status === "Active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : m.status === "In Mentorship"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
                        )}
                      >
                        {m.status === "Active" && (
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {m.status === "In Mentorship" && (
                          <Clock className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                        )}
                        {m.status === "Expired" && (
                          <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600 dark:text-rose-400" />
                        )}
                        {formatLabel(m.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/members/${m.id}`)}
                            className="font-medium cursor-pointer"
                          >
                            <Users className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          {canManageMemberStatus && (
                            <DropdownMenuItem
                              onClick={() => {
                                setHonorsDialog({ open: true, member: m });
                                setSelectedHonors(Array.isArray(m.honors) ? m.honors : []);
                              }}
                              className="text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer"
                            >
                              <Medal className="mr-2 h-4 w-4" />
                              Assign Honor Badges
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedIds([m.id]);
                              setComposeOpen(true);
                            }}
                          >
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            Email Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

        {/* Advanced Pagination controls */}
        {totalPages > 1 && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={setPage}
          />
        )}

      {/* Floating Bulk Email Button */}
      <AnimatePresence>
        {selectedIds.length > 0 && !composeOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => {
                setComposeOpen(true);
                setComposeMinimized(false);
              }}
              className="bg-navy hover:bg-navy/90 text-white rounded-none shadow-lg px-6 h-14 text-base font-semibold"
            >
              <Mail className="mr-2 h-5 w-5" />
              Email {selectedIds.length} Member{selectedIds.length !== 1 ? 's' : ''}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gmail-style Compose Box */}
      <AnimatePresence>
        {composeOpen && selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: composeMinimized ? "calc(100% - 48px)" : 0,
              scale: 1 
            }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 right-4 sm:right-12 z-[100] w-full sm:w-[480px] bg-white dark:bg-zinc-900 rounded-none shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
            style={{ height: "500px", maxHeight: "80vh" }}
          >
            {/* Header */}
            <div 
              className="h-12 bg-navy text-white flex items-center justify-between px-4 cursor-pointer shrink-0"
              onClick={() => setComposeMinimized(!composeMinimized)}
            >
              <div className="font-semibold text-sm">
                New Message ({selectedIds.length} recipient{selectedIds.length !== 1 ? 's' : ''})
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
                  {composeMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
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
                onClick={handleSendBulkEmail} 
                disabled={isSending || !emailSubject.trim() || !emailBody.trim() || selectedIds.length === 0}
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

      {/* Honorary Status Action Dialog */}
      <Dialog open={honoraryDialog.open} onOpenChange={(val) => setHonoraryDialog({ ...honoraryDialog, open: val })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {honoraryDialog.type === 'award' ? 'Award Honorary Status' : 'Revoke Honorary Status'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
            {honoraryDialog.type === 'award' ? (
              <p>Are you sure you want to award the prestigious Honorary status to <strong className="text-zinc-900 dark:text-zinc-100">{honoraryDialog.member?.fullName}</strong>? This action upgrades their membership class and assigns them an 'HQS' identifier.</p>
            ) : (
              <p>Are you sure you want to revoke the Honorary status from <strong className="text-zinc-900 dark:text-zinc-100">{honoraryDialog.member?.fullName}</strong>? This will revert their membership class back to Professional.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHonoraryDialog({ ...honoraryDialog, open: false })}>Cancel</Button>
            <Button 
              className={honoraryDialog.type === 'award' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
              onClick={async () => {
                if (!honoraryDialog.member) return;
                try {
                  if (honoraryDialog.type === 'award') {
                    await awardHonoraryStatus(honoraryDialog.member.id);
                    toast.success(`${honoraryDialog.member.fullName} has been awarded Honorary status.`);
                  } else {
                    await revokeHonoraryStatus(honoraryDialog.member.id);
                    toast.success(`${honoraryDialog.member.fullName}'s Honorary status has been revoked.`);
                  }
                  setHonoraryDialog({ ...honoraryDialog, open: false });
                  setPage(1);
                  getMembersRegistry(1, pageSize, q, statusFilter, catFilter, locFilter, sortKey, sortDir)
                    .then(setData);
                } catch (err: any) {
                  toast.error(err.response?.data?.message || `Failed to ${honoraryDialog.type} Honorary status.`);
                }
              }}
            >
              {honoraryDialog.type === 'award' ? 'Award Status' : 'Revoke Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fellow Status Action Dialog */}
      <Dialog open={fellowDialog.open} onOpenChange={(val) => setFellowDialog({ ...fellowDialog, open: val })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {fellowDialog.type === 'award' ? 'Award Fellow Status' : 'Revoke Fellow Status'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
            {fellowDialog.type === 'award' ? (
              <p>Are you sure you want to award the prestigious Fellow status to <strong className="text-zinc-900 dark:text-zinc-100">{fellowDialog.member?.fullName}</strong>? This action upgrades their membership class and assigns them an 'FQS' identifier.</p>
            ) : (
              <p>Are you sure you want to revoke the Fellow status from <strong className="text-zinc-900 dark:text-zinc-100">{fellowDialog.member?.fullName}</strong>? This will revert their membership class back to Professional.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFellowDialog({ ...fellowDialog, open: false })}>Cancel</Button>
            <Button 
              className={fellowDialog.type === 'award' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
              onClick={async () => {
                if (!fellowDialog.member) return;
                try {
                  if (fellowDialog.type === 'award') {
                    await awardFellowStatus(fellowDialog.member.id);
                    toast.success(`${fellowDialog.member.fullName} has been awarded Fellow status.`);
                  } else {
                    await revokeFellowStatus(fellowDialog.member.id);
                    toast.success(`${fellowDialog.member.fullName}'s Fellow status has been revoked.`);
                  }
                  setFellowDialog({ ...fellowDialog, open: false });
                  setPage(1);
                  getMembersRegistry(1, pageSize, q, statusFilter, catFilter, locFilter, sortKey, sortDir)
                    .then(setData);
                } catch (err: any) {
                  toast.error(err.response?.data?.message || `Failed to ${fellowDialog.type} Fellow status.`);
                }
              }}
            >
              {fellowDialog.type === 'award' ? 'Award Status' : 'Revoke Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Honor Badges Dialog */}
      <Dialog open={honorsDialog.open} onOpenChange={(val) => { if (!val) setHonorsDialog({ open: false, member: null }); }}>
        <DialogContent className="sm:max-w-[420px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-navy">
              <Medal className="h-5 w-5 text-gold" />
              Assign Honor Badges
            </DialogTitle>
          </DialogHeader>

          {(() => {
            const member = honorsDialog.member;
            if (!member) return null;
            // Find this member's category to get supported_honors
            const catObj = categories.find(
              (c: any) => c.id === member.categoryId || c.category_name === member.category
            );
            const supportedHonors: { name: string; description?: string }[] =
              catObj?.supported_honors || [];

            if (supportedHonors.length === 0) {
              return (
                <>
                  <div className="py-6 text-center space-y-3">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                    <p className="text-sm font-semibold text-navy">No honors configured</p>
                    <p className="text-xs text-muted-foreground leading-relaxed px-4">
                      The category <span className="font-bold text-navy">{member.category?.replace(/_/g, " ")}</span> has no supported honorable mentions.
                    </p>
                  </div>
                  <DialogFooter className="mt-2 border-t pt-4">
                    <Button variant="outline" className="text-xs w-full sm:w-auto" onClick={() => setHonorsDialog({ open: false, member: null })}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </>
              );
            }

            return (
              <>
                <p className="text-sm text-muted-foreground -mt-1 mb-1">
                  Select the honors to assign to <span className="font-semibold text-navy dark:text-white">{member.fullName}</span>.
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
                          setSelectedHonors(prev =>
                            checked
                              ? [...prev, h.name]
                              : prev.filter(x => x !== h.name)
                          );
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
                  <Button variant="outline" className="text-xs" onClick={() => setHonorsDialog({ open: false, member: null })}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-navy hover:bg-navy/90 text-white text-xs font-bold"
                    disabled={isUpdatingHonors}
                    onClick={async () => {
                      if (!honorsDialog.member) return;
                      setIsUpdatingHonors(true);
                      try {
                        await updateMemberHonors(honorsDialog.member.id, selectedHonors);
                        toast.success(`Honor badges updated for ${honorsDialog.member.fullName}.`);
                        setHonorsDialog({ open: false, member: null });
                        getMembersRegistry(page, pageSize, q, statusFilter, catFilter, locFilter, sortKey, sortDir)
                          .then(setData);
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Failed to update honors.');
                      } finally {
                        setIsUpdatingHonors(false);
                      }
                    }}
                  >
                    {isUpdatingHonors ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Medal className="h-3.5 w-3.5 mr-1.5" />}
                    Save Honors
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateMember}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-navy">
                <Users className="h-5 w-5 text-gold" />
                Add Honorable Mention Member
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="fullName"
                  value={addMemberForm.fullName}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={addMemberForm.email}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, email: e.target.value })}
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  id="phoneNumber"
                  value={addMemberForm.phoneNumber}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, phoneNumber: e.target.value })}
                  placeholder="+250 788 123 456"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoryCode">Member Category <span className="text-red-500">*</span></Label>
                <Select
                  value={addMemberForm.categoryCode}
                  onValueChange={(val) => setAddMemberForm({ ...addMemberForm, categoryCode: val as any })}
                >
                  <SelectTrigger id="categoryCode">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VQS">Visiting Quantity Surveyor</SelectItem>
                    <SelectItem value="LQS">Life Quantity Surveyor</SelectItem>
                    <SelectItem value="HQS">Honorary Quantity Surveyor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nationalIdOrPassport">National ID / Passport</Label>
                  <Input
                    id="nationalIdOrPassport"
                    value={addMemberForm.nationalIdOrPassport}
                    onChange={(e) => setAddMemberForm({ ...addMemberForm, nationalIdOrPassport: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={addMemberForm.dateOfBirth}
                    onChange={(e) => setAddMemberForm({ ...addMemberForm, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={addMemberForm.gender}
                    onValueChange={(val) => setAddMemberForm({ ...addMemberForm, gender: val })}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="countryOfOrigin">Country of Origin</Label>
                  <Input
                    id="countryOfOrigin"
                    value={addMemberForm.countryOfOrigin}
                    onChange={(e) => setAddMemberForm({ ...addMemberForm, countryOfOrigin: e.target.value })}
                    placeholder="e.g. Rwanda"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingMember} className="bg-navy hover:bg-navy/90 text-white">
                {isAddingMember ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Member Password Dialog */}
      <Dialog open={newMemberPassword.open} onOpenChange={(open) => { if (!open) setNewMemberPassword({ open: false, password: "", email: "" }); }}>
        <DialogContent className="sm:max-w-[450px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-navy">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Member Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 p-3 rounded-md text-sm border border-emerald-200 dark:border-emerald-800/50">
              <p>The member has been created. An email with their temporary password is being sent to <strong>{newMemberPassword.email}</strong>.</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-navy font-semibold">Temporary Password</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={newMemberPassword.password} className="font-mono text-lg font-bold tracking-wider text-center" />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="shrink-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  onClick={() => {
                    navigator.clipboard.writeText(newMemberPassword.password);
                    toast.success("Password copied to clipboard!");
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Please copy this password and share it with the user securely in case the email is delayed or goes to spam.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewMemberPassword({ open: false, password: "", email: "" })} className="bg-navy text-white hover:bg-navy/90">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    );
  }

function Avatar({ name, url }: { name: string; url?: string }) {
  const [token, setToken] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("riqs.auth.token") || "");
    }
  }, []);

  const fullUrl = url && token 
    ? url.includes('/')
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/files/downloadByUrl?url=${encodeURIComponent(url)}&token=${token}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/files/download/${url}?token=${token}`
    : null;

  if (fullUrl) {
    return (
      <img
        src={fullUrl}
        alt={name}
        className="flex h-10 w-10 shrink-0 object-cover rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy to-[#14467f] text-xs font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      {initials}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (n: number) => void;
}) {
  const range = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const arr: (number | string)[] = [];
    if (page <= 4) {
      arr.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      arr.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      );
    } else {
      arr.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return arr;
  }, [page, totalPages]);

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-5">
      <div className="text-sm text-muted-foreground font-sans">
        Showing page{" "}
        <span className="font-semibold text-navy dark:text-gold">{page}</span>{" "}
        of{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {totalPages}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* First Page */}
        <Button
          variant="outline"
          size="icon"
          disabled={page === 1}
          onClick={() => onChange(1)}
          className="h-9 w-9 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all duration-200"
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4 text-gold" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="h-9 w-9 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4 text-gold" />
        </Button>

        {/* Page Numbers */}
        {range.map((p, index) => {
          if (p === "...") {
            return (
              <span
                key={`dots-${index}`}
                className="px-2 text-zinc-450 dark:text-zinc-555 text-sm select-none font-bold"
              >
                ...
              </span>
            );
          }

          const isActive = p === page;
          return (
            <Button
              key={`page-${p}`}
              variant={isActive ? "default" : "outline"}
              onClick={() => onChange(p as number)}
              className={cn(
                "h-9 w-9 font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95",
                isActive
                  ? "bg-navy dark:bg-gold text-white dark:text-[#1a1a1a] shadow-md border-transparent cursor-default"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
              )}
            >
              {p}
            </Button>
          );
        })}

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="h-9 w-9 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4 text-gold" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="icon"
          disabled={page === totalPages}
          onClick={() => onChange(totalPages)}
          className="h-9 w-9 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4 text-gold" />
        </Button>
      </div>


    </div>
  );
}
