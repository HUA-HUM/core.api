export interface AuthenticatedUser {
  id: string;
  sessionId: string;
  email?: string | null;
  status?: string | null;
}
