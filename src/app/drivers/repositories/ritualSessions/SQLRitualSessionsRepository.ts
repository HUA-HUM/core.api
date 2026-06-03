import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IRitualSessionsRepository } from '../../../../core/adapters/repositories/ritualSessions/IRitualSessionsRepository';
import {
  FinishRitualSessionData,
  RitualSession,
  RitualSessionEndSource,
  RitualSessionStartSource,
  RitualSessionStatus,
  StartRitualSessionData,
} from '../../../../core/entities/ritualSessions/RitualSession';

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

  async findActiveByUserId(userId: string): Promise<RitualSession | null> {
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
