import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  RitualBreakSettings,
  SaveRitualBreakSettingsData,
} from '../../../../core/entities/ritualBreaks/RitualBreakSettings';
import { IRitualBreaksRepository } from '../../../../core/adapters/repositories/ritualBreaks/IRitualBreaksRepository';

interface RitualBreaksRow {
  ritualId: string;
  breakCount: number;
  breakDurationMinutes: number;
}

@Injectable()
export class SQLRitualBreaksRepository implements IRitualBreaksRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async ensureSchema(): Promise<void> {
    await this.entityManager.query(`
      create table if not exists ritual_breaks (
        ritual_id uuid primary key references rituals(id) on delete cascade,
        break_count integer not null default 0,
        break_duration_minutes integer not null default 5,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        check (break_count between 0 and 3),
        check (break_duration_minutes between 1 and 5)
      )
    `);
  }

  async findByRitualId(ritualId: string): Promise<RitualBreakSettings | null> {
    const rows = await this.queryRows<RitualBreaksRow>(
      `
        select
          ritual_id as "ritualId",
          break_count as "breakCount",
          break_duration_minutes as "breakDurationMinutes"
        from ritual_breaks
        where ritual_id = $1
        limit 1
      `,
      [ritualId],
    );

    return rows[0] ? this.mapRowToSettings(rows[0]) : null;
  }

  async save(
    data: SaveRitualBreakSettingsData,
  ): Promise<RitualBreakSettings> {
    const rows = await this.queryRows<RitualBreaksRow>(
      `
        insert into ritual_breaks (ritual_id, break_count, break_duration_minutes)
        values ($1, $2, $3)
        on conflict (ritual_id) do update set
          break_count = excluded.break_count,
          break_duration_minutes = excluded.break_duration_minutes,
          updated_at = now()
        returning
          ritual_id as "ritualId",
          break_count as "breakCount",
          break_duration_minutes as "breakDurationMinutes"
      `,
      [data.ritualId, data.breakCount, data.breakDurationMinutes],
    );

    return this.mapRowToSettings(rows[0]);
  }

  private mapRowToSettings(row: RitualBreaksRow): RitualBreakSettings {
    return {
      ritualId: row.ritualId,
      breakCount: row.breakCount,
      breakDurationMinutes: row.breakDurationMinutes,
    };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
