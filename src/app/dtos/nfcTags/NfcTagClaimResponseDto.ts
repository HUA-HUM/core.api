import {
  NfcTagClaim,
  NfcTagClaimRole,
  NfcTagStatus,
} from '../../../core/entities/nfcTags/NfcTag';
import {
  nullableDateISOString,
  requiredDateISOString,
} from '../common/dateResponse';

export class NfcTagClaimResponseDto {
  id!: string;
  tagId!: string;
  userId!: string;
  label!: string | null;
  status!: NfcTagStatus;
  role!: NfcTagClaimRole;
  relationship!: NfcTagClaimRole;
  ownerUserId!: string | null;
  ownerEmail!: string | null;
  invitedEmail!: string | null;
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
      role: claim.role,
      relationship: claim.relationship,
      ownerUserId: claim.ownerUserId,
      ownerEmail: claim.ownerEmail,
      invitedEmail: claim.invitedEmail,
      claimedAt: requiredDateISOString(
        claim.claimedAt,
        'claimedAt',
        claim.createdAt,
      ),
      lastSeenAt: nullableDateISOString(claim.lastSeenAt),
      createdAt: requiredDateISOString(claim.createdAt, 'createdAt'),
      updatedAt: requiredDateISOString(claim.updatedAt, 'updatedAt'),
    };
  }
}
