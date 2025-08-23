import type { UserInfo } from "#types/user-info";

export interface AccountInfoResponse extends UserInfo {}

export interface AccountLoginRequest {
  username: string;
  password: string;
}

export interface AccountLoginResponse {
  token: string;
}

export interface AccountRegisterRequest {
  username: string;
  password: string;
}

export interface AccountChangePwRequest {
  password: string;
}
export interface AccountChangePwResponse {
  success: boolean;
}
