import { axiosClient } from '@/lib/axiosClient';

export interface ApplicantProfileResponse {
  profile: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string | null;
    gender: string | null;
    nationalIdOrPassport: string | null;
    residencyAddress: string | null;
    workAddress: string | null;
    membershipClass: string | null;
  };
  application: {
    id: string;
    status: string;
    practiceLocation: string;
    entityType: string;
    categoryId: string;
    category_name: string;
    submittedAt: string | null;
  } | null;
  education: Array<{
    id: string;
    institution: string;
    qualificationType: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
  }>;
  employment: Array<{
    id: string;
    companyName: string;
    jobTitle: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
  }>;
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    uploadedAt: string;
  }>;
}

export const applicantServices = {
  getProfile: async (): Promise<ApplicantProfileResponse> => {
    const response = await axiosClient.get('/applicants/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<ApplicantProfileResponse['profile']>): Promise<any> => {
    const response = await axiosClient.put('/members/profile', data);
    return response.data;
  },

  saveApplication: async (data: {
    practiceLocation: string;
    entityType: string;
    categoryId: string;
    fullName?: string;
    phoneNumber?: string;
    dob?: string;
    nationalIdOrPassport?: string;
    yearsInProfession?: string | number;
    residencyAddress?: object;
    workAddress?: object;
    countryOfOrigin?: string;
  }): Promise<any> => {
    const response = await axiosClient.patch('/applicants/application', data);
    return response.data;
  },

  submitApplication: async (applicationId: string): Promise<any> => {
    const response = await axiosClient.post('/applicants/submit', { applicationId });
    return response.data;
  },

  addEducation: async (data: {
    applicationId: string;
    institution: string;
    qualificationType: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
  }): Promise<any> => {
    const response = await axiosClient.post('/education', data);
    return response.data;
  },

  deleteEducation: async (id: string): Promise<any> => {
    const response = await axiosClient.delete(`/education/${id}`);
    return response.data;
  },

  addEmployment: async (data: {
    applicationId: string;
    companyName: string;
    jobTitle: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
  }): Promise<any> => {
    const response = await axiosClient.post('/employment', data);
    return response.data;
  },

  deleteEmployment: async (id: string): Promise<any> => {
    const response = await axiosClient.delete(`/employment/${id}`);
    return response.data;
  },

  uploadDocument: async (data: FormData): Promise<any> => {
    const response = await axiosClient.post('/files/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadDocument: async (fileId: string): Promise<Blob> => {
    const response = await axiosClient.get(`/files/download/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
