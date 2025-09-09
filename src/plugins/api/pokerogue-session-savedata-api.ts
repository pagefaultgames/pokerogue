import { ApiBase } from "#api/api-base";
import type { SessionSaveData } from "#system/game-data";
import type {
  ClearSessionSavedataRequest,
  ClearSessionSavedataResponse,
  DeleteSessionSavedataRequest,
  GetSessionSavedataRequest,
  NewClearSessionSavedataRequest,
  UpdateSessionSavedataRequest,
} from "#types/api/pokerogue-session-save-data-api";

/**
 * A wrapper for PokéRogue session savedata API requests.
 */
export class PokerogueSessionSavedataApi extends ApiBase {
  //#region Public

  /**
   * Mark a session as cleared aka "newclear". \
   * _This is **NOT** the same as {@linkcode clear | clear()}._
   * @param params The {@linkcode NewClearSessionSavedataRequest} to send
   * @returns The raw savedata as `string`.
   * @throws Error if the request fails
   */
  public async newclear(params: NewClearSessionSavedataRequest) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doGet(`/savedata/session/newclear?${urlSearchParams}`);
      const json = await response.json();
      if (response.ok) {
        return Boolean(json);
      }
      throw new Error("Could not newclear session!");
    } catch (err) {
      console.warn("Could not newclear session!", err);
      throw new Error("Could not newclear session!");
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
   * @param params - The request to send
   * @param rawSavedata - The raw, unencrypted savedata
   * @returns An error message if something went wrong
   */
  public async update(params: UpdateSessionSavedataRequest, rawSavedata: string): Promise<string> {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);

      const response = await this.doPost(`/savedata/session/update?${urlSearchParams}`, rawSavedata);
      return await response.text();
    } catch (err) {
      console.warn("Could not update session savedata!", err);
    }

    return "Unknown Error!";
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
      console.debug("%cSending a request to delete session in slot %d", "color: blue", params.slot);

      if (response.ok) {
        return null;
      }
      return await response.text();
    } catch (err) {
      console.warn("Could not delete session savedata!", err);
      return "Unknown error";
    }
  }

  /**
   * Clears the session savedata of the given slot. \
   * _This is **NOT** the same as {@linkcode newclear | newclear()}._
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
