import { ApiBase } from "#api/api-base";
import type {
  GetSystemSavedataRequest,
  UpdateSystemSavedataRequest,
  VerifySystemSavedataRequest,
  VerifySystemSavedataResponse,
} from "#types/api/pokerogue-system-save-data-api";

/**
 * A wrapper for PokéRogue system savedata API requests.
 */
export class PokerogueSystemSavedataApi extends ApiBase {
  //#region Public

  /**
   * Get a system savedata.
   * @param params The {@linkcode GetSystemSavedataRequest} to send
   * @returns The system savedata as `string` or either the status code or `null` on error
   */
  public async get(params: GetSystemSavedataRequest): Promise<string | number | null> {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doGet(`/savedata/system/get?${urlSearchParams}`);
      const rawSavedata = await response.text();
      if (!response.ok) {
        console.warn("Could not get system savedata!", response.status, rawSavedata);
        return response.status;
      }
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
   *
   * TODO: add handling for errors
   */
  public async verify(params: VerifySystemSavedataRequest) {
    const urlSearchParams = this.toUrlSearchParams(params);
    const response = await this.doGet(`/savedata/system/verify?${urlSearchParams}`);

    if (response.ok) {
      const verifySavedata = (await response.json()) as VerifySystemSavedataResponse;

      if (!verifySavedata.valid) {
        console.warn("Invalid system savedata!");
        return verifySavedata.systemData;
      }
    } else {
      console.warn("System savedata verification failed!", response.status, response.statusText);
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

    return "Unknown Error";
  }
}
