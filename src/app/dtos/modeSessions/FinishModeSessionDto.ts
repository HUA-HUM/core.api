import {
  ModeSessionEndSource,
  ModeSessionStatus,
} from '../../../core/entities/modeSessions/ModeSession';

export class FinishModeSessionDto {
  status?: Exclude<ModeSessionStatus, 'active'>;
  endSource!: ModeSessionEndSource;
}
