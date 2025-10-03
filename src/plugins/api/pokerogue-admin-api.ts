import { ApiBase } from "#api/api-base";
import type {
  AdminUiHandlerService,
  AdminUiHandlerServiceMode,
  PokerogueAdminApiParams,
  SearchAccountRequest,
  SearchAccountResponse,
} from "#types/api/pokerogue-admin-api";

export class PokerogueAdminApi extends ApiBase {
  public readonly ERR_USERNAME_NOT_FOUND: string = "Username not found!";

  /**
   * Link or unlink a third party service to/from a user account
   * @param mode - The mode, either "Link" or "Unlink"
   * @param service - The third party service to perform the action with
   * @param params - The parameters for the user to perform the action on
   * @returns `null` if successful, otherwise an error message
   */
  public async linkUnlinkRequest(
    mode: AdminUiHandlerServiceMode,
    service: AdminUiHandlerService,
    params: PokerogueAdminApiParams[typeof service],
  ): Promise<string | null> {
    const endpoint = "/admin/account/" + service + mode;
    const preposition = mode === "Link" ? "with " : "from ";
    const errMsg = "Could not " + mode.toLowerCase() + " account " + preposition + service + "!";
    try {
      const response = await this.doPost(endpoint, params, "form-urlencoded");

      if (response.ok) {
        return null;
      }
      console.warn(errMsg, response.status, response.statusText);

      if (response.status === 404) {
        return this.ERR_USERNAME_NOT_FOUND;
      }
    } catch (err) {
      console.warn(errMsg, err);
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
