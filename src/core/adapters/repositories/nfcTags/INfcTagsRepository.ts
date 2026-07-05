import {
  ClaimNfcTagData,
  NfcTagClaim,
  VerifyNfcTagData,
} from '../../../entities/nfcTags/NfcTag';

export const NFC_TAGS_REPOSITORY = Symbol('NFC_TAGS_REPOSITORY');

export interface INfcTagsRepository {
  claim(data: ClaimNfcTagData): Promise<NfcTagClaim>;
  findClaimsByUserId(userId: string): Promise<NfcTagClaim[]>;
  findActiveClaimByTagHash(tagHash: string): Promise<NfcTagClaim | null>;
  findActiveClaim(data: VerifyNfcTagData): Promise<NfcTagClaim | null>;
  touchClaim(id: string): Promise<NfcTagClaim>;
  updateClaimLabel(
    id: string,
    userId: string,
    label: string,
  ): Promise<NfcTagClaim | null>;
  revokeClaim(id: string, userId: string): Promise<NfcTagClaim | null>;
}
