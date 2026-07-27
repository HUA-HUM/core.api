import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LEGAL_DOCUMENTS_REPOSITORY } from '../../../core/adapters/repositories/legal/ILegalDocumentsRepository';
import type { ILegalDocumentsRepository } from '../../../core/adapters/repositories/legal/ILegalDocumentsRepository';

@Injectable()
export class InitialLegalDocumentsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialLegalDocumentsService.name);

  constructor(
    @Inject(LEGAL_DOCUMENTS_REPOSITORY)
    private readonly repository: ILegalDocumentsRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.repository.ensureSchema();

    const content = await readFile(
      join(__dirname, '../../../legal/terms-1.0.txt'),
      'utf8',
    );

    await this.repository.publishIfMissing({
      type: 'terms',
      version: '1.0',
      title: 'Términos y Condiciones Generales Rituo',
      content,
      contentHash: createHash('sha256').update(content).digest('hex'),
      sourceUrl: 'https://rituo.io/legal/terminos-y-condiciones-1.0.pdf',
      effectiveAt: new Date('2026-07-27T00:00:00.000-03:00'),
    });

    this.logger.log('Legal documents schema and initial version are ready');
  }
}
