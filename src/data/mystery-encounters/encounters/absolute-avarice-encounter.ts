import { globalScene } from "#app/global-scene";
import { modifierTypes } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { BerryType } from "#enums/berry-type";
import { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TrainerSlot } from "#enums/trainer-slot";
import type { Pokemon } from "#field/pokemon";
import { EnemyPokemon } from "#field/pokemon";
import { BerryModifier, PokemonInstantReviveModifier } from "#modifiers/modifier";
import type { BerryModifierType, PokemonHeldItemModifierType } from "#modifiers/modifier-type";
import { PokemonMove } from "#moves/pokemon-move";
import { queueEncounterMessage } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  generateModifierType,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#mystery-encounters/encounter-phase-utils";
import {
  applyModifierTypeToPlayerPokemon,
  catchPokemon,
  getHighestLevelPlayerPokemon,
} from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { PersistentModifierRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import type { HeldModifierConfig } from "#types/held-modifier-config";
import { randInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/absoluteAvarice";

/**
 * Absolute Avarice encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3805 | GitHub Issue #3805}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const AbsoluteAvariceEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.ABSOLUTE_AVARICE,
)
  .withEncounterTier(MysteryEncounterTier.GREAT)
  .withSceneWaveRangeRequirement(20, 180)
  .withSceneRequirement(new PersistentModifierRequirement("BerryModifier", 6)) // Must have at least 6 berries to spawn
  .withFleeAllowed(false)
  .withIntroSpriteConfigs([
    {
      // This sprite has the shadow
      spriteKey: "",
      fileRoot: "",
      species: SpeciesId.GREEDENT,
      hasShadow: true,
      alpha: 0.001,
      repeat: true,
      x: -5,
    },
    {
      spriteKey: "",
      fileRoot: "",
      species: SpeciesId.GREEDENT,
      hasShadow: false,
      repeat: true,
      x: -5,
    },
    {
      spriteKey: "lum_berry",
      fileRoot: "items",
      isItem: true,
      x: 7,
      y: -14,
      hidden: true,
      disableAnimation: true,
    },
    {
      spriteKey: "salac_berry",
      fileRoot: "items",
      isItem: true,
      x: 2,
      y: 4,
      hidden: true,
      disableAnimation: true,
    },
    {
      spriteKey: "lansat_berry",
      fileRoot: "items",
      isItem: true,
      x: 32,
      y: 5,
      hidden: true,
      disableAnimation: true,
    },
    {
      spriteKey: "liechi_berry",
      fileRoot: "items",
      isItem: true,
      x: 6,
      y: -5,
      hidden: true,
      disableAnimation: true,
    },
    {
      spriteKey: "sitrus_berry",
      fileRoot: "items",
      isItem: true,
      x: 7,
      y: 8,
      hidden: true,
      disableAnimation: true,
    },
    {
      spriteKey: "enigma_berry",
      fileRoot: "items",
      isItem: true,
      x: 26,
      y: -4,
      hidden: true,
      disableAnimation: true,
    },
    {
      spriteKey: "leppa_berry",
      fileRoot: "items",
      isItem: true,
      x: 16,
      y: -27,
      hidden: true,
      disableAnimation: true,
    },
    {
      spriteKey: "petaya_berry",
      fileRoot: "items",
      isItem: true,
      x: 30,
      y: -17,
      hidden: true,
      disableAnimation: true,
    },
    {
      spriteKey: "ganlon_berry",
      fileRoot: "items",
      isItem: true,
      x: 16,
      y: -11,
      hidden: true,
      disableAnimation: true,
    },
    {
      spriteKey: "apicot_berry",
      fileRoot: "items",
      isItem: true,
      x: 14,
      y: -2,
      hidden: true,
      disableAnimation: true,
    },
    {
      spriteKey: "starf_berry",
      fileRoot: "items",
      isItem: true,
      x: 18,
      y: 9,
      hidden: true,
      disableAnimation: true,
    },
  ])
  .withHideWildIntroMessage(true)
  .withAutoHideIntroVisuals(false)
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    globalScene.loadSe("PRSFX- Bug Bite", "battle_anims", "PRSFX- Bug Bite.wav");
    globalScene.loadSe("Follow Me", "battle_anims", "Follow Me.mp3");

    // Get all player berry items, remove from party, and store reference
    const berryItems = globalScene.findModifiers(m => m instanceof BerryModifier) as BerryModifier[];

    // Sort berries by party member ID to more easily re-add later if necessary
    const berryItemsMap = new Map<number, BerryModifier[]>();
    globalScene.getPlayerParty().forEach(pokemon => {
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
        const modifierType = generateModifierType(modifierTypes.BERRY, [
          berryMod.berryType,
        ]) as PokemonHeldItemModifierType;
        bossModifierConfigs.push({ modifier: modifierType });
      }
    });

    // Do NOT remove the real berries yet or else it will be persisted in the session data

    // +1 SpDef below wave 50, SpDef and Speed otherwise
    const statChangesForBattle: (Stat.ATK | Stat.DEF | Stat.SPATK | Stat.SPDEF | Stat.SPD | Stat.ACC | Stat.EVA)[] =
      globalScene.currentBattle.waveIndex < 50 ? [Stat.SPDEF] : [Stat.SPDEF, Stat.SPD];

    // Calculate boss mon
    const config: EnemyPartyConfig = {
      levelAdditiveModifier: 1,
      pokemonConfigs: [
        {
          species: getPokemonSpecies(SpeciesId.GREEDENT),
          isBoss: true,
          bossSegments: 3,
          shiny: false, // Shiny lock because of consistency issues between the different options
          moveSet: [MoveId.THRASH, MoveId.CRUNCH, MoveId.BODY_PRESS, MoveId.SLACK_OFF],
          modifierConfigs: bossModifierConfigs,
          tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
          mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
            queueEncounterMessage(`${namespace}:option.1.bossEnraged`);
            globalScene.phaseManager.unshiftNew(
              "StatStageChangePhase",
              pokemon.getBattlerIndex(),
              true,
              statChangesForBattle,
              1,
            );
          },
        },
      ],
    };

    encounter.enemyPartyConfigs = [config];
    encounter.setDialogueToken("greedentName", getPokemonSpecies(SpeciesId.GREEDENT).getName());

    return true;
  })
  .withOnVisualsStart(() => {
    doGreedentSpriteSteal();
    doBerrySpritePile();

    // Remove the berries from the party
    // Session has been safely saved at this point, so data won't be lost
    const berryItems = globalScene.findModifiers(m => m instanceof BerryModifier) as BerryModifier[];
    berryItems.forEach(berryMod => {
      globalScene.removeModifier(berryMod);
    });

    globalScene.updateModifiers(true);

    return true;
  })
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      })
      .withOptionPhase(async () => {
        // Pick battle
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        // Provides 1x Reviver Seed to each party member at end of battle
        const revSeed = generateModifierType(modifierTypes.REVIVER_SEED);
        encounter.setDialogueToken(
          "foodReward",
          revSeed?.name ?? i18next.t("modifierType:ModifierType.REVIVER_SEED.name"),
        );
        const givePartyPokemonReviverSeeds = () => {
          const party = globalScene.getPlayerParty();
          party.forEach(p => {
            const heldItems = p.getHeldItems();
            if (revSeed && !heldItems.some(item => item instanceof PokemonInstantReviveModifier)) {
              const seedModifier = revSeed.newModifier(p);
              globalScene.addModifier(seedModifier, false, false, false, true);
            }
          });
          queueEncounterMessage(`${namespace}:option.1.foodStash`);
        };

        setEncounterRewards({ fillRemaining: true }, undefined, givePartyPokemonReviverSeeds);
        encounter.startOfBattleEffects.push({
          sourceBattlerIndex: BattlerIndex.ENEMY,
          targets: [BattlerIndex.ENEMY],
          move: new PokemonMove(MoveId.STUFF_CHEEKS),
          useMode: MoveUseMode.IGNORE_PP,
        });

        await transitionMysteryEncounterIntroVisuals(true, true, 500);
        await initBattleWithEnemyConfig(encounter.enemyPartyConfigs[0]);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const berryMap = encounter.misc.berryItemsMap;

        // Returns 2/5 of the berries stolen to each Pokemon
        const party = globalScene.getPlayerParty();
        party.forEach(pokemon => {
          const stolenBerries: BerryModifier[] = berryMap.get(pokemon.id);
          const berryTypesAsArray: BerryType[] = [];
          stolenBerries?.forEach(bMod => berryTypesAsArray.push(...new Array(bMod.stackCount).fill(bMod.berryType)));
          const returnedBerryCount = Math.floor(((berryTypesAsArray.length ?? 0) * 2) / 5);

          if (returnedBerryCount > 0) {
            for (let i = 0; i < returnedBerryCount; i++) {
              // Shuffle remaining berry types and pop
              Phaser.Math.RND.shuffle(berryTypesAsArray);
              const randBerryType = berryTypesAsArray.pop();

              const berryModType = generateModifierType(modifierTypes.BERRY, [randBerryType]) as BerryModifierType;
              applyModifierTypeToPlayerPokemon(pokemon, berryModType);
            }
          }
        });
        await globalScene.updateModifiers(true);

        await transitionMysteryEncounterIntroVisuals(true, true, 500);
        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        // Animate berries being eaten
        doGreedentEatBerries();
        doBerrySpritePile(true);
        return true;
      })
      .withOptionPhase(async () => {
        // Let it have the food
        // Greedent joins the team, level equal to 2 below highest party member (shiny locked)
        const level = getHighestLevelPlayerPokemon(false, true).level - 2;
        const greedent = new EnemyPokemon(getPokemonSpecies(SpeciesId.GREEDENT), level, TrainerSlot.NONE, false, true);
        greedent.moveset = [
          new PokemonMove(MoveId.THRASH),
          new PokemonMove(MoveId.BODY_PRESS),
          new PokemonMove(MoveId.STUFF_CHEEKS),
          new PokemonMove(MoveId.SLACK_OFF),
        ];
        greedent.passive = true;

        await transitionMysteryEncounterIntroVisuals(true, true, 500);
        await catchPokemon(greedent, null, PokeballType.POKEBALL, false);
        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .build();

function doGreedentSpriteSteal() {
  const shakeDelay = 50;
  const slideDelay = 500;

  const greedentSprites = globalScene.currentBattle.mysteryEncounter!.introVisuals?.getSpriteAtIndex(1);

  globalScene.playSound("battle_anims/Follow Me");
  globalScene.tweens.chain({
    targets: greedentSprites,
    tweens: [
      {
        // Slide Greedent diagonally
        duration: slideDelay,
        ease: "Cubic.easeOut",
        y: "+=75",
        x: "-=65",
        scale: 1.1,
      },
      {
        // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      {
        // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      {
        // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      {
        // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      {
        // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      {
        // Shake
        duration: shakeDelay,
        ease: "Cubic.easeOut",
        yoyo: true,
        x: (randInt(2) > 0 ? "-=" : "+=") + 5,
        y: (randInt(2) > 0 ? "-=" : "+=") + 5,
      },
      {
        // Slide Greedent diagonally
        duration: slideDelay,
        ease: "Cubic.easeOut",
        y: "-=75",
        x: "+=65",
        scale: 1,
      },
      {
        // Bounce at the end
        duration: 300,
        ease: "Cubic.easeOut",
        yoyo: true,
        y: "-=20",
        loop: 1,
      },
    ],
  });
}

function doGreedentEatBerries() {
  const greedentSprites = globalScene.currentBattle.mysteryEncounter!.introVisuals?.getSpriteAtIndex(1);
  let index = 1;
  globalScene.tweens.add({
    targets: greedentSprites,
    duration: 150,
    ease: "Cubic.easeOut",
    yoyo: true,
    y: "-=8",
    loop: 5,
    onStart: () => {
      globalScene.playSound("battle_anims/PRSFX- Bug Bite");
    },
    onLoop: () => {
      if (index % 2 === 0) {
        globalScene.playSound("battle_anims/PRSFX- Bug Bite");
      }
      index++;
    },
  });
}

/**
 * @param isEat Default false. Will "create" pile when false, and remove pile when true.
 */
function doBerrySpritePile(isEat = false) {
  const berryAddDelay = 150;
  let animationOrder = [
    "starf",
    "sitrus",
    "lansat",
    "salac",
    "apicot",
    "enigma",
    "liechi",
    "ganlon",
    "lum",
    "petaya",
    "leppa",
  ];
  if (isEat) {
    animationOrder = animationOrder.reverse();
  }
  const encounter = globalScene.currentBattle.mysteryEncounter!;
  animationOrder.forEach((berry, i) => {
    const introVisualsIndex = encounter.spriteConfigs.findIndex(config => config.spriteKey?.includes(berry));
    let sprite: Phaser.GameObjects.Sprite;
    let tintSprite: Phaser.GameObjects.Sprite;
    const sprites = encounter.introVisuals?.getSpriteAtIndex(introVisualsIndex);
    if (sprites) {
      sprite = sprites[0];
      tintSprite = sprites[1];
    }
    globalScene.time.delayedCall(berryAddDelay * i + 400, () => {
      if (sprite) {
        sprite.setVisible(!isEat);
      }
      if (tintSprite) {
        tintSprite.setVisible(!isEat);
      }

      // Animate Petaya berry falling off the pile
      if (berry === "petaya" && sprite && tintSprite && !isEat) {
        globalScene.time.delayedCall(200, () => {
          doBerryBounce([sprite, tintSprite], 30, 500);
        });
      }
    });
  });
}

function doBerryBounce(berrySprites: Phaser.GameObjects.Sprite[], yd: number, baseBounceDuration: number) {
  let bouncePower = 1;
  let bounceYOffset = yd;

  const doBounce = () => {
    globalScene.tweens.add({
      targets: berrySprites,
      y: "+=" + bounceYOffset,
      x: { value: "+=" + bouncePower * bouncePower * 10, ease: "Linear" },
      duration: bouncePower * baseBounceDuration,
      ease: "Cubic.easeIn",
      onComplete: () => {
        bouncePower = bouncePower > 0.01 ? bouncePower * 0.5 : 0;

        if (bouncePower) {
          bounceYOffset = bounceYOffset * bouncePower;

          globalScene.tweens.add({
            targets: berrySprites,
            y: "-=" + bounceYOffset,
            x: { value: "+=" + bouncePower * bouncePower * 10, ease: "Linear" },
            duration: bouncePower * baseBounceDuration,
            ease: "Cubic.easeOut",
            onComplete: () => doBounce(),
          });
        }
      },
    });
  };

  doBounce();
}
