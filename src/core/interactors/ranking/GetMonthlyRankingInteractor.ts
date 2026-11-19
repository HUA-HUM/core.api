import { IRankingRepository } from '../../adapters/repositories/ranking/IRankingRepository';
import {
  MonthlyRanking,
  MonthlyRankingOptions,
} from '../../entities/ranking/MonthlyRanking';

export class GetMonthlyRankingInteractor {
  constructor(
    private readonly rankingRepository: IRankingRepository,
    private readonly options: MonthlyRankingOptions,
  ) {}

  async execute(userId: string): Promise<MonthlyRanking> {
    return this.rankingRepository.getMonthlyRanking(userId, this.options);
  }
}
