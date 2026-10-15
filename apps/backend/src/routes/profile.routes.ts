import { Elysia } from 'elysia';
import { authConfig, authService, profileService } from '../container';
import { authPlugin } from '../plugins/auth.plugin';
import { changePasswordBody, updateProfileBody } from '../schemas/profile.schema';
import { refreshCookie } from '../schemas/auth.schema';
import { REFRESH_COOKIE_NAME, buildRefreshCookie } from '../utils/build-refresh-cookie';

export const profileRoutes = new Elysia({ prefix: '/auth/me' })
  .use(authPlugin)
  .patch('/', ({ userId, body }) => profileService.updateProfile(userId, body), {
    body: updateProfileBody
  })
  .post(
    '/password',
    async ({ userId, body, cookie }) => {
      await profileService.changePassword(userId, body.currentPassword, body.newPassword);
      const { refreshToken, refreshMaxAgeSeconds, ...session } = await authService.startSession(userId);
      cookie[REFRESH_COOKIE_NAME]!.set(buildRefreshCookie(authConfig, refreshToken, refreshMaxAgeSeconds));
      return session;
    },
    { body: changePasswordBody, cookie: refreshCookie }
  );
