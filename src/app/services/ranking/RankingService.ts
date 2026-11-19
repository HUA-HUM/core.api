import { BadRequestException, Injectable } from '@nestjs/common';
import { MonthlyRanking } from '../../../core/entities/ranking/MonthlyRanking';
import { GetMonthlyRankingInteractor } from '../../../core/interactors/ranking/GetMonthlyRankingInteractor';

@Injectable()
export class RankingService {
  constructor(
    private readonly getMonthlyRankingInteractor: GetMonthlyRankingInteractor,
  ) {}

  async monthly(userId: string): Promise<MonthlyRanking> {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }

    return this.getMonthlyRankingInteractor.execute(userId);
  }
}
