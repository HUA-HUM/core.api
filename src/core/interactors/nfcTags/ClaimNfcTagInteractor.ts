import { INfcTagsRepository } from '../../adapters/repositories/nfcTags/INfcTagsRepository';
import { ClaimNfcTagData, NfcTagClaim } from '../../entities/nfcTags/NfcTag';
import { NfcTagAlreadyClaimedError } from './NfcTagAlreadyClaimedError';

export class ClaimNfcTagInteractor {
  constructor(private readonly nfcTagsRepository: INfcTagsRepository) {}

  async execute(data: ClaimNfcTagData): Promise<NfcTagClaim> {
    const activeClaim = await this.nfcTagsRepository.findActiveClaimByTagHash(
      data.tagHash,
    );

    if (activeClaim && activeClaim.userId !== data.userId) {
      throw new NfcTagAlreadyClaimedError();
    }

    return this.nfcTagsRepository.claim(data);
  }
}
