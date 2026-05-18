import { Ritual } from '../../entities/rituals/Ritual';
import { IRitualsRepository } from '../../adapters/repositories/rituals/IRitualsRepository';

export class GetRitualInteractor {
  constructor(private readonly ritualsRepository: IRitualsRepository) {}

  async execute(id: string): Promise<Ritual | null> {
    return this.ritualsRepository.findById(id);
  }
}
