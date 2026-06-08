import {
  RitualSession,
  RitualSessionEndSource,
  RitualSessionStartSource,
  RitualSessionStatus,
} from '../../../core/entities/ritualSessions/RitualSession';
import {
  nullableDateISOString,
  requiredDateISOString,
} from '../common/dateResponse';

export class RitualSessionResponseDto {
  id!: string;
  userId!: string;
  ritualId!: string;
  startedAt!: string;
  plannedEndAt!: string | null;
  endedAt!: string | null;
  status!: RitualSessionStatus;
  startSource!: RitualSessionStartSource;
  endSource!: RitualSessionEndSource | null;
  durationSeconds!: number | null;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(session: RitualSession): RitualSessionResponseDto {
    return {
      id: session.id,
      userId: session.userId,
      ritualId: session.ritualId,
      startedAt: requiredDateISOString(session.startedAt, 'startedAt'),
      plannedEndAt: nullableDateISOString(session.plannedEndAt),
      endedAt: nullableDateISOString(session.endedAt),
      status: session.status,
      startSource: session.startSource,
      endSource: session.endSource,
      durationSeconds: session.durationSeconds,
      createdAt: requiredDateISOString(session.createdAt, 'createdAt'),
      updatedAt: requiredDateISOString(session.updatedAt, 'updatedAt'),
    };
  }
}
