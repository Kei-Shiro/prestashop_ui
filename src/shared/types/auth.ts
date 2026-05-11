import type { User } from './user';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

