import { Module } from '@nestjs/common';
import {
  FOCUS_SESSIONS_REPOSITORY,
  IFocusSessionsRepository,
} from '../../../core/adapters/repositories/focusSessions/IFocusSessionsRepository';
import { GetActiveFocusSessionInteractor } from '../../../core/interactors/focusSessions/GetActiveFocusSessionInteractor';
import { FocusSessionsController } from '../../controllers/focusSessions/FocusSessionsController';
import { FocusSessionsService } from '../../services/focusSessions/FocusSessionsService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

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
    FocusSessionsService,
  ],
})
export class FocusSessionsModule {}
