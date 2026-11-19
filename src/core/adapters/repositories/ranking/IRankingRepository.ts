import {
  MonthlyRanking,
  MonthlyRankingOptions,
} from '../../../entities/ranking/MonthlyRanking';

export const RANKING_REPOSITORY = Symbol('RANKING_REPOSITORY');

export interface IRankingRepository {
  getMonthlyRanking(
    userId: string,
    options: MonthlyRankingOptions,
  ): Promise<MonthlyRanking>;
}
