import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IRitualBlockedItemsRepository } from '../../../../core/adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import {
  CreateRitualBlockedItemData,
  RitualBlockedItem,
  RitualBlockedItemPlatform,
  RitualBlockedItemType,
} from '../../../../core/entities/ritualBlockedItems/RitualBlockedItem';

interface RitualBlockedItemRow {
  id: string;
  ritualId: string;
  platform: RitualBlockedItemPlatform;
  type: RitualBlockedItemType;
  identifier: string;
  displayName: string | null;
  applicationIdentifier: string | null;
  bundleIdentifier: string | null;
  createdAt: Date;
}

@Injectable()
export class SQLRitualBlockedItemsRepository implements IRitualBlockedItemsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findByRitualId(
    ritualId: string,
    platform: RitualBlockedItemPlatform,
  ): Promise<RitualBlockedItem[]> {
    const rows = await this.queryRows<RitualBlockedItemRow>(
      `
        select
          id,
          ritual_id as "ritualId",
          platform,
          type,
          identifier,
          display_name as "displayName",
          application_identifier as "applicationIdentifier",
          bundle_identifier as "bundleIdentifier",
          created_at as "createdAt"
        from ritual_blocked_items
        where ritual_id = $1
          and platform = $2
        order by created_at asc
      `,
      [ritualId, platform],
    );

    return rows.map((row) => this.mapRowToRitualBlockedItem(row));
  }

  async replaceForRitual(
    ritualId: string,
    platform: RitualBlockedItemPlatform,
    items: CreateRitualBlockedItemData[],
  ): Promise<RitualBlockedItem[]> {
    return this.entityManager.transaction(async (manager) => {
      await manager.query(
        `
          delete from ritual_blocked_items
          where ritual_id = $1
            and platform = $2
        `,
        [ritualId, platform],
      );

      if (items.length === 0) {
        return [];
      }

      const createdItems: RitualBlockedItem[] = [];

      for (const item of items) {
        const rows = (await manager.query(
          `
            insert into ritual_blocked_items (
              ritual_id,
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
              ritual_id as "ritualId",
              platform,
              type,
              identifier,
              display_name as "displayName",
              application_identifier as "applicationIdentifier",
              bundle_identifier as "bundleIdentifier",
              created_at as "createdAt"
          `,
          [
            ritualId,
            platform,
            item.type,
            item.identifier,
            item.displayName ?? null,
            item.applicationIdentifier ?? item.bundleIdentifier ?? null,
            item.bundleIdentifier ?? null,
          ],
        )) as RitualBlockedItemRow[];

        createdItems.push(this.mapRowToRitualBlockedItem(rows[0]));
      }

      return createdItems;
    });
  }

  private mapRowToRitualBlockedItem(
    row: RitualBlockedItemRow,
  ): RitualBlockedItem {
    return {
      id: row.id,
      ritualId: row.ritualId,
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
