import { axiosClient } from '@/lib/axiosClient';

export interface Category {
  id: string;
  category_name: string;
  category_code: string;
  processing_fee: string | number;
  first_year_fee: string | number;
  annual_renewal_fee: string | number;
  location?: 'Rwandan' | 'Non_Rwandan';
  entity_type?: 'Individual' | 'Firm';
  entityType?: 'Individual' | 'Firm';
  stamp_fee?: string | number;
  currency?: string;
  required_documents?: string[];
  optional_documents?: string[];
}

export interface PublicMember {
  id: string;
  membership_id: string;
  full_name: string;
  membership_class: string;
  phone_number: string;
  email: string;
}

export interface PublicMembersResponse {
  members: PublicMember[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export const publicServices = {
  getCategories: async (params?: {
    location?: string;
    entityType?: string;
  }): Promise<Category[]> => {
    const response = await axiosClient.get('/categories', { params });
    // Assuming backend returns { categories: Category[] }
    return response.data.categories;
  },

  getPublicMembers: async (params?: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
    mentorsOnly?: boolean;
  }): Promise<PublicMembersResponse> => {
    const response = await axiosClient.get('/members/directory', { params });
    return response.data;
  },

  getMentorById: async (membershipId: string): Promise<{ fullName: string; contact: string }> => {
    const response = await axiosClient.get(`/members/mentors/${membershipId}`);
    return response.data;
  },
};
