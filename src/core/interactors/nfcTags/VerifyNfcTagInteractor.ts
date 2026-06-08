import { INfcTagsRepository } from '../../adapters/repositories/nfcTags/INfcTagsRepository';
import { NfcTagClaim, VerifyNfcTagData } from '../../entities/nfcTags/NfcTag';

export class VerifyNfcTagInteractor {
  constructor(private readonly nfcTagsRepository: INfcTagsRepository) {}

  async execute(data: VerifyNfcTagData): Promise<NfcTagClaim | null> {
    const claim = await this.nfcTagsRepository.findActiveClaim(data);

    if (!claim) {
      return null;
    }

    return this.nfcTagsRepository.touchClaim(claim.id);
  }
}
