import { axiosClient } from '@/lib/axiosClient';

export interface AuthResponse {
  message: string;
  member?: any;
  token?: string;
  requirePasswordChange?: boolean;
}

export const authServices = {
  register: async (data: any): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  login: async (data: any): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/login', data);
    return response.data;
  },

  verifyOtp: async (data: { email: string; otp: string }): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/verify-otp', data);
    return response.data;
  },

  forgotPassword: async (data: { email: string }): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: any): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/reset-password', data);
    return response.data;
  },

  resendOtp: async (data: { email: string; type: 'verification' | 'reset' }): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/resend-otp', data);
    return response.data;
  }
};
