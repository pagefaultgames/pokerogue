import { ApiBase } from "#api/api-base";
import { SESSION_ID_COOKIE_NAME } from "#app/constants";
import type {
  AccountChangePwRequest,
  AccountInfoResponse,
  AccountLoginRequest,
  AccountLoginResponse,
  AccountRegisterRequest,
} from "#types/api/pokerogue-account-api";
import { removeCookie, setCookie } from "#utils/cookies";

/**
 * A wrapper for PokéRogue account API requests.
 */
export class PokerogueAccountApi extends ApiBase {
  //#region Public

  /**
   * Request the {@linkcode AccountInfoResponse | UserInfo} of the logged in user.
   * The user is identified by the {@linkcode SESSION_ID_COOKIE_NAME | session cookie}.
   */
  public async getInfo(): Promise<[data: AccountInfoResponse | null, status: number]> {
    try {
      const response = await this.doGet("/account/info");

      if (response.ok) {
        const resData = (await response.json()) as AccountInfoResponse;
        return [resData, response.status];
      }
      console.warn("Could not get account info!", response.status, response.statusText);
      return [null, response.status];
    } catch (err) {
      console.warn("Could not get account info!", err);
      return [null, 500];
    }
  }

  /**
   * Register a new account.
   * @param registerData The {@linkcode AccountRegisterRequest} to send
   * @returns An error message if something went wrong
   */
  public async register(registerData: AccountRegisterRequest) {
    try {
      const response = await this.doPost("/account/register", registerData, "form-urlencoded");

      if (response.ok) {
        return null;
      }
      return response.text();
    } catch (err) {
      console.warn("Register failed!", err);
    }

    return "Unknown error!";
  }

  /**
   * Send a login request.
   * Sets the session cookie on success.
   * @param loginData The {@linkcode AccountLoginRequest} to send
   * @returns An error message if something went wrong
   */
  public async login(loginData: AccountLoginRequest) {
    try {
      const response = await this.doPost("/account/login", loginData, "form-urlencoded");

      if (response.ok) {
        const loginResponse = (await response.json()) as AccountLoginResponse;
        setCookie(SESSION_ID_COOKIE_NAME, loginResponse.token);
        return null;
      }
      console.warn("Login failed!", response.status, response.statusText);
      return response.text();
    } catch (err) {
      console.warn("Login failed!", err);
    }

    return "Unknown error!";
  }

  /**
   * Send a logout request.
   * **Always** (no matter if failed or not) removes the session cookie.
   */
  public async logout() {
    try {
      const response = await this.doGet("/account/logout");

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.warn("Log out failed!", err);
    }

    removeCookie(SESSION_ID_COOKIE_NAME); // we are always clearing the cookie.
  }

  public async changePassword(changePwData: AccountChangePwRequest) {
    try {
      const response = await this.doPost("/account/changepw", changePwData, "form-urlencoded");
      if (response.ok) {
        return null;
      }
      console.warn("Change password failed!", response.status, response.statusText);
      return response.text();
    } catch (err) {
      console.warn("Change password failed!", err);
    }

    return "Unknown error!";
  }
}
