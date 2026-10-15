import type {
  Assert,
  ChangePasswordBody,
  IsMutuallyAssignable,
  UpdateProfileBody
} from '@boncosaurus/shared';
import { type Static, t } from 'elysia';
import { MIN_PASSWORD_LENGTH } from '../integrations/crypto/password';

const password = t.String({ minLength: 1, maxLength: 256 });

export const updateProfileBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  email: t.Optional(t.String({ format: 'email', maxLength: 254 })),
  currentPassword: t.Optional(password)
});

export const changePasswordBody = t.Object({
  currentPassword: password,
  newPassword: t.String({ minLength: MIN_PASSWORD_LENGTH, maxLength: 256 })
});

type _UpdateProfileContract = Assert<IsMutuallyAssignable<Static<typeof updateProfileBody>, UpdateProfileBody>>;
type _ChangePasswordContract = Assert<IsMutuallyAssignable<Static<typeof changePasswordBody>, ChangePasswordBody>>;
