import { ApiBase } from "#api/api-base";

/** A wrapper for daily-run PokéRogue API requests. */
export class PokerogueDailyApi extends ApiBase {
  /** @returns The active daily-run seed as a `string`, or `null` if there was an error. */
  public async getSeed(): Promise<string | null> {
    try {
      const response = await this.doGet("/daily/seed");
      return response.text();
    } catch (err) {
      console.warn("Could not get daily-run seed!", err);
      return null;
    }
  }
}
