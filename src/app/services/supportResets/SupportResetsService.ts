import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';
import { AcknowledgeSupportResetDto } from '../../dtos/supportResets/AcknowledgeSupportResetDto';
import { CreateSupportResetDto } from '../../dtos/supportResets/CreateSupportResetDto';

interface UserRow {
  id: string;
  email: string | null;
  displayName: string | null;
  status: string;
  createdAt: Date | string;
  ritualCount: number | string;
  modeCount: number | string;
  hasNfcTag: boolean;
  pendingResetId: string | null;
}

interface ResetRow {
  id: string;
  userId: string;
  userEmail: string;
  reason: string;
  status: 'pending' | 'applied';
  revokeTag: boolean;
  deletedCounts: Record<string, number>;
  requestedAt: Date | string;
  appliedAt: Date | string | null;
  appVersion: string | null;
  appBuild: string | null;
}

@Injectable()
export class SupportResetsService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async ensureSchema(): Promise<void> {
    await this.entityManager.query(`
      create table if not exists support_reset_requests (
        id uuid primary key,
        user_id uuid not null references users(id) on delete cascade,
        user_email text not null,
        reason text not null,
        status text not null default 'pending' check (status in ('pending', 'applied')),
        revoke_tag boolean not null default false,
        deleted_counts jsonb not null default '{}'::jsonb,
        requested_at timestamptz not null default now(),
        applied_at timestamptz,
        app_version varchar(40),
        app_build varchar(40)
      )
    `);
    await this.entityManager.query(`
      create unique index if not exists support_reset_requests_one_pending_per_user
        on support_reset_requests(user_id)
        where status = 'pending'
    `);
    await this.entityManager.query(`
      create index if not exists support_reset_requests_user_requested_idx
        on support_reset_requests(user_id, requested_at desc)
    `);
  }

  async searchUsers(queryValue: string) {
    const query = queryValue?.trim();
    if (!query || query.length < 3) {
      throw new BadRequestException('query must contain at least 3 characters');
    }

    const rows = (await this.entityManager.query(
      `
        select
          u.id,
          u.email,
          u.display_name as "displayName",
          u.status,
          u.created_at as "createdAt",
          (select count(*) from rituals r where r.user_id = u.id) as "ritualCount",
          (select count(*) from modes m where m.user_id = u.id) as "modeCount",
          exists(select 1 from nfc_tag_claims n where n.user_id = u.id and n.status = 'active') as "hasNfcTag",
          (select s.id from support_reset_requests s
            where s.user_id = u.id and s.status = 'pending'
            order by s.requested_at desc limit 1) as "pendingResetId"
        from users u
        where u.email ilike $1 or u.id::text = $2
        order by case when lower(u.email) = lower($2) then 0 else 1 end, u.created_at desc
        limit 20
      `,
      [`%${query}%`, query],
    )) as UserRow[];

    return rows.map((row) => ({
      ...row,
      ritualCount: Number(row.ritualCount),
      modeCount: Number(row.modeCount),
      createdAt: new Date(row.createdAt),
    }));
  }

  async create(body: CreateSupportResetDto) {
    if (!this.isUuid(body.userId)) {
      throw new BadRequestException('userId must be a UUID');
    }
    if (typeof body.confirmationEmail !== 'string' || !body.confirmationEmail.includes('@')) {
      throw new BadRequestException('confirmationEmail must be a valid email');
    }
    if (typeof body.reason !== 'string' || body.reason.trim().length < 8 || body.reason.length > 1_000) {
      throw new BadRequestException('reason must contain between 8 and 1000 characters');
    }
    if (body.revokeTag !== undefined && typeof body.revokeTag !== 'boolean') {
      throw new BadRequestException('revokeTag must be a boolean');
    }

    return this.entityManager.transaction(async (manager) => {
      const users = (await manager.query(
        `select id, email from users where id = $1 for update`,
        [body.userId],
      )) as Array<{ id: string; email: string | null }>;
      const user = users[0];
      if (!user?.email) {
        throw new NotFoundException('user was not found');
      }
      if (user.email.toLowerCase() !== body.confirmationEmail.trim().toLowerCase()) {
        throw new BadRequestException('confirmationEmail does not match the selected user');
      }

      const pending = (await manager.query(
        `select id from support_reset_requests where user_id = $1 and status = 'pending' limit 1`,
        [user.id],
      )) as Array<{ id: string }>;
      if (pending[0]) {
        throw new ConflictException('this user already has a pending support reset');
      }

      const counts = {
        rituals: Number((await manager.query(
          `select count(*)::int as count from rituals where user_id = $1`,
          [user.id],
        ))[0].count),
        modes: Number((await manager.query(
          `select count(*)::int as count from modes where user_id = $1`,
          [user.id],
        ))[0].count),
        emergencyUnlocks: Number((await manager.query(
          `select count(*)::int as count from emergency_unlocks where user_id = $1`,
          [user.id],
        ))[0].count),
      };

      await manager.query(`delete from idempotency_operations where user_id = $1`, [user.id]);
      await manager.query(`delete from emergency_unlocks where user_id = $1`, [user.id]);
      await manager.query(`delete from ritual_sessions where user_id = $1`, [user.id]);
      await manager.query(`delete from mode_sessions where user_id = $1`, [user.id]);
      await manager.query(`delete from rituals where user_id = $1`, [user.id]);
      await manager.query(`delete from modes where user_id = $1`, [user.id]);
      if (body.revokeTag === true) {
        await manager.query(`delete from nfc_tag_claims where user_id = $1`, [user.id]);
      }

      const rows = (await manager.query(
        `
          insert into support_reset_requests (
            id, user_id, user_email, reason, revoke_tag, deleted_counts
          ) values ($1, $2, $3, $4, $5, $6::jsonb)
          returning
            id,
            user_id as "userId",
            user_email as "userEmail",
            reason,
            status,
            revoke_tag as "revokeTag",
            deleted_counts as "deletedCounts",
            requested_at as "requestedAt",
            applied_at as "appliedAt",
            app_version as "appVersion",
            app_build as "appBuild"
        `,
        [
          randomUUID(),
          user.id,
          user.email,
          body.reason.trim(),
          body.revokeTag === true,
          JSON.stringify(counts),
        ],
      )) as ResetRow[];
      return this.mapReset(rows[0]);
    });
  }

  async pending(userId: string) {
    const rows = (await this.entityManager.query(
      `
        select
          id,
          user_id as "userId",
          user_email as "userEmail",
          reason,
          status,
          revoke_tag as "revokeTag",
          deleted_counts as "deletedCounts",
          requested_at as "requestedAt",
          applied_at as "appliedAt",
          app_version as "appVersion",
          app_build as "appBuild"
        from support_reset_requests
        where user_id = $1 and status = 'pending'
        order by requested_at asc
        limit 1
      `,
      [userId],
    )) as ResetRow[];
    return rows[0] ? this.mapReset(rows[0]) : null;
  }

  async acknowledge(
    userId: string,
    requestId: string,
    body: AcknowledgeSupportResetDto,
  ) {
    if (!this.isUuid(requestId)) {
      throw new BadRequestException('id must be a UUID');
    }
    if ((body.appVersion?.length ?? 0) > 40 || (body.appBuild?.length ?? 0) > 40) {
      throw new BadRequestException('app version metadata is too long');
    }
    const rows = (await this.entityManager.query(
      `
        update support_reset_requests
        set status = 'applied',
            applied_at = now(),
            app_version = $3,
            app_build = $4
        where id = $1 and user_id = $2 and status = 'pending'
        returning
          id,
          user_id as "userId",
          user_email as "userEmail",
          reason,
          status,
          revoke_tag as "revokeTag",
          deleted_counts as "deletedCounts",
          requested_at as "requestedAt",
          applied_at as "appliedAt",
          app_version as "appVersion",
          app_build as "appBuild"
      `,
      [requestId, userId, body.appVersion?.trim() || null, body.appBuild?.trim() || null],
    )) as ResetRow[];
    if (!rows[0]) {
      throw new NotFoundException('pending support reset was not found');
    }
    return this.mapReset(rows[0]);
  }

  private mapReset(row: ResetRow) {
    return {
      ...row,
      requestedAt: new Date(row.requestedAt),
      appliedAt: row.appliedAt ? new Date(row.appliedAt) : null,
    };
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value ?? '',
    );
  }
}
