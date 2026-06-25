import { IInternalAnalyticsRepository } from '../../adapters/repositories/internalAnalytics/IInternalAnalyticsRepository';
import { InternalAnalyticsStreaks } from '../../entities/internalAnalytics/InternalAnalyticsStreaks';

export class GetInternalAnalyticsStreaksInteractor {
  constructor(
    private readonly internalAnalyticsRepository: IInternalAnalyticsRepository,
  ) {}

  async execute(
    timeZone: string,
    limit: number,
  ): Promise<InternalAnalyticsStreaks> {
    return this.internalAnalyticsRepository.getStreaks(timeZone, limit);
  }
}
