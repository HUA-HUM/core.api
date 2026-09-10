import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { MODE_SESSIONS_REPOSITORY } from '../../../core/adapters/repositories/modeSessions/IModeSessionsRepository';
import type { IModeSessionsRepository } from '../../../core/adapters/repositories/modeSessions/IModeSessionsRepository';

@Injectable()
export class InitialModeSessionsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialModeSessionsService.name);

  constructor(
    @Inject(MODE_SESSIONS_REPOSITORY)
    private readonly repository: IModeSessionsRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.repository.ensureSchema();
    this.logger.log('Mode sessions schema is ready');
  }
}
