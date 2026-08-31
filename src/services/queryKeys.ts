export const queryKeys = {
  public: {
    categories: (filters?: Record<string, any>) => ['public', 'categories', filters] as const,
    members: (filters?: Record<string, any>) => ['public', 'members', filters] as const,
  },
  applicant: {
    profile: () => ['applicant', 'profile'] as const,
    applicationStatus: () => ['applicant', 'applicationStatus'] as const,
    payments: () => ['applicant', 'payments'] as const,
  },
  mentorship: {
    progress: () => ['mentorship', 'progress'] as const,
    mentees: () => ['mentorship', 'mentees'] as const,
    myMentorApplication: () => ['mentorship', 'my-mentor-application'] as const,
  },
  // Add other scopes here later (e.g., admin, member)
};
