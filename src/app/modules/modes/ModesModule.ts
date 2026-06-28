import { Module } from '@nestjs/common';
import { ModesController } from '../../controllers/modes/ModesController';
import {
  IModesRepository,
  MODES_REPOSITORY,
} from '../../../core/adapters/repositories/modes/IModesRepository';
import {
  IModeBlockedItemsRepository,
  MODE_BLOCKED_ITEMS_REPOSITORY,
} from '../../../core/adapters/repositories/modeBlockedItems/IModeBlockedItemsRepository';
import {
  IRitualPasswordHasher,
  RITUAL_PASSWORD_HASHER,
} from '../../../core/adapters/services/rituals/IRitualPasswordHasher';
import { CreateModeInteractor } from '../../../core/interactors/modes/CreateModeInteractor';
import { EnsureDefaultModesInteractor } from '../../../core/interactors/modes/EnsureDefaultModesInteractor';
import { GetModeInteractor } from '../../../core/interactors/modes/GetModeInteractor';
import { ListUserModesInteractor } from '../../../core/interactors/modes/ListUserModesInteractor';
import { UpdateModeInteractor } from '../../../core/interactors/modes/UpdateModeInteractor';
import { ListModeBlockedItemsInteractor } from '../../../core/interactors/modeBlockedItems/ListModeBlockedItemsInteractor';
import { ReplaceModeBlockedItemsInteractor } from '../../../core/interactors/modeBlockedItems/ReplaceModeBlockedItemsInteractor';
import { ModesService } from '../../services/modes/ModesService';
import { ScryptRitualPasswordHasher } from '../../services/rituals/ScryptRitualPasswordHasher';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

@Module({
  imports: [JwtAuthModule],
  controllers: [ModesController],
  providers: [
    {
      provide: CreateModeInteractor,
      useFactory: (
        modesRepository: IModesRepository,
        passwordHasher: IRitualPasswordHasher,
      ) => new CreateModeInteractor(modesRepository, passwordHasher),
      inject: [MODES_REPOSITORY, RITUAL_PASSWORD_HASHER],
    },
    {
      provide: EnsureDefaultModesInteractor,
      useFactory: (modesRepository: IModesRepository) =>
        new EnsureDefaultModesInteractor(modesRepository),
      inject: [MODES_REPOSITORY],
    },
    {
      provide: ListUserModesInteractor,
      useFactory: (modesRepository: IModesRepository) =>
        new ListUserModesInteractor(modesRepository),
      inject: [MODES_REPOSITORY],
    },
    {
      provide: GetModeInteractor,
      useFactory: (modesRepository: IModesRepository) =>
        new GetModeInteractor(modesRepository),
      inject: [MODES_REPOSITORY],
    },
    {
      provide: UpdateModeInteractor,
      useFactory: (modesRepository: IModesRepository) =>
        new UpdateModeInteractor(modesRepository),
      inject: [MODES_REPOSITORY],
    },
    {
      provide: RITUAL_PASSWORD_HASHER,
      useClass: ScryptRitualPasswordHasher,
    },
    {
      provide: ListModeBlockedItemsInteractor,
      useFactory: (modeBlockedItemsRepository: IModeBlockedItemsRepository) =>
        new ListModeBlockedItemsInteractor(modeBlockedItemsRepository),
      inject: [MODE_BLOCKED_ITEMS_REPOSITORY],
    },
    {
      provide: ReplaceModeBlockedItemsInteractor,
      useFactory: (modeBlockedItemsRepository: IModeBlockedItemsRepository) =>
        new ReplaceModeBlockedItemsInteractor(modeBlockedItemsRepository),
      inject: [MODE_BLOCKED_ITEMS_REPOSITORY],
    },
    ModesService,
  ],
  exports: [ModesService],
})
export class ModesModule {}
