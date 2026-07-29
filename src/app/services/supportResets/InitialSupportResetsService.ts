import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SupportResetsService } from './SupportResetsService';

@Injectable()
export class InitialSupportResetsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialSupportResetsService.name);

  constructor(private readonly service: SupportResetsService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.service.ensureSchema();
    this.logger.log('Support reset schema is ready');
  }
}
