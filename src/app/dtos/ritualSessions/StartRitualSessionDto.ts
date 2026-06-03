import { RitualSessionStartSource } from '../../../core/entities/ritualSessions/RitualSession';

export class StartRitualSessionDto {
  ritualId!: string;
  plannedEndAt?: string | null;
  startSource!: RitualSessionStartSource;
}
