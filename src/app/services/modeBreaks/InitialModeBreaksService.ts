import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { MODE_BREAKS_REPOSITORY } from '../../../core/adapters/repositories/modeBreaks/IModeBreaksRepository';
import type { IModeBreaksRepository } from '../../../core/adapters/repositories/modeBreaks/IModeBreaksRepository';

@Injectable()
export class InitialModeBreaksService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialModeBreaksService.name);

  constructor(
    @Inject(MODE_BREAKS_REPOSITORY)
    private readonly repository: IModeBreaksRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.repository.ensureSchema();
    this.logger.log('Mode breaks schema is ready');
  }
}
