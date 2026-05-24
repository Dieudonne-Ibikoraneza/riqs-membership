import { axiosClient } from "@/lib/axiosClient";

export interface TeacherStudent {
  id: string;
  fullName: string;
  email: string;
  applicationId: string;
  status: string;
  categoryName: string;
  createdAt: string;
}

export const teacherServices = {
  uploadDocument: async (data: FormData) => {
    const appId = data.get('applicationId');
    const res = await axiosClient.post(`/teacher/application/${appId}/upload`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  downloadDocument: async (fileId: string) => {
    const response = await axiosClient.get(`/files/download/${fileId}`, { responseType: 'blob' });
    return response.data;
  },
  deleteDocumentByType: async (appId: string, documentType: string) => {
    const res = await axiosClient.delete(`/files/type/${appId}/${documentType}`);
    return res.data;
  },
  saveApplication: async (data: any) => {
    const res = await axiosClient.put(`/teacher/application/${data.applicationId || ''}/personal`, data);
    return res.data;
  },
  addEducation: async (appId: string, data: any) => {
    const res = await axiosClient.post(`/teacher/application/${appId}/education`, data);
    return res.data;
  },
  deleteEducation: async (appId: string, recordId: string) => {
    const res = await axiosClient.delete(`/teacher/application/${appId}/education/${recordId}`);
    return res.data;
  },
  addEmployment: async (appId: string, data: any) => {
    const res = await axiosClient.post(`/teacher/application/${appId}/employment`, data);
    return res.data;
  },
  deleteEmployment: async (appId: string, recordId: string) => {
    const res = await axiosClient.delete(`/teacher/application/${appId}/employment/${recordId}`);
    return res.data;
  },
  saveMentorship: async (appId: string, data: any) => {
    const res = await axiosClient.post(`/teacher/application/${appId}/mentorship`, data);
    return res.data;
  },
  deleteMentorshipOption: async (appId: string, regNumber: string) => {
    const res = await axiosClient.delete(`/teacher/application/${appId}/mentorship/${regNumber}`);
    return res.data;
  },
  getApplicationDetail: async (id: string) => {
    const { data } = await axiosClient.get(`/teacher/application/${id}`);
    return data;
  },
  getStudents: async () => {
    const { data } = await axiosClient.get<{ students: TeacherStudent[] }>("/teacher/students");
    return data;
  },
  registerStudent: async (studentData: any) => {
    const { data } = await axiosClient.post("/teacher/register-student", studentData);
    return data;
  },
  submitApplication: async (applicationId: string) => {
    const { data } = await axiosClient.post("/teacher/submit-student-application", { applicationId });
    return data;
  }
};
