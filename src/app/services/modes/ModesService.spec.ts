import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Mode } from '../../../core/entities/modes/Mode';
import { ModesService } from './ModesService';

const ensureDefaultModesInteractor = { execute: jest.fn() };
const listUserModesInteractor = { execute: jest.fn() };
const getModeInteractor = { execute: jest.fn() };
const updateModeInteractor = { execute: jest.fn() };
const listModeBlockedItemsInteractor = { execute: jest.fn() };
const replaceModeBlockedItemsInteractor = { execute: jest.fn() };
const getModeBreaksInteractor = { execute: jest.fn() };
const saveModeBreaksInteractor = { execute: jest.fn() };
const passwordHasher = { hash: jest.fn(), verify: jest.fn() };

const service = new ModesService(
  ensureDefaultModesInteractor as never,
  listUserModesInteractor as never,
  getModeInteractor as never,
  updateModeInteractor as never,
  listModeBlockedItemsInteractor as never,
  replaceModeBlockedItemsInteractor as never,
  getModeBreaksInteractor as never,
  saveModeBreaksInteractor as never,
  passwordHasher as never,
);

describe('ModesService breaks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getModeInteractor.execute.mockResolvedValue(createMode());
    saveModeBreaksInteractor.execute.mockImplementation((data) =>
      Promise.resolve(data),
    );
  });

  it('returns 0 breaks by default when nothing was saved yet', async () => {
    getModeBreaksInteractor.execute.mockResolvedValue(null);

    const settings = await service.getBreaks('user-id', 'mode-id');

    expect(settings).toEqual({
      modeId: 'mode-id',
      breakCount: 0,
      breakDurationMinutes: 5,
    });
  });

  it('returns 404 when getting breaks for a mode that is not the user\'s', async () => {
    getModeInteractor.execute.mockResolvedValue(
      createMode({ userId: 'someone-else' }),
    );

    await expect(
      service.getBreaks('user-id', 'mode-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('saves valid break settings', async () => {
    const settings = await service.saveBreaks('user-id', 'mode-id', {
      breakCount: 3,
      breakDurationMinutes: 1,
    });

    expect(saveModeBreaksInteractor.execute).toHaveBeenCalledWith({
      modeId: 'mode-id',
      breakCount: 3,
      breakDurationMinutes: 1,
    });
    expect(settings).toEqual({
      modeId: 'mode-id',
      breakCount: 3,
      breakDurationMinutes: 1,
    });
  });

  it('defaults breakDurationMinutes when breakCount is 0', async () => {
    await service.saveBreaks('user-id', 'mode-id', { breakCount: 0 });

    expect(saveModeBreaksInteractor.execute).toHaveBeenCalledWith({
      modeId: 'mode-id',
      breakCount: 0,
      breakDurationMinutes: 5,
    });
  });

  it('rejects a breakCount outside 0-3', async () => {
    await expect(
      service.saveBreaks('user-id', 'mode-id', { breakCount: -1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(saveModeBreaksInteractor.execute).not.toHaveBeenCalled();
  });

  it('rejects a missing breakDurationMinutes when breakCount > 0', async () => {
    await expect(
      service.saveBreaks('user-id', 'mode-id', { breakCount: 2 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a breakDurationMinutes outside 1-5', async () => {
    await expect(
      service.saveBreaks('user-id', 'mode-id', {
        breakCount: 1,
        breakDurationMinutes: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createMode(overrides: Partial<Mode> = {}): Mode {
  return {
    id: 'mode-id',
    userId: 'user-id',
    templateKey: 'work',
    title: 'Trabajar',
    icon: 'laptopcomputer',
    appCount: 0,
    categoryCount: 0,
    domainCount: 0,
    selectionDigest: null,
    isProtected: false,
    nfcUnlockEnabled: false,
    passwordHash: null,
    status: 'active',
    createdAt: new Date('2026-06-09T10:00:00.000Z'),
    updatedAt: new Date('2026-06-09T10:00:00.000Z'),
    ...overrides,
  };
}
