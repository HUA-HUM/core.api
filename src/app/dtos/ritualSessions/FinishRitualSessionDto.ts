import {
  RitualSessionEndSource,
  RitualSessionStatus,
} from '../../../core/entities/ritualSessions/RitualSession';

export class FinishRitualSessionDto {
  status?: Exclude<RitualSessionStatus, 'active'>;
  endSource!: RitualSessionEndSource;
}
