import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../../../core/entities/auth/AuthenticatedUser';
import {
  JWT_ACCESS_TOKEN_VERIFIER,
} from '../../../../core/adapters/services/jwtAuth/IJwtAccessTokenVerifier';
import type { IJwtAccessTokenVerifier } from '../../../../core/adapters/services/jwtAuth/IJwtAccessTokenVerifier';

export interface AuthenticatedRequest extends Request {
  authUser: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JWT_ACCESS_TOKEN_VERIFIER)
    private readonly jwtAccessTokenVerifier: IJwtAccessTokenVerifier,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = this.getBearerToken(request);
    request.authUser = this.jwtAccessTokenVerifier.verify(accessToken);
    return true;
  }

  private getBearerToken(request: Request): string {
    const header = request.headers.authorization;

    if (!header) {
      throw new UnauthorizedException('authorization header is required');
    }

    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('authorization header must be Bearer');
    }

    return token;
  }
}
