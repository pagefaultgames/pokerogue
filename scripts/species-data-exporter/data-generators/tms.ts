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
import type { TmEntry } from "../types";

export async function generateTmsData(): Promise<void> {
  const entries: TmEntry[] = [];

  for (const speciesData of Object.values(speciesDataRegistry.data)) {
    for (const move of speciesData.tms) {
      const data: TmEntry = {
        dexNum: speciesData.species.speciesId,
        id: SpeciesId[speciesData.species.speciesId],
        form: null,
        move: MoveId[move],
      };
      entries.push(data);
    }

    const allFormKeys = speciesData.species.forms.map(f => f.formKey);
    for (const formKey in speciesData.formTms) {
      if (!allFormKeys.includes(formKey)) {
        console.log(
          chalk.yellow(
            `⚠️  Warning(tms): FormKey "${formKey}" does not exist for species ${speciesData.species.speciesId} (${speciesData.species.name})`,
          ),
        );
      }
      if (speciesData.formTms) {
        const formTms = speciesData.formTms[formKey];
        for (const move of formTms) {
          const data: TmEntry = {
            dexNum: speciesData.species.speciesId,
            id: SpeciesId[speciesData.species.speciesId],
            form: formKey,
            move: MoveId[move],
          };
          entries.push(data);
        }
      }
    }
  }

  writeData("tms", entries);
}
