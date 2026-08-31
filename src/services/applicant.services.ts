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
    residencyAddress: string | Record<string, string> | null;
    workAddress: string | Record<string, string> | null;
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
    processing_fee?: string | number;
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

  submitProfileEditRequest: async (payload: {
    fullName?: string;
    residencyAddress?: string | Record<string, string>;
    workAddress?: string | Record<string, string>;
    memberNotes?: string;
    education?: Array<{ institution: string; qualificationType: string; fieldOfStudy: string; startDate: string; endDate: string }>;
    employment?: Array<{ companyName: string; jobTitle: string; startDate: string; endDate?: string; isCurrent?: boolean }>;
    photo?: File | null;
    certificates?: Record<number, File>;
  }): Promise<any> => {
    const formData = new FormData();
    if (payload.fullName) formData.append('fullName', payload.fullName);
    if (payload.residencyAddress) formData.append('residencyAddress', typeof payload.residencyAddress === 'string' ? payload.residencyAddress : JSON.stringify(payload.residencyAddress));
    if (payload.workAddress) formData.append('workAddress', typeof payload.workAddress === 'string' ? payload.workAddress : JSON.stringify(payload.workAddress));
    if (payload.memberNotes) formData.append('memberNotes', payload.memberNotes);
    if (payload.education) formData.append('education', JSON.stringify(payload.education));
    if (payload.employment) formData.append('employment', JSON.stringify(payload.employment));
    if (payload.photo) formData.append('photo', payload.photo);
    if (payload.certificates) {
      Object.entries(payload.certificates).forEach(([index, file]) => {
        formData.append(`certificate_${index}`, file);
      });
    }
    const response = await axiosClient.post('/members/profile/edit-request', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMyProfileEditRequests: async (): Promise<{ requests: any[] }> => {
    const response = await axiosClient.get('/members/profile/edit-request');
    return response.data;
  },

  // Being Technologist/Professional no longer grants the Mentor role automatically — this is
  // the member-initiated path to it (reviewed by an Admin/Admin Assistant). The other path,
  // an Admin/Approver promoting someone directly from their profile, needs no member action.
  requestMentorStatus: async (motivation?: string): Promise<{ message: string; application: any }> => {
    const response = await axiosClient.post('/members/mentor-application', { motivation });
    return response.data;
  },

  getMyMentorApplication: async (): Promise<{ application: any | null }> => {
    const response = await axiosClient.get('/members/mentor-application');
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

  initiateProcessingFeePayment: async (data: { applicationId: string; mobilephone: string }): Promise<{
    status: string;
    transactionId: string;
    message: string;
  }> => {
    const response = await axiosClient.post('/payments/processing-fee/initiate', data);
    return response.data;
  },

  getProcessingFeePaymentStatus: async (transactionId: string): Promise<{
    status: string;
    transactionId: string;
    applicationId: string | null;
    rejectionReason: string | null;
  }> => {
    const response = await axiosClient.get(`/payments/processing-fee/status/${transactionId}`);
    return response.data;
  },

  initiateAnnualRenewalPayment: async (data: { mobilephone: string; cpdDocumentUrl: string }): Promise<{
    status: string;
    transactionId: string;
    message: string;
  }> => {
    const response = await axiosClient.post('/payments/annual-renewal/initiate', data);
    return response.data;
  },

  getAnnualRenewalPaymentStatus: async (transactionId: string): Promise<{
    status: string;
    transactionId: string;
    rejectionReason: string | null;
    // Payment cleared through the gateway, but an Admin/Admin Assistant still needs to
    // review the CPD/Annual Report before the renewal is complete.
    awaitingReview?: boolean;
  }> => {
    const response = await axiosClient.get(`/payments/annual-renewal/status/${transactionId}`);
    return response.data;
  },

  initiateFirstYearFeePayment: async (data: { mobilephone: string }): Promise<{
    status: string;
    transactionId: string;
    message: string;
  }> => {
    const response = await axiosClient.post('/payments/first-year-fee/initiate', data);
    return response.data;
  },

  getFirstYearFeePaymentStatus: async (transactionId: string): Promise<{
    status: string;
    transactionId: string;
    rejectionReason: string | null;
  }> => {
    const response = await axiosClient.get(`/payments/first-year-fee/status/${transactionId}`);
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

  uploadDocument: async (data: FormData, onUploadProgress?: (progressEvent: any) => void): Promise<any> => {
    const response = await axiosClient.post('/files/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
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
