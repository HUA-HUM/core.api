export type ModeStatus = 'active' | 'archived';

export interface Mode {
  id: string;
  userId: string;
  templateKey: string;
  title: string;
  icon: string;
  appCount: number;
  categoryCount: number;
  domainCount: number;
  selectionDigest: string | null;
  isProtected: boolean;
  nfcUnlockEnabled: boolean;
  passwordHash: string | null;
  status: ModeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateModeData {
  userId: string;
  templateKey: string;
  title: string;
  icon: string;
  appCount: number;
  categoryCount: number;
  domainCount: number;
  selectionDigest?: string | null;
  isProtected: boolean;
  nfcUnlockEnabled: boolean;
  passwordHash?: string | null;
}

export interface UpdateModeData {
  title: string;
  icon: string;
  appCount: number;
  categoryCount: number;
  domainCount: number;
  selectionDigest?: string | null;
  isProtected: boolean;
  nfcUnlockEnabled: boolean;
  passwordHash?: string | null;
}
