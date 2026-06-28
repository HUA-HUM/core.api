import { EntityManager } from 'typeorm';
import { SQLModesRepository } from './SQLModesRepository';

describe('SQLModesRepository', () => {
  it('unwraps rows returned by an update query', async () => {
    const createdAt = new Date('2026-06-28T20:00:00.000Z');
    const updatedAt = new Date('2026-06-28T23:32:16.000Z');
    const query = jest.fn().mockResolvedValue([
      [
        {
          id: 'mode-id',
          userId: 'user-id',
          templateKey: 'gym',
          title: 'Gym',
          icon: 'dumbbell.fill',
          appCount: 2,
          categoryCount: 0,
          domainCount: 0,
          selectionDigest: '2 apps',
          isProtected: false,
          nfcUnlockEnabled: false,
          passwordHash: null,
          status: 'active',
          createdAt,
          updatedAt,
        },
      ],
      1,
    ]);
    const repository = new SQLModesRepository({
      query,
    } as unknown as EntityManager);

    const result = await repository.updateById('mode-id', {
      title: 'Gym',
      icon: 'dumbbell.fill',
      appCount: 2,
      categoryCount: 0,
      domainCount: 0,
      selectionDigest: '2 apps',
      isProtected: false,
      nfcUnlockEnabled: false,
      passwordHash: null,
    });

    expect(result).toMatchObject({
      id: 'mode-id',
      createdAt,
      updatedAt,
    });
  });
});
