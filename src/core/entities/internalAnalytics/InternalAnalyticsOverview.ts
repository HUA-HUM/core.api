export interface InternalAnalyticsOverview {
  generatedAt: Date;
  users: {
    total: number;
    active: number;
    disabled: number;
    withActiveTag: number;
    withoutActiveTag: number;
    withActiveRituals: number;
  };
  tags: {
    activeTags: number;
    activeClaims: number;
    revokedClaims: number;
    usersWithActiveTag: number;
  };
  rituals: {
    total: number;
    active: number;
    archived: number;
    activeNow: number;
    protected: number;
    nfcUnlockEnabled: number;
    averageActiveRitualsPerUser: number;
  };
  blockedItems: {
    total: number;
    apps: number;
    categories: number;
    domains: number;
    ios: number;
    android: number;
  };
  sessions: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    startedToday: number;
    completedToday: number;
    cancelledToday: number;
    totalFocusMinutes: number;
    averageFocusMinutes: number;
    lastStartedAt: Date | null;
  };
}
