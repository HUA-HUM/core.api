import { INfcTagsRepository } from '../../adapters/repositories/nfcTags/INfcTagsRepository';
import { NfcTagClaim } from '../../entities/nfcTags/NfcTag';
import { NfcTagClaimNotFoundError } from './NfcTagClaimNotFoundError';

export class UpdateNfcTagClaimLabelInteractor {
  constructor(private readonly nfcTagsRepository: INfcTagsRepository) {}

  async execute(
    id: string,
    userId: string,
    label: string,
  ): Promise<NfcTagClaim> {
    const claim = await this.nfcTagsRepository.updateClaimLabel(
      id,
      userId,
      label,
    );

    if (!claim) {
      throw new NfcTagClaimNotFoundError();
    }

    return claim;
  }
}
