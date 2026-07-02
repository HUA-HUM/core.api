import { BadRequestException, ConflictException } from '@nestjs/common';
import { RitualSession } from '../../../core/entities/ritualSessions/RitualSession';
import { RitualSessionsService } from './RitualSessionsService';

describe('RitualSessionsService start validation', () => {
  const ritualsService = { getById: jest.fn() };
  const startInteractor = { execute: jest.fn() };
  const getActiveInteractor = { execute: jest.fn() };
  const getActiveModeInteractor = { execute: jest.fn() };
  const listInteractor = { execute: jest.fn() };
  const listByRitualInteractor = { execute: jest.fn() };
  const summaryInteractor = { execute: jest.fn() };
  const finishInteractor = { execute: jest.fn() };
  const recordInteractor = { execute: jest.fn() };

  const service = new RitualSessionsService(
    ritualsService as never,
    startInteractor as never,
    getActiveInteractor as never,
    getActiveModeInteractor as never,
    listInteractor as never,
    listByRitualInteractor as never,
    summaryInteractor as never,
    finishInteractor as never,
    recordInteractor as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    ritualsService.getById.mockResolvedValue({ id: 'ritual-id' });
    getActiveModeInteractor.execute.mockResolvedValue(null);
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
