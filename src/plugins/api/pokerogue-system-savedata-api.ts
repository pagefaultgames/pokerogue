import type {
  GetSystemSavedataRequest,
  UpdateSystemSavedataRequest,
  VerifySystemSavedataRequest,
  VerifySystemSavedataResponse,
} from "#app/@types/PokerogueSystemSavedataApi";
import { ApiBase } from "#app/plugins/api/api-base";

/**
 * A wrapper for PokéRogue system savedata API requests.
 */
export class PokerogueSystemSavedataApi extends ApiBase {
  //#region Public

  /**
   * Get a system savedata.
   * @param params The {@linkcode GetSystemSavedataRequest} to send
   * @returns The system savedata as `string` or `null` on error
   */
  public async get(params: GetSystemSavedataRequest) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doGet(`/savedata/system/get?${urlSearchParams}`);
      const rawSavedata = await response.text();

      return rawSavedata;
    } catch (err) {
      console.warn("Could not get system savedata!", err);
      return null;
    }
  }

  /**
   * Verify if the session is valid.
   * If not the {@linkcode SystemSaveData} is returned.
   * @param params The {@linkcode VerifySystemSavedataRequest} to send
   * @returns A {@linkcode SystemSaveData} if **NOT** valid, otherwise `null`.
   */
  public async verify(params: VerifySystemSavedataRequest) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doGet(`/savedata/system/verify?${urlSearchParams}`);

      if (response.ok) {
        const verifySavedata = (await response.json()) as VerifySystemSavedataResponse;

        if (!verifySavedata.valid) {
          return verifySavedata.systemData;
        } else {
          console.warn("Invalid system savedata!");
        }
      }
    } catch (err) {
      console.warn("Could not verify system savedata!", err);
    }

    return null;
  }

  /**
   * Update a system savedata.
   * @param params The {@linkcode UpdateSystemSavedataRequest} to send
   * @param rawSystemData The raw {@linkcode SystemSaveData}
   * @returns An error message if something went wrong
   */
  public async update(params: UpdateSystemSavedataRequest, rawSystemData: string) {
    try {
      const urSearchParams = this.toUrlSearchParams(params);
      const response = await this.doPost(`/savedata/system/update?${urSearchParams}`, rawSystemData);

      return await response.text();
    } catch (err) {
      console.warn("Could not update system savedata!", err);
    }

    return null;
  }
}
