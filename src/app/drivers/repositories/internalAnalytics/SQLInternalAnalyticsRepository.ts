import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IInternalAnalyticsRepository } from '../../../../core/adapters/repositories/internalAnalytics/IInternalAnalyticsRepository';
import { InternalAnalyticsOverview } from '../../../../core/entities/internalAnalytics/InternalAnalyticsOverview';
import {
  InternalAnalyticsPeriod,
  InternalAnalyticsPeriodBucket,
  InternalAnalyticsPeriodMetrics,
} from '../../../../core/entities/internalAnalytics/InternalAnalyticsPeriodMetrics';
import { InternalAnalyticsRitualHistory } from '../../../../core/entities/internalAnalytics/InternalAnalyticsRitualHistory';
import { InternalAnalyticsStreaks } from '../../../../core/entities/internalAnalytics/InternalAnalyticsStreaks';
import {
  RitualSession,
  RitualSessionEndSource,
  RitualSessionStartSource,
  RitualSessionStatus,
} from '../../../../core/entities/ritualSessions/RitualSession';

interface UsersMetricsRow {
  total: string | number;
  active: string | number;
  disabled: string | number;
  withActiveTag: string | number;
  withActiveRituals: string | number;
}

interface TagsMetricsRow {
  activeTags: string | number;
  activeClaims: string | number;
  revokedClaims: string | number;
  usersWithActiveTag: string | number;
}

interface RitualsMetricsRow {
  total: string | number;
  active: string | number;
  archived: string | number;
  activeNow: string | number;
  protected: string | number;
  nfcUnlockEnabled: string | number;
  averageActiveRitualsPerUser: string | number;
}

interface BlockedItemsMetricsRow {
  total: string | number;
  apps: string | number;
  categories: string | number;
  domains: string | number;
  ios: string | number;
  android: string | number;
}

interface SessionsMetricsRow {
  total: string | number;
  active: string | number;
  completed: string | number;
  cancelled: string | number;
  startedToday: string | number;
  completedToday: string | number;
  cancelledToday: string | number;
  totalFocusSeconds: string | number;
  averageFocusSeconds: string | number;
  lastStartedAt: Date | string | null;
}

interface RitualHistoryRitualRow {
  id: string;
  userId: string;
  userEmail: string | null;
  userDisplayName: string | null;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
  weekdays: number[];
  appCount: string | number;
  categoryCount: string | number;
  domainCount: string | number;
}

interface RitualHistorySummaryRow {
  totalSessions: string | number;
  activeSessions: string | number;
  completedSessions: string | number;
  cancelledSessions: string | number;
  totalFocusSeconds: string | number;
  averageFocusSeconds: string | number;
  lastStartedAt: Date | string | null;
  lastEndedAt: Date | string | null;
}

interface RitualSessionRow {
  id: string;
  userId: string;
  ritualId: string;
  startedAt: Date | string;
  plannedEndAt: Date | string | null;
  endedAt: Date | string | null;
  status: RitualSessionStatus;
  startSource: RitualSessionStartSource;
  endSource: RitualSessionEndSource | null;
  durationSeconds: string | number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface PeriodMetricsRow {
  periodStart: Date | string;
  periodEnd: Date | string;
  totalSessions: string | number;
  completedSessions: string | number;
  cancelledSessions: string | number;
  activeSessions: string | number;
  totalFocusSeconds: string | number;
  averageFocusSeconds: string | number;
  activeUsers: string | number;
  activeRituals: string | number;
}

interface StreakRow {
  userId: string;
  email: string | null;
  displayName: string | null;
  currentStreakDays: string | number;
  lastFocusDay: string;
  totalSessions: string | number;
  completedSessions: string | number;
  totalFocusSeconds: string | number;
}

@Injectable()
export class SQLInternalAnalyticsRepository implements IInternalAnalyticsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getOverview(timeZone: string): Promise<InternalAnalyticsOverview> {
    const [users] = await this.queryRows<UsersMetricsRow>(
      `
        select
          count(*) as "total",
          count(*) filter (where status = 'active') as "active",
          count(*) filter (where status <> 'active') as "disabled",
          count(*) filter (
            where exists (
              select 1
              from nfc_tag_claims claims
              where claims.user_id = users.id
                and claims.status = 'active'
            )
          ) as "withActiveTag",
          count(*) filter (
            where exists (
              select 1
              from rituals
              where rituals.user_id = users.id
                and rituals.status = 'active'
            )
          ) as "withActiveRituals"
        from users
      `,
      [],
    );

    const [tags] = await this.queryRows<TagsMetricsRow>(
      `
        select
          (select count(*) from nfc_tags where status = 'active') as "activeTags",
          count(*) filter (where status = 'active') as "activeClaims",
          count(*) filter (where status = 'revoked') as "revokedClaims",
          count(distinct user_id) filter (where status = 'active') as "usersWithActiveTag"
        from nfc_tag_claims
      `,
      [],
    );

    const [rituals] = await this.queryRows<RitualsMetricsRow>(
      `
        with local_time as (
          select
            (now() at time zone $1)::time as current_time,
            (extract(dow from now() at time zone $1)::int + 1) as current_weekday
        )
        select
          count(*) as "total",
          count(*) filter (where status = 'active') as "active",
          count(*) filter (where status = 'archived') as "archived",
          count(*) filter (
            where status = 'active'
              and (select current_weekday from local_time) = any(weekdays)
              and start_time::time <= (select current_time from local_time)
              and end_time::time > (select current_time from local_time)
          ) as "activeNow",
          count(*) filter (where is_protected = true) as "protected",
          count(*) filter (where nfc_unlock_enabled = true) as "nfcUnlockEnabled",
          coalesce(
            round(
              count(*) filter (where status = 'active')::numeric /
              nullif(count(distinct user_id), 0),
              2
            ),
            0
          ) as "averageActiveRitualsPerUser"
        from rituals
      `,
      [timeZone],
    );

    const [blockedItems] = await this.queryRows<BlockedItemsMetricsRow>(
      `
        select
          count(*) as "total",
          count(*) filter (where type = 'app') as "apps",
          count(*) filter (where type = 'category') as "categories",
          count(*) filter (where type = 'domain') as "domains",
          count(*) filter (where platform = 'ios') as "ios",
          count(*) filter (where platform = 'android') as "android"
        from ritual_blocked_items
      `,
      [],
    );

    const [sessions] = await this.queryRows<SessionsMetricsRow>(
      `
        with local_day as (
          select date_trunc('day', now() at time zone $1) at time zone $1 as starts_at
        )
        select
          count(*) as "total",
          count(*) filter (where status = 'active') as "active",
          count(*) filter (where status = 'completed') as "completed",
          count(*) filter (where status = 'cancelled') as "cancelled",
          count(*) filter (where started_at >= (select starts_at from local_day)) as "startedToday",
          count(*) filter (
            where status = 'completed'
              and ended_at >= (select starts_at from local_day)
          ) as "completedToday",
          count(*) filter (
            where status = 'cancelled'
              and ended_at >= (select starts_at from local_day)
          ) as "cancelledToday",
          coalesce(sum(duration_seconds), 0) as "totalFocusSeconds",
          coalesce(avg(duration_seconds) filter (where duration_seconds is not null), 0) as "averageFocusSeconds",
          max(started_at) as "lastStartedAt"
        from ritual_sessions
      `,
      [timeZone],
    );

    const totalUsers = this.toNumber(users?.total);
    const usersWithActiveTag = this.toNumber(
      users?.withActiveTag ?? tags?.usersWithActiveTag,
    );

    return {
      generatedAt: new Date(),
      users: {
        total: totalUsers,
        active: this.toNumber(users?.active),
        disabled: this.toNumber(users?.disabled),
        withActiveTag: usersWithActiveTag,
        withoutActiveTag: Math.max(totalUsers - usersWithActiveTag, 0),
        withActiveRituals: this.toNumber(users?.withActiveRituals),
      },
      tags: {
        activeTags: this.toNumber(tags?.activeTags),
        activeClaims: this.toNumber(tags?.activeClaims),
        revokedClaims: this.toNumber(tags?.revokedClaims),
        usersWithActiveTag: this.toNumber(tags?.usersWithActiveTag),
      },
      rituals: {
        total: this.toNumber(rituals?.total),
        active: this.toNumber(rituals?.active),
        archived: this.toNumber(rituals?.archived),
        activeNow: this.toNumber(rituals?.activeNow),
        protected: this.toNumber(rituals?.protected),
        nfcUnlockEnabled: this.toNumber(rituals?.nfcUnlockEnabled),
        averageActiveRitualsPerUser: this.toNumber(
          rituals?.averageActiveRitualsPerUser,
        ),
      },
      blockedItems: {
        total: this.toNumber(blockedItems?.total),
        apps: this.toNumber(blockedItems?.apps),
        categories: this.toNumber(blockedItems?.categories),
        domains: this.toNumber(blockedItems?.domains),
        ios: this.toNumber(blockedItems?.ios),
        android: this.toNumber(blockedItems?.android),
      },
      sessions: {
        total: this.toNumber(sessions?.total),
        active: this.toNumber(sessions?.active),
        completed: this.toNumber(sessions?.completed),
        cancelled: this.toNumber(sessions?.cancelled),
        startedToday: this.toNumber(sessions?.startedToday),
        completedToday: this.toNumber(sessions?.completedToday),
        cancelledToday: this.toNumber(sessions?.cancelledToday),
        totalFocusMinutes: Math.floor(
          this.toNumber(sessions?.totalFocusSeconds) / 60,
        ),
        averageFocusMinutes: Math.floor(
          this.toNumber(sessions?.averageFocusSeconds) / 60,
        ),
        lastStartedAt: this.toNullableDate(sessions?.lastStartedAt),
      },
    };
  }

  async getRitualHistory(
    ritualId: string,
    limit: number,
  ): Promise<InternalAnalyticsRitualHistory | null> {
    const [ritual] = await this.queryRows<RitualHistoryRitualRow>(
      `
        select
          rituals.id,
          rituals.user_id as "userId",
          users.email as "userEmail",
          users.display_name as "userDisplayName",
          rituals.title,
          rituals.status,
          rituals.start_time::text as "startTime",
          rituals.end_time::text as "endTime",
          rituals.weekdays,
          rituals.app_count as "appCount",
          rituals.category_count as "categoryCount",
          rituals.domain_count as "domainCount"
        from rituals
        left join users on users.id = rituals.user_id
        where rituals.id = $1
        limit 1
      `,
      [ritualId],
    );

    if (!ritual) {
      return null;
    }

    const [summary] = await this.queryRows<RitualHistorySummaryRow>(
      `
        select
          count(*) as "totalSessions",
          count(*) filter (where status = 'active') as "activeSessions",
          count(*) filter (where status = 'completed') as "completedSessions",
          count(*) filter (where status = 'cancelled') as "cancelledSessions",
          coalesce(sum(duration_seconds), 0) as "totalFocusSeconds",
          coalesce(avg(duration_seconds) filter (where duration_seconds is not null), 0) as "averageFocusSeconds",
          max(started_at) as "lastStartedAt",
          max(ended_at) as "lastEndedAt"
        from ritual_sessions
        where ritual_id = $1
      `,
      [ritualId],
    );

    const sessions = await this.queryRows<RitualSessionRow>(
      `
        select
          id,
          user_id as "userId",
          ritual_id as "ritualId",
          started_at as "startedAt",
          planned_end_at as "plannedEndAt",
          ended_at as "endedAt",
          status,
          start_source as "startSource",
          end_source as "endSource",
          duration_seconds as "durationSeconds",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from ritual_sessions
        where ritual_id = $1
        order by started_at desc
        limit $2
      `,
      [ritualId, limit],
    );

    return {
      generatedAt: new Date(),
      ritual: {
        id: ritual.id,
        userId: ritual.userId,
        userEmail: ritual.userEmail,
        userDisplayName: ritual.userDisplayName,
        title: ritual.title,
        status: ritual.status,
        startTime: ritual.startTime,
        endTime: ritual.endTime,
        weekdays: ritual.weekdays,
        appCount: this.toNumber(ritual.appCount),
        categoryCount: this.toNumber(ritual.categoryCount),
        domainCount: this.toNumber(ritual.domainCount),
      },
      summary: {
        totalSessions: this.toNumber(summary?.totalSessions),
        activeSessions: this.toNumber(summary?.activeSessions),
        completedSessions: this.toNumber(summary?.completedSessions),
        cancelledSessions: this.toNumber(summary?.cancelledSessions),
        totalFocusMinutes: Math.floor(
          this.toNumber(summary?.totalFocusSeconds) / 60,
        ),
        averageFocusMinutes: Math.floor(
          this.toNumber(summary?.averageFocusSeconds) / 60,
        ),
        lastStartedAt: this.toNullableDate(summary?.lastStartedAt),
        lastEndedAt: this.toNullableDate(summary?.lastEndedAt),
      },
      sessions: sessions.map((row) => this.mapRowToRitualSession(row)),
    };
  }

  async getPeriodMetrics(
    timeZone: string,
    period: InternalAnalyticsPeriod,
    buckets: number,
  ): Promise<InternalAnalyticsPeriodMetrics> {
    const periodUnit = period === 'month' ? 'month' : 'week';
    const periodInterval = period === 'month' ? '1 month' : '1 week';

    const rows = await this.queryRows<PeriodMetricsRow>(
      `
        with buckets as (
          select generate_series(
            date_trunc('${periodUnit}', now() at time zone $1) - (($2 - 1) * interval '${periodInterval}'),
            date_trunc('${periodUnit}', now() at time zone $1),
            interval '${periodInterval}'
          ) as bucket_start_local
        )
        select
          (buckets.bucket_start_local at time zone $1) as "periodStart",
          ((buckets.bucket_start_local + interval '${periodInterval}') at time zone $1) as "periodEnd",
          count(ritual_sessions.id) as "totalSessions",
          count(*) filter (where ritual_sessions.status = 'completed') as "completedSessions",
          count(*) filter (where ritual_sessions.status = 'cancelled') as "cancelledSessions",
          count(*) filter (where ritual_sessions.status = 'active') as "activeSessions",
          coalesce(sum(ritual_sessions.duration_seconds), 0) as "totalFocusSeconds",
          coalesce(avg(ritual_sessions.duration_seconds) filter (where ritual_sessions.duration_seconds is not null), 0) as "averageFocusSeconds",
          count(distinct ritual_sessions.user_id) as "activeUsers",
          count(distinct ritual_sessions.ritual_id) as "activeRituals"
        from buckets
        left join ritual_sessions
          on (ritual_sessions.started_at at time zone $1) >= buckets.bucket_start_local
          and (ritual_sessions.started_at at time zone $1) < buckets.bucket_start_local + interval '${periodInterval}'
        group by buckets.bucket_start_local
        order by buckets.bucket_start_local asc
      `,
      [timeZone, buckets],
    );

    return {
      generatedAt: new Date(),
      period,
      buckets: rows.map((row) => this.mapRowToPeriodBucket(row)),
    };
  }

  async getStreaks(
    timeZone: string,
    limit: number,
  ): Promise<InternalAnalyticsStreaks> {
    const rows = await this.queryRows<StreakRow>(
      `
        with focus_days as (
          select distinct
            user_id,
            date(coalesce(ended_at, started_at) at time zone $1) as focus_day
          from ritual_sessions
          where status in ('completed', 'cancelled')
        ),
        ranked_days as (
          select
            user_id,
            focus_day,
            focus_day + row_number() over (
              partition by user_id
              order by focus_day desc
            )::int as streak_group
          from focus_days
        ),
        latest_user_day as (
          select distinct on (user_id)
            user_id,
            focus_day as latest_focus_day,
            streak_group
          from ranked_days
          order by user_id, focus_day desc
        ),
        current_streaks as (
          select
            ranked_days.user_id,
            max(latest_user_day.latest_focus_day) as latest_focus_day,
            count(*) as current_streak_days
          from ranked_days
          join latest_user_day
            on latest_user_day.user_id = ranked_days.user_id
            and latest_user_day.streak_group = ranked_days.streak_group
          where latest_user_day.latest_focus_day >= date(now() at time zone $1) - 1
          group by ranked_days.user_id
        ),
        user_totals as (
          select
            user_id,
            count(*) as total_sessions,
            count(*) filter (where status = 'completed') as completed_sessions,
            coalesce(sum(duration_seconds), 0) as total_focus_seconds
          from ritual_sessions
          group by user_id
        )
        select
          users.id as "userId",
          users.email,
          users.display_name as "displayName",
          current_streaks.current_streak_days as "currentStreakDays",
          current_streaks.latest_focus_day::text as "lastFocusDay",
          coalesce(user_totals.total_sessions, 0) as "totalSessions",
          coalesce(user_totals.completed_sessions, 0) as "completedSessions",
          coalesce(user_totals.total_focus_seconds, 0) as "totalFocusSeconds"
        from current_streaks
        join users on users.id = current_streaks.user_id
        left join user_totals on user_totals.user_id = current_streaks.user_id
        order by current_streaks.current_streak_days desc, user_totals.total_focus_seconds desc
        limit $2
      `,
      [timeZone, limit],
    );

    return {
      generatedAt: new Date(),
      users: rows.map((row) => ({
        userId: row.userId,
        email: row.email,
        displayName: row.displayName,
        currentStreakDays: this.toNumber(row.currentStreakDays),
        lastFocusDay: row.lastFocusDay,
        totalSessions: this.toNumber(row.totalSessions),
        completedSessions: this.toNumber(row.completedSessions),
        totalFocusMinutes: Math.floor(
          this.toNumber(row.totalFocusSeconds) / 60,
        ),
      })),
    };
  }

  private toNumber(value: string | number | undefined | null): number {
    return Number(value ?? 0);
  }

  private toNullableDate(value: Date | string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private mapRowToPeriodBucket(
    row: PeriodMetricsRow,
  ): InternalAnalyticsPeriodBucket {
    return {
      periodStart: this.toDate(row.periodStart),
      periodEnd: this.toDate(row.periodEnd),
      totalSessions: this.toNumber(row.totalSessions),
      completedSessions: this.toNumber(row.completedSessions),
      cancelledSessions: this.toNumber(row.cancelledSessions),
      activeSessions: this.toNumber(row.activeSessions),
      totalFocusMinutes: Math.floor(this.toNumber(row.totalFocusSeconds) / 60),
      averageFocusMinutes: Math.floor(
        this.toNumber(row.averageFocusSeconds) / 60,
      ),
      activeUsers: this.toNumber(row.activeUsers),
      activeRituals: this.toNumber(row.activeRituals),
    };
  }

  private mapRowToRitualSession(row: RitualSessionRow): RitualSession {
    return {
      id: row.id,
      userId: row.userId,
      ritualId: row.ritualId,
      startedAt: this.toDate(row.startedAt),
      plannedEndAt: this.toNullableDate(row.plannedEndAt),
      endedAt: this.toNullableDate(row.endedAt),
      status: row.status,
      startSource: row.startSource,
      endSource: row.endSource,
      durationSeconds:
        row.durationSeconds === null
          ? null
          : this.toNumber(row.durationSeconds),
      createdAt: this.toDate(row.createdAt),
      updatedAt: this.toDate(row.updatedAt),
    };
  }

  private toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
