import { RitualSession } from '../ritualSessions/RitualSession';

export interface InternalAnalyticsRitualHistory {
  generatedAt: Date;
  ritual: {
    id: string;
    userId: string;
    userEmail: string | null;
    userDisplayName: string | null;
    title: string;
    status: string;
    startTime: string;
    endTime: string;
    weekdays: number[];
    appCount: number;
    categoryCount: number;
    domainCount: number;
  };
  summary: {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    totalFocusMinutes: number;
    averageFocusMinutes: number;
    lastStartedAt: Date | null;
    lastEndedAt: Date | null;
  };
  sessions: RitualSession[];
}
