import { ModeBreakSettings } from '../../../core/entities/modeBreaks/ModeBreakSettings';

export class ModeBreaksResponseDto {
  modeId!: string;
  breakCount!: number;
  breakDurationMinutes!: number;

  static fromEntity(settings: ModeBreakSettings): ModeBreaksResponseDto {
    return {
      modeId: settings.modeId,
      breakCount: settings.breakCount,
      breakDurationMinutes: settings.breakDurationMinutes,
    };
  }
}
