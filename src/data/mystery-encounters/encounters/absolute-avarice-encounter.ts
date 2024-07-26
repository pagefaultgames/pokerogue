import { EnemyPartyConfig, generateModifierTypeOption, leaveEncounterWithoutBattle, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import Pokemon from "#app/field/pokemon";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "#app/battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { MoneyRequirement, PersistentModifierRequirement } from "../mystery-encounter-requirements";
import { queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { BerryModifier } from "#app/modifier/modifier";
import { ModifierRewardPhase, StatChangePhase } from "#app/phases";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Moves } from "#enums/moves";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BattleStat } from "#app/data/battle-stat";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounter:absoluteAvarice";

/**
 * Delibird-y encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/58 | GitHub Issue #58}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const AbsoluteAvariceEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.ABSOLUTE_AVARICE)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(10, 180)
    .withSceneRequirement(new PersistentModifierRequirement(BerryModifier.name, 4)) // Must have at least 4 berries to spawn
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.GREEDENT.toString(),
        fileRoot: "pokemon",
        hasShadow: false,
        repeat: true,
        x: -5
      },
      {
        // This sprite has the shadow
        spriteKey: Species.GREEDENT.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        alpha: 0.001,
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
        spriteKey: "petaya_berry",
        fileRoot: "items",
        isItem: true,
        x: 20,
        y: -17,
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
      },      {
        spriteKey: "starf_berry",
        fileRoot: "items",
        isItem: true,
        x: 18,
        y: 9,
        hidden: true,
        disableAnimation: true
      },
    ])
    .withOnVisualsStart((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      const greedentSprites = encounter.introVisuals.getSpriteAtIndex(0);

      scene.playSound("Follow Me");

      // scene.tweens.add({
      //   targets: greedentSprites,
      //   duration: 600,
      //   ease: "Cubic.easeOut",
      //   yoyo: true,
      //   y: "+=50",
      //   x: "-=60",
      //   scale: 1.2,
      //   onComplete: () => {
      //     // Bounce the Greedent
      //     scene.tweens.add({
      //       targets: greedentSprites,
      //       duration: 300,
      //       ease: "Cubic.easeOut",
      //       yoyo: true,
      //       y: "-=20",
      //       loop: 1,
      //     });
      //   }
      // });

      // Slide left
      scene.tweens.add({
        targets: greedentSprites,
        duration: 500,
        ease: "Cubic.easeOut",
        x: "-=300",
        onComplete: () => {
          // Slide back right, lower
          greedentSprites[0].y += 80;
          greedentSprites[1].y += 80;
          scene.tweens.add({
            targets: greedentSprites,
            duration: 300,
            ease: "Cubic.easeOut",
            yoyo: true,
            x: "+=140",
            onComplete: () => {
              // Slide back right, higher
              greedentSprites[0].y -= 80;
              greedentSprites[1].y -= 80;
              scene.tweens.add({
                targets: greedentSprites,
                duration: 500,
                ease: "Cubic.easeOut",
                x: "+=300",
                onComplete: () => {
                  // Bounce the Greedent
                  scene.tweens.add({
                    targets: greedentSprites,
                    duration: 300,
                    ease: "Cubic.easeOut",
                    yoyo: true,
                    y: "-=20",
                    loop: 1,
                  });
                }
              });
            }
          });
        }
      });

      const berryAddDelay = 200;

      const animationOrder = ["starf", "sitrus", "lansat", "salac", "apicot", "enigma", "liechi", "ganlon", "lum", "petaya", "leppa"];

      animationOrder.forEach((berry, i) => {
        const introVisualsIndex = encounter.spriteConfigs.findIndex(config => config.spriteKey.includes(berry));
        const [ sprite, tintSprite ] = encounter.introVisuals.getSpriteAtIndex(introVisualsIndex);
        // const [ sprite, tintSprite ] = [berrySprites[i * 2], berrySprites[i * 2 + 1]];
        scene.time.delayedCall(berryAddDelay * i + 300, () => {
          if (sprite) {
            sprite.setVisible(true);
          }
          if (tintSprite) {
            tintSprite.setVisible(true);
          }
        });
      });

      return true;
    })
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      }
    ])
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOutroDialogue([
      {
        text: `${namespace}:outro`,
      }
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      scene.loadSe("Follow Me", "battle_anims", "Follow Me.mp3");
      // scene.loadSe("Follow Me", "battle_anims");

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
      const bossModifierTypes: PokemonHeldItemModifierType[] = [];
      berryItems.forEach(berryMod => {
        // Can't define stack count on a ModifierType, have to just create separate instances for each stack
        // Overflow berries will be "lost" on the boss, but it's un-catchable anyway
        for (let i = 0; i < berryMod.stackCount; i++) {
          const modifierType = generateModifierTypeOption(scene, modifierTypes.BERRY, [berryMod.berryType]).type as PokemonHeldItemModifierType;
          bossModifierTypes.push(modifierType);
        }

        scene.removeModifier(berryMod);
      });

      // Calculate boss mon
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 1,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.GREEDENT),
            isBoss: true,
            bossSegments: 5,
            // nature: Nature.BOLD,
            moveSet: [Moves.THRASH, Moves.BODY_PRESS, Moves.STUFF_CHEEKS, Moves.SLACK_OFF],
            modifierTypes: bossModifierTypes,
            tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
            mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
              queueEncounterMessage(pokemon.scene, `${namespace}:option:2:stat_boost`);
              pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD], 1));
            }
          }
        ],
      };

      encounter.enemyPartyConfigs = [config];

      return true;
    })
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option:1:label`,
          buttonTooltip: `${namespace}:option:1:tooltip`,
          selected: [
            {
              text: `${namespace}:option:1:selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter;
          updatePlayerMoney(scene, -(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney, true, false);
          return true;
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Give the player an Ability Charm
          scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.ABILITY_CHARM));
          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option:2:label`,
          buttonTooltip: `${namespace}:option:2:tooltip`,
          secondOptionPrompt: `${namespace}:option:2:select_prompt`,
          selected: [
            {
              text: `${namespace}:option:2:selected`,
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter;
          const modifier = encounter.misc.chosenModifier;
          // Give the player a Candy Jar if they gave a Berry, and a Healing Charm for Reviver Seed
          if (modifier.type.name.includes("Berry")) {
            scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.CANDY_JAR));
          } else {
            scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.HEALING_CHARM));
          }

          // Remove the modifier if its stacks go to 0
          modifier.stackCount -= 1;
          if (modifier.stackCount === 0) {
            scene.removeModifier(modifier);
          }

          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option:3:label`,
          buttonTooltip: `${namespace}:option:3:tooltip`,
          secondOptionPrompt: `${namespace}:option:3:select_prompt`,
          selected: [
            {
              text: `${namespace}:option:3:selected`,
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter;
          const modifier = encounter.misc.chosenModifier;
          // Give the player a Berry Pouch
          scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.BERRY_POUCH));

          // Remove the modifier if its stacks go to 0
          modifier.stackCount -= 1;
          if (modifier.stackCount === 0) {
            scene.removeModifier(modifier);
          }

          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .build();
