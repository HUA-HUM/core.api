import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ActiveFocusSession } from '../../../core/entities/focusSessions/ActiveFocusSession';
import { GetActiveFocusSessionInteractor } from '../../../core/interactors/focusSessions/GetActiveFocusSessionInteractor';
import { GetEmergencyUnlockStatusInteractor } from '../../../core/interactors/emergencyUnlocks/GetEmergencyUnlockStatusInteractor';
import { UseEmergencyUnlockInteractor } from '../../../core/interactors/emergencyUnlocks/UseEmergencyUnlockInteractor';
import { EmergencyUnlockReason } from '../../../core/entities/emergencyUnlocks/EmergencyUnlock';
import { EmergencyUnlockCooldownError } from '../../../core/interactors/emergencyUnlocks/EmergencyUnlockCooldownError';
import { ActiveFocusSessionRequiredError } from '../../../core/interactors/emergencyUnlocks/ActiveFocusSessionRequiredError';
import { ApiErrorCode, apiError } from '../../errors/ApiErrorResponse';

@Injectable()
export class FocusSessionsService {
  constructor(
    private readonly getActiveFocusSessionInteractor: GetActiveFocusSessionInteractor,
    private readonly getEmergencyUnlockStatusInteractor: GetEmergencyUnlockStatusInteractor,
    private readonly useEmergencyUnlockInteractor: UseEmergencyUnlockInteractor,
  ) {}

  async active(userId: string): Promise<ActiveFocusSession | null> {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }

    return this.getActiveFocusSessionInteractor.execute(userId);
  }

  async emergencyUnlockStatus(userId: string) {
    this.validateUserId(userId);
    return this.getEmergencyUnlockStatusInteractor.execute(userId);
  }

  async useEmergencyUnlock(userId: string, reason: EmergencyUnlockReason) {
    this.validateUserId(userId);
    if (!['forgot_tag', 'lost_tag'].includes(reason)) {
      throw new BadRequestException('reason must be forgot_tag or lost_tag');
    }

    try {
      return await this.useEmergencyUnlockInteractor.execute({
        userId,
        reason,
      });
    } catch (error) {
      if (error instanceof EmergencyUnlockCooldownError) {
        throw new ConflictException({
          ...apiError(
            ApiErrorCode.emergencyUnlockCooldown,
            'emergency unlock is still on cooldown',
          ),
          nextAvailableAt: error.nextAvailableAt.toISOString(),
        });
      }

      if (error instanceof ActiveFocusSessionRequiredError) {
        throw new ConflictException(
          apiError(
            ApiErrorCode.activeFocusSessionRequired,
            'an active focus session is required',
          ),
        );
      }

      throw error;
    }
  }

  private validateUserId(userId: string): void {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }
  }
}
