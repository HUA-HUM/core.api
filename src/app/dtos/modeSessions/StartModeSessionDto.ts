import { ModeSessionStartSource } from '../../../core/entities/modeSessions/ModeSession';

export class StartModeSessionDto {
  modeId!: string;
  startSource!: ModeSessionStartSource;
}
