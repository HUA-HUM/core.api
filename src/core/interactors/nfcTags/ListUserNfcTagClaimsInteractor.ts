import { INfcTagsRepository } from '../../adapters/repositories/nfcTags/INfcTagsRepository';
import { NfcTagClaim } from '../../entities/nfcTags/NfcTag';

export class ListUserNfcTagClaimsInteractor {
  constructor(private readonly nfcTagsRepository: INfcTagsRepository) {}

  async execute(userId: string): Promise<NfcTagClaim[]> {
    return this.nfcTagsRepository.findClaimsByUserId(userId);
  }
}
