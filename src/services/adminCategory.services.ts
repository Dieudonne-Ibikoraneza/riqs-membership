import { axiosClient } from '@/lib/axiosClient';

export interface Category {
  id: string;
  location: 'Rwandan' | 'Non_Rwandan';
  entity_type: 'Individual' | 'Firm';
  category_name: string;
  category_code: string;
  processing_fee: number;
  currency: string;
  first_year_fee: number;
  annual_renewal_fee: number;
  stamp_fee: number;
  required_documents: string[];
}

export const adminCategoryServices = {
  getCategories: async (): Promise<Category[]> => {
    const response = await axiosClient.get('/categories');
    return response.data.categories;
  },

  createCategory: async (data: Omit<Category, 'id'>): Promise<any> => {
    const response = await axiosClient.post('/categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: Partial<Category>): Promise<any> => {
    const response = await axiosClient.put(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<any> => {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response.data;
  }
};
