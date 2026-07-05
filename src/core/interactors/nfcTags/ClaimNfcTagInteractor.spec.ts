import { INfcTagsRepository } from '../../adapters/repositories/nfcTags/INfcTagsRepository';
import { NfcTagClaim } from '../../entities/nfcTags/NfcTag';
import { ClaimNfcTagInteractor } from './ClaimNfcTagInteractor';
import { NfcTagAlreadyClaimedError } from './NfcTagAlreadyClaimedError';

describe('ClaimNfcTagInteractor', () => {
  const nfcTagsRepository: jest.Mocked<INfcTagsRepository> = {
    claim: jest.fn(),
    findClaimsByUserId: jest.fn(),
    findActiveClaimByTagHash: jest.fn(),
    findActiveClaim: jest.fn(),
    touchClaim: jest.fn(),
    updateClaimLabel: jest.fn(),
    revokeClaim: jest.fn(),
  };
  const interactor = new ClaimNfcTagInteractor(nfcTagsRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('claims an available tag', async () => {
    const claim = createClaim('user-id');
    nfcTagsRepository.findActiveClaimByTagHash.mockResolvedValue(null);
    nfcTagsRepository.claim.mockResolvedValue(claim);

    await expect(
      interactor.execute({ userId: 'user-id', tagHash: 'tag-hash' }),
    ).resolves.toEqual(claim);
    expect(nfcTagsRepository.claim).toHaveBeenCalledTimes(1);
  });

  it('allows the owner to claim the same tag again', async () => {
    const claim = createClaim('user-id');
    nfcTagsRepository.findActiveClaimByTagHash.mockResolvedValue(claim);
    nfcTagsRepository.claim.mockResolvedValue(claim);

    await expect(
      interactor.execute({ userId: 'user-id', tagHash: 'tag-hash' }),
    ).resolves.toEqual(claim);
  });

  it('rejects a tag claimed by another user', async () => {
    nfcTagsRepository.findActiveClaimByTagHash.mockResolvedValue(
      createClaim('owner-id'),
    );

    await expect(
      interactor.execute({ userId: 'other-user-id', tagHash: 'tag-hash' }),
    ).rejects.toEqual(new NfcTagAlreadyClaimedError());
    expect(nfcTagsRepository.claim).not.toHaveBeenCalled();
  });
});

function createClaim(userId: string): NfcTagClaim {
  return {
    id: 'claim-id',
    tagId: 'tag-id',
    userId,
    label: 'Tag principal',
    status: 'active',
    claimedAt: new Date('2026-07-05T10:00:00.000Z'),
    lastSeenAt: null,
    createdAt: new Date('2026-07-05T10:00:00.000Z'),
    updatedAt: new Date('2026-07-05T10:00:00.000Z'),
  };
}
