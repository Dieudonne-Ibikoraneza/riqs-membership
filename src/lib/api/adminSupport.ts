import { axiosClient as api } from "../axiosClient";
import { SupportTicket, TicketReply } from "./support";

export interface AdminTicketResponse {
  tickets: (SupportTicket & { member: { id: string; fullName: string; email: string; membershipId: string; profilePhotoUrl?: string } })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const getAdminTickets = async (
  page = 1,
  limit = 10,
  status = "all",
  priority = "all",
  q = ""
): Promise<AdminTicketResponse> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (status !== "all") params.append("status", status);
  if (priority !== "all") params.append("priority", priority);
  if (q) params.append("q", q);

  const res = await api.get(`/admin/tickets?${params.toString()}`);
  return res.data;
};

export const getAdminTicketDetails = async (id: string): Promise<SupportTicket & { member: any }> => {
  const res = await api.get(`/admin/tickets/${id}`);
  return res.data.ticket;
};

export const adminReplyToTicket = async (id: string, message: string): Promise<TicketReply> => {
  const res = await api.post(`/admin/tickets/${id}/replies`, { message });
  return res.data.reply;
};

export const updateTicketStatus = async (id: string, updates: { status?: string; priority?: string }) => {
  const res = await api.patch(`/admin/tickets/${id}/status`, updates);
  return res.data;
};
