import { IInternalAnalyticsRepository } from '../../adapters/repositories/internalAnalytics/IInternalAnalyticsRepository';
import { InternalAnalyticsRitualHistory } from '../../entities/internalAnalytics/InternalAnalyticsRitualHistory';

export class GetInternalAnalyticsRitualHistoryInteractor {
  constructor(
    private readonly internalAnalyticsRepository: IInternalAnalyticsRepository,
  ) {}

  async execute(
    ritualId: string,
    limit: number,
  ): Promise<InternalAnalyticsRitualHistory | null> {
    return this.internalAnalyticsRepository.getRitualHistory(ritualId, limit);
  }
}
