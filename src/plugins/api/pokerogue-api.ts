import type { PokerogueApiClearSessionData } from "#app/@types/pokerogue-api";
import { loggedInUser } from "#app/account";
import { MAX_INT_ATTR_VALUE, SESSION_ID_COOKIE_NAME } from "#app/constants";
import { Api } from "#app/plugins/api/api";
import type { AccountInfoResponse } from "#app/plugins/api/models/AccountInfo";
import type { AccountLoginRequest, AccountLoginResponse } from "#app/plugins/api/models/AccountLogin";
import type { TitleStatsResponse } from "#app/plugins/api/models/TitleStats";
import type { UpdateAllSavedataRequest } from "#app/plugins/api/models/UpdateAllSavedata";
import type { UpdateSessionSavedataRequest } from "#app/plugins/api/models/UpdateSessionSavedata";
import type { UpdateSystemSavedataRequest } from "#app/plugins/api/models/UpdateSystemSavedata";
import type { VerifySavedataResponse } from "#app/plugins/api/models/VerifySavedata";
import type { SessionSaveData } from "#app/system/game-data";
import type { RankingEntry, ScoreboardCategory } from "#app/ui/daily-run-scoreboard";
import { removeCookie, setCookie } from "#app/utils";
import { PokerogueAdminApi } from "#app/plugins/api/pokerogue-admin-api";

export class PokerogueApi extends Api {
  //#region Fields

  public readonly admin: PokerogueAdminApi;

  //#region Public

  constructor(base: string) {
    super(base);
    this.admin = new PokerogueAdminApi(base);
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
   * Request the {@linkcode AccountInfoResponse | UserInfo} of the logged in user.
   * The user is identified by the {@linkcode SESSION_ID_COOKIE_NAME | session cookie}.
   */
  public async getAccountInfo() {
    try {
      const response = await this.doGet("/account/info");

      if (response.ok) {
        return (await response.json()) as AccountInfoResponse;
      } else {
        console.warn("Could not get account info!", response.status, response.statusText);
        return response.status;
      }
    } catch (err) {
      console.warn("Could not get account info!", err);
      return 500;
    }
  }

  /**
   * Send a login request.
   * Sets the session cookie on success.
   * @param loginData The {@linkcode AccountLoginRequest} to send
   * @returns An error message if something went wrong
   */
  public async login(loginData: AccountLoginRequest) {
    try {
      const response = await this.doPost("/account/login", loginData, "form-urlencoded");

      if (response.ok) {
        const loginResponse = (await response.json()) as AccountLoginResponse;
        setCookie(SESSION_ID_COOKIE_NAME, loginResponse.token);
        return null;
      } else {
        console.warn("Login failed!", response.status, response.statusText);
        return response.text();
      }
    } catch (err) {
      console.warn("Login failed!", err);
    }

    return "Unknown error!";
  }

  /**
   * Send a logout request.
   * **Always** (no matter if failed or not) removes the session cookie.
   */
  public async logout() {
    try {
      const response = await this.doGet("/account/logout");

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Log out failed!", err);
    }

    removeCookie(SESSION_ID_COOKIE_NAME); // we are always clearing the cookie.
  }

  /**
   * Request the daily-run seed.
   * @returns The active daily-run seed as `string`.
   */
  public async getDailySeed() {
    try {
      const response = await this.doGet("/daily/seed");
      return response.text();
    } catch (err) {
      console.warn("Could not get daily-run seed!", err);
      return null;
    }
  }

  /**
   * Mark a save-session as cleared.
   * @param slot The save-session slot to clear.
   * @param sessionId The save-session ID to clear.
   * @returns The raw savedata as `string`.
   */
  public async newclearSession(slot: number, sessionId: string) {
    try {
      const params = new URLSearchParams();
      params.append("slot", String(slot));
      params.append("clientSessionId", sessionId);

      const response = await this.doGet(`/savedata/session/newclear?${params}`);
      const json = await response.json();

      return Boolean(json);
    } catch (err) {
      console.warn("Could not newclear session!", err);
      return false;
    }
  }

  /**
   * Get a system savedata.
   * @param sessionId The savedata session ID
   */
  public async getSystemSavedata(sessionId: string) {
    try {
      const params = new URLSearchParams();
      params.append("clientSessionId", sessionId);

      const response = await this.doGet(`/savedata/system/get?${params}`);
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
   * @param sessionId The savedata session ID
   * @returns A {@linkcode SystemSaveData} if **NOT** valid, otherwise `null`.
   */
  public async verifySystemSavedata(sessionId: string) {
    try {
      const params = new URLSearchParams();
      params.append("clientSessionId", sessionId);
      const response = await this.doGet(`/savedata/system/verify?${params}`);

      if (response.ok) {
        const verifySavedata = (await response.json()) as VerifySavedataResponse;

        if (!verifySavedata.valid) {
          return verifySavedata.systemData;
        }
      }
    } catch (err) {
      console.warn("Could not verify system savedata!", err);
    }

    return null;
  }

  /**
   * Update a system savedata.
   * @param updateData The {@linkcode UpdateSystemSavedataRequest} to send
   * @param rawSystemData The raw {@linkcode SystemSaveData}
   * @returns An error message if something went wrong
   */
  public async updateSystemSavedata(updateData: UpdateSystemSavedataRequest, rawSystemData: string) {
    try {
      const updateArr = Object.entries(updateData).map(([key, value]) => [key, String(value)]);
      const params = new URLSearchParams(updateArr);
      const response = await this.doPost(`/savedata/system/update?${params}`, rawSystemData);

      return await response.text();
    } catch (err) {
      console.warn("Could not update system savedata!", err);
    }

    return null;
  }

  /**
   * Get a session savedata.
   * @param slotId The slot ID to load
   * @param sessionId The session ID
   * @returns The session as `string`
   */
  public async getSessionSavedata(slotId: number, sessionId: string) {
    try {
      const params = new URLSearchParams();
      params.append("slot", String(slotId));
      params.append("clientSessionId", sessionId);

      const response = await this.doGet(`/savedata/session/get?${params}`);

      return await response.text();
    } catch (err) {
      console.warn("Could not get session savedata!", err);
      return null;
    }
  }

  /**
   * Update a session savedata.
   * @param updateData The {@linkcode UpdateSessionSavedataRequest} to send
   * @param rawSavedata The raw savedata (as `string`)
   * @returns An error message if something went wrong
   */
  public async updateSessionSavedata(updateData: UpdateSessionSavedataRequest, rawSavedata: string) {
    try {
      const updateArr = Object.entries(updateData).map(([key, value]) => [key, String(value)]);
      const params = new URLSearchParams(updateArr);

      const response = await this.doPost(`/savedata/session/update?${params}`, rawSavedata);

      return await response.text();
    } catch (err) {
      console.warn("Could not update session savedata!", err);
    }

    return null;
  }

  /**
   * Delete a session savedata slot.
   * @param slotId The slot ID to load
   * @param sessionId The session ID
   * @returns The session as `string`
   */
  public async deleteSessionSavedata(slotId: number, sessionId: string) {
    try {
      const params = new URLSearchParams();
      params.append("slot", String(slotId));
      params.append("clientSessionId", sessionId);

      const response = await this.doGet(`/savedata/session/delete?${params}`);

      if (response.ok) {
        if (loggedInUser) {
          loggedInUser.lastSessionSlot = -1;
        }

        localStorage.removeItem(`sessionData${slotId > 0 ? slotId : ""}_${loggedInUser?.username}`);
      } else {
        return await response.text();
      }
    } catch (err) {
      console.warn("Could not get session savedata!", err);
      return "Unknown error";
    }
  }

  /**
   * Clears the session savedata of the given slot.
   * @param slotId The slot ID
   * @param trainerId The trainer ID
   * @param sessionId The session ID
   * @param sessionData The {@linkcode SessionSaveData} object
   */
  public async clearSessionSavedata(
    slotId: number,
    trainerId: number,
    sessionId: string,
    sessionData: SessionSaveData
  ) {
    try {
      const params = new URLSearchParams();
      params.append("slot", String(slotId));
      params.append("trainerId", String(trainerId));
      params.append("clientSessionId", sessionId);

      const response = await this.doPost(`/savedata/session/clear?${params}`, sessionData);

      if (response.ok) {
        if (loggedInUser) {
          loggedInUser!.lastSessionSlot = -1;
        }
        localStorage.removeItem(`sessionData${slotId > 0 ? slotId : ""}_${loggedInUser?.username}`);
      }

      return (await response.json()) as PokerogueApiClearSessionData;
    } catch (err) {
      console.warn("Could not clear session savedata!", err);
    }

    return null;
  }

  /**
   * Update all savedata
   * @param bodyData The {@linkcode UpdateAllSavedataRequest | request data} to send
   * @returns An error message if something went wrong
   */
  public async updateAllSavedata(bodyData: UpdateAllSavedataRequest) {
    try {
      const rawBodyData = JSON.stringify(bodyData, (_k: any, v: any) =>
        typeof v === "bigint" ? (v <= MAX_INT_ATTR_VALUE ? Number(v) : v.toString()) : v
      );
      const response = await this.doPost("/savedata/updateall", rawBodyData);
      return await response.text();
    } catch (err) {
      console.warn("Could not update all savedata!", err);
      return null;
    }
  }

  /**
   * Get the daily rankings for a {@linkcode ScoreboardCategory}.
   * @param category The {@linkcode ScoreboardCategory} to fetch.
   * @param page The page number to fetch.
   */
  public async getDailyRankings(category: ScoreboardCategory, page?: number) {
    try {
      const params = new URLSearchParams();
      params.append("category", String(category));

      if (page) {
        params.append("page", String(page));
      }

      const response = await this.doGet(`/daily/rankings?${params}`);

      return (await response.json()) as RankingEntry[];
    } catch (err) {
      console.warn("Could not get daily rankings!", err);
      return null;
    }
  }

  /**
   * Get the page count of the daily rankings for a {@linkcode ScoreboardCategory}.
   * @param category The {@linkcode ScoreboardCategory} to fetch.
   */
  public async getDailyRankingsPageCount(category: ScoreboardCategory) {
    try {
      const params = new URLSearchParams();
      params.append("category", String(category));

      const response = await this.doGet(`/daily/rankingpagecount?${params}`);
      const json = await response.json();

      return Number(json);
    } catch (err) {
      console.warn("Could not get daily rankings page count!", err);
      return 1;
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
      } else {
        console.warn(`Discord unlink failed (${response.status}: ${response.statusText})`);
      }
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
      } else {
        console.warn(`Google Unlink failed (${response.status}: ${response.statusText})`);
      }
    } catch (err) {
      console.warn("Could not unlink Google!", err);
    }

    return false;
  }

  //#region Private

  private async isLocalMode(): Promise<boolean> {
    return (
      ((window.location.hostname === "localhost" ||
        /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(window.location.hostname)) &&
        window.location.port !== "") ||
      window.location.hostname === ""
    );
  }
  //#endregion
}

export const pokerogueApi = new PokerogueApi(import.meta.env.VITE_SERVER_URL ?? "http://localhost:80001");
