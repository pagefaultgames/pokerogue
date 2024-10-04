import type {
  ClearSessionSavedataRequest,
  ClearSessionSavedataResponse,
  DeleteSessionSavedataRequest,
  GetSessionSavedataRequest,
  NewClearSessionSavedataRequest,
  UpdateSessionSavedataRequest,
} from "#app/@types/PokerogueSessionSavedataApi";
import { ApiBase } from "#app/plugins/api/api-base";
import type { SessionSaveData } from "#app/system/game-data";

/**
 * A wrapper for PokéRogue session savedata API requests.
 */
export class PokerogueSessionSavedataApi extends ApiBase {
  //#region Public

  /**
   * Mark a session as cleared aka "newclear".\
   * *This is **NOT** the same as {@linkcode clear | clear()}.*
   * @param params The {@linkcode NewClearSessionSavedataRequest} to send
   * @returns The raw savedata as `string`.
   */
  public async newclear(params: NewClearSessionSavedataRequest) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doGet(`/savedata/session/newclear?${urlSearchParams}`);
      const json = await response.json();

      return Boolean(json);
    } catch (err) {
      console.warn("Could not newclear session!", err);
      return false;
    }
  }

  /**
   * Get a session savedata.
   * @param params The {@linkcode GetSessionSavedataRequest} to send
   * @returns The session as `string`
   */
  public async get(params: GetSessionSavedataRequest) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doGet(`/savedata/session/get?${urlSearchParams}`);

      return await response.text();
    } catch (err) {
      console.warn("Could not get session savedata!", err);
      return null;
    }
  }

  /**
   * Update a session savedata.
   * @param params The {@linkcode UpdateSessionSavedataRequest} to send
   * @param rawSavedata The raw savedata (as `string`)
   * @returns An error message if something went wrong
   */
  public async update(params: UpdateSessionSavedataRequest, rawSavedata: string) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doPost(`/savedata/session/update?${urlSearchParams}`, rawSavedata);

      return await response.text();
    } catch (err) {
      console.warn("Could not update session savedata!", err);
    }

    return null;
  }

  /**
   * Delete a session savedata slot.
   * @param params The {@linkcode DeleteSessionSavedataRequest} to send
   * @returns An error message if something went wrong
   */
  public async delete(params: DeleteSessionSavedataRequest) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doGet(`/savedata/session/delete?${urlSearchParams}`);

      if (response.ok) {
        return null;
      } else {
        return await response.text();
      }
    } catch (err) {
      console.warn("Could not get session savedata!", err);
      return "Unknown error";
    }
  }

  /**
   * Clears the session savedata of the given slot.\
   * *This is **NOT** the same as {@linkcode newclear | newclear()}.*
   * @param params The {@linkcode ClearSessionSavedataRequest} to send
   * @param sessionData The {@linkcode SessionSaveData} object
   */
  public async clear(params: ClearSessionSavedataRequest, sessionData: SessionSaveData) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doPost(`/savedata/session/clear?${urlSearchParams}`, sessionData);

      return (await response.json()) as ClearSessionSavedataResponse;
    } catch (err) {
      console.warn("Could not clear session savedata!", err);
    }

    return {
      error: "Unknown error",
      success: false,
    } as ClearSessionSavedataResponse;
  }
}
