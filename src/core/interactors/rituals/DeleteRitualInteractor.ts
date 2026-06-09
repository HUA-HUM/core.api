import { IRitualsRepository } from '../../adapters/repositories/rituals/IRitualsRepository';
import { IRitualPasswordHasher } from '../../adapters/services/rituals/IRitualPasswordHasher';
import { Ritual } from '../../entities/rituals/Ritual';
import { RitualProtectionError } from './RitualProtectionError';

export class DeleteRitualInteractor {
  constructor(
    private readonly ritualsRepository: IRitualsRepository,
    private readonly passwordHasher: IRitualPasswordHasher,
  ) {}

  async execute(ritual: Ritual, password?: string | null): Promise<void> {
    if (ritual.isProtected) {
      if (!password || !ritual.passwordHash) {
        throw new RitualProtectionError('RITUAL_PASSWORD_REQUIRED');
      }

      const isValid = await this.passwordHasher.verify(
        password,
        ritual.passwordHash,
      );

      if (!isValid) {
        throw new RitualProtectionError('INVALID_RITUAL_PASSWORD');
      }
    }

    await this.ritualsRepository.deleteById(ritual.id);
  }
}
