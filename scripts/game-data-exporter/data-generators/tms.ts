/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { tmPoolTiers } from "#balance/tm-pool-tiers";
import { MoveId } from "#enums/move-id";
import { RarityTier } from "#enums/reward-tier";
import { writeData } from "../helpers";
import type { TmTierEntry } from "../types";

export async function generateTmTiersData(): Promise<void> {
  const entries: TmTierEntry[] = [];

  for (const [move, tier] of Object.entries(tmPoolTiers)) {
    const data: TmTierEntry = {
      move: MoveId[move],
      tier: RarityTier[tier],
    };
    entries.push(data);
  }

  writeData("tms", entries);
}
