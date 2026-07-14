import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  ClaimNfcTagData,
  NfcTagClaim,
  NfcTagStatus,
  VerifyNfcTagData,
} from '../../../../core/entities/nfcTags/NfcTag';
import { INfcTagsRepository } from '../../../../core/adapters/repositories/nfcTags/INfcTagsRepository';
import { NfcTagAlreadyClaimedError } from '../../../../core/interactors/nfcTags/NfcTagAlreadyClaimedError';
import { NfcTagLostError } from '../../../../core/interactors/nfcTags/NfcTagLostError';

interface NfcTagClaimRow {
  id: string;
  tagId?: string;
  tagid?: string;
  tag_id?: string;
  userId?: string;
  userid?: string;
  user_id?: string;
  label: string | null;
  status: NfcTagStatus;
  claimedAt?: Date | string;
  claimedat?: Date | string;
  claimed_at?: Date;
  lastSeenAt?: Date | string | null;
  lastseenat?: Date | string | null;
  last_seen_at?: Date | null;
  createdAt?: Date | string;
  createdat?: Date | string;
  created_at?: Date;
  updatedAt?: Date | string;
  updatedat?: Date | string;
  updated_at?: Date;
}

@Injectable()
export class SQLNfcTagsRepository implements INfcTagsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async claim(data: ClaimNfcTagData): Promise<NfcTagClaim> {
    const rows = await this.queryRows<{ id: string }>(
      `
        with tag_lock as (
          select pg_advisory_xact_lock(hashtextextended($2, 0))
        ),
        tag as (
          insert into nfc_tags (tag_hash, status)
          select $2, 'active'
          from tag_lock
          on conflict (tag_hash)
          do update set
            status = case
              when nfc_tags.status = 'lost' then 'lost'
              else 'active'
            end,
            updated_at = now()
          returning id, status
        ),
        lost_tag as (
          select id from tag where status = 'lost'
        ),
        existing_other_owner as (
          select claims.id
          from nfc_tag_claims claims
          where claims.tag_id = (select id from tag)
            and claims.user_id <> $1
            and claims.status = 'active'
          order by claims.claimed_at asc
          limit 1
        ),
        revoked_previous_claims as (
          update nfc_tag_claims
          set
            status = 'revoked',
            updated_at = now()
          where user_id = $1
            and status = 'active'
            and tag_id <> (select id from tag)
            and not exists (select 1 from existing_other_owner)
            and not exists (select 1 from lost_tag)
          returning id
        ),
        claim as (
          insert into nfc_tag_claims (
            tag_id,
            user_id,
            label,
            status,
            claimed_at,
            last_seen_at
          )
          select
            tag.id,
            $1,
            $3,
            'active',
            now(),
            now()
          from tag
          left join revoked_previous_claims on true
          where not exists (select 1 from existing_other_owner)
            and not exists (select 1 from lost_tag)
          group by tag.id
          on conflict (tag_id, user_id)
          do update set
            label = excluded.label,
            status = 'active',
            last_seen_at = now(),
            updated_at = now()
          returning id
        )
        select id from claim
      `,
      [data.userId, data.tagHash, data.label ?? null],
    );

    if (!rows[0]) {
      const tagRows = await this.queryRows<{ status: string }>(
        'select status from nfc_tags where tag_hash = $1 limit 1',
        [data.tagHash],
      );
      if (tagRows[0]?.status === 'lost') {
        throw new NfcTagLostError();
      }

      throw new NfcTagAlreadyClaimedError();
    }

    const claim = await this.findClaimById(rows[0].id);
    if (!claim) {
      throw new Error('NFC tag claim not found after insert');
    }

    return claim;
  }

  async findClaimsByUserId(userId: string): Promise<NfcTagClaim[]> {
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
        ${this.selectClaims()}
        from nfc_tag_claims claims
        inner join nfc_tags tags on tags.id = claims.tag_id
        where claims.user_id = $1
          and claims.status = 'active'
          and tags.status = 'active'
        order by claims.claimed_at desc
      `,
      [userId],
    );

    return rows.map((row) => this.mapRowToClaim(row));
  }

  async findActiveClaimByTagHash(tagHash: string): Promise<NfcTagClaim | null> {
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
        ${this.selectClaims()}
        from nfc_tag_claims claims
        inner join nfc_tags tags on tags.id = claims.tag_id
        where tags.tag_hash = $1
          and claims.status = 'active'
          and tags.status = 'active'
        order by claims.claimed_at asc
        limit 1
      `,
      [tagHash],
    );

    return rows[0] ? this.mapRowToClaim(rows[0]) : null;
  }

  async findActiveClaim(data: VerifyNfcTagData): Promise<NfcTagClaim | null> {
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
        ${this.selectClaims()}
        from nfc_tag_claims claims
        inner join nfc_tags tags on tags.id = claims.tag_id
        where claims.user_id = $1
          and tags.tag_hash = $2
          and claims.status = 'active'
          and tags.status = 'active'
        limit 1
      `,
      [data.userId, data.tagHash],
    );

    return rows[0] ? this.mapRowToClaim(rows[0]) : null;
  }

  async touchClaim(id: string): Promise<NfcTagClaim> {
    await this.queryRows<{ id: string }>(
      `
        update nfc_tag_claims
        set
          last_seen_at = now(),
          updated_at = now()
        where id = $1
        returning id
      `,
      [id],
    );

    const claim = await this.findClaimById(id);

    if (!claim) {
      throw new Error('NFC tag claim not found after update');
    }

    return claim;
  }

  async revokeClaim(id: string, userId: string): Promise<NfcTagClaim | null> {
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
        update nfc_tag_claims
        set
          status = 'revoked',
          updated_at = now()
        where id = $1
          and user_id = $2
          and status = 'active'
        returning
          id,
          tag_id as "tagId",
          user_id as "userId",
          label,
          status,
          claimed_at as "claimedAt",
          last_seen_at as "lastSeenAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      [id, userId],
    );

    return rows[0] ? this.mapRowToClaim(rows[0]) : null;
  }

  async updateClaimLabel(
    id: string,
    userId: string,
    label: string,
  ): Promise<NfcTagClaim | null> {
    const rows = await this.queryRows<{ id: string }>(
      `
        update nfc_tag_claims
        set
          label = $3,
          updated_at = now()
        where id = $1
          and user_id = $2
          and status = 'active'
        returning id
      `,
      [id, userId, label],
    );

    return rows[0] ? this.findClaimById(rows[0].id) : null;
  }

  private async findClaimById(id: string): Promise<NfcTagClaim | null> {
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
        ${this.selectClaims()}
        from nfc_tag_claims claims
        inner join nfc_tags tags on tags.id = claims.tag_id
        where claims.id = $1
        limit 1
      `,
      [id],
    );

    return rows[0] ? this.mapRowToClaim(rows[0]) : null;
  }

  private selectClaims(): string {
    return `
        select
          claims.id,
          claims.tag_id as "tagId",
          claims.user_id as "userId",
          claims.label,
          claims.status,
          claims.claimed_at as "claimedAt",
          claims.last_seen_at as "lastSeenAt",
          claims.created_at as "createdAt",
          claims.updated_at as "updatedAt"
    `;
  }

  private mapRowToClaim(row: NfcTagClaimRow): NfcTagClaim {
    return {
      id: row.id,
      tagId: row.tagId ?? row.tagid ?? row.tag_id ?? '',
      userId: row.userId ?? row.userid ?? row.user_id ?? '',
      label: row.label,
      status: row.status,
      claimedAt: this.toDate(
        row.claimedAt ?? row.claimedat ?? row.claimed_at,
        'claimedAt',
      ),
      lastSeenAt: this.toNullableDate(
        row.lastSeenAt ?? row.lastseenat ?? row.last_seen_at,
      ),
      createdAt: this.toDate(
        row.createdAt ?? row.createdat ?? row.created_at,
        'createdAt',
      ),
      updatedAt: this.toDate(
        row.updatedAt ?? row.updatedat ?? row.updated_at,
        'updatedAt',
      ),
    };
  }

  private toDate(value: unknown, fieldName: string): Date {
    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid NFC tag claim date: ${fieldName}`);
    }

    return date;
  }

  private toNullableDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return this.toDate(value, 'lastSeenAt');
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
