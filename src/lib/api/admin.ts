import { axiosClient } from "../axiosClient";

export interface QueueApplication {
  id: string;
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
  action: "ReturnForCorrection" | "ForwardToApprover",
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
