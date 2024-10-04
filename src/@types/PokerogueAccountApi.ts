import type { UserInfo } from "#app/@types/UserInfo";

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
