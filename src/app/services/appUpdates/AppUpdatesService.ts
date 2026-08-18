import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { APP_UPDATES_REPOSITORY } from '../../../core/adapters/repositories/appUpdates/IAppUpdatesRepository';
import type { IAppUpdatesRepository } from '../../../core/adapters/repositories/appUpdates/IAppUpdatesRepository';
import {
  AppPlatform,
  AppUpdateConfiguration,
  AppUpdateStatus,
} from '../../../core/entities/appUpdates/AppUpdateConfiguration';
import { SaveAppUpdateConfigurationDto } from '../../dtos/appUpdates/SaveAppUpdateConfigurationDto';

@Injectable()
export class AppUpdatesService {
  constructor(
    @Inject(APP_UPDATES_REPOSITORY)
    private readonly repository: IAppUpdatesRepository,
  ) {}

  async status(
    platformValue: string,
    buildValue: string,
    currentVersion?: string,
  ): Promise<AppUpdateStatus> {
    const platform = this.platform(platformValue);
    const currentBuild = this.positiveInteger(buildValue, 'build');
    const configuration = await this.repository.findByPlatform(platform);
    const normalizedCurrentVersion = this.optionalText(currentVersion, 40);

    if (!configuration?.isActive) {
      return {
        updateAvailable: false,
        updateRequired: false,
        currentVersion: normalizedCurrentVersion,
        currentBuild,
        latestVersion: configuration?.latestVersion ?? null,
        latestBuild: configuration?.latestBuild ?? null,
        minimumBuild: configuration?.minimumBuild ?? null,
        title: null,
        message: null,
        storeUrl: null,
      };
    }

    return {
      updateAvailable: currentBuild < configuration.latestBuild,
      updateRequired: currentBuild < configuration.minimumBuild,
      currentVersion: normalizedCurrentVersion,
      currentBuild,
      latestVersion: configuration.latestVersion,
      latestBuild: configuration.latestBuild,
      minimumBuild: configuration.minimumBuild,
      title: configuration.title,
      message: configuration.message,
      storeUrl: configuration.storeUrl,
    };
  }

  adminConfiguration(
    platformValue: string,
  ): Promise<AppUpdateConfiguration | null> {
    return this.repository.findByPlatform(this.platform(platformValue));
  }

  save(
    body: SaveAppUpdateConfigurationDto,
  ): Promise<AppUpdateConfiguration> {
    const platform = this.platform(body.platform);
    const latestVersion = this.requiredText(
      body.latestVersion,
      'latestVersion',
      40,
    );
    const latestBuild = this.positiveInteger(
      body.latestBuild,
      'latestBuild',
    );
    const minimumBuild = this.positiveInteger(
      body.minimumBuild,
      'minimumBuild',
    );
    if (minimumBuild > latestBuild) {
      throw new BadRequestException(
        'minimumBuild cannot be greater than latestBuild',
      );
    }

    const storeUrl = this.requiredText(body.storeUrl, 'storeUrl', 2_000);
    try {
      new URL(storeUrl);
    } catch {
      throw new BadRequestException('storeUrl must be a valid URL');
    }

    if (typeof body.isActive !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean');
    }

    return this.repository.save({
      platform,
      latestVersion,
      latestBuild,
      minimumBuild,
      title: this.requiredText(body.title, 'title', 180),
      message: this.requiredText(body.message, 'message', 2_000),
      storeUrl,
      isActive: body.isActive,
    });
  }

  private platform(value: string): AppPlatform {
    const normalized = value?.trim().toLowerCase();
    if (normalized !== 'ios' && normalized !== 'android') {
      throw new BadRequestException('platform must be ios or android');
    }
    return normalized;
  }

  private positiveInteger(
    value: string | number,
    fieldName: string,
  ): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(
        `${fieldName} must be a positive integer`,
      );
    }
    return parsed;
  }

  private requiredText(
    value: string,
    fieldName: string,
    maxLength: number,
  ): string {
    const normalized = value?.trim();
    if (!normalized || normalized.length > maxLength) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return normalized;
  }

  private optionalText(
    value: string | undefined,
    maxLength: number,
  ): string | null {
    const normalized = value?.trim();
    if (!normalized) {
      return null;
    }
    if (normalized.length > maxLength) {
      throw new BadRequestException(
        `currentVersion exceeds ${maxLength} characters`,
      );
    }
    return normalized;
  }
}
