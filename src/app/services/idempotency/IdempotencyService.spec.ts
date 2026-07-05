import { ConflictException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { IdempotencyService } from './IdempotencyService';

describe('IdempotencyService', () => {
  const query = jest.fn();
  const transaction = jest.fn(
    (callback: (manager: { query: jest.Mock }) => Promise<unknown>) =>
      callback({ query }),
  );
  const service = new IdempotencyService({ transaction } as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes directly when no idempotency key was provided', async () => {
    const execute = jest.fn().mockResolvedValue({ id: 'session-id' });

    await expect(
      service.execute(request({ key: undefined, execute })),
    ).resolves.toEqual({ id: 'session-id' });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('stores the resource produced by the first execution', async () => {
    query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const execute = jest.fn().mockResolvedValue({ id: 'session-id' });

    await expect(service.execute(request({ execute }))).resolves.toEqual({
      id: 'session-id',
    });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[3][1]).toContain('session-id');
  });

  it('replays the stored resource without executing the operation again', async () => {
    const payload = { sessionId: 'session-id', status: 'completed' };
    const requestHash = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
    query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          operation: 'finish_mode_session',
          requestHash,
          resourceId: 'session-id',
        },
      ]);
    const execute = jest.fn();
    const replay = jest.fn().mockResolvedValue({ id: 'session-id' });

    await expect(
      service.execute(request({ request: payload, execute, replay })),
    ).resolves.toEqual({ id: 'session-id' });
    expect(execute).not.toHaveBeenCalled();
    expect(replay).toHaveBeenCalledWith('session-id');
  });

  it('rejects reusing a key for a different request', async () => {
    query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          operation: 'finish_mode_session',
          requestHash: 'another-hash',
          resourceId: 'session-id',
        },
      ]);

    await expect(service.execute(request())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

function request(
  overrides: Partial<Parameters<IdempotencyService['execute']>[0]> = {},
) {
  return {
    userId: 'user-id',
    key: 'operation-id',
    operation: 'finish_mode_session',
    request: { sessionId: 'session-id', status: 'completed' },
    resourceType: 'mode_session' as const,
    execute: jest.fn().mockResolvedValue({ id: 'session-id' }),
    replay: jest.fn().mockResolvedValue({ id: 'session-id' }),
    resourceId: (result: { id: string }) => result.id,
    ...overrides,
  };
}
