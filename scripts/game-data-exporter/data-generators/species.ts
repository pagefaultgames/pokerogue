/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { speciesDataRegistry } from "#app/global-species-data-registry";
import { speciesEggMoves } from "#balance/moves/egg-moves";
import { GrowthRate } from "#data/exp";
import { AbilityId } from "#enums/ability-id";
import { EggTier } from "#enums/egg-type";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import variantMasterlist from "../../../assets/images/pokemon/variant/_masterlist.json";
import { normalizeSpriteKey, writeData } from "../helpers";
import type { SpeciesEntry } from "../types";

export async function generateSpeciesData(): Promise<void> {
  const entries: SpeciesEntry[] = [];

  for (const speciesData of Object.values(speciesDataRegistry.data)) {
    const species = speciesData.species;
    const passives = speciesData.passives;
    const normalizedSpriteKey = normalizeSpriteKey(species.getSpriteKey(false));
    const eggMoves = speciesEggMoves[speciesData.starter] as [MoveId, MoveId, MoveId, MoveId];

    const data: SpeciesEntry = {
      dexNum: species.speciesId,
      id: SpeciesId[species.speciesId],
      form: null,
      formDisplayName: species.getFormNameToDisplay(),
      name: species.getName(),
      starter: SpeciesId[speciesData.starter],
      startercost: speciesData.starterCost ?? null,
      prevolution: speciesData.prevolution ? SpeciesId[speciesData.prevolution] : null,
      eggTier: speciesData.eggTier == null ? null : EggTier[speciesData.eggTier],
      generation: species.generation,
      spriteKey: normalizedSpriteKey,
      formKey: null,
      hasVariants: variantMasterlist[normalizedSpriteKey] != null,
      category: species.category,
      type1: PokemonType[species.type1],
      type2: species.type2 == null ? null : PokemonType[species.type2],
      ability1: AbilityId[species.ability1],
      ability2: AbilityId[species.ability2],
      hiddenAbility: AbilityId[species.abilityHidden],
      passive: typeof passives === "number" ? AbilityId[passives] : AbilityId[passives[0]],
      eggMove1: MoveId[eggMoves[0]],
      eggMove2: MoveId[eggMoves[1]],
      eggMove3: MoveId[eggMoves[2]],
      eggMove4: MoveId[eggMoves[3]],
      bst: species.baseTotal,
      hp: species.baseStats[0],
      atk: species.baseStats[1],
      def: species.baseStats[2],
      spatk: species.baseStats[3],
      spdef: species.baseStats[4],
      spd: species.baseStats[5],
      sublegend: species.subLegendary,
      legendary: species.legendary,
      mythical: species.mythical,
      weight: species.weight,
      height: species.height,
      catchRate: species.catchRate,
      friendship: species.baseFriendship,
      baseExp: species.baseExp,
      growthRate: GrowthRate[species.growthRate],
      maleRatio: species.malePercent,
      genderDiffs: species.genderDiffs,
      isStartSelectable: species.isStarterSelectable,
      isUnobtainable: null,
      canChangeForm: species.canChangeForm,
    };

    if (species.forms.length === 0) {
      entries.push(data);
    }

    for (const [index, form] of Object.entries(species.forms)) {
      const normalizedFormSpriteKey = normalizeSpriteKey(species.getSpriteKey(false, Number(index)));

      const formData: SpeciesEntry = {
        ...data,
        // these fields don't exist for forms
        eggTier: Number(index) === 0 ? data.eggTier : null,
        startercost: Number(index) === 0 ? data.startercost : null,
        canChangeForm: Number(index) === 0 ? data.canChangeForm : null,

        form: form.formName,
        formDisplayName: species.getFormNameToDisplay(Number(index)),
        name: species.getName(Number(index)),
        spriteKey: normalizedFormSpriteKey,
        formKey: form.formKey,
        hasVariants: variantMasterlist[normalizedFormSpriteKey] != null,
        type1: PokemonType[form.type1],
        type2: form.type2 == null ? null : PokemonType[form.type2],
        ability1: AbilityId[form.ability1],
        ability2: AbilityId[form.ability2],
        hiddenAbility: AbilityId[form.abilityHidden],
        passive: typeof passives === "number" ? AbilityId[passives] : AbilityId[passives[Number(index)]],
        bst: form.baseTotal,
        hp: form.baseStats[0],
        atk: form.baseStats[1],
        def: form.baseStats[2],
        spatk: form.baseStats[3],
        spdef: form.baseStats[4],
        spd: form.baseStats[5],
        isStartSelectable: form.isStarterSelectable,
        isUnobtainable: form.isUnobtainable,
      };

      entries.push(formData);
    }
  }

  writeData("species", entries);
}
