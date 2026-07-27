import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ILegalDocumentsRepository } from '../../../../core/adapters/repositories/legal/ILegalDocumentsRepository';
import {
  AcceptLegalDocumentsData,
  LegalDocument,
  LegalDocumentRequirement,
  LegalDocumentType,
  LegalRequirements,
  PublishLegalDocumentData,
} from '../../../../core/entities/legal/LegalDocument';

interface LegalDocumentRow {
  id: string;
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string;
  contentHash: string;
  sourceUrl: string | null;
  effectiveAt: Date | string;
  publishedAt: Date | string;
  isActive: boolean;
  createdAt: Date | string;
  acceptedAt?: Date | string | null;
}

@Injectable()
export class SQLLegalDocumentsRepository implements ILegalDocumentsRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async ensureSchema(): Promise<void> {
    await this.entityManager.query(`
      create table if not exists legal_documents (
        id uuid primary key default gen_random_uuid(),
        type varchar(24) not null check (type in ('terms', 'privacy')),
        version varchar(40) not null,
        title varchar(180) not null,
        content text not null,
        content_hash char(64) not null,
        source_url text,
        effective_at timestamptz not null,
        published_at timestamptz not null default now(),
        is_active boolean not null default true,
        created_at timestamptz not null default now(),
        unique (type, version)
      )
    `);
    await this.entityManager.query(`
      create unique index if not exists legal_documents_one_active_type
      on legal_documents (type)
      where is_active = true
    `);
    await this.entityManager.query(`
      create table if not exists legal_acceptances (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references users(id) on delete cascade,
        document_id uuid not null references legal_documents(id),
        document_version varchar(40) not null,
        content_hash char(64) not null,
        accepted_at timestamptz not null default now(),
        platform varchar(40) not null,
        app_version varchar(80),
        locale varchar(40),
        unique (user_id, document_id)
      )
    `);
    await this.entityManager.query(`
      create index if not exists legal_acceptances_user_id_idx
      on legal_acceptances (user_id)
    `);
  }

  async publishIfMissing(data: PublishLegalDocumentData): Promise<void> {
    const rows = await this.queryRows<{ id: string }>(
      `
        select id::text as id
        from legal_documents
        where type = $1 and version = $2
        limit 1
      `,
      [data.type, data.version],
    );

    if (!rows[0]) {
      try {
        await this.publish(data);
      } catch (error) {
        if (!(error instanceof ConflictException)) {
          throw error;
        }
      }
    }
  }

  async publish(data: PublishLegalDocumentData): Promise<LegalDocument> {
    return this.entityManager.transaction(async (manager) => {
      const existing = await this.queryRowsWithManager<{ id: string }>(
        manager,
        `
          select id::text as id
          from legal_documents
          where type = $1 and version = $2
          limit 1
        `,
        [data.type, data.version],
      );

      if (existing[0]) {
        throw new ConflictException(
          `legal document ${data.type} ${data.version} already exists`,
        );
      }

      await manager.query(
        'update legal_documents set is_active = false where type = $1 and is_active = true',
        [data.type],
      );

      const rows = await this.queryRowsWithManager<LegalDocumentRow>(
        manager,
        `
          insert into legal_documents (
            type,
            version,
            title,
            content,
            content_hash,
            source_url,
            effective_at
          )
          values ($1, $2, $3, $4, $5, $6, $7)
          returning
            id::text as id,
            type,
            version,
            title,
            content,
            content_hash as "contentHash",
            source_url as "sourceUrl",
            effective_at as "effectiveAt",
            published_at as "publishedAt",
            is_active as "isActive",
            created_at as "createdAt"
        `,
        [
          data.type,
          data.version,
          data.title,
          data.content,
          data.contentHash,
          data.sourceUrl,
          data.effectiveAt,
        ],
      );

      if (!rows[0]) {
        throw new BadRequestException('legal document was not created');
      }

      return {
        ...this.mapDocument(rows[0]),
        isActive: data.effectiveAt.getTime() <= Date.now(),
      };
    });
  }

  async listActive(): Promise<LegalDocument[]> {
    const rows = await this.queryRows<LegalDocumentRow>(
      this.activeDocumentSelect(),
      [],
    );
    return rows.map((row) => this.mapDocument(row));
  }

  async listAll(): Promise<LegalDocument[]> {
    const rows = await this.queryRows<LegalDocumentRow>(
      `
        with current_documents as (
          select distinct on (type) id
          from legal_documents
          where effective_at <= now()
          order by type, effective_at desc, published_at desc
        )
        select
          d.id::text as id,
          d.type,
          d.version,
          d.title,
          d.content,
          d.content_hash as "contentHash",
          d.source_url as "sourceUrl",
          d.effective_at as "effectiveAt",
          d.published_at as "publishedAt",
          (active_document.id is not null) as "isActive",
          d.created_at as "createdAt"
        from legal_documents d
        left join current_documents active_document on active_document.id = d.id
        order by d.published_at desc
      `,
      [],
    );
    return rows.map((row) => this.mapDocument(row));
  }

  async requirementsFor(userId: string): Promise<LegalRequirements> {
    const rows = await this.queryRows<LegalDocumentRow>(
      `
        with current_documents as (
          select distinct on (type) *
          from legal_documents
          where effective_at <= now()
          order by type, effective_at desc, published_at desc
        )
        select
          d.id::text as id,
          d.type,
          d.version,
          d.title,
          d.content,
          d.content_hash as "contentHash",
          d.source_url as "sourceUrl",
          d.effective_at as "effectiveAt",
          d.published_at as "publishedAt",
          true as "isActive",
          d.created_at as "createdAt",
          a.accepted_at as "acceptedAt"
        from current_documents d
        left join legal_acceptances a
          on a.document_id = d.id and a.user_id = $1
        order by d.type asc
      `,
      [userId],
    );

    const documents = rows.map((row) => this.mapRequirement(row));
    return {
      requiresAcceptance: documents.some(
        (document) => document.acceptedAt === null,
      ),
      documents,
    };
  }

  async accept(data: AcceptLegalDocumentsData): Promise<LegalRequirements> {
    await this.entityManager.transaction(async (manager) => {
      const activeDocuments = await this.queryRowsWithManager<LegalDocumentRow>(
        manager,
        this.activeDocumentSelect(),
        [],
      );

      const requested = new Set(data.documentIds);
      const missing = activeDocuments.filter(
        (document) => !requested.has(document.id),
      );
      if (missing.length > 0) {
        throw new BadRequestException(
          'all active legal documents must be accepted',
        );
      }

      for (const document of activeDocuments) {
        await manager.query(
          `
            insert into legal_acceptances (
              user_id,
              document_id,
              document_version,
              content_hash,
              platform,
              app_version,
              locale
            )
            values ($1, $2, $3, $4, $5, $6, $7)
            on conflict (user_id, document_id) do nothing
          `,
          [
            data.userId,
            document.id,
            document.version,
            document.contentHash,
            data.platform,
            data.appVersion,
            data.locale,
          ],
        );
      }
    });

    return this.requirementsFor(data.userId);
  }

  private activeDocumentSelect(): string {
    return `
      select
        id::text as id,
        type,
        version,
        title,
        content,
        content_hash as "contentHash",
        source_url as "sourceUrl",
        effective_at as "effectiveAt",
        published_at as "publishedAt",
        true as "isActive",
        created_at as "createdAt"
      from (
        select distinct on (type) *
        from legal_documents
        where effective_at <= now()
        order by type, effective_at desc, published_at desc
      ) current_documents
      order by type asc
    `;
  }

  private mapDocument(row: LegalDocumentRow): LegalDocument {
    return {
      id: row.id,
      type: row.type,
      version: row.version,
      title: row.title,
      content: row.content,
      contentHash: row.contentHash,
      sourceUrl: row.sourceUrl,
      effectiveAt: new Date(row.effectiveAt),
      publishedAt: new Date(row.publishedAt),
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
    };
  }

  private mapRequirement(row: LegalDocumentRow): LegalDocumentRequirement {
    return {
      ...this.mapDocument(row),
      acceptedAt: row.acceptedAt ? new Date(row.acceptedAt) : null,
    };
  }

  private async queryRows<T>(sql: string, params: unknown[]): Promise<T[]> {
    return this.queryRowsWithManager<T>(this.entityManager, sql, params);
  }

  private async queryRowsWithManager<T>(
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
