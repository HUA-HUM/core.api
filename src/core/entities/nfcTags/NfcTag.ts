export type NfcTagStatus = 'active' | 'revoked';
export type NfcTagClaimRole = 'owner' | 'member';

export interface NfcTagClaim {
  id: string;
  tagId: string;
  userId: string;
  label: string | null;
  status: NfcTagStatus;
  role: NfcTagClaimRole;
  relationship: NfcTagClaimRole;
  ownerUserId: string | null;
  ownerEmail: string | null;
  invitedEmail: string | null;
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

export interface InviteNfcTagMemberData {
  ownerUserId: string;
  claimId: string;
  email: string;
}
