export interface RankingEntry {
  position: number;
  totalFocusSeconds: number;
  isMe: boolean;
  // Real name for the authenticated user, "Usuario N" for everyone else.
  label: string;
  // Only filled for the authenticated user. Other participants stay anonymous.
  displayName: string | null;
}

export interface RankingMe {
  // null when the user has no focus time this month (or is excluded).
  position: number | null;
  displayName: string | null;
  totalFocusSeconds: number;
}

export interface MonthlyRanking {
  periodStart: Date;
  periodEnd: Date;
  timeZone: string;
  // Active accounts using the app (internal/test accounts excluded).
  totalUsers: number;
  // Users with focus time this month (the ones that appear in the ranking).
  participants: number;
  me: RankingMe;
  entries: RankingEntry[];
}

export interface MonthlyRankingOptions {
  timeZone: string;
  excludedEmails: string[];
  maxSessionSeconds: number;
  maxEntries: number;
}
