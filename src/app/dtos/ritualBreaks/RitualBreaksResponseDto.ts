import { RitualBreakSettings } from '../../../core/entities/ritualBreaks/RitualBreakSettings';

export class RitualBreaksResponseDto {
  ritualId!: string;
  breakCount!: number;
  breakDurationMinutes!: number;

  static fromEntity(settings: RitualBreakSettings): RitualBreaksResponseDto {
    return {
      ritualId: settings.ritualId,
      breakCount: settings.breakCount,
      breakDurationMinutes: settings.breakDurationMinutes,
    };
  }
}
