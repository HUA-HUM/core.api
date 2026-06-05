import { Module } from '@nestjs/common';
import {
  IRitualSessionsRepository,
  RITUAL_SESSIONS_REPOSITORY,
} from '../../../core/adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { FinishRitualSessionInteractor } from '../../../core/interactors/ritualSessions/FinishRitualSessionInteractor';
import { GetActiveRitualSessionInteractor } from '../../../core/interactors/ritualSessions/GetActiveRitualSessionInteractor';
import { GetRitualSessionSummaryInteractor } from '../../../core/interactors/ritualSessions/GetRitualSessionSummaryInteractor';
import { ListRitualSessionsByRitualInteractor } from '../../../core/interactors/ritualSessions/ListRitualSessionsByRitualInteractor';
import { ListUserRitualSessionsInteractor } from '../../../core/interactors/ritualSessions/ListUserRitualSessionsInteractor';
import { StartRitualSessionInteractor } from '../../../core/interactors/ritualSessions/StartRitualSessionInteractor';
import { RecordRitualSessionInteractor } from '../../../core/interactors/ritualSessions/RecordRitualSessionInteractor';
import { RitualSessionsController } from '../../controllers/ritualSessions/RitualSessionsController';
import { RitualSessionsService } from '../../services/ritualSessions/RitualSessionsService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';
import { RitualsModule } from '../rituals/RitualsModule';

@Module({
  imports: [JwtAuthModule, RitualsModule],
  controllers: [RitualSessionsController],
  providers: [
    {
      provide: StartRitualSessionInteractor,
      useFactory: (ritualSessionsRepository: IRitualSessionsRepository) =>
        new StartRitualSessionInteractor(ritualSessionsRepository),
      inject: [RITUAL_SESSIONS_REPOSITORY],
    },
    {
      provide: GetActiveRitualSessionInteractor,
      useFactory: (ritualSessionsRepository: IRitualSessionsRepository) =>
        new GetActiveRitualSessionInteractor(ritualSessionsRepository),
      inject: [RITUAL_SESSIONS_REPOSITORY],
    },
    {
      provide: ListUserRitualSessionsInteractor,
      useFactory: (ritualSessionsRepository: IRitualSessionsRepository) =>
        new ListUserRitualSessionsInteractor(ritualSessionsRepository),
      inject: [RITUAL_SESSIONS_REPOSITORY],
    },

    {
      provide: ListRitualSessionsByRitualInteractor,
      useFactory: (ritualSessionsRepository: IRitualSessionsRepository) =>
        new ListRitualSessionsByRitualInteractor(ritualSessionsRepository),
      inject: [RITUAL_SESSIONS_REPOSITORY],
    },
    {
      provide: GetRitualSessionSummaryInteractor,
      useFactory: (ritualSessionsRepository: IRitualSessionsRepository) =>
        new GetRitualSessionSummaryInteractor(ritualSessionsRepository),
      inject: [RITUAL_SESSIONS_REPOSITORY],
    },
    {
      provide: FinishRitualSessionInteractor,
      useFactory: (ritualSessionsRepository: IRitualSessionsRepository) =>
        new FinishRitualSessionInteractor(ritualSessionsRepository),
      inject: [RITUAL_SESSIONS_REPOSITORY],
    },
    {
      provide: RecordRitualSessionInteractor,
      useFactory: (ritualSessionsRepository: IRitualSessionsRepository) =>
        new RecordRitualSessionInteractor(ritualSessionsRepository),
      inject: [RITUAL_SESSIONS_REPOSITORY],
    },
    RitualSessionsService,
  ],
  exports: [RitualSessionsService],
})
export class RitualSessionsModule {}
