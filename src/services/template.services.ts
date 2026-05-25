import { axiosClient } from '@/lib/axiosClient';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  description: string;
}

export const getTemplates = async (): Promise<EmailTemplate[]> => {
  const response = await axiosClient.get('/templates');
  return response.data;
};

export const getTemplateById = async (id: string): Promise<EmailTemplate> => {
  const response = await axiosClient.get(`/templates/${id}`);
  return response.data;
};

export const updateTemplate = async (id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> => {
  const response = await axiosClient.put(`/templates/${id}`, data);
  return response.data;
};
