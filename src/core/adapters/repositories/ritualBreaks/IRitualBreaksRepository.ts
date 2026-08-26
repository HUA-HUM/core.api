import {
  RitualBreakSettings,
  SaveRitualBreakSettingsData,
} from '../../../entities/ritualBreaks/RitualBreakSettings';

export const RITUAL_BREAKS_REPOSITORY = Symbol('RITUAL_BREAKS_REPOSITORY');

export interface IRitualBreaksRepository {
  ensureSchema(): Promise<void>;
  findByRitualId(ritualId: string): Promise<RitualBreakSettings | null>;
  save(data: SaveRitualBreakSettingsData): Promise<RitualBreakSettings>;
}
