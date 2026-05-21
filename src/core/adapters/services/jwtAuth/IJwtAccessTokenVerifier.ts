import { AuthenticatedUser } from '../../../entities/auth/AuthenticatedUser';

export const JWT_ACCESS_TOKEN_VERIFIER = Symbol('JWT_ACCESS_TOKEN_VERIFIER');

export interface IJwtAccessTokenVerifier {
  verify(accessToken: string): AuthenticatedUser;
}
