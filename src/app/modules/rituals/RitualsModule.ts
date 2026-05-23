import { Module } from '@nestjs/common';
import { RitualsController } from '../../controllers/rituals/RitualsController';
import {
  IRitualsRepository,
  RITUALS_REPOSITORY,
} from '../../../core/adapters/repositories/rituals/IRitualsRepository';
import { CreateRitualInteractor } from '../../../core/interactors/rituals/CreateRitualInteractor';
import { GetRitualInteractor } from '../../../core/interactors/rituals/GetRitualInteractor';
import { DeleteRitualInteractor } from '../../../core/interactors/rituals/DeleteRitualInteractor';
import { ListUserRitualsInteractor } from '../../../core/interactors/rituals/ListUserRitualsInteractor';
import {
  IRitualBlockedItemsRepository,
  RITUAL_BLOCKED_ITEMS_REPOSITORY,
} from '../../../core/adapters/repositories/ritualBlockedItems/IRitualBlockedItemsRepository';
import { ListRitualBlockedItemsInteractor } from '../../../core/interactors/ritualBlockedItems/ListRitualBlockedItemsInteractor';
import { ReplaceRitualBlockedItemsInteractor } from '../../../core/interactors/ritualBlockedItems/ReplaceRitualBlockedItemsInteractor';
import { RitualsService } from '../../services/rituals/RitualsService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

@Module({
  imports: [JwtAuthModule],
  controllers: [RitualsController],
  providers: [
    {
      provide: CreateRitualInteractor,
      useFactory: (ritualsRepository: IRitualsRepository) =>
        new CreateRitualInteractor(ritualsRepository),
      inject: [RITUALS_REPOSITORY],
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
      useFactory: (ritualsRepository: IRitualsRepository) =>
        new DeleteRitualInteractor(ritualsRepository),
      inject: [RITUALS_REPOSITORY],
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
      ) => new ReplaceRitualBlockedItemsInteractor(ritualBlockedItemsRepository),
      inject: [RITUAL_BLOCKED_ITEMS_REPOSITORY],
    },
    RitualsService,
  ],
  exports: [RitualsService],
})
export class RitualsModule {}
