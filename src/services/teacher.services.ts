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

  submitStudentApplication: async (applicationId: string) => {
    const { data } = await axiosClient.post("/teacher/submit-student-application", { applicationId });
    return data;
  }
};
