import type { WorkspaceRole } from '../constants/workspace-roles';

export type PublicUser = { id: string; email: string; name: string };

export type WorkspaceMembership = {
  id: string;
  name: string;
  baseCurrency: string;
  role: WorkspaceRole;
};

export type Profile = { user: PublicUser; workspaces: WorkspaceMembership[] };

export type LoginBody = { email: string; password: string };

export type SessionResponse = { accessToken: string; expiresIn: number };

export type UpdateProfileBody = { name?: string; email?: string; currentPassword?: string };

export type ChangePasswordBody = { currentPassword: string; newPassword: string };
