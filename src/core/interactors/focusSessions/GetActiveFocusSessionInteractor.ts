import { IFocusSessionsRepository } from '../../adapters/repositories/focusSessions/IFocusSessionsRepository';
import { ActiveFocusSession } from '../../entities/focusSessions/ActiveFocusSession';

export class GetActiveFocusSessionInteractor {
  constructor(private readonly repository: IFocusSessionsRepository) {}

  async execute(userId: string): Promise<ActiveFocusSession | null> {
    return this.repository.findActiveByUserId(userId);
  }
}
