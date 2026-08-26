import { Module } from '@nestjs/common';
import { RitualsController } from '../../controllers/rituals/RitualsController';
import {
  IRitualsRepository,
  RITUALS_REPOSITORY,
} from '../../../core/adapters/repositories/rituals/IRitualsRepository';
import { CreateRitualInteractor } from '../../../core/interactors/rituals/CreateRitualInteractor';
import { UpdateRitualInteractor } from '../../../core/interactors/rituals/UpdateRitualInteractor';
import { GetRitualInteractor } from '../../../core/interactors/rituals/GetRitualInteractor';
import { DeleteRitualInteractor } from '../../../core/interactors/rituals/DeleteRitualInteractor';
import { ListUserRitualsInteractor } from '../../../core/interactors/rituals/ListUserRitualsInteractor';
import { GetActiveRitualSessionInteractor } from '../../../core/interactors/ritualSessions/GetActiveRitualSessionInteractor';
import {
  IRitualSessionsRepository,
  RITUAL_SESSIONS_REPOSITORY,
} from '../../../core/adapters/repositories/ritualSessions/IRitualSessionsRepository';
import {
  IRitualBlockedItemsRepository,
  RITUAL_BLOCKED_ITEMS_REPOSITORY,
} from '../../../core/adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import { ListRitualBlockedItemsInteractor } from '../../../core/interactors/ritualBlockedItems/ListRitualBlockedItemsInteractor';
import { ReplaceRitualBlockedItemsInteractor } from '../../../core/interactors/ritualBlockedItems/ReplaceRitualBlockedItemsInteractor';
import {
  IRitualBreaksRepository,
  RITUAL_BREAKS_REPOSITORY,
} from '../../../core/adapters/repositories/ritualBreaks/IRitualBreaksRepository';
import { GetRitualBreaksInteractor } from '../../../core/interactors/ritualBreaks/GetRitualBreaksInteractor';
import { SaveRitualBreaksInteractor } from '../../../core/interactors/ritualBreaks/SaveRitualBreaksInteractor';
import { SQLRitualBreaksRepository } from '../../drivers/repositories/ritualBreaks/SQLRitualBreaksRepository';
import { InitialRitualBreaksService } from '../../services/ritualBreaks/InitialRitualBreaksService';
import { RitualsService } from '../../services/rituals/RitualsService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';
import {
  IRitualPasswordHasher,
  RITUAL_PASSWORD_HASHER,
} from '../../../core/adapters/services/rituals/IRitualPasswordHasher';
import { ScryptRitualPasswordHasher } from '../../services/rituals/ScryptRitualPasswordHasher';

@Module({
  imports: [JwtAuthModule],
  controllers: [RitualsController],
  providers: [
    {
      provide: CreateRitualInteractor,
      useFactory: (
        ritualsRepository: IRitualsRepository,
        passwordHasher: IRitualPasswordHasher,
      ) => new CreateRitualInteractor(ritualsRepository, passwordHasher),
      inject: [RITUALS_REPOSITORY, RITUAL_PASSWORD_HASHER],
    },
    {
      provide: ListUserRitualsInteractor,
      useFactory: (ritualsRepository: IRitualsRepository) =>
        new ListUserRitualsInteractor(ritualsRepository),
      inject: [RITUALS_REPOSITORY],
    },
    {
      provide: GetRitualInteractor,
      useFactory: (ritualsRepository: IRitualsRepository) =>
        new GetRitualInteractor(ritualsRepository),
      inject: [RITUALS_REPOSITORY],
    },
    {
      provide: DeleteRitualInteractor,
      useFactory: (
        ritualsRepository: IRitualsRepository,
        passwordHasher: IRitualPasswordHasher,
      ) => new DeleteRitualInteractor(ritualsRepository, passwordHasher),
      inject: [RITUALS_REPOSITORY, RITUAL_PASSWORD_HASHER],
    },
    {
      provide: UpdateRitualInteractor,
      useFactory: (
        ritualsRepository: IRitualsRepository,
        passwordHasher: IRitualPasswordHasher,
      ) => new UpdateRitualInteractor(ritualsRepository, passwordHasher),
      inject: [RITUALS_REPOSITORY, RITUAL_PASSWORD_HASHER],
    },
    {
      provide: GetActiveRitualSessionInteractor,
      useFactory: (ritualSessionsRepository: IRitualSessionsRepository) =>
        new GetActiveRitualSessionInteractor(ritualSessionsRepository),
      inject: [RITUAL_SESSIONS_REPOSITORY],
    },
    {
      provide: RITUAL_PASSWORD_HASHER,
      useClass: ScryptRitualPasswordHasher,
    },

    {
      provide: ListRitualBlockedItemsInteractor,
      useFactory: (
        ritualBlockedItemsRepository: IRitualBlockedItemsRepository,
      ) => new ListRitualBlockedItemsInteractor(ritualBlockedItemsRepository),
      inject: [RITUAL_BLOCKED_ITEMS_REPOSITORY],
    },
    {
      provide: ReplaceRitualBlockedItemsInteractor,
      useFactory: (
        ritualBlockedItemsRepository: IRitualBlockedItemsRepository,
      ) =>
        new ReplaceRitualBlockedItemsInteractor(ritualBlockedItemsRepository),
      inject: [RITUAL_BLOCKED_ITEMS_REPOSITORY],
    },
    {
      provide: RITUAL_BREAKS_REPOSITORY,
      useClass: SQLRitualBreaksRepository,
    },
    {
      provide: GetRitualBreaksInteractor,
      useFactory: (ritualBreaksRepository: IRitualBreaksRepository) =>
        new GetRitualBreaksInteractor(ritualBreaksRepository),
      inject: [RITUAL_BREAKS_REPOSITORY],
    },
    {
      provide: SaveRitualBreaksInteractor,
      useFactory: (ritualBreaksRepository: IRitualBreaksRepository) =>
        new SaveRitualBreaksInteractor(ritualBreaksRepository),
      inject: [RITUAL_BREAKS_REPOSITORY],
    },
    InitialRitualBreaksService,
    RitualsService,
  ],
  exports: [RitualsService],
})
export class RitualsModule {}
