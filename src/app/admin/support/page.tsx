"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Clock, CheckCircle2, Search, ArrowUpDown, Filter, User } from "lucide-react";
import { toast } from "sonner";
import { getAdminTickets, AdminTicketResponse } from "@/lib/api/adminSupport";
import { SupportTicket } from "@/lib/api/support";

export default function AdminSupportPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminTicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await getAdminTickets(page, 15, statusFilter, priorityFilter, q);
      setData(response);
    } catch (err: any) {
      toast.error("Failed to fetch tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, q, statusFilter, priorityFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open": return <Badge className="bg-emerald-100 text-emerald-800">Open</Badge>;
      case "In Progress": return <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>;
      case "Resolved":
      case "Closed": return <Badge className="bg-zinc-100 text-zinc-800">Resolved</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High": return <Badge className="bg-rose-100 text-rose-800 border-rose-200">High</Badge>;
      case "Medium": return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Medium</Badge>;
      case "Low": return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const resetFilters = () => {
    setQ("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setPage(1);
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    const token = typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : '';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    return `${baseUrl}/files/downloadByUrl?url=${encodeURIComponent(url)}&token=${token}`;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Support Help Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage member inquiries, questions, and complaints.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-slate-200">
        <div className="flex-1 space-y-1.5 w-full">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by subject, member name, or email..." 
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 h-11 border-zinc-200 shadow-sm"
            />
          </div>
        </div>
        
        <div className="space-y-1.5 w-full md:w-auto">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px] h-11 border-zinc-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 w-full md:w-auto">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-[150px] h-11 border-zinc-200">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(q || statusFilter !== "all" || priorityFilter !== "all") && (
          <Button variant="ghost" onClick={resetFilters} className="h-11 px-4 text-muted-foreground hover:text-foreground shrink-0">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && !data ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
          </div>
        ) : data?.tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Filter className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No Tickets Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">Try adjusting your filters or search query.</p>
            <Button onClick={resetFilters} variant="outline">Reset Filters</Button>
          </div>
        ) : (
          <div className="grid divide-y divide-slate-100">
            {data?.tickets.map((ticket: any) => (
              <div 
                key={ticket.id} 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/admin/support/${ticket.id}`)}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1 h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200 overflow-hidden font-semibold text-sm">
                    {ticket.member.profilePhotoUrl ? (
                      <img src={getImageUrl(ticket.member.profilePhotoUrl)} alt={ticket.member.fullName} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(ticket.member.fullName)
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 line-clamp-1">{ticket.subject}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-navy">{ticket.member.fullName}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{ticket.category}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {ticket._count?.replies || 0} replies
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center md:flex-col md:items-end gap-2 md:gap-1.5 justify-between md:w-[150px] shrink-0">
                  <div className="flex gap-2">
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ticket.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && data.pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.pagination.pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
