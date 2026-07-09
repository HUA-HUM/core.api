import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  ClaimNfcTagData,
  InviteNfcTagMemberData,
  NfcTagClaim,
  NfcTagClaimRole,
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
  role?: NfcTagClaimRole;
  relationship?: NfcTagClaimRole;
  ownerUserId?: string | null;
  owneruserid?: string | null;
  owner_user_id?: string | null;
  ownerEmail?: string | null;
  owneremail?: string | null;
  owner_email?: string | null;
  invitedEmail?: string | null;
  invitedemail?: string | null;
  invited_email?: string | null;
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

  async inviteMember(data: InviteNfcTagMemberData): Promise<NfcTagClaim | null> {
    const rows = await this.queryRows<{ id: string }>(
      `
        with owner_claim as (
          select claims.*
          from nfc_tag_claims claims
          inner join nfc_tags tags on tags.id = claims.tag_id
          where claims.id = $2
            and claims.user_id = $1
            and claims.status = 'active'
            and tags.status = 'active'
            and claims.id = (
              select owner_claims.id
              from nfc_tag_claims owner_claims
              where owner_claims.tag_id = claims.tag_id
                and owner_claims.status = 'active'
              order by owner_claims.claimed_at asc, owner_claims.created_at asc
              limit 1
            )
          limit 1
        ),
        invitee as (
          select id, email
          from users
          where lower(email) = lower($3)
            and status = 'active'
          limit 1
        ),
        active_other_claim as (
          select claims.id
          from nfc_tag_claims claims
          where claims.user_id = (select id from invitee)
            and claims.status = 'active'
            and claims.tag_id <> (select tag_id from owner_claim)
          limit 1
        ),
        member_claim as (
          insert into nfc_tag_claims (
            tag_id,
            user_id,
            label,
            status,
            claimed_at,
            last_seen_at
          )
          select
            owner_claim.tag_id,
            invitee.id,
            owner_claim.label,
            'active',
            now(),
            now()
          from owner_claim
          cross join invitee
          where invitee.id <> owner_claim.user_id
            and not exists (select 1 from active_other_claim)
          on conflict (tag_id, user_id)
          do update set
            status = 'active',
            last_seen_at = now(),
            updated_at = now()
          returning id
        )
        select id from member_claim
      `,
      [data.ownerUserId, data.claimId, data.email],
    );

    return rows[0] ? this.findClaimById(rows[0].id) : null;
  }

  async findClaimsByUserId(userId: string): Promise<NfcTagClaim[]> {
    const rows = await this.queryRows<NfcTagClaimRow>(
      `
        ${this.selectClaims()}
        from nfc_tag_claims claims
        inner join nfc_tags tags on tags.id = claims.tag_id
        ${this.joinOwnerClaim()}
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
        ${this.joinOwnerClaim()}
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
        ${this.joinOwnerClaim()}
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
    const rows = await this.queryRows<{ id: string }>(
      `
        update nfc_tag_claims
        set
          status = 'revoked',
          updated_at = now()
        where id = $1
          and user_id = $2
          and status = 'active'
        returning id
      `,
      [id, userId],
    );

    return rows[0] ? this.findClaimById(rows[0].id) : null;
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
        ${this.joinOwnerClaim()}
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
          case
            when claims.user_id = owner_claim.user_id then 'owner'
            else 'member'
          end as "role",
          case
            when claims.user_id = owner_claim.user_id then 'owner'
            else 'member'
          end as "relationship",
          owner_claim.user_id as "ownerUserId",
          owner_claim.email as "ownerEmail",
          user_account.email as "invitedEmail",
          claims.claimed_at as "claimedAt",
          claims.last_seen_at as "lastSeenAt",
          claims.created_at as "createdAt",
          claims.updated_at as "updatedAt"
    `;
  }

  private joinOwnerClaim(): string {
    return `
        left join users user_account on user_account.id = claims.user_id
        left join lateral (
          select
            owner_claims.user_id,
            owner_account.email
          from nfc_tag_claims owner_claims
          left join users owner_account on owner_account.id = owner_claims.user_id
          where owner_claims.tag_id = claims.tag_id
            and owner_claims.status = 'active'
          order by owner_claims.claimed_at asc, owner_claims.created_at asc
          limit 1
        ) owner_claim on true
    `;
  }

  private mapRowToClaim(row: NfcTagClaimRow): NfcTagClaim {
    const role = row.role ?? 'owner';
    return {
      id: row.id,
      tagId: row.tagId ?? row.tagid ?? row.tag_id ?? '',
      userId: row.userId ?? row.userid ?? row.user_id ?? '',
      label: row.label,
      status: row.status,
      role,
      relationship: row.relationship ?? role,
      ownerUserId:
        row.ownerUserId ?? row.owneruserid ?? row.owner_user_id ?? null,
      ownerEmail: row.ownerEmail ?? row.owneremail ?? row.owner_email ?? null,
      invitedEmail:
        row.invitedEmail ?? row.invitedemail ?? row.invited_email ?? null,
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
