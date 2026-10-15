import { Elysia } from 'elysia';
import { authConfig, authService } from '../container';
import { UnauthorizedError } from '../errors/app-error';
import { authPlugin } from '../plugins/auth.plugin';
import { loginBody, refreshCookie } from '../schemas/auth.schema';
import { REFRESH_COOKIE_NAME, buildRefreshCookie } from '../utils/auth/build-refresh-cookie';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/login',
    async ({ body, cookie }) => {
      const { refreshToken, refreshMaxAgeSeconds, ...session } = await authService.login(
        body.email,
        body.password
      );
      cookie[REFRESH_COOKIE_NAME]!.set(buildRefreshCookie(authConfig, refreshToken, refreshMaxAgeSeconds));
      return session;
    },
    { body: loginBody, cookie: refreshCookie }
  )
  .post(
    '/refresh',
    async ({ cookie }) => {
      const current = cookie[REFRESH_COOKIE_NAME]!.value;
      if (!current) throw new UnauthorizedError('INVALID_REFRESH_TOKEN', 'Refresh token is missing');

      const { refreshToken, refreshMaxAgeSeconds, ...session } = await authService.refresh(current);
      cookie[REFRESH_COOKIE_NAME]!.set(buildRefreshCookie(authConfig, refreshToken, refreshMaxAgeSeconds));
      return session;
    },
    { cookie: refreshCookie }
  )
  .post(
    '/logout',
    async ({ cookie, set }) => {
      await authService.logout(cookie[REFRESH_COOKIE_NAME]!.value);
      cookie[REFRESH_COOKIE_NAME]!.set(buildRefreshCookie(authConfig, '', 0));
      set.status = 204;
    },
    { cookie: refreshCookie }
  )
  .use(authPlugin)
  .get('/me', ({ userId }) => authService.getProfile(userId));
