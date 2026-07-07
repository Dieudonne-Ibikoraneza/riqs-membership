"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, CheckCircle2, Shield, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getTicketDetails, replyToTicket, SupportTicket, TicketReply } from "@/lib/api/support";
import { connectSocket } from "@/lib/socketClient";
import { applicantServices } from "@/services/applicant.services";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function TicketDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track current user info for avatar display
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("You");

  // Keep track of real IDs that came from optimistic sends (to avoid socket duplicating them)
  const sentRealIds = useRef<Set<string>>(new Set());

  const fetchTicket = async () => {
    try {
      const data = await getTicketDetails(id as string);
      setTicket(data);
    } catch (err: any) {
      toast.error("Failed to load ticket details.");
      router.push('/dashboard/support');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch current user profile for avatar
    applicantServices.getProfile().then((profileData) => {
      if (profileData?.profile) {
        setCurrentUserId(profileData.profile.id);
        setCurrentUserName(profileData.profile.fullName || 'You');
      }
      if (profileData?.profile?.profilePhotoUrl) {
        setCurrentUserPhotoUrl(profileData.profile.profilePhotoUrl);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTicket();

    // Connect to websocket and listen for new replies
    const socket = connectSocket();
    socket.emit('join_ticket', id);

    const handleNewReply = (data: { ticketId: string, reply: TicketReply }) => {
      if (data.ticketId === id) {
        setTicket(prev => {
          if (!prev) return prev;
          // Skip if we already have this real ID (optimistic send already resolved it)
          if (sentRealIds.current.has(data.reply.id)) return prev;
          // Skip if already in the list
          if (prev.replies?.find(r => r.id === data.reply.id)) return prev;
          return {
            ...prev,
            replies: [...(prev.replies || []), data.reply]
          };
        });
      }
    };

    socket.on('new_ticket_reply', handleNewReply);

    // Fallback: refresh ticket every 15s to catch any missed socket messages
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
        senderId: currentUserId || 'me',
        message: msgToSend,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId || 'me',
          fullName: currentUserName,
          systemRole: 'Standard',
          profilePhotoUrl: currentUserPhotoUrl ?? undefined
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
      const response = await replyToTicket(id as string, msgToSend);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  if (!ticket) return null;

  const isResolved = ticket.status === 'Resolved' || ticket.status === 'Closed';

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto pb-8 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center gap-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy tracking-tight">{ticket.subject}</h1>
            <Badge variant="outline" className="bg-white">{ticket.category}</Badge>
            {isResolved ? (
              <Badge className="bg-zinc-100 text-zinc-800 border-zinc-200">Resolved</Badge>
            ) : ticket.status === 'In Progress' ? (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">In Progress</Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Open</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Ticket ID: <span className="font-mono text-xs">{ticket.id.split('-')[0]}</span> • Created {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col shadow-sm border-slate-200">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {ticket.replies?.map((reply, index) => {
            // The ticket owner (member) is always ticket.memberId.
            // Their messages go RIGHT. Everyone else (admin/staff) goes LEFT.
            // Also handle temp IDs from optimistic sends.
            const isFromMe =
              reply.senderId === ticket.memberId ||
              reply.sender?.id === ticket.memberId ||
              reply.id.startsWith('temp-') ||
              (currentUserId !== null && (
                reply.senderId === currentUserId ||
                reply.sender?.id === currentUserId
              ));
            const isAdmin = !isFromMe;
            const isFirst = index === 0;
            const senderPhotoUrl = reply.sender?.profilePhotoUrl;
            const initials = reply.sender?.fullName
              ? reply.sender.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              : '?';

            return (
              <div key={reply.id} className={`flex gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                {/* Admin avatar on left */}
                {isAdmin && (
                  <div className="h-10 w-10 rounded-full bg-navy flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    {senderPhotoUrl ? (
                      <img
                        src={`${API_URL}/files/downloadByUrl?url=${encodeURIComponent(senderPhotoUrl)}`}
                        alt={reply.sender?.fullName || 'Admin'}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                        }}
                      />
                    ) : null}
                    <Shield className="h-5 w-5 text-gold" style={senderPhotoUrl ? { display: 'none' } : {}} />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-baseline gap-2 mb-1.5 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <span className="text-sm font-medium text-zinc-700">
                      {isAdmin ? reply.sender?.fullName + ' (Admin)' : 'You'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl whitespace-pre-wrap text-sm shadow-sm
                      ${isAdmin
                        ? 'bg-white border border-slate-200 text-zinc-800 rounded-tl-sm'
                        : 'bg-navy text-white rounded-tr-sm'
                      }
                      ${isFirst && !isAdmin ? 'ring-2 ring-blue-100 ring-offset-2' : ''}
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

                {/* Member/user avatar on right */}
                {isFromMe && (
                  <div className="h-10 w-10 rounded-full shrink-0 order-2 overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center bg-navy">
                    {/* Show actual photo or initials */}
                    {(senderPhotoUrl || currentUserPhotoUrl) ? (
                      <img
                        src={`${API_URL}/files/downloadByUrl?url=${encodeURIComponent(senderPhotoUrl || currentUserPhotoUrl || '')}`}
                        alt="You"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-white text-xs font-bold">${initials}</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">{initials}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          {isResolved ? (
            <div className="flex items-center justify-center gap-2 text-zinc-500 py-4 bg-zinc-50 rounded-lg border border-dashed border-zinc-300">
              <CheckCircle2 className="h-5 w-5" />
              <p>This inquiry has been resolved and closed.</p>
            </div>
          ) : (
            <form onSubmit={handleReply} className="flex gap-3">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                className="min-h-[60px] resize-none focus-visible:ring-1 bg-slate-50"
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
                className="h-auto shrink-0 bg-navy hover:bg-navy/90 px-6"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
