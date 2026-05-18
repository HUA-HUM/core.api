import { Module } from '@nestjs/common';
import { RitualsController } from '../../controllers/rituals/RitualsController';
import {
  IRitualsRepository,
  RITUALS_REPOSITORY,
} from '../../../core/adapters/repositories/rituals/IRitualsRepository';
import { CreateRitualInteractor } from '../../../core/interactors/rituals/CreateRitualInteractor';
import { GetRitualInteractor } from '../../../core/interactors/rituals/GetRitualInteractor';
import { ListUserRitualsInteractor } from '../../../core/interactors/rituals/ListUserRitualsInteractor';
import { RitualsService } from '../../services/rituals/RitualsService';

@Module({
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
    RitualsService,
  ],
  exports: [RitualsService],
})
export class RitualsModule {}
