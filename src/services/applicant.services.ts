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
    membershipId?: string | null;
    profilePhotoUrl?: string | null;
  };
  application: {
    id: string;
    status: string;
    practiceLocation: string;
    entityType: string;
    categoryId: string;
    category_name: string;
    submittedAt: string | null;
    approvedAt?: string | null;
    reviewerNotes?: string | null;
    currentStep?: number | null;
    hasNoEmployment?: boolean | null;
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
  mentorship?: {
    id: string;
    mentorshipPlan: string | null;
    options: Array<{
      regNumber: string;
      name: string;
      contact: string;
    }>;
    mentorName?: string | null;
    mentorQualification?: string | null;
    mentorEmployer?: string | null;
    mentorContact?: string | null;
    mentorRegistrationNumber?: string | null;
    completedDurationMonths?: number | null;
  };
  financialTransactions?: any[];
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

  uploadProfilePhoto: async (file: File): Promise<{ message: string; profilePhotoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post('/members/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
    currentStep?: number;
    hasNoEmployment?: boolean;
  }): Promise<any> => {
    const response = await axiosClient.patch('/applicants/application', data);
    return response.data;
  },

  submitApplication: async (applicationId: string): Promise<any> => {
    const response = await axiosClient.post('/applicants/submit', { applicationId });
    return response.data;
  },

  saveShareholders: async (applicationId: string, shareholders: any[]): Promise<any> => {
    const response = await axiosClient.put('/applicants/shareholders', { applicationId, shareholders });
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

  deleteDocumentByType: async (applicationId: string, documentType: string): Promise<any> => {
    const response = await axiosClient.delete(`/files/type/${applicationId}/${documentType}`);
    return response.data;
  },

  saveMentorship: async (data: {
    applicationId: string;
    mentorshipPlan: string;
    options: any[];
  }): Promise<any> => {
    const response = await axiosClient.put('/education/mentorship', data);
    return response.data;
  },

  deleteMentorshipOption: async (applicationId: string, regNumber: string): Promise<any> => {
    const response = await axiosClient.delete(`/education/mentorship/${applicationId}/options/${regNumber}`);
    return response.data;
  },

  getMentees: async (): Promise<any> => {
    const response = await axiosClient.get('/progression/mentees');
    return response.data;
  },

  getMentorshipProgress: async (): Promise<any> => {
    const response = await axiosClient.get('/progression/mentorship/progress');
    return response.data;
  },

  getPaymentHistory: async (): Promise<any> => {
    const response = await axiosClient.get('/payments/history');
    return response.data;
  },

  submitPayment: async (data: {
    applicationId?: string;
    amount: number;
    currency: string;
    txType: string;
    paymentMethod: string;
    transactionReference: string;
    receiptUrl?: string;
  }): Promise<any> => {
    const response = await axiosClient.post('/payments/submit', data);
    return response.data;
  },

  getApcStatus: async (): Promise<any> => {
    const response = await axiosClient.get('/progression/apc/status');
    return response.data;
  },

  requestApc: async (): Promise<any> => {
    const response = await axiosClient.post('/progression/apc/request');
    return response.data;
  },

  getDocumentTypes: async (): Promise<Array<{ id: string; name: string; code: string; isPaymentProof: boolean }>> => {
    const response = await axiosClient.get('/document-types');
    return response.data;
  }
};
