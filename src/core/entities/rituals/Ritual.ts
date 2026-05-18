export type RitualStatus = 'active' | 'archived';

export interface Ritual {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  icon: string;
  durationMinutes: number;
  weekdays: number[];
  startTime: string | null;
  endTime: string | null;
  appCount: number;
  categoryCount: number;
  domainCount: number;
  selectionDigest: string | null;
  status: RitualStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRitualData {
  userId: string;
  title: string;
  description?: string | null;
  icon: string;
  durationMinutes: number;
  weekdays: number[];
  startTime?: string | null;
  endTime?: string | null;
  appCount: number;
  categoryCount: number;
  domainCount: number;
  selectionDigest?: string | null;
}
