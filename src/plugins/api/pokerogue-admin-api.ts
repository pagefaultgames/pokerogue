import type { LinkAccountToDiscordIdRequest } from "#app/@types/PokerogueAdminApi";
import { ApiBase } from "#app/plugins/api/api-base";

export class PokerogueAdminApi extends ApiBase {
  /**
   * Links an account to a discord id.
   * @param params The {@linkcode LinkAccountToDiscordIdRequest} to send
   * @returns `true` if successful, `false` if not
   */
  public async linkAccountToDiscord(params: LinkAccountToDiscordIdRequest) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doPost("/admin/account/discord-link", urlSearchParams, "form-urlencoded");

      if (response.ok) {
        return true;
      } else {
        console.warn("Could not link account with discord!", response.status, response.statusText);
      }
    } catch (err) {
      console.warn("Could not link account with discord!", err);
    }

    return false;
  }
}
