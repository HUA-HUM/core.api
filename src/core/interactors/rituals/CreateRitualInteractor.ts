import { CreateRitualData, Ritual } from '../../entities/rituals/Ritual';
import { IRitualsRepository } from '../../adapters/repositories/rituals/IRitualsRepository';

export class CreateRitualInteractor {
  constructor(private readonly ritualsRepository: IRitualsRepository) {}

  async execute(data: CreateRitualData): Promise<Ritual> {
    return this.ritualsRepository.create(data);
  }
}
