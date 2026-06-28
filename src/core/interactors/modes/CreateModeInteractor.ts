import { CreateModeData, Mode } from '../../entities/modes/Mode';
import { IModesRepository } from '../../adapters/repositories/modes/IModesRepository';
import { IRitualPasswordHasher } from '../../adapters/services/rituals/IRitualPasswordHasher';

export interface CreateModeInteractorData extends Omit<
  CreateModeData,
  'passwordHash'
> {
  password?: string | null;
}

export class CreateModeInteractor {
  constructor(
    private readonly modesRepository: IModesRepository,
    private readonly passwordHasher: IRitualPasswordHasher,
  ) {}

  async execute(data: CreateModeInteractorData): Promise<Mode> {
    const passwordHash =
      data.isProtected && data.password
        ? await this.passwordHasher.hash(data.password)
        : null;

    const { password: _password, ...modeData } = data;

    return this.modesRepository.create({
      ...modeData,
      passwordHash,
    });
  }
}
