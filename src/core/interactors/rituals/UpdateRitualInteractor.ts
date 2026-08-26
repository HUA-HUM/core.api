import { Ritual, UpdateRitualData } from '../../entities/rituals/Ritual';
import { IRitualsRepository } from '../../adapters/repositories/rituals/IRitualsRepository';
import { IRitualPasswordHasher } from '../../adapters/services/rituals/IRitualPasswordHasher';
import { RitualProtectionError } from './RitualProtectionError';

export interface UpdateRitualInteractorData
  extends Omit<UpdateRitualData, 'passwordHash'> {
  password?: string | null;
}

export class UpdateRitualInteractor {
  constructor(
    private readonly ritualsRepository: IRitualsRepository,
    private readonly passwordHasher: IRitualPasswordHasher,
  ) {}

  async execute(
    ritual: Ritual,
    data: UpdateRitualInteractorData,
  ): Promise<Ritual | null> {
    const wasProtected = ritual.isProtected && Boolean(ritual.passwordHash);
    const isProtected = data.isProtected;

    let passwordHash: string | null = null;

    if (isProtected || wasProtected) {
      const password = data.password?.trim();

      if (!password) {
        throw new RitualProtectionError('RITUAL_PASSWORD_REQUIRED');
      }

      if (wasProtected) {
        const isValid = await this.passwordHasher.verify(
          password,
          ritual.passwordHash as string,
        );

        if (!isValid) {
          throw new RitualProtectionError('INVALID_RITUAL_PASSWORD');
        }
      }

      passwordHash = isProtected
        ? await this.passwordHasher.hash(password)
        : null;
    }

    const { password: _password, ...ritualData } = data;

    return this.ritualsRepository.updateById(ritual.id, {
      ...ritualData,
      passwordHash,
    });
  }
}
