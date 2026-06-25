import { IInternalAnalyticsRepository } from '../../adapters/repositories/internalAnalytics/IInternalAnalyticsRepository';
import { InternalAnalyticsOverview } from '../../entities/internalAnalytics/InternalAnalyticsOverview';

export class GetInternalAnalyticsOverviewInteractor {
  constructor(
    private readonly internalAnalyticsRepository: IInternalAnalyticsRepository,
  ) {}

  async execute(timeZone: string): Promise<InternalAnalyticsOverview> {
    return this.internalAnalyticsRepository.getOverview(timeZone);
  }
}
