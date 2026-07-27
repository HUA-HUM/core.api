export type LegalDocumentType = 'terms' | 'privacy';

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string;
  contentHash: string;
  sourceUrl: string | null;
  effectiveAt: Date;
  publishedAt: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface PublishLegalDocumentData {
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string;
  contentHash: string;
  sourceUrl: string | null;
  effectiveAt: Date;
}

export interface LegalDocumentRequirement extends LegalDocument {
  acceptedAt: Date | null;
}

export interface LegalRequirements {
  requiresAcceptance: boolean;
  documents: LegalDocumentRequirement[];
}

export interface AcceptLegalDocumentsData {
  userId: string;
  documentIds: string[];
  platform: string;
  appVersion: string | null;
  locale: string | null;
}
