export type AppPlatform = 'ios' | 'android';

export interface AppUpdateConfiguration {
  platform: AppPlatform;
  latestVersion: string;
  latestBuild: number;
  minimumBuild: number;
  title: string;
  message: string;
  storeUrl: string;
  isActive: boolean;
  updatedAt: Date;
}

export interface SaveAppUpdateConfigurationData {
  platform: AppPlatform;
  latestVersion: string;
  latestBuild: number;
  minimumBuild: number;
  title: string;
  message: string;
  storeUrl: string;
  isActive: boolean;
}

export interface AppUpdateStatus {
  updateAvailable: boolean;
  updateRequired: boolean;
  currentVersion: string | null;
  currentBuild: number;
  latestVersion: string | null;
  latestBuild: number | null;
  minimumBuild: number | null;
  title: string | null;
  message: string | null;
  storeUrl: string | null;
}
