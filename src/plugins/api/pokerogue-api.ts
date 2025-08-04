import { ApiBase } from "#api/api-base";
import { PokerogueAccountApi } from "#api/pokerogue-account-api";
import { PokerogueAdminApi } from "#api/pokerogue-admin-api";
import { PokerogueDailyApi } from "#api/pokerogue-daily-api";
import { PokerogueSavedataApi } from "#api/pokerogue-savedata-api";
import type { TitleStatsResponse } from "#types/api/pokerogue-api-types";

/**
 * A wrapper for PokéRogue API requests.
 */
export class PokerogueApi extends ApiBase {
  //#region Fields∏

  public readonly account: PokerogueAccountApi;
  public readonly daily: PokerogueDailyApi;
  public readonly admin: PokerogueAdminApi;
  public readonly savedata: PokerogueSavedataApi;

  //#region Public

  constructor(base: string) {
    super(base);
    this.account = new PokerogueAccountApi(base);
    this.daily = new PokerogueDailyApi(base);
    this.admin = new PokerogueAdminApi(base);
    this.savedata = new PokerogueSavedataApi(base);
  }

  /**
   * Request game title-stats.
   */
  public async getGameTitleStats() {
    try {
      const response = await this.doGet("/game/titlestats");
      return (await response.json()) as TitleStatsResponse;
    } catch (err) {
      console.warn("Could not get game title stats!", err);
      return null;
    }
  }

  /**
   * Unlink the currently logged in user from Discord.
   * @returns `true` if unlinking was successful, `false` if not
   */
  public async unlinkDiscord() {
    try {
      const response = await this.doPost("/auth/discord/logout");
      if (response.ok) {
        return true;
      }
      console.warn(`Discord unlink failed (${response.status}: ${response.statusText})`);
    } catch (err) {
      console.warn("Could not unlink Discord!", err);
    }

    return false;
  }

  /**
   * Unlink the currently logged in user from Google.
   * @returns `true` if unlinking was successful, `false` if not
   */
  public async unlinkGoogle() {
    try {
      const response = await this.doPost("/auth/google/logout");
      if (response.ok) {
        return true;
      }
      console.warn(`Google unlink failed (${response.status}: ${response.statusText})`);
    } catch (err) {
      console.warn("Could not unlink Google!", err);
    }

    return false;
  }

  //#endregion
}

export const pokerogueApi = new PokerogueApi(import.meta.env.VITE_SERVER_URL ?? "http://localhost:8001");
