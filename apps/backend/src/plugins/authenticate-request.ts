import { accessTokenService } from '../container';
import { UnauthorizedError } from '../errors/app-error';
import { parseBearerToken } from '../utils/auth/parse-bearer-token';

export async function authenticateRequest(authorizationHeader: string | undefined): Promise<string> {
  const token = parseBearerToken(authorizationHeader);
  const userId = token ? await accessTokenService.verify(token) : null;
  if (!userId) {
    throw new UnauthorizedError('UNAUTHENTICATED', 'Missing or invalid access token');
  }
  return userId;
}
