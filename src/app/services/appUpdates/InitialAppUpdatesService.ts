import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { APP_UPDATES_REPOSITORY } from '../../../core/adapters/repositories/appUpdates/IAppUpdatesRepository';
import type { IAppUpdatesRepository } from '../../../core/adapters/repositories/appUpdates/IAppUpdatesRepository';

@Injectable()
export class InitialAppUpdatesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialAppUpdatesService.name);

  constructor(
    @Inject(APP_UPDATES_REPOSITORY)
    private readonly repository: IAppUpdatesRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.repository.ensureSchema();
    this.logger.log('App update configuration schema is ready');
  }
}
