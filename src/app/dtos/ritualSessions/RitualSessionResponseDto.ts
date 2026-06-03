import {
  RitualSession,
  RitualSessionEndSource,
  RitualSessionStartSource,
  RitualSessionStatus,
} from '../../../core/entities/ritualSessions/RitualSession';

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
      startedAt: session.startedAt.toISOString(),
      plannedEndAt: session.plannedEndAt?.toISOString() ?? null,
      endedAt: session.endedAt?.toISOString() ?? null,
      status: session.status,
      startSource: session.startSource,
      endSource: session.endSource,
      durationSeconds: session.durationSeconds,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }
}
