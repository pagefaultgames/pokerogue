import { leaveEncounterWithoutBattle, selectPokemonForOption, setEncounterRewards, transitionMysteryEncounterIntroVisuals, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { TrainerSlot } from "#app/data/trainer-config";
import Pokemon, { FieldPosition, PlayerPokemon } from "#app/field/pokemon";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { MoneyRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { Species } from "#enums/species";
import i18next from "i18next";
import { getPokemonNameWithAffix } from "#app/messages";
import { PlayerGender } from "#enums/player-gender";
import { getPokeballAtlasKey, getPokeballTintColor } from "#app/data/pokeball";
import { addPokeballOpenParticles } from "#app/field/anims";
import { ShinySparklePhase } from "#app/phases/shiny-sparkle-phase";
import { SpeciesFormChangeActiveTrigger } from "#app/data/pokemon-forms";
import { PostSummonPhase } from "#app/phases/post-summon-phase";
import { modifierTypes } from "#app/modifier/modifier-type";
import { Nature } from "#enums/nature";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";
import { isPokemonValidForEncounterOptionSelection } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:funAndGames";

/**
 * Fun and Games! encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3819 | GitHub Issue #3819}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const FunAndGamesEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.FUN_AND_GAMES)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withSceneRequirement(new MoneyRequirement(0, 1.5)) // Cost equal to 1 Max Potion to play
    .withAutoHideIntroVisuals(false)
    // Allows using move without a visible enemy pokemon
    .withBattleAnimationsWithoutTargets(true)
    // The Wobbuffet won't use moves
    .withSkipEnemyBattleTurns(true)
    // Will skip COMMAND selection menu and go straight to FIGHT (move select) menu
    .withSkipToFightInput(true)
    .withFleeAllowed(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "fun_and_games_game",
        fileRoot: "mystery-encounters",
        hasShadow: false,
        x: 0,
        y: 6,
      },
      {
        spriteKey: "fun_and_games_wobbuffet",
        fileRoot: "mystery-encounters",
        hasShadow: true,
        x: -28,
        y: 6,
        yShadow: 6
      },
      {
        spriteKey: "fun_and_games_man",
        fileRoot: "mystery-encounters",
        hasShadow: true,
        x: 40,
        y: 6,
        yShadow: 6
      },
    ])
    .withIntroDialogue([
      {
        speaker: `${namespace}.speaker`,
        text: `${namespace}.intro_dialogue`,
      },
    ])
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;
      scene.loadBgm("mystery_encounter_fun_and_games", "mystery_encounter_fun_and_games.mp3");
      encounter.setDialogueToken("wobbuffetName", getPokemonSpecies(Species.WOBBUFFET).getName());
      return true;
    })
    .withOnVisualsStart((scene: BattleScene) => {
      scene.fadeAndSwitchBgm("mystery_encounter_fun_and_games");
      return true;
    })
    .withOption(MysteryEncounterOptionBuilder
      .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withSceneRequirement(new MoneyRequirement(0, 1.5)) // Cost equal to 1 Max Potion
      .withDialogue({
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            text: `${namespace}.option.1.selected`,
          },
        ],
      })
      .withPreOptionPhase(async (scene: BattleScene) => {
        // Select Pokemon for minigame
        const encounter = scene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          encounter.misc = {
            playerPokemon: pokemon,
          };
        };

        // Only Pokemon that are not KOed/legal can be selected
        const selectableFilter = (pokemon: Pokemon) => {
          return isPokemonValidForEncounterOptionSelection(pokemon, scene, `${namespace}.invalid_selection`);
        };

        return selectPokemonForOption(scene, onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async (scene: BattleScene) => {
        // Start minigame
        const encounter = scene.currentBattle.mysteryEncounter!;
        encounter.misc.turnsRemaining = 3;

        // Update money
        const moneyCost = (encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney;
        updatePlayerMoney(scene, -moneyCost, true, false);
        await showEncounterText(scene, i18next.t("mysteryEncounterMessages:paid_money", { amount: moneyCost }));

        // Handlers for battle events
        encounter.onTurnStart = handleNextTurn; // triggered during TurnInitPhase
        encounter.doContinueEncounter = handleLoseMinigame; // triggered during MysteryEncounterRewardsPhase, post VictoryPhase if the player KOs Wobbuffet

        hideShowmanIntroSprite(scene);
        await summonPlayerPokemon(scene);
        await showWobbuffetHealthBar(scene);

        return true;
      })
      .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        selected: [
          {
            text: `${namespace}.option.2.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        transitionMysteryEncounterIntroVisuals(scene, true, true);
        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .build();

async function summonPlayerPokemon(scene: BattleScene) {
  return new Promise<void>(async resolve => {
    const encounter = scene.currentBattle.mysteryEncounter!;

    const playerPokemon = encounter.misc.playerPokemon;
    // Swaps the chosen Pokemon and the first player's lead Pokemon in the party
    const party = scene.getParty();
    const chosenIndex = party.indexOf(playerPokemon);
    if (chosenIndex !== 0) {
      const leadPokemon = party[0];
      party[0] = playerPokemon;
      party[chosenIndex] = leadPokemon;
    }

    // Do trainer summon animation
    let playerAnimationPromise: Promise<void> | undefined;
    scene.ui.showText(i18next.t("battle:playerGo", { pokemonName: getPokemonNameWithAffix(playerPokemon) }));
    scene.pbTray.hide();
    scene.trainer.setTexture(`trainer_${scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
    scene.time.delayedCall(562, () => {
      scene.trainer.setFrame("2");
      scene.time.delayedCall(64, () => {
        scene.trainer.setFrame("3");
      });
    });
    scene.tweens.add({
      targets: scene.trainer,
      x: -36,
      duration: 1000,
      onComplete: () => scene.trainer.setVisible(false)
    });
    scene.time.delayedCall(750, () => {
      playerAnimationPromise = summonPlayerPokemonAnimation(scene, playerPokemon);
    });

    // Also loads Wobbuffet data
    const enemySpecies = getPokemonSpecies(Species.WOBBUFFET);
    scene.currentBattle.enemyParty = [];
    const wobbuffet = scene.addEnemyPokemon(enemySpecies, encounter.misc.playerPokemon.level, TrainerSlot.NONE, false);
    wobbuffet.ivs = [0, 0, 0, 0, 0, 0];
    wobbuffet.setNature(Nature.MILD);
    wobbuffet.setAlpha(0);
    wobbuffet.setVisible(false);
    wobbuffet.calculateStats();
    scene.currentBattle.enemyParty[0] = wobbuffet;
    scene.gameData.setPokemonSeen(wobbuffet, true);
    await wobbuffet.loadAssets();
    const id = setInterval(checkPlayerAnimationPromise, 500);
    async function checkPlayerAnimationPromise() {
      if (playerAnimationPromise) {
        clearInterval(id);
        await playerAnimationPromise;
        resolve();
      }
    }
  });
}

function handleLoseMinigame(scene: BattleScene) {
  return new Promise<void>(async resolve => {
    // Check Wobbuffet is still alive
    const wobbuffet = scene.getEnemyPokemon();
    if (!wobbuffet || wobbuffet.isFainted(true) || wobbuffet.hp === 0) {
      // Player loses
      // End the battle
      if (wobbuffet) {
        wobbuffet.hideInfo();
        scene.field.remove(wobbuffet);
      }
      transitionMysteryEncounterIntroVisuals(scene, true, true);
      scene.currentBattle.enemyParty = [];
      scene.currentBattle.mysteryEncounter!.doContinueEncounter = undefined;
      leaveEncounterWithoutBattle(scene, true);
      await showEncounterText(scene, `${namespace}.ko`);
      const reviveCost = scene.getWaveMoneyAmount(1.5);
      updatePlayerMoney(scene, -reviveCost, true, false);
    }

    resolve();
  });
}

function handleNextTurn(scene: BattleScene) {
  const encounter = scene.currentBattle.mysteryEncounter!;

  const wobbuffet = scene.getEnemyPokemon();
  if (!wobbuffet) {
    // Should never be triggered, just handling the edge case
    handleLoseMinigame(scene);
    return true;
  }
  if (encounter.misc.turnsRemaining <= 0) {
    // Check Wobbuffet's health for the actual result
    const healthRatio = wobbuffet.hp / wobbuffet.getMaxHp();
    let resultMessageKey: string;
    let isHealPhase = false;
    if (healthRatio < 0.03) {
      // Grand prize
      setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.MULTI_LENS], fillRemaining: false });
      resultMessageKey = `${namespace}.best_result`;
    } else if (healthRatio < 0.15) {
      // 2nd prize
      setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.SCOPE_LENS], fillRemaining: false });
      resultMessageKey = `${namespace}.great_result`;
    } else if (healthRatio < 0.33) {
      // 3rd prize
      setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.WIDE_LENS], fillRemaining: false });
      resultMessageKey = `${namespace}.good_result`;
    } else {
      // No prize
      isHealPhase = true;
      resultMessageKey = `${namespace}.bad_result`;
    }

    // End the battle
    wobbuffet.hideInfo();
    scene.field.remove(wobbuffet);
    scene.currentBattle.enemyParty = [];
    scene.currentBattle.mysteryEncounter!.doContinueEncounter = undefined;
    leaveEncounterWithoutBattle(scene, isHealPhase);
    // Must end the TurnInit phase prematurely so battle phases aren't added to queue
    queueEncounterMessage(scene, `${namespace}.end_game`);
    queueEncounterMessage(scene, resultMessageKey);

    // Skip remainder of TurnInitPhase
    return true;
  } else {
    if (encounter.misc.turnsRemaining < 3) {
      // Display charging messages on turns that aren't the initial turn
      queueEncounterMessage(scene, `${namespace}.charging_continue`);
    }
    queueEncounterMessage(scene, `${namespace}.turn_remaining_${encounter.misc.turnsRemaining}`);
    encounter.misc.turnsRemaining--;
  }

  // Don't skip remainder of TurnInitPhase
  return false;
}

async function showWobbuffetHealthBar(scene: BattleScene) {
  const wobbuffet = scene.getEnemyPokemon()!;

  scene.add.existing(wobbuffet);
  scene.field.add(wobbuffet);

  const playerPokemon = scene.getPlayerPokemon() as Pokemon;
  if (playerPokemon?.visible) {
    scene.field.moveBelow(wobbuffet, playerPokemon);
  }
  // Show health bar and trigger cry
  wobbuffet.showInfo();
  scene.time.delayedCall(1000, () => {
    wobbuffet.cry();
  });
  wobbuffet.resetSummonData();

  // Track the HP change across turns
  scene.currentBattle.mysteryEncounter!.misc.wobbuffetHealth = wobbuffet.hp;
}

function summonPlayerPokemonAnimation(scene: BattleScene, pokemon: PlayerPokemon): Promise<void> {
  return new Promise<void>(resolve => {
    const pokeball = scene.addFieldSprite(36, 80, "pb", getPokeballAtlasKey(pokemon.pokeball));
    pokeball.setVisible(false);
    pokeball.setOrigin(0.5, 0.625);
    scene.field.add(pokeball);

    pokemon.setFieldPosition(FieldPosition.CENTER, 0);

    const fpOffset = pokemon.getFieldPositionOffset();

    pokeball.setVisible(true);

    scene.tweens.add({
      targets: pokeball,
      duration: 650,
      x: 100 + fpOffset[0]
    });

    scene.tweens.add({
      targets: pokeball,
      duration: 150,
      ease: "Cubic.easeOut",
      y: 70 + fpOffset[1],
      onComplete: () => {
        scene.tweens.add({
          targets: pokeball,
          duration: 500,
          ease: "Cubic.easeIn",
          angle: 1440,
          y: 132 + fpOffset[1],
          onComplete: () => {
            scene.playSound("se/pb_rel");
            pokeball.destroy();
            scene.add.existing(pokemon);
            scene.field.add(pokemon);
            addPokeballOpenParticles(scene, pokemon.x, pokemon.y - 16, pokemon.pokeball);
            scene.updateModifiers(true);
            scene.updateFieldScale();
            pokemon.showInfo();
            pokemon.playAnim();
            pokemon.setVisible(true);
            pokemon.getSprite().setVisible(true);
            pokemon.setScale(0.5);
            pokemon.tint(getPokeballTintColor(pokemon.pokeball));
            pokemon.untint(250, "Sine.easeIn");
            scene.updateFieldScale();
            scene.tweens.add({
              targets: pokemon,
              duration: 250,
              ease: "Sine.easeIn",
              scale: pokemon.getSpriteScale(),
              onComplete: () => {
                pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
                pokemon.getSprite().clearTint();
                pokemon.resetSummonData();
                scene.time.delayedCall(1000, () => {
                  if (pokemon.isShiny()) {
                    scene.unshiftPhase(new ShinySparklePhase(scene, pokemon.getBattlerIndex()));
                  }

                  pokemon.resetTurnData();

                  scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
                  scene.pushPhase(new PostSummonPhase(scene, pokemon.getBattlerIndex()));
                  resolve();
                });
              }
            });
          }
        });
      }
    });
  });
}

function hideShowmanIntroSprite(scene: BattleScene) {
  const carnivalGame = scene.currentBattle.mysteryEncounter!.introVisuals?.getSpriteAtIndex(0)[0];
  const wobbuffet = scene.currentBattle.mysteryEncounter!.introVisuals?.getSpriteAtIndex(1)[0];
  const showMan = scene.currentBattle.mysteryEncounter!.introVisuals?.getSpriteAtIndex(2)[0];

  // Hide the showman
  scene.tweens.add({
    targets: showMan,
    x: "+=16",
    y: "-=16",
    alpha: 0,
    ease: "Sine.easeInOut",
    duration: 750
  });

  // Slide the Wobbuffet and Game over slightly
  scene.tweens.add({
    targets: [wobbuffet, carnivalGame],
    x: "+=16",
    ease: "Sine.easeInOut",
    duration: 750
  });
}
