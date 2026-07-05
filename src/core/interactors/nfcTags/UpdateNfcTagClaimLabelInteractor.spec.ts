import { INfcTagsRepository } from '../../adapters/repositories/nfcTags/INfcTagsRepository';
import { NfcTagClaim } from '../../entities/nfcTags/NfcTag';
import { NfcTagClaimNotFoundError } from './NfcTagClaimNotFoundError';
import { UpdateNfcTagClaimLabelInteractor } from './UpdateNfcTagClaimLabelInteractor';

describe('UpdateNfcTagClaimLabelInteractor', () => {
  const nfcTagsRepository: jest.Mocked<INfcTagsRepository> = {
    claim: jest.fn(),
    findClaimsByUserId: jest.fn(),
    findActiveClaimByTagHash: jest.fn(),
    findActiveClaim: jest.fn(),
    touchClaim: jest.fn(),
    updateClaimLabel: jest.fn(),
    revokeClaim: jest.fn(),
  };
  const interactor = new UpdateNfcTagClaimLabelInteractor(nfcTagsRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the label of a claim owned by the user', async () => {
    const updatedClaim = createClaim();
    nfcTagsRepository.updateClaimLabel.mockResolvedValue(updatedClaim);

    await expect(
      interactor.execute('claim-id', 'user-id', 'Llave de casa'),
    ).resolves.toEqual(updatedClaim);
    expect(nfcTagsRepository.updateClaimLabel).toHaveBeenCalledWith(
      'claim-id',
      'user-id',
      'Llave de casa',
    );
  });

  it('does not expose claims owned by another user', async () => {
    nfcTagsRepository.updateClaimLabel.mockResolvedValue(null);

    await expect(
      interactor.execute('claim-id', 'other-user-id', 'Dormitorio'),
    ).rejects.toEqual(new NfcTagClaimNotFoundError());
  });
});

function createClaim(): NfcTagClaim {
  return {
    id: 'claim-id',
    tagId: 'tag-id',
    userId: 'user-id',
    label: 'Llave de casa',
    status: 'active',
    claimedAt: new Date('2026-06-09T10:00:00.000Z'),
    lastSeenAt: null,
    createdAt: new Date('2026-06-09T10:00:00.000Z'),
    updatedAt: new Date('2026-06-10T10:00:00.000Z'),
  };
}
