import { ConflictException } from '@nestjs/common';
import { ModeSession } from '../../../core/entities/modeSessions/ModeSession';
import { ModeSessionsService } from './ModeSessionsService';

describe('ModeSessionsService start validation', () => {
  const modesService = { getById: jest.fn() };
  const startInteractor = { execute: jest.fn() };
  const getActiveModeInteractor = { execute: jest.fn() };
  const getActiveRitualInteractor = { execute: jest.fn() };
  const listInteractor = { execute: jest.fn() };
  const listByModeInteractor = { execute: jest.fn() };
  const summaryInteractor = { execute: jest.fn() };
  const finishInteractor = { execute: jest.fn() };

  const service = new ModeSessionsService(
    modesService as never,
    startInteractor as never,
    getActiveModeInteractor as never,
    getActiveRitualInteractor as never,
    listInteractor as never,
    listByModeInteractor as never,
    summaryInteractor as never,
    finishInteractor as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    modesService.getById.mockResolvedValue({ id: 'mode-id' });
    getActiveModeInteractor.execute.mockResolvedValue(null);
    getActiveRitualInteractor.execute.mockResolvedValue(null);
  });

  it('returns the existing session when the same mode is started twice', async () => {
    const activeSession = createSession();
    getActiveModeInteractor.execute.mockResolvedValue(activeSession);

    await expect(service.start(startRequest())).resolves.toEqual(activeSession);
    expect(startInteractor.execute).not.toHaveBeenCalled();
  });

  it('rejects starting a mode while a ritual session is active', async () => {
    getActiveRitualInteractor.execute.mockResolvedValue({
      id: 'ritual-session-id',
    });

    await expect(service.start(startRequest())).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(startInteractor.execute).not.toHaveBeenCalled();
  });
});

function startRequest() {
  return {
    userId: 'user-id',
    modeId: 'mode-id',
    startSource: 'manual' as const,
  };
}

function createSession(): ModeSession {
  return {
    id: 'session-id',
    userId: 'user-id',
    modeId: 'mode-id',
    startedAt: new Date('2026-06-28T10:00:00.000Z'),
    endedAt: null,
    status: 'active',
    startSource: 'manual',
    endSource: null,
    durationSeconds: null,
    createdAt: new Date('2026-06-28T10:00:00.000Z'),
    updatedAt: new Date('2026-06-28T10:00:00.000Z'),
  };
}
