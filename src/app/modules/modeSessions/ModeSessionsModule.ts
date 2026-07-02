import { Module } from '@nestjs/common';
import {
  IModeSessionsRepository,
  MODE_SESSIONS_REPOSITORY,
} from '../../../core/adapters/repositories/modeSessions/IModeSessionsRepository';
import { FinishModeSessionInteractor } from '../../../core/interactors/modeSessions/FinishModeSessionInteractor';
import { GetActiveModeSessionInteractor } from '../../../core/interactors/modeSessions/GetActiveModeSessionInteractor';
import { GetModeSessionSummaryInteractor } from '../../../core/interactors/modeSessions/GetModeSessionSummaryInteractor';
import { ListModeSessionsByModeInteractor } from '../../../core/interactors/modeSessions/ListModeSessionsByModeInteractor';
import { ListUserModeSessionsInteractor } from '../../../core/interactors/modeSessions/ListUserModeSessionsInteractor';
import { StartModeSessionInteractor } from '../../../core/interactors/modeSessions/StartModeSessionInteractor';
import { ModeSessionsController } from '../../controllers/modeSessions/ModeSessionsController';
import { ModeSessionsService } from '../../services/modeSessions/ModeSessionsService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';
import { ModesModule } from '../modes/ModesModule';
import {
  IRitualSessionsRepository,
  RITUAL_SESSIONS_REPOSITORY,
} from '../../../core/adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { GetActiveRitualSessionInteractor } from '../../../core/interactors/ritualSessions/GetActiveRitualSessionInteractor';

@Module({
  imports: [JwtAuthModule, ModesModule],
  controllers: [ModeSessionsController],
  providers: [
    {
      provide: StartModeSessionInteractor,
      useFactory: (modeSessionsRepository: IModeSessionsRepository) =>
        new StartModeSessionInteractor(modeSessionsRepository),
      inject: [MODE_SESSIONS_REPOSITORY],
    },
    {
      provide: GetActiveModeSessionInteractor,
      useFactory: (modeSessionsRepository: IModeSessionsRepository) =>
        new GetActiveModeSessionInteractor(modeSessionsRepository),
      inject: [MODE_SESSIONS_REPOSITORY],
    },
    {
      provide: GetActiveRitualSessionInteractor,
      useFactory: (ritualSessionsRepository: IRitualSessionsRepository) =>
        new GetActiveRitualSessionInteractor(ritualSessionsRepository),
      inject: [RITUAL_SESSIONS_REPOSITORY],
    },
    {
      provide: ListUserModeSessionsInteractor,
      useFactory: (modeSessionsRepository: IModeSessionsRepository) =>
        new ListUserModeSessionsInteractor(modeSessionsRepository),
      inject: [MODE_SESSIONS_REPOSITORY],
    },
    {
      provide: ListModeSessionsByModeInteractor,
      useFactory: (modeSessionsRepository: IModeSessionsRepository) =>
        new ListModeSessionsByModeInteractor(modeSessionsRepository),
      inject: [MODE_SESSIONS_REPOSITORY],
    },
    {
      provide: GetModeSessionSummaryInteractor,
      useFactory: (modeSessionsRepository: IModeSessionsRepository) =>
        new GetModeSessionSummaryInteractor(modeSessionsRepository),
      inject: [MODE_SESSIONS_REPOSITORY],
    },
    {
      provide: FinishModeSessionInteractor,
      useFactory: (modeSessionsRepository: IModeSessionsRepository) =>
        new FinishModeSessionInteractor(modeSessionsRepository),
      inject: [MODE_SESSIONS_REPOSITORY],
    },
    ModeSessionsService,
  ],
  exports: [ModeSessionsService],
})
export class ModeSessionsModule {}
