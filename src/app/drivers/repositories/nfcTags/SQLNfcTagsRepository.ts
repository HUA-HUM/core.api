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
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
        with tag as (
          insert into nfc_tags (tag_hash, status)
          values ($2, 'active')
          on conflict (tag_hash)
          do update set
            status = 'active',
            updated_at = now()
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
          on conflict (tag_id, user_id)
          do update set
            label = excluded.label,
            status = 'active',
            last_seen_at = now(),
            updated_at = now()
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
        )
        select * from claim
      `,
      [data.userId, data.tagHash, data.label ?? null],
    );

    return this.mapRowToClaim(rows[0]);
  }

  async findClaimsByUserId(userId: string): Promise<NfcTagClaim[]> {
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
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

  async findActiveClaim(data: VerifyNfcTagData): Promise<NfcTagClaim | null> {
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
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

  async revokeClaim(
    id: string,
    userId: string,
  ): Promise<NfcTagClaim | null> {
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
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
        update nfc_tag_claims
        set
          label = $3,
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
      [id, userId, label],
    );

    return rows[0] ? this.mapRowToClaim(rows[0]) : null;
  }

  private async findClaimById(id: string): Promise<NfcTagClaim | null> {
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
        select
          id,
          tag_id as "tagId",
          user_id as "userId",
          label,
          status,
          claimed_at as "claimedAt",
          last_seen_at as "lastSeenAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
        from nfc_tag_claims
        where id = $1
        limit 1
      `,
      [id],
    );

    return rows[0] ? this.mapRowToClaim(rows[0]) : null;
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
