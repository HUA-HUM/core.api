import { Module } from '@nestjs/common';
import { JWT_ACCESS_TOKEN_VERIFIER } from '../../../core/adapters/services/jwtAuth/IJwtAccessTokenVerifier';
import { HmacJwtAccessTokenVerifierService } from '../../services/jwtAuth/HmacJwtAccessTokenVerifierService';
import { JwtAuthGuard } from '../../services/jwtAuth/guards/JwtAuthGuard';

@Module({
  providers: [
    {
      provide: JWT_ACCESS_TOKEN_VERIFIER,
      useClass: HmacJwtAccessTokenVerifierService,
    },
    JwtAuthGuard,
  ],
  exports: [JWT_ACCESS_TOKEN_VERIFIER, JwtAuthGuard],
})
export class JwtAuthModule {}
