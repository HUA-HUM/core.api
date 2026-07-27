import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { LEGAL_DOCUMENTS_REPOSITORY } from '../../../core/adapters/repositories/legal/ILegalDocumentsRepository';
import type { ILegalDocumentsRepository } from '../../../core/adapters/repositories/legal/ILegalDocumentsRepository';
import {
  LegalDocument,
  LegalRequirements,
} from '../../../core/entities/legal/LegalDocument';
import { AcceptLegalDocumentsDto } from '../../dtos/legal/AcceptLegalDocumentsDto';
import { PublishLegalDocumentDto } from '../../dtos/legal/PublishLegalDocumentDto';

@Injectable()
export class LegalDocumentsService {
  constructor(
    @Inject(LEGAL_DOCUMENTS_REPOSITORY)
    private readonly repository: ILegalDocumentsRepository,
  ) {}

  active(): Promise<LegalDocument[]> {
    return this.repository.listActive();
  }

  requirements(userId: string): Promise<LegalRequirements> {
    return this.repository.requirementsFor(userId);
  }

  accept(
    userId: string,
    body: AcceptLegalDocumentsDto,
  ): Promise<LegalRequirements> {
    if (
      !Array.isArray(body.documentIds) ||
      body.documentIds.length === 0 ||
      body.documentIds.some(
        (documentId) =>
          typeof documentId !== 'string' || documentId.trim().length === 0,
      )
    ) {
      throw new BadRequestException('documentIds is required');
    }

    const platform = body.platform?.trim();
    if (!platform || platform.length > 40) {
      throw new BadRequestException('platform is required');
    }

    return this.repository.accept({
      userId,
      documentIds: [...new Set(body.documentIds)],
      platform,
      appVersion: this.optionalText(body.appVersion, 80),
      locale: this.optionalText(body.locale, 40),
    });
  }

  adminList(): Promise<LegalDocument[]> {
    return this.repository.listAll();
  }

  publish(body: PublishLegalDocumentDto): Promise<LegalDocument> {
    if (body.type !== 'terms' && body.type !== 'privacy') {
      throw new BadRequestException('type must be terms or privacy');
    }

    const version = body.version?.trim();
    const title = body.title?.trim();
    if (!version || version.length > 40) {
      throw new BadRequestException('version is required');
    }
    if (!title || title.length > 180) {
      throw new BadRequestException('title is required');
    }
    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
      throw new BadRequestException('content is required');
    }

    const effectiveAt = new Date(body.effectiveAt);
    if (Number.isNaN(effectiveAt.getTime())) {
      throw new BadRequestException('effectiveAt must be a valid ISO date');
    }

    const sourceUrl = this.optionalText(body.sourceUrl, 2_000);
    if (sourceUrl) {
      try {
        new URL(sourceUrl);
      } catch {
        throw new BadRequestException('sourceUrl must be a valid URL');
      }
    }

    return this.repository.publish({
      type: body.type,
      version,
      title,
      content: body.content,
      contentHash: createHash('sha256').update(body.content).digest('hex'),
      sourceUrl,
      effectiveAt,
    });
  }

  private optionalText(
    value: string | undefined,
    maxLength: number,
  ): string | null {
    const normalized = value?.trim();
    if (!normalized) {
      return null;
    }
    if (normalized.length > maxLength) {
      throw new BadRequestException(`value exceeds ${maxLength} characters`);
    }
    return normalized;
  }
}
