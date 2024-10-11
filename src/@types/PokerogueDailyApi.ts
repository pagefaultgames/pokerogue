import type { ScoreboardCategory } from "#app/ui/daily-run-scoreboard";

export interface GetDailyRankingsRequest {
  category: ScoreboardCategory;
  page?: number;
}

export interface GetDailyRankingsPageCountRequest {
  category: ScoreboardCategory;
}
