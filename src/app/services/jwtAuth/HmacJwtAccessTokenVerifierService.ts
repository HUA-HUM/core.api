import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../../config/env';
import { AuthenticatedUser } from '../../../core/entities/auth/AuthenticatedUser';
import { IJwtAccessTokenVerifier } from '../../../core/adapters/services/jwtAuth/IJwtAccessTokenVerifier';

interface JwtHeader {
  alg?: string;
  typ?: string;
}

interface AccessTokenPayload {
  sub?: string;
  sessionId?: string;
  email?: string | null;
  status?: string | null;
  exp?: number;
}

@Injectable()
export class HmacJwtAccessTokenVerifierService
  implements IJwtAccessTokenVerifier
{
  verify(accessToken: string): AuthenticatedUser {
    const secret = env.jwtAccessSecret;

    if (!secret) {
      throw new UnauthorizedException('JWT_ACCESS_SECRET is not configured');
    }

    const parts = accessToken.split('.');

    if (parts.length !== 3) {
      throw new UnauthorizedException('invalid access token format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = this.decodeJson<JwtHeader>(encodedHeader);

    if (header.alg !== 'HS256') {
      throw new UnauthorizedException('unsupported access token algorithm');
    }

    const expectedSignature = this.sign(
      `${encodedHeader}.${encodedPayload}`,
      secret,
    );

    if (!this.signaturesMatch(encodedSignature, expectedSignature)) {
      throw new UnauthorizedException('invalid access token signature');
    }

    const payload = this.decodeJson<AccessTokenPayload>(encodedPayload);

    if (!payload.sub) {
      throw new UnauthorizedException('access token subject is missing');
    }

    if (!payload.sessionId) {
      throw new UnauthorizedException('access token session is missing');
    }

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      throw new UnauthorizedException('access token expired');
    }

    return {
      id: payload.sub,
      sessionId: payload.sessionId,
      email: payload.email,
      status: payload.status,
    };
  }

  private decodeJson<T>(value: string): T {
    try {
      const json = Buffer.from(value, 'base64url').toString('utf8');
      return JSON.parse(json) as T;
    } catch {
      throw new UnauthorizedException('invalid access token payload');
    }
  }

  private sign(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('base64url');
  }

  private signaturesMatch(received: string, expected: string): boolean {
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(receivedBuffer, expectedBuffer);
  }
}
