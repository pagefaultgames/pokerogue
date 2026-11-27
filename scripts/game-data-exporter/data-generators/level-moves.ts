/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { speciesDataRegistry } from "#app/global-species-data-registry";
import { LearnableMoveSource } from "#enums/learnable-move-source";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { getLevelMoves } from "#field/learnsets";
import type { LevelMoveContext } from "#types/level-moves";
import { writeData } from "../helpers";
import type { LevelMoveEntry } from "../types";

export async function generateLevelMovesData(): Promise<void> {
  const entries: LevelMoveEntry[] = [];
  const learnableMoveSources = Object.keys(LearnableMoveSource);

  for (const species of speciesDataRegistry.getAllSpecies()) {
    const formCount = species.forms.length;
    for (let formIndex = 0; formIndex <= formCount; formIndex++) {
      const ctx: LevelMoveContext = {
        pokemonSpeciesForm: species,
        pokemonFormKey: species.getFormKey(formIndex),
        startingLevel: 1,
        level: 999,
      };
      const levelMoves = getLevelMoves(ctx, true, true, true);
      for (const [level, move, source] of levelMoves) {
        const levelString = level === 0 ? "EVOLVE_MOVE" : level === -1 ? "RELEARN_MOVE" : level;
        entries.push({
          dexNum: species.speciesId,
          id: SpeciesId[species.speciesId],
          form: formCount === 0 ? null : species.getFormKey(formIndex),
          moveId: move,
          move: MoveId[move],
          level: levelString,
          source: learnableMoveSources[source],
        });
      }
    }
  }

  writeData("level-moves", entries);
}
