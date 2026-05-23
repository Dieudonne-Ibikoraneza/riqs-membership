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
