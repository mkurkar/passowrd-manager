// Types for the SecureVault mobile application

export interface User {
  id: string;
  email: string;
  name: string;
  created: string;
  updated: string;
}

export interface EnvironmentVariable {
  id: string;
  user: string;
  name: string;
  value: string; // encrypted
  environment: 'development' | 'staging' | 'production' | 'all';
  project?: string;
  description?: string;
  created: string;
  updated: string;
}

export interface Password {
  id: string;
  user: string;
  name: string;
  username: string; // encrypted
  password: string; // encrypted
  url?: string;
  notes?: string; // encrypted
  category?: string;
  totpSecret?: string; // encrypted
  created: string;
  updated: string;
}

export interface TOTPAccount {
  id: string;
  user: string;
  name: string;
  issuer: string;
  secret: string; // encrypted
  created: string;
  updated: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
}

export interface PasswordForm {
  name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  totpSecret?: string;
}

export interface EnvVarForm {
  name: string;
  value: string;
  environment: 'development' | 'staging' | 'production' | 'all';
  project?: string;
  description?: string;
}

export interface TOTPForm {
  name: string;
  issuer: string;
  secret: string;
}

// Environment type for select options
export type EnvironmentType = 'development' | 'staging' | 'production' | 'all';

export const ENVIRONMENT_OPTIONS: { value: EnvironmentType; label: string }[] = [
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
  { value: 'all', label: 'All Environments' },
];
