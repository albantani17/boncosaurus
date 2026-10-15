import type { Assert, IsMutuallyAssignable, LoginBody } from '@boncosaurus/shared';
import { type Static, t } from 'elysia';
import { REFRESH_COOKIE_NAME } from '../utils/build-refresh-cookie';

export const loginBody = t.Object({
  email: t.String({ minLength: 3, maxLength: 254 }),
  password: t.String({ minLength: 1, maxLength: 256 })
});

export const refreshCookie = t.Cookie({
  [REFRESH_COOKIE_NAME]: t.Optional(t.String())
});

type _LoginContract = Assert<IsMutuallyAssignable<Static<typeof loginBody>, LoginBody>>;
