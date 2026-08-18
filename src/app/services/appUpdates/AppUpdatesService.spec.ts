import { BadRequestException } from '@nestjs/common';
import type { IAppUpdatesRepository } from '../../../core/adapters/repositories/appUpdates/IAppUpdatesRepository';
import type { AppUpdateConfiguration } from '../../../core/entities/appUpdates/AppUpdateConfiguration';
import { AppUpdatesService } from './AppUpdatesService';

describe('AppUpdatesService', () => {
  const configuration: AppUpdateConfiguration = {
    platform: 'ios',
    latestVersion: '1.2.0',
    latestBuild: 30,
    minimumBuild: 28,
    title: 'Nueva versión',
    message: 'Actualizá para continuar.',
    storeUrl: 'https://apps.apple.com/app/id123456789',
    isActive: true,
    updatedAt: new Date('2026-07-28T12:00:00.000Z'),
  };
  let repository: jest.Mocked<IAppUpdatesRepository>;
  let service: AppUpdatesService;

  beforeEach(() => {
    repository = {
      ensureSchema: jest.fn(),
      findByPlatform: jest.fn().mockResolvedValue(configuration),
      save: jest.fn().mockResolvedValue(configuration),
    };
    service = new AppUpdatesService(repository);
  });

  it('requires an update below the configured minimum build', async () => {
    await expect(service.status('ios', '27', '1.0')).resolves.toEqual(
      expect.objectContaining({
        updateAvailable: true,
        updateRequired: true,
        latestBuild: 30,
        minimumBuild: 28,
      }),
    );
  });

  it('offers an optional update between the minimum and latest builds', async () => {
    await expect(service.status('ios', '29', '1.1')).resolves.toEqual(
      expect.objectContaining({
        updateAvailable: true,
        updateRequired: false,
      }),
    );
  });

  it('does not show an update on the latest build', async () => {
    await expect(service.status('ios', '30', '1.2')).resolves.toEqual(
      expect.objectContaining({
        updateAvailable: false,
        updateRequired: false,
      }),
    );
  });

  it('rejects a minimum build greater than the latest build', () => {
    expect(() =>
      service.save({
        platform: 'ios',
        latestVersion: '1.2.0',
        latestBuild: 30,
        minimumBuild: 31,
        title: 'Nueva versión',
        message: 'Actualizá para continuar.',
        storeUrl: 'https://apps.apple.com/app/id123456789',
        isActive: true,
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts android as a valid platform', async () => {
    await service.status('android', '27', '1.0');
    expect(repository.findByPlatform).toHaveBeenCalledWith('android');

    await service.save({
      platform: 'android',
      latestVersion: '1.2.0',
      latestBuild: 30,
      minimumBuild: 28,
      title: 'Nueva versión',
      message: 'Actualizá para continuar.',
      storeUrl: 'https://play.google.com/store/apps/details?id=io.rituo.app',
      isActive: true,
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ platform: 'android' }),
    );
  });

  it('rejects an unsupported platform', async () => {
    await expect(service.status('windows', '27', '1.0')).rejects.toThrow(
      BadRequestException,
    );
  });
});
