import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IRitualBlockedItemsRepository } from '../../../../core/adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import {
  CreateRitualBlockedItemData,
  RitualBlockedItem,
  RitualBlockedItemType,
} from '../../../../core/entities/ritualBlockedItems/RitualBlockedItem';

interface RitualBlockedItemRow {
  id: string;
  ritualId: string;
  type: RitualBlockedItemType;
  identifier: string;
  displayName: string | null;
  bundleIdentifier: string | null;
  createdAt: Date;
}

@Injectable()
export class SQLRitualBlockedItemsRepository
  implements IRitualBlockedItemsRepository
{
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findByRitualId(ritualId: string): Promise<RitualBlockedItem[]> {
    const rows = await this.queryRows<RitualBlockedItemRow>(
      `
        select
          id,
          ritual_id as "ritualId",
          type,
          identifier,
          display_name as "displayName",
          bundle_identifier as "bundleIdentifier",
          created_at as "createdAt"
        from ritual_blocked_items
        where ritual_id = $1
        order by created_at asc
      `,
      [ritualId],
    );

    return rows.map((row) => this.mapRowToRitualBlockedItem(row));
  }

  async replaceForRitual(
    ritualId: string,
    items: CreateRitualBlockedItemData[],
  ): Promise<RitualBlockedItem[]> {
    return this.entityManager.transaction(async (manager) => {
      await manager.query(
        `
          delete from ritual_blocked_items
          where ritual_id = $1
        `,
        [ritualId],
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
              type,
              identifier,
              display_name,
              bundle_identifier
            )
            values ($1, $2, $3, $4, $5)
            returning
              id,
              ritual_id as "ritualId",
              type,
              identifier,
              display_name as "displayName",
              bundle_identifier as "bundleIdentifier",
              created_at as "createdAt"
          `,
          [
            ritualId,
            item.type,
            item.identifier,
            item.displayName ?? null,
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
      type: row.type,
      identifier: row.identifier,
      displayName: row.displayName,
      bundleIdentifier: row.bundleIdentifier,
      createdAt: new Date(row.createdAt),
    };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
