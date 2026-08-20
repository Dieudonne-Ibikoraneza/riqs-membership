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
  photoId?: string;
  profilePhotoUrl?: string;
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
  action: "ReturnForCorrection" | "ForwardToApprover" | "SubmitReviewNote" | "ForwardToReviewers",
  notes?: string,
  complianceStatus?: "Compliant" | "Non-compliant"
): Promise<any> {
  const { data } = await axiosClient.post(`/admin/reviewer-action`, {
    applicationId,
    action,
    notes,
    complianceStatus,
  });
  return data;
}

export async function submitApproverDecision(
  applicationId: string,
  action: "Approve" | "Reject" | "ReturnForCorrection",
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
  panelChairEmail?: string;
  examiner1?: string;
  examiner1Email?: string;
  examiner2?: string;
  examiner2Email?: string;
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

export async function promoteToHeadReviewer(id: string) {
  const { data } = await axiosClient.patch(`/admin/staff/${id}/promote-head-reviewer`);
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

// --- Mentorship Bundle Review ---

export interface MentorshipQueueResponse {
  queue: {
    id: string;
    member_id: string;
    full_name: string;
    email: string;
    category_name: string;
    location: string;
    submitted_at: string;
    status: string;
    mentor_name: string;
    apc_readiness: string;
    duration_months: number;
    photoId?: string;
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export async function getMentorshipQueue(
  page: number = 1,
  limit: number = 10,
  q?: string,
  status?: string
): Promise<MentorshipQueueResponse> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (q) params.append("q", q);
  if (status) params.append("status", status);
  const { data } = await axiosClient.get<MentorshipQueueResponse>(`/admin/mentorship/queue?${params.toString()}`);
  return data;
}

export async function approveMentorshipUpgrade(applicationId: string, notes?: string): Promise<{
  message: string;
  apcAssessmentId: string;
  applicationId: string;
}> {
  const { data } = await axiosClient.post("/admin/mentorship/approve", { applicationId, notes });
  return data;
}

export async function flagMentorshipForCorrection(applicationId: string, notes: string): Promise<any> {
  const { data } = await axiosClient.post("/admin/mentorship/flag", { applicationId, notes });
  return data;
}

export async function submitMentorshipReview(payload: {
  applicationId: string;
  notes: string;
  proposedAssessmentDate?: string;
  recommendation?: string;
}): Promise<any> {
  const { data } = await axiosClient.post('/admin/mentorship/review', payload);
  return data;
}

export async function forwardMentorshipToApprover(applicationId: string, notes: string): Promise<any> {
  const { data } = await axiosClient.post('/admin/mentorship/forward', { applicationId, notes });
  return data;
}

export async function awardAssociate(applicationId: string): Promise<any> {
  const { data } = await axiosClient.post(`/progression/associate/award`, { applicationId });
  return data;
}

export async function awardFellowStatus(memberId: string): Promise<any> {
  const { data } = await axiosClient.post(`/admin/members/${memberId}/award-fellow`);
  return data;
}

export async function revokeFellowStatus(memberId: string): Promise<any> {
  const { data } = await axiosClient.post(`/admin/members/${memberId}/revoke-fellow`);
  return data;
}

export async function awardHonoraryStatus(memberId: string): Promise<any> {
  const { data } = await axiosClient.post(`/admin/members/${memberId}/award-honorary`);
  return data;
}

export async function revokeHonoraryStatus(memberId: string): Promise<any> {
  const { data } = await axiosClient.post(`/admin/members/${memberId}/revoke-honorary`);
  return data;
}

export async function createHonorableMentionMember(payload: {
  fullName: string;
  email: string;
  phoneNumber: string;
  categoryCode: 'LQS' | 'HQS' | 'VQS';
  nationalIdOrPassport?: string;
  dateOfBirth?: string;
  gender?: string;
  countryOfOrigin?: string;
}): Promise<{ message: string; membershipId: string; temporaryPassword?: string }> {
  const { data } = await axiosClient.post('/admin/members/honorable-mention', payload);
  return data;
}

export async function getMemberById(id: string): Promise<any> {
  const { data } = await axiosClient.get(`/admin/members/${id}`);
  return data;
}

export async function changeMembershipCategory(id: string, newCategoryId: string): Promise<{ message: string; member: any }> {
  const { data } = await axiosClient.post(`/admin/members/${id}/change-category`, { newCategoryId });
  return data;
}


export async function updateMemberHonors(id: string, honors: string[]): Promise<{ message: string; member: any }> {
  const { data } = await axiosClient.post(`/admin/members/${id}/honors`, { honors });
  return data;
}
