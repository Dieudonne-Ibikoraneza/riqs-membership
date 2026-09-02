"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, ArrowLeft, Send, CheckCircle2, Shield, Info, User, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getAdminTicketDetails, adminReplyToTicket, updateTicketStatus } from "@/lib/api/adminSupport";
import { SupportTicket, TicketReply } from "@/lib/api/support";
import { connectSocket } from "@/lib/socketClient";

export default function AdminTicketDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<(SupportTicket & { member: any }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sentRealIds = useRef<Set<string>>(new Set());

  const fetchTicket = async () => {
    try {
      const data = await getAdminTicketDetails(id as string);
      setTicket(data);
    } catch (err: any) {
      toast.error("Failed to load ticket details.");
      router.push('/admin/support');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    
    // Connect to websocket and listen for new replies
    const socket = connectSocket();
    
    socket.emit('join_ticket', id);

    const handleNewReply = (data: { ticketId: string, reply: TicketReply }) => {
      if (data.ticketId === id) {
        setTicket(prev => {
          if (!prev) return prev;
          // Skip if we already resolved this via optimistic send
          if (sentRealIds.current.has(data.reply.id)) return prev;
          if (prev.replies?.find(r => r.id === data.reply.id)) return prev;
          return {
            ...prev,
            replies: [...(prev.replies || []), data.reply]
          };
        });
      }
    };

    socket.on('new_ticket_reply', handleNewReply);

    // Fallback: refresh every 15s to catch missed socket messages
    const pollInterval = setInterval(() => {
      fetchTicket();
    }, 15000);

    return () => {
      socket.off('new_ticket_reply', handleNewReply);
      socket.emit('leave_ticket', id);
      clearInterval(pollInterval);
    };
  }, [id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticket?.replies]);

  const handleReply = async (e?: React.FormEvent, retryMessage?: string, retryId?: string) => {
    if (e) e.preventDefault();
    const msgToSend = retryMessage || replyMessage;
    if (!msgToSend.trim()) return;

    const tempId = retryId || `temp-${Date.now()}`;
    
    // Optimistic UI - instantly add to chat
    if (!retryId) {
      const optimisticReply: TicketReply = {
        id: tempId,
        ticketId: id as string,
        senderId: 'admin',
        message: msgToSend,
        createdAt: new Date().toISOString(),
        sender: {
          id: 'admin',
          fullName: 'Admin',
          systemRole: 'Admin'
        },
        status: 'sending'
      };
      
      setTicket(prev => prev ? {
        ...prev,
        replies: [...(prev.replies || []), optimisticReply]
      } : prev);
      
      setReplyMessage("");
    } else {
      // Update existing temp message status back to sending
      setTicket(prev => prev ? {
        ...prev,
        replies: prev.replies?.map(r => r.id === tempId ? { ...r, status: 'sending' } : r)
      } : prev);
    }

    try {
      const response = await adminReplyToTicket(id as string, msgToSend);
      // Mark this real ID so socket doesn't duplicate it
      sentRealIds.current.add(response.id);
      // Replace optimistic message with actual DB message
      setTicket(prev => prev ? {
        ...prev,
        replies: prev.replies?.map(r => r.id === tempId ? response : r)
      } : prev);
    } catch (err: any) {
      toast.error("Failed to send reply.");
      // Mark as failed
      setTicket(prev => prev ? {
        ...prev,
        replies: prev.replies?.map(r => r.id === tempId ? { ...r, status: 'failed' } : r)
      } : prev);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTicketStatus(id as string, { status: newStatus });
      toast.success(`Ticket status updated to ${newStatus}`);
      fetchTicket();
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await updateTicketStatus(id as string, { priority: newPriority });
      toast.success(`Ticket priority updated to ${newPriority}`);
      fetchTicket();
    } catch (err: any) {
      toast.error("Failed to update priority.");
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="max-w-7xl mx-auto pb-8 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-navy tracking-tight line-clamp-1">{ticket.subject}</h1>
              <Badge variant="outline" className="bg-white">{ticket.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Ticket ID: <span className="font-mono text-xs">{ticket.id.split('-')[0]}</span> • Created {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        {/* Status & Priority as button groups */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Priority */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 font-semibold ${
                  ticket.priority === 'High' ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' :
                  ticket.priority === 'Medium' ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' :
                  'border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${
                  ticket.priority === 'High' ? 'bg-red-500' :
                  ticket.priority === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                {ticket.priority} Priority
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePriorityChange('High')} className="text-red-700">High Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityChange('Medium')} className="text-amber-700">Medium Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityChange('Low')}>Low Priority</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 font-semibold ${
                  ticket.status === 'Open' ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' :
                  ticket.status === 'In Progress' ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' :
                  ticket.status === 'Resolved' ? 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' :
                  'border-zinc-300 text-zinc-600 bg-zinc-50 hover:bg-zinc-100'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {ticket.status}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange('Open')} className="text-blue-700">Open</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('In Progress')} className="text-amber-700">In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('Resolved')} className="text-emerald-700">Resolved</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('Closed')}>Closed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Main Conversation Area */}
        <Card className="flex-1 flex flex-col shadow-sm border-slate-200 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
            {ticket.replies?.map((reply, index) => {
              // On admin side: member's messages go LEFT, admin's go RIGHT
              // Use senderId vs ticket.memberId to tell them apart
              const isMemberMessage = reply.senderId === ticket.memberId ||
                reply.sender?.id === ticket.memberId ||
                reply.id.startsWith('temp-');
              const isFirst = index === 0;

              return (
                <div key={reply.id} className={`flex gap-4 ${isMemberMessage ? 'justify-start' : 'justify-end'}`}>
                  {isMemberMessage && (
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center shrink-0 border border-blue-200 overflow-hidden">
                      {reply.sender?.profilePhotoUrl ? (
                        <img src={getImageUrl(reply.sender.profilePhotoUrl)} alt="User" className="h-full w-full object-cover" />
                      ) : (
                        getInitials(reply.sender?.fullName || 'User')
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] sm:max-w-[75%]`}>
                    <div className={`flex items-baseline gap-2 mb-1.5 ${!isMemberMessage ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-sm font-medium text-zinc-700">
                        {!isMemberMessage ? reply.sender?.fullName + ' (You/Admin)' : reply.sender?.fullName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div 
                      className={`p-4 rounded-2xl whitespace-pre-wrap text-sm shadow-sm
                        ${isMemberMessage 
                          ? 'bg-white border border-slate-200 text-zinc-800 rounded-tl-sm' 
                          : 'bg-navy text-white rounded-tr-sm'
                        }
                        ${isFirst && isMemberMessage ? 'ring-2 ring-blue-100 ring-offset-2' : ''}
                        ${reply.status === 'sending' ? 'opacity-70' : ''}
                        ${reply.status === 'failed' ? 'border-red-400 bg-red-50 text-red-900' : ''}
                      `}
                    >
                      {reply.message}
                    </div>
                    {reply.status === 'sending' && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground justify-end">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-navy"></div>
                        Sending...
                      </div>
                    )}
                    {reply.status === 'failed' && (
                      <div className="flex items-center justify-end gap-2 mt-2 text-xs text-red-500 font-medium">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Failed to send
                        <button 
                          onClick={() => handleReply(undefined, reply.message, reply.id)} 
                          className="flex items-center gap-1 hover:underline ml-1"
                        >
                          <RefreshCw className="h-3 w-3" /> Retry
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Admin avatar on right */}
                  {!isMemberMessage && (
                    <div className="h-10 w-10 rounded-full bg-navy text-white font-semibold text-sm flex items-center justify-center shrink-0 shadow-sm border border-navy overflow-hidden">
                      {reply.sender?.profilePhotoUrl ? (
                        <img src={getImageUrl(reply.sender.profilePhotoUrl)} alt="Admin" className="h-full w-full object-cover" />
                      ) : (
                        getInitials(reply.sender?.fullName || 'Admin')
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            {ticket.status === 'Closed' ? (
              <div className="flex items-center justify-center gap-2 text-zinc-500 py-4 bg-zinc-50 rounded-lg border border-dashed border-zinc-300">
                <CheckCircle2 className="h-5 w-5" />
                <p>This ticket is closed. Reopen it to reply.</p>
              </div>
            ) : (
              <form onSubmit={handleReply} className="flex gap-3 items-end">
                <Textarea 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="min-h-[70px] resize-none focus-visible:ring-1 bg-slate-50 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply(e);
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  disabled={!replyMessage.trim()}
                  className="h-10 shrink-0 bg-navy hover:bg-navy/90 px-5 gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </form>
            )}
          </div>
        </Card>

        {/* User Context Sidebar */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-5">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2 mb-4">
                <Info className="h-4 w-4 text-muted-foreground" />
                Member Information
              </h3>
              
              <div className="flex flex-col items-center mb-5">
                <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 font-semibold text-xl flex items-center justify-center border-2 border-white shadow-sm overflow-hidden mb-2">
                  {ticket.member.profilePhotoUrl ? (
                    <img src={getImageUrl(ticket.member.profilePhotoUrl)} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(ticket.member.fullName)
                  )}
                </div>
                <h4 className="font-semibold text-zinc-900 text-center">{ticket.member.fullName}</h4>
                <p className="text-xs text-muted-foreground">{ticket.member.email}</p>
                <Badge variant="outline" className="mt-2 bg-slate-50 font-mono text-xs">
                  {ticket.member.membershipId}
                </Badge>
              </div>

              <Button 
                className="w-full bg-navy hover:bg-navy/90 text-white gap-2"
                onClick={() => router.push(`/admin/members/${ticket.member.id}`)}
              >
                <ExternalLink className="h-4 w-4" />
                View Full Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
