import {
  ModeSession,
  ModeSessionEndSource,
  ModeSessionStartSource,
  ModeSessionStatus,
} from '../../../core/entities/modeSessions/ModeSession';

export class ModeSessionResponseDto {
  id!: string;
  userId!: string;
  modeId!: string;
  startedAt!: string;
  endedAt!: string | null;
  status!: ModeSessionStatus;
  startSource!: ModeSessionStartSource;
  endSource!: ModeSessionEndSource | null;
  durationSeconds!: number | null;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(session: ModeSession): ModeSessionResponseDto {
    return {
      id: session.id,
      userId: session.userId,
      modeId: session.modeId,
      startedAt: session.startedAt.toISOString(),
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
