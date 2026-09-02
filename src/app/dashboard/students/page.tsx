"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Users,
  UserPlus,
  Search,
  Mail,
  School,
  Calendar,
  Smartphone,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

/* ── Mock Data ───────────────────────────────────────── */
const INITIAL_STUDENTS = [
  { id: 1, name: "Alice Iribagiza", email: "alice.i@ur.ac.rw", phone: "+250 788 111 222", university: "University of Rwanda", gradYear: "2024", status: "Active" as const, registeredAt: "2024-03-12" },
  { id: 2, name: "Jean Claude Habimana", email: "jc.habimana@ines.ac.rw", phone: "+250 788 333 444", university: "INES Ruhengeri", gradYear: "2025", status: "Active" as const, registeredAt: "2024-03-10" },
  { id: 3, name: "Sarah Mutoni", email: "smutoni@rp.ac.rw", phone: "+250 788 555 666", university: "Rwanda Polytechnic", gradYear: "2024", status: "Pending" as const, registeredAt: "2024-03-15" },
  { id: 4, name: "Eric Niyonzima", email: "ericn@ur.ac.rw", phone: "+250 788 777 888", university: "University of Rwanda", gradYear: "2026", status: "Active" as const, registeredAt: "2024-06-01" },
  { id: 5, name: "Diane Uwamahoro", email: "diane@kist.ac.rw", phone: "+250 788 999 000", university: "KIST", gradYear: "2025", status: "Active" as const, registeredAt: "2024-04-22" },
  { id: 6, name: "Patrick Mugabo", email: "pmugabo@ines.ac.rw", phone: "+250 788 222 333", university: "INES Ruhengeri", gradYear: "2026", status: "Pending" as const, registeredAt: "2024-07-03" },
  { id: 7, name: "Grace Ingabire", email: "grace@rp.ac.rw", phone: "+250 788 444 555", university: "Rwanda Polytechnic", gradYear: "2025", status: "Active" as const, registeredAt: "2024-05-18" },
  { id: 8, name: "Yves Ndayisaba", email: "yves@ur.ac.rw", phone: "+250 788 666 777", university: "University of Rwanda", gradYear: "2024", status: "Active" as const, registeredAt: "2024-01-09" },
];

type SortKey = "name" | "university" | "gradYear" | "registeredAt" | "status";

/* ── Page Component ──────────────────────────────────── */
export default function StudentsPage() {
  const { isTeacher } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("registeredAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", phone: "", university: "", gradYear: "" });

  // Auth guard: only teachers can view this page
  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-navy">Access Restricted</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md">Only teachers can view the student registration page. Contact an administrator if you believe this is an error.</p>
        <Button onClick={() => router.push("/dashboard")} variant="outline" className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  // Derived unique values for filters
  const universities = [...new Set(students.map(s => s.university))].sort();
  const gradYears = [...new Set(students.map(s => s.gradYear))].sort();

  // Filtered + sorted
  const filtered = useMemo(() => {
    let arr = students.filter(s => {
      if (search && !`${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (universityFilter !== "all" && s.university !== universityFilter) return false;
      if (yearFilter !== "all" && s.gradYear !== yearFilter) return false;
      return true;
    });

    arr.sort((a, b) => {
      let cmp = 0;
      const av = a[sortKey], bv = b[sortKey];
      cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return arr;
  }, [students, search, statusFilter, universityFilter, yearFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const resetFilters = () => {
    setSearch(""); setStatusFilter("all"); setUniversityFilter("all"); setYearFilter("all"); setPage(1);
  };

  const activeFiltersCount = (search ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (universityFilter !== "all" ? 1 : 0) + (yearFilter !== "all" ? 1 : 0);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email || !newStudent.phone || !newStudent.university || !newStudent.gradYear) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const student = {
        id: students.length + 1,
        ...newStudent,
        status: "Active" as const,
        registeredAt: new Date().toISOString().split("T")[0],
      };
      setStudents(prev => [student, ...prev]);
      setIsSubmitting(false);
      setIsDialogOpen(false);
      toast.success(`${newStudent.name} has been registered successfully. An activation email has been sent.`);
      setNewStudent({ name: "", email: "", phone: "", university: "", gradYear: "" });
      setPage(1);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">My Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and register students for the RIQS student membership program. You have registered <strong className="text-navy">{students.length}</strong> student{students.length !== 1 && "s"}.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-sm font-semibold h-11 px-6 transition-transform hover:scale-[1.01] active:scale-[0.99]">
              <UserPlus className="mr-2 h-4 w-4" /> Register New Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px] border-zinc-150">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-navy">Register Student</DialogTitle>
              <DialogDescription>
                Enter the student&apos;s details below. They will receive an email to set up their account and complete their profile.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input id="name" required placeholder="e.g. John Doe" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} className="pl-10" />
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input id="email" type="email" required placeholder="e.g. student@university.ac.rw" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="pl-10" />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input id="phone" required placeholder="e.g. +250 788 123 456" value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} className="pl-10" />
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gradYear">Expected Graduation Year <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input id="gradYear" required placeholder="e.g. 2025" value={newStudent.gradYear} onChange={e => setNewStudent({ ...newStudent, gradYear: e.target.value })} className="pl-10" />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="university">University / Institution <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input id="university" required placeholder="e.g. University of Rwanda" value={newStudent.university} onChange={e => setNewStudent({ ...newStudent, university: e.target.value })} className="pl-10" />
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <DialogFooter className="mt-6 sm:justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" className="bg-navy text-white hover:bg-navy/90 font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Complete Registration"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border border-zinc-150 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search students by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10 h-11 border-zinc-200 focus-visible:ring-gold" />
                {search && (
                  <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-11 w-[140px] border-zinc-200"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={universityFilter} onValueChange={v => { setUniversityFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-11 w-[200px] border-zinc-200"><SelectValue placeholder="University" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All universities</SelectItem>
                    {universities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={yearFilter} onValueChange={v => { setYearFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-11 w-[140px] border-zinc-200"><SelectValue placeholder="Grad Year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {gradYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={`${sortKey}-${sortDir}`} onValueChange={v => { const [k, d] = v.split("-") as [SortKey, "asc" | "desc"]; setSortKey(k); setSortDir(d); }}>
                  <SelectTrigger className="h-11 w-[200px] border-zinc-200">
                    <ArrowUpDown className="mr-2 h-4 w-4 text-gold shrink-0" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z–A)</SelectItem>
                    <SelectItem value="university-asc">University (A–Z)</SelectItem>
                    <SelectItem value="registeredAt-desc">Registered (Newest)</SelectItem>
                    <SelectItem value="registeredAt-asc">Registered (Oldest)</SelectItem>
                    <SelectItem value="gradYear-asc">Grad Year (Asc)</SelectItem>
                    <SelectItem value="gradYear-desc">Grad Year (Desc)</SelectItem>
                    <SelectItem value="status-asc">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Filter meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Showing <span className="font-semibold text-navy">{filtered.length}</span> student{filtered.length !== 1 && "s"}
                </span>
                {activeFiltersCount > 0 && (
                  <>
                    <Badge variant="outline" className="border-gold/45 bg-gold/10 text-gold font-bold">
                      {activeFiltersCount} filter{activeFiltersCount > 1 && "s"} active
                    </Badge>
                    <button onClick={resetFilters} className="text-xs text-navy font-semibold underline-offset-4 hover:underline">Clear all filters</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {pageData.length === 0 ? (
        <Card className="border-dashed border-zinc-200 bg-zinc-50/20">
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 text-muted-foreground">
              <Search className="h-5 w-5 text-gold" />
            </div>
            <h3 className="mt-4 font-bold text-navy text-lg">No students match your query</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or register a new student.</p>
            <Button onClick={resetFilters} variant="outline" className="mt-4 border-zinc-200 hover:bg-zinc-50">Reset filters</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-zinc-150 overflow-hidden shadow-sm bg-white animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  {["Student", "Contact Details", "University", "Grad Year", "Registered", "Status"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((student, i) => (
                  <tr key={student.id} className={cn(
                    "border-b border-zinc-100 transition-colors hover:bg-gold/5",
                    i % 2 === 1 && "bg-zinc-50/20"
                  )}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy to-[#14467f] text-xs font-bold text-white shadow-sm">
                          {student.name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="font-semibold text-zinc-900 leading-snug">{student.name}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-zinc-600">{student.email}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{student.phone}</div>
                    </td>
                    <td className="px-5 py-4 text-zinc-700 font-medium">{student.university}</td>
                    <td className="px-5 py-4 text-zinc-500">{student.gradYear}</td>
                    <td className="px-5 py-4 text-xs text-zinc-500">{student.registeredAt}</td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className={cn(
                        "font-semibold border-none px-2.5 py-1 text-xs",
                        student.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {student.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-100 pt-5">
          <div className="text-sm text-muted-foreground">
            Page <span className="font-semibold text-navy">{safePage}</span> of <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} className="h-9 w-9 border-zinc-200">
              <ChevronLeft className="h-4 w-4 text-gold" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button key={p} variant={p === safePage ? "default" : "outline"} onClick={() => setPage(p)}
                className={cn("h-9 w-9 font-semibold text-sm", p === safePage ? "bg-navy text-white shadow-md border-transparent" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50")}
              >{p}</Button>
            ))}
            <Button variant="outline" size="icon" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} className="h-9 w-9 border-zinc-200">
              <ChevronRight className="h-4 w-4 text-gold" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
