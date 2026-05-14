export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: import('./user').User
}

export interface AuthState {
  user: import('./user').User | null;
  token: string | null;
  isAuthenticated: boolean;
}

