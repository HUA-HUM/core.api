import { Module } from '@nestjs/common';
import { env } from '../../../config/env';
import {
  IRankingRepository,
  RANKING_REPOSITORY,
} from '../../../core/adapters/repositories/ranking/IRankingRepository';
import { GetMonthlyRankingInteractor } from '../../../core/interactors/ranking/GetMonthlyRankingInteractor';
import { RankingController } from '../../controllers/ranking/RankingController';
import { RankingService } from '../../services/ranking/RankingService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

const MAX_SESSION_SECONDS = 24 * 60 * 60;
const MAX_ENTRIES = 100;

@Module({
  imports: [JwtAuthModule],
  controllers: [RankingController],
  providers: [
    {
      provide: GetMonthlyRankingInteractor,
      useFactory: (rankingRepository: IRankingRepository) =>
        new GetMonthlyRankingInteractor(rankingRepository, {
          timeZone: env.analyticsTimeZone,
          excludedEmails: env.rankingExcludedEmails,
          maxSessionSeconds: MAX_SESSION_SECONDS,
          maxEntries: MAX_ENTRIES,
        }),
      inject: [RANKING_REPOSITORY],
    },
    RankingService,
  ],
})
export class RankingModule {}
