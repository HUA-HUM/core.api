import { NfcTagClaim, NfcTagStatus } from '../../../core/entities/nfcTags/NfcTag';

export class NfcTagClaimResponseDto {
  id!: string;
  tagId!: string;
  userId!: string;
  label!: string | null;
  status!: NfcTagStatus;
  claimedAt!: string;
  lastSeenAt!: string | null;
  createdAt!: string;
  updatedAt!: string;

  static fromEntity(claim: NfcTagClaim): NfcTagClaimResponseDto {
    return {
      id: claim.id,
      tagId: claim.tagId,
      userId: claim.userId,
      label: claim.label,
      status: claim.status,
      claimedAt: claim.claimedAt.toISOString(),
      lastSeenAt: claim.lastSeenAt?.toISOString() ?? null,
      createdAt: claim.createdAt.toISOString(),
      updatedAt: claim.updatedAt.toISOString(),
    };
  }
}
