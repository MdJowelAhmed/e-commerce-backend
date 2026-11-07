import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  MANAGER = 'manager',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (UserRole | 'admin' | 'customer' | 'manager')[]) =>
  SetMetadata(ROLES_KEY, roles);

