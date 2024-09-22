import BattleScene from "#app/battle-scene";
import i18next from "i18next";
import { isNullOrUndefined, randSeedInt } from "#app/utils";
import { PokemonHeldItemModifier } from "#app/modifier/modifier";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { doPokeballBounceAnim, getPokeballAtlasKey, getPokeballCatchMultiplier, getPokeballTintColor, PokeballType } from "#app/data/pokeball";
import { PlayerGender } from "#enums/player-gender";
import { addPokeballCaptureStars, addPokeballOpenParticles } from "#app/field/anims";
import { getStatusEffectCatchRateMultiplier, StatusEffect } from "#app/data/status-effect";
import { achvs } from "#app/system/achv";
import { Mode } from "#app/ui/ui";
import { PartyOption, PartyUiMode } from "#app/ui/party-ui-handler";
import { Species } from "#enums/species";
import { Type } from "#app/data/type";
import PokemonSpecies, { getPokemonSpecies, speciesStarters } from "#app/data/pokemon-species";
import { getEncounterText, queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { getPokemonNameWithAffix } from "#app/messages";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { Gender } from "#app/data/gender";
import { PermanentStat } from "#enums/stat";
import { VictoryPhase } from "#app/phases/victory-phase";
import { SummaryUiMode } from "#app/ui/summary-ui-handler";

/** Will give +1 level every 10 waves */
export const STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER = 1;

/**
 * Gets the sprite key and file root for a given PokemonSpecies (accounts for gender, shiny, variants, forms, and experimental)
 * @param species
 * @param female
 * @param formIndex
 * @param shiny
 * @param variant
 */
export function getSpriteKeysFromSpecies(species: Species, female?: boolean, formIndex?: number, shiny?: boolean, variant?: number): { spriteKey: string, fileRoot: string } {
  const spriteKey = getPokemonSpecies(species).getSpriteKey(female ?? false, formIndex ?? 0, shiny ?? false, variant ?? 0);
  const fileRoot = getPokemonSpecies(species).getSpriteAtlasPath(female ?? false, formIndex ?? 0, shiny ?? false, variant ?? 0);
  return { spriteKey, fileRoot };
}

/**
 * Gets the sprite key and file root for a given Pokemon (accounts for gender, shiny, variants, forms, and experimental)
 * @param pokemon
 */
export function getSpriteKeysFromPokemon(pokemon: Pokemon): { spriteKey: string, fileRoot: string } {
  const spriteKey = pokemon.getSpeciesForm().getSpriteKey(pokemon.getGender() === Gender.FEMALE, pokemon.formIndex, pokemon.shiny, pokemon.variant);
  const fileRoot = pokemon.getSpeciesForm().getSpriteAtlasPath(pokemon.getGender() === Gender.FEMALE, pokemon.formIndex, pokemon.shiny, pokemon.variant);

  return { spriteKey, fileRoot };
}

/**
 * Will never remove the player's last non-fainted Pokemon (if they only have 1)
 * Otherwise, picks a Pokemon completely at random and removes from the party
 * @param scene
 * @param isAllowed Default false. If true, only picks from legal mons. If no legal mons are found (or there is 1, with `doNotReturnLastAllowedMon = true), will return a mon that is not allowed.
 * @param isFainted Default false. If true, includes fainted mons.
 * @param doNotReturnLastAllowedMon Default false. If true, will never return the last unfainted pokemon in the party. Useful when this function is being used to determine what Pokemon to remove from the party (Don't want to remove last unfainted)
 * @returns
 */
export function getRandomPlayerPokemon(scene: BattleScene, isAllowed: boolean = false, isFainted: boolean = false, doNotReturnLastAllowedMon: boolean = false): PlayerPokemon {
  const party = scene.getParty();
  let chosenIndex: number;
  let chosenPokemon: PlayerPokemon | null = null;
  const fullyLegalMons = party.filter(p => (!isAllowed || p.isAllowed()) && (isFainted || !p.isFainted()));
  const allowedOnlyMons = party.filter(p => p.isAllowed());

  if (doNotReturnLastAllowedMon && fullyLegalMons.length === 1) {
    // If there is only 1 legal/unfainted mon left, select from fainted legal mons
    const faintedLegalMons = party.filter(p => (!isAllowed || p.isAllowed()) && p.isFainted());
    if (faintedLegalMons.length > 0) {
      chosenIndex = randSeedInt(faintedLegalMons.length);
      chosenPokemon = faintedLegalMons[chosenIndex];
    }
  }
  if (!chosenPokemon && fullyLegalMons.length > 0) {
    chosenIndex = randSeedInt(fullyLegalMons.length);
    chosenPokemon = fullyLegalMons[chosenIndex];
  }
  if (!chosenPokemon && isAllowed && allowedOnlyMons.length > 0) {
    chosenIndex = randSeedInt(allowedOnlyMons.length);
    chosenPokemon = allowedOnlyMons[chosenIndex];
  }
  if (!chosenPokemon) {
    // If no other options worked, returns fully random
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
export function getHighestLevelPlayerPokemon(scene: BattleScene, isAllowed: boolean = false, isFainted: boolean = false): PlayerPokemon {
  const party = scene.getParty();
  let pokemon: PlayerPokemon | null = null;

  for (const p of party) {
    if (isAllowed && !p.isAllowed()) {
      continue;
    }
    if (!isFainted && p.isFainted()) {
      continue;
    }

    pokemon = pokemon ? pokemon?.level < p?.level ? p : pokemon : p;
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
export function getHighestStatPlayerPokemon(scene: BattleScene, stat: PermanentStat, isAllowed: boolean = false, isFainted: boolean = false): PlayerPokemon {
  const party = scene.getParty();
  let pokemon: PlayerPokemon | null = null;

  for (const p of party) {
    if (isAllowed && !p.isAllowed()) {
      continue;
    }
    if (!isFainted && p.isFainted()) {
      continue;
    }

    pokemon = pokemon ? pokemon.getStat(stat) < p?.getStat(stat) ? p : pokemon : p;
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
export function getLowestLevelPlayerPokemon(scene: BattleScene, isAllowed: boolean = false, isFainted: boolean = false): PlayerPokemon {
  const party = scene.getParty();
  let pokemon: PlayerPokemon | null = null;

  for (const p of party) {
    if (isAllowed && !p.isAllowed()) {
      continue;
    }
    if (!isFainted && p.isFainted()) {
      continue;
    }

    pokemon = pokemon ? pokemon?.level > p?.level ? p : pokemon : p;
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
export function getHighestStatTotalPlayerPokemon(scene: BattleScene, isAllowed: boolean = false, isFainted: boolean = false): PlayerPokemon {
  const party = scene.getParty();
  let pokemon: PlayerPokemon | null = null;

  for (const p of party) {
    if (isAllowed && !p.isAllowed()) {
      continue;
    }
    if (!isFainted && p.isFainted()) {
      continue;
    }

    pokemon = pokemon ? pokemon?.stats.reduce((a, b) => a + b) < p?.stats.reduce((a, b) => a + b) ? p : pokemon : p;
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
export function getRandomSpeciesByStarterTier(starterTiers: number | [number, number], excludedSpecies?: Species[], types?: Type[], allowSubLegendary: boolean = true, allowLegendary: boolean = true, allowMythical: boolean = true): Species {
  let min = Array.isArray(starterTiers) ? starterTiers[0] : starterTiers;
  let max = Array.isArray(starterTiers) ? starterTiers[1] : starterTiers;

  let filteredSpecies: [PokemonSpecies, number][] = Object.keys(speciesStarters)
    .map(s => [parseInt(s) as Species, speciesStarters[s] as number])
    .filter(s => {
      const pokemonSpecies = getPokemonSpecies(s[0]);
      return pokemonSpecies && (!excludedSpecies || !excludedSpecies.includes(s[0])
        && (allowSubLegendary || !pokemonSpecies.subLegendary)
        && (allowLegendary || !pokemonSpecies.legendary)
        && (allowMythical || !pokemonSpecies.mythical));
    })
    .map(s => [getPokemonSpecies(s[0]), s[1]]);

  if (types && types.length > 0) {
    filteredSpecies = filteredSpecies.filter(s => types.includes(s[0].type1) || (!isNullOrUndefined(s[0].type2) && types.includes(s[0].type2!)));
  }

  // If no filtered mons exist at specified starter tiers, will expand starter search range until there are
  // Starts by decrementing starter tier min until it is 0, then increments tier max up to 10
  let tryFilterStarterTiers: [PokemonSpecies, number][] = filteredSpecies.filter(s => (s[1] >= min && s[1] <= max));
  while (tryFilterStarterTiers.length === 0 && (min !== 0 && max !== 10)) {
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

  return Species.BULBASAUR;
}

/**
 * Takes care of handling player pokemon KO (with all its side effects)
 *
 * @param scene the battle scene
 * @param pokemon the player pokemon to KO
 */
export function koPlayerPokemon(scene: BattleScene, pokemon: PlayerPokemon) {
  pokemon.hp = 0;
  pokemon.trySetStatus(StatusEffect.FAINT);
  pokemon.updateInfo();
  queueEncounterMessage(scene, i18next.t("battle:fainted", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }));
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
function applyHpChangeToPokemon(scene: BattleScene, pokemon: PlayerPokemon, value: number) {
  const hpChange = Math.round(pokemon.hp + value);
  const nextHp = Math.max(Math.min(hpChange, pokemon.getMaxHp()), 0);
  if (nextHp === 0) {
    koPlayerPokemon(scene, pokemon);
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
export function applyDamageToPokemon(scene: BattleScene, pokemon: PlayerPokemon, damage: number) {
  if (damage <= 0) {
    console.warn("Healing pokemon with `applyDamageToPokemon` is not recommended! Please use `applyHealToPokemon` instead.");
  }

  applyHpChangeToPokemon(scene, pokemon, -damage);
}

/**
 * Handles applying heal to a player pokemon
 * @param scene the battle scene
 * @param pokemon the player pokemon to apply heal to
 * @param heal the amount of heal to apply
 * @see {@linkcode applyHpChangeToPokemon}
 */
export function applyHealToPokemon(scene: BattleScene, pokemon: PlayerPokemon, heal: number) {
  if (heal <= 0) {
    console.warn("Damaging pokemon with `applyHealToPokemon` is not recommended! Please use `applyDamageToPokemon` instead.");
  }

  applyHpChangeToPokemon(scene, pokemon, heal);
}

/**
 * Will modify all of a Pokemon's base stats by a flat value
 * Base stats can never go below 1
 * @param pokemon
 * @param value
 */
export async function modifyPlayerPokemonBST(pokemon: PlayerPokemon, value: number) {
  const modType = modifierTypes.MYSTERY_ENCOUNTER_SHUCKLE_JUICE()
    .generateType(pokemon.scene.getParty(), [value])
    ?.withIdFromFunc(modifierTypes.MYSTERY_ENCOUNTER_SHUCKLE_JUICE);
  const modifier = modType?.newModifier(pokemon);
  if (modifier) {
    await pokemon.scene.addModifier(modifier, false, false, false, true);
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
export async function applyModifierTypeToPlayerPokemon(scene: BattleScene, pokemon: PlayerPokemon, modType: PokemonHeldItemModifierType, fallbackModifierType?: PokemonHeldItemModifierType) {
  // Check if the Pokemon has max stacks of that item already
  const modifier = modType.newModifier(pokemon);
  const existing = scene.findModifier(m => (
    m instanceof PokemonHeldItemModifier &&
    m.type.id === modType.id &&
    m.pokemonId === pokemon.id &&
    m.matchType(modifier)
  )) as PokemonHeldItemModifier;

  // At max stacks
  if (existing && existing.getStackCount() >= existing.getMaxStackCount(scene)) {
    if (!fallbackModifierType) {
      return;
    }

    // Apply fallback
    return applyModifierTypeToPlayerPokemon(scene, pokemon, fallbackModifierType);
  }

  await scene.addModifier(modifier, false, false, false, true);
}

/**
 * Alternative to using AttemptCapturePhase
 * Assumes player sprite is visible on the screen (this is intended for non-combat uses)
 *
 * Can await returned promise to wait for throw animation completion before continuing
 *
 * @param scene
 * @param pokemon
 * @param pokeballType
 * @param ballTwitchRate - can pass custom ball catch rates (for special events, like safari)
 */
export function trainerThrowPokeball(scene: BattleScene, pokemon: EnemyPokemon, pokeballType: PokeballType, ballTwitchRate?: number): Promise<boolean> {
  const originalY: number = pokemon.y;

  if (!ballTwitchRate) {
    const _3m = 3 * pokemon.getMaxHp();
    const _2h = 2 * pokemon.hp;
    const catchRate = pokemon.species.catchRate;
    const pokeballMultiplier = getPokeballCatchMultiplier(pokeballType);
    const statusMultiplier = pokemon.status ? getStatusEffectCatchRateMultiplier(pokemon.status.effect) : 1;
    const x = Math.round((((_3m - _2h) * catchRate * pokeballMultiplier) / _3m) * statusMultiplier);
    ballTwitchRate = Math.round(65536 / Math.sqrt(Math.sqrt(255 / x)));
  }

  const fpOffset = pokemon.getFieldPositionOffset();
  const pokeballAtlasKey = getPokeballAtlasKey(pokeballType);
  const pokeball: Phaser.GameObjects.Sprite = scene.addFieldSprite(16 + 75, 80 + 25, "pb", pokeballAtlasKey);
  pokeball.setOrigin(0.5, 0.625);
  scene.field.add(pokeball);

  scene.time.delayedCall(300, () => {
    scene.field.moveBelow(pokeball as Phaser.GameObjects.GameObject, pokemon);
  });

  return new Promise(resolve => {
    scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
    scene.time.delayedCall(512, () => {
      scene.playSound("se/pb_throw");

      // Trainer throw frames
      scene.trainer.setFrame("2");
      scene.time.delayedCall(256, () => {
        scene.trainer.setFrame("3");
        scene.time.delayedCall(768, () => {
          scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);
        });
      });

      // Pokeball move and catch logic
      scene.tweens.add({
        targets: pokeball,
        x: { value: 236 + fpOffset[0], ease: "Linear" },
        y: { value: 16 + fpOffset[1], ease: "Cubic.easeOut" },
        duration: 500,
        onComplete: () => {
          pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
          scene.time.delayedCall(17, () => pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));
          scene.playSound("se/pb_rel");
          pokemon.tint(getPokeballTintColor(pokeballType));

          addPokeballOpenParticles(scene, pokeball.x, pokeball.y, pokeballType);

          scene.tweens.add({
            targets: pokemon,
            duration: 500,
            ease: "Sine.easeIn",
            scale: 0.25,
            y: 20,
            onComplete: () => {
              pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
              pokemon.setVisible(false);
              scene.playSound("se/pb_catch");
              scene.time.delayedCall(17, () => pokeball.setTexture("pb", `${pokeballAtlasKey}`));

              const doShake = () => {
                let shakeCount = 0;
                const pbX = pokeball.x;
                const shakeCounter = scene.tweens.addCounter({
                  from: 0,
                  to: 1,
                  repeat: 4,
                  yoyo: true,
                  ease: "Cubic.easeOut",
                  duration: 250,
                  repeatDelay: 500,
                  onUpdate: t => {
                    if (shakeCount && shakeCount < 4) {
                      const value = t.getValue();
                      const directionMultiplier = shakeCount % 2 === 1 ? 1 : -1;
                      pokeball.setX(pbX + value * 4 * directionMultiplier);
                      pokeball.setAngle(value * 27.5 * directionMultiplier);
                    }
                  },
                  onRepeat: () => {
                    if (!pokemon.species.isObtainable()) {
                      shakeCounter.stop();
                      failCatch(scene, pokemon, originalY, pokeball, pokeballType).then(() => resolve(false));
                    } else if (shakeCount++ < 3) {
                      if (randSeedInt(65536) < ballTwitchRate) {
                        scene.playSound("se/pb_move");
                      } else {
                        shakeCounter.stop();
                        failCatch(scene, pokemon, originalY, pokeball, pokeballType).then(() => resolve(false));
                      }
                    } else {
                      scene.playSound("se/pb_lock");
                      addPokeballCaptureStars(scene, pokeball);

                      const pbTint = scene.add.sprite(pokeball.x, pokeball.y, "pb", "pb");
                      pbTint.setOrigin(pokeball.originX, pokeball.originY);
                      pbTint.setTintFill(0);
                      pbTint.setAlpha(0);
                      scene.field.add(pbTint);
                      scene.tweens.add({
                        targets: pbTint,
                        alpha: 0.375,
                        duration: 200,
                        easing: "Sine.easeOut",
                        onComplete: () => {
                          scene.tweens.add({
                            targets: pbTint,
                            alpha: 0,
                            duration: 200,
                            easing: "Sine.easeIn",
                            onComplete: () => pbTint.destroy()
                          });
                        }
                      });
                    }
                  },
                  onComplete: () => {
                    catchPokemon(scene, pokemon, pokeball, pokeballType).then(() => resolve(true));
                  }
                });
              };

              scene.time.delayedCall(250, () => doPokeballBounceAnim(scene, pokeball, 16, 72, 350, doShake));
            }
          });
        }
      });
    });
  });
}

/**
 * Animates pokeball opening and messages when an attempted catch fails
 * @param scene
 * @param pokemon
 * @param originalY
 * @param pokeball
 * @param pokeballType
 */
function failCatch(scene: BattleScene, pokemon: EnemyPokemon, originalY: number, pokeball: Phaser.GameObjects.Sprite, pokeballType: PokeballType) {
  return new Promise<void>(resolve => {
    scene.playSound("se/pb_rel");
    pokemon.setY(originalY);
    if (pokemon.status?.effect !== StatusEffect.SLEEP) {
      pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
    }
    pokemon.tint(getPokeballTintColor(pokeballType));
    pokemon.setVisible(true);
    pokemon.untint(250, "Sine.easeOut");

    const pokeballAtlasKey = getPokeballAtlasKey(pokeballType);
    pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
    scene.time.delayedCall(17, () => pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));

    scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeOut",
      scale: 1
    });

    scene.currentBattle.lastUsedPokeball = pokeballType;
    removePb(scene, pokeball);

    scene.ui.showText(i18next.t("battle:pokemonBrokeFree", { pokemonName: pokemon.getNameToRender() }), null, () => resolve(), null, true);
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
export async function catchPokemon(scene: BattleScene, pokemon: EnemyPokemon, pokeball: Phaser.GameObjects.Sprite | null, pokeballType: PokeballType, showCatchObtainMessage: boolean = true, isObtain: boolean = false): Promise<void> {
  const speciesForm = !pokemon.fusionSpecies ? pokemon.getSpeciesForm() : pokemon.getFusionSpeciesForm();

  if (speciesForm.abilityHidden && (pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex) === speciesForm.getAbilityCount() - 1) {
    scene.validateAchv(achvs.HIDDEN_ABILITY);
  }

  if (pokemon.species.subLegendary) {
    scene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
  }

  if (pokemon.species.legendary) {
    scene.validateAchv(achvs.CATCH_LEGENDARY);
  }

  if (pokemon.species.mythical) {
    scene.validateAchv(achvs.CATCH_MYTHICAL);
  }

  scene.pokemonInfoContainer.show(pokemon, true);

  scene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);

  return new Promise(resolve => {
    const doPokemonCatchMenu = () => {
      const end = () => {
        // Ensure the pokemon is in the enemy party in all situations
        if (!scene.getEnemyParty().some(p => p.id === pokemon.id)) {
          scene.getEnemyParty().push(pokemon);
        }
        scene.unshiftPhase(new VictoryPhase(scene, pokemon.id, true));
        scene.pokemonInfoContainer.hide();
        if (pokeball) {
          removePb(scene, pokeball);
        }
        resolve();
      };
      const removePokemon = () => {
        if (pokemon) {
          scene.field.remove(pokemon, true);
        }
      };
      const addToParty = (slotIndex?: number) => {
        const newPokemon = pokemon.addToParty(pokeballType, slotIndex);
        const modifiers = scene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        if (scene.getParty().filter(p => p.isShiny()).length === 6) {
          scene.validateAchv(achvs.SHINY_PARTY);
        }
        Promise.all(modifiers.map(m => scene.addModifier(m, true))).then(() => {
          scene.updateModifiers(true);
          removePokemon();
          if (newPokemon) {
            newPokemon.loadAssets().then(end);
          } else {
            end();
          }
        });
      };
      Promise.all([pokemon.hideInfo(), scene.gameData.setPokemonCaught(pokemon)]).then(() => {
        if (scene.getParty().length === 6) {
          const promptRelease = () => {
            scene.ui.showText(i18next.t("battle:partyFull", { pokemonName: pokemon.getNameToRender() }), null, () => {
              scene.pokemonInfoContainer.makeRoomForConfirmUi(1, true);
              scene.ui.setMode(Mode.CONFIRM, () => {
                const newPokemon = scene.addPlayerPokemon(pokemon.species, pokemon.level, pokemon.abilityIndex, pokemon.formIndex, pokemon.gender, pokemon.shiny, pokemon.variant, pokemon.ivs, pokemon.nature, pokemon);
                scene.ui.setMode(Mode.SUMMARY, newPokemon, 0, SummaryUiMode.DEFAULT, () => {
                  scene.ui.setMode(Mode.MESSAGE).then(() => {
                    promptRelease();
                  });
                }, false);
              }, () => {
                scene.ui.setMode(Mode.PARTY, PartyUiMode.RELEASE, 0, (slotIndex: integer, _option: PartyOption) => {
                  scene.ui.setMode(Mode.MESSAGE).then(() => {
                    if (slotIndex < 6) {
                      addToParty(slotIndex);
                    } else {
                      promptRelease();
                    }
                  });
                });
              }, () => {
                scene.ui.setMode(Mode.MESSAGE).then(() => {
                  removePokemon();
                  end();
                });
              }, "fullParty");
            });
          };
          promptRelease();
        } else {
          addToParty();
        }
      });
    };

    if (showCatchObtainMessage) {
      scene.ui.showText(i18next.t(isObtain ? "battle:pokemonObtained" : "battle:pokemonCaught", { pokemonName: pokemon.getNameToRender() }), null, doPokemonCatchMenu, 0, true);
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
function removePb(scene: BattleScene, pokeball: Phaser.GameObjects.Sprite) {
  if (pokeball) {
    scene.tweens.add({
      targets: pokeball,
      duration: 250,
      delay: 250,
      ease: "Sine.easeIn",
      alpha: 0,
      onComplete: () => {
        pokeball.destroy();
      }
    });
  }
}

/**
 * Animates a wild pokemon "fleeing", including sfx and messaging
 * @param scene
 * @param pokemon
 */
export async function doPokemonFlee(scene: BattleScene, pokemon: EnemyPokemon): Promise<void> {
  await new Promise<void>(resolve => {
    scene.playSound("se/flee");
    // Ease pokemon out
    scene.tweens.add({
      targets: pokemon,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      duration: 1000,
      ease: "Sine.easeIn",
      scale: pokemon.getSpriteScale(),
      onComplete: () => {
        pokemon.setVisible(false);
        scene.field.remove(pokemon, true);
        showEncounterText(scene, i18next.t("battle:pokemonFled", { pokemonName: pokemon.getNameToRender() }), null, 600, false)
          .then(() => {
            resolve();
          });
      }
    });
  });
}

/**
 * Handles the player fleeing from a wild pokemon, including sfx and messaging
 * @param scene
 * @param pokemon
 */
export function doPlayerFlee(scene: BattleScene, pokemon: EnemyPokemon): Promise<void> {
  return new Promise<void>(resolve => {
    // Ease pokemon out
    scene.tweens.add({
      targets: pokemon,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      duration: 1000,
      ease: "Sine.easeIn",
      scale: pokemon.getSpriteScale(),
      onComplete: () => {
        pokemon.setVisible(false);
        scene.field.remove(pokemon, true);
        showEncounterText(scene, i18next.t("battle:playerFled", { pokemonName: pokemon.getNameToRender() }), null, 600, false)
          .then(() => {
            resolve();
          });
      }
    });
  });
}

/**
 * Bug Species and their corresponding weights
 */
const GOLDEN_BUG_NET_SPECIES_POOL: [Species, number][] = [
  [Species.SCYTHER, 40],
  [Species.SCIZOR, 40],
  [Species.KLEAVOR, 40],
  [Species.PINSIR, 40],
  [Species.HERACROSS, 40],
  [Species.YANMA, 40],
  [Species.YANMEGA, 40],
  [Species.SHUCKLE, 40],
  [Species.ANORITH, 40],
  [Species.ARMALDO, 40],
  [Species.ESCAVALIER, 40],
  [Species.ACCELGOR, 40],
  [Species.JOLTIK, 40],
  [Species.GALVANTULA, 40],
  [Species.DURANT, 40],
  [Species.LARVESTA, 40],
  [Species.VOLCARONA, 40],
  [Species.DEWPIDER, 40],
  [Species.ARAQUANID, 40],
  [Species.WIMPOD, 40],
  [Species.GOLISOPOD, 40],
  [Species.SIZZLIPEDE, 40],
  [Species.CENTISKORCH, 40],
  [Species.NYMBLE, 40],
  [Species.LOKIX, 40],
  [Species.BUZZWOLE, 1],
  [Species.PHEROMOSA, 1],
];

/**
 * Will randomly return one of the species from GOLDEN_BUG_NET_SPECIES_POOL, based on their weights
 */
export function getGoldenBugNetSpecies(): PokemonSpecies {
  const totalWeight = GOLDEN_BUG_NET_SPECIES_POOL.reduce((a, b) => a + b[1], 0);
  const roll = randSeedInt(totalWeight);

  let w = 0;
  for (const speciesWeightPair of GOLDEN_BUG_NET_SPECIES_POOL) {
    w += speciesWeightPair[1];
    if (roll < w) {
      return getPokemonSpecies(speciesWeightPair[0]);
    }
  }

  // Defaults to Scyther
  return getPokemonSpecies(Species.SCYTHER);
}

/**
 * Generates a Pokemon level for a given wave, with an option to increase/decrease by a scaling modifier
 * @param scene
 * @param levelAdditiveModifier Default 0. will add +(1 level / 10 waves * levelAdditiveModifier) to the level calculation
 */
export function getEncounterPokemonLevelForWave(scene: BattleScene, levelAdditiveModifier: number = 0) {
  const currentBattle = scene.currentBattle;
  const baseLevel = currentBattle.getLevelForWave();

  // Add a level scaling modifier that is (+1 level per 10 waves) * levelAdditiveModifier
  return baseLevel + Math.max(Math.round((currentBattle.waveIndex / 10) * levelAdditiveModifier), 0);
}

export async function addPokemonDataToDexAndValidateAchievements(scene: BattleScene, pokemon: PlayerPokemon) {
  const speciesForm = !pokemon.fusionSpecies ? pokemon.getSpeciesForm() : pokemon.getFusionSpeciesForm();

  if (speciesForm.abilityHidden && (pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex) === speciesForm.getAbilityCount() - 1) {
    scene.validateAchv(achvs.HIDDEN_ABILITY);
  }

  if (pokemon.species.subLegendary) {
    scene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
  }

  if (pokemon.species.legendary) {
    scene.validateAchv(achvs.CATCH_LEGENDARY);
  }

  if (pokemon.species.mythical) {
    scene.validateAchv(achvs.CATCH_MYTHICAL);
  }

  scene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);
  return scene.gameData.setPokemonCaught(pokemon, true, false, false);
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
export function isPokemonValidForEncounterOptionSelection(pokemon: Pokemon, scene: BattleScene, invalidSelectionKey: string): string | null {
  if (!pokemon.isAllowed()) {
    return i18next.t("partyUiHandler:cantBeUsed", { pokemonName: pokemon.getNameToRender() }) ?? null;
  }
  if (!pokemon.isAllowedInBattle()) {
    return getEncounterText(scene, invalidSelectionKey) ?? null;
  }

  return null;
}
