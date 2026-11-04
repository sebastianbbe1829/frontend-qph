export type UserRole = 'ADMIN' | 'USER';

export interface UserCreateRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface UserResponse {
  id: number;
  username: string;
  role: UserRole;
}
