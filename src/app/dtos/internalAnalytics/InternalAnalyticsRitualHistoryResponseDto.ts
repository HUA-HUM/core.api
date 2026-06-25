import { InternalAnalyticsRitualHistory } from '../../../core/entities/internalAnalytics/InternalAnalyticsRitualHistory';
import { RitualSessionResponseDto } from '../ritualSessions/RitualSessionResponseDto';

export class InternalAnalyticsRitualHistoryResponseDto {
  generatedAt!: string;
  ritual!: InternalAnalyticsRitualHistory['ritual'];
  summary!: Omit<
    InternalAnalyticsRitualHistory['summary'],
    'lastStartedAt' | 'lastEndedAt'
  > & {
    lastStartedAt: string | null;
    lastEndedAt: string | null;
  };
  sessions!: RitualSessionResponseDto[];

  static fromEntity(
    history: InternalAnalyticsRitualHistory,
  ): InternalAnalyticsRitualHistoryResponseDto {
    return {
      generatedAt: history.generatedAt.toISOString(),
      ritual: history.ritual,
      summary: {
        ...history.summary,
        lastStartedAt: history.summary.lastStartedAt?.toISOString() ?? null,
        lastEndedAt: history.summary.lastEndedAt?.toISOString() ?? null,
      },
      sessions: history.sessions.map((session) =>
        RitualSessionResponseDto.fromEntity(session),
      ),
    };
  }
}
