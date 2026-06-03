import { axiosClient } from "../axiosClient";

export interface QueueApplication {
  id: string;
  member_id?: string;
  status: string;
  submitted_at: string;
  full_name: string;
  email: string;
  category_name: string;
  location: string;
  reviewer: string;
}

export interface AdminQueueResponse {
  queue: QueueApplication[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export async function getApplicationsQueue(
  page: number = 1,
  limit: number = 10,
  status?: string,
  view: string = 'queue'
): Promise<AdminQueueResponse> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  params.append("view", view);
  if (status && status !== "all") {
    params.append("status", status);
  }

  const { data } = await axiosClient.get<AdminQueueResponse>(`/admin/queue?${params.toString()}`);
  return data;
}

export async function getApplicationDetail(id: string): Promise<any> {
  const { data } = await axiosClient.get(`/admin/applications/${id}`);
  return data;
}

export async function takeOverApplication(applicationId: string): Promise<any> {
  const { data } = await axiosClient.post(`/admin/reviewer-action`, {
    applicationId,
    action: "StartReview",
  });
  return data;
}

export async function submitReviewDecision(
  applicationId: string,
  action: "Approve" | "Flag" | "Reject",
  notes?: string
): Promise<any> {
  const { data } = await axiosClient.post(`/admin/decision`, {
    applicationId,
    action,
    notes,
  });
  return data;
}

export async function submitReviewerAction(
  applicationId: string,
  action: "ReturnForCorrection" | "ForwardToApprover" | "StartReview",
  notes?: string
): Promise<any> {
  const { data } = await axiosClient.post(`/admin/reviewer-action`, {
    applicationId,
    action,
    notes,
  });
  return data;
}

export async function submitApproverDecision(
  applicationId: string,
  action: "Approve" | "Reject",
  notes?: string
): Promise<any> {
  const { data } = await axiosClient.post(`/admin/approver-decision`, {
    applicationId,
    action,
    notes,
  });
  return data;
}

export interface AdminMemberRegistryResponse {
  members: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export async function getMembersRegistry(
  page: number = 1,
  limit: number = 10,
  q?: string,
  status?: string,
  category?: string,
  location?: string,
  sortKey?: string,
  sortDir?: string
): Promise<AdminMemberRegistryResponse> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  
  if (q) params.append("q", q);
  if (status && status !== "all") params.append("status", status);
  if (category && category !== "all") params.append("category", category);
  if (location && location !== "all") params.append("location", location);
  if (sortKey) params.append("sortKey", sortKey);
  if (sortDir) params.append("sortDir", sortDir);

  const { data } = await axiosClient.get<AdminMemberRegistryResponse>(`/admin/members?${params.toString()}`);
  return data;
}

export async function sendAdminEmail(payload: FormData | any): Promise<any> {
  const { data } = await axiosClient.post('/admin/email/send', payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
  });
  return data;
}

export interface AuditLogItem {
  id: string;
  memberId: string | null;
  actionByEmail: string;
  actionType: string;
  details: string | null;
  createdAt: string;
  member: {
    fullName: string;
    email: string;
  } | null;
}

export interface AdminAuditLogsResponse {
  logs: AuditLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export async function getAuditLogs(
  page: number = 1,
  limit: number = 20
): Promise<AdminAuditLogsResponse> {
  const { data } = await axiosClient.get<AdminAuditLogsResponse>(
    `/admin/audit-logs?page=${page}&limit=${limit}`
  );
  return data;
}

export interface AdminPaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  txType: string;
  paymentMethod: string;
  transactionReference: string;
  status: string;
  createdAt: string;
  receiptUrl?: string;
  receiptFileName?: string;
  full_name?: string;
  email?: string;
}

export interface AdminPaymentsResponse {
  transactions: AdminPaymentTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export async function getPendingPayments(
  page: number = 1,
  limit: number = 20,
  status: string = "Pending_Verification"
): Promise<AdminPaymentsResponse> {
  const { data } = await axiosClient.get<AdminPaymentsResponse>(
    `/payments/queue?page=${page}&limit=${limit}&status=${status}`
  );
  return data;
}

export async function verifyPayment(
  transactionId: string,
  action: "Cleared" | "Failed" | "Refunded",
  rejectionReason?: string
): Promise<any> {
  const { data } = await axiosClient.post(`/payments/verify`, {
    transactionId,
    action,
    rejectionReason,
  });
  return data;
}

// --- APC Endpoints ---

export async function getApcForApplication(applicationId: string): Promise<any> {
  const { data } = await axiosClient.get(`/admin/apc/${applicationId}`);
  return data;
}

export async function scheduleApc(payload: {
  applicationId: string;
  assessmentDate: string;
  panelChair?: string;
  examiner1?: string;
  examiner2?: string;
}): Promise<any> {
  const { data } = await axiosClient.post(`/progression/apc/register`, payload);
  return data;
}

export async function gradeApc(payload: {
  assessmentId: string;
  status: "Attended" | "Passed" | "Failed" | "No Show";
  scorePercentage?: number;
  assessmentNotes?: string;
  stampFeePaid?: boolean;
  licenseIssued?: boolean;
}): Promise<any> {
  const { data } = await axiosClient.post(`/progression/apc/grade`, payload);
  return data;
}

export async function getStaffRegistry() {
  const { data } = await axiosClient.get("/admin/staff");
  return data;
}

export async function createStaffAccount(payload: { fullName: string; email: string; systemRole: string }) {
  const { data } = await axiosClient.post("/admin/staff", payload);
  return data;
}

export async function lockStaffAccount(id: string, durationDays: number) {
  const { data } = await axiosClient.patch(`/admin/staff/${id}/lock`, { durationDays });
  return data;
}

export async function unlockStaffAccount(id: string) {
  const { data } = await axiosClient.patch(`/admin/staff/${id}/unlock`);
  return data;
}

export async function getAllApc(status?: string, page: number = 1, limit: number = 20): Promise<any> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (status && status !== "all") params.append("status", status);
  const { data } = await axiosClient.get(`/admin/apc?${params.toString()}`);
  return data;
}
