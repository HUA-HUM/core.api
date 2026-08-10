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

    const [termsContent, privacyContent] = await Promise.all([
      readFile(join(__dirname, '../../../legal/terms-1.1.txt'), 'utf8'),
      readFile(join(__dirname, '../../../legal/privacy-1.1.txt'), 'utf8'),
    ]);

    await this.repository.publishIfMissing({
      type: 'terms',
      version: '1.1',
      title: 'Términos y Condiciones Generales Rituo',
      content: termsContent,
      contentHash: createHash('sha256').update(termsContent).digest('hex'),
      sourceUrl: null,
      effectiveAt: new Date('2026-08-08T00:00:00.000-03:00'),
    });

    await this.repository.publishIfMissing({
      type: 'privacy',
      version: '1.1',
      title: 'Política de Privacidad Rituo',
      content: privacyContent,
      contentHash: createHash('sha256').update(privacyContent).digest('hex'),
      sourceUrl: null,
      effectiveAt: new Date('2026-08-08T00:00:00.000-03:00'),
    });

    this.logger.log('Legal documents schema and current versions are ready');
  }
}
