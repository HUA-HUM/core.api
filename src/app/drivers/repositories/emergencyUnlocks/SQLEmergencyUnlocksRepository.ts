import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IEmergencyUnlocksRepository } from '../../../../core/adapters/repositories/emergencyUnlocks/IEmergencyUnlocksRepository';
import {
  EmergencyUnlock,
  EmergencyUnlockSessionType,
  EmergencyUnlockStatus,
  UseEmergencyUnlockData,
} from '../../../../core/entities/emergencyUnlocks/EmergencyUnlock';
import { ActiveFocusSessionRequiredError } from '../../../../core/interactors/emergencyUnlocks/ActiveFocusSessionRequiredError';
import { EmergencyUnlockCooldownError } from '../../../../core/interactors/emergencyUnlocks/EmergencyUnlockCooldownError';

interface EmergencyUnlockRow {
  id: string;
  userId: string;
  sessionType: EmergencyUnlockSessionType;
  sessionId: string;
  reason: UseEmergencyUnlockData['reason'];
  tagMarkedLost: boolean;
  usedAt: Date | string;
  nextAvailableAt: Date | string;
}

@Injectable()
export class SQLEmergencyUnlocksRepository implements IEmergencyUnlocksRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getStatus(
    userId: string,
    cooldownDays: number,
  ): Promise<EmergencyUnlockStatus> {
    const rows = await this.queryRows<{
      lastUsedAt: Date | string | null;
      nextAvailableAt: Date | string | null;
      available: boolean;
    }>(
      this.entityManager,
      `
        select
          latest.used_at as "lastUsedAt",
          latest.used_at + ($2::integer * interval '1 day') as "nextAvailableAt",
          coalesce(latest.used_at + ($2::integer * interval '1 day') <= now(), true) as available
        from (select 1) seed
        left join lateral (
          select used_at
          from emergency_unlocks
          where user_id = $1
          order by used_at desc
          limit 1
        ) latest on true
      `,
      [userId, cooldownDays],
    );

    const row = rows[0];
    return {
      available: row?.available ?? true,
      cooldownDays,
      lastUsedAt: this.toNullableDate(row?.lastUsedAt),
      nextAvailableAt: this.toNullableDate(row?.nextAvailableAt),
    };
  }

  async use(
    data: UseEmergencyUnlockData,
    cooldownDays: number,
  ): Promise<EmergencyUnlock> {
    return this.entityManager.transaction(async (manager) => {
      await manager.query(
        'select pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`emergency-unlock:${data.userId}`],
      );

      const status = await this.getStatusWithManager(
        manager,
        data.userId,
        cooldownDays,
      );

      if (!status.available && status.nextAvailableAt) {
        throw new EmergencyUnlockCooldownError(status.nextAvailableAt);
      }

      const activeRows = await this.queryRows<{
        sessionType: EmergencyUnlockSessionType;
        sessionId: string;
      }>(
        manager,
        `
          select 'ritual'::text as "sessionType", id::text as "sessionId"
          from ritual_sessions
          where user_id = $1 and status = 'active'
          union all
          select 'mode'::text as "sessionType", id::text as "sessionId"
          from mode_sessions
          where user_id = $1 and status = 'active'
          limit 1
        `,
        [data.userId],
      );

      const active = activeRows[0];
      if (!active) {
        throw new ActiveFocusSessionRequiredError();
      }

      const sessionTable =
        active.sessionType === 'ritual' ? 'ritual_sessions' : 'mode_sessions';

      const updatedRows = await this.queryRows<{ id: string }>(
        manager,
        `
          update ${sessionTable}
          set
            status = 'cancelled',
            ended_at = now(),
            end_source = 'emergency',
            duration_seconds = greatest(
              floor(extract(epoch from (now() - started_at)))::integer,
              0
            ),
            updated_at = now()
          where id = $1
            and user_id = $2
            and status = 'active'
          returning id::text as id
        `,
        [active.sessionId, data.userId],
      );

      if (!updatedRows[0]) {
        throw new ActiveFocusSessionRequiredError();
      }

      const tagMarkedLost = data.reason === 'lost_tag';
      if (tagMarkedLost) {
        await manager.query(
          `
            update nfc_tags
            set status = 'lost', updated_at = now()
            where id in (
              select tag_id
              from nfc_tag_claims
              where user_id = $1 and status = 'active'
            )
          `,
          [data.userId],
        );
        await manager.query(
          `
            update nfc_tag_claims
            set status = 'revoked', updated_at = now()
            where user_id = $1 and status = 'active'
          `,
          [data.userId],
        );
      }

      const rows = await this.queryRows<EmergencyUnlockRow>(
        manager,
        `
          insert into emergency_unlocks (
            user_id,
            session_type,
            session_id,
            reason,
            tag_marked_lost,
            next_available_at
          )
          values ($1, $2, $3, $4, $5, now() + ($6::integer * interval '1 day'))
          returning
            id::text as id,
            user_id::text as "userId",
            session_type as "sessionType",
            session_id::text as "sessionId",
            reason,
            tag_marked_lost as "tagMarkedLost",
            used_at as "usedAt",
            next_available_at as "nextAvailableAt"
        `,
        [
          data.userId,
          active.sessionType,
          active.sessionId,
          data.reason,
          tagMarkedLost,
          cooldownDays,
        ],
      );

      return this.mapRow(rows[0]);
    });
  }

  private async getStatusWithManager(
    manager: EntityManager,
    userId: string,
    cooldownDays: number,
  ): Promise<EmergencyUnlockStatus> {
    const rows = await this.queryRows<{
      lastUsedAt: Date | string | null;
      nextAvailableAt: Date | string | null;
      available: boolean;
    }>(
      manager,
      `
        select
          latest.used_at as "lastUsedAt",
          latest.used_at + ($2::integer * interval '1 day') as "nextAvailableAt",
          coalesce(latest.used_at + ($2::integer * interval '1 day') <= now(), true) as available
        from (select 1) seed
        left join lateral (
          select used_at
          from emergency_unlocks
          where user_id = $1
          order by used_at desc
          limit 1
        ) latest on true
      `,
      [userId, cooldownDays],
    );
    const row = rows[0];
    return {
      available: row?.available ?? true,
      cooldownDays,
      lastUsedAt: this.toNullableDate(row?.lastUsedAt),
      nextAvailableAt: this.toNullableDate(row?.nextAvailableAt),
    };
  }

  private mapRow(row: EmergencyUnlockRow | undefined): EmergencyUnlock {
    if (!row) {
      throw new Error('Emergency unlock row was not returned');
    }

    return {
      ...row,
      usedAt: new Date(row.usedAt),
      nextAvailableAt: new Date(row.nextAvailableAt),
    };
  }

  private toNullableDate(value: Date | string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }

  private async queryRows<T>(
    manager: EntityManager,
    sql: string,
    params: unknown[],
  ): Promise<T[]> {
    const result: unknown = await manager.query(sql, params);
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
