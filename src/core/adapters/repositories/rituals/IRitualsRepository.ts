import { CreateRitualData, Ritual } from '../../../entities/rituals/Ritual';

export const RITUALS_REPOSITORY = Symbol('RITUALS_REPOSITORY');

export interface IRitualsRepository {
  create(data: CreateRitualData): Promise<Ritual>;
  findById(id: string): Promise<Ritual | null>;
  findByUserId(userId: string): Promise<Ritual[]>;
  deleteById(id: string): Promise<void>;
}
