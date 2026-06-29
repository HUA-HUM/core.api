import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IFocusMetricsRepository } from '../../../../core/adapters/repositories/focusMetrics/IFocusMetricsRepository';
import {
  FocusMetricDay,
  FocusMetricsSummary,
} from '../../../../core/entities/focusMetrics/FocusMetricsSummary';

interface WeeklyFocusRow {
  date: string;
  totalFocusSeconds: string | number;
}

interface FocusMetricsRow {
  totalSessions: string | number;
  completedSessions: string | number;
  cancelledSessions: string | number;
  activeSessions: string | number;
  ritualSessions: string | number;
  modeSessions: string | number;
  totalFocusSeconds: string | number;
  focusDays: string | number;
  currentStreakDays: string | number;
  lastSessionAt: Date | string | null;
  weeklyFocus: WeeklyFocusRow[] | string | null;
}

@Injectable()
export class SQLFocusMetricsRepository implements IFocusMetricsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getSummaryByUserId(userId: string): Promise<FocusMetricsSummary> {
    const rows = await this.queryRows<FocusMetricsRow>(
      `
        with sessions as (
          select
            'ritual'::text as source,
            status,
            duration_seconds,
            started_at,
            ended_at
          from ritual_sessions
          where user_id = $1

          union all

          select
            'mode'::text as source,
            status,
            duration_seconds,
            started_at,
            ended_at
          from mode_sessions
          where user_id = $1
        ),
        summary as (
          select
            count(*) as "totalSessions",
            count(*) filter (where status = 'completed') as "completedSessions",
            count(*) filter (where status = 'cancelled') as "cancelledSessions",
            count(*) filter (where status = 'active') as "activeSessions",
            count(*) filter (where source = 'ritual') as "ritualSessions",
            count(*) filter (where source = 'mode') as "modeSessions",
            coalesce(
              sum(duration_seconds) filter (
                where status in ('completed', 'cancelled')
              ),
              0
            ) as "totalFocusSeconds",
            max(coalesce(ended_at, started_at)) as "lastSessionAt"
          from sessions
        ),
        focus_days as (
          select distinct date(coalesce(ended_at, started_at)) as focus_day
          from sessions
          where status in ('completed', 'cancelled')
        ),
        ranked_focus_days as (
          select
            focus_day,
            row_number() over (order by focus_day desc)::integer as position
          from focus_days
        ),
        current_streak as (
          select
            case
              when max(focus_day) is null
                or max(focus_day) < current_date - 1
              then 0
              else count(*) filter (
                where focus_day + position = (
                  select focus_day + position
                  from ranked_focus_days
                  order by focus_day desc
                  limit 1
                )
              )
            end as current_streak_days
          from ranked_focus_days
        ),
        weekly_focus as (
          select
            date(started_at) as focus_day,
            coalesce(sum(duration_seconds), 0) as total_focus_seconds
          from sessions
          where status in ('completed', 'cancelled')
            and started_at >= date_trunc('week', current_date)
            and started_at < date_trunc('week', current_date) + interval '7 days'
          group by date(started_at)
        )
        select
          summary.*,
          (select count(*) from focus_days) as "focusDays",
          coalesce(current_streak.current_streak_days, 0) as "currentStreakDays",
          coalesce(
            (
              select json_agg(
                json_build_object(
                  'date', to_char(weekly_focus.focus_day, 'YYYY-MM-DD'),
                  'totalFocusSeconds', weekly_focus.total_focus_seconds
                )
                order by weekly_focus.focus_day
              )
              from weekly_focus
            ),
            '[]'::json
          ) as "weeklyFocus"
        from summary
        cross join current_streak
      `,
      [userId],
    );

    return this.mapRow(rows[0]);
  }

  private mapRow(row: FocusMetricsRow | undefined): FocusMetricsSummary {
    const totalFocusSeconds = this.toNumber(row?.totalFocusSeconds);
    const weeklyFocus = this.parseWeeklyFocus(row?.weeklyFocus).map(
      (day): FocusMetricDay => {
        const dayFocusSeconds = this.toNumber(day.totalFocusSeconds);
        return {
          date: day.date,
          totalFocusSeconds: dayFocusSeconds,
          totalFocusMinutes: Math.floor(dayFocusSeconds / 60),
        };
      },
    );

    return {
      totalSessions: this.toNumber(row?.totalSessions),
      completedSessions: this.toNumber(row?.completedSessions),
      cancelledSessions: this.toNumber(row?.cancelledSessions),
      activeSessions: this.toNumber(row?.activeSessions),
      ritualSessions: this.toNumber(row?.ritualSessions),
      modeSessions: this.toNumber(row?.modeSessions),
      totalFocusSeconds,
      totalFocusMinutes: Math.floor(totalFocusSeconds / 60),
      focusDays: this.toNumber(row?.focusDays),
      currentStreakDays: this.toNumber(row?.currentStreakDays),
      lastSessionAt: row?.lastSessionAt
        ? new Date(row.lastSessionAt)
        : null,
      weeklyFocus,
    };
  }

  private parseWeeklyFocus(
    value: WeeklyFocusRow[] | string | null | undefined,
  ): WeeklyFocusRow[] {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as WeeklyFocusRow[]) : [];
    } catch {
      return [];
    }
  }

  private toNumber(value: string | number | null | undefined): number {
    return Number(value ?? 0);
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
