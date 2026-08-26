import {
  ModeBreakSettings,
  SaveModeBreakSettingsData,
} from '../../../entities/modeBreaks/ModeBreakSettings';

export const MODE_BREAKS_REPOSITORY = Symbol('MODE_BREAKS_REPOSITORY');

export interface IModeBreaksRepository {
  ensureSchema(): Promise<void>;
  findByModeId(modeId: string): Promise<ModeBreakSettings | null>;
  save(data: SaveModeBreakSettingsData): Promise<ModeBreakSettings>;
}
