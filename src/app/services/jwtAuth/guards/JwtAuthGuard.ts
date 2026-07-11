import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AuthenticatedUser } from '../../../../core/entities/auth/AuthenticatedUser';
import { JWT_ACCESS_TOKEN_VERIFIER } from '../../../../core/adapters/services/jwtAuth/IJwtAccessTokenVerifier';
import type { IJwtAccessTokenVerifier } from '../../../../core/adapters/services/jwtAuth/IJwtAccessTokenVerifier';

export interface AuthenticatedRequest extends Request {
  authUser: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JWT_ACCESS_TOKEN_VERIFIER)
    private readonly jwtAccessTokenVerifier: IJwtAccessTokenVerifier,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = this.getBearerToken(request);
    const authUser = this.jwtAccessTokenVerifier.verify(accessToken);
    const rows = (await this.entityManager.query(
      `
        select u.id
        from users u
        join refresh_sessions rs on rs.user_id = u.id
        where u.id = $1
          and u.status = $2
          and rs.id = $3
          and rs.revoked_at is null
          and rs.expires_at > now()
        limit 1
      `,
      [authUser.id, 'active', authUser.sessionId],
    )) as Array<{ id: string }>;

    if (!rows[0]) {
      throw new UnauthorizedException('session was revoked or user account is no longer active');
    }

    request.authUser = authUser;
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
