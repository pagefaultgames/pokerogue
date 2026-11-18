/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { speciesDataRegistry } from "#app/global-species-data-registry";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { writeData } from "../helpers";
import type { TmEntry } from "../types";

export async function generateTmsData(): Promise<void> {
  const entries: TmEntry[] = [];

  for (const speciesData of Object.values(speciesDataRegistry.data)) {
    const formCount = speciesData.species.forms.length;
    const tmsPerForm = Array.from({ length: Math.max(formCount, 1) }, (_, formIndex) => {
      return speciesDataRegistry.getTms(speciesData.species.speciesId, formIndex);
    });

    for (const [formIndex, tms] of tmsPerForm.entries()) {
      for (const move of tms) {
        const isShared = formCount > 1 && tmsPerForm.every(tmSet => tmSet.includes(move));
        if (isShared && formIndex > 0) {
          continue;
        }
        entries.push({
          dexNum: speciesData.species.speciesId,
          id: SpeciesId[speciesData.species.speciesId],
          form: formCount === 0 || isShared ? null : speciesData.species.getFormKey(formIndex),
          move: MoveId[move],
        });
      }
    }
  }

  writeData("species-tms", entries);
}
