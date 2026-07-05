import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IFocusSessionsRepository } from '../../../../core/adapters/repositories/focusSessions/IFocusSessionsRepository';
import {
  ActiveFocusSession,
  ActiveFocusSessionType,
} from '../../../../core/entities/focusSessions/ActiveFocusSession';

interface ActiveFocusSessionRow {
  type: ActiveFocusSessionType;
  id: string;
  userId: string;
  ritualId: string | null;
  modeId: string | null;
  startedAt: Date | string;
  plannedEndAt: Date | string | null;
  endedAt: Date | string | null;
  status: 'active';
  startSource: string;
  endSource: string | null;
  durationSeconds: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

@Injectable()
export class SQLFocusSessionsRepository implements IFocusSessionsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findActiveByUserId(userId: string): Promise<ActiveFocusSession | null> {
    const rows = (await this.entityManager.query(
      `
        select
          'ritual'::text as type,
          id,
          user_id as "userId",
          ritual_id as "ritualId",
          null::uuid as "modeId",
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
        where user_id = $1 and status = 'active'

        union all

        select
          'mode'::text as type,
          id,
          user_id as "userId",
          null::uuid as "ritualId",
          mode_id as "modeId",
          started_at as "startedAt",
          null::timestamptz as "plannedEndAt",
          ended_at as "endedAt",
          status,
          start_source as "startSource",
          end_source as "endSource",
          duration_seconds as "durationSeconds",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from mode_sessions
        where user_id = $1 and status = 'active'
        order by "startedAt" desc
        limit 1
      `,
      [userId],
    )) as ActiveFocusSessionRow[];

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  private mapRow(row: ActiveFocusSessionRow): ActiveFocusSession {
    return {
      ...row,
      startedAt: new Date(row.startedAt),
      plannedEndAt: row.plannedEndAt ? new Date(row.plannedEndAt) : null,
      endedAt: row.endedAt ? new Date(row.endedAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
