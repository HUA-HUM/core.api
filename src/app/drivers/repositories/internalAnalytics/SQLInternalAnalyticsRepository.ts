import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IInternalAnalyticsRepository } from '../../../../core/adapters/repositories/internalAnalytics/IInternalAnalyticsRepository';
import { InternalAnalyticsOverview } from '../../../../core/entities/internalAnalytics/InternalAnalyticsOverview';

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

@Injectable()
export class SQLInternalAnalyticsRepository
  implements IInternalAnalyticsRepository
{
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

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
