import { axiosClient } from '@/lib/axiosClient';

/** A single document requirement configured by the admin for a category.
 *  `name`     — Human-readable label the admin gave it, e.g. "Proof of MoMo Payment"
 *  `typeCode` — Code of the predefined DocumentType bucket, e.g. "payment"
 */
export interface CategoryDocument {
  name: string;
  typeCode: string;
}

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
  supported_honors: { name: string, description?: string }[];
  required_documents: CategoryDocument[];
  optional_documents: CategoryDocument[];
}

export interface DocumentType {
  id: string;
  name: string;
  code: string;
  isPaymentProof: boolean;
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
  },

  getDocumentTypes: async (): Promise<DocumentType[]> => {
    const response = await axiosClient.get('/document-types');
    return response.data;
  },

  createDocumentType: async (data: Omit<DocumentType, 'id'>): Promise<DocumentType> => {
    const response = await axiosClient.post('/document-types', data);
    return response.data;
  },

  deleteDocumentType: async (id: string): Promise<any> => {
    const response = await axiosClient.delete(`/document-types/${id}`);
    return response.data;
  }
};
