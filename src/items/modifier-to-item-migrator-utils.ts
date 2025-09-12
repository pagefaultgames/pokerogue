import type { BerryType } from "#enums/berry-type";
import { HeldItemId } from "#enums/held-item-id";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { type PermanentStat, Stat } from "#enums/stat";
import { attackTypeToHeldItem } from "#items/attack-type-booster";
import { permanentStatToHeldItem } from "#items/base-stat-booster";
import { berryTypeToHeldItem } from "#items/berry";
import type { PokemonItemMap } from "#items/held-item-data-types";

const uniqueModifierToItem = {
  EvoTrackerModifier: HeldItemId.GIMMIGHOUL_EVO_TRACKER,
  PokemonBaseStatFlatModifier: HeldItemId.OLD_GATEAU,
  PokemonIncrementingStatModifier: HeldItemId.MACHO_BRACE,
  SurviveDamageModifier: HeldItemId.FOCUS_BAND,
  BypassSpeedChanceModifier: HeldItemId.QUICK_CLAW,
  FlinchChanceModifier: HeldItemId.KINGS_ROCK,
  TurnHealModifier: HeldItemId.LEFTOVERS,
  HitHealModifier: HeldItemId.SHELL_BELL,
  PokemonInstantReviveModifier: HeldItemId.REVIVER_SEED,
  ResetNegativeStatStageModifier: HeldItemId.WHITE_HERB,
  FieldEffectModifier: HeldItemId.MYSTICAL_ROCK,
  PokemonFriendshipBoosterModifier: HeldItemId.SOOTHE_BELL,
  PokemonNatureWeightModifier: HeldItemId.SOUL_DEW,
  PokemonMoveAccuracyBoosterModifier: HeldItemId.WIDE_LENS,
  PokemonMultiHitModifier: HeldItemId.MULTI_LENS,
  DamageMoneyRewardModifier: HeldItemId.GOLDEN_PUNCH,
  SwitchEffectTransferModifier: HeldItemId.BATON,
  TurnHeldItemTransferModifier: HeldItemId.MINI_BLACK_HOLE,
  ContactHeldItemTransferChanceModifier: HeldItemId.GRIP_CLAW,
} as const;

type UniqueModifierString = keyof typeof uniqueModifierToItem;

function isUniqueModifierString(value: string): value is UniqueModifierString {
  return value in uniqueModifierToItem;
}

const modifierCategoryList = [
  "BaseStatModifier",
  "EvolutionStatBoosterModifier",
  "SpeciesStatBoosterModifier",
  "CritBoosterModifier",
  "SpeciesCritBoosterModifier",
  "AttackTypeBoosterModifier",
  "TurnStatusEffectModifier",
  "BerryModifier",
  "PokemonExpBoosterModifier",
  "PokemonFormChangeItemModifier",
  "PokemonBaseStatTotalModifier",
] as const;

type ModifierCategoryString = (typeof modifierCategoryList)[number];

function isModifierCategoryString(value: string): value is ModifierCategoryString {
  return modifierCategoryList.includes(value as ModifierCategoryString);
}

function mapModifierCategoryToItems(modifier: ModifierCategoryString, typeId: string, args: any): HeldItemId {
  if (modifier === "BaseStatModifier") {
    const stat = args[1] as PermanentStat;
    return permanentStatToHeldItem[stat];
  }
  if (modifier === "EvolutionStatBoosterModifier") {
    return HeldItemId.EVIOLITE;
  }
  if (modifier === "SpeciesStatBoosterModifier") {
    const stats = args[1];
    const species = args[3];
    // TODO: why is this not `species === SpeciesId.SPECIES_NAME`?
    if (SpeciesId.PIKACHU in species) {
      return HeldItemId.LIGHT_BALL;
    }
    if (SpeciesId.CUBONE in species) {
      return HeldItemId.THICK_CLUB;
    }
    if (SpeciesId.DITTO in species && Stat.DEF in stats) {
      return HeldItemId.METAL_POWDER;
    }
    if (SpeciesId.DITTO in species && Stat.SPDEF in stats) {
      return HeldItemId.QUICK_POWDER;
    }
    if (SpeciesId.CLAMPERL in species && Stat.SPDEF in stats) {
      return HeldItemId.DEEP_SEA_SCALE;
    }
    if (SpeciesId.CLAMPERL in species && Stat.SPATK in stats) {
      return HeldItemId.DEEP_SEA_TOOTH;
    }
  }
  if (modifier === "CritBoosterModifier") {
    return HeldItemId.SCOPE_LENS;
  }
  if (modifier === "SpeciesCritBoosterModifier") {
    return HeldItemId.LEEK;
  }
  if (modifier === "AttackTypeBoosterModifier") {
    const moveType = args[1] as PokemonType;
    return attackTypeToHeldItem[moveType];
  }
  if (modifier === "TurnStatusEffectModifier") {
    switch (typeId) {
      case "TOXIC_ORB":
        return HeldItemId.TOXIC_ORB;
      case "FLAME_ORB":
        return HeldItemId.FLAME_ORB;
    }
  }
  if (modifier === "BerryModifier") {
    const berryType = args[1] as BerryType;
    return berryTypeToHeldItem[berryType];
  }
  if (modifier === "PokemonExpBoosterModifier") {
    const boost = args[1] as number;
    return boost === 100 ? HeldItemId.GOLDEN_EGG : HeldItemId.LUCKY_EGG;
  }
  if (modifier === "PokemonBaseStatTotalModifier") {
    const statModifier = args[1] as number;
    return statModifier > 0 ? HeldItemId.SHUCKLE_JUICE_GOOD : HeldItemId.SHUCKLE_JUICE_BAD;
  }
  return 0;
}

export function convertModifierSaveData(data: ModifierData[]) {
  const pokemonItems: PokemonItemMap[] = [];
  for (const entry of data) {
    const typeId = entry.typeId;
    const args = entry.args;
    const pokemonId = args[0];
    const stack = entry.stackCount;
    const className = entry.className;

    if (className === "PokemonFormChangeItemModifier") {
    }
    //TODO: Code to filter out modifiers which are not held items

    let itemId: HeldItemId = 0;

    if (isModifierCategoryString(className)) {
      itemId = mapModifierCategoryToItems(className, typeId, args);
    }

    if (isUniqueModifierString(className)) {
      itemId = uniqueModifierToItem[className];
    }

    if (itemId) {
      const specs = { id: itemId, stack };
      const pokemonItem = { item: specs, pokemonId };
      pokemonItems.push(pokemonItem);
    }
  }
}
