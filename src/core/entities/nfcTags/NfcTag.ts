export type NfcTagStatus = 'active' | 'revoked';

export interface NfcTagClaim {
  id: string;
  tagId: string;
  userId: string;
  label: string | null;
  status: NfcTagStatus;
  claimedAt: Date;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimNfcTagData {
  userId: string;
  tagHash: string;
  label?: string | null;
}

export interface VerifyNfcTagData {
  userId: string;
  tagHash: string;
}
