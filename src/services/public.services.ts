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
  isFellow?: boolean;
  isHonorary?: boolean;
  honors?: string[];
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
    includeAdminOnly?: boolean;
  }): Promise<Category[]> => {
    // We only pass location and entityType to the backend
    const apiParams = {
      location: params?.location,
      entityType: params?.entityType
    };
    const response = await axiosClient.get('/categories', { params: apiParams });
    const allCategories = response.data.categories;
    
    // By default, filter out Admin-only special categories from public-facing forms
    if (params?.includeAdminOnly) {
      return allCategories;
    }
    
    const adminOnlyCategories = ["Visiting Member"];
    return allCategories.filter(
      (cat: Category) => !adminOnlyCategories.includes(cat.category_name)
    );
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
