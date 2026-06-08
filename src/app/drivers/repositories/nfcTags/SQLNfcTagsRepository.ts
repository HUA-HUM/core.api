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
  tagId: string;
  tag_id?: string;
  userId: string;
  user_id?: string;
  label: string | null;
  status: NfcTagStatus;
  claimedAt: Date;
  claimed_at?: Date;
  lastSeenAt: Date | null;
  last_seen_at?: Date | null;
  createdAt: Date;
  created_at?: Date;
  updatedAt: Date;
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
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
        update nfc_tag_claims
        set
          last_seen_at = now(),
          updated_at = now()
        where id = $1
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
      [id],
    );

    return this.mapRowToClaim(rows[0]);
  }

  private mapRowToClaim(row: NfcTagClaimRow): NfcTagClaim {
    return {
      id: row.id,
      tagId: row.tagId ?? row.tag_id ?? '',
      userId: row.userId ?? row.user_id ?? '',
      label: row.label,
      status: row.status,
      claimedAt: this.toDate(row.claimedAt ?? row.claimed_at),
      lastSeenAt: this.toNullableDate(row.lastSeenAt ?? row.last_seen_at),
      createdAt: this.toDate(row.createdAt ?? row.created_at),
      updatedAt: this.toDate(row.updatedAt ?? row.updated_at),
    };
  }

  private toDate(value: unknown): Date {
    const date = value instanceof Date ? value : new Date(String(value));
    return date;
  }

  private toNullableDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return this.toDate(value);
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result: unknown = await this.entityManager.query(sql, params);
    return result as T[];
  }
}
