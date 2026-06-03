import { axiosClient } from "@/lib/axiosClient";

export interface Competency {
  id: string;
  name: string;
  description: string;
  targetHours: number;
}

export interface LogbookEntry {
  id: string;
  applicationId: string;
  competencyId: string;
  date: string;
  hoursCompleted: number;
  descriptionOfWork: string;
  supervisorName: string;
  status: "Pending_Approval" | "Approved" | "Rejected";
  rejectionReason?: string;
  competency?: Competency;
  createdAt: string;
}

export interface LogbookProgressResponse {
  overallProgress: number;
  competencies: {
    competencyId: string;
    name: string;
    targetHours: number;
    completedHours: number;
    percentage: number;
  }[];
}

export const logbookServices = {
  getCompetencies: async (): Promise<Competency[]> => {
    const { data } = await axiosClient.get("/logbook/competencies");
    return data;
  },

  getLogbookEntries: async (applicationId: string): Promise<LogbookEntry[]> => {
    const { data } = await axiosClient.get(`/logbook/${applicationId}/entries`);
    return data;
  },

  getLogbookProgress: async (applicationId: string): Promise<LogbookProgressResponse> => {
    const { data } = await axiosClient.get(`/logbook/${applicationId}/progress`);
    return data;
  },

  submitLogbookEntry: async (payload: {
    applicationId: string;
    competencyId: string;
    date: string;
    hoursCompleted: number;
    descriptionOfWork: string;
    supervisorName?: string;
  }): Promise<LogbookEntry> => {
    const { data } = await axiosClient.post("/logbook/entry", payload);
    return data;
  },

  reviewLogbookEntry: async (payload: {
    entryId: string;
    status: "Approved" | "Rejected";
    rejectionReason?: string;
  }): Promise<LogbookEntry> => {
    const { data } = await axiosClient.patch("/logbook/entry/review", payload);
    return data;
  }
};
