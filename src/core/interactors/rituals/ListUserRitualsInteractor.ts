import { Ritual } from '../../entities/rituals/Ritual';
import { IRitualsRepository } from '../../adapters/repositories/rituals/IRitualsRepository';

export class ListUserRitualsInteractor {
  constructor(private readonly ritualsRepository: IRitualsRepository) {}

  async execute(userId: string): Promise<Ritual[]> {
    return this.ritualsRepository.findByUserId(userId);
  }
}
