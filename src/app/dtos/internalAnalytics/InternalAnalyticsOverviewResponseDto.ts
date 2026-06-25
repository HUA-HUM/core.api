import { InternalAnalyticsOverview } from '../../../core/entities/internalAnalytics/InternalAnalyticsOverview';

export class InternalAnalyticsOverviewResponseDto {
  generatedAt!: string;
  users!: InternalAnalyticsOverview['users'];
  tags!: InternalAnalyticsOverview['tags'];
  rituals!: InternalAnalyticsOverview['rituals'];
  blockedItems!: InternalAnalyticsOverview['blockedItems'];
  sessions!: Omit<InternalAnalyticsOverview['sessions'], 'lastStartedAt'> & {
    lastStartedAt: string | null;
  };

  static fromEntity(
    overview: InternalAnalyticsOverview,
  ): InternalAnalyticsOverviewResponseDto {
    return {
      generatedAt: overview.generatedAt.toISOString(),
      users: overview.users,
      tags: overview.tags,
      rituals: overview.rituals,
      blockedItems: overview.blockedItems,
      sessions: {
        ...overview.sessions,
        lastStartedAt: overview.sessions.lastStartedAt?.toISOString() ?? null,
      },
    };
  }
}
