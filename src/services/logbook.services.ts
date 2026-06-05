import { axiosClient } from "@/lib/axiosClient";

export interface LogbookEntry {
  id: string;
  applicationId: string;
  period: string;
  documentUrl: string;
  createdAt: string;
}

export interface MentorshipProgressResponse {
  assignment: any;
  entriesCount: number;
  entries: LogbookEntry[];
}

export const logbookServices = {
  getLogbookEntries: async (applicationId: string): Promise<LogbookEntry[]> => {
    const { data } = await axiosClient.get(`/logbook/${applicationId}/entries`);
    return data;
  },

  getMentorshipProgress: async (applicationId: string): Promise<MentorshipProgressResponse> => {
    const { data } = await axiosClient.get(`/logbook/${applicationId}/progress`);
    return data;
  },

  submitLogbookEntry: async (formData: FormData): Promise<LogbookEntry> => {
    const { data } = await axiosClient.post("/logbook/entry", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return data;
  },

  uploadAnnualReport: async (formData: FormData): Promise<any> => {
    const { data } = await axiosClient.post("/logbook/annual-report", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return data;
  },

  requestUpgrade: async (payload: { applicationId: string, apcReadiness: "Ready" | "Not_Ready" }): Promise<any> => {
    const { data } = await axiosClient.post("/logbook/request-upgrade", payload);
    return data;
  },

  submitMentorRecommendation: async (formData: FormData): Promise<any> => {
    const { data } = await axiosClient.post(`/logbook/mentor-recommendation`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return data;
  },

  adminReviewUpgrade: async (applicationId: string, payload: {
    status: "Approved" | "Rejected";
    adminNotes?: string;
  }): Promise<any> => {
    const { data } = await axiosClient.put(`/logbook/upgrade/${applicationId}/admin-review`, payload);
    return data;
  }
};
