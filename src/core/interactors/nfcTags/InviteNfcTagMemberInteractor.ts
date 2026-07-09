import { INfcTagsRepository } from '../../adapters/repositories/nfcTags/INfcTagsRepository';
import { InviteNfcTagMemberData, NfcTagClaim } from '../../entities/nfcTags/NfcTag';

export class InviteNfcTagMemberInteractor {
  constructor(private readonly nfcTagsRepository: INfcTagsRepository) {}

  async execute(data: InviteNfcTagMemberData): Promise<NfcTagClaim | null> {
    return this.nfcTagsRepository.inviteMember(data);
  }
}
