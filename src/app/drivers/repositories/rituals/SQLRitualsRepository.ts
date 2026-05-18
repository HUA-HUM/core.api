import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  CreateRitualData,
  Ritual,
  RitualStatus,
} from '../../../../core/entities/rituals/Ritual';
import { IRitualsRepository } from '../../../../core/adapters/repositories/rituals/IRitualsRepository';

interface RitualRow {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  icon: string;
  durationMinutes: number;
  weekdays: number[];
  startTime: string | null;
  endTime: string | null;
  appCount: number;
  categoryCount: number;
  domainCount: number;
  selectionDigest: string | null;
  status: RitualStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SQLRitualsRepository implements IRitualsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(data: CreateRitualData): Promise<Ritual> {
    const rows = await this.queryRows<RitualRow>(
      `
        insert into rituals (
          user_id,
          title,
          description,
          icon,
          duration_minutes,
          weekdays,
          start_time,
          end_time,
          app_count,
          category_count,
          domain_count,
          selection_digest,
          status
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
        returning
          id,
          user_id as "userId",
          title,
          description,
          icon,
          duration_minutes as "durationMinutes",
          weekdays,
          start_time as "startTime",
          end_time as "endTime",
          app_count as "appCount",
          category_count as "categoryCount",
          domain_count as "domainCount",
          selection_digest as "selectionDigest",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [
        data.userId,
        data.title,
        data.description ?? null,
        data.icon,
        data.durationMinutes,
        data.weekdays,
        data.startTime ?? null,
        data.endTime ?? null,
        data.appCount,
        data.categoryCount,
        data.domainCount,
        data.selectionDigest ?? null,
      ],
    );

    return this.mapRowToRitual(rows[0]);
  }

  async findById(id: string): Promise<Ritual | null> {
    const rows = await this.queryRows<RitualRow>(
      `
        select
          id,
          user_id as "userId",
          title,
          description,
          icon,
          duration_minutes as "durationMinutes",
          weekdays,
          start_time as "startTime",
          end_time as "endTime",
          app_count as "appCount",
          category_count as "categoryCount",
          domain_count as "domainCount",
          selection_digest as "selectionDigest",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        from rituals
        where id = $1
        limit 1
      `,
      [id],
    );

    return rows[0] ? this.mapRowToRitual(rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<Ritual[]> {
    const rows = await this.queryRows<RitualRow>(
      `
        select
          id,
          user_id as "userId",
          title,
          description,
          icon,
          duration_minutes as "durationMinutes",
          weekdays,
          start_time as "startTime",
          end_time as "endTime",
          app_count as "appCount",
          category_count as "categoryCount",
          domain_count as "domainCount",
          selection_digest as "selectionDigest",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        from rituals
        where user_id = $1
        order by created_at desc
      `,
      [userId],
    );

    return rows.map((row) => this.mapRowToRitual(row));
  }

  private mapRowToRitual(row: RitualRow): Ritual {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      icon: row.icon,
      durationMinutes: row.durationMinutes,
      weekdays: row.weekdays,
      startTime: row.startTime,
      endTime: row.endTime,
      appCount: row.appCount,
      categoryCount: row.categoryCount,
      domainCount: row.domainCount,
      selectionDigest: row.selectionDigest,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
