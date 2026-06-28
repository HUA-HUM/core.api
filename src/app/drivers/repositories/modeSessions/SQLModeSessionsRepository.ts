import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IModeSessionsRepository } from '../../../../core/adapters/repositories/modeSessions/IModeSessionsRepository';
import {
  FinishModeSessionData,
  ModeSession,
  ModeSessionEndSource,
  ModeSessionStartSource,
  ModeSessionStatus,
  StartModeSessionData,
} from '../../../../core/entities/modeSessions/ModeSession';
import { ModeSessionSummary } from '../../../../core/entities/modeSessions/ModeSessionSummary';

interface ModeSessionSummaryRow {
  totalSessions: string | number;
  completedSessions: string | number;
  cancelledSessions: string | number;
  activeSessions: string | number;
  totalFocusSeconds: string | number | null;
  lastSessionAt: Date | null;
}

interface ModeSessionRow {
  id: string;
  userId: string;
  user_id?: string;
  modeId: string;
  mode_id?: string;
  startedAt: Date;
  started_at?: Date;
  endedAt: Date | null;
  ended_at?: Date | null;
  status: ModeSessionStatus;
  startSource: ModeSessionStartSource;
  start_source?: ModeSessionStartSource;
  endSource: ModeSessionEndSource | null;
  end_source?: ModeSessionEndSource | null;
  durationSeconds: number | null;
  duration_seconds?: number | null;
  createdAt: Date;
  created_at?: Date;
  updatedAt: Date;
  updated_at?: Date;
}

@Injectable()
export class SQLModeSessionsRepository implements IModeSessionsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(data: StartModeSessionData): Promise<ModeSession> {
    const rows = await this.queryRows<ModeSessionRow>(
      `
        insert into mode_sessions (
          user_id,
          mode_id,
          start_source,
          status
        )
        values ($1, $2, $3, 'active')
        returning
          id,
          user_id as "userId",
          mode_id as "modeId",
          started_at as "startedAt",
          ended_at as "endedAt",
          status,
          start_source as "startSource",
          end_source as "endSource",
          duration_seconds as "durationSeconds",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [data.userId, data.modeId, data.startSource],
    );

    return this.mapRowToModeSession(rows[0]);
  }

  async findActiveByUserId(userId: string): Promise<ModeSession | null> {
    const rows = await this.queryRows<ModeSessionRow>(
      `
        select
          id,
          user_id as "userId",
          mode_id as "modeId",
          started_at as "startedAt",
          ended_at as "endedAt",
          status,
          start_source as "startSource",
          end_source as "endSource",
          duration_seconds as "durationSeconds",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from mode_sessions
        where user_id = $1
          and status = 'active'
        order by started_at desc
        limit 1
      `,
      [userId],
    );

    return rows[0] ? this.mapRowToModeSession(rows[0]) : null;
  }

  async findById(id: string): Promise<ModeSession | null> {
    const rows = await this.queryRows<ModeSessionRow>(
      `
        select
          id,
          user_id as "userId",
          mode_id as "modeId",
          started_at as "startedAt",
          ended_at as "endedAt",
          status,
          start_source as "startSource",
          end_source as "endSource",
          duration_seconds as "durationSeconds",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from mode_sessions
        where id = $1
        limit 1
      `,
      [id],
    );

    return rows[0] ? this.mapRowToModeSession(rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<ModeSession[]> {
    const rows = await this.queryRows<ModeSessionRow>(
      `
        select
          id,
          user_id as "userId",
          mode_id as "modeId",
          started_at as "startedAt",
          ended_at as "endedAt",
          status,
          start_source as "startSource",
          end_source as "endSource",
          duration_seconds as "durationSeconds",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from mode_sessions
        where user_id = $1
        order by started_at desc
        limit 100
      `,
      [userId],
    );

    return rows.map((row) => this.mapRowToModeSession(row));
  }

  async findByUserIdAndModeId(
    userId: string,
    modeId: string,
  ): Promise<ModeSession[]> {
    const rows = await this.queryRows<ModeSessionRow>(
      `
        select
          id,
          user_id as "userId",
          mode_id as "modeId",
          started_at as "startedAt",
          ended_at as "endedAt",
          status,
          start_source as "startSource",
          end_source as "endSource",
          duration_seconds as "durationSeconds",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from mode_sessions
        where user_id = $1
          and mode_id = $2
        order by started_at desc
        limit 100
      `,
      [userId, modeId],
    );

    return rows.map((row) => this.mapRowToModeSession(row));
  }

  async getSummaryByUserId(userId: string): Promise<ModeSessionSummary> {
    const rows = await this.queryRows<ModeSessionSummaryRow>(
      `
        select
          count(*) as "totalSessions",
          count(*) filter (where status = 'completed') as "completedSessions",
          count(*) filter (where status = 'cancelled') as "cancelledSessions",
          count(*) filter (where status = 'active') as "activeSessions",
          coalesce(sum(duration_seconds) filter (where status in ('completed', 'cancelled')), 0) as "totalFocusSeconds",
          max(coalesce(ended_at, started_at)) as "lastSessionAt"
        from mode_sessions
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

  async finish(data: FinishModeSessionData): Promise<ModeSession | null> {
    const rows = await this.queryRows<ModeSessionRow>(
      `
        update mode_sessions
        set
          status = $3,
          end_source = $4,
          ended_at = now(),
          duration_seconds = greatest(
            0,
            floor(extract(epoch from (now() - started_at)))::int
          ),
          updated_at = now()
        where id = $1
          and user_id = $2
          and status = 'active'
        returning id
      `,
      [data.id, data.userId, data.status, data.endSource],
    );

    if (!rows[0]) {
      const existingRows = await this.queryRows<ModeSessionRow>(
        `
          select
            id,
            user_id as "userId",
            mode_id as "modeId",
            started_at as "startedAt",
            ended_at as "endedAt",
            status,
            start_source as "startSource",
            end_source as "endSource",
            duration_seconds as "durationSeconds",
            created_at as "createdAt",
            updated_at as "updatedAt"
          from mode_sessions
          where id = $1
            and user_id = $2
          limit 1
        `,
        [data.id, data.userId],
      );

      return existingRows[0] ? this.mapRowToModeSession(existingRows[0]) : null;
    }

    return this.findById(rows[0].id);
  }

  private async getCurrentStreakDays(userId: string): Promise<number> {
    const rows = await this.queryRows<{ sessionDay: Date }>(
      `
        select distinct date(coalesce(ended_at, started_at)) as "sessionDay"
        from mode_sessions
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

    if (!focusDays.has(this.utcDateKey(cursor))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

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

  private mapRowToModeSession(row: ModeSessionRow): ModeSession {
    return {
      id: row.id,
      userId: row.userId ?? row.user_id ?? '',
      modeId: row.modeId ?? row.mode_id ?? '',
      startedAt: this.toDate(row.startedAt ?? row.started_at),
      endedAt: this.toNullableDate(row.endedAt ?? row.ended_at),
      status: row.status,
      startSource: row.startSource ?? row.start_source ?? 'manual',
      endSource: row.endSource ?? row.end_source ?? null,
      durationSeconds: row.durationSeconds ?? row.duration_seconds ?? null,
      createdAt: this.toDate(row.createdAt ?? row.created_at),
      updatedAt: this.toDate(row.updatedAt ?? row.updated_at),
    };
  }

  private toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
  }

  private toNullableDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return this.toDate(value);
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
