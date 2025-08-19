import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { modifierTypes } from "#data/data-lists";
import { SpeciesFormChangeActiveTrigger } from "#data/form-change-triggers";
import { getPokeballAtlasKey, getPokeballTintColor } from "#data/pokeball";
import { FieldPosition } from "#enums/field-position";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { PlayerGender } from "#enums/player-gender";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { addPokeballOpenParticles } from "#field/anims";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { queueEncounterMessage, showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import {
  leaveEncounterWithoutBattle,
  selectPokemonForOption,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
  updatePlayerMoney,
} from "#mystery-encounters/encounter-phase-utils";
import { isPokemonValidForEncounterOptionSelection } from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { MoneyRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/funAndGames";

/**
 * Fun and Games! encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3819 | GitHub Issue #3819}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const FunAndGamesEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.FUN_AND_GAMES,
)
  .withEncounterTier(MysteryEncounterTier.GREAT)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withSceneRequirement(new MoneyRequirement(0, 1.5)) // Cost equal to 1 Max Potion to play
  .withAutoHideIntroVisuals(false)
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
      yShadow: 6,
    },
    {
      spriteKey: "fun_and_games_man",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      x: 40,
      y: 6,
      yShadow: 6,
    },
  ])
  .withIntroDialogue([
    {
      speaker: `${namespace}:speaker`,
      text: `${namespace}:introDialogue`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;
    globalScene.loadBgm("mystery_encounter_fun_and_games", "mystery_encounter_fun_and_games.mp3");
    encounter.setDialogueToken("wobbuffetName", getPokemonSpecies(SpeciesId.WOBBUFFET).getName());
    return true;
  })
  .withOnVisualsStart(() => {
    globalScene.fadeAndSwitchBgm("mystery_encounter_fun_and_games");
    return true;
  })
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withSceneRequirement(new MoneyRequirement(0, 1.5)) // Cost equal to 1 Max Potion
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        // Select Pokemon for minigame
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          encounter.misc = {
            playerPokemon: pokemon,
          };
        };

        // Only Pokemon that are not KOed/legal can be selected
        const selectableFilter = (pokemon: Pokemon) => {
          return isPokemonValidForEncounterOptionSelection(pokemon, `${namespace}:invalidSelection`);
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        // Start minigame
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        encounter.misc.turnsRemaining = 3;

        // Update money
        const moneyCost = (encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney;
        updatePlayerMoney(-moneyCost, true, false);
        await showEncounterText(
          i18next.t("mysteryEncounterMessages:paidMoney", {
            amount: moneyCost,
          }),
        );

        // Handlers for battle events
        encounter.onTurnStart = handleNextTurn; // triggered during TurnInitPhase
        encounter.doContinueEncounter = handleLoseMinigame; // triggered during MysteryEncounterRewardsPhase, post VictoryPhase if the player KOs Wobbuffet

        hideShowmanIntroSprite();
        await summonPlayerPokemon();
        await showWobbuffetHealthBar();

        return true;
      })
      .build(),
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.2.label`,
      buttonTooltip: `${namespace}:option.2.tooltip`,
      selected: [
        {
          text: `${namespace}:option.2.selected`,
        },
      ],
    },
    async () => {
      // Leave encounter with no rewards or exp
      await transitionMysteryEncounterIntroVisuals(true, true);
      leaveEncounterWithoutBattle(true);
      return true;
    },
  )
  .build();

async function summonPlayerPokemon() {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: TODO: Consider refactoring to avoid async promise executor
  return new Promise<void>(async resolve => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    const playerPokemon = encounter.misc.playerPokemon;
    // Swaps the chosen Pokemon and the first player's lead Pokemon in the party
    const party = globalScene.getPlayerParty();
    const chosenIndex = party.indexOf(playerPokemon);
    if (chosenIndex !== 0) {
      const leadPokemon = party[0];
      party[0] = playerPokemon;
      party[chosenIndex] = leadPokemon;
    }

    // Do trainer summon animation
    let playerAnimationPromise: Promise<void> | undefined;
    globalScene.ui.showText(
      i18next.t("battle:playerGo", {
        pokemonName: getPokemonNameWithAffix(playerPokemon),
      }),
    );
    globalScene.pbTray.hide();
    globalScene.trainer.setTexture(
      `trainer_${globalScene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`,
    );
    globalScene.time.delayedCall(562, () => {
      globalScene.trainer.setFrame("2");
      globalScene.time.delayedCall(64, () => {
        globalScene.trainer.setFrame("3");
      });
    });
    globalScene.tweens.add({
      targets: globalScene.trainer,
      x: -36,
      duration: 1000,
      onComplete: () => globalScene.trainer.setVisible(false),
    });
    globalScene.time.delayedCall(750, () => {
      playerAnimationPromise = summonPlayerPokemonAnimation(playerPokemon);
    });

    // Also loads Wobbuffet data (cannot be shiny)
    const enemySpecies = getPokemonSpecies(SpeciesId.WOBBUFFET);
    globalScene.currentBattle.enemyParty = [];
    const wobbuffet = globalScene.addEnemyPokemon(
      enemySpecies,
      encounter.misc.playerPokemon.level,
      TrainerSlot.NONE,
      false,
      true,
    );
    wobbuffet.ivs = [0, 0, 0, 0, 0, 0];
    wobbuffet.setNature(Nature.MILD);
    wobbuffet.setAlpha(0);
    wobbuffet.setVisible(false);
    wobbuffet.calculateStats();
    globalScene.currentBattle.enemyParty[0] = wobbuffet;
    globalScene.gameData.setPokemonSeen(wobbuffet, true);
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

function handleLoseMinigame() {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: TODO: Consider refactoring to avoid async promise executor
  return new Promise<void>(async resolve => {
    // Check Wobbuffet is still alive
    const wobbuffet = globalScene.getEnemyPokemon();
    if (!wobbuffet || wobbuffet.isFainted(true) || wobbuffet.hp === 0) {
      // Player loses
      // End the battle
      if (wobbuffet) {
        wobbuffet.hideInfo();
        wobbuffet.leaveField();
      }
      transitionMysteryEncounterIntroVisuals(true, true);
      globalScene.currentBattle.enemyParty = [];
      globalScene.currentBattle.mysteryEncounter!.doContinueEncounter = undefined;
      leaveEncounterWithoutBattle(true);
      await showEncounterText(`${namespace}:ko`);
      const reviveCost = globalScene.getWaveMoneyAmount(1.5);
      updatePlayerMoney(-reviveCost, true, false);
    }

    resolve();
  });
}

function handleNextTurn() {
  const encounter = globalScene.currentBattle.mysteryEncounter!;

  const wobbuffet = globalScene.getEnemyPokemon();
  if (!wobbuffet) {
    // Should never be triggered, just handling the edge case
    handleLoseMinigame();
    return true;
  }
  if (encounter.misc.turnsRemaining <= 0) {
    // Check Wobbuffet's health for the actual result
    const healthRatio = wobbuffet.hp / wobbuffet.getMaxHp();
    let resultMessageKey: string;
    let isHealPhase = false;
    if (healthRatio < 0.03) {
      // Grand prize
      setEncounterRewards({
        guaranteedModifierTypeFuncs: [modifierTypes.MULTI_LENS],
        fillRemaining: false,
      });
      resultMessageKey = `${namespace}:bestResult`;
    } else if (healthRatio < 0.15) {
      // 2nd prize
      setEncounterRewards({
        guaranteedModifierTypeFuncs: [modifierTypes.SCOPE_LENS],
        fillRemaining: false,
      });
      resultMessageKey = `${namespace}:greatResult`;
    } else if (healthRatio < 0.33) {
      // 3rd prize
      setEncounterRewards({
        guaranteedModifierTypeFuncs: [modifierTypes.WIDE_LENS],
        fillRemaining: false,
      });
      resultMessageKey = `${namespace}:goodResult`;
    } else {
      // No prize
      isHealPhase = true;
      resultMessageKey = `${namespace}:badResult`;
    }

    // End the battle
    wobbuffet.hideInfo();
    wobbuffet.leaveField();
    globalScene.currentBattle.enemyParty = [];
    globalScene.currentBattle.mysteryEncounter!.doContinueEncounter = undefined;
    leaveEncounterWithoutBattle(isHealPhase);
    // Must end the TurnInit phase prematurely so battle phases aren't added to queue
    queueEncounterMessage(`${namespace}:endGame`);
    queueEncounterMessage(resultMessageKey);

    // Skip remainder of TurnInitPhase
    return true;
  }
  if (encounter.misc.turnsRemaining < 3) {
    // Display charging messages on turns that aren't the initial turn
    queueEncounterMessage(`${namespace}:chargingContinue`);
  }
  queueEncounterMessage(`${namespace}:turnRemaining${encounter.misc.turnsRemaining}`);
  encounter.misc.turnsRemaining--;

  // Don't skip remainder of TurnInitPhase
  return false;
}

async function showWobbuffetHealthBar() {
  const wobbuffet = globalScene.getEnemyPokemon()!;

  globalScene.add.existing(wobbuffet);
  globalScene.field.add(wobbuffet);

  const playerPokemon = globalScene.getPlayerPokemon() as Pokemon;
  if (playerPokemon?.isOnField()) {
    globalScene.field.moveBelow(wobbuffet, playerPokemon);
  }
  // Show health bar and trigger cry
  wobbuffet.showInfo();
  globalScene.time.delayedCall(1000, () => {
    wobbuffet.cry();
  });
  wobbuffet.resetSummonData();

  // Track the HP change across turns
  globalScene.currentBattle.mysteryEncounter!.misc.wobbuffetHealth = wobbuffet.hp;
}

function summonPlayerPokemonAnimation(pokemon: PlayerPokemon): Promise<void> {
  return new Promise<void>(resolve => {
    const pokeball = globalScene.addFieldSprite(36, 80, "pb", getPokeballAtlasKey(pokemon.pokeball));
    pokeball.setVisible(false);
    pokeball.setOrigin(0.5, 0.625);
    globalScene.field.add(pokeball);

    pokemon.setFieldPosition(FieldPosition.CENTER, 0);

    const fpOffset = pokemon.getFieldPositionOffset();

    pokeball.setVisible(true);

    globalScene.tweens.add({
      targets: pokeball,
      duration: 650,
      x: 100 + fpOffset[0],
    });

    globalScene.tweens.add({
      targets: pokeball,
      duration: 150,
      ease: "Cubic.easeOut",
      y: 70 + fpOffset[1],
      onComplete: () => {
        globalScene.tweens.add({
          targets: pokeball,
          duration: 500,
          ease: "Cubic.easeIn",
          angle: 1440,
          y: 132 + fpOffset[1],
          onComplete: () => {
            globalScene.playSound("se/pb_rel");
            pokeball.destroy();
            globalScene.add.existing(pokemon);
            globalScene.field.add(pokemon);
            addPokeballOpenParticles(pokemon.x, pokemon.y - 16, pokemon.pokeball);
            globalScene.updateModifiers(true);
            globalScene.updateFieldScale();
            pokemon.showInfo();
            pokemon.playAnim();
            pokemon.setVisible(true);
            pokemon.getSprite().setVisible(true);
            pokemon.setScale(0.5);
            pokemon.tint(getPokeballTintColor(pokemon.pokeball));
            pokemon.untint(250, "Sine.easeIn");
            globalScene.updateFieldScale();
            globalScene.tweens.add({
              targets: pokemon,
              duration: 250,
              ease: "Sine.easeIn",
              scale: pokemon.getSpriteScale(),
              onComplete: () => {
                pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
                pokemon.getSprite().clearTint();
                pokemon.fieldSetup(true);
                globalScene.time.delayedCall(1000, () => {
                  if (pokemon.isShiny()) {
                    globalScene.phaseManager.unshiftNew("ShinySparklePhase", pokemon.getBattlerIndex());
                  }

                  pokemon.resetTurnData();

                  globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
                  globalScene.phaseManager.pushNew("PostSummonPhase", pokemon.getBattlerIndex());
                  resolve();
                });
              },
            });
          },
        });
      },
    });
  });
}

function hideShowmanIntroSprite() {
  const carnivalGame = globalScene.currentBattle.mysteryEncounter!.introVisuals?.getSpriteAtIndex(0)[0];
  const wobbuffet = globalScene.currentBattle.mysteryEncounter!.introVisuals?.getSpriteAtIndex(1)[0];
  const showMan = globalScene.currentBattle.mysteryEncounter!.introVisuals?.getSpriteAtIndex(2)[0];

  // Hide the showman
  globalScene.tweens.add({
    targets: showMan,
    x: "+=16",
    y: "-=16",
    alpha: 0,
    ease: "Sine.easeInOut",
    duration: 750,
  });

  // Slide the Wobbuffet and Game over slightly
  globalScene.tweens.add({
    targets: [wobbuffet, carnivalGame],
    x: "+=16",
    ease: "Sine.easeInOut",
    duration: 750,
  });
}
