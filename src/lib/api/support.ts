import { axiosClient as api } from "../axiosClient";

export interface TicketReply {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    systemRole: string;
    profilePhotoUrl?: string;
  };
  status?: 'sending' | 'failed' | 'sent';
}

export interface SupportTicket {
  id: string;
  memberId: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  replies?: TicketReply[];
  _count?: {
    replies: number;
  };
}

export const getMyTickets = async (): Promise<SupportTicket[]> => {
  const res = await api.get('/tickets');
  return res.data.tickets;
};

export const getTicketDetails = async (id: string): Promise<SupportTicket> => {
  const res = await api.get(`/tickets/${id}`);
  return res.data.ticket;
};

export const createTicket = async (data: { subject: string; category: string; message: string; priority?: string }): Promise<SupportTicket> => {
  const res = await api.post('/tickets', data);
  return res.data.ticket;
};

export const replyToTicket = async (id: string, message: string): Promise<TicketReply> => {
  const res = await api.post(`/tickets/${id}/replies`, { message });
  return res.data.reply;
};
