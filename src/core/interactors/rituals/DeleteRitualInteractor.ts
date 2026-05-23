import { IRitualsRepository } from '../../adapters/repositories/rituals/IRitualsRepository';

export class DeleteRitualInteractor {
  constructor(private readonly ritualsRepository: IRitualsRepository) {}

  async execute(id: string): Promise<void> {
    await this.ritualsRepository.deleteById(id);
  }
}
