import type { BaseApiResponse } from "./BaseApiResponse";

export interface AccountLoginRequest {
  username: string;
  password: string;
}

export interface AccountLoginResponse extends BaseApiResponse {
  token: string;
}
