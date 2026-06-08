import { INfcTagsRepository } from '../../adapters/repositories/nfcTags/INfcTagsRepository';
import { ClaimNfcTagData, NfcTagClaim } from '../../entities/nfcTags/NfcTag';

export class ClaimNfcTagInteractor {
  constructor(private readonly nfcTagsRepository: INfcTagsRepository) {}

  async execute(data: ClaimNfcTagData): Promise<NfcTagClaim> {
    return this.nfcTagsRepository.claim(data);
  }
}
