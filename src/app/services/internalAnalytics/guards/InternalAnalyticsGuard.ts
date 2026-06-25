import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { env } from '../../../../config/env';

@Injectable()
export class InternalAnalyticsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configuredKey = env.internalAnalyticsApiKey;

    if (!configuredKey) {
      throw new UnauthorizedException('internal analytics key is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const headerKey = request.headers['x-internal-api-key'];
    const providedKey = Array.isArray(headerKey) ? headerKey[0] : headerKey;

    if (providedKey !== configuredKey) {
      throw new UnauthorizedException('invalid internal analytics key');
    }

    return true;
  }
}
