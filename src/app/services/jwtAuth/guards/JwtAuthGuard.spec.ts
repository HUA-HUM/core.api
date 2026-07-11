import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './JwtAuthGuard';

describe('JwtAuthGuard', () => {
  const verifier = { verify: jest.fn() };
  const entityManager = { query: jest.fn() };
  const guard = new JwtAuthGuard(verifier as never, entityManager as never);

  beforeEach(() => {
    jest.clearAllMocks();
    verifier.verify.mockReturnValue({ id: 'user-id', sessionId: 'session-id' });
  });

  it('accepts a token only while its user remains active', async () => {
    entityManager.query.mockResolvedValue([{ id: 'user-id' }]);
    const request = {
      headers: { authorization: 'Bearer access-token' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request).toHaveProperty('authUser.id', 'user-id');
    expect(entityManager.query).toHaveBeenCalledWith(
      expect.stringContaining('refresh_sessions'),
      ['user-id', 'active', 'session-id'],
    );
  });

  it('rejects a valid token after its session was revoked or account was deleted', async () => {
    entityManager.query.mockResolvedValue([]);

    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer access-token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

function contextFor(request: object) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as never;
}
