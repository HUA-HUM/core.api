import { ConflictException, ForbiddenException } from '@nestjs/common';
import { NfcTagAlreadyClaimedError } from '../../../core/interactors/nfcTags/NfcTagAlreadyClaimedError';
import { NfcTagLostError } from '../../../core/interactors/nfcTags/NfcTagLostError';
import { NfcTagsService } from './NfcTagsService';

describe('NfcTagsService', () => {
  const claimNfcTagInteractor = { execute: jest.fn() };
  const listUserNfcTagClaimsInteractor = { execute: jest.fn() };
  const verifyNfcTagInteractor = { execute: jest.fn() };
  const revokeNfcTagClaimInteractor = { execute: jest.fn() };
  const updateNfcTagClaimLabelInteractor = { execute: jest.fn() };
  const getActiveModeSessionInteractor = { execute: jest.fn() };
  const getActiveRitualSessionInteractor = { execute: jest.fn() };
  const entityManager = { query: jest.fn() };

  const service = new NfcTagsService(
    claimNfcTagInteractor as never,
    listUserNfcTagClaimsInteractor as never,
    verifyNfcTagInteractor as never,
    revokeNfcTagClaimInteractor as never,
    updateNfcTagClaimLabelInteractor as never,
    getActiveModeSessionInteractor as never,
    getActiveRitualSessionInteractor as never,
    entityManager as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    listUserNfcTagClaimsInteractor.execute.mockResolvedValue([]);
    entityManager.query.mockReset();
  });

  it('returns a conflict when the tag belongs to another user', async () => {
    claimNfcTagInteractor.execute.mockRejectedValue(
      new NfcTagAlreadyClaimedError(),
    );

    let thrown: unknown;
    try {
      await service.claim({
        userId: 'other-user-id',
        tagIdentifier: '04AABBCCDDEE',
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ConflictException);
    expect((thrown as ConflictException).getResponse()).toEqual({
      code: 'NFC_TAG_ALREADY_CLAIMED',
      message: 'nfc tag already belongs to another user',
    });
  });

  it('returns a conflict when the tag was marked as lost', async () => {
    claimNfcTagInteractor.execute.mockRejectedValue(new NfcTagLostError());

    let thrown: unknown;
    try {
      await service.claim({
        userId: 'user-id',
        tagIdentifier: '04AABBCCDDEE',
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ConflictException);
    expect((thrown as ConflictException).getResponse()).toEqual({
      code: 'NFC_TAG_LOST',
      message: 'nfc tag was marked as lost and cannot be claimed',
    });
  });

  it('prepares a virtual tag for the configured App Review account', async () => {
    entityManager.query.mockResolvedValue([{ email: 'hello@rituo.io' }]);
    claimNfcTagInteractor.execute.mockResolvedValue({
      id: 'claim-id',
      tagId: 'tag-id',
      userId: 'review-user-id',
      label: 'Cuenta de demostración',
      status: 'active',
      claimedAt: new Date(),
      lastSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.prepareReviewDemo('review-user-id');

    expect(result.tagIdentifier).toMatch(/^RITUO-REVIEW-[A-F0-9]{64}$/);
    expect(result.claim.label).toBe('Cuenta de demostración');
    expect(claimNfcTagInteractor.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'review-user-id',
        label: 'Cuenta de demostración',
      }),
    );
  });

  it('rejects the virtual tag for a regular account', async () => {
    entityManager.query.mockResolvedValue([{ email: 'user@example.com' }]);

    await expect(
      service.prepareReviewDemo('regular-user-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(claimNfcTagInteractor.execute).not.toHaveBeenCalled();
  });
});
