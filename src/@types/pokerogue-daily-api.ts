import type { ScoreboardCategory } from "#ui/daily-run-scoreboard";

/** @deprecated */
export interface GetDailyRankingsRequest {
  category: ScoreboardCategory;
  page?: number;
}

/** @deprecated */
export interface GetDailyRankingsPageCountRequest {
  category: ScoreboardCategory;
}
