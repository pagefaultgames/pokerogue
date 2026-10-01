/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { speciesDataRegistry } from "#app/global-species-data-registry";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import chalk from "chalk";
import { writeData } from "../helpers";
import type { LevelMoveEntry } from "../types";

export async function generateLevelMovesData(): Promise<void> {
  const entries: LevelMoveEntry[] = [];

  for (const speciesData of Object.values(speciesDataRegistry.data)) {
    for (const [level, move] of speciesData.levelMoves) {
      const levelString = level === 0 ? "EVOLVE_MOVE" : level === -1 ? "RELEARN_MOVE" : level;
      const data: LevelMoveEntry = {
        dexNum: speciesData.species.speciesId,
        id: SpeciesId[speciesData.species.speciesId],
        form: null,
        level: levelString,
        move: MoveId[move],
      };

      entries.push(data);
    }
    const allFormKeys = speciesData.species.forms.map(f => f.formKey);

    for (const formKey in speciesData.formLevelMoves) {
      if (!allFormKeys.includes(formKey)) {
        console.log(
          chalk.yellow(
            `⚠️  Warning(level-moves): FormKey "${formKey}" does not exist for species ${speciesData.species.speciesId} (${speciesData.species.name})`,
          ),
        );
      }
      if (speciesData.formLevelMoves) {
        const formLevelMoves = speciesData.formLevelMoves[formKey];
        for (const [level, move] of formLevelMoves) {
          const levelString = level === 0 ? "EVOLVE_MOVE" : level === -1 ? "RELEARN_MOVE" : level;
          const data: LevelMoveEntry = {
            dexNum: speciesData.species.speciesId,
            id: SpeciesId[speciesData.species.speciesId],
            form: formKey,
            level: levelString,
            move: MoveId[move],
          };
          entries.push(data);
        }
      }
    }
  }

  writeData("level-moves", entries);
}
