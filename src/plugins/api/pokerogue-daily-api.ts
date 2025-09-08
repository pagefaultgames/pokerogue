import { ApiBase } from "#api/api-base";
import type { GetDailyRankingsPageCountRequest, GetDailyRankingsRequest } from "#types/api/pokerogue-daily-api";
import type { RankingEntry } from "#ui/containers/daily-run-scoreboard";

/**
 * A wrapper for daily-run PokéRogue API requests.
 */
export class PokerogueDailyApi extends ApiBase {
  //#region Public

  /**
   * Request the daily-run seed.
   * @returns The active daily-run seed as `string`.
   */
  public async getSeed() {
    try {
      const response = await this.doGet("/daily/seed");
      return response.text();
    } catch (err) {
      console.warn("Could not get daily-run seed!", err);
      return null;
    }
  }

  /**
   * Get the daily rankings for a {@linkcode ScoreboardCategory}.
   * @param params The {@linkcode GetDailyRankingsRequest} to send
   */
  public async getRankings(params: GetDailyRankingsRequest) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doGet(`/daily/rankings?${urlSearchParams}`);

      return (await response.json()) as RankingEntry[];
    } catch (err) {
      console.warn("Could not get daily rankings!", err);
      return null;
    }
  }

  /**
   * Get the page count of the daily rankings for a {@linkcode ScoreboardCategory}.
   * @param params The {@linkcode GetDailyRankingsPageCountRequest} to send.
   */
  public async getRankingsPageCount(params: GetDailyRankingsPageCountRequest) {
    try {
      const urlSearchParams = this.toUrlSearchParams(params);
      const response = await this.doGet(`/daily/rankingpagecount?${urlSearchParams}`);
      const json = await response.json();

      return Number(json);
    } catch (err) {
      console.warn("Could not get daily rankings page count!", err);
      return 1;
    }
  }
}
