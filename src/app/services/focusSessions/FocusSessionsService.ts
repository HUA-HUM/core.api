import { BadRequestException, Injectable } from '@nestjs/common';
import { ActiveFocusSession } from '../../../core/entities/focusSessions/ActiveFocusSession';
import { GetActiveFocusSessionInteractor } from '../../../core/interactors/focusSessions/GetActiveFocusSessionInteractor';

@Injectable()
export class FocusSessionsService {
  constructor(
    private readonly getActiveFocusSessionInteractor: GetActiveFocusSessionInteractor,
  ) {}

  async active(userId: string): Promise<ActiveFocusSession | null> {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }

    return this.getActiveFocusSessionInteractor.execute(userId);
  }
}
