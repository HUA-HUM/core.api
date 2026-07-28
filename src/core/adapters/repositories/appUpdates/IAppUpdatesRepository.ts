import {
  AppPlatform,
  AppUpdateConfiguration,
  SaveAppUpdateConfigurationData,
} from '../../../entities/appUpdates/AppUpdateConfiguration';

export const APP_UPDATES_REPOSITORY = Symbol('APP_UPDATES_REPOSITORY');

export interface IAppUpdatesRepository {
  ensureSchema(): Promise<void>;
  findByPlatform(
    platform: AppPlatform,
  ): Promise<AppUpdateConfiguration | null>;
  save(
    data: SaveAppUpdateConfigurationData,
  ): Promise<AppUpdateConfiguration>;
}
