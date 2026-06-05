import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IRitualSessionsRepository } from '../../../../core/adapters/repositories/ritualSessions/IRitualSessionsRepository';
import {
  FinishRitualSessionData,
  RecordRitualSessionData,
  RitualSession,
  RitualSessionEndSource,
  RitualSessionStartSource,
  RitualSessionStatus,
  StartRitualSessionData,
} from '../../../../core/entities/ritualSessions/RitualSession';
import { RitualSessionSummary } from '../../../../core/entities/ritualSessions/RitualSessionSummary';

interface RitualSessionSummaryRow {
  totalSessions: string | number;
  completedSessions: string | number;
  cancelledSessions: string | number;
  activeSessions: string | number;
  totalFocusSeconds: string | number | null;
  lastSessionAt: Date | null;
}

interface RitualSessionRow {
  id: string;
  userId: string;
  ritualId: string;
  startedAt: Date;
  plannedEndAt: Date | null;
  endedAt: Date | null;
  status: RitualSessionStatus;
  startSource: RitualSessionStartSource;
  endSource: RitualSessionEndSource | null;
  durationSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SQLRitualSessionsRepository implements IRitualSessionsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(data: StartRitualSessionData): Promise<RitualSession> {
    const rows = await this.queryRows<RitualSessionRow>(
      `
        insert into ritual_sessions (
          user_id,
          ritual_id,
          planned_end_at,
          start_source,
          status
        )
        values ($1, $2, $3, $4, 'active')
        returning
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
      `,
      [
        data.userId,
        data.ritualId,
        data.plannedEndAt ?? null,
        data.startSource,
      ],
    );

    return this.mapRowToRitualSession(rows[0]);
  }

  async record(data: RecordRitualSessionData): Promise<RitualSession> {
    const rows = await this.queryRows<RitualSessionRow>(
      `
        insert into ritual_sessions (
          user_id,
          ritual_id,
          started_at,
          planned_end_at,
          ended_at,
          status,
          start_source,
          end_source,
          duration_seconds
        )
        values (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          greatest(0, floor(extract(epoch from (($5)::timestamptz - ($3)::timestamptz)))::int)
        )
        returning
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
      `,
      [
        data.userId,
        data.ritualId,
        data.startedAt,
        data.plannedEndAt ?? null,
        data.endedAt ?? data.plannedEndAt ?? data.startedAt,
        data.status,
        data.startSource,
        data.endSource,
      ],
    );

    return this.mapRowToRitualSession(rows[0]);
  }

  async findActiveByUserId(userId: string): Promise<RitualSession | null> {
    await this.completeExpiredActiveSessions(userId);

    const rows = await this.queryRows<RitualSessionRow>(
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
        where user_id = $1
          and status = 'active'
        order by started_at desc
        limit 1
      `,
      [userId],
    );

    return rows[0] ? this.mapRowToRitualSession(rows[0]) : null;
  }

  async findById(id: string): Promise<RitualSession | null> {
    const rows = await this.queryRows<RitualSessionRow>(
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
        where id = $1
        limit 1
      `,
      [id],
    );

    return rows[0] ? this.mapRowToRitualSession(rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<RitualSession[]> {
    await this.completeExpiredActiveSessions(userId);

    const rows = await this.queryRows<RitualSessionRow>(
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
        where user_id = $1
        order by started_at desc
        limit 100
      `,
      [userId],
    );

    return rows.map((row) => this.mapRowToRitualSession(row));
  }


  async findByUserIdAndRitualId(
    userId: string,
    ritualId: string,
  ): Promise<RitualSession[]> {
    await this.completeExpiredActiveSessions(userId);

    const rows = await this.queryRows<RitualSessionRow>(
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
        where user_id = $1
          and ritual_id = $2
        order by started_at desc
        limit 100
      `,
      [userId, ritualId],
    );

    return rows.map((row) => this.mapRowToRitualSession(row));
  }

  async getSummaryByUserId(userId: string): Promise<RitualSessionSummary> {
    await this.completeExpiredActiveSessions(userId);

    const rows = await this.queryRows<RitualSessionSummaryRow>(
      `
        select
          count(*) as "totalSessions",
          count(*) filter (where status = 'completed') as "completedSessions",
          count(*) filter (where status = 'cancelled') as "cancelledSessions",
          count(*) filter (where status = 'active') as "activeSessions",
          coalesce(sum(duration_seconds) filter (where status in ('completed', 'cancelled')), 0) as "totalFocusSeconds",
          max(coalesce(ended_at, started_at)) as "lastSessionAt"
        from ritual_sessions
        where user_id = $1
      `,
      [userId],
    );

    const row = rows[0];
    const totalFocusSeconds = Number(row?.totalFocusSeconds ?? 0);

    return {
      totalSessions: Number(row?.totalSessions ?? 0),
      completedSessions: Number(row?.completedSessions ?? 0),
      cancelledSessions: Number(row?.cancelledSessions ?? 0),
      activeSessions: Number(row?.activeSessions ?? 0),
      totalFocusSeconds,
      totalFocusMinutes: Math.floor(totalFocusSeconds / 60),
      currentStreakDays: await this.getCurrentStreakDays(userId),
      lastSessionAt: row?.lastSessionAt ? new Date(row.lastSessionAt) : null,
    };
  }

  async finish(data: FinishRitualSessionData): Promise<RitualSession | null> {
    const rows = await this.queryRows<RitualSessionRow>(
      `
        update ritual_sessions
        set
          status = $3,
          end_source = $4,
          ended_at = now(),
          duration_seconds = greatest(0, floor(extract(epoch from (now() - started_at)))::int),
          updated_at = now()
        where id = $1
          and user_id = $2
          and status = 'active'
        returning
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
      `,
      [data.id, data.userId, data.status, data.endSource],
    );

    return rows[0] ? this.mapRowToRitualSession(rows[0]) : null;
  }


  private async completeExpiredActiveSessions(userId: string): Promise<void> {
    await this.queryRows(
      `
        update ritual_sessions
        set
          status = 'completed',
          end_source = 'timer',
          ended_at = planned_end_at,
          duration_seconds = greatest(
            0,
            floor(extract(epoch from (planned_end_at - started_at)))::int
          ),
          updated_at = now()
        where user_id = $1
          and status = 'active'
          and planned_end_at is not null
          and planned_end_at <= now()
      `,
      [userId],
    );
  }

  private async getCurrentStreakDays(userId: string): Promise<number> {
    const rows = await this.queryRows<{ sessionDay: Date }>(
      `
        select distinct date(coalesce(ended_at, started_at)) as "sessionDay"
        from ritual_sessions
        where user_id = $1
          and status in ('completed', 'cancelled')
        order by "sessionDay" desc
        limit 60
      `,
      [userId],
    );

    const focusDays = new Set(
      rows.map((row) => this.utcDateKey(new Date(row.sessionDay))),
    );

    let streak = 0;
    const cursor = new Date();

    while (focusDays.has(this.utcDateKey(cursor))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return streak;
  }

  private utcDateKey(date: Date): string {
    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  private mapRowToRitualSession(row: RitualSessionRow): RitualSession {
    return {
      id: row.id,
      userId: row.userId,
      ritualId: row.ritualId,
      startedAt: new Date(row.startedAt),
      plannedEndAt: row.plannedEndAt ? new Date(row.plannedEndAt) : null,
      endedAt: row.endedAt ? new Date(row.endedAt) : null,
      status: row.status,
      startSource: row.startSource,
      endSource: row.endSource,
      durationSeconds: row.durationSeconds,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
