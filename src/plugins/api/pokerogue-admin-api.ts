import { Api } from "#app/plugins/api/api";
import type { LinkAccountToDiscordIdRequest } from "#app/plugins/api/models/LinkAccountToDiscordId";

export class PokerogueAdminApi extends Api {
  /**
   * Links an account to a discord id.
   * @param linkData The {@linkcode LinkAccountToDiscordIdRequest} to send
   * @returns `true` if successful, `false` if not
   */
  public async linkAccountToDiscordId(linkData: LinkAccountToDiscordIdRequest) {
    try {
      const linkArr = Object.entries(linkData).map(([key, value]) => [key, String(value)]);
      const params = new URLSearchParams(linkArr);
      const response = await this.doPost("/admin/account/discord-link", params, "form-urlencoded");

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
