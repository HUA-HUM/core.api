import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  ModeBreakSettings,
  SaveModeBreakSettingsData,
} from '../../../../core/entities/modeBreaks/ModeBreakSettings';
import { IModeBreaksRepository } from '../../../../core/adapters/repositories/modeBreaks/IModeBreaksRepository';

interface ModeBreaksRow {
  modeId: string;
  breakCount: number;
  breakDurationMinutes: number;
}

@Injectable()
export class SQLModeBreaksRepository implements IModeBreaksRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async ensureSchema(): Promise<void> {
    await this.entityManager.query(`
      create table if not exists mode_breaks (
        mode_id uuid primary key references modes(id) on delete cascade,
        break_count integer not null default 0,
        break_duration_minutes integer not null default 5,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        check (break_count between 0 and 3),
        check (break_duration_minutes between 1 and 5)
      )
    `);
  }

  async findByModeId(modeId: string): Promise<ModeBreakSettings | null> {
    const rows = await this.queryRows<ModeBreaksRow>(
      `
        select
          mode_id as "modeId",
          break_count as "breakCount",
          break_duration_minutes as "breakDurationMinutes"
        from mode_breaks
        where mode_id = $1
        limit 1
      `,
      [modeId],
    );

    return rows[0] ? this.mapRowToSettings(rows[0]) : null;
  }

  async save(data: SaveModeBreakSettingsData): Promise<ModeBreakSettings> {
    const rows = await this.queryRows<ModeBreaksRow>(
      `
        insert into mode_breaks (mode_id, break_count, break_duration_minutes)
        values ($1, $2, $3)
        on conflict (mode_id) do update set
          break_count = excluded.break_count,
          break_duration_minutes = excluded.break_duration_minutes,
          updated_at = now()
        returning
          mode_id as "modeId",
          break_count as "breakCount",
          break_duration_minutes as "breakDurationMinutes"
      `,
      [data.modeId, data.breakCount, data.breakDurationMinutes],
    );

    return this.mapRowToSettings(rows[0]);
  }

  private mapRowToSettings(row: ModeBreaksRow): ModeBreakSettings {
    return {
      modeId: row.modeId,
      breakCount: row.breakCount,
      breakDurationMinutes: row.breakDurationMinutes,
    };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
