import { globalScene } from "#app/global-scene";
import { allHeldItems } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TrainerSlot } from "#enums/trainer-slot";
import type { MysteryEncounterSpriteConfig } from "#field/mystery-encounter-intro";
import type { Pokemon } from "#field/pokemon";
import { EnemyPokemon } from "#field/pokemon";
import { getPartyBerries } from "#items/item-utility";
import { PokemonMove } from "#moves/pokemon-move";
import { queueEncounterMessage } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#mystery-encounters/encounter-phase-utils";
import { catchPokemon, getHighestLevelPlayerPokemon } from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { HeldItemRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import type { HeldItemConfiguration, HeldItemSpecs, PokemonItemMap } from "#types/held-item-data-types";
import { pickWeightedIndex, randInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/absoluteAvarice";

function berrySprite(spriteKey: string, x: number, y: number): MysteryEncounterSpriteConfig {
  return {
    spriteKey: spriteKey,
    fileRoot: "items",
    isItem: true,
    x: x,
    y: y,
    hidden: true,
    disableAnimation: true,
  };
}

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
  .withSceneRequirement(new HeldItemRequirement(HeldItemCategoryId.BERRY, 6)) // Must have at least 6 berries to spawn
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
    berrySprite("lum_berry", 7, -14),
    berrySprite("salac_berry", 2, 4),
    berrySprite("lansat_berry", 32, 5),
    berrySprite("liechi_berry", 6, -5),
    berrySprite("sitrus_berry", 7, 8),
    berrySprite("enigma_berry", 26, -4),
    berrySprite("leppa_berry", 16, -27),
    berrySprite("petaya_berry", 30, -17),
    berrySprite("ganlon_berry", 16, -11),
    berrySprite("apicot_berry", 14, -2),
    berrySprite("starf_berry", 18, 9),
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

    // Get all berries in party, with references to the pokemon
    const berryItems = getPartyBerries();

    encounter.misc = { berryItemsMap: berryItems };

    // Adds stolen berries to the Greedent item configuration
    const bossHeldItemConfig: HeldItemConfiguration = [];
    berryItems.forEach(map => {
      bossHeldItemConfig.push({ entry: map.item, count: 1 });
    });

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
          heldItemConfig: bossHeldItemConfig,
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
    const berryItems = getPartyBerries();
    berryItems.forEach(map => {
      globalScene.getPokemonById(map.pokemonId)?.heldItemManager.remove(map.item.id as HeldItemId);
    });

    globalScene.updateItems(true);

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
        encounter.setDialogueToken(
          "foodReward",
          allHeldItems[HeldItemId.REVIVER_SEED].name ?? i18next.t("modifierType:ModifierType.REVIVER_SEED.name"),
        );
        const givePartyPokemonReviverSeeds = () => {
          const party = globalScene.getPlayerParty();
          party.forEach(p => {
            p.heldItemManager.add(HeldItemId.REVIVER_SEED);
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
        const berryMap = encounter.misc.berryItemsMap as PokemonItemMap[];

        // Returns 2/5 of the berries stolen to each Pokemon
        const party = globalScene.getPlayerParty();
        party.forEach(pokemon => {
          const stolenBerries = berryMap.filter(map => map.pokemonId === pokemon.id);
          const stolenBerryCount = stolenBerries.reduce((a, b) => a + (b.item as HeldItemSpecs).stack, 0);
          const returnedBerryCount = Math.floor(((stolenBerryCount ?? 0) * 2) / 5);

          if (returnedBerryCount > 0) {
            for (let i = 0; i < returnedBerryCount; i++) {
              // Shuffle remaining berry types and pop
              const berryWeights = stolenBerries.map(b => (b.item as HeldItemSpecs).stack);
              const which = pickWeightedIndex(berryWeights) ?? 0;
              const randBerry = stolenBerries[which];
              pokemon.heldItemManager.add(randBerry.item.id as HeldItemId);
              (randBerry.item as HeldItemSpecs).stack -= 1;
            }
          }
        });
        await globalScene.updateItems(true);

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
    let sprite: Phaser.GameObjects.Sprite, tintSprite: Phaser.GameObjects.Sprite;
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
