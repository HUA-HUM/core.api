import { Module } from '@nestjs/common';
import {
  FOCUS_SESSIONS_REPOSITORY,
  IFocusSessionsRepository,
} from '../../../core/adapters/repositories/focusSessions/IFocusSessionsRepository';
import { GetActiveFocusSessionInteractor } from '../../../core/interactors/focusSessions/GetActiveFocusSessionInteractor';
import { FocusSessionsController } from '../../controllers/focusSessions/FocusSessionsController';
import { FocusSessionsService } from '../../services/focusSessions/FocusSessionsService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';
import {
  EMERGENCY_UNLOCKS_REPOSITORY,
  IEmergencyUnlocksRepository,
} from '../../../core/adapters/repositories/emergencyUnlocks/IEmergencyUnlocksRepository';
import { GetEmergencyUnlockStatusInteractor } from '../../../core/interactors/emergencyUnlocks/GetEmergencyUnlockStatusInteractor';
import { UseEmergencyUnlockInteractor } from '../../../core/interactors/emergencyUnlocks/UseEmergencyUnlockInteractor';

@Module({
  imports: [JwtAuthModule],
  controllers: [FocusSessionsController],
  providers: [
    {
      provide: GetActiveFocusSessionInteractor,
      useFactory: (repository: IFocusSessionsRepository) =>
        new GetActiveFocusSessionInteractor(repository),
      inject: [FOCUS_SESSIONS_REPOSITORY],
    },
    {
      provide: GetEmergencyUnlockStatusInteractor,
      useFactory: (repository: IEmergencyUnlocksRepository) =>
        new GetEmergencyUnlockStatusInteractor(repository),
      inject: [EMERGENCY_UNLOCKS_REPOSITORY],
    },
    {
      provide: UseEmergencyUnlockInteractor,
      useFactory: (repository: IEmergencyUnlocksRepository) =>
        new UseEmergencyUnlockInteractor(repository),
      inject: [EMERGENCY_UNLOCKS_REPOSITORY],
    },
    FocusSessionsService,
  ],
})
export class FocusSessionsModule {}
