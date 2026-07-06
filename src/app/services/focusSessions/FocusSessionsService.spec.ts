import { BadRequestException, ConflictException } from '@nestjs/common';
import { ActiveFocusSessionRequiredError } from '../../../core/interactors/emergencyUnlocks/ActiveFocusSessionRequiredError';
import { EmergencyUnlockCooldownError } from '../../../core/interactors/emergencyUnlocks/EmergencyUnlockCooldownError';
import { FocusSessionsService } from './FocusSessionsService';

describe('FocusSessionsService emergency unlock', () => {
  const activeInteractor = { execute: jest.fn() };
  const statusInteractor = { execute: jest.fn() };
  const useInteractor = { execute: jest.fn() };
  const service = new FocusSessionsService(
    activeInteractor as never,
    statusInteractor as never,
    useInteractor as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the account cooldown status', async () => {
    const status = {
      available: true,
      cooldownDays: 60,
      lastUsedAt: null,
      nextAvailableAt: null,
    };
    statusInteractor.execute.mockResolvedValue(status);

    await expect(service.emergencyUnlockStatus('user-id')).resolves.toEqual(
      status,
    );
  });

  it('uses the emergency unlock with the selected reason', async () => {
    useInteractor.execute.mockResolvedValue({ id: 'unlock-id' });

    await service.useEmergencyUnlock('user-id', 'lost_tag');

    expect(useInteractor.execute).toHaveBeenCalledWith({
      userId: 'user-id',
      reason: 'lost_tag',
    });
  });

  it('rejects an unsupported reason', async () => {
    await expect(
      service.useEmergencyUnlock('user-id', 'other' as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns the next available date while on cooldown', async () => {
    const nextAvailableAt = new Date('2026-09-03T12:00:00.000Z');
    useInteractor.execute.mockRejectedValue(
      new EmergencyUnlockCooldownError(nextAvailableAt),
    );

    let thrown: unknown;
    try {
      await service.useEmergencyUnlock('user-id', 'forgot_tag');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ConflictException);
    expect((thrown as ConflictException).getResponse()).toEqual({
      code: 'EMERGENCY_UNLOCK_COOLDOWN',
      message: 'emergency unlock is still on cooldown',
      nextAvailableAt: nextAvailableAt.toISOString(),
    });
  });

  it('requires an active focus session', async () => {
    useInteractor.execute.mockRejectedValue(
      new ActiveFocusSessionRequiredError(),
    );

    let thrown: unknown;
    try {
      await service.useEmergencyUnlock('user-id', 'forgot_tag');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(ConflictException);
    expect((thrown as ConflictException).getResponse()).toEqual({
      code: 'ACTIVE_FOCUS_SESSION_REQUIRED',
      message: 'an active focus session is required',
    });
  });
});
