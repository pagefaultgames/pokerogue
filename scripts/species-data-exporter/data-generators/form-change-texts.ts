/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { speciesDataRegistry } from "#app/global-species-data-registry";
import { supportedLngs } from "#app/i18n-supported-lngs";
import {
  SpeciesFormChangeAbilityTrigger,
  SpeciesFormChangeActiveTrigger,
  SpeciesFormChangeCompoundTrigger,
  SpeciesFormChangeItemTrigger,
  SpeciesFormChangeLapseTeraTrigger,
  SpeciesFormChangeManualTrigger,
  SpeciesFormChangeMoveLearnedTrigger,
  SpeciesFormChangePostMoveTrigger,
  SpeciesFormChangePreMoveTrigger,
  SpeciesFormChangeRevertWeatherFormTrigger,
  SpeciesFormChangeStatusEffectTrigger,
  SpeciesFormChangeTeraTrigger,
  SpeciesFormChangeTimeOfDayTrigger,
  type SpeciesFormChangeTrigger,
  SpeciesFormChangeWeatherTrigger,
} from "#data/form-change-triggers";
import type { SpeciesFormChange } from "#data/pokemon-forms";
import { FormChangeItem } from "#enums/form-change-item";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { toCamelCase } from "#utils/strings";
import i18next, { type TFunction } from "i18next";
import { writeData } from "../helpers";
import type { FormChangeTextEntry } from "../types";

export async function generateFormChangeTextsData() {
  const entries: FormChangeTextEntry[] = [];
  const entryFormChanges: SpeciesFormChange[] = [];
  for (const speciesData of Object.values(speciesDataRegistry.data)) {
    const formChanges = speciesData.formChanges;
    if (formChanges) {
      for (const fc of formChanges) {
        entries.push({
          dexNum: fc.speciesId,
          speciesId: SpeciesId[fc.speciesId],
          preFormKey: fc.preFormKey,
          evoFormKey: fc.formKey,
        } as FormChangeTextEntry);
        entryFormChanges.push(fc);
      }
    }
  }

  for (const lng of supportedLngs) {
    const translate = i18next.getFixedT(lng);
    for (const [index, fc] of entryFormChanges.entries()) {
      const triggers = getTriggerText(fc.trigger, translate);
      entries[index][lng] = triggers.length > 0 ? triggers.join("|") : null;
    }
  }

  writeData("form-change-texts", entries);
}

function getTriggerText(trigger: SpeciesFormChangeTrigger, t: TFunction): string[] {
  switch (true) {
    case trigger instanceof SpeciesFormChangeCompoundTrigger:
      return trigger.triggers.flatMap(compoundTrigger => getTriggerText(compoundTrigger, t));
    case trigger instanceof SpeciesFormChangeManualTrigger:
      return [];
    case trigger instanceof SpeciesFormChangeAbilityTrigger:
      return [t("pokemonEvolutions:forms.ability")];
    case trigger instanceof SpeciesFormChangeItemTrigger: {
      const item = t(`modifierType:FormChangeItem.${FormChangeItem[trigger.item]}`);
      const key = trigger.active ? "pokemonEvolutions:forms.item" : "pokemonEvolutions:forms.deactivateItem";
      return [t(key, { item })];
    }
    case trigger instanceof SpeciesFormChangeTimeOfDayTrigger:
      return [t("pokemonEvolutions:forms.timeOfDay")];
    case trigger instanceof SpeciesFormChangeActiveTrigger:
      return [t(trigger.active ? "pokemonEvolutions:forms.enter" : "pokemonEvolutions:forms.leave")];
    case trigger instanceof SpeciesFormChangeStatusEffectTrigger:
      return [t("pokemonEvolutions:forms.statusEffect")];
    case trigger instanceof SpeciesFormChangeMoveLearnedTrigger: {
      const move = t(`move:${toCamelCase(MoveId[trigger.move])}.name`);
      const key = trigger.known ? "pokemonEvolutions:forms.moveLearned" : "pokemonEvolutions:forms.moveForgotten";
      return [t(key, { move })];
    }
    case trigger instanceof SpeciesFormChangePreMoveTrigger:
      return [t("pokemonEvolutions:forms.preMove")];
    case trigger instanceof SpeciesFormChangePostMoveTrigger:
      return [t("pokemonEvolutions:forms.postMove")];
    case trigger instanceof SpeciesFormChangeTeraTrigger:
      return [t("pokemonEvolutions:forms.tera")];
    case trigger instanceof SpeciesFormChangeLapseTeraTrigger:
      return [t("pokemonEvolutions:forms.teraLapse")];
    case trigger instanceof SpeciesFormChangeWeatherTrigger:
      return [t("pokemonEvolutions:forms.weather")];
    case trigger instanceof SpeciesFormChangeRevertWeatherFormTrigger:
      return [t("pokemonEvolutions:forms.weatherRevert")];
    default:
      return [];
  }
}
