import { ApiBase } from "#api/api-base";
import { PokerogueSessionSavedataApi } from "#api/session-savedata-api";
import { PokerogueSystemSavedataApi } from "#api/system-savedata-api";
import { MAX_INT_ATTR_VALUE } from "#app/constants";
import type { UpdateAllSavedataRequest } from "#types/api";

/** A wrapper for PokéRogue savedata API requests. */
export class PokerogueSavedataApi extends ApiBase {
  public readonly system: PokerogueSystemSavedataApi;
  public readonly session: PokerogueSessionSavedataApi;

  constructor(base: string) {
    super(base);
    this.system = new PokerogueSystemSavedataApi(base);
    this.session = new PokerogueSessionSavedataApi(base);
  }

  /**
   * Update all savedata
   * @param bodyData The {@linkcode UpdateAllSavedataRequest | request data} to send
   * @returns An error message if something went wrong
   */
  public async updateAll(bodyData: UpdateAllSavedataRequest): Promise<string> {
    try {
      const rawBodyData = JSON.stringify(bodyData, (_k: any, v: any) =>
        typeof v === "bigint" ? (v <= MAX_INT_ATTR_VALUE ? Number(v) : v.toString()) : v,
      );
      const response = await this.doPost("/savedata/updateall", rawBodyData);
      return await response.text();
    } catch (err) {
      console.warn("Could not update all savedata!", err);
      return "Unknown error";
    }
  }
}
