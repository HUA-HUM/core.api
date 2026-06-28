import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  CreateModeData,
  Mode,
  ModeStatus,
  UpdateModeData,
} from '../../../../core/entities/modes/Mode';
import { IModesRepository } from '../../../../core/adapters/repositories/modes/IModesRepository';

interface ModeRow {
  id: string;
  userId: string;
  templateKey: string;
  title: string;
  icon: string;
  appCount: number;
  categoryCount: number;
  domainCount: number;
  selectionDigest: string | null;
  isProtected: boolean;
  nfcUnlockEnabled: boolean;
  passwordHash: string | null;
  status: ModeStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SQLModesRepository implements IModesRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(data: CreateModeData): Promise<Mode> {
    const rows = await this.queryRows<ModeRow>(
      `
        insert into modes (
          user_id,
          template_key,
          title,
          icon,
          app_count,
          category_count,
          domain_count,
          selection_digest,
          is_protected,
          nfc_unlock_enabled,
          password_hash,
          status
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
        returning
          id,
          user_id as "userId",
          template_key as "templateKey",
          title,
          icon,
          app_count as "appCount",
          category_count as "categoryCount",
          domain_count as "domainCount",
          selection_digest as "selectionDigest",
          is_protected as "isProtected",
          nfc_unlock_enabled as "nfcUnlockEnabled",
          password_hash as "passwordHash",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [
        data.userId,
        data.templateKey,
        data.title,
        data.icon,
        data.appCount,
        data.categoryCount,
        data.domainCount,
        data.selectionDigest ?? null,
        data.isProtected,
        data.nfcUnlockEnabled,
        data.passwordHash ?? null,
      ],
    );

    return this.mapRowToMode(rows[0]);
  }

  async ensureDefaultsForUser(
    userId: string,
    modes: CreateModeData[],
  ): Promise<void> {
    await this.entityManager.transaction(async (manager) => {
      for (const mode of modes) {
        await manager.query(
          `
            insert into modes (
              user_id,
              template_key,
              title,
              icon,
              app_count,
              category_count,
              domain_count,
              selection_digest,
              is_protected,
              nfc_unlock_enabled,
              password_hash,
              status
            )
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
            on conflict (user_id, template_key) do nothing
          `,
          [
            userId,
            mode.templateKey,
            mode.title,
            mode.icon,
            mode.appCount,
            mode.categoryCount,
            mode.domainCount,
            mode.selectionDigest ?? null,
            mode.isProtected,
            mode.nfcUnlockEnabled,
            mode.passwordHash ?? null,
          ],
        );
      }
    });
  }

  async findById(id: string): Promise<Mode | null> {
    const rows = await this.queryRows<ModeRow>(
      `
        select
          id,
          user_id as "userId",
          template_key as "templateKey",
          title,
          icon,
          app_count as "appCount",
          category_count as "categoryCount",
          domain_count as "domainCount",
          selection_digest as "selectionDigest",
          is_protected as "isProtected",
          nfc_unlock_enabled as "nfcUnlockEnabled",
          password_hash as "passwordHash",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        from modes
        where id = $1
        limit 1
      `,
      [id],
    );

    return rows[0] ? this.mapRowToMode(rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<Mode[]> {
    const rows = await this.queryRows<ModeRow>(
      `
        select
          id,
          user_id as "userId",
          template_key as "templateKey",
          title,
          icon,
          app_count as "appCount",
          category_count as "categoryCount",
          domain_count as "domainCount",
          selection_digest as "selectionDigest",
          is_protected as "isProtected",
          nfc_unlock_enabled as "nfcUnlockEnabled",
          password_hash as "passwordHash",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        from modes
        where user_id = $1
          and status = 'active'
        order by
          case template_key
            when 'gym' then 1
            when 'meeting' then 2
            when 'reading' then 3
            when 'work' then 4
            when 'sleep' then 5
            else 99
          end,
          created_at asc
      `,
      [userId],
    );

    return rows.map((row) => this.mapRowToMode(row));
  }

  async updateById(id: string, data: UpdateModeData): Promise<Mode | null> {
    const rows = await this.queryRows<ModeRow>(
      `
        update modes
        set
          title = $2,
          icon = $3,
          app_count = $4,
          category_count = $5,
          domain_count = $6,
          selection_digest = $7,
          is_protected = $8,
          nfc_unlock_enabled = $9,
          password_hash = $10,
          updated_at = now()
        where id = $1
        returning
          id,
          user_id as "userId",
          template_key as "templateKey",
          title,
          icon,
          app_count as "appCount",
          category_count as "categoryCount",
          domain_count as "domainCount",
          selection_digest as "selectionDigest",
          is_protected as "isProtected",
          nfc_unlock_enabled as "nfcUnlockEnabled",
          password_hash as "passwordHash",
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [
        id,
        data.title,
        data.icon,
        data.appCount,
        data.categoryCount,
        data.domainCount,
        data.selectionDigest ?? null,
        data.isProtected,
        data.nfcUnlockEnabled,
        data.passwordHash ?? null,
      ],
    );

    return rows[0] ? this.mapRowToMode(rows[0]) : null;
  }

  private mapRowToMode(row: ModeRow): Mode {
    return {
      id: row.id,
      userId: row.userId,
      templateKey: row.templateKey,
      title: row.title,
      icon: row.icon,
      appCount: row.appCount,
      categoryCount: row.categoryCount,
      domainCount: row.domainCount,
      selectionDigest: row.selectionDigest,
      isProtected: row.isProtected,
      nfcUnlockEnabled: row.nfcUnlockEnabled,
      passwordHash: row.passwordHash,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
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
