import {
  CreateRitualData,
  Ritual,
  UpdateRitualData,
} from '../../../entities/rituals/Ritual';

export const RITUALS_REPOSITORY = Symbol('RITUALS_REPOSITORY');

export interface IRitualsRepository {
  create(data: CreateRitualData): Promise<Ritual>;
  findById(id: string): Promise<Ritual | null>;
  findByUserId(userId: string): Promise<Ritual[]>;
  updateById(id: string, data: UpdateRitualData): Promise<Ritual | null>;
  deleteById(id: string): Promise<void>;
}
