/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { tmPoolTiers } from "#balance/tm-pool-tiers";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveId } from "#enums/move-id";
import { writeData } from "../helpers";
import type { TmTierEntry } from "../types";

export async function generateTmTiersData(): Promise<void> {
  const entries: TmTierEntry[] = [];

  for (const [move, tier] of Object.entries(tmPoolTiers)) {
    const data: TmTierEntry = {
      move: MoveId[move],
      tier: ModifierTier[tier],
    };
    entries.push(data);
  }

  writeData("tm-tiers", entries);
}
