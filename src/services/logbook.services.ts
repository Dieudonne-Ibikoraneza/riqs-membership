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

  uploadAnnualReport: async (formData: FormData, onUploadProgress?: (progressEvent: any) => void): Promise<any> => {
    const { data } = await axiosClient.post("/logbook/annual-report", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      onUploadProgress
    });
    return data;
  },

  requestUpgrade: async (payload: { applicationId: string, apcReadiness: "Ready" | "Not_Ready" }): Promise<any> => {
    const { data } = await axiosClient.post("/logbook/request-upgrade", payload);
    return data;
  },

  submitMentorRecommendation: async (payload: { applicationId: string; recommend: boolean; mentorNotes?: string } | FormData): Promise<any> => {
    // Keep the old local component compatible while all live requests use the checkbox payload.
    const body = payload instanceof FormData
      ? { applicationId: String(payload.get("applicationId") || ""), recommend: true }
      : payload;
    const { data } = await axiosClient.post(`/logbook/mentor-recommendation`, body);
    return data;
  }

  // adminReviewUpgrade was removed along with its backend route — it bypassed the
  // reviewer board / Head Reviewer forwarding step entirely and was unused by any page.
  // Use adminServices.approveMentorshipUpgrade / flagMentorshipForCorrection instead.
};
