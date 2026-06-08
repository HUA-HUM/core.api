import { NfcTagClaim, NfcTagStatus } from '../../../core/entities/nfcTags/NfcTag';
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
      claimedAt: requiredDateISOString(claim.claimedAt, 'claimedAt'),
      lastSeenAt: nullableDateISOString(claim.lastSeenAt),
      createdAt: requiredDateISOString(claim.createdAt, 'createdAt'),
      updatedAt: requiredDateISOString(claim.updatedAt, 'updatedAt'),
    };
  }
}
