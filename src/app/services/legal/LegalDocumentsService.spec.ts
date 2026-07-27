import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { ILegalDocumentsRepository } from '../../../core/adapters/repositories/legal/ILegalDocumentsRepository';
import type {
  LegalDocument,
  LegalRequirements,
} from '../../../core/entities/legal/LegalDocument';
import { LegalDocumentsService } from './LegalDocumentsService';

describe('LegalDocumentsService', () => {
  const document: LegalDocument = {
    id: 'document-id',
    type: 'terms',
    version: '1.0',
    title: 'Terms',
    content: 'Exact legal content',
    contentHash: createHash('sha256')
      .update('Exact legal content')
      .digest('hex'),
    sourceUrl: null,
    effectiveAt: new Date('2026-07-27T03:00:00.000Z'),
    publishedAt: new Date('2026-07-27T03:00:00.000Z'),
    isActive: true,
    createdAt: new Date('2026-07-27T03:00:00.000Z'),
  };
  const requirements: LegalRequirements = {
    requiresAcceptance: false,
    documents: [{ ...document, acceptedAt: new Date() }],
  };
  let repository: jest.Mocked<ILegalDocumentsRepository>;
  let service: LegalDocumentsService;

  beforeEach(() => {
    repository = {
      ensureSchema: jest.fn(),
      publishIfMissing: jest.fn(),
      publish: jest.fn().mockResolvedValue(document),
      listActive: jest.fn(),
      listAll: jest.fn(),
      requirementsFor: jest.fn(),
      accept: jest.fn().mockResolvedValue(requirements),
    };
    service = new LegalDocumentsService(repository);
  });

  it('computes the immutable hash from the exact published content', async () => {
    await service.publish({
      type: 'terms',
      version: '1.0',
      title: 'Terms',
      content: 'Exact legal content',
      effectiveAt: '2026-07-27T00:00:00.000-03:00',
    });

    expect(repository.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Exact legal content',
        contentHash: createHash('sha256')
          .update('Exact legal content')
          .digest('hex'),
      }),
    );
  });

  it('records acceptance metadata for the authenticated user', async () => {
    await service.accept('user-id', {
      documentIds: ['document-id'],
      platform: 'ios',
      appVersion: '1.0 (21)',
      locale: 'es_AR',
    });

    expect(repository.accept).toHaveBeenCalledWith({
      userId: 'user-id',
      documentIds: ['document-id'],
      platform: 'ios',
      appVersion: '1.0 (21)',
      locale: 'es_AR',
    });
  });

  it('rejects empty document acceptance', async () => {
    expect(() =>
      service.accept('user-id', {
        documentIds: [],
        platform: 'ios',
      }),
    ).toThrow(BadRequestException);
  });
});
