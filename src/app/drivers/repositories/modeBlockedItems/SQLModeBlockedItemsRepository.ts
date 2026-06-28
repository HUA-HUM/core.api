import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IModeBlockedItemsRepository } from '../../../../core/adapters/repositories/modeBlockedItems/IModeBlockedItemsRepository';
import {
  CreateModeBlockedItemData,
  ModeBlockedItem,
  ModeBlockedItemPlatform,
  ModeBlockedItemType,
} from '../../../../core/entities/modeBlockedItems/ModeBlockedItem';

interface ModeBlockedItemRow {
  id: string;
  modeId: string;
  platform: ModeBlockedItemPlatform;
  type: ModeBlockedItemType;
  identifier: string;
  displayName: string | null;
  applicationIdentifier: string | null;
  bundleIdentifier: string | null;
  createdAt: Date;
}

@Injectable()
export class SQLModeBlockedItemsRepository implements IModeBlockedItemsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findByModeId(
    modeId: string,
    platform: ModeBlockedItemPlatform,
  ): Promise<ModeBlockedItem[]> {
    const rows = await this.queryRows<ModeBlockedItemRow>(
      `
        select
          id,
          mode_id as "modeId",
          platform,
          type,
          identifier,
          display_name as "displayName",
          application_identifier as "applicationIdentifier",
          bundle_identifier as "bundleIdentifier",
          created_at as "createdAt"
        from mode_blocked_items
        where mode_id = $1
          and platform = $2
        order by created_at asc
      `,
      [modeId, platform],
    );

    return rows.map((row) => this.mapRowToModeBlockedItem(row));
  }

  async replaceForMode(
    modeId: string,
    platform: ModeBlockedItemPlatform,
    items: CreateModeBlockedItemData[],
  ): Promise<ModeBlockedItem[]> {
    return this.entityManager.transaction(async (manager) => {
      await manager.query(
        `
          delete from mode_blocked_items
          where mode_id = $1
            and platform = $2
        `,
        [modeId, platform],
      );

      if (items.length === 0) {
        return [];
      }

      const createdItems: ModeBlockedItem[] = [];

      for (const item of items) {
        const rows = (await manager.query(
          `
            insert into mode_blocked_items (
              mode_id,
              platform,
              type,
              identifier,
              display_name,
              application_identifier,
              bundle_identifier
            )
            values ($1, $2, $3, $4, $5, $6, $7)
            returning
              id,
              mode_id as "modeId",
              platform,
              type,
              identifier,
              display_name as "displayName",
              application_identifier as "applicationIdentifier",
              bundle_identifier as "bundleIdentifier",
              created_at as "createdAt"
          `,
          [
            modeId,
            platform,
            item.type,
            item.identifier,
            item.displayName ?? null,
            item.applicationIdentifier ?? item.bundleIdentifier ?? null,
            item.bundleIdentifier ?? null,
          ],
        )) as ModeBlockedItemRow[];

        createdItems.push(this.mapRowToModeBlockedItem(rows[0]));
      }

      return createdItems;
    });
  }

  private mapRowToModeBlockedItem(row: ModeBlockedItemRow): ModeBlockedItem {
    return {
      id: row.id,
      modeId: row.modeId,
      platform: row.platform,
      type: row.type,
      identifier: row.identifier,
      displayName: row.displayName,
      applicationIdentifier: row.applicationIdentifier,
      bundleIdentifier: row.bundleIdentifier,
      createdAt: new Date(row.createdAt),
    };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
