import { INfcTagsRepository } from '../../adapters/repositories/nfcTags/INfcTagsRepository';
import { NfcTagClaim } from '../../entities/nfcTags/NfcTag';
import { NfcTagClaimNotFoundError } from './NfcTagClaimNotFoundError';

export class RevokeNfcTagClaimInteractor {
  constructor(private readonly nfcTagsRepository: INfcTagsRepository) {}

  async execute(id: string, userId: string): Promise<NfcTagClaim> {
    const claim = await this.nfcTagsRepository.revokeClaim(id, userId);

    if (!claim) {
      throw new NfcTagClaimNotFoundError();
    }

    return claim;
  }
}
