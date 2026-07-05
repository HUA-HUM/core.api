import { ConflictException } from '@nestjs/common';
import { NfcTagAlreadyClaimedError } from '../../../core/interactors/nfcTags/NfcTagAlreadyClaimedError';
import { NfcTagsService } from './NfcTagsService';

describe('NfcTagsService', () => {
  const claimNfcTagInteractor = { execute: jest.fn() };
  const listUserNfcTagClaimsInteractor = { execute: jest.fn() };
  const verifyNfcTagInteractor = { execute: jest.fn() };
  const revokeNfcTagClaimInteractor = { execute: jest.fn() };
  const updateNfcTagClaimLabelInteractor = { execute: jest.fn() };
  const getActiveModeSessionInteractor = { execute: jest.fn() };
  const getActiveRitualSessionInteractor = { execute: jest.fn() };

  const service = new NfcTagsService(
    claimNfcTagInteractor as never,
    listUserNfcTagClaimsInteractor as never,
    verifyNfcTagInteractor as never,
    revokeNfcTagClaimInteractor as never,
    updateNfcTagClaimLabelInteractor as never,
    getActiveModeSessionInteractor as never,
    getActiveRitualSessionInteractor as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
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
});
