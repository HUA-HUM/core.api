import {
  ClaimNfcTagData,
  NfcTagClaim,
  VerifyNfcTagData,
} from '../../../entities/nfcTags/NfcTag';

export const NFC_TAGS_REPOSITORY = Symbol('NFC_TAGS_REPOSITORY');

export interface INfcTagsRepository {
  claim(data: ClaimNfcTagData): Promise<NfcTagClaim>;
  findClaimsByUserId(userId: string): Promise<NfcTagClaim[]>;
  findActiveClaim(data: VerifyNfcTagData): Promise<NfcTagClaim | null>;
  touchClaim(id: string): Promise<NfcTagClaim>;
}
