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

  // Public, unauthenticated — the destination of the QR code printed on membership cards and
  // certificates. Returns 404 (found: false) when the membership ID doesn't exist.
  verifyMember: async (membershipId: string): Promise<{
    found: boolean;
    error?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string | null;
    membershipId?: string;
    membershipClass?: string;
    categoryName?: string | null;
    practiceLocation?: string | null;
    countryOfOrigin?: string | null;
    status?: "Active" | "Expired";
    membershipExpiresAt?: string | null;
    isFellow?: boolean;
    isHonorary?: boolean;
    honors?: string[];
    hasPhoto?: boolean;
  }> => {
    try {
      const response = await axiosClient.get(`/members/verify/${encodeURIComponent(membershipId)}`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return err.response.data;
      throw err;
    }
  },

  // Public URL for the streamed verification photo (see verifyMember's `hasPhoto` flag) —
  // no auth token needed, unlike the member-portal's private file-download endpoints.
  getVerifyPhotoUrl: (membershipId: string): string => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    return `${base}/members/verify/${encodeURIComponent(membershipId)}/photo`;
  },
};
