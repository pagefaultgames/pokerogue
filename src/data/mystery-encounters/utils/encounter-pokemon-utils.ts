import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { getPokemonNameWithAffix } from "#app/messages";
import { modifierTypes } from "#data/data-lists";
import { Gender } from "#data/gender";
import { doPokeballBounceAnim, getPokeballAtlasKey, getPokeballTintColor } from "#data/pokeball";
import { CustomPokemonData } from "#data/pokemon-data";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { AbilityId } from "#enums/ability-id";
import { ChallengeType } from "#enums/challenge-type";
import { PartyUiMode } from "#enums/party-ui-mode";
import type { PokeballType } from "#enums/pokeball";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { PermanentStat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { UiMode } from "#enums/ui-mode";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import { PokemonHeldItemModifier } from "#modifiers/modifier";
import type { PokemonHeldItemModifierType } from "#modifiers/modifier-type";
import {
  getEncounterText,
  queueEncounterMessage,
  showEncounterText,
} from "#mystery-encounters/encounter-dialogue-utils";
import { achvs } from "#system/achv";
import type { PartyOption } from "#ui/party-ui-handler";
import { SummaryUiMode } from "#ui/summary-ui-handler";
import { playNumberTween, playTween } from "#utils/anim-utils";
import { applyChallenges } from "#utils/challenge-utils";
import { BooleanHolder, randSeedInt } from "#utils/common";
import { waitTime } from "#utils/time";
import i18next from "i18next";

/** Will give +1 level every 10 waves */
export const STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER = 1;

/**
 * Gets the sprite key and file root for a given PokemonSpecies (accounts for gender, shiny, variants, forms, and experimental)
 * @param speciesId
 * @param female
 * @param formIndex
 * @param shiny
 * @param variant
 */
export function getSpriteKeysFromSpecies(
  speciesId: SpeciesId,
  female?: boolean,
  formIndex?: number,
  shiny?: boolean,
  variant?: number,
): { spriteKey: string; fileRoot: string } {
  const species = speciesDataRegistry.getSpecies(speciesId);
  const spriteKey = species.getSpriteKey(female ?? false, formIndex ?? 0, shiny ?? false, variant ?? 0);
  const fileRoot = species.getSpriteAtlasPath(female ?? false, formIndex ?? 0, shiny ?? false, variant ?? 0);
  return { spriteKey, fileRoot };
}

/**
 * Gets the sprite key and file root for a given Pokemon (accounts for gender, shiny, variants, forms, and experimental)
 */
export function getSpriteKeysFromPokemon(pokemon: Pokemon): {
  spriteKey: string;
  fileRoot: string;
} {
  const spriteKey = pokemon
    .getSpeciesForm()
    .getSpriteKey(pokemon.getGender() === Gender.FEMALE, pokemon.formIndex, pokemon.shiny, pokemon.variant);
  const fileRoot = pokemon
    .getSpeciesForm()
    .getSpriteAtlasPath(pokemon.getGender() === Gender.FEMALE, pokemon.formIndex, pokemon.shiny, pokemon.variant);

  return { spriteKey, fileRoot };
}

/**
 * Will never remove the player's last non-fainted Pokemon (if they only have 1).
 * Otherwise, picks a Pokemon completely at random and removes from the party
 * @param isAllowed Default `false`. If `true`, only picks from legal mons. If no legal mons are found (or there is 1, with `doNotReturnLastAllowedMon = true`), will return a mon that is not allowed.
 * @param isFainted Default `false`. If `true`, includes fainted mons.
 * @param doNotReturnLastAllowedMon Default `false`. If `true`, will never return the last unfainted pokemon in the party. Useful when this function is being used to determine what Pokemon to remove from the party (Don't want to remove last unfainted)
 * @returns
 */
export function getRandomPlayerPokemon(
  isAllowed = false,
  isFainted = false,
  doNotReturnLastAllowedMon = false,
): PlayerPokemon {
  const party = globalScene.getPlayerParty();
  let chosenIndex: number;
  let chosenPokemon: PlayerPokemon | null = null;
  const fullyLegalMons = party.filter(p => (!isAllowed || p.isAllowedInChallenge()) && (isFainted || !p.isFainted()));
  const allowedOnlyMons = party.filter(p => p.isAllowedInChallenge());

  if (doNotReturnLastAllowedMon && fullyLegalMons.length === 1) {
    // If there is only 1 legal/unfainted mon left, select from fainted legal mons
    const faintedLegalMons = party.filter(p => (!isAllowed || p.isAllowedInChallenge()) && p.isFainted());
    if (faintedLegalMons.length > 0) {
      // TODO: should this use `randSeedItem`?
      chosenIndex = randSeedInt(faintedLegalMons.length);
      chosenPokemon = faintedLegalMons[chosenIndex];
    }
  }
  if (!chosenPokemon && fullyLegalMons.length > 0) {
    // TODO: should this use `randSeedItem`?
    chosenIndex = randSeedInt(fullyLegalMons.length);
    chosenPokemon = fullyLegalMons[chosenIndex];
  }
  if (!chosenPokemon && isAllowed && allowedOnlyMons.length > 0) {
    // TODO: should this use `randSeedItem`?
    chosenIndex = randSeedInt(allowedOnlyMons.length);
    chosenPokemon = allowedOnlyMons[chosenIndex];
  }
  if (!chosenPokemon) {
    // If no other options worked, returns fully random
    // TODO: should this use `randSeedItem`?
    chosenIndex = randSeedInt(party.length);
    chosenPokemon = party[chosenIndex];
  }

  return chosenPokemon;
}

/**
 * Ties are broken by whatever mon is closer to the front of the party
 * @param scene
 * @param isAllowed Default false. If true, only picks from legal mons.
 * @param isFainted Default false. If true, includes fainted mons.
 * @returns
 */
export function getHighestLevelPlayerPokemon(isAllowed = false, isFainted = false): PlayerPokemon {
  const party = globalScene.getPlayerParty();
  let pokemon: PlayerPokemon | null = null;

  for (const p of party) {
    if (isAllowed && !p.isAllowedInChallenge()) {
      continue;
    }
    if (!isFainted && p.isFainted()) {
      continue;
    }

    pokemon = pokemon ? (pokemon?.level < p?.level ? p : pokemon) : p;
  }

  return pokemon!;
}

/**
 * Ties are broken by whatever mon is closer to the front of the party
 * @param scene
 * @param stat Stat to search for
 * @param isAllowed Default false. If true, only picks from legal mons.
 * @param isFainted Default false. If true, includes fainted mons.
 * @returns
 */
export function getHighestStatPlayerPokemon(stat: PermanentStat, isAllowed = false, isFainted = false): PlayerPokemon {
  const party = globalScene.getPlayerParty();
  let pokemon: PlayerPokemon | null = null;

  for (const p of party) {
    if (isAllowed && !p.isAllowedInChallenge()) {
      continue;
    }
    if (!isFainted && p.isFainted()) {
      continue;
    }

    pokemon = pokemon ? (pokemon.getStat(stat) < p?.getStat(stat) ? p : pokemon) : p;
  }

  return pokemon!;
}

/**
 * Ties are broken by whatever mon is closer to the front of the party
 * @param scene
 * @param isAllowed Default false. If true, only picks from legal mons.
 * @param isFainted Default false. If true, includes fainted mons.
 * @returns
 */
export function getLowestLevelPlayerPokemon(isAllowed = false, isFainted = false): PlayerPokemon {
  const party = globalScene.getPlayerParty();
  let pokemon: PlayerPokemon | null = null;

  for (const p of party) {
    if (isAllowed && !p.isAllowedInChallenge()) {
      continue;
    }
    if (!isFainted && p.isFainted()) {
      continue;
    }

    pokemon = pokemon ? (pokemon?.level > p?.level ? p : pokemon) : p;
  }

  return pokemon!;
}

/**
 * Ties are broken by whatever mon is closer to the front of the party
 * @param scene
 * @param isAllowed Default false. If true, only picks from legal mons.
 * @param isFainted Default false. If true, includes fainted mons.
 * @returns
 */
export function getHighestStatTotalPlayerPokemon(isAllowed = false, isFainted = false): PlayerPokemon {
  const party = globalScene.getPlayerParty();
  let pokemon: PlayerPokemon | null = null;

  for (const p of party) {
    if (isAllowed && !p.isAllowedInChallenge()) {
      continue;
    }
    if (!isFainted && p.isFainted()) {
      continue;
    }

    pokemon = pokemon ? (pokemon?.stats.reduce((a, b) => a + b) < p?.stats.reduce((a, b) => a + b) ? p : pokemon) : p;
  }

  return pokemon!;
}

/**
 *
 * NOTE: This returns ANY random species, including those locked behind eggs, etc.
 * @param starterTiers
 * @param excludedSpecies
 * @param types
 * @param allowSubLegendary
 * @param allowLegendary
 * @param allowMythical
 * @returns
 */
export function getRandomSpeciesByStarterCost(
  starterTiers: number | [number, number],
  excludedSpecies?: SpeciesId[],
  types?: PokemonType[],
  allowSubLegendary = true,
  allowLegendary = true,
  allowMythical = true,
): SpeciesId {
  let min = Array.isArray(starterTiers) ? starterTiers[0] : starterTiers;
  let max = Array.isArray(starterTiers) ? starterTiers[1] : starterTiers;

  let filteredSpecies: [species: PokemonSpecies, cost: number][] = [];

  for (const species of speciesDataRegistry.getAllStarters(true)) {
    if (
      species
      && !excludedSpecies?.includes(species.speciesId)
      && (allowSubLegendary || !species.subLegendary)
      && (allowLegendary || !species.legendary)
      && (allowMythical || !species.mythical)
    ) {
      filteredSpecies.push([species, speciesDataRegistry.getStarterCost(species.speciesId)]);
    }
  }

  if (types && types.length > 0) {
    filteredSpecies = filteredSpecies.filter(
      s => types.includes(s[0].type1) || (s[0].type2 != null && types.includes(s[0].type2)),
    );
  }

  // If no filtered mons exist at specified starter tiers, will expand starter search range until there are
  // Starts by decrementing starter tier min until it is 0, then increments tier max up to 10
  let tryFilterStarterTiers: [PokemonSpecies, number][] = filteredSpecies.filter(s => s[1] >= min && s[1] <= max);
  while (tryFilterStarterTiers.length === 0 && !(min === 0 && max === 10)) {
    if (min > 0) {
      min--;
    } else {
      max++;
    }

    tryFilterStarterTiers = filteredSpecies.filter(s => s[1] >= min && s[1] <= max);
  }

  if (tryFilterStarterTiers.length > 0) {
    const index = randSeedInt(tryFilterStarterTiers.length);
    return Phaser.Math.RND.shuffle(tryFilterStarterTiers)[index][0].speciesId;
  }

  return SpeciesId.BULBASAUR;
}

/**
 * Takes care of handling player pokemon KO (with all its side effects)
 *
 * @param scene the battle scene
 * @param pokemon the player pokemon to KO
 */
export function koPlayerPokemon(pokemon: PlayerPokemon) {
  pokemon.hp = 0;
  pokemon.doSetStatus(StatusEffect.FAINT);
  pokemon.updateInfo();
  queueEncounterMessage(
    i18next.t("battle:fainted", {
      pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
    }),
  );
}

/**
 * Handles applying hp changes to a player pokemon.
 * Takes care of not going below `0`, above max-hp, adding `FNT` status correctly and updating the pokemon info.
 * TODO: should we handle special cases like wonder-guard/shedinja?
 * @param scene the battle scene
 * @param pokemon the player pokemon to apply the hp change to
 * @param value the hp change amount. Positive for heal. Negative for damage
 *
 */
function applyHpChangeToPokemon(pokemon: PlayerPokemon, value: number) {
  const hpChange = Math.round(pokemon.hp + value);
  const nextHp = Math.max(Math.min(hpChange, pokemon.getMaxHp()), 0);
  if (nextHp === 0) {
    koPlayerPokemon(pokemon);
  } else {
    pokemon.hp = nextHp;
  }
}

/**
 * Handles applying damage to a player pokemon
 * @param scene the battle scene
 * @param pokemon the player pokemon to apply damage to
 * @param damage the amount of damage to apply
 * @see {@linkcode applyHpChangeToPokemon}
 */
export function applyDamageToPokemon(pokemon: PlayerPokemon, damage: number) {
  if (damage <= 0) {
    console.warn(
      "Healing pokemon with `applyDamageToPokemon` is not recommended! Please use `applyHealToPokemon` instead.",
    );
  }
  // If a Pokemon would faint from the damage applied, its HP is instead set to 1.
  if (pokemon.isAllowedInBattle() && pokemon.hp - damage <= 0) {
    damage = pokemon.hp - 1;
  }
  applyHpChangeToPokemon(pokemon, -damage);
}

/**
 * Handles applying heal to a player pokemon
 * @param scene the battle scene
 * @param pokemon the player pokemon to apply heal to
 * @param heal the amount of heal to apply
 * @see {@linkcode applyHpChangeToPokemon}
 */
export function applyHealToPokemon(pokemon: PlayerPokemon, heal: number) {
  if (heal <= 0) {
    console.warn(
      "Damaging pokemon with `applyHealToPokemon` is not recommended! Please use `applyDamageToPokemon` instead.",
    );
  }

  applyHpChangeToPokemon(pokemon, heal);
}

/**
 * Will modify all of a Pokemon's base stats by a flat value
 * Base stats can never go below 1
 * @param pokemon
 * @param value
 */
export async function modifyPlayerPokemonBST(pokemon: PlayerPokemon, good: boolean) {
  const modType = modifierTypes
    .MYSTERY_ENCOUNTER_SHUCKLE_JUICE()
    .generateType(globalScene.getPlayerParty(), [good ? 10 : -15])
    ?.withIdFromFunc(modifierTypes.MYSTERY_ENCOUNTER_SHUCKLE_JUICE);
  const modifier = modType?.newModifier(pokemon);
  if (modifier) {
    globalScene.addModifier(modifier, false, false, false, true);
    pokemon.calculateStats();
  }
}

/**
 * Will attempt to add a new modifier to a Pokemon.
 * If the Pokemon already has max stacks of that item, it will instead apply 'fallbackModifierType', if specified.
 * @param scene
 * @param pokemon
 * @param modType
 * @param fallbackModifierType
 */
export async function applyModifierTypeToPlayerPokemon(
  pokemon: PlayerPokemon,
  modType: PokemonHeldItemModifierType,
  fallbackModifierType?: PokemonHeldItemModifierType,
) {
  // Check if the Pokemon has max stacks of that item already
  const modifier = modType.newModifier(pokemon);
  const existing = globalScene.findModifier(
    (m): m is PokemonHeldItemModifier =>
      m instanceof PokemonHeldItemModifier
      && m.type.id === modType.id
      && m.pokemonId === pokemon.id
      && m.matchType(modifier),
  ) as PokemonHeldItemModifier | undefined;

  // At max stacks
  if (existing && existing.getStackCount() >= existing.getMaxStackCount()) {
    if (!fallbackModifierType) {
      return;
    }

    // Apply fallback
    return applyModifierTypeToPlayerPokemon(pokemon, fallbackModifierType);
  }

  globalScene.addModifier(modifier, false, false, false, true);
}

// #region Capture logic

/**
 * Alternative to using AttemptCapturePhase
 * Assumes player sprite is visible on the screen (this is intended for non-combat uses)
 *
 * Can await returned promise to wait for throw animation completion before continuing
 *
 * @param scene
 * @param pokemon
 * @param pokeballType
 * @param modifiedCatchRate - can pass custom ball catch rates (for special events, like safari)
 */
// TODO: Resolve the utterly massive code duplication between this and `AttemptCapturePhase`;
// the only differences between the 2 callsites are a trainer ball throw anim and a custom modified catchrate formula.
// This SHOULD be handled with a Phase subclass
export async function trainerThrowPokeball(
  pokemon: EnemyPokemon,
  pokeballType: PokeballType,
  modifiedCatchRate: number,
): Promise<boolean> {
  const originalY: number = pokemon.y;

  const [successfulShakes, caught] = computeTrainerCaptureOutcome(modifiedCatchRate);

  const fpOffset = pokemon.getFieldPositionOffset();
  const pokeballAtlasKey = getPokeballAtlasKey(pokeballType);
  const pokeball: Phaser.GameObjects.Sprite = globalScene.addFieldSprite(16 + 75, 80 + 25, "pb", pokeballAtlasKey);
  pokeball.setOrigin(0.5, 0.625);
  globalScene.field.add(pokeball);

  globalScene.trainer.setTexture(`trainer_${settings.isPlayerFemale ? "f" : "m"}_back_pb`);

  // TODO: Do some sort of `Promise.all` on these to ensure the phase doesn't end before all animations finish
  waitTime(300).then(() => {
    globalScene.field.moveBelow<Phaser.GameObjects.GameObject>(pokeball, pokemon);
  });

  await waitTime(512);
  audioManager.playSound("se/pb_throw");

  // Trainer throw frames
  // TODO: Find a better way of queueing these.
  globalScene.trainer.setFrame("2");
  waitTime(256).then(() => {
    globalScene.trainer.setFrame("3");
    waitTime(768).then(() => {
      globalScene.trainer.setTexture(
        `trainer_${settings.isPlayerFemale ? "f" : "m"}_back_pb`,
      );
    });
  });

  // Throw animation
  await playTween({
    targets: pokeball,
    x: { value: 236 + fpOffset[0], ease: "Linear" },
    y: { value: 16 + fpOffset[1], ease: "Cubic.easeOut" },
    duration: 500,
  });

  // Ball opens
  pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
  waitTime(17).then(() => pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));
  audioManager.playSound("se/pb_rel");
  pokemon.tint(getPokeballTintColor(pokeballType));

  globalScene.animations.addPokeballOpenParticles(pokeball.x, pokeball.y, pokeballType);

  // Mon enters ball
  await playTween({
    targets: pokemon,
    duration: 500,
    ease: "Sine.easeIn",
    scale: 0.25,
    y: 20,
  });

  // Ball closes
  pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
  pokemon.setVisible(false);
  audioManager.playSound("se/pb_catch");
  waitTime(17).then(() => pokeball.setTexture("pb", `${pokeballAtlasKey}`));

  // Ball bounces
  await new Promise<void>(resolve =>
    globalScene.time.delayedCall(250, () => doPokeballBounceAnim(pokeball, 16, 72, 350, resolve)),
  );

  // Play the wobble animations for each successful shake check.
  await handleTrainerShakeChecks(pokeball, successfulShakes);

  if (caught) {
    audioManager.playSound("se/pb_lock");
    globalScene.animations.addPokeballCaptureStars(pokeball);

    const pbTint = globalScene.add
      .sprite(pokeball.x, pokeball.y, "pb", "pb")
      .setOrigin(pokeball.originX, pokeball.originY)
      .setTintFill(0)
      .setAlpha(0);
    globalScene.field.add(pbTint);

    await playTween({
      targets: pbTint,
      alpha: 0.375,
      duration: 200,
      easing: "Sine.easeOut",
    });
    await playTween({
      targets: pbTint,
      alpha: 0,
      duration: 200,
      easing: "Sine.easeIn",
    });
    pbTint.destroy();

    await catchPokemon(pokemon, pokeball, pokeballType);
    return true;
  }
  await failCatch(pokemon, originalY, pokeball, pokeballType);
  return false;
}

/**
 * Pre-compute the outcome of a trainer's capture sequence using a custom shake probability.
 * @param modifiedCatchRate - Custom shake probability (0-65536 scale) for special events like safari
 * @returns A tuple containing:
 * 1. The number of successful shake check animations that should be displayed (0-3)
 * 2. Whether the Pokemon should be caught at the end of the sequence
 */
function computeTrainerCaptureOutcome(modifiedCatchRate: number): [successfulShakes: number, caught: boolean] {
  const maxShakeChecks = 3;
  let successfulShakes: number;

  for (successfulShakes = 0; successfulShakes < maxShakeChecks; successfulShakes++) {
    if (randSeedInt(65536) >= modifiedCatchRate) {
      break;
    }
  }

  // must succeed the final shake check (which determines whether the ball breaks at the end).
  // This does not produce a shake anim
  const caught = successfulShakes === maxShakeChecks && randSeedInt(65536) < modifiedCatchRate;

  return [successfulShakes, caught];
}

/**
 * Animate the pokeball wobbling for each successful shake check during trainer throw.
 *
 * Each wobble plays the "se/pb_move" sound, then tilts the ball
 * left or right via a 0→1→0 yoyo counter tween, followed by a
 * brief pause. The method resolves once all wobbles have played,
 * leaving catch/fail handling to the caller.
 *
 * @param pokeball - The pokeball sprite to animate
 * @param shakeCount - The number of wobble animations to play
 */
async function handleTrainerShakeChecks(pokeball: Phaser.GameObjects.Sprite, shakeCount: number): Promise<void> {
  if (shakeCount === 0) {
    return;
  }

  const pbX = pokeball.x;
  let currentShake = 0;

  // Initial pause before the first wobble
  await waitTime(1000);

  await playNumberTween({
    from: 0,
    to: 1,
    yoyo: true,
    ease: "Cubic.easeOut",
    duration: 250,
    repeat: shakeCount - 1,
    repeatDelay: 500,
    onUpdate: t => {
      const value = t.getValue() ?? 0;
      const directionMultiplier = currentShake % 2 === 0 ? 1 : -1;
      pokeball.setX(pbX + value * 4 * directionMultiplier);
      pokeball.setAngle(value * 27.5 * directionMultiplier);
    },
    onRepeat: () => {
      audioManager.playSound("se/pb_move");
      currentShake++;
    },
  });

  // Trailing pause after the final wobble
  await waitTime(500);
}

/**
 * Animates pokeball opening and messages when an attempted catch fails
 * @param pokemon
 * @param originalY
 * @param pokeball
 * @param pokeballType
 */
async function failCatch(
  pokemon: EnemyPokemon,
  originalY: number,
  pokeball: Phaser.GameObjects.Sprite,
  pokeballType: PokeballType,
): Promise<void> {
  audioManager.playSound("se/pb_rel");
  pokemon.setY(originalY);
  if (pokemon.status?.effect !== StatusEffect.SLEEP) {
    pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
  }
  pokemon.tint(getPokeballTintColor(pokeballType));
  pokemon.setVisible(true);
  pokemon.untint(250, "Sine.easeOut");

  const pokeballAtlasKey = getPokeballAtlasKey(pokeballType);
  pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
  waitTime(17).then(() => pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));

  await playTween({
    targets: pokemon,
    duration: 250,
    ease: "Sine.easeOut",
    scale: 1,
  });

  globalScene.currentBattle.lastUsedPokeball = pokeballType;
  removePb(pokeball);

  await new Promise<void>(resolve => {
    globalScene.ui.showText(
      i18next.t("battle:pokemonBrokeFree", {
        pokemonName: pokemon.getNameToRender(),
      }),
      null,
      () => resolve(),
      null,
      true,
    );
  });
}

/**
 *
 * @param scene
 * @param pokemon
 * @param pokeball
 * @param pokeballType
 * @param showCatchObtainMessage
 * @param isObtain
 */
export async function catchPokemon(
  pokemon: EnemyPokemon,
  pokeball: Phaser.GameObjects.Sprite | null,
  pokeballType: PokeballType,
  showCatchObtainMessage = true,
  isObtain = false,
): Promise<void> {
  const speciesForm = pokemon.fusionSpecies ? pokemon.getFusionSpeciesForm() : pokemon.getSpeciesForm();

  if (
    speciesForm.abilityHidden
    && (pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex) === speciesForm.getAbilityCount() - 1
  ) {
    globalScene.validateAchv(achvs.HIDDEN_ABILITY);
  }

  if (pokemon.species.subLegendary) {
    globalScene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
  }

  if (pokemon.species.legendary) {
    globalScene.validateAchv(achvs.CATCH_LEGENDARY);
  }

  if (pokemon.species.mythical) {
    globalScene.validateAchv(achvs.CATCH_MYTHICAL);
  }

  globalScene.pokemonInfoContainer.show(pokemon, true);

  globalScene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);

  return new Promise(resolve => {
    const addStatus = new BooleanHolder(true);
    applyChallenges(ChallengeType.POKEMON_ADD_TO_PARTY, pokemon, addStatus);
    const doPokemonCatchMenu = () => {
      const end = () => {
        // Ensure the pokemon is in the enemy party in all situations
        if (!globalScene.getEnemyParty().some(p => p.id === pokemon.id)) {
          globalScene.getEnemyParty().push(pokemon);
        }
        globalScene.phaseManager.unshiftNew("VictoryPhase", pokemon.id, true);
        globalScene.pokemonInfoContainer.hide();
        if (pokeball) {
          removePb(pokeball);
        }
        resolve();
      };
      const removePokemon = () => {
        if (pokemon) {
          pokemon.leaveField(false, true, true);
        }
      };
      const addToParty = (slotIndex?: number) => {
        const newPokemon = pokemon.addToParty(pokeballType, slotIndex);
        const modifiers = globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        if (globalScene.getPlayerParty().filter(p => p.isShiny()).length === 6) {
          globalScene.validateAchv(achvs.SHINY_PARTY);
        }
        Promise.all(modifiers.map(m => globalScene.addModifier(m, true))).then(() => {
          globalScene.updateModifiers(true);
          removePokemon();
          if (newPokemon) {
            newPokemon.loadAssets().then(end);
          } else {
            end();
          }
        });
      };
      Promise.all([pokemon.hideInfo(), globalScene.gameData.setPokemonCaught(pokemon)]).then(() => {
        if (!(isObtain || addStatus.value)) {
          removePokemon();
          end();
          return;
        }
        if (globalScene.getPlayerParty().length === 6) {
          const promptRelease = () => {
            globalScene.ui.showText(
              i18next.t("battle:partyFull", {
                pokemonName: pokemon.getNameToRender(),
              }),
              null,
              () => {
                globalScene.pokemonInfoContainer.makeRoomForConfirmUi(1, true);
                globalScene.ui.setMode(
                  UiMode.CONFIRM,
                  () => {
                    const newPokemon = globalScene.addPlayerPokemon(
                      pokemon.species,
                      pokemon.level,
                      pokemon.abilityIndex,
                      pokemon.formIndex,
                      pokemon.gender,
                      pokemon.shiny,
                      pokemon.variant,
                      pokemon.ivs,
                      pokemon.nature,
                      pokemon,
                    );
                    globalScene.ui.setMode(
                      UiMode.SUMMARY,
                      newPokemon,
                      0,
                      SummaryUiMode.DEFAULT,
                      () => {
                        globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                          promptRelease();
                        });
                      },
                      false,
                    );
                  },
                  () => {
                    const attributes = {
                      shiny: pokemon.shiny,
                      variant: pokemon.variant,
                      form: pokemon.formIndex,
                      female: pokemon.gender === Gender.FEMALE,
                    };
                    globalScene.ui.setOverlayMode(
                      UiMode.POKEDEX_PAGE,
                      pokemon.species,
                      pokemon.formIndex,
                      [attributes],
                      null,
                      () => {
                        globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                          promptRelease();
                        });
                      },
                    );
                  },
                  () => {
                    globalScene.ui.setMode(
                      UiMode.PARTY,
                      PartyUiMode.RELEASE,
                      0,
                      (slotIndex: number, _option: PartyOption) => {
                        globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                          if (slotIndex < 6) {
                            addToParty(slotIndex);
                          } else {
                            promptRelease();
                          }
                        });
                      },
                    );
                  },
                  () => {
                    globalScene.ui.setMode(UiMode.MESSAGE).then(() => {
                      removePokemon();
                      end();
                    });
                  },
                  "fullParty",
                );
              },
            );
          };
          promptRelease();
        } else {
          addToParty();
        }
      });
    };

    if (showCatchObtainMessage) {
      let catchMessage: string;
      if (isObtain) {
        catchMessage = "battle:pokemonObtained";
      } else if (addStatus.value) {
        catchMessage = "battle:pokemonCaught";
      } else {
        catchMessage = "battle:pokemonCaughtButChallenge";
      }
      globalScene.ui.showText(
        i18next.t(catchMessage, { pokemonName: pokemon.getNameToRender() }),
        null,
        doPokemonCatchMenu,
        0,
        true,
      );
    } else {
      doPokemonCatchMenu();
    }
  });
}

/**
 * Animates pokeball disappearing then destroys the object
 * @param scene
 * @param pokeball
 */
function removePb(pokeball: Phaser.GameObjects.Sprite) {
  if (pokeball) {
    playTween({
      targets: pokeball,
      duration: 250,
      delay: 250,
      ease: "Sine.easeIn",
      alpha: 0,
    }).then(() => pokeball.destroy());
  }
}

// #endregion Capture logic

/**
 * Animates a wild pokemon "fleeing", including sfx and messaging
 * @param scene
 * @param pokemon
 */
export async function doPokemonFlee(pokemon: EnemyPokemon): Promise<void> {
  await new Promise<void>(resolve => {
    audioManager.playSound("se/flee");
    // Ease pokemon out
    globalScene.tweens.add({
      targets: pokemon,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      duration: 1000,
      ease: "Sine.easeIn",
      scale: pokemon.getSpriteScale(),
      onComplete: () => {
        pokemon.setVisible(false);
        pokemon.leaveField(true, true, true);
        showEncounterText(
          i18next.t("battle:pokemonFled", {
            pokemonName: pokemon.getNameToRender(),
          }),
          null,
          600,
          false,
        ).then(() => {
          resolve();
        });
      },
    });
  });
}

/**
 * Handles the player fleeing from a wild pokemon, including sfx and messaging
 * @param scene
 * @param pokemon
 */
export function doPlayerFlee(pokemon: EnemyPokemon): Promise<void> {
  return new Promise<void>(resolve => {
    // Ease pokemon out
    globalScene.tweens.add({
      targets: pokemon,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      duration: 1000,
      ease: "Sine.easeIn",
      scale: pokemon.getSpriteScale(),
      onComplete: () => {
        pokemon.setVisible(false);
        pokemon.leaveField(true, true, true);
        showEncounterText(
          i18next.t("battle:playerFled", {
            pokemonName: pokemon.getNameToRender(),
          }),
          null,
          600,
          false,
        ).then(() => {
          resolve();
        });
      },
    });
  });
}

/**
 * Bug Species and their corresponding weights
 */
const GOLDEN_BUG_NET_SPECIES_POOL: [SpeciesId, number][] = [
  [SpeciesId.SCYTHER, 40],
  [SpeciesId.SCIZOR, 40],
  [SpeciesId.KLEAVOR, 40],
  [SpeciesId.PINSIR, 40],
  [SpeciesId.HERACROSS, 40],
  [SpeciesId.YANMA, 40],
  [SpeciesId.YANMEGA, 40],
  [SpeciesId.SHUCKLE, 40],
  [SpeciesId.ANORITH, 40],
  [SpeciesId.ARMALDO, 40],
  [SpeciesId.ESCAVALIER, 40],
  [SpeciesId.ACCELGOR, 40],
  [SpeciesId.JOLTIK, 40],
  [SpeciesId.GALVANTULA, 40],
  [SpeciesId.DURANT, 40],
  [SpeciesId.LARVESTA, 40],
  [SpeciesId.VOLCARONA, 40],
  [SpeciesId.DEWPIDER, 40],
  [SpeciesId.ARAQUANID, 40],
  [SpeciesId.WIMPOD, 40],
  [SpeciesId.GOLISOPOD, 40],
  [SpeciesId.SIZZLIPEDE, 40],
  [SpeciesId.CENTISKORCH, 40],
  [SpeciesId.NYMBLE, 40],
  [SpeciesId.LOKIX, 40],
  [SpeciesId.BUZZWOLE, 1],
  [SpeciesId.PHEROMOSA, 1],
];

/**
 * Will randomly return one of the species from GOLDEN_BUG_NET_SPECIES_POOL, based on their weights.
 * Will also check for and evolve pokemon based on level.
 */
export function getGoldenBugNetSpecies(level: number): PokemonSpecies {
  const totalWeight = GOLDEN_BUG_NET_SPECIES_POOL.reduce((a, b) => a + b[1], 0);
  const roll = randSeedInt(totalWeight);

  let w = 0;
  for (const speciesWeightPair of GOLDEN_BUG_NET_SPECIES_POOL) {
    w += speciesWeightPair[1];
    if (roll < w) {
      const initialSpecies = speciesDataRegistry.getSpecies(speciesWeightPair[0]);
      return speciesDataRegistry.getSpecies(
        initialSpecies.getWildSpeciesForLevel(level, true, false, globalScene.gameMode),
      );
    }
  }

  // Defaults to Scyther
  return speciesDataRegistry.getSpecies(SpeciesId.SCYTHER);
}

/**
 * Generates a Pokemon level for a given wave, with an option to increase/decrease by a scaling modifier
 * @param scene
 * @param levelAdditiveModifier Default 0. will add +(1 level / 10 waves * levelAdditiveModifier) to the level calculation
 */
export function getEncounterPokemonLevelForWave(levelAdditiveModifier = 0) {
  const currentBattle = globalScene.currentBattle;
  const baseLevel = currentBattle.getLevelForWave();

  // Add a level scaling modifier that is (+1 level per 10 waves) * levelAdditiveModifier
  return baseLevel + Math.max(Math.round((currentBattle.waveIndex / 10) * levelAdditiveModifier), 0);
}

export async function addPokemonDataToDexAndValidateAchievements(pokemon: PlayerPokemon) {
  const speciesForm = pokemon.fusionSpecies ? pokemon.getFusionSpeciesForm() : pokemon.getSpeciesForm();

  if (
    speciesForm.abilityHidden
    && (pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex) === speciesForm.getAbilityCount() - 1
  ) {
    globalScene.validateAchv(achvs.HIDDEN_ABILITY);
  }

  if (pokemon.species.subLegendary) {
    globalScene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
  }

  if (pokemon.species.legendary) {
    globalScene.validateAchv(achvs.CATCH_LEGENDARY);
  }

  if (pokemon.species.mythical) {
    globalScene.validateAchv(achvs.CATCH_MYTHICAL);
  }

  globalScene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);
  return globalScene.gameData.setPokemonCaught(pokemon, true, false, false);
}

/**
 * Checks if a Pokemon is allowed under a challenge, and allowed in battle.
 * If both are true, returns `null`.
 * If one of them is not true, returns message content that the Pokemon is invalid.
 * Typically used for cheecking whether a Pokemon can be selected for a {@linkcode MysteryEncounterOption}
 * @param pokemon
 * @param scene
 * @param invalidSelectionKey
 */
export function isPokemonValidForEncounterOptionSelection(
  pokemon: Pokemon,
  invalidSelectionKey: string,
): string | null {
  if (!pokemon.isAllowedInChallenge()) {
    return (
      i18next.t("partyUiHandler:cantBeUsed", {
        pokemonName: pokemon.getNameToRender(),
      }) ?? null
    );
  }
  if (!pokemon.isAllowedInBattle()) {
    return getEncounterText(invalidSelectionKey) ?? null;
  }

  return null;
}

/**
 * Permanently overrides the ability (not passive) of a pokemon.
 * If the pokemon is a fusion, instead overrides the fused pokemon's ability.
 */
export function applyAbilityOverrideToPokemon(pokemon: Pokemon, ability: AbilityId) {
  if (pokemon.isFusion()) {
    if (!pokemon.fusionCustomPokemonData) {
      pokemon.fusionCustomPokemonData = new CustomPokemonData();
    }
    pokemon.fusionCustomPokemonData.ability = ability;
  } else {
    pokemon.customPokemonData.ability = ability;
  }
}
