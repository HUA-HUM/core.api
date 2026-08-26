import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { RITUAL_BREAKS_REPOSITORY } from '../../../core/adapters/repositories/ritualBreaks/IRitualBreaksRepository';
import type { IRitualBreaksRepository } from '../../../core/adapters/repositories/ritualBreaks/IRitualBreaksRepository';

@Injectable()
export class InitialRitualBreaksService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialRitualBreaksService.name);

  constructor(
    @Inject(RITUAL_BREAKS_REPOSITORY)
    private readonly repository: IRitualBreaksRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.repository.ensureSchema();
    this.logger.log('Ritual breaks schema is ready');
  }
}
