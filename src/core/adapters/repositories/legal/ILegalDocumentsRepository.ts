import {
  AcceptLegalDocumentsData,
  LegalDocument,
  LegalRequirements,
  PublishLegalDocumentData,
} from '../../../entities/legal/LegalDocument';

export const LEGAL_DOCUMENTS_REPOSITORY = Symbol('LEGAL_DOCUMENTS_REPOSITORY');

export interface ILegalDocumentsRepository {
  ensureSchema(): Promise<void>;
  publishIfMissing(data: PublishLegalDocumentData): Promise<void>;
  publish(data: PublishLegalDocumentData): Promise<LegalDocument>;
  listActive(): Promise<LegalDocument[]>;
  listAll(): Promise<LegalDocument[]>;
  requirementsFor(userId: string): Promise<LegalRequirements>;
  accept(data: AcceptLegalDocumentsData): Promise<LegalRequirements>;
}
