import { EnemyPartyConfig, generateModifierType, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, setEncounterRewards, transitionMysteryEncounterIntroVisuals, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import Pokemon, { EnemyPokemon, PokemonMove } from "#app/field/pokemon";
import { BerryModifierType, modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { PersistentModifierRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { BerryModifier } from "#app/modifier/modifier";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Moves } from "#enums/moves";
import { BattlerTagType } from "#enums/battler-tag-type";
import { randInt } from "#app/utils";
import { BattlerIndex } from "#app/battle";
import { applyModifierTypeToPlayerPokemon, catchPokemon, getHighestLevelPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { TrainerSlot } from "#app/data/trainer-config";
import { PokeballType } from "#app/data/pokeball";
import HeldModifierConfig from "#app/interfaces/held-modifier-config";
import { BerryType } from "#enums/berry-type";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { Stat } from "#enums/stat";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounter:absoluteAvarice";

/**
 * Absolute Avarice encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3805 | GitHub Issue #3805}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const AbsoluteAvariceEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.ABSOLUTE_AVARICE)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withSceneRequirement(new PersistentModifierRequirement("BerryModifier", 4)) // Must have at least 4 berries to spawn
    .withIntroSpriteConfigs([
      {
        // This sprite has the shadow
        spriteKey: "",
        fileRoot: "",
        species: Species.GREEDENT,
        hasShadow: true,
        alpha: 0.001,
        repeat: true,
        x: -5
      },
      {
        spriteKey: "",
        fileRoot: "",
        species: Species.GREEDENT,
        hasShadow: false,
        repeat: true,
        x: -5
      },
      {
        spriteKey: "lum_berry",
        fileRoot: "items",
        isItem: true,
        x: 7,
        y: -14,
        hidden: true,
        disableAnimation: true
      },
      {
        spriteKey: "salac_berry",
        fileRoot: "items",
        isItem: true,
        x: 2,
        y: 4,
        hidden: true,
        disableAnimation: true
      },
      {
        spriteKey: "lansat_berry",
        fileRoot: "items",
        isItem: true,
        x: 32,
        y: 5,
        hidden: true,
        disableAnimation: true
      },
      {
        spriteKey: "liechi_berry",
        fileRoot: "items",
        isItem: true,
        x: 6,
        y: -5,
        hidden: true,
        disableAnimation: true
      },
      {
        spriteKey: "sitrus_berry",
        fileRoot: "items",
        isItem: true,
        x: 7,
        y: 8,
        hidden: true,
        disableAnimation: true
      },
      {
        spriteKey: "enigma_berry",
        fileRoot: "items",
        isItem: true,
        x: 26,
        y: -4,
        hidden: true,
        disableAnimation: true
      },
      {
        spriteKey: "leppa_berry",
        fileRoot: "items",
        isItem: true,
        x: 16,
        y: -27,
        hidden: true,
        disableAnimation: true
      },
      {
        spriteKey: "petaya_berry",
        fileRoot: "items",
        isItem: true,
        x: 30,
        y: -17,
        hidden: true,
        disableAnimation: true
      },
      {
        spriteKey: "ganlon_berry",
        fileRoot: "items",
        isItem: true,
        x: 16,
        y: -11,
        hidden: true,
        disableAnimation: true
      },
      {
        spriteKey: "apicot_berry",
        fileRoot: "items",
        isItem: true,
        x: 14,
        y: -2,
        hidden: true,
        disableAnimation: true
      },
      {
        spriteKey: "starf_berry",
        fileRoot: "items",
        isItem: true,
        x: 18,
        y: 9,
        hidden: true,
        disableAnimation: true
      },
    ])
    .withHideWildIntroMessage(true)
    .withAutoHideIntroVisuals(false)
    .withOnVisualsStart((scene: BattleScene) => {
      doGreedentSpriteSteal(scene);
      doBerrySpritePile(scene);

      return true;
    })
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      }
    ])
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;

      scene.loadSe("PRSFX- Bug Bite", "battle_anims", "PRSFX- Bug Bite.wav");
      scene.loadSe("Follow Me", "battle_anims", "Follow Me.mp3");

      // Get all player berry items, remove from party, and store reference
      const berryItems = scene.findModifiers(m => m instanceof BerryModifier) as BerryModifier[];

      // Sort berries by party member ID to more easily re-add later if necessary
      const berryItemsMap = new Map<number, BerryModifier[]>();
      scene.getParty().forEach(pokemon => {
        const pokemonBerries = berryItems.filter(b => b.pokemonId === pokemon.id);
        if (pokemonBerries?.length > 0) {
          berryItemsMap.set(pokemon.id, pokemonBerries);
        }
      });

      encounter.misc = { berryItemsMap };

      // Generates copies of the stolen berries to put on the Greedent
      const bossModifierConfigs: HeldModifierConfig[] = [];
      berryItems.forEach(berryMod => {
        // Can't define stack count on a ModifierType, have to just create separate instances for each stack
        // Overflow berries will be "lost" on the boss, but it's un-catchable anyway
        for (let i = 0; i < berryMod.stackCount; i++) {
          const modifierType = generateModifierType(scene, modifierTypes.BERRY, [berryMod.berryType]) as PokemonHeldItemModifierType;
          bossModifierConfigs.push({ modifier: modifierType });
        }
      });

      // Do NOT remove the real berries yet or else it will be persisted in the session data

      // SpDef buff below wave 50, +1 to all stats otherwise
      const statChangesForBattle: (Stat.ATK | Stat.DEF | Stat.SPATK | Stat.SPDEF | Stat.SPD | Stat.ACC | Stat.EVA)[] = scene.currentBattle.waveIndex < 50 ?
        [Stat.SPDEF] :
        [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD];

      // Calculate boss mon
      const config: EnemyPartyConfig = {
        levelAdditiveModifier: 1,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.GREEDENT),
            isBoss: true,
            bossSegments: 3,
            moveSet: [Moves.THRASH, Moves.BODY_PRESS, Moves.STUFF_CHEEKS, Moves.CRUNCH],
            modifierConfigs: bossModifierConfigs,
            tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
            mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
              queueEncounterMessage(pokemon.scene, `${namespace}.option.1.boss_enraged`);
              pokemon.scene.unshiftPhase(new StatStageChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, statChangesForBattle, 1));
            }
          }
        ],
      };

      encounter.enemyPartyConfigs = [config];
      encounter.setDialogueToken("greedentName", getPokemonSpecies(Species.GREEDENT).getName());

      return true;
    })
    .withOnVisualsStart((scene: BattleScene) => {
      // Remove the berries from the party
      // Session has been safely saved at this point, so data won't be lost
      const berryItems = scene.findModifiers(m => m instanceof BerryModifier) as BerryModifier[];
      berryItems.forEach(berryMod => {
        scene.removeModifier(berryMod);
      });

      scene.updateModifiers(true);

      return true;
    })
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.1.label`,
          buttonTooltip: `${namespace}.option.1.tooltip`,
          selected: [
            {
              text: `${namespace}.option.1.selected`,
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Pick battle
          const encounter = scene.currentBattle.mysteryEncounter!;

          // Provides 1x Reviver Seed to each party member at end of battle
          const revSeed = generateModifierType(scene, modifierTypes.REVIVER_SEED);
          const givePartyPokemonReviverSeeds = () => {
            const party = scene.getParty();
            party.forEach(p => {
              if (revSeed) {
                const seedModifier = revSeed.newModifier(p);
                if (seedModifier) {
                  encounter.setDialogueToken("foodReward", seedModifier.type.name);
                }
                scene.addModifier(seedModifier, false, false, false, true);
              }
            });
            queueEncounterMessage(scene, `${namespace}.option.1.food_stash`);
          };

          setEncounterRewards(scene, { fillRemaining: true }, undefined, givePartyPokemonReviverSeeds);
          encounter.startOfBattleEffects.push({
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.ENEMY],
            move: new PokemonMove(Moves.STUFF_CHEEKS),
            ignorePp: true
          });

          transitionMysteryEncounterIntroVisuals(scene, true, true, 500);
          await initBattleWithEnemyConfig(scene, encounter.enemyPartyConfigs[0]);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.2.label`,
          buttonTooltip: `${namespace}.option.2.tooltip`,
          selected: [
            {
              text: `${namespace}.option.2.selected`,
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const berryMap = encounter.misc.berryItemsMap;

          // Returns 2/5 of the berries stolen to each Pokemon
          const party = scene.getParty();
          party.forEach(pokemon => {
            const stolenBerries: BerryModifier[] = berryMap.get(pokemon.id);
            const berryTypesAsArray: BerryType[] = [];
            stolenBerries?.forEach(bMod => berryTypesAsArray.push(...new Array(bMod.stackCount).fill(bMod.berryType)));
            const returnedBerryCount = Math.floor((berryTypesAsArray.length ?? 0) * 2 / 5);

            if (returnedBerryCount > 0) {
              for (let i = 0; i < returnedBerryCount; i++) {
                // Shuffle remaining berry types and pop
                Phaser.Math.RND.shuffle(berryTypesAsArray);
                const randBerryType = berryTypesAsArray.pop();

                const berryModType = generateModifierType(scene, modifierTypes.BERRY, [randBerryType]) as BerryModifierType;
                applyModifierTypeToPlayerPokemon(scene, pokemon, berryModType);
              }
            }
          });
          await scene.updateModifiers(true);

          transitionMysteryEncounterIntroVisuals(scene, true, true, 500);
          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.3.label`,
          buttonTooltip: `${namespace}.option.3.tooltip`,
          selected: [
            {
              text: `${namespace}.option.3.selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene) => {
          // Animate berries being eaten
          doGreedentEatBerries(scene);
          doBerrySpritePile(scene, true);
          return true;
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Let it have the food
          // Greedent joins the team, level equal to 2 below highest party member
          const level = getHighestLevelPlayerPokemon(scene, false, true).level - 2;
          const greedent = new EnemyPokemon(scene, getPokemonSpecies(Species.GREEDENT), level, TrainerSlot.NONE, false);
          greedent.moveset = [new PokemonMove(Moves.THRASH), new PokemonMove(Moves.BODY_PRESS), new PokemonMove(Moves.STUFF_CHEEKS), new PokemonMove(Moves.SLACK_OFF)];
          greedent.passive = true;

          transitionMysteryEncounterIntroVisuals(scene, true, true, 500);
          await catchPokemon(scene, greedent, null, PokeballType.POKEBALL, false);
          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .build();

function doGreedentSpriteSteal(scene: BattleScene) {
  const shakeDelay = 50;
  const slideDelay = 500;

  const greedentSprites = scene.currentBattle.mysteryEncounter!.introVisuals?.getSpriteAtIndex(1);

  scene.playSound("battle_anims/Follow Me");
  scene.tweens.chain({
    targets: greedentSprites,
    tweens: [
      { // Slide Greedent diagonally
        duration: slideDelay,
        ease: "Cubic.easeOut",
        y: "+=75",
        x: "-=65",
        scale: 1.1
      },
      { // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      { // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      { // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      { // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      { // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      { // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      { // Slide Greedent diagonally
        duration: slideDelay,
        ease: "Cubic.easeOut",
        y: "-=75",
        x: "+=65",
        scale: 1
      },
      { // Bounce at the end
        duration: 300,
        ease: "Cubic.easeOut",
        yoyo: true,
        y: "-=20",
        loop: 1,
      }
    ]
  });
}

function doGreedentEatBerries(scene: BattleScene) {
  const greedentSprites = scene.currentBattle.mysteryEncounter!.introVisuals?.getSpriteAtIndex(1);
  let index = 1;
  scene.tweens.add({
    targets: greedentSprites,
    duration: 150,
    ease: "Cubic.easeOut",
    yoyo: true,
    y: "-=8",
    loop: 5,
    onStart: () => {
      scene.playSound("battle_anims/PRSFX- Bug Bite");
    },
    onLoop: () => {
      if (index % 2 === 0) {
        scene.playSound("battle_anims/PRSFX- Bug Bite");
      }
      index++;
    }
  });
}

/**
 *
 * @param scene
 * @param isEat Default false. Will "create" pile when false, and remove pile when true.
 */
function doBerrySpritePile(scene: BattleScene, isEat: boolean = false) {
  const berryAddDelay = 150;
  let animationOrder = ["starf", "sitrus", "lansat", "salac", "apicot", "enigma", "liechi", "ganlon", "lum", "petaya", "leppa"];
  if (isEat) {
    animationOrder = animationOrder.reverse();
  }
  const encounter = scene.currentBattle.mysteryEncounter!;
  animationOrder.forEach((berry, i) => {
    const introVisualsIndex = encounter.spriteConfigs.findIndex(config => config.spriteKey?.includes(berry));
    let sprite: Phaser.GameObjects.Sprite, tintSprite: Phaser.GameObjects.Sprite;
    const sprites = encounter.introVisuals?.getSpriteAtIndex(introVisualsIndex);
    if (sprites) {
      sprite = sprites[0];
      tintSprite = sprites[1];
    }
    scene.time.delayedCall(berryAddDelay * i + 400, () => {
      if (sprite) {
        sprite.setVisible(!isEat);
      }
      if (tintSprite) {
        tintSprite.setVisible(!isEat);
      }

      // Animate Petaya berry falling off the pile
      if (berry === "petaya" && sprite && tintSprite && !isEat) {
        scene.time.delayedCall(200, () => {
          doBerryBounce(scene, [sprite, tintSprite], 30, 500);
        });
      }
    });
  });
}

function doBerryBounce(scene: BattleScene, berrySprites: Phaser.GameObjects.Sprite[], yd: number, baseBounceDuration: number) {
  let bouncePower = 1;
  let bounceYOffset = yd;

  const doBounce = () => {
    scene.tweens.add({
      targets: berrySprites,
      y: "+=" + bounceYOffset,
      x: { value: "+=" + (bouncePower * bouncePower * 10), ease: "Linear" },
      duration: bouncePower * baseBounceDuration,
      ease: "Cubic.easeIn",
      onComplete: () => {
        bouncePower = bouncePower > 0.01 ? bouncePower * 0.5 : 0;

        if (bouncePower) {
          bounceYOffset = bounceYOffset * bouncePower;

          scene.tweens.add({
            targets: berrySprites,
            y: "-=" + bounceYOffset,
            x: { value: "+=" + (bouncePower * bouncePower * 10), ease: "Linear" },
            duration: bouncePower * baseBounceDuration,
            ease: "Cubic.easeOut",
            onComplete: () => doBounce()
          });
        }
      }
    });
  };

  doBounce();
}
