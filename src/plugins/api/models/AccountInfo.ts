import type { UserInfo } from "#app/account";
import type { BaseApiResponse } from "./BaseApiResponse";

export interface AccountInfoResponse extends BaseApiResponse, UserInfo {}
