import { ApiBase } from "#api/api-base";
import type {
  LinkAccountToDiscordIdRequest,
  LinkAccountToGoogledIdRequest,
  SearchAccountRequest,
  SearchAccountResponse,
  UnlinkAccountFromDiscordIdRequest,
  UnlinkAccountFromGoogledIdRequest,
} from "#types/api/pokerogue-admin-api";

export class PokerogueAdminApi extends ApiBase {
  public readonly ERR_USERNAME_NOT_FOUND: string = "Username not found!";

  /**
   * Links an account to a discord id.
   * @param params The {@linkcode LinkAccountToDiscordIdRequest} to send
   * @returns `null` if successful, error message if not
   */
  public async linkAccountToDiscord(params: LinkAccountToDiscordIdRequest) {
    try {
      const response = await this.doPost("/admin/account/discordLink", params, "form-urlencoded");

      if (response.ok) {
        return null;
      }
      console.warn("Could not link account with discord!", response.status, response.statusText);

      if (response.status === 404) {
        return this.ERR_USERNAME_NOT_FOUND;
      }
    } catch (err) {
      console.warn("Could not link account with discord!", err);
    }

    return this.ERR_GENERIC;
  }

  /**
   * Unlinks an account from a discord id.
   * @param params The {@linkcode UnlinkAccountFromDiscordIdRequest} to send
   * @returns `null` if successful, error message if not
   */
  public async unlinkAccountFromDiscord(params: UnlinkAccountFromDiscordIdRequest) {
    try {
      const response = await this.doPost("/admin/account/discordUnlink", params, "form-urlencoded");

      if (response.ok) {
        return null;
      }
      console.warn("Could not unlink account from discord!", response.status, response.statusText);

      if (response.status === 404) {
        return this.ERR_USERNAME_NOT_FOUND;
      }
    } catch (err) {
      console.warn("Could not unlink account from discord!", err);
    }

    return this.ERR_GENERIC;
  }

  /**
   * Links an account to a google id.
   * @param params The {@linkcode LinkAccountToGoogledIdRequest} to send
   * @returns `null` if successful, error message if not
   */
  public async linkAccountToGoogleId(params: LinkAccountToGoogledIdRequest) {
    try {
      const response = await this.doPost("/admin/account/googleLink", params, "form-urlencoded");

      if (response.ok) {
        return null;
      }
      console.warn("Could not link account with google!", response.status, response.statusText);

      if (response.status === 404) {
        return this.ERR_USERNAME_NOT_FOUND;
      }
    } catch (err) {
      console.warn("Could not link account with google!", err);
    }

    return this.ERR_GENERIC;
  }

  /**
   * Unlinks an account from a google id.
   * @param params The {@linkcode UnlinkAccountFromGoogledIdRequest} to send
   * @returns `null` if successful, error message if not
   */
  public async unlinkAccountFromGoogleId(params: UnlinkAccountFromGoogledIdRequest) {
    try {
      const response = await this.doPost("/admin/account/googleUnlink", params, "form-urlencoded");

      if (response.ok) {
        return null;
      }
      console.warn("Could not unlink account from google!", response.status, response.statusText);

      if (response.status === 404) {
        return this.ERR_USERNAME_NOT_FOUND;
      }
    } catch (err) {
      console.warn("Could not unlink account from google!", err);
    }

    return this.ERR_GENERIC;
  }

  /**
   * Search an account.
   * @param params The {@linkcode SearchAccountRequest} to send
   * @returns an array of {@linkcode SearchAccountResponse} and error. Both can be `undefined`
   */
  public async searchAccount(params: SearchAccountRequest): Promise<[data?: SearchAccountResponse, error?: string]> {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doGet(`/admin/account/adminSearch?${urlSearchParams}`);

      if (response.ok) {
        const resData: SearchAccountResponse = await response.json();
        return [resData, undefined];
      }
      console.warn("Could not find account!", response.status, response.statusText);

      if (response.status === 404) {
        return [undefined, this.ERR_USERNAME_NOT_FOUND];
      }
    } catch (err) {
      console.warn("Could not find account!", err);
    }

    return [undefined, this.ERR_GENERIC];
  }
}
