import { loggedInUser } from "#app/account";
import { SESSION_ID_COOKIE_NAME } from "#app/constants";
import type { RankingEntry, ScoreboardCategory } from "#app/ui/daily-run-scoreboard";
import { getCookie, removeCookie, setCookie } from "#app/utils";
import type { AccountInfoResponse } from "./models/AccountInfo";
import type { AccountLoginRequest, AccountLoginResponse } from "./models/AccountLogin";
import type { TitleStatsResponse } from "./models/TitleStats";
import type { VerifySavedataResponse } from "./models/VerifySavedata";

type DataType = "json" | "form-urlencoded";

export class Api {
  //#region Fields

  private readonly base: string;

  //#region Public

  constructor(base: string) {
    this.base = base;
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
   * @param username The account username.
   * @param password The account password.
   */
  public async login(username: string, password: string) {
    try {
      const response = await this.doPost<AccountLoginRequest>(
        "/account/login",
        {
          username,
          password,
        },
        "form-urlencoded"
      );

      if (response.ok) {
        const loginResponse = (await response.json()) as AccountLoginResponse;
        setCookie(SESSION_ID_COOKIE_NAME, loginResponse.token);
        return true;
      }
    } catch (err) {
      console.warn("Could not login!", err);
    }

    return false;
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
   * @returns A {@linkcode SystemSaveData} if NOT valid, otherwise `null`.
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
          loggedInUser.lastSessionSlot = -1; // TODO: is the bang correct?
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

  //#region Private

  /**
   * Send a GET request.
   * @param path The path to send the request to.
   */
  private async doGet(path: string) {
    return this.doFetch(path, { method: "GET" });
  }

  /**
   * Send a POST request.
   * @param path THe path to send the request to.
   * @param bodyData The body-data to send.
   * @param dataType The data-type of the {@linkcode bodyData}.
   */
  private async doPost<D extends Record<string, any>>(path: string, bodyData: D, dataType: DataType = "json") {
    let body: string = "";
    const headers: HeadersInit = {};

    if (dataType === "json") {
      body = JSON.stringify(bodyData);
      headers["Content-Type"] = "application/json";
    } else if (dataType === "form-urlencoded") {
      body = new URLSearchParams(Object.entries<any>(bodyData).map(([k, v]) => [k, v.toString()])).toString();
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else {
      console.warn(`Unsupported data type: ${dataType}`);
      body = String(bodyData);
      headers["Content-Type"] = "text/plain";
    }

    return await this.doFetch(path, { method: "POST", body, headers });
  }

  /**
   * A generic request helper.
   * @param path The path to send the request to.
   * @param config The request {@linkcode RequestInit | Configuration}.
   */
  private async doFetch(path: string, config: RequestInit): Promise<Response> {
    config.headers = {
      ...config.headers,
      Authorization: getCookie(SESSION_ID_COOKIE_NAME),
      "Content-Type": config.headers?.["Content-Type"] ?? "application/json",
    };

    console.log(`Sending ${config.method ?? "GET"} request to: `, this.base + path, config);

    return await fetch(this.base + path, config);
  }

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

export const api = new Api(import.meta.env.VITE_SERVER_URL ?? "http://localhost:80001");
