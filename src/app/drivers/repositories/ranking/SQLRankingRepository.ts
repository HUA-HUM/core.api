import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IRankingRepository } from '../../../../core/adapters/repositories/ranking/IRankingRepository';
import {
  MonthlyRanking,
  MonthlyRankingOptions,
} from '../../../../core/entities/ranking/MonthlyRanking';

interface RankingRow {
  userId: string;
  position: string | number;
  totalFocusSeconds: string | number;
  participants: string | number;
  anonymousNumber: string | number;
  periodStart: Date | string;
  periodEnd: Date | string;
}

@Injectable()
export class SQLRankingRepository implements IRankingRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getMonthlyRanking(
    userId: string,
    options: MonthlyRankingOptions,
  ): Promise<MonthlyRanking> {
    // Read-only. Focus time = closed sessions (completed/cancelled) that
    // started this calendar month in the configured time zone, each capped
    // so a session left open for days cannot dominate the ranking.
    const rows = await this.queryRows<RankingRow>(
      `
        with bounds as (
          select
            (date_trunc('month', now() at time zone $1) at time zone $1) as start_at,
            ((date_trunc('month', now() at time zone $1) + interval '1 month') at time zone $1) as end_at
        ),
        sessions as (
          select rs.user_id, rs.duration_seconds
          from ritual_sessions rs, bounds
          where rs.started_at >= bounds.start_at
            and rs.started_at < bounds.end_at
            and rs.status <> 'active'
            and rs.duration_seconds is not null
          union all
          select ms.user_id, ms.duration_seconds
          from mode_sessions ms, bounds
          where ms.started_at >= bounds.start_at
            and ms.started_at < bounds.end_at
            and ms.status <> 'active'
            and ms.duration_seconds is not null
        ),
        totals as (
          select
            sessions.user_id,
            sum(least(sessions.duration_seconds, $2::int))::bigint as total_seconds
          from sessions
          join users u on u.id = sessions.user_id and u.status = 'active'
          where lower(coalesce(u.email, '')) <> all($3::text[])
          group by sessions.user_id
          having sum(least(sessions.duration_seconds, $2::int)) > 0
        ),
        aliases as (
          -- Stable anonymous number: order in which the account was created.
          select id, row_number() over (order by created_at, id) as anonymous_number
          from users
          where status = 'active'
        ),
        ranked as (
          select
            user_id,
            total_seconds,
            rank() over (order by total_seconds desc) as position,
            count(*) over () as participants
          from totals
        )
        select
          ranked.user_id as "userId",
          ranked.position,
          ranked.total_seconds as "totalFocusSeconds",
          ranked.participants,
          aliases.anonymous_number as "anonymousNumber",
          bounds.start_at as "periodStart",
          bounds.end_at as "periodEnd"
        from ranked
        join aliases on aliases.id = ranked.user_id
        cross join bounds
        where ranked.position <= $4 or ranked.user_id = $5
        order by ranked.position asc, ranked.user_id asc
      `,
      [
        options.timeZone,
        options.maxSessionSeconds,
        options.excludedEmails,
        options.maxEntries,
        userId,
      ],
    );

    const nameRows = await this.queryRows<{ displayName: string | null }>(
      `select display_name as "displayName" from users where id = $1 limit 1`,
      [userId],
    );
    const displayName = nameRows[0]?.displayName?.trim() || null;

    const totalUsersRows = await this.queryRows<{ total: string | number }>(
      `
        select count(*) as total
        from users
        where status = 'active'
          and lower(coalesce(email, '')) <> all($1::text[])
      `,
      [options.excludedEmails],
    );

    const bounds = rows[0]
      ? {
          start: new Date(rows[0].periodStart),
          end: new Date(rows[0].periodEnd),
        }
      : await this.getBounds(options.timeZone);

    const mine = rows.find((row) => row.userId === userId);

    return {
      periodStart: bounds.start,
      periodEnd: bounds.end,
      timeZone: options.timeZone,
      totalUsers: Number(totalUsersRows[0]?.total ?? 0),
      participants: rows[0] ? Number(rows[0].participants) : 0,
      me: {
        position: mine ? Number(mine.position) : null,
        displayName,
        totalFocusSeconds: mine ? Number(mine.totalFocusSeconds) : 0,
      },
      entries: rows
        .filter((row) => Number(row.position) <= options.maxEntries)
        .map((row) => {
          const isMe = row.userId === userId;
          return {
            position: Number(row.position),
            totalFocusSeconds: Number(row.totalFocusSeconds),
            isMe,
            label:
              isMe && displayName
                ? displayName
                : `Usuario ${Number(row.anonymousNumber)}`,
            displayName: isMe ? displayName : null,
          };
        }),
    };
  }

  private async getBounds(
    timeZone: string,
  ): Promise<{ start: Date; end: Date }> {
    const rows = await this.queryRows<{
      startAt: Date | string;
      endAt: Date | string;
    }>(
      `
        select
          (date_trunc('month', now() at time zone $1) at time zone $1) as "startAt",
          ((date_trunc('month', now() at time zone $1) + interval '1 month') at time zone $1) as "endAt"
      `,
      [timeZone],
    );

    return { start: new Date(rows[0].startAt), end: new Date(rows[0].endAt) };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);

    if (
      Array.isArray(result) &&
      result.length === 2 &&
      Array.isArray(result[0]) &&
      typeof result[1] === 'number'
    ) {
      return result[0] as T[];
    }

    return result as T[];
  }
}
