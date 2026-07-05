import { INfcTagsRepository } from '../../adapters/repositories/nfcTags/INfcTagsRepository';
import { NfcTagClaim } from '../../entities/nfcTags/NfcTag';
import { NfcTagClaimNotFoundError } from './NfcTagClaimNotFoundError';
import { RevokeNfcTagClaimInteractor } from './RevokeNfcTagClaimInteractor';

describe('RevokeNfcTagClaimInteractor', () => {
  const nfcTagsRepository: jest.Mocked<INfcTagsRepository> = {
    claim: jest.fn(),
    findClaimsByUserId: jest.fn(),
    findActiveClaimByTagHash: jest.fn(),
    findActiveClaim: jest.fn(),
    touchClaim: jest.fn(),
    updateClaimLabel: jest.fn(),
    revokeClaim: jest.fn(),
  };
  const interactor = new RevokeNfcTagClaimInteractor(nfcTagsRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('revokes a claim owned by the user', async () => {
    const revokedClaim = createClaim();
    nfcTagsRepository.revokeClaim.mockResolvedValue(revokedClaim);

    await expect(interactor.execute('claim-id', 'user-id')).resolves.toEqual(
      revokedClaim,
    );
    expect(nfcTagsRepository.revokeClaim).toHaveBeenCalledWith(
      'claim-id',
      'user-id',
    );
  });

  it('does not expose claims owned by another user', async () => {
    nfcTagsRepository.revokeClaim.mockResolvedValue(null);

    await expect(
      interactor.execute('claim-id', 'other-user-id'),
    ).rejects.toEqual(new NfcTagClaimNotFoundError());
  });
});

function createClaim(): NfcTagClaim {
  return {
    id: 'claim-id',
    tagId: 'tag-id',
    userId: 'user-id',
    label: 'Tag principal',
    status: 'revoked',
    claimedAt: new Date('2026-06-09T10:00:00.000Z'),
    lastSeenAt: new Date('2026-06-09T11:00:00.000Z'),
    createdAt: new Date('2026-06-09T10:00:00.000Z'),
    updatedAt: new Date('2026-06-09T12:00:00.000Z'),
  };
}
