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
import { NfcTagsService } from '../../services/nfcTags/NfcTagsService';
import { JwtAuthModule } from '../jwtAuth/JwtAuthModule';

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
    NfcTagsService,
  ],
  exports: [NfcTagsService],
})
export class NfcTagsModule {}
