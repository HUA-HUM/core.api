import { EmergencyUnlockCooldownError } from '../../../../core/interactors/emergencyUnlocks/EmergencyUnlockCooldownError';
import { SQLEmergencyUnlocksRepository } from './SQLEmergencyUnlocksRepository';

describe('SQLEmergencyUnlocksRepository', () => {
  const manager = { query: jest.fn() };
  const entityManager = {
    query: jest.fn(),
    transaction: jest.fn(
      (work: (transactionManager: typeof manager) => Promise<unknown>) =>
        work(manager),
    ),
  };
  const repository = new SQLEmergencyUnlocksRepository(entityManager as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finishes the active session and records the cooldown atomically', async () => {
    manager.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { available: true, lastUsedAt: null, nextAvailableAt: null },
      ])
      .mockResolvedValueOnce([{ sessionType: 'mode', sessionId: 'session-id' }])
      .mockResolvedValueOnce([[{ id: 'session-id' }], 1])
      .mockResolvedValueOnce([
        [
          {
            id: 'unlock-id',
            userId: 'user-id',
            sessionType: 'mode',
            sessionId: 'session-id',
            reason: 'forgot_tag',
            tagMarkedLost: false,
            usedAt: '2026-07-06T00:00:00.000Z',
            nextAvailableAt: '2026-09-04T00:00:00.000Z',
          },
        ],
        1,
      ]);

    const result = await repository.use(
      { userId: 'user-id', reason: 'forgot_tag' },
      60,
    );

    expect(result.sessionType).toBe('mode');
    expect(result.tagMarkedLost).toBe(false);
    expect(manager.query.mock.calls[3][0]).toContain(
      "end_source = 'emergency'",
    );
    expect(entityManager.transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects use while the account is on cooldown', async () => {
    const nextAvailableAt = new Date('2026-09-04T00:00:00.000Z');
    manager.query.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        available: false,
        lastUsedAt: new Date('2026-07-06T00:00:00.000Z'),
        nextAvailableAt,
      },
    ]);

    await expect(
      repository.use({ userId: 'user-id', reason: 'forgot_tag' }, 60),
    ).rejects.toEqual(new EmergencyUnlockCooldownError(nextAvailableAt));

    expect(manager.query).toHaveBeenCalledTimes(2);
  });

  it('marks the linked tag as lost before recording the unlock', async () => {
    manager.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { available: true, lastUsedAt: null, nextAvailableAt: null },
      ])
      .mockResolvedValueOnce([
        { sessionType: 'ritual', sessionId: 'session-id' },
      ])
      .mockResolvedValueOnce([[{ id: 'session-id' }], 1])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        [
          {
            id: 'unlock-id',
            userId: 'user-id',
            sessionType: 'ritual',
            sessionId: 'session-id',
            reason: 'lost_tag',
            tagMarkedLost: true,
            usedAt: '2026-07-06T00:00:00.000Z',
            nextAvailableAt: '2026-09-04T00:00:00.000Z',
          },
        ],
        1,
      ]);

    const result = await repository.use(
      { userId: 'user-id', reason: 'lost_tag' },
      60,
    );

    expect(result.tagMarkedLost).toBe(true);
    expect(manager.query.mock.calls[4][0]).toContain("status = 'lost'");
    expect(manager.query.mock.calls[5][0]).toContain("status = 'revoked'");
  });
});
