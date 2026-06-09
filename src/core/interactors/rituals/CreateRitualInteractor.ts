import { CreateRitualData, Ritual } from '../../entities/rituals/Ritual';
import { IRitualsRepository } from '../../adapters/repositories/rituals/IRitualsRepository';
import { IRitualPasswordHasher } from '../../adapters/services/rituals/IRitualPasswordHasher';

export interface CreateRitualInteractorData extends Omit<
  CreateRitualData,
  'passwordHash'
> {
  password?: string | null;
}

export class CreateRitualInteractor {
  constructor(
    private readonly ritualsRepository: IRitualsRepository,
    private readonly passwordHasher: IRitualPasswordHasher,
  ) {}

  async execute(data: CreateRitualInteractorData): Promise<Ritual> {
    const passwordHash =
      data.isProtected && data.password
        ? await this.passwordHasher.hash(data.password)
        : null;

    const { password: _password, ...ritualData } = data;

    return this.ritualsRepository.create({
      ...ritualData,
      passwordHash,
    });
  }
}
