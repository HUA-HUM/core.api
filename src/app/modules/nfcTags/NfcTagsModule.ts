import { Module } from '@nestjs/common';
import { NfcTagsController } from '../../controllers/nfcTags/NfcTagsController';
import {
  INfcTagsRepository,
  NFC_TAGS_REPOSITORY,
} from '../../../core/adapters/repositories/nfcTags/INfcTagsRepository';
import { ClaimNfcTagInteractor } from '../../../core/interactors/nfcTags/ClaimNfcTagInteractor';
import { ListUserNfcTagClaimsInteractor } from '../../../core/interactors/nfcTags/ListUserNfcTagClaimsInteractor';
import { VerifyNfcTagInteractor } from '../../../core/interactors/nfcTags/VerifyNfcTagInteractor';
import { RevokeNfcTagClaimInteractor } from '../../../core/interactors/nfcTags/RevokeNfcTagClaimInteractor';
import { UpdateNfcTagClaimLabelInteractor } from '../../../core/interactors/nfcTags/UpdateNfcTagClaimLabelInteractor';
import { InviteNfcTagMemberInteractor } from '../../../core/interactors/nfcTags/InviteNfcTagMemberInteractor';
import { NfcTagsService } from '../../services/nfcTags/NfcTagsService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';
import {
  IModeSessionsRepository,
  MODE_SESSIONS_REPOSITORY,
} from '../../../core/adapters/repositories/modeSessions/IModeSessionsRepository';
import {
  IRitualSessionsRepository,
  RITUAL_SESSIONS_REPOSITORY,
} from '../../../core/adapters/repositories/ritualSessions/IRitualSessionsRepository';
import { GetActiveModeSessionInteractor } from '../../../core/interactors/modeSessions/GetActiveModeSessionInteractor';
import { GetActiveRitualSessionInteractor } from '../../../core/interactors/ritualSessions/GetActiveRitualSessionInteractor';

@Module({
  imports: [JwtAuthModule],
  controllers: [NfcTagsController],
  providers: [
    {
      provide: ClaimNfcTagInteractor,
      useFactory: (nfcTagsRepository: INfcTagsRepository) =>
        new ClaimNfcTagInteractor(nfcTagsRepository),
      inject: [NFC_TAGS_REPOSITORY],
    },
    {
      provide: ListUserNfcTagClaimsInteractor,
      useFactory: (nfcTagsRepository: INfcTagsRepository) =>
        new ListUserNfcTagClaimsInteractor(nfcTagsRepository),
      inject: [NFC_TAGS_REPOSITORY],
    },
    {
      provide: VerifyNfcTagInteractor,
      useFactory: (nfcTagsRepository: INfcTagsRepository) =>
        new VerifyNfcTagInteractor(nfcTagsRepository),
      inject: [NFC_TAGS_REPOSITORY],
    },
    {
      provide: RevokeNfcTagClaimInteractor,
      useFactory: (nfcTagsRepository: INfcTagsRepository) =>
        new RevokeNfcTagClaimInteractor(nfcTagsRepository),
      inject: [NFC_TAGS_REPOSITORY],
    },
    {
      provide: UpdateNfcTagClaimLabelInteractor,
      useFactory: (nfcTagsRepository: INfcTagsRepository) =>
        new UpdateNfcTagClaimLabelInteractor(nfcTagsRepository),
      inject: [NFC_TAGS_REPOSITORY],
    },
    {
      provide: InviteNfcTagMemberInteractor,
      useFactory: (nfcTagsRepository: INfcTagsRepository) =>
        new InviteNfcTagMemberInteractor(nfcTagsRepository),
      inject: [NFC_TAGS_REPOSITORY],
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
    NfcTagsService,
  ],
  exports: [NfcTagsService],
})
export class NfcTagsModule {}
