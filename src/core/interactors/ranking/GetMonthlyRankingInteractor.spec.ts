import { IRankingRepository } from '../../adapters/repositories/ranking/IRankingRepository';
import {
  MonthlyRanking,
  MonthlyRankingOptions,
} from '../../entities/ranking/MonthlyRanking';
import { GetMonthlyRankingInteractor } from './GetMonthlyRankingInteractor';

describe('GetMonthlyRankingInteractor', () => {
  const options: MonthlyRankingOptions = {
    timeZone: 'America/Argentina/Buenos_Aires',
    excludedEmails: ['hello@rituo.io'],
    maxSessionSeconds: 86400,
    maxEntries: 100,
  };

  it('delegates to the repository with the configured options', async () => {
    const ranking: MonthlyRanking = {
      periodStart: new Date('2026-11-01T03:00:00Z'),
      periodEnd: new Date('2026-12-01T03:00:00Z'),
      timeZone: options.timeZone,
      totalUsers: 85,
      participants: 2,
      me: { position: 2, displayName: 'Ana Perez', totalFocusSeconds: 600 },
      entries: [
        {
          position: 1,
          totalFocusSeconds: 900,
          isMe: false,
          label: 'Usuario 44',
          displayName: null,
        },
        {
          position: 2,
          totalFocusSeconds: 600,
          isMe: true,
          label: 'Ana Perez',
          displayName: 'Ana Perez',
        },
      ],
    };
    const getMonthlyRanking = jest.fn().mockResolvedValue(ranking);
    const repository: IRankingRepository = { getMonthlyRanking };

    const result = await new GetMonthlyRankingInteractor(
      repository,
      options,
    ).execute('user-1');

    expect(getMonthlyRanking).toHaveBeenCalledWith('user-1', options);
    expect(result).toBe(ranking);
  });
});
