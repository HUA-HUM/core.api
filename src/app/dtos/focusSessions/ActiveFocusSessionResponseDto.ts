import { ActiveFocusSession } from '../../../core/entities/focusSessions/ActiveFocusSession';
import { ModeSessionResponseDto } from '../modeSessions/ModeSessionResponseDto';
import { RitualSessionResponseDto } from '../ritualSessions/RitualSessionResponseDto';

export class ActiveFocusSessionResponseDto {
  type!: 'ritual' | 'mode';
  ritualSession!: RitualSessionResponseDto | null;
  modeSession!: ModeSessionResponseDto | null;

  static fromEntity(active: ActiveFocusSession): ActiveFocusSessionResponseDto {
    const base = {
      id: active.id,
      userId: active.userId,
      startedAt: active.startedAt,
      endedAt: active.endedAt,
      status: active.status,
      startSource: active.startSource,
      endSource: active.endSource,
      durationSeconds: active.durationSeconds,
      createdAt: active.createdAt,
      updatedAt: active.updatedAt,
    };

    return {
      type: active.type,
      ritualSession:
        active.type === 'ritual' && active.ritualId
          ? RitualSessionResponseDto.fromEntity({
              ...base,
              ritualId: active.ritualId,
              plannedEndAt: active.plannedEndAt,
              startSource: active.startSource as never,
              endSource: active.endSource as never,
            })
          : null,
      modeSession:
        active.type === 'mode' && active.modeId
          ? ModeSessionResponseDto.fromEntity({
              ...base,
              modeId: active.modeId,
              startSource: active.startSource as never,
              endSource: active.endSource as never,
            })
          : null,
    };
  }
}
