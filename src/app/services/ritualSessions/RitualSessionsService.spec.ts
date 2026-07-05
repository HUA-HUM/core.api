import { BadRequestException, ConflictException } from '@nestjs/common';
import { RitualSession } from '../../../core/entities/ritualSessions/RitualSession';
import { RitualSessionsService } from './RitualSessionsService';

describe('RitualSessionsService start validation', () => {
  const ritualsService = { getById: jest.fn() };
  const nfcTagsService = {
    requireActiveTag: jest.fn(),
    verifyRequiredTag: jest.fn(),
  };
  const startInteractor = { execute: jest.fn() };
  const getActiveInteractor = { execute: jest.fn() };
  const getActiveModeInteractor = { execute: jest.fn() };
  const getRitualInteractor = { execute: jest.fn() };
  const listInteractor = { execute: jest.fn() };
  const listByRitualInteractor = { execute: jest.fn() };
  const summaryInteractor = { execute: jest.fn() };
  const finishInteractor = { execute: jest.fn() };
  const recordInteractor = { execute: jest.fn() };
  const idempotencyService = { execute: jest.fn() };

  const service = new RitualSessionsService(
    ritualsService as never,
    nfcTagsService as never,
    startInteractor as never,
    getActiveInteractor as never,
    getActiveModeInteractor as never,
    getRitualInteractor as never,
    listInteractor as never,
    listByRitualInteractor as never,
    summaryInteractor as never,
    finishInteractor as never,
    recordInteractor as never,
    idempotencyService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    startInteractor.execute.mockReset().mockResolvedValue(createSession());
    getActiveInteractor.execute.mockReset().mockResolvedValue(null);
    ritualsService.getById.mockResolvedValue({
      id: 'ritual-id',
      isProtected: false,
      status: 'active',
      appCount: 1,
      categoryCount: 0,
      domainCount: 0,
    });
    nfcTagsService.requireActiveTag.mockResolvedValue(undefined);
    nfcTagsService.verifyRequiredTag.mockResolvedValue({ id: 'claim-id' });
    getActiveModeInteractor.execute.mockResolvedValue(null);
    idempotencyService.execute.mockImplementation(
      ({ execute }: { execute: () => Promise<unknown> }) => execute(),
    );
  });

  it('returns the existing session when the same ritual is started twice', async () => {
    const activeSession = createSession();
    getActiveInteractor.execute.mockResolvedValue(activeSession);

    await expect(service.start(startRequest())).resolves.toEqual(activeSession);
    expect(startInteractor.execute).not.toHaveBeenCalled();
  });

  it('rejects starting a different ritual while another session is active', async () => {
    getActiveInteractor.execute.mockResolvedValue(
      createSession({ ritualId: 'other-ritual-id' }),
    );

    await expect(service.start(startRequest())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects starting a ritual while a mode session is active', async () => {
    getActiveInteractor.execute.mockResolvedValue(null);
    getActiveModeInteractor.execute.mockResolvedValue({
      id: 'mode-session-id',
    });

    await expect(service.start(startRequest())).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(startInteractor.execute).not.toHaveBeenCalled();
  });

  it('rejects a planned end date in the past', async () => {
    getActiveInteractor.execute.mockResolvedValue(null);

    await expect(
      service.start(startRequest('2020-01-01T10:00:00.000Z')),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(startInteractor.execute).not.toHaveBeenCalled();
  });

  it('recovers the active session after a concurrent duplicate start', async () => {
    const activeSession = createSession();
    getActiveInteractor.execute
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(activeSession);
    startInteractor.execute.mockRejectedValue(new Error('duplicate key'));

    await expect(service.start(startRequest())).resolves.toEqual(activeSession);
  });

  it('requires an active NFC tag for a manual ritual start', async () => {
    getActiveInteractor.execute.mockResolvedValue(null);

    await service.start({
      ...startRequest(),
      startSource: 'manual',
    });

    expect(nfcTagsService.requireActiveTag).toHaveBeenCalledWith('user-id');
  });

  it('does not require an NFC tag for a scheduled ritual start', async () => {
    getActiveInteractor.execute.mockResolvedValue(null);

    await service.start(startRequest());

    expect(nfcTagsService.requireActiveTag).not.toHaveBeenCalled();
  });

  it('rejects starting an archived ritual', async () => {
    ritualsService.getById.mockResolvedValue({
      status: 'archived',
      appCount: 1,
      categoryCount: 0,
      domainCount: 0,
    });

    await expect(service.start(startRequest())).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(startInteractor.execute).not.toHaveBeenCalled();
  });

  it('rejects starting a ritual without blocked items', async () => {
    ritualsService.getById.mockResolvedValue({
      status: 'active',
      appCount: 0,
      categoryCount: 0,
      domainCount: 0,
    });

    await expect(service.start(startRequest())).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(startInteractor.execute).not.toHaveBeenCalled();
  });
});

function startRequest(plannedEndAt = '2030-01-01T11:00:00.000Z') {
  return {
    userId: 'user-id',
    ritualId: 'ritual-id',
    plannedEndAt,
    startSource: 'schedule' as const,
  };
}

function createSession(overrides: Partial<RitualSession> = {}): RitualSession {
  return {
    id: 'session-id',
    userId: 'user-id',
    ritualId: 'ritual-id',
    startedAt: new Date('2026-06-28T10:00:00.000Z'),
    plannedEndAt: new Date('2026-06-28T11:00:00.000Z'),
    endedAt: null,
    status: 'active',
    startSource: 'schedule',
    endSource: null,
    durationSeconds: null,
    createdAt: new Date('2026-06-28T10:00:00.000Z'),
    updatedAt: new Date('2026-06-28T10:00:00.000Z'),
    ...overrides,
  };
}
