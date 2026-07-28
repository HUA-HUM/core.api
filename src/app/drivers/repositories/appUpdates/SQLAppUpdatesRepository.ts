import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { IAppUpdatesRepository } from '../../../../core/adapters/repositories/appUpdates/IAppUpdatesRepository';
import {
  AppPlatform,
  AppUpdateConfiguration,
  SaveAppUpdateConfigurationData,
} from '../../../../core/entities/appUpdates/AppUpdateConfiguration';

interface AppUpdateConfigurationRow {
  platform: AppPlatform;
  latestVersion: string;
  latestBuild: number | string;
  minimumBuild: number | string;
  title: string;
  message: string;
  storeUrl: string;
  isActive: boolean;
  updatedAt: Date | string;
}

@Injectable()
export class SQLAppUpdatesRepository implements IAppUpdatesRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async ensureSchema(): Promise<void> {
    await this.entityManager.query(`
      create table if not exists app_update_configurations (
        platform varchar(20) primary key,
        latest_version varchar(40) not null,
        latest_build integer not null check (latest_build > 0),
        minimum_build integer not null check (minimum_build > 0),
        title varchar(180) not null,
        message text not null,
        store_url text not null,
        is_active boolean not null default true,
        updated_at timestamptz not null default now(),
        check (platform in ('ios')),
        check (minimum_build <= latest_build)
      )
    `);
  }

  async findByPlatform(
    platform: AppPlatform,
  ): Promise<AppUpdateConfiguration | null> {
    const rows = await this.entityManager.query(
      `
        select
          platform,
          latest_version as "latestVersion",
          latest_build as "latestBuild",
          minimum_build as "minimumBuild",
          title,
          message,
          store_url as "storeUrl",
          is_active as "isActive",
          updated_at as "updatedAt"
        from app_update_configurations
        where platform = $1
        limit 1
      `,
      [platform],
    ) as AppUpdateConfigurationRow[];

    return rows[0] ? this.map(rows[0]) : null;
  }

  async save(
    data: SaveAppUpdateConfigurationData,
  ): Promise<AppUpdateConfiguration> {
    const rows = await this.entityManager.query(
      `
        insert into app_update_configurations (
          platform,
          latest_version,
          latest_build,
          minimum_build,
          title,
          message,
          store_url,
          is_active,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, now())
        on conflict (platform) do update set
          latest_version = excluded.latest_version,
          latest_build = excluded.latest_build,
          minimum_build = excluded.minimum_build,
          title = excluded.title,
          message = excluded.message,
          store_url = excluded.store_url,
          is_active = excluded.is_active,
          updated_at = now()
        returning
          platform,
          latest_version as "latestVersion",
          latest_build as "latestBuild",
          minimum_build as "minimumBuild",
          title,
          message,
          store_url as "storeUrl",
          is_active as "isActive",
          updated_at as "updatedAt"
      `,
      [
        data.platform,
        data.latestVersion,
        data.latestBuild,
        data.minimumBuild,
        data.title,
        data.message,
        data.storeUrl,
        data.isActive,
      ],
    ) as AppUpdateConfigurationRow[];

    return this.map(rows[0]);
  }

  private map(row: AppUpdateConfigurationRow): AppUpdateConfiguration {
    return {
      platform: row.platform,
      latestVersion: row.latestVersion,
      latestBuild: Number(row.latestBuild),
      minimumBuild: Number(row.minimumBuild),
      title: row.title,
      message: row.message,
      storeUrl: row.storeUrl,
      isActive: row.isActive,
      updatedAt: new Date(row.updatedAt),
    };
  }
}
