import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Ritual } from '../../../core/entities/rituals/Ritual';
import { RitualSession } from '../../../core/entities/ritualSessions/RitualSession';
import { RitualsService } from './RitualsService';

const createRitualInteractor = { execute: jest.fn() };
const updateRitualInteractor = { execute: jest.fn() };
const listUserRitualsInteractor = { execute: jest.fn() };
const getRitualInteractor = { execute: jest.fn() };
const deleteRitualInteractor = { execute: jest.fn() };
const getActiveRitualSessionInteractor = { execute: jest.fn() };
const listRitualBlockedItemsInteractor = { execute: jest.fn() };
const replaceRitualBlockedItemsInteractor = { execute: jest.fn() };
const getRitualBreaksInteractor = { execute: jest.fn() };
const saveRitualBreaksInteractor = { execute: jest.fn() };

const service = new RitualsService(
  createRitualInteractor as never,
  updateRitualInteractor as never,
  listUserRitualsInteractor as never,
  getRitualInteractor as never,
  deleteRitualInteractor as never,
  getActiveRitualSessionInteractor as never,
  listRitualBlockedItemsInteractor as never,
  replaceRitualBlockedItemsInteractor as never,
  getRitualBreaksInteractor as never,
  saveRitualBreaksInteractor as never,
);

describe('RitualsService.update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRitualInteractor.execute.mockResolvedValue(createRitual());
    getActiveRitualSessionInteractor.execute.mockResolvedValue(null);
    updateRitualInteractor.execute.mockResolvedValue(createRitual());
  });

  it('updates a ritual owned by the requesting user', async () => {
    await service.update('user-id', 'ritual-id', updateRequest());

    expect(updateRitualInteractor.execute).toHaveBeenCalledWith(
      createRitual(),
      expect.objectContaining({ title: 'Lectura nocturna' }),
    );
  });

  it('returns 404 when the ritual does not belong to the requesting user', async () => {
    getRitualInteractor.execute.mockResolvedValue(
      createRitual({ userId: 'someone-else' }),
    );

    await expect(
      service.update('user-id', 'ritual-id', updateRequest()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(updateRitualInteractor.execute).not.toHaveBeenCalled();
  });

  it('returns 404 when the ritual does not exist', async () => {
    getRitualInteractor.execute.mockResolvedValue(null);

    await expect(
      service.update('user-id', 'ritual-id', updateRequest()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects the edit with a conflict when this ritual has an active session', async () => {
    getActiveRitualSessionInteractor.execute.mockResolvedValue(
      createActiveSession({ ritualId: 'ritual-id' }),
    );

    await expect(
      service.update('user-id', 'ritual-id', updateRequest()),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updateRitualInteractor.execute).not.toHaveBeenCalled();
  });

  it('allows the edit when the active session belongs to a different ritual', async () => {
    getActiveRitualSessionInteractor.execute.mockResolvedValue(
      createActiveSession({ ritualId: 'another-ritual-id' }),
    );

    await service.update('user-id', 'ritual-id', updateRequest());

    expect(updateRitualInteractor.execute).toHaveBeenCalled();
  });

  it('rejects an empty title', async () => {
    await expect(
      service.update('user-id', 'ritual-id', updateRequest({ title: '  ' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects weekdays outside 1-7', async () => {
    await expect(
      service.update(
        'user-id',
        'ritual-id',
        updateRequest({ weekdays: [0, 8] }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-positive durationMinutes', async () => {
    await expect(
      service.update(
        'user-id',
        'ritual-id',
        updateRequest({ durationMinutes: 0 }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('RitualsService breaks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRitualInteractor.execute.mockResolvedValue(createRitual());
    saveRitualBreaksInteractor.execute.mockImplementation((data) =>
      Promise.resolve(data),
    );
  });

  it('returns 0 breaks by default when nothing was saved yet', async () => {
    getRitualBreaksInteractor.execute.mockResolvedValue(null);

    const settings = await service.getBreaks('user-id', 'ritual-id');

    expect(settings).toEqual({
      ritualId: 'ritual-id',
      breakCount: 0,
      breakDurationMinutes: 5,
    });
  });

  it('returns 404 when getting breaks for a ritual that is not the user\'s', async () => {
    getRitualInteractor.execute.mockResolvedValue(
      createRitual({ userId: 'someone-else' }),
    );

    await expect(
      service.getBreaks('user-id', 'ritual-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('saves valid break settings', async () => {
    const settings = await service.saveBreaks('user-id', 'ritual-id', {
      breakCount: 2,
      breakDurationMinutes: 3,
    });

    expect(saveRitualBreaksInteractor.execute).toHaveBeenCalledWith({
      ritualId: 'ritual-id',
      breakCount: 2,
      breakDurationMinutes: 3,
    });
    expect(settings).toEqual({
      ritualId: 'ritual-id',
      breakCount: 2,
      breakDurationMinutes: 3,
    });
  });

  it('defaults breakDurationMinutes when breakCount is 0', async () => {
    await service.saveBreaks('user-id', 'ritual-id', { breakCount: 0 });

    expect(saveRitualBreaksInteractor.execute).toHaveBeenCalledWith({
      ritualId: 'ritual-id',
      breakCount: 0,
      breakDurationMinutes: 5,
    });
  });

  it('rejects a breakCount outside 0-3', async () => {
    await expect(
      service.saveBreaks('user-id', 'ritual-id', { breakCount: 4 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(saveRitualBreaksInteractor.execute).not.toHaveBeenCalled();
  });

  it('rejects a missing breakDurationMinutes when breakCount > 0', async () => {
    await expect(
      service.saveBreaks('user-id', 'ritual-id', { breakCount: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a breakDurationMinutes outside 1-5', async () => {
    await expect(
      service.saveBreaks('user-id', 'ritual-id', {
        breakCount: 1,
        breakDurationMinutes: 6,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createRitual(overrides: Partial<Ritual> = {}): Ritual {
  return {
    id: 'ritual-id',
    userId: 'user-id',
    title: 'Lectura',
    description: null,
    icon: 'book',
    durationMinutes: 60,
    weekdays: [2],
    startTime: '10:00',
    endTime: '11:00',
    appCount: 1,
    categoryCount: 0,
    domainCount: 0,
    selectionDigest: '1 app',
    isProtected: false,
    nfcUnlockEnabled: false,
    passwordHash: null,
    status: 'active',
    createdAt: new Date('2026-06-09T10:00:00.000Z'),
    updatedAt: new Date('2026-06-09T10:00:00.000Z'),
    ...overrides,
  };
}

function createActiveSession(
  overrides: Partial<RitualSession> = {},
): RitualSession {
  return {
    id: 'session-id',
    userId: 'user-id',
    ritualId: 'ritual-id',
    startedAt: new Date('2026-06-09T22:00:00.000Z'),
    plannedEndAt: new Date('2026-06-10T03:00:00.000Z'),
    endedAt: null,
    status: 'active',
    startSource: 'manual',
    endSource: null,
    durationSeconds: null,
    createdAt: new Date('2026-06-09T22:00:00.000Z'),
    updatedAt: new Date('2026-06-09T22:00:00.000Z'),
    ...overrides,
  };
}

function updateRequest(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Lectura nocturna',
    description: null,
    icon: 'book',
    durationMinutes: 60,
    weekdays: [2],
    startTime: '22:00',
    endTime: '03:00',
    appCount: 1,
    categoryCount: 0,
    domainCount: 0,
    selectionDigest: '1 app',
    isProtected: false,
    nfcUnlockEnabled: false,
    password: null,
    ...overrides,
  };
}
