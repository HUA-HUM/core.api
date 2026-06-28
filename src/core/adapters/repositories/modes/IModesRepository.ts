import {
  CreateModeData,
  Mode,
  UpdateModeData,
} from '../../../entities/modes/Mode';

export const MODES_REPOSITORY = Symbol('MODES_REPOSITORY');

export interface IModesRepository {
  create(data: CreateModeData): Promise<Mode>;
  ensureDefaultsForUser(userId: string, modes: CreateModeData[]): Promise<void>;
  findById(id: string): Promise<Mode | null>;
  findByUserId(userId: string): Promise<Mode[]>;
  updateById(id: string, data: UpdateModeData): Promise<Mode | null>;
}
