//#region 00 Imports
import BattleScene, { bypassLogin } from "./battle-scene";
import { default as Pokemon, PlayerPokemon, EnemyPokemon, PokemonMove, MoveResult, DamageResult, FieldPosition, HitResult, TurnMove } from "./field/pokemon";
import * as Utils from "./utils";
import { allMoves, applyMoveAttrs, BypassSleepAttr, ChargeAttr, applyFilteredMoveAttrs, HitsTagAttr, MissEffectAttr, MoveAttr, MoveEffectAttr, MoveFlags, MultiHitAttr, OverrideMoveEffectAttr, MoveTarget, getMoveTargets, MoveTargetSet, MoveEffectTrigger, CopyMoveAttr, AttackMove, SelfStatusMove, PreMoveMessageAttr, HealStatusEffectAttr, NoEffectAttr, BypassRedirectAttr, FixedDamageAttr, PostVictoryStatChangeAttr, ForceSwitchOutAttr, VariableTargetAttr, IncrementMovePriorityAttr, MoveHeaderAttr, MoveCategory } from "./data/move";
import { Mode } from "./ui/ui";
import { Command } from "./ui/command-ui-handler";
import { Stat } from "./data/pokemon-stat";
import { BerryModifier, ContactHeldItemTransferChanceModifier, EnemyAttackStatusEffectChanceModifier, EnemyPersistentModifier, EnemyStatusEffectHealChanceModifier, EnemyTurnHealModifier, ExpBalanceModifier, ExpBoosterModifier, ExpShareModifier, ExtraModifierModifier, FlinchChanceModifier, HealingBoosterModifier, HitHealModifier, LapsingPersistentModifier, MapModifier, Modifier, MultipleParticipantExpBonusModifier, PokemonExpBoosterModifier, PokemonHeldItemModifier, PokemonInstantReviveModifier, SwitchEffectTransferModifier, TurnHealModifier, TurnHeldItemTransferModifier, MoneyMultiplierModifier, MoneyInterestModifier, IvScannerModifier, LapsingPokemonHeldItemModifier, PokemonMultiHitModifier, overrideModifiers, overrideHeldItems, BypassSpeedChanceModifier, TurnStatusEffectModifier, PokemonResetNegativeStatStageModifier, PersistentModifier } from "./modifier/modifier";
import PartyUiHandler, { PartyOption, PartyUiMode } from "./ui/party-ui-handler";
import { doPokeballBounceAnim, getPokeballAtlasKey, getPokeballCatchMultiplier, getPokeballTintColor, PokeballType } from "./data/pokeball";
import { CommonAnim, CommonBattleAnim, MoveAnim, initMoveAnim, loadMoveAnimAssets } from "./data/battle-anims";
import { StatusEffect, getStatusEffectActivationText, getStatusEffectCatchRateMultiplier, getStatusEffectHealText, getStatusEffectObtainText, getStatusEffectOverlapText } from "./data/status-effect";
import { SummaryUiMode } from "./ui/summary-ui-handler";
import EvolutionSceneHandler from "./ui/evolution-scene-handler";
import { EvolutionPhase } from "./evolution-phase";
import { Phase } from "./phase";
import { BattleStat, getBattleStatLevelChangeDescription, getBattleStatName } from "./data/battle-stat";
import { biomeLinks, getBiomeName } from "./data/biomes";
import { ModifierTier } from "./modifier/modifier-tier";
import { FusePokemonModifierType, ModifierPoolType, ModifierType, ModifierTypeFunc, ModifierTypeOption, PokemonModifierType, PokemonMoveModifierType, PokemonPpRestoreModifierType, PokemonPpUpModifierType, RememberMoveModifierType, TmModifierType, calculateItemConditions, getDailyRunStarterModifiers, getEnemyBuffModifierForWave, getLuckString, getModifierType, getPartyLuckValue, getPlayerModifierTypeOptions, getPlayerShopModifierTypeOptionsForWave, modifierTypes, regenerateModifierPoolThresholds, setEvioliteOverride } from "./modifier/modifier-type";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { BattlerTagLapseType, CenterOfAttentionTag, EncoreTag, ProtectedTag, SemiInvulnerableTag, TrappedTag } from "./data/battler-tags";
import { getPokemonNameWithAffix } from "./messages";
import { Starter } from "./ui/starter-select-ui-handler";
import { Gender } from "./data/gender";
import { Weather, WeatherType, getRandomWeatherType, getTerrainBlockMessage, getWeatherDamageMessage, getWeatherLapseMessage } from "./data/weather";
import { ArenaTagSide, ArenaTrapTag, ConditionalProtectTag, MistTag, TrickRoomTag } from "./data/arena-tag";
import { CheckTrappedAbAttr, PostAttackAbAttr, PostBattleAbAttr, PostDefendAbAttr, PostSummonAbAttr, PostTurnAbAttr, PostWeatherLapseAbAttr, PreSwitchOutAbAttr, PreWeatherDamageAbAttr, ProtectStatAbAttr, RedirectMoveAbAttr, BlockRedirectAbAttr, RunSuccessAbAttr, StatChangeMultiplierAbAttr, SuppressWeatherEffectAbAttr, SyncEncounterNatureAbAttr, applyAbAttrs, applyCheckTrappedAbAttrs, applyPostAttackAbAttrs, applyPostBattleAbAttrs, applyPostDefendAbAttrs, applyPostSummonAbAttrs, applyPostTurnAbAttrs, applyPostWeatherLapseAbAttrs, applyPreStatChangeAbAttrs, applyPreSwitchOutAbAttrs, applyPreWeatherEffectAbAttrs, ChangeMovePriorityAbAttr, applyPostVictoryAbAttrs, PostVictoryAbAttr, BlockNonDirectDamageAbAttr as BlockNonDirectDamageAbAttr, applyPostKnockOutAbAttrs, PostKnockOutAbAttr, PostBiomeChangeAbAttr, PreventBypassSpeedChanceAbAttr, applyPostFaintAbAttrs, PostFaintAbAttr, IncreasePpAbAttr, PostStatChangeAbAttr, applyPostStatChangeAbAttrs, AlwaysHitAbAttr, PreventBerryUseAbAttr, StatChangeCopyAbAttr, PokemonTypeChangeAbAttr, applyPreAttackAbAttrs, applyPostMoveUsedAbAttrs, PostMoveUsedAbAttr, MaxMultiHitAbAttr, HealFromBerryUseAbAttr, IgnoreMoveEffectsAbAttr, BlockStatusDamageAbAttr, BypassSpeedChanceAbAttr, AddSecondStrikeAbAttr, ReduceBurnDamageAbAttr, BattlerTagImmunityAbAttr } from "./data/ability";
import { Unlockables, getUnlockableName } from "./system/unlockables";
import { getBiomeKey } from "./field/arena";
import { BattleType, BattlerIndex, TurnCommand } from "./battle";
import { ChallengeAchv, HealAchv, LevelAchv, achvs } from "./system/achv";
import { TrainerSlot, trainerConfigs } from "./data/trainer-config";
import { EggHatchPhase } from "./egg-hatch-phase";
import { Egg } from "./data/egg";
import { vouchers } from "./system/voucher";
import { clientSessionId, loggedInUser, updateUserInfo } from "./account";
import { SessionSaveData, decrypt } from "./system/game-data";
import { addPokeballCaptureStars, addPokeballOpenParticles } from "./field/anims";
import { SpeciesFormChangeActiveTrigger, SpeciesFormChangeMoveLearnedTrigger, SpeciesFormChangePostMoveTrigger, SpeciesFormChangePreMoveTrigger } from "./data/pokemon-forms";
import { battleSpecDialogue, getCharVariantFromDialogue, miscDialogue } from "./data/dialogue";
import ModifierSelectUiHandler, { SHOP_OPTIONS_ROW_LIMIT } from "./ui/modifier-select-ui-handler";
import { SettingKeys } from "./system/settings/settings";
import { Tutorial, handleTutorial } from "./tutorial";
import { TerrainType } from "./data/terrain";
import { OptionSelectConfig, OptionSelectItem } from "./ui/abstact-option-select-ui-handler";
import { SaveSlotUiMode } from "./ui/save-slot-select-ui-handler";
import { fetchDailyRunSeed, getDailyRunStarters } from "./data/daily-run";
import { GameMode, GameModes, getGameMode } from "./game-mode";
import PokemonSpecies, { getPokemonSpecies, speciesStarters } from "./data/pokemon-species";
import i18next from "./plugins/i18n";
import Overrides from "#app/overrides";
import { TextStyle, addTextObject, getTextColor } from "./ui/text";
import { Type } from "./data/type";
import { BerryUsedEvent, EncounterPhaseEvent, MoveUsedEvent, TurnEndEvent, TurnInitEvent } from "./events/battle-scene";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleSpec } from "#enums/battle-spec";
import { BattleStyle } from "#enums/battle-style";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Biome } from "#enums/biome";
import { ExpNotification } from "#enums/exp-notification";
import { Moves } from "#enums/moves";
import { PlayerGender } from "#enums/player-gender";
import { Species } from "#enums/species";
import { TrainerType } from "#enums/trainer-type";
import TrainerData from "./system/trainer-data";
import PersistentModifierData from "./system/modifier-data";
import ArenaData from "./system/arena-data";
import ChallengeData from "./system/challenge-data";
import { Challenges } from "./enums/challenges"
import PokemonData from "./system/pokemon-data"
import * as LoggerTools from "./logger"
import { applyChallenges, ChallengeType } from "./data/challenge";
import { pokemonEvolutions } from "./data/pokemon-evolutions";
import { getNatureDecrease, getNatureIncrease, getNatureName } from "./data/nature";
import { GameDataType } from "./enums/game-data-type";
import { Session } from "inspector";

const { t } = i18next;



//#endregion





//#region 01 Uncategorized
function catchCalc(pokemon: EnemyPokemon) {
  const _3m = 3 * pokemon.getMaxHp();
  const _2h = 2 * pokemon.hp;
  const catchRate = pokemon.species.catchRate;
  const statusMultiplier = pokemon.status ? getStatusEffectCatchRateMultiplier(pokemon.status.effect) : 1;
  const rate1 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 1) / _3m) * statusMultiplier)))));
  const rate2 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 1.5) / _3m) * statusMultiplier)))));
  const rate3 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 2) / _3m) * statusMultiplier)))));
  const rate4 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 3) / _3m) * statusMultiplier)))));

  var rates = [rate1, rate2, rate3, rate4]
  var rates2 = rates.map(r => ((r/65536) ** 3))
  //console.log(rates2)

  return rates2
}
function catchCalcRaw(pokemon: EnemyPokemon) {
  const _3m = 3 * pokemon.getMaxHp();
  const _2h = 2 * pokemon.hp;
  const catchRate = pokemon.species.catchRate;
  const statusMultiplier = pokemon.status ? getStatusEffectCatchRateMultiplier(pokemon.status.effect) : 1;
  const rate1 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 1) / _3m) * statusMultiplier)))));
  const rate2 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 1.5) / _3m) * statusMultiplier)))));
  const rate3 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 2) / _3m) * statusMultiplier)))));
  const rate4 = Math.round(65536 / Math.sqrt(Math.sqrt(255 / (Math.round((((_3m - _2h) * catchRate * 3) / _3m) * statusMultiplier)))));

  var rates = [rate1, rate2, rate3, rate4]
  var rates2 = rates.map(r => ((r/65536) ** 3))
  //console.log(rates2)
  //console.log("output: ", rates)

  return rates
}

/**
 * Finds the best Poké Ball to catch a Pokemon with, and the % chance of capturing it.
 * @param pokemon The Pokémon to get the catch rate for.
 * @param override Show the best Poké Ball to use, even if you don't have any.
 * @returns The name and % rate of the best Poké Ball.
 */
export function findBest(scene: BattleScene, pokemon: EnemyPokemon, override?: boolean) {
  var rates = catchCalc(pokemon)
  var rates_raw = catchCalcRaw(pokemon)
  var rolls = []
  var offset = 0
  scene.getModifiers(BypassSpeedChanceModifier, true).forEach(m => {
    //console.log(m, m.getPokemon(this.scene), pokemon)
    var p = m.getPokemon(scene)
    scene.getField().forEach((p2, idx) => {
      if (p == p2) {
        console.log(m.getPokemon(scene)?.name + " (Position: " + (idx + 1) + ") has a Quick Claw")
        offset++
      }
    })
  })
  scene.currentBattle.multiInt(scene, rolls, offset + 3, 65536, undefined, "Catch prediction")
  //console.log(rolls)
  //console.log(rolls.slice(offset, offset + 3))
  if (scene.pokeballCounts[0] == 0 && !override) rates[0] = 0
  if (scene.pokeballCounts[1] == 0 && !override) rates[1] = 0
  if (scene.pokeballCounts[2] == 0 && !override) rates[2] = 0
  if (scene.pokeballCounts[3] == 0 && !override) rates[3] = 0
  var rates2 = rates.slice()
  rates2.sort(function(a, b) {return b - a})
  const ballNames = [
    "Poké Ball",
    "Great Ball",
    "Ultra Ball",
    "Rogue Ball",
    "Master Ball"
  ]
  var func_output = ""
  rates_raw.forEach((v, i) => {
    if (scene.pokeballCounts[i] == 0 && !override)
      return; // Don't list success for Poke Balls we don't have
    //console.log(ballNames[i])
    //console.log(v, rolls[offset + 0], v > rolls[offset + 0])
    //console.log(v, rolls[offset + 1], v > rolls[offset + 1])
    //console.log(v, rolls[offset + 2], v > rolls[offset + 2])
    if (v > rolls[offset + 0]) {
      //console.log("1 roll")
      if (v > rolls[offset + 1]) {
        //console.log("2 roll")
        if (v > rolls[offset + 2]) {
          //console.log("Caught!")
          if (func_output == "") {
            func_output = ballNames[i] + " catches"
          }
        }
      }
    }
    if (v > rolls[offset] && v > rolls[1 + offset] && v > rolls[2 + offset]) {
      if (func_output == "") {
        func_output = ballNames[i] + " catches"
      }
    }
  })
  if (func_output != "") {
    return func_output
  }
  return "Can't catch"
  var n = ""
  switch (rates2[0]) {
    case rates[0]:
      // Poke Balls are best
      n = "Poké Ball "
      break;
    case rates[1]:
      // Great Balls are best
      n = "Great Ball "
      break;
    case rates[2]:
      // Ultra Balls are best
      n = "Ultra Ball "
      break;
    case rates[3]:
      // Rogue Balls are best
      n = "Rogue Ball "
      break;
    default:
      // Master Balls are the only thing that will work
      if (scene.pokeballCounts[4] != 0 || override) {
        return "Master Ball";
      } else {
        return "No balls"
      }
  }
  return n + " (FAIL)"
  return n + Math.round(rates2[0] * 100) + "%";
}
export function parseSlotData(slotId: integer): SessionSaveData | undefined {
  var S = localStorage.getItem(`sessionData${slotId ? slotId : ""}_${loggedInUser?.username}`)
  if (S == null) {
    // No data in this slot
    return undefined;
  }
  var dataStr = decrypt(S, true)
  var Save = JSON.parse(dataStr, (k: string, v: any) => {
    /*const versions = [ scene.game.config.gameVersion, sessionData.gameVersion || '0.0.0' ];

    if (versions[0] !== versions[1]) {
      const [ versionNumbers, oldVersionNumbers ] = versions.map(ver => ver.split('.').map(v => parseInt(v)));
    }*/

    if (k === "party" || k === "enemyParty") {
      const ret: PokemonData[] = [];
      if (v === null) {
        v = [];
      }
      for (const pd of v) {
        ret.push(new PokemonData(pd));
      }
      return ret;
    }

    if (k === "trainer") {
      return v ? new TrainerData(v) : null;
    }

    if (k === "modifiers" || k === "enemyModifiers") {
      const player = k === "modifiers";
      const ret: PersistentModifierData[] = [];
      if (v === null) {
        v = [];
      }
      for (const md of v) {
        if (md?.className === "ExpBalanceModifier") { // Temporarily limit EXP Balance until it gets reworked
          md.stackCount = Math.min(md.stackCount, 4);
        }
        if (md instanceof EnemyAttackStatusEffectChanceModifier && md.effect === StatusEffect.FREEZE || md.effect === StatusEffect.SLEEP) {
          continue;
        }
        ret.push(new PersistentModifierData(md, player));
      }
      return ret;
    }

    if (k === "arena") {
      return new ArenaData(v);
    }

    if (k === "challenges") {
      const ret: ChallengeData[] = [];
      if (v === null) {
        v = [];
      }
      for (const c of v) {
        ret.push(new ChallengeData(c));
      }
      return ret;
    }

    return v;
  }) as SessionSaveData;
  Save.slot = slotId
  Save.description = (slotId + 1) + " - "
  var challengeParts: ChallengeData[] | undefined[] = new Array(5)
  var nameParts: string[] | undefined[] = new Array(5)
  if (Save.challenges != undefined) {
    for (var i = 0; i < Save.challenges.length; i++) {
      switch (Save.challenges[i].id) {
        case Challenges.SINGLE_TYPE:
          challengeParts[0] = Save.challenges[i]
          nameParts[1] = Save.challenges[i].toChallenge().getValue()
          nameParts[1] = nameParts[1][0].toUpperCase() + nameParts[1].substring(1)
          if (nameParts[1] == "unknown") {
            nameParts[1] = undefined
            challengeParts[1] = undefined
          }
          break;
        case Challenges.SINGLE_GENERATION:
          challengeParts[1] = Save.challenges[i]
          nameParts[0] = "Gen " + Save.challenges[i].value
          if (nameParts[0] == "Gen 0") {
            nameParts[0] = undefined
            challengeParts[0] = undefined
          }
          break;
        case Challenges.LOWER_MAX_STARTER_COST:
          challengeParts[2] = Save.challenges[i]
          nameParts[3] = (10 - challengeParts[0]!.value) + "cost"
          break;
        case Challenges.LOWER_STARTER_POINTS:
          challengeParts[3] = Save.challenges[i]
          nameParts[4] = (10 - challengeParts[0]!.value) + "pt"
          break;
        case Challenges.FRESH_START:
          challengeParts[4] = Save.challenges[i]
          nameParts[2] = "FS"
          break;
      }
    }
  }
  for (var i = 0; i < challengeParts.length; i++) {
    if (challengeParts[i] == undefined || challengeParts[i] == null) {
      challengeParts.splice(i, 1)
      i--
    }
  }
  for (var i = 0; i < nameParts.length; i++) {
    if (nameParts[i] == undefined || nameParts[i] == null || nameParts[i] == "") {
      nameParts.splice(i, 1)
      i--
    }
  }
  if (challengeParts.length == 1 && false) {
    switch (challengeParts[0]!.id) {
      case Challenges.SINGLE_TYPE:
        Save.description += "Mono " + challengeParts[0]!.toChallenge().getValue()
        break;
      case Challenges.SINGLE_GENERATION:
        Save.description += "Gen " + challengeParts[0]!.value
        break;
      case Challenges.LOWER_MAX_STARTER_COST:
        Save.description += "Max cost " + (10 - challengeParts[0]!.value)
        break;
      case Challenges.LOWER_STARTER_POINTS:
        Save.description += (10 - challengeParts[0]!.value) + "-point"
        break;
      case Challenges.FRESH_START:
        Save.description += "Fresh Start"
        break;
    }
  } else if (challengeParts.length == 0) {
    switch (Save.gameMode) {
      case GameModes.CLASSIC:
        Save.description += "Classic";
        break;
      case GameModes.ENDLESS:
        Save.description += "Endless";
        break;
      case GameModes.SPLICED_ENDLESS:
        Save.description += "Endless+";
        break;
      case GameModes.DAILY:
        Save.description += "Daily";
        break;
    }
  } else {
    Save.description += nameParts.join(" ")
  }
  Save.description += " (" + getBiomeName(Save.arena.biome) + " " + Save.waveIndex + ")"
  return Save;
}
//#endregion





//#region 02 LoginPhase
export class LoginPhase extends Phase {
  private showText: boolean;

  constructor(scene: BattleScene, showText?: boolean) {
    super(scene);

    this.showText = showText === undefined || !!showText;
  }

  start(): void {
    super.start();

    const hasSession = !!Utils.getCookie(Utils.sessionIdKey);

    this.scene.ui.setMode(Mode.LOADING, { buttonActions: [] });
    Utils.executeIf(bypassLogin || hasSession, updateUserInfo).then(response => {
      const success = response ? response[0] : false;
      const statusCode = response ? response[1] : null;
      if (!success) {
        if (!statusCode || statusCode === 400) {
          if (this.showText) {
            this.scene.ui.showText(i18next.t("menu:logInOrCreateAccount"));
          }

          this.scene.playSound("menu_open");

          const loadData = () => {
            updateUserInfo().then(success => {
              if (!success[0]) {
                Utils.removeCookie(Utils.sessionIdKey);
                this.scene.reset(true, true);
                return;
              }
              this.scene.gameData.loadSystem().then(() => this.end());
            });
          };

          this.scene.ui.setMode(Mode.LOGIN_FORM, {
            buttonActions: [
              () => {
                this.scene.ui.playSelect();
                loadData();
              }, () => {
                this.scene.playSound("menu_open");
                this.scene.ui.setMode(Mode.REGISTRATION_FORM, {
                  buttonActions: [
                    () => {
                      this.scene.ui.playSelect();
                      updateUserInfo().then(success => {
                        if (!success[0]) {
                          Utils.removeCookie(Utils.sessionIdKey);
                          this.scene.reset(true, true);
                          return;
                        }
                        this.end();
                      } );
                    }, () => {
                      this.scene.unshiftPhase(new LoginPhase(this.scene, false));
                      this.end();
                    }
                  ]
                });
              }, () => {
                const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/discord/callback`);
                const discordId = import.meta.env.VITE_DISCORD_CLIENT_ID;
                const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordId}&redirect_uri=${redirectUri}&response_type=code&scope=identify&prompt=none`;
                window.open(discordUrl, "_self");
              }, () => {
                const redirectUri = encodeURIComponent(`${import.meta.env.VITE_SERVER_URL}/auth/google/callback`);
                const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                const googleUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
                window.open(googleUrl, "_self");
              }
            ]
          });
        } else if (statusCode === 401) {
          Utils.removeCookie(Utils.sessionIdKey);
          this.scene.reset(true, true);
        } else {
          this.scene.unshiftPhase(new UnavailablePhase(this.scene));
          super.end();
        }
        return null;
      } else {
        this.scene.gameData.loadSystem().then(success => {
          if (success || bypassLogin) {
            this.end();
          } else {
            this.scene.ui.setMode(Mode.MESSAGE);
            this.scene.ui.showText(t("menu:failedToLoadSaveData"));
          }
        });
      }
    });
  }

  end(): void {
    this.scene.ui.setMode(Mode.MESSAGE);

    if (!this.scene.gameData.gender) {
      this.scene.unshiftPhase(new SelectGenderPhase(this.scene));
    }

    handleTutorial(this.scene, Tutorial.Intro).then(() => super.end());
  }
}
//#endregion





//#region 03 TitlePhase
export class TitlePhase extends Phase {
  private loaded: boolean;
  private lastSessionData: SessionSaveData;
  public gameMode: GameModes;

  constructor(scene: BattleScene) {
    super(scene);

    this.loaded = false;
  }

  setBiomeByType(biome: Biome, override?: boolean): void {
    if (!this.scene.menuChangesBiome && !override)
      return;
    this.scene.arenaBg.setTexture(`${getBiomeKey(biome)}_bg`);
  }
  setBiomeByName(biome: string, override?: boolean): void {
    if (!this.scene.menuChangesBiome && !override)
      return;
    this.scene.arenaBg.setTexture(`${getBiomeKey(Utils.getEnumValues(Biome)[Utils.getEnumKeys(Biome).indexOf(biome)])}_bg`);
  }
  setBiomeByFile(sessionData: SessionSaveData, override?: boolean): void {
    if (!this.scene.menuChangesBiome && !override)
      return;
    this.scene.arenaBg.setTexture(`${getBiomeKey(sessionData.arena.biome)}_bg`);
  }

  confirmSlot = (message: string, slotFilter: (i: integer) => boolean, callback: (i: integer) => void) => {
    const p = this;
    this.scene.ui.revertMode();
    this.scene.ui.showText(message, null, () => {
      const config: OptionSelectConfig = {
        options: new Array(5).fill(null).map((_, i) => i).filter(slotFilter).map(i => {
          var data = parseSlotData(i)
          return {
            //label: `${i18next.t("menuUiHandler:slot", {slotNumber: i+1})}`,
            label: (data ? `${i18next.t("menuUiHandler:slot", {slotNumber: i+1})}${data.description.substring(1)}` : `${i18next.t("menuUiHandler:slot", {slotNumber: i+1})}`),
            handler: () => {
              callback(i);
              this.scene.ui.revertMode();
              this.scene.ui.showText("", 0);
              return true;
            }
          };
        }).concat([{
          label: i18next.t("menuUiHandler:cancel"),
          handler: () => {
            p.callEnd()
            return true
          }
        }]),
        //xOffset: 98
      };
      this.scene.ui.setOverlayMode(Mode.MENU_OPTION_SELECT, config);
    });
  };

  start(): void {
    super.start();
    //console.log(LoggerTools.importDocument(JSON.stringify(LoggerTools.newDocument())))

    this.scene.ui.clearText();
    this.scene.ui.fadeIn(250);

    this.scene.playBgm("title", true);

    this.scene.biomeChangeMode = false

    this.scene.gameData.getSession(loggedInUser?.lastSessionSlot ?? -1).then(sessionData => {
      if (sessionData) {
        this.lastSessionData = sessionData;
        this.setBiomeByFile(sessionData, true)
        this.setBiomeByType(Biome.END)
      }
      this.showOptions();
    }).catch(err => {
      console.error(err);
      this.showOptions();
    });
  }

  getLastSave(log?: boolean, dailyOnly?: boolean, noDaily?: boolean): SessionSaveData | undefined {
    var saves: Array<Array<any>> = [];
    for (var i = 0; i < 5; i++) {
      var s = parseSlotData(i);
      if (s != undefined) {
        if ((!noDaily && !dailyOnly) || (s.gameMode == GameModes.DAILY && dailyOnly) || (s.gameMode != GameModes.DAILY && noDaily)) {
          saves.push([i, s, s.timestamp]);
        }
      }
    }
    saves.sort((a, b): integer => {return b[2] - a[2]})
    if (log) console.log(saves)
    if (saves == undefined) return undefined;
    if (saves[0] == undefined) return undefined;
    return saves[0][1]
  }
  getLastSavesOfEach(log?: boolean): SessionSaveData[] | undefined {
    var saves: Array<Array<SessionSaveData | number>> = [];
    for (var i = 0; i < 5; i++) {
      var s = parseSlotData(i);
      if (s != undefined) {
        saves.push([i, s, s.timestamp]);
      }
    }
    saves.sort((a, b): integer => {return (b[2] as number) - (a[2] as number)})
    if (log) console.log(saves)
    if (saves == undefined) return undefined;
    if (saves[0] == undefined) return undefined;
    var validSaves: Array<Array<SessionSaveData | number>> = []
    var hasNormal = false;
    var hasDaily = false;
    for (var i = 0; i < saves.length; i++) {
      if ((saves[i][1] as SessionSaveData).gameMode == GameModes.DAILY && !hasDaily) {
        hasDaily = true;
        validSaves.push(saves[i])
      }
      if ((saves[i][1] as SessionSaveData).gameMode != GameModes.DAILY && !hasNormal) {
        hasNormal = true;
        validSaves.push(saves[i])
      }
    }
    console.log(saves, validSaves)
    if (validSaves.length == 0)
      return undefined;
    return validSaves.map(f => f[1] as SessionSaveData);
  }
  getSaves(log?: boolean, dailyOnly?: boolean): SessionSaveData[] | undefined {
    var saves: Array<Array<any>> = [];
    for (var i = 0; i < 5; i++) {
      var s = parseSlotData(i);
      if (s != undefined) {
        if (!dailyOnly || s.gameMode == GameModes.DAILY) {
          saves.push([i, s, s.timestamp]);
        }
      }
    }
    saves.sort((a, b): integer => {return b[2] - a[2]})
    if (log) console.log(saves)
    if (saves == undefined) return undefined;
    return saves.map(f => f[1]);
  }
  getSavesUnsorted(log?: boolean, dailyOnly?: boolean): SessionSaveData[] | undefined {
    var saves: Array<Array<any>> = [];
    for (var i = 0; i < 5; i++) {
      var s = parseSlotData(i);
      if (s != undefined) {
        if (!dailyOnly || s.gameMode == GameModes.DAILY) {
          saves.push([i, s, s.timestamp]);
        }
      }
    }
    if (log) console.log(saves)
    if (saves == undefined) return undefined;
    return saves.map(f => f[1]);
  }

  callEnd(): boolean {
    this.scene.clearPhaseQueue();
    this.scene.pushPhase(new TitlePhase(this.scene));
    super.end();
    return true;
  }

  showLoggerOptions(txt: string, options: OptionSelectItem[]): boolean {
    this.scene.ui.showText("Export or clear game logs.", null, () => this.scene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: options }));
    return true;
  }

  logMenu(): boolean {
    const options: OptionSelectItem[] = [];
    LoggerTools.getLogs()
    for (var i = 0; i < LoggerTools.logs.length; i++) {
      if (localStorage.getItem(LoggerTools.logs[i][1]) != null) {
        options.push(LoggerTools.generateOption(i, this.getSaves()) as OptionSelectItem)
      } else {
        //options.push(LoggerTools.generateAddOption(i, this.scene, this))
      }
    }
    options.push({
      label: "Delete all",
      handler: () => {
        for (var i = 0; i < LoggerTools.logs.length; i++) {
          if (localStorage.getItem(LoggerTools.logs[i][1]) != null) {
            localStorage.removeItem(LoggerTools.logs[i][1])
          }
        }
        this.scene.clearPhaseQueue();
        this.scene.pushPhase(new TitlePhase(this.scene));
        super.end();
        return true;
      }
    }, {
      label: i18next.t("menu:cancel"),
      handler: () => {
        this.scene.clearPhaseQueue();
        this.scene.pushPhase(new TitlePhase(this.scene));
        super.end();
        return true;
      }
    });
    this.scene.ui.showText("Export or clear game logs.", null, () => this.scene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: options }));
    return true;
  }
  logRenameMenu(): boolean {
    const options: OptionSelectItem[] = [];
    LoggerTools.getLogs()
    this.setBiomeByType(Biome.FACTORY)
    for (var i = 0; i < LoggerTools.logs.length; i++) {
      if (localStorage.getItem(LoggerTools.logs[i][1]) != null) {
        options.push(LoggerTools.generateEditOption(this.scene, i, this.getSaves(), this) as OptionSelectItem)
      } else {
        //options.push(LoggerTools.generateAddOption(i, this.scene, this))
      }
    }
    options.push({
      label: "Delete all",
      handler: () => {
        for (var i = 0; i < LoggerTools.logs.length; i++) {
          if (localStorage.getItem(LoggerTools.logs[i][1]) != null) {
            localStorage.removeItem(LoggerTools.logs[i][1])
          }
        }
        this.scene.clearPhaseQueue();
        this.scene.pushPhase(new TitlePhase(this.scene));
        super.end();
        return true;
      }
    }, {
      label: i18next.t("menu:cancel"),
      handler: () => {
        this.scene.clearPhaseQueue();
        this.scene.pushPhase(new TitlePhase(this.scene));
        super.end();
        return true;
      }
    });
    this.scene.ui.showText("Export, rename, or delete logs.", null, () => this.scene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: options }));
    return true;
  }

  showOptions(): void {
    this.scene.biomeChangeMode = true
    const options: OptionSelectItem[] = [];
    if (false)
    if (loggedInUser && loggedInUser!.lastSessionSlot > -1) {
      options.push({
        label: i18next.t("continue", {ns: "menu"}),
        handler: () => {
          this.loadSaveSlot(this.lastSessionData ? -1 : loggedInUser!.lastSessionSlot);
          return true;
        }
      });
    }
    // Replaces 'Continue' with all Daily Run saves, sorted by when they last saved
    // If there are no daily runs, it instead shows the most recently saved run
    // If this fails too, there are no saves, and the option does not appear
    var lastsaves = this.getSaves(false, true); // Gets all Daily Runs sorted by last play time
    var lastsave = this.getLastSave(); // Gets the last save you played
    var ls1 = this.getLastSave(false, true)
    var ls2 = this.getLastSavesOfEach()
    this.scene.quickloadDisplayMode = "Both"
    switch (true) {
      case (this.scene.quickloadDisplayMode == "Daily" && ls1 != undefined):
        options.push({
          label: (ls1.description ? ls1.description : "[???]"),
          handler: () => {
            this.loadSaveSlot(ls1!.slot);
            return true;
          }
        })
        break;
      case this.scene.quickloadDisplayMode == "Dailies" && lastsaves != undefined && ls1 != undefined:
        lastsaves.forEach(lastsave1 => {
          options.push({
            label: (lastsave1.description ? lastsave1.description : "[???]"),
            handler: () => {
              this.loadSaveSlot(lastsave1.slot);
              return true;
            }
          })
        })
        break;
      case lastsave != undefined && (this.scene.quickloadDisplayMode == "Latest" || ((this.scene.quickloadDisplayMode == "Daily" || this.scene.quickloadDisplayMode == "Dailies") && ls1 == undefined)):
        options.push({
          label: (lastsave.description ? lastsave.description : "[???]"),
          handler: () => {
            this.loadSaveSlot(lastsave!.slot);
            return true;
          }
        })
        break;
      case this.scene.quickloadDisplayMode == "Both" && ls2 != undefined:
        ls2.forEach(lastsave2 => {
          options.push({
            label: (lastsave2.description ? lastsave2.description : "[???]"),
            handler: () => {
              this.loadSaveSlot(lastsave2.slot);
              return true;
            }
          })
        })
        break;
      default: // If set to "Off" or all above conditions failed
        if (loggedInUser && loggedInUser.lastSessionSlot > -1) {
          options.push({
            label: i18next.t("continue", { ns: "menu"}),
            handler: () => {
              this.loadSaveSlot(this.lastSessionData ? -1 : loggedInUser!.lastSessionSlot);
              return true;
            }
          });
        }
        break;
    }
    options.push({
      label: i18next.t("menu:newGame"),
      handler: () => {
        this.scene.biomeChangeMode = false
        this.setBiomeByType(Biome.TOWN)
        const setModeAndEnd = (gameMode: GameModes) => {
          this.gameMode = gameMode;
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.clearText();
          this.end();
        };
        if (this.scene.gameData.unlocks[Unlockables.ENDLESS_MODE]) {
          const options: OptionSelectItem[] = [
            {
              label: GameMode.getModeName(GameModes.CLASSIC),
              handler: () => {
                setModeAndEnd(GameModes.CLASSIC);
                return true;
              }
            },
            {
              label: GameMode.getModeName(GameModes.CHALLENGE),
              handler: () => {
                setModeAndEnd(GameModes.CHALLENGE);
                return true;
              }
            },
            {
              label: GameMode.getModeName(GameModes.ENDLESS),
              handler: () => {
                setModeAndEnd(GameModes.ENDLESS);
                return true;
              }
            }
          ];
          if (this.scene.gameData.unlocks[Unlockables.SPLICED_ENDLESS_MODE]) {
            options.push({
              label: GameMode.getModeName(GameModes.SPLICED_ENDLESS),
              handler: () => {
                setModeAndEnd(GameModes.SPLICED_ENDLESS);
                return true;
              }
            });
          }
          options.push({
            label: i18next.t("menuUiHandler:importSession"),
            handler: () => {
              this.confirmSlot(i18next.t("menuUiHandler:importSlotSelect"), () => true, slotId => this.scene.gameData.importData(GameDataType.SESSION, slotId));
              return true;
            },
            keepOpen: true
          })
          options.push({
            label: i18next.t("menu:cancel"),
            handler: () => {
              this.scene.clearPhaseQueue();
              this.scene.pushPhase(new TitlePhase(this.scene));
              super.end();
              return true;
            }
          });
          this.scene.ui.showText(i18next.t("menu:selectGameMode"), null, () => this.scene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: options }));
        } else {
          const options: OptionSelectItem[] = [
            {
              label: GameMode.getModeName(GameModes.CLASSIC),
              handler: () => {
                setModeAndEnd(GameModes.CLASSIC);
                return true;
              }
            }
          ];
          options.push({
            label: i18next.t("menuUiHandler:importSession"),
            handler: () => {
              this.confirmSlot(i18next.t("menuUiHandler:importSlotSelect"), () => true, slotId => this.scene.gameData.importData(GameDataType.SESSION, slotId));
              return true;
            },
            keepOpen: true
          })
          options.push({
            label: i18next.t("menu:cancel"),
            handler: () => {
              this.scene.clearPhaseQueue();
              this.scene.pushPhase(new TitlePhase(this.scene));
              super.end();
              return true;
            }
          });
          this.scene.ui.showText(i18next.t("menu:selectGameMode"), null, () => this.scene.ui.setOverlayMode(Mode.OPTION_SELECT, { options: options }));
        }
        return true;
      }
    }, {
      label: "Manage Logs",
      handler: () => {
        this.scene.biomeChangeMode = false
        //return this.logRenameMenu()
        this.scene.ui.setOverlayMode(Mode.LOG_HANDLER,
          (k: string) => {
            if (k === undefined) {
              return this.showOptions();
            }
            console.log(k)
            this.showOptions();
          }, () => {
            this.showOptions();
          });
        return true;
      }
    }, {
      label: "Manage Logs (Old Menu)",
      handler: () => {
        return this.logRenameMenu()
      }
    })
    options.push({
      label: i18next.t("menu:loadGame"),
      handler: () => {
        this.scene.biomeChangeMode = false
        this.scene.ui.setOverlayMode(Mode.SAVE_SLOT, SaveSlotUiMode.LOAD,
          (slotId: integer, autoSlot: integer) => {
            if (slotId === -1) {
              return this.showOptions();
            }
            this.loadSaveSlot(slotId, autoSlot);
          });
        return true;
      }
    })
    if (false) {
      options.push({
        label: i18next.t("menu:dailyRun"),
        handler: () => {
          this.scene.biomeChangeMode = false
          this.setupDaily();
          return true;
        },
        keepOpen: true
      })
    }
    options.push({
      label: i18next.t("menu:settings"),
      handler: () => {
        this.scene.biomeChangeMode = false
        this.scene.ui.setOverlayMode(Mode.SETTINGS);
        return true;
      },
      keepOpen: true
    });
    const config: OptionSelectConfig = {
      options: options,
      noCancel: true,
      yOffset: 47
    };
    this.scene.ui.setMode(Mode.TITLE, config);
  }

  loadSaveSlot(slotId: integer, autoSlot?: integer): void {
    this.scene.sessionSlotId = slotId > -1 || !loggedInUser ? slotId : loggedInUser.lastSessionSlot;
    this.scene.ui.setMode(Mode.MESSAGE);
    this.scene.ui.resetModeChain();
    this.scene.gameData.loadSession(this.scene, slotId, slotId === -1 ? this.lastSessionData : undefined, autoSlot).then((success: boolean) => {
      if (success) {
        this.loaded = true;
        this.scene.ui.showText(i18next.t("menu:sessionSuccess"), null, () => this.end());
      } else {
        this.end();
      }
    }).catch(err => {
      console.error(err);
      this.scene.ui.showText(i18next.t("menu:failedToLoadSession"), null);
    });
  }

  initDailyRun(): void {
    this.scene.ui.setMode(Mode.SAVE_SLOT, SaveSlotUiMode.SAVE, (slotId: integer) => {
      this.scene.clearPhaseQueue();
      if (slotId === -1) {
        this.scene.pushPhase(new TitlePhase(this.scene));
        return super.end();
      }
      this.scene.sessionSlotId = slotId;

      const generateDaily = (seed: string) => {
        this.scene.gameMode = getGameMode(GameModes.DAILY);

        this.scene.setSeed(seed);
        this.scene.resetSeed(1);

        this.scene.money = this.scene.gameMode.getStartingMoney();

        const starters = getDailyRunStarters(this.scene, seed);
        const startingLevel = this.scene.gameMode.getStartingLevel();

        const party = this.scene.getParty();
        const loadPokemonAssets: Promise<void>[] = [];
        for (const starter of starters) {
          const starterProps = this.scene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
          const starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
          const starterGender = starter.species.malePercent !== null
            ? !starterProps.female ? Gender.MALE : Gender.FEMALE
            : Gender.GENDERLESS;
          const starterPokemon = this.scene.addPlayerPokemon(starter.species, startingLevel, starter.abilityIndex, starterFormIndex, starterGender, starterProps.shiny, starterProps.variant, undefined, starter.nature);
          starterPokemon.setVisible(false);
          party.push(starterPokemon);
          loadPokemonAssets.push(starterPokemon.loadAssets());
        }

        regenerateModifierPoolThresholds(party, ModifierPoolType.DAILY_STARTER);
        const modifiers: Modifier[] = Array(3).fill(null).map(() => modifierTypes.EXP_SHARE().withIdFromFunc(modifierTypes.EXP_SHARE).newModifier())
          .concat(Array(3).fill(null).map(() => modifierTypes.GOLDEN_EXP_CHARM().withIdFromFunc(modifierTypes.GOLDEN_EXP_CHARM).newModifier()))
          .concat(getDailyRunStarterModifiers(party))
          .filter((m) => m !== null);

        for (const m of modifiers) {
          this.scene.addModifier(m, true, false, false, true);
        }
        this.scene.updateModifiers(true, true);

        Promise.all(loadPokemonAssets).then(() => {
          this.scene.time.delayedCall(500, () => this.scene.playBgm());
          this.scene.gameData.gameStats.dailyRunSessionsPlayed++;
          this.scene.newArena(this.scene.gameMode.getStartingBiome(this.scene));
          this.scene.newBattle();
          this.scene.arena.init();
          this.scene.sessionPlayTime = 0;
          this.scene.lastSavePlayTime = 0;
          this.end();
        });
      };

      // If Online, calls seed fetch from db to generate daily run. If Offline, generates a daily run based on current date.
      if (!Utils.isLocal) {
        fetchDailyRunSeed().then(seed => {
          if (seed) {
            generateDaily(seed);
          } else {
            throw new Error("Daily run seed is null!");
          }
        }).catch(err => {
          console.error("Failed to load daily run:\n", err);
        });
      } else {
        generateDaily(btoa(new Date().toISOString().substring(0, 10)));
      }
    });
  }
  setupDaily(): void {
    // TODO
    var saves = this.getSaves()
    var saveNames = new Array(5).fill("")
    for (var i = 0; i < saves!.length; i++) {
      saveNames[saves![i][0]] = saves![i][1].description
    }
    const ui = this.scene.ui
    const confirmSlot = (message: string, slotFilter: (i: integer) => boolean, callback: (i: integer) => void) => {
      ui.revertMode();
      ui.showText(message, null, () => {
        const config: OptionSelectConfig = {
          options: new Array(5).fill(null).map((_, i) => i).filter(slotFilter).map(i => {
            return {
              label: (i+1) + " " + saveNames[i],
              handler: () => {
                callback(i);
                ui.revertMode();
                ui.showText("", 0);
                return true;
              }
            };
          }).concat([{
            label: i18next.t("menuUiHandler:cancel"),
            handler: () => {
              ui.revertMode();
              ui.showText("", 0);
              return true;
            }
          }]),
          xOffset: 98
        };
        ui.setOverlayMode(Mode.MENU_OPTION_SELECT, config);
      });
    };
    ui.showText("This feature is incomplete.", null, () => {
      this.scene.clearPhaseQueue();
      this.scene.pushPhase(new TitlePhase(this.scene));
      super.end();
      return true;
    })
    return;
    confirmSlot("Select a slot to replace.", () => true, slotId => this.scene.gameData.importData(GameDataType.SESSION, slotId));
  }
  end(): void {
    this.scene.biomeChangeMode = false
    if (!this.loaded && !this.scene.gameMode.isDaily) {
      this.scene.arena.preloadBgm();
      this.scene.gameMode = getGameMode(this.gameMode);
      if (this.gameMode === GameModes.CHALLENGE) {
        this.scene.pushPhase(new SelectChallengePhase(this.scene));
      } else {
        this.scene.pushPhase(new SelectStarterPhase(this.scene));
      }
      this.scene.newArena(this.scene.gameMode.getStartingBiome(this.scene));
    } else {
      this.scene.playBgm();
    }

    this.scene.pushPhase(new EncounterPhase(this.scene, this.loaded));

    if (this.loaded) {
      const availablePartyMembers = this.scene.getParty().filter(p => p.isAllowedInBattle()).length;

      this.scene.pushPhase(new SummonPhase(this.scene, 0, true, true));
      if (this.scene.currentBattle.double && availablePartyMembers > 1) {
        this.scene.pushPhase(new SummonPhase(this.scene, 1, true, true));
      }

      if (this.scene.currentBattle.battleType !== BattleType.TRAINER && (this.scene.currentBattle.waveIndex > 1 || !this.scene.gameMode.isDaily)) {
        const minPartySize = this.scene.currentBattle.double ? 2 : 1;
        if (availablePartyMembers > minPartySize) {
          this.scene.pushPhase(new CheckSwitchPhase(this.scene, 0, this.scene.currentBattle.double));
          if (this.scene.currentBattle.double) {
            this.scene.pushPhase(new CheckSwitchPhase(this.scene, 1, this.scene.currentBattle.double));
          }
        }
      }
    }

    for (const achv of Object.keys(this.scene.gameData.achvUnlocks)) {
      if (vouchers.hasOwnProperty(achv)) {
        this.scene.validateVoucher(vouchers[achv]);
      }
    }

    super.end();
  }
}
//#endregion





//#region 04 UnavailablePhase
export class UnavailablePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    this.scene.ui.setMode(Mode.UNAVAILABLE, () => {
      this.scene.unshiftPhase(new LoginPhase(this.scene, true));
      this.end();
    });
  }
}
//#endregion





//#region 05 ReloadSessionPhase
export class ReloadSessionPhase extends Phase {
  private systemDataStr: string | null;

  constructor(scene: BattleScene, systemDataStr?: string) {
    super(scene);

    this.systemDataStr = systemDataStr ?? null;
  }

  start(): void {
    this.scene.ui.setMode(Mode.SESSION_RELOAD);

    let delayElapsed = false;
    let loaded = false;

    this.scene.time.delayedCall(Utils.fixedInt(1500), () => {
      if (loaded) {
        this.end();
      } else {
        delayElapsed = true;
      }
    });

    this.scene.gameData.clearLocalData();

    (this.systemDataStr ? this.scene.gameData.initSystem(this.systemDataStr) : this.scene.gameData.loadSystem()).then(() => {
      if (delayElapsed) {
        this.end();
      } else {
        loaded = true;
      }
    });
  }
}
//#endregion





//#region 06 OutdatedPhase
export class OutdatedPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    this.scene.ui.setMode(Mode.OUTDATED);
  }
}
//#endregion





//#region 07 SelectGenderPhase
export class SelectGenderPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    super.start();

    this.scene.ui.showText(i18next.t("menu:boyOrGirl"), null, () => {
      this.scene.ui.setMode(Mode.OPTION_SELECT, {
        options: [
          {
            label: i18next.t("settings:boy"),
            handler: () => {
              this.scene.gameData.gender = PlayerGender.MALE;
              this.scene.gameData.saveSetting(SettingKeys.Player_Gender, 0);
              this.scene.gameData.saveSystem().then(() => this.end());
              return true;
            }
          },
          {
            label: i18next.t("settings:girl"),
            handler: () => {
              this.scene.gameData.gender = PlayerGender.FEMALE;
              this.scene.gameData.saveSetting(SettingKeys.Player_Gender, 1);
              this.scene.gameData.saveSystem().then(() => this.end());
              return true;
            }
          }
        ]
      });
    });
  }

  end(): void {
    this.scene.ui.setMode(Mode.MESSAGE);
    super.end();
  }
}
//#endregion





//#region 08 SelectChallengePhase
export class SelectChallengePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.playBgm("menu");

    this.scene.ui.setMode(Mode.CHALLENGE_SELECT);
  }
}
//#endregion





//#region 09 SelectStarterPhase
export class SelectStarterPhase extends Phase {

  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.playBgm("menu");

    this.scene.ui.setMode(Mode.STARTER_SELECT, (starters: Starter[]) => {
      this.scene.ui.clearText();
      this.scene.ui.setMode(Mode.SAVE_SLOT, SaveSlotUiMode.SAVE, (slotId: integer) => {
        if (slotId === -1) {
          this.scene.clearPhaseQueue();
          this.scene.pushPhase(new TitlePhase(this.scene));
          return this.end();
        }
        this.scene.sessionSlotId = slotId;
        this.initBattle(starters);
      });
    });
  }

  /**
   * Initialize starters before starting the first battle
   * @param starters {@linkcode Pokemon} with which to start the first battle
   */
  initBattle(starters: Starter[]) {
    const party = this.scene.getParty();
    const loadPokemonAssets: Promise<void>[] = [];
    starters.forEach((starter: Starter, i: integer) => {
      if (!i && Overrides.STARTER_SPECIES_OVERRIDE) {
        starter.species = getPokemonSpecies(Overrides.STARTER_SPECIES_OVERRIDE as Species);
      }
      const starterProps = this.scene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
      let starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
      if (
        starter.species.speciesId in Overrides.STARTER_FORM_OVERRIDES &&
        starter.species.forms[Overrides.STARTER_FORM_OVERRIDES[starter.species.speciesId]!]
      ) {
        starterFormIndex = Overrides.STARTER_FORM_OVERRIDES[starter.species.speciesId]!;
      }

      let starterGender = starter.species.malePercent !== null
        ? !starterProps.female ? Gender.MALE : Gender.FEMALE
        : Gender.GENDERLESS;
      if (Overrides.GENDER_OVERRIDE !== null) {
        starterGender = Overrides.GENDER_OVERRIDE;
      }
      const starterIvs = this.scene.gameData.dexData[starter.species.speciesId].ivs.slice(0);
      const starterPokemon = this.scene.addPlayerPokemon(starter.species, this.scene.gameMode.getStartingLevel(), starter.abilityIndex, starterFormIndex, starterGender, starterProps.shiny, starterProps.variant, starterIvs, starter.nature);
      starter.moveset && starterPokemon.tryPopulateMoveset(starter.moveset);
      if (starter.passive) {
        starterPokemon.passive = true;
      }
      starterPokemon.luck = this.scene.gameData.getDexAttrLuck(this.scene.gameData.dexData[starter.species.speciesId].caughtAttr);
      if (starter.pokerus) {
        starterPokemon.pokerus = true;
      }

      if (starter.nickname) {
        starterPokemon.nickname = starter.nickname;
      }

      if (this.scene.gameMode.isSplicedOnly) {
        starterPokemon.generateFusionSpecies(true);
      }
      starterPokemon.setVisible(false);
      applyChallenges(this.scene.gameMode, ChallengeType.STARTER_MODIFY, starterPokemon);
      party.push(starterPokemon);
      loadPokemonAssets.push(starterPokemon.loadAssets());
    });
    overrideModifiers(this.scene);
    overrideHeldItems(this.scene, party[0]);
    Promise.all(loadPokemonAssets).then(() => {
      SoundFade.fadeOut(this.scene, this.scene.sound.get("menu"), 500, true);
      this.scene.time.delayedCall(500, () => this.scene.playBgm());
      if (this.scene.gameMode.isClassic) {
        this.scene.gameData.gameStats.classicSessionsPlayed++;
      } else {
        this.scene.gameData.gameStats.endlessSessionsPlayed++;
      }
      this.scene.newBattle();
      this.scene.arena.init();
      this.scene.sessionPlayTime = 0;
      this.scene.lastSavePlayTime = 0;
      // Ensures Keldeo (or any future Pokemon that have this type of form change) starts in the correct form
      this.scene.getParty().forEach((p: PlayerPokemon) => {
        this.scene.triggerPokemonFormChange(p, SpeciesFormChangeMoveLearnedTrigger);
      });
      this.end();
    });
  }
}
//#endregion





//#region 10 BattlePhase
export class BattlePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  showEnemyTrainer(trainerSlot: TrainerSlot = TrainerSlot.NONE): void {
    const sprites = this.scene.currentBattle.trainer?.getSprites()!; // TODO: is this bang correct?
    const tintSprites = this.scene.currentBattle.trainer?.getTintSprites()!; // TODO: is this bang correct?
    for (let i = 0; i < sprites.length; i++) {
      const visible = !trainerSlot || !i === (trainerSlot === TrainerSlot.TRAINER) || sprites.length < 2;
      [sprites[i], tintSprites[i]].map(sprite => {
        if (visible) {
          sprite.x = trainerSlot || sprites.length < 2 ? 0 : i ? 16 : -16;
        }
        sprite.setVisible(visible);
        sprite.clearTint();
      });
      sprites[i].setVisible(visible);
      tintSprites[i].setVisible(visible);
      sprites[i].clearTint();
      tintSprites[i].clearTint();
    }
    this.scene.tweens.add({
      targets: this.scene.currentBattle.trainer,
      x: "-=16",
      y: "+=16",
      alpha: 1,
      ease: "Sine.easeInOut",
      duration: 750
    });
  }

  hideEnemyTrainer(): void {
    this.scene.tweens.add({
      targets: this.scene.currentBattle.trainer,
      x: "+=16",
      y: "-=16",
      alpha: 0,
      ease: "Sine.easeInOut",
      duration: 750
    });
  }
}
//#endregion





//#region 11 FieldPhase
type PokemonFunc = (pokemon: Pokemon) => void;
export abstract class FieldPhase extends BattlePhase {
  getOrder(): BattlerIndex[] {
    const playerField = this.scene.getPlayerField().filter(p => p.isActive()) as Pokemon[];
    const enemyField = this.scene.getEnemyField().filter(p => p.isActive()) as Pokemon[];

    // We shuffle the list before sorting so speed ties produce random results
    let orderedTargets: Pokemon[] = playerField.concat(enemyField);
    // We seed it with the current turn to prevent an inconsistency where it
    // was varying based on how long since you last reloaded
    this.scene.executeWithSeedOffset(() => {
      orderedTargets = Utils.randSeedShuffle(orderedTargets);
    }, this.scene.currentBattle.turn, this.scene.waveSeed);

    orderedTargets.sort((a: Pokemon, b: Pokemon) => {
      const aSpeed = a?.getBattleStat(Stat.SPD) || 0;
      const bSpeed = b?.getBattleStat(Stat.SPD) || 0;

      return bSpeed - aSpeed;
    });

    const speedReversed = new Utils.BooleanHolder(false);
    this.scene.arena.applyTags(TrickRoomTag, speedReversed);

    if (speedReversed.value) {
      orderedTargets = orderedTargets.reverse();
    }

    return orderedTargets.map(t => t.getFieldIndex() + (!t.isPlayer() ? BattlerIndex.ENEMY : 0));
  }

  executeForAll(func: PokemonFunc): void {
    const field = this.scene.getField(true).filter(p => p.summonData);
    field.forEach(pokemon => func(pokemon));
  }
}
//#endregion





//#region 12 PokemonPhase
export abstract class PokemonPhase extends FieldPhase {
  protected battlerIndex: BattlerIndex | integer;
  public player: boolean;
  public fieldIndex: integer;

  constructor(scene: BattleScene, battlerIndex?: BattlerIndex | integer) {
    super(scene);

    if (battlerIndex === undefined) {
      battlerIndex = scene.getField().find(p => p?.isActive())!.getBattlerIndex(); // TODO: is the bang correct here?
    }

    this.battlerIndex = battlerIndex;
    this.player = battlerIndex < 2;
    this.fieldIndex = battlerIndex % 2;
  }

  getPokemon(): Pokemon {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return this.scene.getPokemonById(this.battlerIndex)!; //TODO: is this bang correct?
    }
    return this.scene.getField()[this.battlerIndex]!; //TODO: is this bang correct?
  }
}
//#endregion





//#region 13 PartyMembPkmn
export abstract class PartyMemberPokemonPhase extends FieldPhase {
  protected partyMemberIndex: integer;
  protected fieldIndex: integer;
  protected player: boolean;

  constructor(scene: BattleScene, partyMemberIndex: integer, player: boolean) {
    super(scene);

    this.partyMemberIndex = partyMemberIndex;
    this.fieldIndex = partyMemberIndex < this.scene.currentBattle.getBattlerCount()
      ? partyMemberIndex
      : -1;
    this.player = player;
  }

  getParty(): Pokemon[] {
    return this.player ? this.scene.getParty() : this.scene.getEnemyParty();
  }

  getPokemon(): Pokemon {
    return this.getParty()[this.partyMemberIndex];
  }
}
//#endregion





//#region 14 PlayerPartyMemberPokemonPhase
export abstract class PlayerPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, partyMemberIndex, true);
  }

  getPlayerPokemon(): PlayerPokemon {
    return super.getPokemon() as PlayerPokemon;
  }
}
//#endregion





//#region 15 EnemyPartyMemberPokemonPhase
export abstract class EnemyPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, partyMemberIndex, false);
  }

  getEnemyPokemon(): EnemyPokemon {
    return super.getPokemon() as EnemyPokemon;
  }
}
//#endregion





//#region 16 EncounterPhase
export class EncounterPhase extends BattlePhase {
  private loaded: boolean;

  constructor(scene: BattleScene, loaded?: boolean) {
    super(scene);

    this.loaded = !!loaded;
  }

  start() {
    super.start();

    this.scene.updateGameInfo();

    this.scene.initSession();

    this.scene.eventTarget.dispatchEvent(new EncounterPhaseEvent());

    // Failsafe if players somehow skip floor 200 in classic mode
    if (this.scene.gameMode.isClassic && this.scene.currentBattle.waveIndex > 200) {
      this.scene.unshiftPhase(new GameOverPhase(this.scene));
    }

    const loadEnemyAssets: Promise<void>[] = [];

    const battle = this.scene.currentBattle;

    let totalBst = 0;

    while (LoggerTools.rarities.length > 0) {
      LoggerTools.rarities.pop()
    }
    LoggerTools.rarityslot[0] = 0
    //console.log(this.scene.gameMode.getDailyOverride())
    battle.enemyLevels?.forEach((level, e) => {
      if (!this.loaded) {
        if (battle.battleType === BattleType.TRAINER) {
          battle.enemyParty[e] = battle.trainer?.genPartyMember(e)!; // TODO:: is the bang correct here?
        } else {
          LoggerTools.rarityslot[0] = e
          const enemySpecies = this.scene.randomSpecies(battle.waveIndex, level, true);
          battle.enemyParty[e] = this.scene.addEnemyPokemon(enemySpecies, level, TrainerSlot.NONE, !!this.scene.getEncounterBossSegments(battle.waveIndex, level, enemySpecies));
          if (this.scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
            battle.enemyParty[e].ivs = new Array(6).fill(31);
          }
          this.scene.getParty().slice(0, !battle.double ? 1 : 2).reverse().forEach(playerPokemon => {
            applyAbAttrs(SyncEncounterNatureAbAttr, playerPokemon, null, battle.enemyParty[e]);
          });
        }
      }
      const enemyPokemon = this.scene.getEnemyParty()[e];
      if (e < (battle.double ? 2 : 1)) {
        enemyPokemon.setX(-66 + enemyPokemon.getFieldPositionOffset()[0]);
        enemyPokemon.resetSummonData();
      }

      if (!this.loaded) {
        this.scene.gameData.setPokemonSeen(enemyPokemon, true, battle.battleType === BattleType.TRAINER);
      }

      if (enemyPokemon.species.speciesId === Species.ETERNATUS) {
        if (this.scene.gameMode.isClassic && (battle.battleSpec === BattleSpec.FINAL_BOSS || this.scene.gameMode.isWaveFinal(battle.waveIndex))) {
          if (battle.battleSpec !== BattleSpec.FINAL_BOSS) {
            enemyPokemon.formIndex = 1;
            enemyPokemon.updateScale();
          }
          enemyPokemon.setBoss();
        } else if (!(battle.waveIndex % 1000)) {
          enemyPokemon.formIndex = 1;
          enemyPokemon.updateScale();
          const bossMBH = this.scene.findModifier(m => m instanceof TurnHeldItemTransferModifier && m.pokemonId === enemyPokemon.id, false) as TurnHeldItemTransferModifier;
          this.scene.removeModifier(bossMBH!);
          bossMBH?.setTransferrableFalse();
          this.scene.addEnemyModifier(bossMBH!);
        }
      }

      totalBst += enemyPokemon.getSpeciesForm().baseTotal;

      loadEnemyAssets.push(enemyPokemon.loadAssets());

      console.log(getPokemonNameWithAffix(enemyPokemon), enemyPokemon.species.speciesId, enemyPokemon.stats);
    });
    console.log(LoggerTools.rarities)

    if (this.scene.getParty().filter(p => p.isShiny()).length === 6) {
      this.scene.validateAchv(achvs.SHINY_PARTY);
    }

    if (battle.battleType === BattleType.TRAINER) {
      loadEnemyAssets.push(battle.trainer?.loadAssets().then(() => battle.trainer?.initSprite())!); // TODO: is this bang correct?
    } else {
      // This block only applies for double battles to init the boss segments (idk why it's split up like this)
      if (battle.enemyParty.filter(p => p.isBoss()).length > 1) {
        for (const enemyPokemon of battle.enemyParty) {
          // If the enemy pokemon is a boss and wasn't populated from data source, then set it up
          if (enemyPokemon.isBoss() && !enemyPokemon.isPopulatedFromDataSource) {
            enemyPokemon.setBoss(true, Math.ceil(enemyPokemon.bossSegments * (enemyPokemon.getSpeciesForm().baseTotal / totalBst)));
            enemyPokemon.initBattleInfo();
          }
        }
      }
    }

    Promise.all(loadEnemyAssets).then(() => {
      battle.enemyParty.forEach((enemyPokemon, e) => {
        if (e < (battle.double ? 2 : 1)) {
          if (battle.battleType === BattleType.WILD) {
            this.scene.field.add(enemyPokemon);
            battle.seenEnemyPartyMemberIds.add(enemyPokemon.id);
            const playerPokemon = this.scene.getPlayerPokemon();
            if (playerPokemon?.visible) {
              this.scene.field.moveBelow(enemyPokemon as Pokemon, playerPokemon);
            }
            enemyPokemon.tint(0, 0.5);
          } else if (battle.battleType === BattleType.TRAINER) {
            enemyPokemon.setVisible(false);
            this.scene.currentBattle.trainer?.tint(0, 0.5);
          }
          if (battle.double) {
            enemyPokemon.setFieldPosition(e ? FieldPosition.RIGHT : FieldPosition.LEFT);
          }
        }
      });

      if (!this.loaded) {
        regenerateModifierPoolThresholds(this.scene.getEnemyField(), battle.battleType === BattleType.TRAINER ? ModifierPoolType.TRAINER : ModifierPoolType.WILD);
        this.scene.generateEnemyModifiers();
      }

      this.scene.ui.setMode(Mode.MESSAGE).then(() => {
        if (!this.loaded) {
          //@ts-ignore
          this.scene.gameData.saveAll(this.scene, true, battle.waveIndex % 10 === 1 || this.scene.lastSavePlayTime >= 300).then(success => { // TODO: get rid of ts-ignore
            this.scene.disableMenu = false;
            if (!success) {
              return this.scene.reset(true);
            }
            this.doEncounter();
          });
        } else {
          this.doEncounter();
        }
      });
    });
  }

  doEncounter() {
    this.scene.playBgm(undefined, true);
    this.scene.updateModifiers(false);
    this.scene.setFieldScale(1);

    /*if (startingWave > 10) {
      for (let m = 0; m < Math.min(Math.floor(startingWave / 10), 99); m++)
        this.scene.addModifier(getPlayerModifierTypeOptionsForWave((m + 1) * 10, 1, this.scene.getParty())[0].type.newModifier(), true);
      this.scene.updateModifiers(true);
    }*/

    for (const pokemon of this.scene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    if (!this.loaded) {
      this.scene.arena.trySetWeather(getRandomWeatherType(this.scene.arena), false);
    }

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [this.scene.arenaEnemy, this.scene.currentBattle.trainer, enemyField, this.scene.arenaPlayer, this.scene.trainer].flat(),
      x: (_target, _key, value, fieldIndex: integer) => fieldIndex < 2 + (enemyField.length) ? value + 300 : value - 300,
      duration: 2000,
      onComplete: () => {
        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });
  }

  getEncounterMessage(): string {
    const enemyField = this.scene.getEnemyField();

    if (this.scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      return i18next.t("battle:bossAppeared", { bossName: getPokemonNameWithAffix(enemyField[0])});
    }

    if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
      if (this.scene.currentBattle.double) {
        return i18next.t("battle:trainerAppearedDouble", { trainerName: this.scene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) });

      } else {
        return i18next.t("battle:trainerAppeared", { trainerName: this.scene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) });
      }
    }

    return enemyField.length === 1
      ? i18next.t("battle:singleWildAppeared", { pokemonName: enemyField[0].getNameToRender() })
      : i18next.t("battle:multiWildAppeared", { pokemonName1: enemyField[0].getNameToRender(), pokemonName2: enemyField[1].getNameToRender() });
  }

  doEncounterCommon(showEncounterMessage: boolean = true) {
    const enemyField = this.scene.getEnemyField();

    //LoggerTools.resetWave(this.scene, this.scene.currentBattle.waveIndex)
    if (this.scene.lazyReloads) {
      LoggerTools.flagResetIfExists(this.scene)
    }
    LoggerTools.logTeam(this.scene, this.scene.currentBattle.waveIndex)
    if (this.scene.getEnemyParty()[0].hasTrainer()) {
      LoggerTools.logTrainer(this.scene, this.scene.currentBattle.waveIndex)
    }
    if (this.scene.currentBattle.waveIndex == 1) {
      LoggerTools.logPlayerTeam(this.scene)
      if (this.scene.gameMode.modeId == GameModes.DAILY && this.scene.disableDailyShinies) {
        this.scene.getParty().forEach(p => {
          p.species.luckOverride = 0; // Disable shiny luck for party members
        })
      }
    }
    LoggerTools.resetWaveActions(this.scene, undefined, true)

    //this.scene.doShinyCheck()

    if (LoggerTools.autoCheckpoints.includes(this.scene.currentBattle.waveIndex)) {
      //this.scene.gameData.saveGameToAuto(this.scene)
    }

    if (this.scene.currentBattle.battleType === BattleType.WILD) {
      enemyField.forEach(enemyPokemon => {
        enemyPokemon.untint(100, "Sine.easeOut");
        enemyPokemon.cry();
        enemyPokemon.showInfo();
        if (enemyPokemon.isShiny()) {
          this.scene.validateAchv(achvs.SEE_SHINY);
        }
      });
      this.scene.updateFieldScale();
      if (showEncounterMessage) {
        this.scene.ui.showText(this.getEncounterMessage(), null, () => this.end(), 1500);
      } else {
        this.end();
      }
    } else if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
      const trainer = this.scene.currentBattle.trainer;
      trainer?.untint(100, "Sine.easeOut");
      trainer?.playAnim();

      const doSummon = () => {
        this.scene.currentBattle.started = true;
        this.scene.playBgm(undefined);
        this.scene.pbTray.showPbTray(this.scene.getParty());
        this.scene.pbTrayEnemy.showPbTray(this.scene.getEnemyParty());
        const doTrainerSummon = () => {
          this.hideEnemyTrainer();
          const availablePartyMembers = this.scene.getEnemyParty().filter(p => !p.isFainted()).length;
          this.scene.unshiftPhase(new SummonPhase(this.scene, 0, false));
          if (this.scene.currentBattle.double && availablePartyMembers > 1) {
            this.scene.unshiftPhase(new SummonPhase(this.scene, 1, false));
          }
          this.end();
        };
        if (showEncounterMessage) {
          this.scene.ui.showText(this.getEncounterMessage(), null, doTrainerSummon, 1500, true);
        } else {
          doTrainerSummon();
        }
      };

      const encounterMessages = this.scene.currentBattle.trainer?.getEncounterMessages();

      if (!encounterMessages?.length) {
        doSummon();
      } else {
        let message: string;
        this.scene.executeWithSeedOffset(() => message = Utils.randSeedItem(encounterMessages), this.scene.currentBattle.waveIndex);
        message = message!; // tell TS compiler it's defined now
        const showDialogueAndSummon = () => {
          this.scene.ui.showDialogue(message, trainer?.getName(TrainerSlot.NONE, true), null, () => {
            this.scene.charSprite.hide().then(() => this.scene.hideFieldOverlay(250).then(() => doSummon()));
          });
        };
        if (this.scene.currentBattle.trainer?.config.hasCharSprite && !this.scene.ui.shouldSkipDialogue(message)) {
          this.scene.showFieldOverlay(500).then(() => this.scene.charSprite.showCharacter(trainer?.getKey()!, getCharVariantFromDialogue(encounterMessages[0])).then(() => showDialogueAndSummon())); // TODO: is this bang correct?
        } else {
          showDialogueAndSummon();
        }
      }
    }
  }

  end() {
    const enemyField = this.scene.getEnemyField();

    enemyField.forEach((enemyPokemon, e) => {
      if (enemyPokemon.isShiny()) {
        this.scene.unshiftPhase(new ShinySparklePhase(this.scene, BattlerIndex.ENEMY + e));
      }
    });

    if (this.scene.currentBattle.battleType !== BattleType.TRAINER) {
      enemyField.map(p => this.scene.pushConditionalPhase(new PostSummonPhase(this.scene, p.getBattlerIndex()), () => {
        // if there is not a player party, we can't continue
        if (!this.scene.getParty()?.length) {
          return false;
        }
        // how many player pokemon are on the field ?
        const pokemonsOnFieldCount = this.scene.getParty().filter(p => p.isOnField()).length;
        // if it's a 2vs1, there will never be a 2nd pokemon on our field even
        const requiredPokemonsOnField = Math.min(this.scene.getParty().filter((p) => !p.isFainted()).length, 2);
        // if it's a double, there should be 2, otherwise 1
        if (this.scene.currentBattle.double) {
          return pokemonsOnFieldCount === requiredPokemonsOnField;
        }
        return pokemonsOnFieldCount === 1;
      }));
      const ivScannerModifier = this.scene.findModifier(m => m instanceof IvScannerModifier);
      if (ivScannerModifier) {
        enemyField.map(p => this.scene.pushPhase(new ScanIvsPhase(this.scene, p.getBattlerIndex(), Math.min(ivScannerModifier.getStackCount() * 2, 6))));
      }
    }

    if (!this.loaded) {
      const availablePartyMembers = this.scene.getParty().filter(p => p.isAllowedInBattle());

      if (!availablePartyMembers[0].isOnField()) {
        this.scene.pushPhase(new SummonPhase(this.scene, 0));
      }

      if (this.scene.currentBattle.double) {
        if (availablePartyMembers.length > 1) {
          this.scene.pushPhase(new ToggleDoublePositionPhase(this.scene, true));
          if (!availablePartyMembers[1].isOnField()) {
            this.scene.pushPhase(new SummonPhase(this.scene, 1));
          }
        }
      } else {
        if (availablePartyMembers.length > 1 && availablePartyMembers[1].isOnField()) {
          this.scene.pushPhase(new ReturnPhase(this.scene, 1));
        }
        this.scene.pushPhase(new ToggleDoublePositionPhase(this.scene, false));
      }

      if (this.scene.currentBattle.battleType !== BattleType.TRAINER && (this.scene.currentBattle.waveIndex > 1 || !this.scene.gameMode.isDaily)) {
        const minPartySize = this.scene.currentBattle.double ? 2 : 1;
        if (availablePartyMembers.length > minPartySize) {
          this.scene.pushPhase(new CheckSwitchPhase(this.scene, 0, this.scene.currentBattle.double));
          if (this.scene.currentBattle.double) {
            this.scene.pushPhase(new CheckSwitchPhase(this.scene, 1, this.scene.currentBattle.double));
          }
        }
      }
    }
    handleTutorial(this.scene, Tutorial.Access_Menu).then(() => {
      // Auto-show the flyout
      if (this.scene.currentBattle.battleType !== BattleType.TRAINER) {
        this.scene.arenaFlyout.display2()
        this.scene.arenaFlyout.toggleFlyout(true)
        this.scene.arenaFlyout.isAuto = true
      }
      super.end()
    });
  }

  tryOverrideForBattleSpec(): boolean {
    switch (this.scene.currentBattle.battleSpec) {
    case BattleSpec.FINAL_BOSS:
      const enemy = this.scene.getEnemyPokemon();
      this.scene.ui.showText(this.getEncounterMessage(), null, () => {
        const count = 5643853 + this.scene.gameData.gameStats.classicSessionsPlayed;
        //The two lines below check if English ordinals (1st, 2nd, 3rd, Xth) are used and determine which one to use.
        //Otherwise, it defaults to an empty string.
        //As of 08-07-24: Spanish and Italian default to the English translations
        const ordinalUse = ["en", "es", "it"];
        const currentLanguage = i18next.resolvedLanguage ?? "en";
        const ordinalIndex = (ordinalUse.includes(currentLanguage)) ? ["st", "nd", "rd"][((count + 90) % 100 - 10) % 10 - 1] ?? "th" : "";
        const cycleCount = count.toLocaleString() + ordinalIndex;
        const encounterDialogue = i18next.t(`${(this.scene.gameData.gender === PlayerGender.FEMALE) ? "PGF" : "PGM"}battleSpecDialogue:encounter`, {cycleCount: cycleCount});
        this.scene.ui.showDialogue(encounterDialogue, enemy?.species.name, null, () => {
          this.doEncounterCommon(false);
        });
      }, 1500, true);
      return true;
    }

    return false;
  }
}
//#endregion





//#region 17 NextEncounterPhase
export class NextEncounterPhase extends EncounterPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();
  }

  doEncounter(): void {
    this.scene.playBgm(undefined, true);

    for (const pokemon of this.scene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    this.scene.arenaNextEnemy.setBiome(this.scene.arena.biomeType);
    this.scene.arenaNextEnemy.setVisible(true);

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [this.scene.arenaEnemy, this.scene.arenaNextEnemy, this.scene.currentBattle.trainer, enemyField, this.scene.lastEnemyTrainer].flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        this.scene.arenaEnemy.setBiome(this.scene.arena.biomeType);
        this.scene.arenaEnemy.setX(this.scene.arenaNextEnemy.x);
        this.scene.arenaEnemy.setAlpha(1);
        this.scene.arenaNextEnemy.setX(this.scene.arenaNextEnemy.x - 300);
        this.scene.arenaNextEnemy.setVisible(false);
        if (this.scene.lastEnemyTrainer) {
          this.scene.lastEnemyTrainer.destroy();
        }

        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });
  }
}
//#endregion





//#region 18 NewBiomeEncounterPhase
export class NewBiomeEncounterPhase extends NextEncounterPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  doEncounter(): void {
    this.scene.playBgm(undefined, true);

    for (const pokemon of this.scene.getParty()) {
      if (pokemon) {
        pokemon.resetBattleData();
      }
    }

    this.scene.arena.trySetWeather(getRandomWeatherType(this.scene.arena), false);

    for (const pokemon of this.scene.getParty().filter(p => p.isOnField())) {
      applyAbAttrs(PostBiomeChangeAbAttr, pokemon, null);
    }

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [this.scene.arenaEnemy, enemyField].flat(),
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        if (!this.tryOverrideForBattleSpec()) {
          this.doEncounterCommon();
        }
      }
    });
  }
}
//#endregion





//#region 19 PostSummonPhase
export class PostSummonPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (pokemon.status?.effect === StatusEffect.TOXIC) {
      pokemon.status.turnCount = 0;
    }
    this.scene.arena.applyTags(ArenaTrapTag, pokemon);
    applyPostSummonAbAttrs(PostSummonAbAttr, pokemon).then(() => this.end());
  }
}
//#endregion





//#region 20 SelectBiomePh.
export class SelectBiomePhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const currentBiome = this.scene.arena.biomeType;

    const setNextBiome = (nextBiome: Biome) => {
      if (this.scene.currentBattle.waveIndex % 10 === 1) {
        this.scene.applyModifiers(MoneyInterestModifier, true, this.scene);
        this.scene.unshiftPhase(new PartyHealPhase(this.scene, false));
      }
      this.scene.unshiftPhase(new SwitchBiomePhase(this.scene, nextBiome));
      this.end();
    };

    if ((this.scene.gameMode.isClassic && this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex + 9))
      || (this.scene.gameMode.isDaily && this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex))
      || (this.scene.gameMode.hasShortBiomes && !(this.scene.currentBattle.waveIndex % 50))) {
      setNextBiome(Biome.END);
    } else if (this.scene.gameMode.hasRandomBiomes) {
      setNextBiome(this.generateNextBiome());
    } else if (Array.isArray(biomeLinks[currentBiome])) {
      let biomes: Biome[] = [];
      this.scene.executeWithSeedOffset(() => {
        biomes = (biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
          .filter(b => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
          .map(b => !Array.isArray(b) ? b : b[0]);
      }, this.scene.currentBattle.waveIndex);
      if (biomes.length > 1 && this.scene.findModifier(m => m instanceof MapModifier)) {
        let biomeChoices: Biome[] = [];
        this.scene.executeWithSeedOffset(() => {
          biomeChoices = (!Array.isArray(biomeLinks[currentBiome])
            ? [biomeLinks[currentBiome] as Biome]
            : biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
            .filter((b, i) => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
            .map(b => Array.isArray(b) ? b[0] : b);
        }, this.scene.currentBattle.waveIndex);
        const biomeSelectItems = biomeChoices.map(b => {
          const ret: OptionSelectItem = {
            label: getBiomeName(b),
            handler: () => {
              this.scene.ui.setMode(Mode.MESSAGE);
              setNextBiome(b);
              return true;
            }
          };
          return ret;
        });
        this.scene.ui.setMode(Mode.OPTION_SELECT, {
          options: biomeSelectItems,
          delay: 1000
        });
      } else {
        setNextBiome(biomes[Utils.randSeedInt(biomes.length)]);
      }
    } else if (biomeLinks.hasOwnProperty(currentBiome)) {
      setNextBiome(biomeLinks[currentBiome] as Biome);
    } else {
      setNextBiome(this.generateNextBiome());
    }
  }

  generateNextBiome(): Biome {
    if (!(this.scene.currentBattle.waveIndex % 50)) {
      return Biome.END;
    }
    return this.scene.generateRandomBiome(this.scene.currentBattle.waveIndex);
  }
}
//#endregion





//#region 21 SwitchBiomePhase
export class SwitchBiomePhase extends BattlePhase {
  private nextBiome: Biome;

  constructor(scene: BattleScene, nextBiome: Biome) {
    super(scene);

    this.nextBiome = nextBiome;
  }

  start() {
    super.start();

    if (this.nextBiome === undefined) {
      return this.end();
    }

    this.scene.tweens.add({
      targets: [this.scene.arenaEnemy, this.scene.lastEnemyTrainer],
      x: "+=300",
      duration: 2000,
      onComplete: () => {
        this.scene.arenaEnemy.setX(this.scene.arenaEnemy.x - 600);

        this.scene.newArena(this.nextBiome);

        const biomeKey = getBiomeKey(this.nextBiome);
        const bgTexture = `${biomeKey}_bg`;
        this.scene.arenaBgTransition.setTexture(bgTexture);
        this.scene.arenaBgTransition.setAlpha(0);
        this.scene.arenaBgTransition.setVisible(true);
        this.scene.arenaPlayerTransition.setBiome(this.nextBiome);
        this.scene.arenaPlayerTransition.setAlpha(0);
        this.scene.arenaPlayerTransition.setVisible(true);

        this.scene.tweens.add({
          targets: [this.scene.arenaPlayer, this.scene.arenaBgTransition, this.scene.arenaPlayerTransition],
          duration: 1000,
          delay: 1000,
          ease: "Sine.easeInOut",
          alpha: (target: any) => target === this.scene.arenaPlayer ? 0 : 1,
          onComplete: () => {
            this.scene.arenaBg.setTexture(bgTexture);
            this.scene.arenaPlayer.setBiome(this.nextBiome);
            this.scene.arenaPlayer.setAlpha(1);
            this.scene.arenaEnemy.setBiome(this.nextBiome);
            this.scene.arenaEnemy.setAlpha(1);
            this.scene.arenaNextEnemy.setBiome(this.nextBiome);
            this.scene.arenaBgTransition.setVisible(false);
            this.scene.arenaPlayerTransition.setVisible(false);
            if (this.scene.lastEnemyTrainer) {
              this.scene.lastEnemyTrainer.destroy();
            }

            this.end();
          }
        });
      }
    });
  }
}
//#endregion





//#region 22 SummonPhase
export class SummonPhase extends PartyMemberPokemonPhase {
  private loaded: boolean;

  constructor(scene: BattleScene, fieldIndex: integer, player: boolean = true, loaded: boolean = false) {
    super(scene, fieldIndex, player);

    this.loaded = loaded;
  }

  start() {
    super.start();

    this.preSummon();
  }

  /**
  * Sends out a Pokemon before the battle begins and shows the appropriate messages
  */
  preSummon(): void {
    const partyMember = this.getPokemon();
    // If the Pokemon about to be sent out is fainted or illegal under a challenge, switch to the first non-fainted legal Pokemon
    if (!partyMember.isAllowedInBattle()) {
      console.warn("The Pokemon about to be sent out is fainted or illegal under a challenge. Attempting to resolve...");

      // First check if they're somehow still in play, if so remove them.
      if (partyMember.isOnField()) {
        partyMember.leaveField();
      }

      const party = this.getParty();

      // Find the first non-fainted Pokemon index above the current one
      const legalIndex = party.findIndex((p, i) => i > this.partyMemberIndex && p.isAllowedInBattle());
      if (legalIndex === -1) {
        console.error("Party Details:\n", party);
        console.error("All available Pokemon were fainted or illegal!");
        this.scene.clearPhaseQueue();
        this.scene.unshiftPhase(new GameOverPhase(this.scene));
        this.end();
        return;
      }

      // Swaps the fainted Pokemon and the first non-fainted legal Pokemon in the party
      [party[this.partyMemberIndex], party[legalIndex]] = [party[legalIndex], party[this.partyMemberIndex]];
      console.warn("Swapped %s %O with %s %O", getPokemonNameWithAffix(partyMember), partyMember, getPokemonNameWithAffix(party[0]), party[0]);
    }

    if (this.player) {
      this.scene.ui.showText(i18next.t("battle:playerGo", { pokemonName: getPokemonNameWithAffix(this.getPokemon()) }));
      if (this.player) {
        this.scene.pbTray.hide();
      }
      this.scene.trainer.setTexture(`trainer_${this.scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back_pb`);
      this.scene.time.delayedCall(562, () => {
        this.scene.trainer.setFrame("2");
        this.scene.time.delayedCall(64, () => {
          this.scene.trainer.setFrame("3");
        });
      });
      this.scene.tweens.add({
        targets: this.scene.trainer,
        x: -36,
        duration: 1000,
        onComplete: () => this.scene.trainer.setVisible(false)
      });
      this.scene.time.delayedCall(750, () => this.summon());
    } else {
      const trainerName = this.scene.currentBattle.trainer?.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER);
      const pokemonName = this.getPokemon().getNameToRender();
      const message = i18next.t("battle:trainerSendOut", { trainerName, pokemonName });

      this.scene.pbTrayEnemy.hide();
      this.scene.ui.showText(message, null, () => this.summon());
    }
  }

  summon(): void {
    const pokemon = this.getPokemon();

    const pokeball = this.scene.addFieldSprite(this.player ? 36 : 248, this.player ? 80 : 44, "pb", getPokeballAtlasKey(pokemon.pokeball));
    pokeball.setVisible(false);
    pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(pokeball);

    if (this.fieldIndex === 1) {
      pokemon.setFieldPosition(FieldPosition.RIGHT, 0);
    } else {
      const availablePartyMembers = this.getParty().filter(p => p.isAllowedInBattle()).length;
      pokemon.setFieldPosition(!this.scene.currentBattle.double || availablePartyMembers === 1 ? FieldPosition.CENTER : FieldPosition.LEFT);
    }

    const fpOffset = pokemon.getFieldPositionOffset();

    pokeball.setVisible(true);

    this.scene.tweens.add({
      targets: pokeball,
      duration: 650,
      x: (this.player ? 100 : 236) + fpOffset[0]
    });

    this.scene.tweens.add({
      targets: pokeball,
      duration: 150,
      ease: "Cubic.easeOut",
      y: (this.player ? 70 : 34) + fpOffset[1],
      onComplete: () => {
        this.scene.tweens.add({
          targets: pokeball,
          duration: 500,
          ease: "Cubic.easeIn",
          angle: 1440,
          y: (this.player ? 132 : 86) + fpOffset[1],
          onComplete: () => {
            this.scene.playSound("pb_rel");
            pokeball.destroy();
            this.scene.add.existing(pokemon);
            this.scene.field.add(pokemon);
            if (!this.player) {
              const playerPokemon = this.scene.getPlayerPokemon() as Pokemon;
              if (playerPokemon?.visible) {
                this.scene.field.moveBelow(pokemon, playerPokemon);
              }
              this.scene.currentBattle.seenEnemyPartyMemberIds.add(pokemon.id);
            }
            addPokeballOpenParticles(this.scene, pokemon.x, pokemon.y - 16, pokemon.pokeball);
            this.scene.updateModifiers(this.player);
            this.scene.updateFieldScale();
            pokemon.showInfo();
            pokemon.playAnim();
            pokemon.setVisible(true);
            pokemon.getSprite().setVisible(true);
            pokemon.setScale(0.5);
            pokemon.tint(getPokeballTintColor(pokemon.pokeball));
            pokemon.untint(250, "Sine.easeIn");
            this.scene.updateFieldScale();
            this.scene.tweens.add({
              targets: pokemon,
              duration: 250,
              ease: "Sine.easeIn",
              scale: pokemon.getSpriteScale(),
              onComplete: () => {
                pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
                pokemon.getSprite().clearTint();
                pokemon.resetSummonData();
                this.scene.time.delayedCall(1000, () => this.end());
              }
            });
          }
        });
      }
    });
  }

  onEnd(): void {
    const pokemon = this.getPokemon();

    if (pokemon.isShiny()) {
      this.scene.unshiftPhase(new ShinySparklePhase(this.scene, pokemon.getBattlerIndex()));
    }

    pokemon.resetTurnData();

    if (!this.loaded || this.scene.currentBattle.battleType === BattleType.TRAINER || (this.scene.currentBattle.waveIndex % 10) === 1) {
      this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
      this.queuePostSummon();
    }
  }

  queuePostSummon(): void {
    this.scene.pushPhase(new PostSummonPhase(this.scene, this.getPokemon().getBattlerIndex()));
  }

  end() {
    this.onEnd();

    super.end();
  }
}
//#endregion





//#region 23 SwitchSummonPhase
export class SwitchSummonPhase extends SummonPhase {
  private slotIndex: integer;
  private doReturn: boolean;
  private batonPass: boolean;

  private lastPokemon: Pokemon;

  /**
   * Constructor for creating a new SwitchSummonPhase
   * @param scene {@linkcode BattleScene} the scene the phase is associated with
   * @param fieldIndex integer representing position on the battle field
   * @param slotIndex integer for the index of pokemon (in party of 6) to switch into
   * @param doReturn boolean whether to render "comeback" dialogue
   * @param batonPass boolean if the switch is from baton pass
   * @param player boolean if the switch is from the player
   */
  constructor(scene: BattleScene, fieldIndex: integer, slotIndex: integer, doReturn: boolean, batonPass: boolean, player?: boolean) {
    super(scene, fieldIndex, player !== undefined ? player : true);

    this.slotIndex = slotIndex;
    this.doReturn = doReturn;
    this.batonPass = batonPass;
  }

  start(): void {
    super.start();
  }

  preSummon(): void {
    if (!this.player) {
      if (this.slotIndex === -1) {
        //@ts-ignore
        this.slotIndex = this.scene.currentBattle.trainer?.getNextSummonIndex(!this.fieldIndex ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER); // TODO: what would be the default trainer-slot fallback?
      }
      if (this.slotIndex > -1) {
        this.showEnemyTrainer(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER);
        this.scene.pbTrayEnemy.showPbTray(this.scene.getEnemyParty());
      }
    }

    if (!this.doReturn || (this.slotIndex !== -1 && !(this.player ? this.scene.getParty() : this.scene.getEnemyParty())[this.slotIndex])) {
      if (this.player) {
        return this.switchAndSummon();
      } else {
        this.scene.time.delayedCall(750, () => this.switchAndSummon());
        return;
      }
    }

    const pokemon = this.getPokemon();

    if (!this.batonPass) {
      (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField()).forEach(enemyPokemon => enemyPokemon.removeTagsBySourceId(pokemon.id));
    }

    this.scene.ui.showText(this.player ?
      i18next.t("battle:playerComeBack", { pokemonName: getPokemonNameWithAffix(pokemon) }) :
      i18next.t("battle:trainerComeBack", {
        trainerName: this.scene.currentBattle.trainer?.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER),
        pokemonName: getPokemonNameWithAffix(pokemon)
      })
    );
    this.scene.playSound("pb_rel");
    pokemon.hideInfo();
    pokemon.tint(getPokeballTintColor(pokemon.pokeball), 1, 250, "Sine.easeIn");
    this.scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeIn",
      scale: 0.5,
      onComplete: () => {
        pokemon.leaveField(!this.batonPass, false);
        this.scene.time.delayedCall(750, () => this.switchAndSummon());
      }
    });
  }

  switchAndSummon() {
    const party = this.player ? this.getParty() : this.scene.getEnemyParty();
    const switchedInPokemon = party[this.slotIndex];
    this.lastPokemon = this.getPokemon();
    applyPreSwitchOutAbAttrs(PreSwitchOutAbAttr, this.lastPokemon);
    if (this.batonPass && switchedInPokemon) {
      (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField()).forEach(enemyPokemon => enemyPokemon.transferTagsBySourceId(this.lastPokemon.id, switchedInPokemon.id));
      if (!this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === switchedInPokemon.id)) {
        const batonPassModifier = this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier
          && (m as SwitchEffectTransferModifier).pokemonId === this.lastPokemon.id) as SwitchEffectTransferModifier;
        if (batonPassModifier && !this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === switchedInPokemon.id)) {
          this.scene.tryTransferHeldItemModifier(batonPassModifier, switchedInPokemon, false);
        }
      }
    }
    if (switchedInPokemon) {
      party[this.slotIndex] = this.lastPokemon;
      party[this.fieldIndex] = switchedInPokemon;
      const showTextAndSummon = () => {
        this.scene.ui.showText(this.player ?
          i18next.t("battle:playerGo", { pokemonName: getPokemonNameWithAffix(switchedInPokemon) }) :
          i18next.t("battle:trainerGo", {
            trainerName: this.scene.currentBattle.trainer?.getName(!(this.fieldIndex % 2) ? TrainerSlot.TRAINER : TrainerSlot.TRAINER_PARTNER),
            pokemonName: this.getPokemon().getNameToRender()
          })
        );
        // Ensure improperly persisted summon data (such as tags) is cleared upon switching
        if (!this.batonPass) {
          switchedInPokemon.resetBattleData();
          switchedInPokemon.resetSummonData();
        }
        this.summon();
      };
      if (this.player) {
        showTextAndSummon();
      } else {
        this.scene.time.delayedCall(1500, () => {
          this.hideEnemyTrainer();
          this.scene.pbTrayEnemy.hide();
          showTextAndSummon();
        });
      }
    } else {
      this.end();
    }
  }

  onEnd(): void {
    super.onEnd();

    const pokemon = this.getPokemon();

    const moveId = this.lastPokemon?.scene.currentBattle.lastMove;
    const lastUsedMove = moveId ? allMoves[moveId] : undefined;

    const currentCommand = pokemon.scene.currentBattle.turnCommands[this.fieldIndex]?.command;
    const lastPokemonIsForceSwitchedAndNotFainted = lastUsedMove?.hasAttr(ForceSwitchOutAttr) && !this.lastPokemon.isFainted();

    // Compensate for turn spent summoning
    // Or compensate for force switch move if switched out pokemon is not fainted
    if (currentCommand === Command.POKEMON || lastPokemonIsForceSwitchedAndNotFainted) {
      pokemon.battleSummonData.turnCount--;
    }

    if (this.batonPass && pokemon) {
      pokemon.transferSummon(this.lastPokemon);
    }

    this.lastPokemon?.resetSummonData();

    this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger, true);
  }

  queuePostSummon(): void {
    this.scene.unshiftPhase(new PostSummonPhase(this.scene, this.getPokemon().getBattlerIndex()));
  }
}
//#endregion





//#region 24 ReturnPhase
export class ReturnPhase extends SwitchSummonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex, -1, true, false);
  }

  switchAndSummon(): void {
    this.end();
  }

  summon(): void { }

  onEnd(): void {
    const pokemon = this.getPokemon();

    pokemon.resetTurnData();
    pokemon.resetSummonData();

    this.scene.updateFieldScale();

    this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeActiveTrigger);
  }
}
//#endregion





//#region 25 ShowTrainerPhase
export class ShowTrainerPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.trainer.setVisible(true);

    this.scene.trainer.setTexture(`trainer_${this.scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}_back`);

    this.scene.tweens.add({
      targets: this.scene.trainer,
      x: 106,
      duration: 1000,
      onComplete: () => this.end()
    });
  }
}
//#endregion





//#region 26 ToggleDoublePositionPhase
export class ToggleDoublePositionPhase extends BattlePhase {
  private double: boolean;

  constructor(scene: BattleScene, double: boolean) {
    super(scene);

    this.double = double;
  }

  start() {
    super.start();

    const playerPokemon = this.scene.getPlayerField().find(p => p.isActive(true));
    if (playerPokemon) {
      playerPokemon.setFieldPosition(this.double && this.scene.getParty().filter(p => p.isAllowedInBattle()).length > 1 ? FieldPosition.LEFT : FieldPosition.CENTER, 500).then(() => {
        if (playerPokemon.getFieldIndex() === 1) {
          const party = this.scene.getParty();
          party[1] = party[0];
          party[0] = playerPokemon;
        }
        this.end();
      });
    } else {
      this.end();
    }
  }
}
//#endregion





//#region 27 CheckSwitchPhase
export class CheckSwitchPhase extends BattlePhase {
  protected fieldIndex: integer;
  protected useName: boolean;

  constructor(scene: BattleScene, fieldIndex: integer, useName: boolean) {
    super(scene);

    this.fieldIndex = fieldIndex;
    this.useName = useName;
  }

  start() {
    super.start();

    const pokemon = this.scene.getPlayerField()[this.fieldIndex];

    if (this.scene.battleStyle === BattleStyle.SET) {
      super.end();
      return;
    }

    if (this.scene.field.getAll().indexOf(pokemon) === -1) {
      this.scene.unshiftPhase(new SummonMissingPhase(this.scene, this.fieldIndex));
      super.end();
      return;
    }

    if (!this.scene.getParty().slice(1).filter(p => p.isActive()).length) {
      super.end();
      return;
    }

    if (pokemon.getTag(BattlerTagType.FRENZY)) {
      super.end();
      return;
    }

    for (var i = 0; i < this.scene.getEnemyField().length; i++) {
      var pk = this.scene.getEnemyField()[i]
      var maxIVs: string[] = []
      var ivnames = ["HP", "Atk", "Def", "Sp.Atk", "Sp.Def", "Speed"]
      pk.ivs.forEach((iv, j) => {if (iv == 31) maxIVs.push(ivnames[j])})
      var ivDesc = maxIVs.join(",")
      if (ivDesc == "") {
        ivDesc = "No Max IVs"
      } else {
        ivDesc = "31: " + ivDesc
      }
      pk.getBattleInfo().flyoutMenu.toggleFlyout(true)
      pk.getBattleInfo().flyoutMenu.flyoutText[0].text = getNatureName(pk.nature)
      pk.getBattleInfo().flyoutMenu.flyoutText[1].text = ivDesc
      pk.getBattleInfo().flyoutMenu.flyoutText[2].text = pk.getAbility().name
      pk.getBattleInfo().flyoutMenu.flyoutText[3].text = pk.getPassiveAbility().name
      if (pk.hasAbility(pk.species.abilityHidden, true, true)) {
        pk.getBattleInfo().flyoutMenu.flyoutText[2].setColor("#e8e8a8")
      }
    }
    if (false) {
      this.scene.pokemonInfoContainer.show(this.scene.getEnemyField()[0], false, 1, true);
      if (this.scene.getEnemyField()[1] != undefined) {
        this.scene.tweens.add({
          targets: this.scene.pokemonInfoContainer,
          alpha: 1,
          duration: 5000,
          onComplete: () => {
            this.scene.pokemonInfoContainer.hide(1.3)
            this.scene.tweens.add({
              targets: this.scene.pokemonInfoContainer,
              alpha: 1,
              duration: 1000,
              onComplete: () => {
                this.scene.pokemonInfoContainer.show(this.scene.getEnemyField()[1], false, 1, true);
              }
            })
          }
        })
      }
    }

    for (var i = 0; i < this.scene.getEnemyField().length; i++) {
      var pk = this.scene.getEnemyField()[i]
      var maxIVs: string[] = []
      var ivnames = ["HP", "Atk", "Def", "Sp.Atk", "Sp.Def", "Speed"]
      pk.ivs.forEach((iv, j) => {if (iv == 31) maxIVs.push(ivnames[j])})
      var ivDesc = maxIVs.join(",")
      if (ivDesc == "") {
        ivDesc = "No Max IVs"
      } else {
        ivDesc = "31: " + ivDesc
      }
      pk.getBattleInfo().flyoutMenu.toggleFlyout(true)
      pk.getBattleInfo().flyoutMenu.flyoutText[0].text = getNatureName(pk.nature)
      pk.getBattleInfo().flyoutMenu.flyoutText[1].text = ivDesc
      pk.getBattleInfo().flyoutMenu.flyoutText[2].text = pk.getAbility().name
      pk.getBattleInfo().flyoutMenu.flyoutText[3].text = pk.getPassiveAbility().name
      if (pk.hasAbility(pk.species.abilityHidden, true, true)) {
        pk.getBattleInfo().flyoutMenu.flyoutText[2].setColor("#e8e8a8")
      }
    }
    if (false) {
      this.scene.pokemonInfoContainer.show(this.scene.getEnemyField()[0], false, 1, true);
      if (this.scene.getEnemyField()[1] != undefined) {
        this.scene.tweens.add({
          targets: this.scene.pokemonInfoContainer,
          alpha: 1,
          duration: 5000,
          onComplete: () => {
            this.scene.pokemonInfoContainer.hide(1.3)
            this.scene.tweens.add({
              targets: this.scene.pokemonInfoContainer,
              alpha: 1,
              duration: 1000,
              onComplete: () => {
                this.scene.pokemonInfoContainer.show(this.scene.getEnemyField()[1], false, 1, true);
              }
            })
          }
        })
      }
    }

    this.scene.ui.showText(i18next.t("battle:switchQuestion", { pokemonName: this.useName ? getPokemonNameWithAffix(pokemon) : i18next.t("battle:pokemon") }), null, () => {
      this.scene.ui.setMode(Mode.CONFIRM, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        LoggerTools.isPreSwitch.value = true
        this.scene.tryRemovePhase(p => p instanceof PostSummonPhase && p.player && p.fieldIndex === this.fieldIndex);
        this.scene.unshiftPhase(new SwitchPhase(this.scene, this.fieldIndex, false, true));
        for (var i = 0; i < this.scene.getEnemyField().length; i++) {
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.toggleFlyout(false)
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.flyoutText[0].text = "???"
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.flyoutText[1].text = "???"
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.flyoutText[2].text = "???"
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.flyoutText[3].text = "???"
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.flyoutText[2].setColor("#f8f8f8")
          this.scene.getEnemyField()[i].flyout.setText()
        }
        //this.scene.pokemonInfoContainer.hide()
        this.end();
      }, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        for (var i = 0; i < this.scene.getEnemyField().length; i++) {
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.toggleFlyout(false)
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.flyoutText[0].text = "???"
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.flyoutText[1].text = "???"
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.flyoutText[2].text = "???"
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.flyoutText[3].text = "???"
          this.scene.getEnemyField()[i].getBattleInfo().flyoutMenu.flyoutText[2].setColor("#f8f8f8")
        }
        //this.scene.pokemonInfoContainer.hide()
        this.end();
      });
    });
  }
}
//#endregion





//#region 28 SummonMissingPhase
export class SummonMissingPhase extends SummonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  preSummon(): void {
    this.scene.ui.showText(i18next.t("battle:sendOutPokemon", { pokemonName: getPokemonNameWithAffix(this.getPokemon()) }));
    this.scene.time.delayedCall(250, () => this.summon());
  }
}
//#endregion





//#region 29 LevelCapPhase
export class LevelCapPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    super.start();

    this.scene.ui.setMode(Mode.MESSAGE).then(() => {
      this.scene.playSound("level_up_fanfare");
      this.scene.ui.showText(i18next.t("battle:levelCapUp", { levelCap: this.scene.getMaxExpLevel() }), null, () => this.end(), null, true);
      this.executeForAll(pokemon => pokemon.updateInfo(true));
    });
  }
}
//#endregion





//#region 30 TurnInitPhase
export class TurnInitPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    // If the flyout was shown automatically, and the user hasn't made it go away, auto-hide it
    this.scene.arenaFlyout.dismiss()

    this.scene.getPlayerField().forEach(p => {
      // If this pokemon is in play and evolved into something illegal under the current challenge, force a switch
      if (p.isOnField() && !p.isAllowedInBattle()) {
        this.scene.queueMessage(i18next.t("challenges:illegalEvolution", { "pokemon": p.name }), null, true);

        const allowedPokemon = this.scene.getParty().filter(p => p.isAllowedInBattle());

        if (!allowedPokemon.length) {
          // If there are no longer any legal pokemon in the party, game over.
          this.scene.clearPhaseQueue();
          this.scene.unshiftPhase(new GameOverPhase(this.scene));
        } else if (allowedPokemon.length >= this.scene.currentBattle.getBattlerCount() || (this.scene.currentBattle.double && !allowedPokemon[0].isActive(true))) {
          // If there is at least one pokemon in the back that is legal to switch in, force a switch.
          p.switchOut(false);
        } else {
          // If there are no pokemon in the back but we're not game overing, just hide the pokemon.
          // This should only happen in double battles.
          p.leaveField();
        }
        if (allowedPokemon.length === 1 && this.scene.currentBattle.double) {
          this.scene.unshiftPhase(new ToggleDoublePositionPhase(this.scene, true));
        }
      }
    });

    //this.scene.pushPhase(new MoveAnimTestPhase(this.scene));
    this.scene.eventTarget.dispatchEvent(new TurnInitEvent());

    LoggerTools.enemyPlan[0] = ""
    LoggerTools.enemyPlan[1] = ""
    LoggerTools.enemyPlan[2] = ""
    LoggerTools.enemyPlan[3] = ""

    if (false) {
      this.scene.getField().forEach((pokemon, i) => {
        if (pokemon != undefined && pokemon != null)
          console.log("Handle " + pokemon.name)
        if (pokemon?.isActive()) {
          if (pokemon.isPlayer()) {
            this.scene.currentBattle.addParticipant(pokemon as PlayerPokemon);
          } else {
            console.log("Marked " + pokemon.name + " as used")
            pokemon.usedInBattle = true;
            pokemon.flyout.setText()
            pokemon.getBattleInfo().iconsActive = true
          }
          pokemon.resetTurnData();
          this.scene.pushPhase(pokemon.isPlayer() ? new CommandPhase(this.scene, i) : new EnemyCommandPhase(this.scene, i - BattlerIndex.ENEMY));
        }
      });
    } else {
      this.scene.getField().forEach((pokemon, i) => {
        if (pokemon?.isActive()) {
          if (!pokemon.isPlayer()) {
            pokemon.flyout.setText()
            pokemon.usedInBattle = true;
            pokemon.getBattleInfo().iconsActive = true
            pokemon.resetTurnData();
            this.scene.pushPhase(pokemon.isPlayer() ? new CommandPhase(this.scene, i) : new EnemyCommandPhase(this.scene, i - BattlerIndex.ENEMY));
          }
        }
      });
      this.scene.getField().forEach((pokemon, i) => {
        if (pokemon?.isActive()) {
          if (pokemon.isPlayer()) {
            this.scene.currentBattle.addParticipant(pokemon as PlayerPokemon);
            pokemon.resetTurnData();
            this.scene.pushPhase(pokemon.isPlayer() ? new CommandPhase(this.scene, i) : new EnemyCommandPhase(this.scene, i - BattlerIndex.ENEMY));
          }
        }
      });
    }

    var Pt = this.scene.getEnemyParty()
    var Pt1: EnemyPokemon[] = []
    var Pt2: EnemyPokemon[] = []
    for (var i = 0; i < Pt.length; i++) {
      if (i % 2 == 0) {
        Pt1.push(Pt[i])
      } else {
        Pt2.push(Pt[i])
      }
    }
    Pt.forEach((pokemon, i) => {
      if (pokemon != undefined && pokemon.hp > 0 && pokemon.isActive())
        if (pokemon.hasTrainer() || true) {
          console.log(i)
          if (pokemon.getFieldIndex() == 1 && pokemon.isOnField()) {
            // Switch this to cycle between
            //   - hiding the top mon's team bar
            //   - showing the bottom mon's team bar with its active slots reversed
            if (false) {
              pokemon.getBattleInfo().displayParty(Pt)
              Pt[0].getBattleInfo().switchIconVisibility(false); // Make the top mon's team bar go away
              Pt[0].getBattleInfo().iconsActive = false; // Prevent the top mon from re-opening its bar
            } else {
              pokemon.getBattleInfo().displayParty(Pt2)
            }
          } else {
            pokemon.getBattleInfo().displayParty((this.scene.currentBattle.double ? Pt1 : Pt))
          }
        }
    })

    this.scene.pushPhase(new TurnStartPhase(this.scene));

    this.scene.updateCatchRate()

    this.end();
  }
}
//#endregion





//#region 31 CommandPhase
export class CommandPhase extends FieldPhase {
  protected fieldIndex: integer;

  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene);

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    if (this.fieldIndex) {
      // If we somehow are attempting to check the right pokemon but there's only one pokemon out
      // Switch back to the center pokemon. This can happen rarely in double battles with mid turn switching
      if (this.scene.getPlayerField().filter(p => p.isActive()).length === 1) {
        this.fieldIndex = FieldPosition.CENTER;
      } else {
        const allyCommand = this.scene.currentBattle.turnCommands[this.fieldIndex - 1];
        if (allyCommand?.command === Command.BALL || allyCommand?.command === Command.RUN) {
          this.scene.currentBattle.turnCommands[this.fieldIndex] = { command: allyCommand?.command, skip: true };
        }
      }
    }

    if (this.scene.currentBattle.turnCommands[this.fieldIndex]?.skip) {
      return this.end();
    }

    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];

    const moveQueue = playerPokemon.getMoveQueue();

    while (moveQueue.length && moveQueue[0]
      && moveQueue[0].move && (!playerPokemon.getMoveset().find(m => m?.moveId === moveQueue[0].move)
        || !playerPokemon.getMoveset()[playerPokemon.getMoveset().findIndex(m => m?.moveId === moveQueue[0].move)]!.isUsable(playerPokemon, moveQueue[0].ignorePP))) { // TODO: is the bang correct?
      moveQueue.shift();
    }

    if (moveQueue.length) {
      const queuedMove = moveQueue[0];
      if (!queuedMove.move) {
        this.handleCommand(Command.FIGHT, -1, false);
      } else {
        const moveIndex = playerPokemon.getMoveset().findIndex(m => m?.moveId === queuedMove.move);
        if (moveIndex > -1 && playerPokemon.getMoveset()[moveIndex]!.isUsable(playerPokemon, queuedMove.ignorePP)) { // TODO: is the bang correct?
          this.handleCommand(Command.FIGHT, moveIndex, queuedMove.ignorePP, { targets: queuedMove.targets, multiple: queuedMove.targets.length > 1, isContinuing: true });
        } else {
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }
      }
    } else {
      this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
    }
  }

  handleCommand(command: Command, cursor: integer, ...args: any[]): boolean {
    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];
    const enemyField = this.scene.getEnemyField();
    let success: boolean;

    switch (command) {
    case Command.FIGHT:
      let useStruggle = false;
      if (cursor === -1 ||
          playerPokemon.trySelectMove(cursor, args[0] as boolean) ||
          (useStruggle = cursor > -1 && !playerPokemon.getMoveset().filter(m => m?.isUsable(playerPokemon)).length)) {
        const moveId = !useStruggle ? cursor > -1 ? playerPokemon.getMoveset()[cursor]!.moveId : Moves.NONE : Moves.STRUGGLE; // TODO: is the bang correct?
        const turnCommand: TurnCommand = { command: Command.FIGHT, cursor: cursor, move: { move: moveId, targets: [], ignorePP: args[0] }, args: args };
        const moveTargets: MoveTargetSet = args.length < 3 ? getMoveTargets(playerPokemon, moveId) : args[2];
        if (!moveId) {
          turnCommand.targets = [this.fieldIndex];
        }
        console.log(moveTargets, getPokemonNameWithAffix(playerPokemon));
        if (moveTargets.targets.length > 1 && moveTargets.multiple) {
          this.scene.unshiftPhase(new SelectTargetPhase(this.scene, this.fieldIndex));
        }
        if (moveTargets.targets.length <= 1 || moveTargets.multiple) {
          turnCommand.move!.targets = moveTargets.targets; //TODO: is the bang correct here?
        } else if (playerPokemon.getTag(BattlerTagType.CHARGING) && playerPokemon.getMoveQueue().length >= 1) {
          turnCommand.move!.targets = playerPokemon.getMoveQueue()[0].targets; //TODO: is the bang correct here?
        } else {
          this.scene.unshiftPhase(new SelectTargetPhase(this.scene, this.fieldIndex));
        }
        this.scene.currentBattle.turnCommands[this.fieldIndex] = turnCommand;
        success = true;
      } else if (cursor < playerPokemon.getMoveset().length) {
        const move = playerPokemon.getMoveset()[cursor]!; //TODO: is this bang correct?
        this.scene.ui.setMode(Mode.MESSAGE);

        // Decides between a Disabled, Not Implemented, or No PP translation message
        const errorMessage =
            playerPokemon.summonData.disabledMove === move.moveId ? "battle:moveDisabled" :
              move.getName().endsWith(" (N)") ? "battle:moveNotImplemented" : "battle:moveNoPP";
        const moveName = move.getName().replace(" (N)", ""); // Trims off the indicator

        this.scene.ui.showText(i18next.t(errorMessage, { moveName: moveName }), null, () => {
          this.scene.ui.clearText();
          this.scene.ui.setMode(Mode.FIGHT, this.fieldIndex);
        }, null, true);
      }
      break;
    case Command.BALL:
      const notInDex = (this.scene.getEnemyField().filter(p => p.isActive(true)).some(p => !p.scene.gameData.dexData[p.species.speciesId].caughtAttr) && this.scene.gameData.getStarterCount(d => !!d.caughtAttr) < Object.keys(speciesStarters).length - 1);
      if (this.scene.arena.biomeType === Biome.END && (!this.scene.gameMode.isClassic || this.scene.gameMode.isFreshStartChallenge() || notInDex )) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noPokeballForce"), null, () => {
          this.scene.ui.showText("", 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noPokeballTrainer"), null, () => {
          this.scene.ui.showText("", 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else {
        const targets = this.scene.getEnemyField().filter(p => p.isActive(true)).map(p => p.getBattlerIndex());
        if (targets.length > 1) {
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.showText(i18next.t("battle:noPokeballMulti"), null, () => {
            this.scene.ui.showText("", 0);
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (cursor < 5) {
          const targetPokemon = this.scene.getEnemyField().find(p => p.isActive(true));
          if (targetPokemon?.isBoss() && targetPokemon?.bossSegmentIndex >= 1 && !targetPokemon?.hasAbility(Abilities.WONDER_GUARD, false, true) && cursor < PokeballType.MASTER_BALL) {
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            this.scene.ui.setMode(Mode.MESSAGE);
            this.scene.ui.showText(i18next.t("battle:noPokeballStrong"), null, () => {
              this.scene.ui.showText("", 0);
              this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            }, null, true);
          } else {
            this.scene.currentBattle.turnCommands[this.fieldIndex] = { command: Command.BALL, cursor: cursor };
            this.scene.currentBattle.turnCommands[this.fieldIndex]!.targets = targets;
            if (this.fieldIndex) {
              this.scene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
            }
            success = true;
          }
        }
      }
      break;
    case Command.POKEMON:
    case Command.RUN:
      const isSwitch = command === Command.POKEMON;
      if (!isSwitch && this.scene.arena.biomeType === Biome.END) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noEscapeForce"), null, () => {
          this.scene.ui.showText("", 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else if (!isSwitch && this.scene.currentBattle.battleType === BattleType.TRAINER) {
        this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:noEscapeTrainer"), null, () => {
          this.scene.ui.showText("", 0);
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
        }, null, true);
      } else {
        const trapTag = playerPokemon.findTag(t => t instanceof TrappedTag) as TrappedTag;
        const trapped = new Utils.BooleanHolder(false);
        const batonPass = isSwitch && args[0] as boolean;
        const trappedAbMessages: string[] = [];
        if (!batonPass) {
          enemyField.forEach(enemyPokemon => applyCheckTrappedAbAttrs(CheckTrappedAbAttr, enemyPokemon, trapped, playerPokemon, true, trappedAbMessages));
        }
        if (batonPass || (!trapTag && !trapped.value)) {
          this.scene.currentBattle.turnCommands[this.fieldIndex] = isSwitch
            ? { command: Command.POKEMON, cursor: cursor, args: args }
            : { command: Command.RUN };
          success = true;
          if (!isSwitch && this.fieldIndex) {
            this.scene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true;
          }
        } else if (trapTag) {
          if (trapTag.sourceMove === Moves.INGRAIN && trapTag.sourceId && this.scene.getPokemonById(trapTag.sourceId)?.isOfType(Type.GHOST)) {
            success = true;
            this.scene.currentBattle.turnCommands[this.fieldIndex] = isSwitch
              ? { command: Command.POKEMON, cursor: cursor, args: args }
              : { command: Command.RUN };
            break;
          }
          if (!isSwitch) {
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            this.scene.ui.setMode(Mode.MESSAGE);
          }
          this.scene.ui.showText(
            i18next.t("battle:noEscapePokemon", {
              pokemonName:  trapTag.sourceId && this.scene.getPokemonById(trapTag.sourceId) ? getPokemonNameWithAffix(this.scene.getPokemonById(trapTag.sourceId)!) : "",
              moveName: trapTag.getMoveName(),
              escapeVerb: isSwitch ? i18next.t("battle:escapeVerbSwitch") : i18next.t("battle:escapeVerbFlee")
            }),
            null,
            () => {
              this.scene.ui.showText("", 0);
              if (!isSwitch) {
                this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
              }
            }, null, true);
        } else if (trapped.value && trappedAbMessages.length > 0) {
          if (!isSwitch) {
            this.scene.ui.setMode(Mode.MESSAGE);
          }
          this.scene.ui.showText(trappedAbMessages[0], null, () => {
            this.scene.ui.showText("", 0);
            if (!isSwitch) {
              this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            }
          }, null, true);
        }
      }
      break;
    }

    if (success!) { // TODO: is the bang correct?
      this.end();
    }

    return success!; // TODO: is the bang correct?
  }

  cancel() {
    if (this.fieldIndex) {
      this.scene.unshiftPhase(new CommandPhase(this.scene, 0));
      this.scene.unshiftPhase(new CommandPhase(this.scene, 1));
      this.end();
    }
  }

  checkFightOverride(): boolean {
    const pokemon = this.getPokemon();

    const encoreTag = pokemon.getTag(EncoreTag) as EncoreTag;

    if (!encoreTag) {
      return false;
    }

    const moveIndex = pokemon.getMoveset().findIndex(m => m?.moveId === encoreTag.moveId);

    if (moveIndex === -1 || !pokemon.getMoveset()[moveIndex]!.isUsable(pokemon)) { // TODO: is this bang correct?
      return false;
    }

    this.handleCommand(Command.FIGHT, moveIndex, false);

    return true;
  }

  getFieldIndex(): integer {
    return this.fieldIndex;
  }

  getPokemon(): PlayerPokemon {
    return this.scene.getPlayerField()[this.fieldIndex];
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}
//#endregion





//#region 32 EnemyCommandPhase
/**
 * Phase for determining an enemy AI's action for the next turn.
 * During this phase, the enemy decides whether to switch (if it has a trainer)
 * or to use a move from its moveset.
 *
 * For more information on how the Enemy AI works, see docs/enemy-ai.md
 * @see {@linkcode Pokemon.getMatchupScore}
 * @see {@linkcode EnemyPokemon.getNextMove}
 */
export class EnemyCommandPhase extends FieldPhase {
  protected fieldIndex: integer;

  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene);

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    const enemyPokemon = this.scene.getEnemyField()[this.fieldIndex];
    console.log(enemyPokemon.getMoveset().map(m => m?.getName()))

    const battle = this.scene.currentBattle;

    const trainer = battle.trainer;

    /**
     * If the enemy has a trainer, decide whether or not the enemy should switch
     * to another member in its party.
     *
     * This block compares the active enemy Pokemon's {@linkcode Pokemon.getMatchupScore | matchup score}
     * against the active player Pokemon with the enemy party's other non-fainted Pokemon. If a party
     * member's matchup score is 3x the active enemy's score (or 2x for "boss" trainers),
     * the enemy will switch to that Pokemon.
     */
    if (trainer && !enemyPokemon.getMoveQueue().length) {
      const opponents = enemyPokemon.getOpponents();

      const trapTag = enemyPokemon.findTag(t => t instanceof TrappedTag) as TrappedTag;
      const trapped = new Utils.BooleanHolder(false);
      opponents.forEach(playerPokemon => applyCheckTrappedAbAttrs(CheckTrappedAbAttr, playerPokemon, trapped, enemyPokemon, true, []));
      if (!trapTag && !trapped.value) {
        const partyMemberScores = trainer.getPartyMemberMatchupScores(enemyPokemon.trainerSlot, true);

        if (partyMemberScores.length) {
          const matchupScores = opponents.map(opp => enemyPokemon.getMatchupScore(opp));
          const matchupScore = matchupScores.reduce((total, score) => total += score, 0) / matchupScores.length;

          const sortedPartyMemberScores = trainer.getSortedPartyMemberMatchupScores(partyMemberScores);

          const switchMultiplier = 1 - (battle.enemySwitchCounter ? Math.pow(0.1, (1 / battle.enemySwitchCounter)) : 0);

          if (sortedPartyMemberScores[0][1] * switchMultiplier >= matchupScore * (trainer.config.isBoss ? 2 : 3)) {
            const index = trainer.getNextSummonIndex(enemyPokemon.trainerSlot, partyMemberScores);

            battle.turnCommands[this.fieldIndex + BattlerIndex.ENEMY] =
              { command: Command.POKEMON, cursor: index, args: [false] };
            console.log(enemyPokemon.name + " selects:", "Switch to " + this.scene.getEnemyParty()[index].name)
            battle.enemySwitchCounter++;

            LoggerTools.enemyPlan[this.fieldIndex*2] = "Switching out"
            LoggerTools.enemyPlan[this.fieldIndex*2 + 1] = "→ " + this.scene.getEnemyParty()[index].name

            enemyPokemon.flyout.setText()

            this.scene.updateCatchRate()

            return this.end();
          }
        }
      }
    }

    /** Select a move to use (and a target to use it against, if applicable) */
    const nextMove = enemyPokemon.getNextMove();
    const mv = new PokemonMove(nextMove.move)

    this.scene.currentBattle.turnCommands[this.fieldIndex + BattlerIndex.ENEMY] =
      { command: Command.FIGHT, move: nextMove };
    const targetLabels = ["Counter", "[PLAYER L]", "[PLAYER R]", "[ENEMY L]", "[ENEMY R]"]
    this.scene.getParty().forEach((v, i, a) => {
      if (v.isActive() && v.name) {
        targetLabels[i + 1] = v.name
      }
    })
    this.scene.getEnemyParty().forEach((v, i, a) => {
      if (v.isActive() && v.name) {
        targetLabels[i + 3] = v.name
      }
    })
    if (this.fieldIndex == 0) {
      targetLabels[3] = "Self"
    }
    if (this.fieldIndex == 1) {
      targetLabels[4] = "Self"
    }
    if (targetLabels[1] == targetLabels[2]) {
      targetLabels[1] += " (L)"
      targetLabels[2] += " (R)"
    }
    console.log(enemyPokemon.name + " selects:", mv.getName() + " → " + nextMove.targets.map((m) => targetLabels[m + 1]))
    this.scene.currentBattle.enemySwitchCounter = Math.max(this.scene.currentBattle.enemySwitchCounter - 1, 0);

    LoggerTools.enemyPlan[this.fieldIndex*2] = mv.getName()
    LoggerTools.enemyPlan[this.fieldIndex*2 + 1] = "→ " + nextMove.targets.map((m) => targetLabels[m + 1])
    this.scene.arenaFlyout.updateFieldText()

    this.scene.updateCatchRate()

    this.end();
  }
}
export function enemyTurnCalc(scene: BattleScene) {
  scene.getField().forEach(pokemon => {
    if (pokemon.isActive()) {
      if (!pokemon.isPlayer()) {
        var pk = pokemon as EnemyPokemon;
      }
    }
  })
}
//#endregion





//#region 33 SelectTargetPhase
export class SelectTargetPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  start() {
    super.start();

    const turnCommand = this.scene.currentBattle.turnCommands[this.fieldIndex];
    const move = turnCommand?.move?.move;
    this.scene.ui.setMode(Mode.TARGET_SELECT, this.fieldIndex, move, (targets: BattlerIndex[]) => {
      this.scene.ui.setMode(Mode.MESSAGE);
      if (targets.length < 1) {
        this.scene.currentBattle.turnCommands[this.fieldIndex] = null;
        this.scene.unshiftPhase(new CommandPhase(this.scene, this.fieldIndex));
      } else {
        turnCommand!.targets = targets; //TODO: is the bang correct here?
      }
      if (turnCommand?.command === Command.BALL && this.fieldIndex) {
        this.scene.currentBattle.turnCommands[this.fieldIndex - 1]!.skip = true; //TODO: is the bang correct here?
      }
      this.end();
    });
  }
}
//#endregion





//#region 34 TurnStartPhase
export class TurnStartPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  generateTargString(t: BattlerIndex[]) {
    var targets = ['Self']
    for (var i = 0; i < this.scene.getField().length; i++) {
      if (this.scene.getField()[i] != null)
      targets[this.scene.getField()[i].getBattlerIndex() + 1] = this.scene.getField()[i].name
    }
    for (var i = 0; i < this.scene.getEnemyField().length; i++) {
      if (this.scene.getEnemyField()[i] != null)
      targets[this.scene.getEnemyField()[i].getBattlerIndex() + 1] = this.scene.getEnemyField()[i].name
    }
    var targetFull: string[] = []
    for (var i = 0; i < t.length; i++) {
      targetFull.push(targets[t[i] + 1])
    }
    if (targetFull.join(", ") == targets.join(", ")) return ""
    return " → " + targetFull.join(", ")
  }

  getBattlers(user: Pokemon): Pokemon[] {
    var battlers: Pokemon[] = []
    battlers[0] = this.scene.getField()[0]
    battlers[1] = this.scene.getField()[1]
    battlers[2] = this.scene.getEnemyField()[0]
    battlers[3] = this.scene.getEnemyField()[1]
    battlers.unshift(user)
    return battlers;
  }

  start() {
    super.start();

    const field = this.scene.getField();
    const order = this.getOrder();

    const battlerBypassSpeed = {};

    const playerActions: string[] = []

    const moveOrder = order.slice(0);

    while (LoggerTools.Actions.length > 0) {
      LoggerTools.Actions.pop()
    }

    for (const o of moveOrder) {

      const pokemon = field[o];
      const turnCommand = this.scene.currentBattle.turnCommands[o];

      if (turnCommand?.skip || !pokemon.isPlayer()) {
        continue;
      }

      switch (turnCommand?.command) {
      case Command.FIGHT:
        const queuedMove = turnCommand.move;
        if (!queuedMove) {
          continue;
        }
        LoggerTools.Actions[pokemon.getBattlerIndex()] = `[[ ${new PokemonMove(queuedMove.move).getName()} unknown target ]]`
        break;
      case Command.BALL:
        var ballNames = [
          "Poké Ball",
          "Great Ball",
          "Ultra Ball",
          "Rogue Ball",
          "Master Ball",
          "Luxury Ball"
        ]
        LoggerTools.Actions[pokemon.getBattlerIndex()] = ballNames[turnCommand.cursor!]
        playerActions.push(ballNames[turnCommand.cursor!])
        //this.scene.unshiftPhase(new AttemptCapturePhase(this.scene, turnCommand.targets[0] % 2, turnCommand.cursor));
        break;
      case Command.POKEMON:
        break;
      case Command.RUN:
        LoggerTools.Actions[pokemon.getBattlerIndex()] = "Run"
        playerActions.push("Run")
        break;
      }
    }
    //LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, playerActions.join(" | "))

    this.scene.getField(true).filter(p => p.summonData).map(p => {
      const bypassSpeed = new Utils.BooleanHolder(false);
      const canCheckHeldItems = new Utils.BooleanHolder(true);
      applyAbAttrs(BypassSpeedChanceAbAttr, p, null, bypassSpeed);
      applyAbAttrs(PreventBypassSpeedChanceAbAttr, p, null, bypassSpeed, canCheckHeldItems);
      if (canCheckHeldItems.value) {
        this.scene.applyModifiers(BypassSpeedChanceModifier, p.isPlayer(), p, bypassSpeed);
      }
      battlerBypassSpeed[p.getBattlerIndex()] = bypassSpeed;
    });

    moveOrder.sort((a, b) => {
      const aCommand = this.scene.currentBattle.turnCommands[a];
      const bCommand = this.scene.currentBattle.turnCommands[b];

      if (aCommand?.command !== bCommand?.command) {
        if (aCommand?.command === Command.FIGHT) {
          return 1;
        } else if (bCommand?.command === Command.FIGHT) {
          return -1;
        }
      } else if (aCommand?.command === Command.FIGHT) {
        const aMove = allMoves[aCommand.move!.move];//TODO: is the bang correct here?
        const bMove = allMoves[bCommand!.move!.move];//TODO: is the bang correct here?

        const aPriority = new Utils.IntegerHolder(aMove.priority);
        const bPriority = new Utils.IntegerHolder(bMove.priority);

        applyMoveAttrs(IncrementMovePriorityAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === a)!, null, aMove, aPriority); //TODO: is the bang correct here?
        applyMoveAttrs(IncrementMovePriorityAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === b)!, null, bMove, bPriority); //TODO: is the bang correct here?

        applyAbAttrs(ChangeMovePriorityAbAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === a)!, null, aMove, aPriority); //TODO: is the bang correct here?
        applyAbAttrs(ChangeMovePriorityAbAttr, this.scene.getField().find(p => p?.isActive() && p.getBattlerIndex() === b)!, null, bMove, bPriority); //TODO: is the bang correct here?

        if (aPriority.value !== bPriority.value) {
          const bracketDifference = Math.ceil(aPriority.value) - Math.ceil(bPriority.value);
          const hasSpeedDifference = battlerBypassSpeed[a].value !== battlerBypassSpeed[b].value;
          if (bracketDifference === 0 && hasSpeedDifference) {
            return battlerBypassSpeed[a].value ? -1 : 1;
          }
          return aPriority.value < bPriority.value ? 1 : -1;
        }
      }

      if (battlerBypassSpeed[a].value !== battlerBypassSpeed[b].value) {
        return battlerBypassSpeed[a].value ? -1 : 1;
      }

      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);

      return aIndex < bIndex ? -1 : aIndex > bIndex ? 1 : 0;
    });

    let orderIndex = 0;

    for (const o of moveOrder) {

      const pokemon = field[o];
      const turnCommand = this.scene.currentBattle.turnCommands[o];

      if (turnCommand?.skip) {
        continue;
      }

      switch (turnCommand?.command) {
      case Command.FIGHT:
        const queuedMove = turnCommand.move;
        pokemon.turnData.order = orderIndex++;
        if (!queuedMove) {
          continue;
        }
        const move = pokemon.getMoveset().find(m => m?.moveId === queuedMove.move) || new PokemonMove(queuedMove.move);
        if (move.getMove().hasAttr(MoveHeaderAttr)) {
          this.scene.unshiftPhase(new MoveHeaderPhase(this.scene, pokemon, move));
        }
        if (pokemon.isPlayer()) {
          if (turnCommand.cursor === -1) {
            //console.log("turncommand cursor was -1 -- running TOP block")
            this.scene.pushPhase(new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move!.targets, move));//TODO: is the bang correct here?
            var targets = turnCommand.targets || turnCommand.move!.targets
            var mv = move
            if (pokemon.isPlayer()) {
              console.log(turnCommand.targets, turnCommand.move!.targets)
              LoggerTools.Actions[pokemon.getBattlerIndex()] = mv.getName()
              if (this.scene.currentBattle.double) {
                var targIDs = ["Self", "Self", "Ally", "L", "R"]
                if (pokemon.getBattlerIndex() == 1) targIDs = ["Self", "Ally", "Self", "L", "R"]
                LoggerTools.Actions[pokemon.getBattlerIndex()] += " → " + targets.map(v => targIDs[v+1])
              } else {
                var targIDs = ["Self", "", "", "", ""]
                var myField = this.scene.getField()
                if (myField[0])
                  targIDs[1] = myField[0].name
                if (myField[1])
                  targIDs[2] = myField[1].name
                var eField = this.scene.getEnemyField()
                if (eField[0])
                  targIDs[3] = eField[0].name
                if (eField[1])
                  targIDs[4] = eField[1].name
                //LoggerTools.Actions[pokemon.getBattlerIndex()] += " → " + targets.map(v => targIDs[v+1])
              }
              console.log(mv.getName(), targets)
            }
          } else {
            //console.log("turncommand = ", turnCommand, " -- running BOTTOM block")
            const playerPhase = new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move!.targets, move, false, queuedMove.ignorePP);//TODO: is the bang correct here?
            var targets = turnCommand.targets || turnCommand.move!.targets
            var mv = move
            if (pokemon.isPlayer()) {
              console.log(turnCommand.targets, turnCommand.move!.targets)
              if (turnCommand.args && turnCommand.args[1] && turnCommand.args[1].isContinuing != undefined) {
                console.log(mv.getName(), targets)
              } else {
                LoggerTools.Actions[pokemon.getBattlerIndex()] = mv.getName()
                if (this.scene.currentBattle.double) {
                  var targIDs = ["Self", "Self", "Ally", "L", "R"]
                  if (pokemon.getBattlerIndex() == 1) targIDs = ["Self", "Ally", "Self", "L", "R"]
                  LoggerTools.Actions[pokemon.getBattlerIndex()] += " → " + targets.map(v => targIDs[v+1])
                } else {
                  var targIDs = ["Self", "", "", "", ""]
                  var myField = this.scene.getField()
                  if (myField[0])
                    targIDs[1] = myField[0].name
                  if (myField[1])
                    targIDs[2] = myField[1].name
                  var eField = this.scene.getEnemyField()
                  if (eField[0])
                    targIDs[3] = eField[0].name
                  if (eField[1])
                    targIDs[4] = eField[1].name
                  //LoggerTools.Actions[pokemon.getBattlerIndex()] += " → " + targets.map(v => targIDs[v+1])
                }
                console.log(mv.getName(), targets)
              }
            }
            this.scene.pushPhase(playerPhase);
          }
        } else {
          this.scene.pushPhase(new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move!.targets, move, false, queuedMove.ignorePP));//TODO: is the bang correct here?
          var targets = turnCommand.targets || turnCommand.move!.targets
          var mv = new PokemonMove(queuedMove.move)
        }
        break;
      case Command.BALL:
        this.scene.unshiftPhase(new AttemptCapturePhase(this.scene, turnCommand.targets![0] % 2, turnCommand.cursor!));//TODO: is the bang correct here?
        break;
      case Command.POKEMON:
        if (pokemon.isPlayer()) {
          //  " " + LoggerTools.playerPokeName(this.scene, pokemon) + 
          LoggerTools.Actions[pokemon.getBattlerIndex()] = ((turnCommand.args![0] as boolean) ? "Baton" : "Switch") + " to " + LoggerTools.playerPokeName(this.scene, turnCommand.cursor!)
        }
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, pokemon.getFieldIndex(), turnCommand.cursor!, true, turnCommand.args![0] as boolean, pokemon.isPlayer()));//TODO: is the bang correct here?
        break;
      case Command.RUN:
        let runningPokemon = pokemon;
        if (this.scene.currentBattle.double) {
          const playerActivePokemon = field.filter(pokemon => {
            if (!!pokemon) {
              return pokemon.isPlayer() && pokemon.isActive();
            } else {
              return;
            }
          });
            // if only one pokemon is alive, use that one
          if (playerActivePokemon.length > 1) {
            // find which active pokemon has faster speed
            const fasterPokemon = playerActivePokemon[0].getStat(Stat.SPD) > playerActivePokemon[1].getStat(Stat.SPD) ? playerActivePokemon[0] : playerActivePokemon[1];
            // check if either active pokemon has the ability "Run Away"
            const hasRunAway = playerActivePokemon.find(p => p.hasAbility(Abilities.RUN_AWAY));
            runningPokemon = hasRunAway !== undefined ? hasRunAway : fasterPokemon;
          }
        }
        this.scene.unshiftPhase(new AttemptRunPhase(this.scene, runningPokemon.getFieldIndex()));
        break;
      }
    }


    this.scene.pushPhase(new WeatherEffectPhase(this.scene));

    for (const o of order) {
      if (field[o].status && field[o].status.isPostTurn()) {
        this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, o));
      }
    }

    this.scene.pushPhase(new BerryPhase(this.scene));
    this.scene.pushPhase(new TurnEndPhase(this.scene));

    this.scene.arenaFlyout.updateFieldText()
    
    if (LoggerTools.Actions.length > 1 && !this.scene.currentBattle.double) {
      LoggerTools.Actions.pop() // If this is a single battle, but we somehow have two actions, delete the second
    }
    if (LoggerTools.Actions.length > 1 && (LoggerTools.Actions[0] == "" || LoggerTools.Actions[0] == undefined || LoggerTools.Actions[0] == null))
      LoggerTools.Actions.shift() // If the left slot isn't doing anything, delete its entry
    LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, LoggerTools.Actions.join(" & "))

    /**
     * this.end() will call shiftPhase(), which dumps everything from PrependQueue (aka everything that is unshifted()) to the front
     * of the queue and dequeues to start the next phase
     * this is important since stuff like SwitchSummon, AttemptRun, AttemptCapture Phases break the "flow" and should take precedence
     */
    this.end();
  }
}
//#endregion





//#region 35 BerryPhase
/** The phase after attacks where the pokemon eat berries */
export class BerryPhase extends FieldPhase {
  start() {
    super.start();

    this.executeForAll((pokemon) => {
      const hasUsableBerry = !!this.scene.findModifier((m) => {
        return m instanceof BerryModifier && m.shouldApply([pokemon]);
      }, pokemon.isPlayer());

      if (hasUsableBerry) {
        const cancelled = new Utils.BooleanHolder(false);
        pokemon.getOpponents().map((opp) => applyAbAttrs(PreventBerryUseAbAttr, opp, cancelled));

        if (cancelled.value) {
          pokemon.scene.queueMessage(i18next.t("abilityTriggers:preventBerryUse", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }));
        } else {
          this.scene.unshiftPhase(
            new CommonAnimPhase(this.scene, pokemon.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.USE_ITEM)
          );

          for (const berryModifier of this.scene.applyModifiers(BerryModifier, pokemon.isPlayer(), pokemon) as BerryModifier[]) {
            if (berryModifier.consumed) {
              if (!--berryModifier.stackCount) {
                this.scene.removeModifier(berryModifier);
              } else {
                berryModifier.consumed = false;
              }
            }
            this.scene.eventTarget.dispatchEvent(new BerryUsedEvent(berryModifier)); // Announce a berry was used
          }

          this.scene.updateModifiers(pokemon.isPlayer());

          applyAbAttrs(HealFromBerryUseAbAttr, pokemon, new Utils.BooleanHolder(false));
        }
      }
    });

    this.end();
  }
}
//#endregion





//#region 36 TurnEndPhase
export class TurnEndPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.arenaFlyout.updateFieldText()

    this.scene.currentBattle.incrementTurn(this.scene);
    this.scene.eventTarget.dispatchEvent(new TurnEndEvent(this.scene.currentBattle.turn));

    const handlePokemon = (pokemon: Pokemon) => {
      pokemon.lapseTags(BattlerTagLapseType.TURN_END);

      if (pokemon.summonData.disabledMove && !--pokemon.summonData.disabledTurns) {
        this.scene.pushPhase(new MessagePhase(this.scene, i18next.t("battle:notDisabled", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: allMoves[pokemon.summonData.disabledMove].name })));
        pokemon.summonData.disabledMove = Moves.NONE;
      }

      this.scene.applyModifiers(TurnHealModifier, pokemon.isPlayer(), pokemon);

      if (this.scene.arena.terrain?.terrainType === TerrainType.GRASSY && pokemon.isGrounded()) {
        this.scene.unshiftPhase(new PokemonHealPhase(this.scene, pokemon.getBattlerIndex(),
          Math.max(pokemon.getMaxHp() >> 4, 1), i18next.t("battle:turnEndHpRestore", { pokemonName: getPokemonNameWithAffix(pokemon) }), true));
      }

      if (!pokemon.isPlayer()) {
        this.scene.applyModifiers(EnemyTurnHealModifier, false, pokemon);
        this.scene.applyModifier(EnemyStatusEffectHealChanceModifier, false, pokemon);
      }

      applyPostTurnAbAttrs(PostTurnAbAttr, pokemon);

      this.scene.applyModifiers(TurnStatusEffectModifier, pokemon.isPlayer(), pokemon);

      this.scene.applyModifiers(TurnHeldItemTransferModifier, pokemon.isPlayer(), pokemon);

      pokemon.battleSummonData.turnCount++;
    };

    this.executeForAll(handlePokemon);

    this.scene.arena.lapseTags();

    if (this.scene.arena.weather && !this.scene.arena.weather.lapse()) {
      this.scene.arena.trySetWeather(WeatherType.NONE, false);
    }

    if (this.scene.arena.terrain && !this.scene.arena.terrain.lapse()) {
      this.scene.arena.trySetTerrain(TerrainType.NONE, false);
    }

    this.end();
  }
}
//#endregion





//#region 37 BattleEndPhase
export class BattleEndPhase extends BattlePhase {
  start() {
    super.start();

    this.scene.currentBattle.addBattleScore(this.scene);

    this.scene.gameData.gameStats.battles++;
    if (this.scene.currentBattle.trainer) {
      this.scene.gameData.gameStats.trainersDefeated++;
    }
    if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex + 1 > this.scene.gameData.gameStats.highestEndlessWave) {
      this.scene.gameData.gameStats.highestEndlessWave = this.scene.currentBattle.waveIndex + 1;
    }

    // Endless graceful end
    if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex >= 5850) {
      this.scene.clearPhaseQueue();
      this.scene.unshiftPhase(new GameOverPhase(this.scene, true));
    }

    for (const pokemon of this.scene.getField()) {
      if (pokemon) {
        pokemon.resetBattleSummonData();
      }
    }

    for (const pokemon of this.scene.getParty().filter(p => p.isAllowedInBattle())) {
      applyPostBattleAbAttrs(PostBattleAbAttr, pokemon);
    }

    if (this.scene.currentBattle.moneyScattered) {
      this.scene.currentBattle.pickUpScatteredMoney(this.scene);
    }

    this.scene.clearEnemyHeldItemModifiers();

    const lapsingModifiers = this.scene.findModifiers(m => m instanceof LapsingPersistentModifier || m instanceof LapsingPokemonHeldItemModifier) as (LapsingPersistentModifier | LapsingPokemonHeldItemModifier)[];
    for (const m of lapsingModifiers) {
      const args: any[] = [];
      if (m instanceof LapsingPokemonHeldItemModifier) {
        args.push(this.scene.getPokemonById(m.pokemonId));
      }
      if (!m.lapse(args)) {
        this.scene.removeModifier(m);
      }
    }

    var drpd: LoggerTools.DRPD = LoggerTools.getDRPD(this.scene)
    var wv: LoggerTools.Wave = LoggerTools.getWave(drpd, this.scene.currentBattle.waveIndex, this.scene)
    var lastcount = 0;
    var lastval;
    var tempActions: string[] = wv.actions.slice();
    var prevWaveActions: string[] = []
    wv.actions = []
    // Loop through each action
    for (var i = 0; i < tempActions.length; i++) {
      if (tempActions[i].substring(0, 10) == "[MOVEBACK]") {
        prevWaveActions.push(tempActions[i].substring(10))
      } else if (tempActions[i] != lastval) {
        if (lastcount > 0) {
          wv.actions.push(lastval + (lastcount == 1 ? "" : " x" + lastcount))
        }
        lastval = tempActions[i]
        lastcount = 1
      } else {
        lastcount++
      }
    }
    if (lastcount > 0) {
      wv.actions.push(lastval + (lastcount == 1 ? "" : " x" + lastcount))
    }
    console.log(tempActions, wv.actions)
    var wv2: LoggerTools.Wave = LoggerTools.getWave(drpd, this.scene.currentBattle.waveIndex - 1, this.scene)
    wv2.actions = wv2.actions.concat(prevWaveActions)
    console.log(drpd)
    LoggerTools.save(this.scene, drpd)

    this.scene.updateModifiers().then(() => this.end());
  }
}
//#endregion





//#region 38 NewBattlePhase
export class NewBattlePhase extends BattlePhase {
  start() {
    super.start();

    this.scene.newBattle();

    this.end();
  }
}
//#endregion





//#region 39 CommonAnimPhase
export class CommonAnimPhase extends PokemonPhase {
  private anim: CommonAnim | null;
  private targetIndex: integer | undefined;

  constructor(scene: BattleScene, battlerIndex?: BattlerIndex, targetIndex?: BattlerIndex | undefined, anim?: CommonAnim) {
    super(scene, battlerIndex);

    this.anim = anim!; // TODO: is this bang correct?
    this.targetIndex = targetIndex;
  }

  setAnimation(anim: CommonAnim) {
    this.anim = anim;
  }

  start() {
    new CommonBattleAnim(this.anim, this.getPokemon(), this.targetIndex !== undefined ? (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField())[this.targetIndex] : this.getPokemon()).play(this.scene, () => {
      this.end();
    });
  }
}

export class MoveHeaderPhase extends BattlePhase {
  public pokemon: Pokemon;
  public move: PokemonMove;

  constructor(scene: BattleScene, pokemon: Pokemon, move: PokemonMove) {
    super(scene);

    this.pokemon = pokemon;
    this.move = move;
  }

  canMove(): boolean {
    return this.pokemon.isActive(true) && this.move.isUsable(this.pokemon);
  }

  start() {
    super.start();

    if (this.canMove()) {
      applyMoveAttrs(MoveHeaderAttr, this.pokemon, null, this.move.getMove()).then(() => this.end());
    } else {
      this.end();
    }
  }
}
//#endregion





//#region 40 MovePhase
export class MovePhase extends BattlePhase {
  public pokemon: Pokemon;
  public move: PokemonMove;
  public targets: BattlerIndex[];
  protected followUp: boolean;
  protected ignorePp: boolean;
  protected failed: boolean;
  protected cancelled: boolean;

  constructor(scene: BattleScene, pokemon: Pokemon, targets: BattlerIndex[], move: PokemonMove, followUp?: boolean, ignorePp?: boolean) {
    super(scene);

    this.pokemon = pokemon;
    this.targets = targets;
    this.move = move;
    this.followUp = !!followUp;
    this.ignorePp = !!ignorePp;
    this.failed = false;
    this.cancelled = false;
  }

  canMove(): boolean {
    return this.pokemon.isActive(true) && this.move.isUsable(this.pokemon, this.ignorePp) && !!this.targets.length;
  }

  /**Signifies the current move should fail but still use PP */
  fail(): void {
    this.failed = true;
  }

  /**Signifies the current move should cancel and retain PP */
  cancel(): void {
    this.cancelled = true;
  }

  start() {
    super.start();

    console.log(Moves[this.move.moveId]);

    if (!this.canMove()) {
      if (this.move.moveId && this.pokemon.summonData?.disabledMove === this.move.moveId) {
        this.scene.queueMessage(`${this.move.getName()} is disabled!`);
      }
      if (this.pokemon.isActive(true) && this.move.ppUsed >= this.move.getMovePp()) { // if the move PP was reduced from Spite or otherwise, the move fails
        this.fail();
        this.showMoveText();
        this.showFailedText();
      }
      return this.end();
    }

    if (!this.followUp) {
      if (this.move.getMove().checkFlag(MoveFlags.IGNORE_ABILITIES, this.pokemon, null)) {
        this.scene.arena.setIgnoreAbilities();
      }
    } else {
      this.pokemon.turnData.hitsLeft = 0; // TODO: is `0` correct?
      this.pokemon.turnData.hitCount = 0; // TODO: is `0` correct?
    }

    // Move redirection abilities (ie. Storm Drain) only support single target moves
    const moveTarget = this.targets.length === 1
      ? new Utils.IntegerHolder(this.targets[0])
      : null;
    if (moveTarget) {
      const oldTarget = moveTarget.value;
      this.scene.getField(true).filter(p => p !== this.pokemon).forEach(p => applyAbAttrs(RedirectMoveAbAttr, p, null, this.move.moveId, moveTarget));
      this.pokemon.getOpponents().forEach(p => {
        const redirectTag = p.getTag(CenterOfAttentionTag) as CenterOfAttentionTag;
        if (redirectTag && (!redirectTag.powder || (!this.pokemon.isOfType(Type.GRASS) && !this.pokemon.hasAbility(Abilities.OVERCOAT)))) {
          moveTarget.value = p.getBattlerIndex();
        }
      });
      //Check if this move is immune to being redirected, and restore its target to the intended target if it is.
      if ((this.pokemon.hasAbilityWithAttr(BlockRedirectAbAttr) || this.move.getMove().hasAttr(BypassRedirectAttr))) {
        //If an ability prevented this move from being redirected, display its ability pop up.
        if ((this.pokemon.hasAbilityWithAttr(BlockRedirectAbAttr) && !this.move.getMove().hasAttr(BypassRedirectAttr)) && oldTarget !== moveTarget.value) {
          this.scene.unshiftPhase(new ShowAbilityPhase(this.scene, this.pokemon.getBattlerIndex(), this.pokemon.getPassiveAbility().hasAttr(BlockRedirectAbAttr)));
        }
        moveTarget.value = oldTarget;
      }
      this.targets[0] = moveTarget.value;
    }

    // Check for counterattack moves to switch target
    if (this.targets.length === 1 && this.targets[0] === BattlerIndex.ATTACKER) {
      if (this.pokemon.turnData.attacksReceived.length) {
        const attack = this.pokemon.turnData.attacksReceived[0];
        this.targets[0] = attack.sourceBattlerIndex;

        // account for metal burst and comeuppance hitting remaining targets in double battles
        // counterattack will redirect to remaining ally if original attacker faints
        if (this.scene.currentBattle.double && this.move.getMove().hasFlag(MoveFlags.REDIRECT_COUNTER)) {
          if (this.scene.getField()[this.targets[0]].hp === 0) {
            const opposingField = this.pokemon.isPlayer() ? this.scene.getEnemyField() : this.scene.getPlayerField();
            //@ts-ignore
            this.targets[0] = opposingField.find(p => p.hp > 0)?.getBattlerIndex(); //TODO: fix ts-ignore
          }
        }
      }
      if (this.targets[0] === BattlerIndex.ATTACKER) {
        this.fail(); // Marks the move as failed for later in doMove
        this.showMoveText();
        this.showFailedText();
      }
    }

    const targets = this.scene.getField(true).filter(p => {
      if (this.targets.indexOf(p.getBattlerIndex()) > -1) {
        return true;
      }
      return false;
    });

    const doMove = () => {
      this.pokemon.turnData.acted = true; // Record that the move was attempted, even if it fails

      this.pokemon.lapseTags(BattlerTagLapseType.PRE_MOVE);

      let ppUsed = 1;
      // Filter all opponents to include only those this move is targeting
      const targetedOpponents = this.pokemon.getOpponents().filter(o => this.targets.includes(o.getBattlerIndex()));
      for (const opponent of targetedOpponents) {
        if (this.move.ppUsed + ppUsed >= this.move.getMovePp()) { // If we're already at max PP usage, stop checking
          break;
        }
        if (opponent.hasAbilityWithAttr(IncreasePpAbAttr)) { // Accounting for abilities like Pressure
          ppUsed++;
        }
      }

      if (!this.followUp && this.canMove() && !this.cancelled) {
        this.pokemon.lapseTags(BattlerTagLapseType.MOVE);
      }

      const moveQueue = this.pokemon.getMoveQueue();
      if (this.cancelled || this.failed) {
        if (this.failed) {
          this.move.usePp(ppUsed); // Only use PP if the move failed
          this.scene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, this.move.getMove(), this.move.ppUsed));
        }

        // Record a failed move so Abilities like Truant don't trigger next turn and soft-lock
        this.pokemon.pushMoveHistory({ move: Moves.NONE, result: MoveResult.FAIL });

        this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT); // Remove any tags from moves like Fly/Dive/etc.
        moveQueue.shift(); // Remove the second turn of charge moves
        return this.end();
      }

      this.scene.triggerPokemonFormChange(this.pokemon, SpeciesFormChangePreMoveTrigger);

      if (this.move.moveId) {
        this.showMoveText();
      }

      // This should only happen when there are no valid targets left on the field
      if ((moveQueue.length && moveQueue[0].move === Moves.NONE) || !targets.length) {
        this.showFailedText();
        this.cancel();

        // Record a failed move so Abilities like Truant don't trigger next turn and soft-lock
        this.pokemon.pushMoveHistory({ move: Moves.NONE, result: MoveResult.FAIL });

        this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT); // Remove any tags from moves like Fly/Dive/etc.

        moveQueue.shift();
        return this.end();
      }

      if (!moveQueue.length || !moveQueue.shift()?.ignorePP) { // using .shift here clears out two turn moves once they've been used
        this.move.usePp(ppUsed);
        this.scene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, this.move.getMove(), this.move.ppUsed));
      }

      if (!allMoves[this.move.moveId].hasAttr(CopyMoveAttr)) {
        this.scene.currentBattle.lastMove = this.move.moveId;
      }

      // Assume conditions affecting targets only apply to moves with a single target
      let success = this.move.getMove().applyConditions(this.pokemon, targets[0], this.move.getMove());
      const cancelled = new Utils.BooleanHolder(false);
      let failedText = this.move.getMove().getFailedText(this.pokemon, targets[0], this.move.getMove(), cancelled);
      if (success && this.scene.arena.isMoveWeatherCancelled(this.move.getMove())) {
        success = false;
      } else if (success && this.scene.arena.isMoveTerrainCancelled(this.pokemon, this.targets, this.move.getMove())) {
        success = false;
        if (failedText === null) {
          failedText = getTerrainBlockMessage(targets[0], this.scene.arena.terrain?.terrainType!); // TODO: is this bang correct?
        }
      }

      /**
       * Trigger pokemon type change before playing the move animation
       * Will still change the user's type when using Roar, Whirlwind, Trick-or-Treat, and Forest's Curse,
       * regardless of whether the move successfully executes or not.
       */
      if (success || [Moves.ROAR, Moves.WHIRLWIND, Moves.TRICK_OR_TREAT, Moves.FORESTS_CURSE].includes(this.move.moveId)) {
        applyPreAttackAbAttrs(PokemonTypeChangeAbAttr, this.pokemon, null, this.move.getMove());
      }

      if (success) {
        this.scene.unshiftPhase(this.getEffectPhase());
      } else {
        this.pokemon.pushMoveHistory({ move: this.move.moveId, targets: this.targets, result: MoveResult.FAIL, virtual: this.move.virtual });
        if (!cancelled.value) {
          this.showFailedText(failedText);
        }
      }
      // Checks if Dancer ability is triggered
      if (this.move.getMove().hasFlag(MoveFlags.DANCE_MOVE) && !this.followUp) {
        // Pokemon with Dancer can be on either side of the battle so we check in both cases
        this.scene.getPlayerField().forEach(pokemon => {
          applyPostMoveUsedAbAttrs(PostMoveUsedAbAttr, pokemon, this.move, this.pokemon, this.targets);
        });
        this.scene.getEnemyField().forEach(pokemon => {
          applyPostMoveUsedAbAttrs(PostMoveUsedAbAttr, pokemon, this.move, this.pokemon, this.targets);
        });
      }
      this.end();
    };

    if (!this.followUp && this.pokemon.status && !this.pokemon.status.isPostTurn()) {
      this.pokemon.status.incrementTurn();
      let activated = false;
      let healed = false;

      switch (this.pokemon.status.effect) {
      case StatusEffect.PARALYSIS:
        if (!this.pokemon.randSeedInt(4, undefined, "Paralysis chance")) {
          activated = true;
          this.cancelled = true;
        }
        break;
      case StatusEffect.SLEEP:
        applyMoveAttrs(BypassSleepAttr, this.pokemon, null, this.move.getMove());
        healed = this.pokemon.status.turnCount === this.pokemon.status.cureTurn;
        activated = !healed && !this.pokemon.getTag(BattlerTagType.BYPASS_SLEEP);
        this.cancelled = activated;
        break;
      case StatusEffect.FREEZE:
        healed = !!this.move.getMove().findAttr(attr => attr instanceof HealStatusEffectAttr && attr.selfTarget && attr.isOfEffect(StatusEffect.FREEZE)) || !this.pokemon.randSeedInt(5, undefined, "Chance to thaw out from freeze");
        activated = !healed;
        this.cancelled = activated;
        break;
      }

      if (activated) {
        this.scene.queueMessage(getStatusEffectActivationText(this.pokemon.status.effect, getPokemonNameWithAffix(this.pokemon)));
        this.scene.unshiftPhase(new CommonAnimPhase(this.scene, this.pokemon.getBattlerIndex(), undefined, CommonAnim.POISON + (this.pokemon.status.effect - 1)));
        doMove();
      } else {
        if (healed) {
          this.scene.queueMessage(getStatusEffectHealText(this.pokemon.status.effect, getPokemonNameWithAffix(this.pokemon)));
          this.pokemon.resetStatus();
          this.pokemon.updateInfo();
        }
        doMove();
      }
    } else {
      doMove();
    }
  }

  getEffectPhase(): MoveEffectPhase {
    return new MoveEffectPhase(this.scene, this.pokemon.getBattlerIndex(), this.targets, this.move);
  }

  showMoveText(): void {
    if (this.move.getMove().hasAttr(ChargeAttr)) {
      const lastMove = this.pokemon.getLastXMoves() as TurnMove[];
      if (!lastMove.length || lastMove[0].move !== this.move.getMove().id || lastMove[0].result !== MoveResult.OTHER) {
        this.scene.queueMessage(i18next.t("battle:useMove", {
          pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
          moveName: this.move.getName()
        }), 500);
        return;
      }
    }

    if (this.pokemon.getTag(BattlerTagType.RECHARGING || BattlerTagType.INTERRUPTED)) {
      return;
    }

    this.scene.queueMessage(i18next.t("battle:useMove", {
      pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
      moveName: this.move.getName()
    }), 500);
    applyMoveAttrs(PreMoveMessageAttr, this.pokemon, this.pokemon.getOpponents().find(() => true)!, this.move.getMove()); //TODO: is the bang correct here?
  }

  showFailedText(failedText: string | null = null): void {
    this.scene.queueMessage(failedText || i18next.t("battle:attackFailed"));
  }

  end() {
    if (!this.followUp && this.canMove()) {
      this.scene.unshiftPhase(new MoveEndPhase(this.scene, this.pokemon.getBattlerIndex()));
    }

    super.end();
  }
}
//#endregion





//#region 41 MoveEffectPhase
export class MoveEffectPhase extends PokemonPhase {
  public move: PokemonMove;
  protected targets: BattlerIndex[];

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, targets: BattlerIndex[], move: PokemonMove) {
    super(scene, battlerIndex);
    this.move = move;
    /**
     * In double battles, if the right Pokemon selects a spread move and the left Pokemon dies
     * with no party members available to switch in, then the right Pokemon takes the index
     * of the left Pokemon and gets hit unless this is checked.
     */
    if (targets.includes(battlerIndex) && this.move.getMove().moveTarget === MoveTarget.ALL_NEAR_OTHERS) {
      const i = targets.indexOf(battlerIndex);
      targets.splice(i, i + 1);
    }
    this.targets = targets;
  }

  start() {
    super.start();

    /** The Pokemon using this phase's invoked move */
    const user = this.getUserPokemon();
    /** All Pokemon targeted by this phase's invoked move */
    const targets = this.getTargets();

    /** If the user was somehow removed from the field, end this phase */
    if (!user?.isOnField()) {
      return super.end();
    }

    /**
     * Does an effect from this move override other effects on this turn?
     * e.g. Charging moves (Fly, etc.) on their first turn of use.
     */
    const overridden = new Utils.BooleanHolder(false);
    /** The {@linkcode Move} object from {@linkcode allMoves} invoked by this phase */
    const move = this.move.getMove();

    // Assume single target for override
    applyMoveAttrs(OverrideMoveEffectAttr, user, this.getTarget() ?? null, move, overridden, this.move.virtual).then(() => {
      // If other effects were overriden, stop this phase before they can be applied
      if (overridden.value) {
        return this.end();
      }

      user.lapseTags(BattlerTagLapseType.MOVE_EFFECT);

      /**
       * If this phase is for the first hit of the invoked move,
       * resolve the move's total hit count. This block combines the
       * effects of the move itself, Parental Bond, and Multi-Lens to do so.
       */
      if (user.turnData.hitsLeft === undefined) {
        const hitCount = new Utils.IntegerHolder(1);
        // Assume single target for multi hit
        applyMoveAttrs(MultiHitAttr, user, this.getTarget() ?? null, move, hitCount);
        // If Parental Bond is applicable, double the hit count
        applyPreAttackAbAttrs(AddSecondStrikeAbAttr, user, null, move, targets.length, hitCount, new Utils.IntegerHolder(0));
        // If Multi-Lens is applicable, multiply the hit count by 1 + the number of Multi-Lenses held by the user
        if (move instanceof AttackMove && !move.hasAttr(FixedDamageAttr)) {
          this.scene.applyModifiers(PokemonMultiHitModifier, user.isPlayer(), user, hitCount, new Utils.IntegerHolder(0));
        }
        // Set the user's relevant turnData fields to reflect the final hit count
        user.turnData.hitCount = hitCount.value;
        user.turnData.hitsLeft = hitCount.value;
      }

      /**
       * Log to be entered into the user's move history once the move result is resolved.
       * Note that `result` (a {@linkcode MoveResult}) logs whether the move was successfully
       * used in the sense of "Does it have an effect on the user?".
       */
      const moveHistoryEntry = { move: this.move.moveId, targets: this.targets, result: MoveResult.PENDING, virtual: this.move.virtual };

      /**
       * Stores results of hit checks of the invoked move against all targets, organized by battler index.
       * @see {@linkcode hitCheck}
       */
      const targetHitChecks = Object.fromEntries(targets.map(p => [p.getBattlerIndex(), this.hitCheck(p)]));
      const hasActiveTargets = targets.some(t => t.isActive(true));
      /**
       * If no targets are left for the move to hit (FAIL), or the invoked move is single-target
       * (and not random target) and failed the hit check against its target (MISS), log the move
       * as FAILed or MISSed (depending on the conditions above) and end this phase.
       */
      if (!hasActiveTargets || (!move.hasAttr(VariableTargetAttr) && !move.isMultiTarget() && !targetHitChecks[this.targets[0]])) {
        this.stopMultiHit();
        if (hasActiveTargets) {
          this.scene.queueMessage(i18next.t("battle:attackMissed", { pokemonNameWithAffix: this.getTarget()? getPokemonNameWithAffix(this.getTarget()!) : "" }));
          moveHistoryEntry.result = MoveResult.MISS;
          applyMoveAttrs(MissEffectAttr, user, null, move);
        } else {
          this.scene.queueMessage(i18next.t("battle:attackFailed"));
          moveHistoryEntry.result = MoveResult.FAIL;
        }
        user.pushMoveHistory(moveHistoryEntry);
        return this.end();
      }

      /** All move effect attributes are chained together in this array to be applied asynchronously. */
      const applyAttrs: Promise<void>[] = [];

      // Move animation only needs one target
      new MoveAnim(move.id as Moves, user, this.getTarget()?.getBattlerIndex()!).play(this.scene, () => { // TODO: is the bang correct here?
        /** Has the move successfully hit a target (for damage) yet? */
        let hasHit: boolean = false;
        for (const target of targets) {
          /**
           * If the move missed a target, stop all future hits against that target
           * and move on to the next target (if there is one).
           */
          if (!targetHitChecks[target.getBattlerIndex()]) {
            this.stopMultiHit(target);
            this.scene.queueMessage(i18next.t("battle:attackMissed", { pokemonNameWithAffix: getPokemonNameWithAffix(target) }));
            if (moveHistoryEntry.result === MoveResult.PENDING) {
              moveHistoryEntry.result = MoveResult.MISS;
            }
            user.pushMoveHistory(moveHistoryEntry);
            applyMoveAttrs(MissEffectAttr, user, null, move);
            continue;
          }

          /** The {@linkcode ArenaTagSide} to which the target belongs */
          const targetSide = target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
          /** Has the invoked move been cancelled by conditional protection (e.g Quick Guard)? */
          const hasConditionalProtectApplied = new Utils.BooleanHolder(false);
          /** Does the applied conditional protection bypass Protect-ignoring effects? */
          const bypassIgnoreProtect = new Utils.BooleanHolder(false);
          // If the move is not targeting a Pokemon on the user's side, try to apply conditional protection effects
          if (!this.move.getMove().isAllyTarget()) {
            this.scene.arena.applyTagsForSide(ConditionalProtectTag, targetSide, hasConditionalProtectApplied, user, target, move.id, bypassIgnoreProtect);
          }

          /** Is the target protected by Protect, etc. or a relevant conditional protection effect? */
          const isProtected = (bypassIgnoreProtect.value || !this.move.getMove().checkFlag(MoveFlags.IGNORE_PROTECT, user, target))
            && (hasConditionalProtectApplied.value || target.findTags(t => t instanceof ProtectedTag).find(t => target.lapseTag(t.tagType)));

          /** Does this phase represent the invoked move's first strike? */
          const firstHit = (user.turnData.hitsLeft === user.turnData.hitCount);

          // Only log the move's result on the first strike
          if (firstHit) {
            user.pushMoveHistory(moveHistoryEntry);
          }

          /**
           * Since all fail/miss checks have applied, the move is considered successfully applied.
           * It's worth noting that if the move has no effect or is protected against, this assignment
           * is overwritten and the move is logged as a FAIL.
           */
          moveHistoryEntry.result = MoveResult.SUCCESS;

          /**
           * Stores the result of applying the invoked move to the target.
           * If the target is protected, the result is always `NO_EFFECT`.
           * Otherwise, the hit result is based on type effectiveness, immunities,
           * and other factors that may negate the attack or status application.
           *
           * Internally, the call to {@linkcode Pokemon.apply} is where damage is calculated
           * (for attack moves) and the target's HP is updated. However, this isn't
           * made visible to the user until the resulting {@linkcode DamagePhase}
           * is invoked.
           */
          const hitResult = !isProtected ? target.apply(user, move).hitResult : HitResult.NO_EFFECT;

          /** Does {@linkcode hitResult} indicate that damage was dealt to the target? */
          const dealsDamage = [
            HitResult.EFFECTIVE,
            HitResult.SUPER_EFFECTIVE,
            HitResult.NOT_VERY_EFFECTIVE,
            HitResult.ONE_HIT_KO
          ].includes(hitResult);

          /** Is this target the first one hit by the move on its current strike? */
          const firstTarget = dealsDamage && !hasHit;
          if (firstTarget) {
            hasHit = true;
          }

          /**
           * If the move has no effect on the target (i.e. the target is protected or immune),
           * change the logged move result to FAIL.
           */
          if (hitResult === HitResult.NO_EFFECT) {
            moveHistoryEntry.result = MoveResult.FAIL;
          }

          /** Does this phase represent the invoked move's last strike? */
          const lastHit = (user.turnData.hitsLeft === 1 || !this.getTarget()?.isActive());

          /**
           * If the user can change forms by using the invoked move,
           * it only changes forms after the move's last hit
           * (see Relic Song's interaction with Parental Bond when used by Meloetta).
           */
          if (lastHit) {
            this.scene.triggerPokemonFormChange(user, SpeciesFormChangePostMoveTrigger);
          }

          /**
           * Create a Promise that applys *all* effects from the invoked move's MoveEffectAttrs.
           * These are ordered by trigger type (see {@linkcode MoveEffectTrigger}), and each trigger
           * type requires different conditions to be met with respect to the move's hit result.
           */
          applyAttrs.push(new Promise(resolve => {
            // Apply all effects with PRE_MOVE triggers (if the target isn't immune to the move)
            applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && attr.trigger === MoveEffectTrigger.PRE_APPLY && (!attr.firstHitOnly || firstHit) && (!attr.lastHitOnly || lastHit) && hitResult !== HitResult.NO_EFFECT,
              user, target, move).then(() => {
              // All other effects require the move to not have failed or have been cancelled to trigger
              if (hitResult !== HitResult.FAIL) {
                /** Are the move's effects tied to the first turn of a charge move? */
                const chargeEffect = !!move.getAttrs(ChargeAttr).find(ca => ca.usedChargeEffect(user, this.getTarget() ?? null, move));
                /**
                 * If the invoked move's effects are meant to trigger during the move's "charge turn,"
                 * ignore all effects after this point.
                 * Otherwise, apply all self-targeted POST_APPLY effects.
                 */
                Utils.executeIf(!chargeEffect, () => applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && attr.trigger === MoveEffectTrigger.POST_APPLY
                    && attr.selfTarget && (!attr.firstHitOnly || firstHit) && (!attr.lastHitOnly || lastHit), user, target, move)).then(() => {
                  // All effects past this point require the move to have hit the target
                  if (hitResult !== HitResult.NO_EFFECT) {
                    // Apply all non-self-targeted POST_APPLY effects
                    applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && (attr as MoveEffectAttr).trigger === MoveEffectTrigger.POST_APPLY
                      && !(attr as MoveEffectAttr).selfTarget && (!attr.firstHitOnly || firstHit) && (!attr.lastHitOnly || lastHit), user, target, this.move.getMove()).then(() => {
                      /**
                       * If the move hit, and the target doesn't have Shield Dust,
                       * apply the chance to flinch the target gained from King's Rock
                       */
                      if (dealsDamage && !target.hasAbilityWithAttr(IgnoreMoveEffectsAbAttr)) {
                        const flinched = new Utils.BooleanHolder(false);
                        user.scene.applyModifiers(FlinchChanceModifier, user.isPlayer(), user, flinched);
                        if (flinched.value) {
                          target.addTag(BattlerTagType.FLINCHED, undefined, this.move.moveId, user.id);
                        }
                      }
                      // If the move was not protected against, apply all HIT effects
                      Utils.executeIf(!isProtected && !chargeEffect, () => applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && (attr as MoveEffectAttr).trigger === MoveEffectTrigger.HIT
                          && (!attr.firstHitOnly || firstHit) && (!attr.lastHitOnly || lastHit) && (!attr.firstTargetOnly || firstTarget), user, target, this.move.getMove()).then(() => {
                        // Apply the target's post-defend ability effects (as long as the target is active or can otherwise apply them)
                        return Utils.executeIf(!target.isFainted() || target.canApplyAbility(), () => applyPostDefendAbAttrs(PostDefendAbAttr, target, user, this.move.getMove(), hitResult).then(() => {
                          // If the invoked move is an enemy attack, apply the enemy's status effect-inflicting tags and tokens
                          target.lapseTag(BattlerTagType.BEAK_BLAST_CHARGING);
                          if (move.category === MoveCategory.PHYSICAL && user.isPlayer() !== target.isPlayer()) {
                            target.lapseTag(BattlerTagType.SHELL_TRAP);
                          }
                          if (!user.isPlayer() && this.move.getMove() instanceof AttackMove) {
                            user.scene.applyShuffledModifiers(this.scene, EnemyAttackStatusEffectChanceModifier, false, target);
                          }
                        })).then(() => {
                          // Apply the user's post-attack ability effects
                          applyPostAttackAbAttrs(PostAttackAbAttr, user, target, this.move.getMove(), hitResult).then(() => {
                            /**
                             * If the invoked move is an attack, apply the user's chance to
                             * steal an item from the target granted by Grip Claw
                             */
                            if (this.move.getMove() instanceof AttackMove) {
                              this.scene.applyModifiers(ContactHeldItemTransferChanceModifier, this.player, user, target);
                            }
                            resolve();
                          });
                        });
                      })
                      ).then(() => resolve());
                    });
                  } else {
                    applyMoveAttrs(NoEffectAttr, user, null, move).then(() => resolve());
                  }
                });
              } else {
                resolve();
              }
            });
          }));
        }
        // Apply the move's POST_TARGET effects on the move's last hit, after all targeted effects have resolved
        const postTarget = (user.turnData.hitsLeft === 1 || !this.getTarget()?.isActive()) ?
          applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && attr.trigger === MoveEffectTrigger.POST_TARGET, user, null, move) :
          null;

        if (!!postTarget) {
          if (applyAttrs.length) { // If there is a pending asynchronous move effect, do this after
            applyAttrs[applyAttrs.length - 1]?.then(() => postTarget);
          } else { // Otherwise, push a new asynchronous move effect
            applyAttrs.push(postTarget);
          }
        }

        // Wait for all move effects to finish applying, then end this phase
        Promise.allSettled(applyAttrs).then(() => this.end());
      });
    });
  }

  end() {
    const move = this.move.getMove();
    move.type = move.defaultType;
    const user = this.getUserPokemon();
    /**
     * If this phase isn't for the invoked move's last strike,
     * unshift another MoveEffectPhase for the next strike.
     * Otherwise, queue a message indicating the number of times the move has struck
     * (if the move has struck more than once), then apply the heal from Shell Bell
     * to the user.
     */
    if (user) {
      if (user.turnData.hitsLeft && --user.turnData.hitsLeft >= 1 && this.getTarget()?.isActive()) {
        this.scene.unshiftPhase(this.getNewHitPhase());
      } else {
        // Queue message for number of hits made by multi-move
        // If multi-hit attack only hits once, still want to render a message
        const hitsTotal = user.turnData.hitCount! - Math.max(user.turnData.hitsLeft!, 0); // TODO: are those bangs correct?
        if (hitsTotal > 1 || (user.turnData.hitsLeft && user.turnData.hitsLeft > 0)) {
          // If there are multiple hits, or if there are hits of the multi-hit move left
          this.scene.queueMessage(i18next.t("battle:attackHitsCount", { count: hitsTotal }));
        }
        this.scene.applyModifiers(HitHealModifier, this.player, user);
      }
    }

    super.end();
  }

  /**
   * Resolves whether this phase's invoked move hits or misses the given target
   * @param target {@linkcode Pokemon} the Pokemon targeted by the invoked move
   * @returns `true` if the move does not miss the target; `false` otherwise
   */
  hitCheck(target: Pokemon): boolean {
    // Moves targeting the user and entry hazards can't miss
    if ([MoveTarget.USER, MoveTarget.ENEMY_SIDE].includes(this.move.getMove().moveTarget)) {
      return true;
    }

    const user = this.getUserPokemon()!; // TODO: is this bang correct?

    // Hit check only calculated on first hit for multi-hit moves unless flag is set to check all hits.
    // However, if an ability with the MaxMultiHitAbAttr, namely Skill Link, is present, act as a normal
    // multi-hit move and proceed with all hits
    if (user.turnData.hitsLeft < user.turnData.hitCount) {
      if (!this.move.getMove().hasFlag(MoveFlags.CHECK_ALL_HITS) || user.hasAbilityWithAttr(MaxMultiHitAbAttr)) {
        return true;
      }
    }

    if (user.hasAbilityWithAttr(AlwaysHitAbAttr) || target.hasAbilityWithAttr(AlwaysHitAbAttr)) {
      return true;
    }

    // If the user should ignore accuracy on a target, check who the user targeted last turn and see if they match
    if (user.getTag(BattlerTagType.IGNORE_ACCURACY) && (user.getLastXMoves().find(() => true)?.targets || []).indexOf(target.getBattlerIndex()) !== -1) {
      return true;
    }

    if (target.getTag(BattlerTagType.ALWAYS_GET_HIT)) {
      return true;
    }

    const semiInvulnerableTag = target.getTag(SemiInvulnerableTag);
    if (semiInvulnerableTag && !this.move.getMove().getAttrs(HitsTagAttr).some(hta => hta.tagType === semiInvulnerableTag.tagType)) {
      return false;
    }

    const moveAccuracy = this.move.getMove().calculateBattleAccuracy(user!, target); // TODO: is the bang correct here?

    if (moveAccuracy === -1) {
      return true;
    }

    const accuracyMultiplier = user.getAccuracyMultiplier(target, this.move.getMove());
    const rand = user.randSeedInt(100, 1, "Accuracy roll");

    return rand <= moveAccuracy * (accuracyMultiplier!); // TODO: is this bang correct?
  }

  /** Returns the {@linkcode Pokemon} using this phase's invoked move */
  getUserPokemon(): Pokemon | undefined {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return this.scene.getPokemonById(this.battlerIndex) ?? undefined;
    }
    return (this.player ? this.scene.getPlayerField() : this.scene.getEnemyField())[this.fieldIndex];
  }

  /** Returns an array of all {@linkcode Pokemon} targeted by this phase's invoked move */
  getTargets(): Pokemon[] {
    return this.scene.getField(true).filter(p => this.targets.indexOf(p.getBattlerIndex()) > -1);
  }

  /** Returns the first target of this phase's invoked move */
  getTarget(): Pokemon | undefined {
    return this.getTargets()[0];
  }

  /**
   * Removes the given {@linkcode Pokemon} from this phase's target list
   * @param target {@linkcode Pokemon} the Pokemon to be removed
   */
  removeTarget(target: Pokemon): void {
    const targetIndex = this.targets.findIndex(ind => ind === target.getBattlerIndex());
    if (targetIndex !== -1) {
      this.targets.splice(this.targets.findIndex(ind => ind === target.getBattlerIndex()), 1);
    }
  }

  /**
   * Prevents subsequent strikes of this phase's invoked move from occurring
   * @param target {@linkcode Pokemon} if defined, only stop subsequent
   * strikes against this Pokemon
   */
  stopMultiHit(target?: Pokemon): void {
    /** If given a specific target, remove the target from subsequent strikes */
    if (target) {
      this.removeTarget(target);
    }
    /**
     * If no target specified, or the specified target was the last of this move's
     * targets, completely cancel all subsequent strikes.
    */
    if (!target || this.targets.length === 0 ) {
      this.getUserPokemon()!.turnData.hitCount = 1; // TODO: is the bang correct here?
      this.getUserPokemon()!.turnData.hitsLeft = 1; // TODO: is the bang correct here?
    }
  }

  /** Returns a new MoveEffectPhase with the same properties as this phase */
  getNewHitPhase() {
    return new MoveEffectPhase(this.scene, this.battlerIndex, this.targets, this.move);
  }
}
//#endregion





//#region 42 MoveEndPhase
export class MoveEndPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    if (pokemon.isActive(true)) {
      pokemon.lapseTags(BattlerTagLapseType.AFTER_MOVE);
    }

    this.scene.arena.setIgnoreAbilities(false);

    this.end();
  }
}
//#endregion





//#region 43 MoveAnimTestPhase
export class MoveAnimTestPhase extends BattlePhase {
  private moveQueue: Moves[];

  constructor(scene: BattleScene, moveQueue?: Moves[]) {
    super(scene);

    this.moveQueue = moveQueue || Utils.getEnumValues(Moves).slice(1);
  }

  start() {
    const moveQueue = this.moveQueue.slice(0);
    this.playMoveAnim(moveQueue, true);
  }

  playMoveAnim(moveQueue: Moves[], player: boolean) {
    const moveId = player ? moveQueue[0] : moveQueue.shift();
    if (moveId === undefined) {
      this.playMoveAnim(this.moveQueue.slice(0), true);
      return;
    } else if (player) {
      console.log(Moves[moveId]);
    }

    initMoveAnim(this.scene, moveId).then(() => {
      loadMoveAnimAssets(this.scene, [moveId], true)
        .then(() => {
          new MoveAnim(moveId, player ? this.scene.getPlayerPokemon()! : this.scene.getEnemyPokemon()!, (player !== (allMoves[moveId] instanceof SelfStatusMove) ? this.scene.getEnemyPokemon()! : this.scene.getPlayerPokemon()!).getBattlerIndex()).play(this.scene, () => { // TODO: are the bangs correct here?
            if (player) {
              this.playMoveAnim(moveQueue, false);
            } else {
              this.playMoveAnim(moveQueue, true);
            }
          });
        });
    });
  }
}
//#endregion





//#region 44 ShowAbilityPhase
export class ShowAbilityPhase extends PokemonPhase {
  private passive: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, passive: boolean = false) {
    super(scene, battlerIndex);

    this.passive = passive;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (pokemon) {
      this.scene.abilityBar.showAbility(pokemon, this.passive);

      if (pokemon?.battleData) {
        pokemon.battleData.abilityRevealed = true;
      }
    }

    this.end();
  }
}
//#endregion

export type StatChangeCallback = (target: Pokemon | null, changed: BattleStat[], relativeChanges: number[]) => void;




//#region 45 StatChangePhase
export class StatChangePhase extends PokemonPhase {
  private stats: BattleStat[];
  private selfTarget: boolean;
  private levels: integer;
  private showMessage: boolean;
  private ignoreAbilities: boolean;
  private canBeCopied: boolean;
  private onChange: StatChangeCallback | null;


  constructor(scene: BattleScene, battlerIndex: BattlerIndex, selfTarget: boolean, stats: BattleStat[], levels: integer, showMessage: boolean = true, ignoreAbilities: boolean = false, canBeCopied: boolean = true, onChange: StatChangeCallback | null = null) {
    super(scene, battlerIndex);

    this.selfTarget = selfTarget;
    this.stats = stats;
    this.levels = levels;
    this.showMessage = showMessage;
    this.ignoreAbilities = ignoreAbilities;
    this.canBeCopied = canBeCopied;
    this.onChange = onChange;
  }

  start() {
    const pokemon = this.getPokemon();

    let random = false;

    if (this.stats.length === 1 && this.stats[0] === BattleStat.RAND) {
      this.stats[0] = this.getRandomStat();
      random = true;
    }

    this.aggregateStatChanges(random);

    if (!pokemon.isActive(true)) {
      return this.end();
    }

    const filteredStats = this.stats.map(s => s !== BattleStat.RAND ? s : this.getRandomStat()).filter(stat => {
      const cancelled = new Utils.BooleanHolder(false);

      if (!this.selfTarget && this.levels < 0) {
        this.scene.arena.applyTagsForSide(MistTag, pokemon.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY, cancelled);
      }

      if (!cancelled.value && !this.selfTarget && this.levels < 0) {
        applyPreStatChangeAbAttrs(ProtectStatAbAttr, this.getPokemon(), stat, cancelled);
      }

      return !cancelled.value;
    });

    const levels = new Utils.IntegerHolder(this.levels);

    if (!this.ignoreAbilities) {
      applyAbAttrs(StatChangeMultiplierAbAttr, pokemon, null, levels);
    }

    const battleStats = this.getPokemon().summonData.battleStats;
    const relLevels = filteredStats.map(stat => (levels.value >= 1 ? Math.min(battleStats![stat] + levels.value, 6) : Math.max(battleStats![stat] + levels.value, -6)) - battleStats![stat]);

    this.onChange && this.onChange(this.getPokemon(), filteredStats, relLevels);

    const end = () => {
      if (this.showMessage) {
        const messages = this.getStatChangeMessages(filteredStats, levels.value, relLevels);
        for (const message of messages) {
          this.scene.queueMessage(message);
        }
      }

      for (const stat of filteredStats) {
        pokemon.summonData.battleStats[stat] = Math.max(Math.min(pokemon.summonData.battleStats[stat] + levels.value, 6), -6);
      }

      if (levels.value > 0 && this.canBeCopied) {
        for (const opponent of pokemon.getOpponents()) {
          applyAbAttrs(StatChangeCopyAbAttr, opponent, null, this.stats, levels.value);
        }
      }

      applyPostStatChangeAbAttrs(PostStatChangeAbAttr, pokemon, filteredStats, this.levels, this.selfTarget);

      // Look for any other stat change phases; if this is the last one, do White Herb check
      const existingPhase = this.scene.findPhase(p => p instanceof StatChangePhase && p.battlerIndex === this.battlerIndex);
      if (!(existingPhase instanceof StatChangePhase)) {
        // Apply White Herb if needed
        const whiteHerb = this.scene.applyModifier(PokemonResetNegativeStatStageModifier, this.player, pokemon) as PokemonResetNegativeStatStageModifier;
        // If the White Herb was applied, consume it
        if (whiteHerb) {
          --whiteHerb.stackCount;
          if (whiteHerb.stackCount <= 0) {
            this.scene.removeModifier(whiteHerb);
          }
          this.scene.updateModifiers(this.player);
        }
      }

      pokemon.updateInfo();

      handleTutorial(this.scene, Tutorial.Stat_Change).then(() => super.end());
    };

    if (relLevels.filter(l => l).length && this.scene.moveAnimations) {
      pokemon.enableMask();
      const pokemonMaskSprite = pokemon.maskSprite;

      const tileX = (this.player ? 106 : 236) * pokemon.getSpriteScale() * this.scene.field.scale;
      const tileY = ((this.player ? 148 : 84) + (levels.value >= 1 ? 160 : 0)) * pokemon.getSpriteScale() * this.scene.field.scale;
      const tileWidth = 156 * this.scene.field.scale * pokemon.getSpriteScale();
      const tileHeight = 316 * this.scene.field.scale * pokemon.getSpriteScale();

      // On increase, show the red sprite located at ATK
      // On decrease, show the blue sprite located at SPD
      const spriteColor = levels.value >= 1 ? BattleStat[BattleStat.ATK].toLowerCase() : BattleStat[BattleStat.SPD].toLowerCase();
      const statSprite = this.scene.add.tileSprite(tileX, tileY, tileWidth, tileHeight, "battle_stats", spriteColor);
      statSprite.setPipeline(this.scene.fieldSpritePipeline);
      statSprite.setAlpha(0);
      statSprite.setScale(6);
      statSprite.setOrigin(0.5, 1);

      this.scene.playSound(`stat_${levels.value >= 1 ? "up" : "down"}`);

      statSprite.setMask(new Phaser.Display.Masks.BitmapMask(this.scene, pokemonMaskSprite ?? undefined));

      this.scene.tweens.add({
        targets: statSprite,
        duration: 250,
        alpha: 0.8375,
        onComplete: () => {
          this.scene.tweens.add({
            targets: statSprite,
            delay: 1000,
            duration: 250,
            alpha: 0
          });
        }
      });

      this.scene.tweens.add({
        targets: statSprite,
        duration: 1500,
        y: `${levels.value >= 1 ? "-" : "+"}=${160 * 6}`
      });

      this.scene.time.delayedCall(1750, () => {
        pokemon.disableMask();
        end();
      });
    } else {
      end();
    }
  }

  getRandomStat(): BattleStat {
    const allStats = Utils.getEnumValues(BattleStat);
    return this.getPokemon() ? allStats[this.getPokemon()!.randSeedInt(BattleStat.SPD + 1, undefined, "Randomly selecting a stat")] : BattleStat.ATK; // TODO: return default ATK on random? idk...
  }

  aggregateStatChanges(random: boolean = false): void {
    const isAccEva = [BattleStat.ACC, BattleStat.EVA].some(s => this.stats.includes(s));
    let existingPhase: StatChangePhase;
    if (this.stats.length === 1) {
      while ((existingPhase = (this.scene.findPhase(p => p instanceof StatChangePhase && p.battlerIndex === this.battlerIndex && p.stats.length === 1
        && (p.stats[0] === this.stats[0] || (random && p.stats[0] === BattleStat.RAND))
        && p.selfTarget === this.selfTarget && p.showMessage === this.showMessage && p.ignoreAbilities === this.ignoreAbilities) as StatChangePhase))) {
        if (existingPhase.stats[0] === BattleStat.RAND) {
          existingPhase.stats[0] = this.getRandomStat();
          if (existingPhase.stats[0] !== this.stats[0]) {
            continue;
          }
        }
        this.levels += existingPhase.levels;

        if (!this.scene.tryRemovePhase(p => p === existingPhase)) {
          break;
        }
      }
    }
    while ((existingPhase = (this.scene.findPhase(p => p instanceof StatChangePhase && p.battlerIndex === this.battlerIndex && p.selfTarget === this.selfTarget
      && ([BattleStat.ACC, BattleStat.EVA].some(s => p.stats.includes(s)) === isAccEva)
      && p.levels === this.levels && p.showMessage === this.showMessage && p.ignoreAbilities === this.ignoreAbilities) as StatChangePhase))) {
      this.stats.push(...existingPhase.stats);
      if (!this.scene.tryRemovePhase(p => p === existingPhase)) {
        break;
      }
    }
  }

  getStatChangeMessages(stats: BattleStat[], levels: integer, relLevels: integer[]): string[] {
    const messages: string[] = [];

    const relLevelStatIndexes = {};
    for (let rl = 0; rl < relLevels.length; rl++) {
      const relLevel = relLevels[rl];
      if (!relLevelStatIndexes[relLevel]) {
        relLevelStatIndexes[relLevel] = [];
      }
      relLevelStatIndexes[relLevel].push(rl);
    }

    Object.keys(relLevelStatIndexes).forEach(rl => {
      const relLevelStats = stats.filter((_, i) => relLevelStatIndexes[rl].includes(i));
      let statsFragment = "";

      if (relLevelStats.length > 1) {
        statsFragment = relLevelStats.length >= 5
          ? i18next.t("battle:stats")
          : `${relLevelStats.slice(0, -1).map(s => getBattleStatName(s)).join(", ")}${relLevelStats.length > 2 ? "," : ""} ${i18next.t("battle:statsAnd")} ${getBattleStatName(relLevelStats[relLevelStats.length - 1])}`;
        messages.push(getBattleStatLevelChangeDescription(getPokemonNameWithAffix(this.getPokemon()), statsFragment, Math.abs(parseInt(rl)), levels >= 1,relLevelStats.length));
      } else {
        statsFragment = getBattleStatName(relLevelStats[0]);
        messages.push(getBattleStatLevelChangeDescription(getPokemonNameWithAffix(this.getPokemon()), statsFragment, Math.abs(parseInt(rl)), levels >= 1,relLevelStats.length));
      }
    });

    return messages;
  }
}
//#endregion





//#region 46 WeatherEffectPhase
export class WeatherEffectPhase extends CommonAnimPhase {
  public weather: Weather | null;

  constructor(scene: BattleScene) {
    super(scene, undefined, undefined, CommonAnim.SUNNY + ((scene?.arena?.weather?.weatherType || WeatherType.NONE) - 1));
    this.weather = scene?.arena?.weather;
  }

  start() {
    // Update weather state with any changes that occurred during the turn
    this.weather = this.scene?.arena?.weather;

    if (!this.weather) {
      this.end();
      return;
    }

    this.setAnimation(CommonAnim.SUNNY + (this.weather.weatherType - 1));

    if (this.weather.isDamaging()) {

      const cancelled = new Utils.BooleanHolder(false);

      this.executeForAll((pokemon: Pokemon) => applyPreWeatherEffectAbAttrs(SuppressWeatherEffectAbAttr, pokemon, this.weather, cancelled));

      if (!cancelled.value) {
        const inflictDamage = (pokemon: Pokemon) => {
          const cancelled = new Utils.BooleanHolder(false);

          applyPreWeatherEffectAbAttrs(PreWeatherDamageAbAttr, pokemon, this.weather , cancelled);
          applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

          if (cancelled.value) {
            return;
          }

          const damage = Math.ceil(pokemon.getMaxHp() / 16);

          this.scene.queueMessage(getWeatherDamageMessage(this.weather?.weatherType!, pokemon)!); // TODO: are those bangs correct?
          pokemon.damageAndUpdate(damage, HitResult.EFFECTIVE, false, false, true);
        };

        this.executeForAll((pokemon: Pokemon) => {
          const immune = !pokemon || !!pokemon.getTypes(true, true).filter(t => this.weather?.isTypeDamageImmune(t)).length;
          if (!immune) {
            inflictDamage(pokemon);
          }
        });
      }
    }

    this.scene.ui.showText(getWeatherLapseMessage(this.weather.weatherType)!, null, () => { // TODO: is this bang correct?
      this.executeForAll((pokemon: Pokemon) => applyPostWeatherLapseAbAttrs(PostWeatherLapseAbAttr, pokemon, this.weather));

      super.start();
    });
  }
}
//#endregion





//#region 47 ObtainStatusEffectPhase
export class ObtainStatusEffectPhase extends PokemonPhase {
  private statusEffect: StatusEffect | undefined;
  private cureTurn: integer | null;
  private sourceText: string | null;
  private sourcePokemon: Pokemon | null;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, statusEffect?: StatusEffect, cureTurn?: integer | null, sourceText?: string, sourcePokemon?: Pokemon) {
    super(scene, battlerIndex);

    this.statusEffect = statusEffect;
    this.cureTurn = cureTurn!; // TODO: is this bang correct?
    this.sourceText = sourceText!; // TODO: is this bang correct?
    this.sourcePokemon = sourcePokemon!; // For tracking which Pokemon caused the status effect // TODO: is this bang correct?
  }

  start() {
    const pokemon = this.getPokemon();
    if (!pokemon?.status) {
      if (pokemon?.trySetStatus(this.statusEffect, false, this.sourcePokemon)) {
        if (this.cureTurn) {
          pokemon.status!.cureTurn = this.cureTurn; // TODO: is this bang correct?
        }
        pokemon.updateInfo(true);
        new CommonBattleAnim(CommonAnim.POISON + (this.statusEffect! - 1), pokemon).play(this.scene, () => {
          this.scene.queueMessage(getStatusEffectObtainText(this.statusEffect, getPokemonNameWithAffix(pokemon), this.sourceText ?? undefined));
          if (pokemon.status?.isPostTurn()) {
            this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, this.battlerIndex));
          }
          this.end();
        });
        return;
      }
    } else if (pokemon.status.effect === this.statusEffect) {
      this.scene.queueMessage(getStatusEffectOverlapText(this.statusEffect, getPokemonNameWithAffix(pokemon)));
    }
    this.end();
  }
}
//#endregion





//#region 48 PostTurnStatusEffectPhase
export class PostTurnStatusEffectPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    const pokemon = this.getPokemon();
    if (pokemon?.isActive(true) && pokemon.status && pokemon.status.isPostTurn()) {
      pokemon.status.incrementTurn();
      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);
      applyAbAttrs(BlockStatusDamageAbAttr, pokemon, cancelled);

      if (!cancelled.value) {
        this.scene.queueMessage(getStatusEffectActivationText(pokemon.status.effect, getPokemonNameWithAffix(pokemon)));
        const damage = new Utils.NumberHolder(0);
        switch (pokemon.status.effect) {
        case StatusEffect.POISON:
          damage.value = Math.max(pokemon.getMaxHp() >> 3, 1);
          break;
        case StatusEffect.TOXIC:
          damage.value = Math.max(Math.floor((pokemon.getMaxHp() / 16) * pokemon.status.turnCount), 1);
          break;
        case StatusEffect.BURN:
          damage.value = Math.max(pokemon.getMaxHp() >> 4, 1);
          applyAbAttrs(ReduceBurnDamageAbAttr, pokemon, null, damage);
          break;
        }
        if (damage.value) {
          // Set preventEndure flag to avoid pokemon surviving thanks to focus band, sturdy, endure ...
          this.scene.damageNumberHandler.add(this.getPokemon(), pokemon.damage(damage.value, false, true));
          pokemon.updateInfo();
        }
        new CommonBattleAnim(CommonAnim.POISON + (pokemon.status.effect - 1), pokemon).play(this.scene, () => this.end());
      } else {
        this.end();
      }
    } else {
      this.end();
    }
  }

  override end() {
    if (this.scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      this.scene.initFinalBossPhaseTwo(this.getPokemon());
    } else {
      super.end();
    }
  }
}
//#endregion





//#region 49 MessagePhase
export class MessagePhase extends Phase {
  private text: string;
  private callbackDelay: integer | null;
  private prompt: boolean | null;
  private promptDelay: integer | null;

  constructor(scene: BattleScene, text: string, callbackDelay?: integer | null, prompt?: boolean | null, promptDelay?: integer | null) {
    super(scene);

    this.text = text;
    this.callbackDelay = callbackDelay!; // TODO: is this bang correct?
    this.prompt = prompt!; // TODO: is this bang correct?
    this.promptDelay = promptDelay!; // TODO: is this bang correct?
  }

  start() {
    super.start();

    if (this.text.indexOf("$") > -1) {
      const pageIndex = this.text.indexOf("$");
      this.scene.unshiftPhase(new MessagePhase(this.scene, this.text.slice(pageIndex + 1), this.callbackDelay, this.prompt, this.promptDelay));
      this.text = this.text.slice(0, pageIndex).trim();
    }

    this.scene.ui.showText(this.text, null, () => this.end(), this.callbackDelay || (this.prompt ? 0 : 1500), this.prompt, this.promptDelay);
  }

  end() {
    if (this.scene.abilityBar.shown) {
      this.scene.abilityBar.hide();
    }

    super.end();
  }
}
//#endregion





//#region 50 DamagePhase
export class DamagePhase extends PokemonPhase {
  private amount: integer;
  private damageResult: DamageResult;
  private critical: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, amount: integer, damageResult?: DamageResult, critical: boolean = false) {
    super(scene, battlerIndex);

    this.amount = amount;
    this.damageResult = damageResult || HitResult.EFFECTIVE;
    this.critical = critical;
  }

  start() {
    super.start();

    if (this.damageResult === HitResult.ONE_HIT_KO) {
      if (this.scene.moveAnimations) {
        this.scene.toggleInvert(true);
      }
      this.scene.time.delayedCall(Utils.fixedInt(1000), () => {
        this.scene.toggleInvert(false);
        this.applyDamage();
      });
      return;
    }

    this.applyDamage();
  }

  updateAmount(amount: integer): void {
    this.amount = amount;
  }

  applyDamage() {
    switch (this.damageResult) {
    case HitResult.EFFECTIVE:
      this.scene.playSound("hit");
      break;
    case HitResult.SUPER_EFFECTIVE:
    case HitResult.ONE_HIT_KO:
      this.scene.playSound("hit_strong");
      break;
    case HitResult.NOT_VERY_EFFECTIVE:
      this.scene.playSound("hit_weak");
      break;
    }

    if (this.amount) {
      this.scene.damageNumberHandler.add(this.getPokemon(), this.amount, this.damageResult, this.critical);
    }

    if (this.damageResult !== HitResult.OTHER) {
      const flashTimer = this.scene.time.addEvent({
        delay: 100,
        repeat: 5,
        startAt: 200,
        callback: () => {
          this.getPokemon().getSprite().setVisible(flashTimer.repeatCount % 2 === 0);
          if (!flashTimer.repeatCount) {
            this.getPokemon().updateInfo().then(() => this.end());
          }
        }
      });
    } else {
      this.getPokemon().updateInfo().then(() => this.end());
    }
  }

  end() {
    switch (this.scene.currentBattle.battleSpec) {
    case BattleSpec.FINAL_BOSS:
      const pokemon = this.getPokemon();
      if (pokemon instanceof EnemyPokemon && pokemon.isBoss() && !pokemon.formIndex && pokemon.bossSegmentIndex < 1) {
        this.scene.fadeOutBgm(Utils.fixedInt(2000), false);
        this.scene.ui.showDialogue(battleSpecDialogue[BattleSpec.FINAL_BOSS].firstStageWin, pokemon.species.name, null, () => {
          this.scene.addEnemyModifier(getModifierType(modifierTypes.MINI_BLACK_HOLE).newModifier(pokemon) as PersistentModifier, false, true);
          pokemon.generateAndPopulateMoveset(1);
          this.scene.setFieldScale(0.75);
          this.scene.initFinalBossPhaseTwo(this.getPokemon());
          this.scene.currentBattle.double = true;
          const availablePartyMembers = this.scene.getParty().filter(p => p.isAllowedInBattle());
          if (availablePartyMembers.length > 1) {
            this.scene.pushPhase(new ToggleDoublePositionPhase(this.scene, true));
            if (!availablePartyMembers[1].isOnField()) {
              this.scene.pushPhase(new SummonPhase(this.scene, 1));
            }
          }

          super.end();
        });
        return;
      }
      break;
    }

    super.end();
  }
}
//#endregion





//#region 51 FaintPhase
export class FaintPhase extends PokemonPhase {
  private preventEndure: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, preventEndure?: boolean) {
    super(scene, battlerIndex);

    this.preventEndure = preventEndure!; // TODO: is this bang correct?
  }

  start() {
    super.start();

    if (!this.preventEndure) {
      const instantReviveModifier = this.scene.applyModifier(PokemonInstantReviveModifier, this.player, this.getPokemon()) as PokemonInstantReviveModifier;

      if (instantReviveModifier) {
        if (!--instantReviveModifier.stackCount) {
          this.scene.removeModifier(instantReviveModifier);
        }
        this.scene.updateModifiers(this.player);
        return this.end();
      }
    }

    if (!this.tryOverrideForBattleSpec()) {
      this.doFaint();
    }
  }

  doFaint(): void {
    const pokemon = this.getPokemon();


    // Track total times pokemon have been KO'd for supreme overlord/last respects
    if (pokemon.isPlayer()) {
      this.scene.currentBattle.playerFaints += 1;
    } else {
      this.scene.currentBattle.enemyFaints += 1;
    }

    this.scene.queueMessage(i18next.t("battle:fainted", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }), null, true);

    if (pokemon.turnData?.attacksReceived?.length) {
      const lastAttack = pokemon.turnData.attacksReceived[0];
      applyPostFaintAbAttrs(PostFaintAbAttr, pokemon, this.scene.getPokemonById(lastAttack.sourceId)!, new PokemonMove(lastAttack.move).getMove(), lastAttack.result); // TODO: is this bang correct?
    }

    const alivePlayField = this.scene.getField(true);
    alivePlayField.forEach(p => applyPostKnockOutAbAttrs(PostKnockOutAbAttr, p, pokemon));
    if (pokemon.turnData?.attacksReceived?.length) {
      const defeatSource = this.scene.getPokemonById(pokemon.turnData.attacksReceived[0].sourceId);
      if (defeatSource?.isOnField()) {
        applyPostVictoryAbAttrs(PostVictoryAbAttr, defeatSource);
        const pvmove = allMoves[pokemon.turnData.attacksReceived[0].move];
        const pvattrs = pvmove.getAttrs(PostVictoryStatChangeAttr);
        if (pvattrs.length) {
          for (const pvattr of pvattrs) {
            pvattr.applyPostVictory(defeatSource, defeatSource, pvmove);
          }
        }
      }
    }

    if (this.player) {
      /** The total number of Pokemon in the player's party that can legally fight */
      const legalPlayerPokemon = this.scene.getParty().filter(p => p.isAllowedInBattle());
      /** The total number of legal player Pokemon that aren't currently on the field */
      const legalPlayerPartyPokemon = legalPlayerPokemon.filter(p => !p.isActive(true));
      if (!legalPlayerPokemon.length) {
        /** If the player doesn't have any legal Pokemon, end the game */
        this.scene.unshiftPhase(new GameOverPhase(this.scene));
      } else if (this.scene.currentBattle.double && legalPlayerPokemon.length === 1 && legalPlayerPartyPokemon.length === 0) {
        /**
         * If the player has exactly one Pokemon in total at this point in a double battle, and that Pokemon
         * is already on the field, unshift a phase that moves that Pokemon to center position.
         */
        this.scene.unshiftPhase(new ToggleDoublePositionPhase(this.scene, true));
      } else if (legalPlayerPartyPokemon.length > 0) {
        /**
         * If previous conditions weren't met, and the player has at least 1 legal Pokemon off the field,
         * push a phase that prompts the player to summon a Pokemon from their party.
         */
        LoggerTools.isFaintSwitch.value = true;
        this.scene.pushPhase(new SwitchPhase(this.scene, this.fieldIndex, true, false));
      }
    } else {
      this.scene.unshiftPhase(new VictoryPhase(this.scene, this.battlerIndex));
      if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        const hasReservePartyMember = !!this.scene.getEnemyParty().filter(p => p.isActive() && !p.isOnField() && p.trainerSlot === (pokemon as EnemyPokemon).trainerSlot).length;
        if (hasReservePartyMember) {
          this.scene.pushPhase(new SwitchSummonPhase(this.scene, this.fieldIndex, -1, false, false, false));
        }
      }
    }

    // in double battles redirect potential moves off fainted pokemon
    if (this.scene.currentBattle.double) {
      const allyPokemon = pokemon.getAlly();
      this.scene.redirectPokemonMoves(pokemon, allyPokemon);
    }

    pokemon.lapseTags(BattlerTagLapseType.FAINT);
    this.scene.getField(true).filter(p => p !== pokemon).forEach(p => p.removeTagsBySourceId(pokemon.id));

    pokemon.faintCry(() => {
      if (pokemon instanceof PlayerPokemon) {
        pokemon.addFriendship(-10);
      }
      pokemon.hideInfo();
      this.scene.playSound("faint");
      this.scene.tweens.add({
        targets: pokemon,
        duration: 500,
        y: pokemon.y + 150,
        ease: "Sine.easeIn",
        onComplete: () => {
          pokemon.setVisible(false);
          pokemon.y -= 150;
          pokemon.trySetStatus(StatusEffect.FAINT);
          if (pokemon.isPlayer()) {
            this.scene.currentBattle.removeFaintedParticipant(pokemon as PlayerPokemon);
          } else {
            this.scene.addFaintedEnemyScore(pokemon as EnemyPokemon);
            this.scene.currentBattle.addPostBattleLoot(pokemon as EnemyPokemon);
          }
          this.scene.field.remove(pokemon);
          this.end();
        }
      });
    });
  }

  tryOverrideForBattleSpec(): boolean {
    switch (this.scene.currentBattle.battleSpec) {
    case BattleSpec.FINAL_BOSS:
      if (!this.player) {
        const enemy = this.getPokemon();
        if (enemy.formIndex) {
          this.scene.ui.showDialogue(battleSpecDialogue[BattleSpec.FINAL_BOSS].secondStageWin, enemy.species.name, null, () => this.doFaint());
        } else {
          // Final boss' HP threshold has been bypassed; cancel faint and force check for 2nd phase
          enemy.hp++;
          this.scene.unshiftPhase(new DamagePhase(this.scene, enemy.getBattlerIndex(), 0, HitResult.OTHER));
          this.end();
        }
        return true;
      }
    }

    return false;
  }
}
//#endregion





//#region 52 VictoryPhase
export class VictoryPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    this.scene.gameData.gameStats.pokemonDefeated++;

    const participantIds = this.scene.currentBattle.playerParticipantIds;
    const party = this.scene.getParty();
    const expShareModifier = this.scene.findModifier(m => m instanceof ExpShareModifier) as ExpShareModifier;
    const expBalanceModifier = this.scene.findModifier(m => m instanceof ExpBalanceModifier) as ExpBalanceModifier;
    const multipleParticipantExpBonusModifier = this.scene.findModifier(m => m instanceof MultipleParticipantExpBonusModifier) as MultipleParticipantExpBonusModifier;
    const nonFaintedPartyMembers = party.filter(p => p.hp);
    const expPartyMembers = nonFaintedPartyMembers.filter(p => p.level < this.scene.getMaxExpLevel());
    const partyMemberExp: number[] = [];

    if (participantIds.size) {
      let expValue = this.getPokemon().getExpValue();
      if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        expValue = Math.floor(expValue * 1.5);
      }
      for (const partyMember of nonFaintedPartyMembers) {
        const pId = partyMember.id;
        const participated = participantIds.has(pId);
        if (participated) {
          partyMember.addFriendship(2);
        }
        if (!expPartyMembers.includes(partyMember)) {
          continue;
        }
        if (!participated && !expShareModifier) {
          partyMemberExp.push(0);
          continue;
        }
        let expMultiplier = 0;
        if (participated) {
          expMultiplier += (1 / participantIds.size);
          if (participantIds.size > 1 && multipleParticipantExpBonusModifier) {
            expMultiplier += multipleParticipantExpBonusModifier.getStackCount() * 0.2;
          }
        } else if (expShareModifier) {
          expMultiplier += (expShareModifier.getStackCount() * 0.2) / participantIds.size;
        }
        if (partyMember.pokerus) {
          expMultiplier *= 1.5;
        }
        if (Overrides.XP_MULTIPLIER_OVERRIDE !== null) {
          expMultiplier = Overrides.XP_MULTIPLIER_OVERRIDE;
        }
        const pokemonExp = new Utils.NumberHolder(expValue * expMultiplier);
        this.scene.applyModifiers(PokemonExpBoosterModifier, true, partyMember, pokemonExp);
        partyMemberExp.push(Math.floor(pokemonExp.value));
      }

      if (expBalanceModifier) {
        let totalLevel = 0;
        let totalExp = 0;
        expPartyMembers.forEach((expPartyMember, epm) => {
          totalExp += partyMemberExp[epm];
          totalLevel += expPartyMember.level;
        });

        const medianLevel = Math.floor(totalLevel / expPartyMembers.length);

        const recipientExpPartyMemberIndexes: number[] = [];
        expPartyMembers.forEach((expPartyMember, epm) => {
          if (expPartyMember.level <= medianLevel) {
            recipientExpPartyMemberIndexes.push(epm);
          }
        });

        const splitExp = Math.floor(totalExp / recipientExpPartyMemberIndexes.length);

        expPartyMembers.forEach((_partyMember, pm) => {
          partyMemberExp[pm] = Phaser.Math.Linear(partyMemberExp[pm], recipientExpPartyMemberIndexes.indexOf(pm) > -1 ? splitExp : 0, 0.2 * expBalanceModifier.getStackCount());
        });
      }

      for (let pm = 0; pm < expPartyMembers.length; pm++) {
        const exp = partyMemberExp[pm];

        if (exp) {
          const partyMemberIndex = party.indexOf(expPartyMembers[pm]);
          this.scene.unshiftPhase(expPartyMembers[pm].isOnField() ? new ExpPhase(this.scene, partyMemberIndex, exp) : new ShowPartyExpBarPhase(this.scene, partyMemberIndex, exp));
        }
      }
    }

    if (!this.scene.getEnemyParty().find(p => this.scene.currentBattle.battleType ? !p?.isFainted(true) : p.isOnField())) {
      this.scene.pushPhase(new BattleEndPhase(this.scene));
      if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        this.scene.pushPhase(new TrainerVictoryPhase(this.scene));
      }
      if (this.scene.gameMode.isEndless || !this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex)) {
        this.scene.pushPhase(new EggLapsePhase(this.scene));
        if (this.scene.currentBattle.waveIndex % 10) {
          this.scene.pushPhase(new SelectModifierPhase(this.scene));
        } else if (this.scene.gameMode.isDaily) {
          LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, "")
          this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.EXP_CHARM));
          if (this.scene.currentBattle.waveIndex > 10 && !this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.GOLDEN_POKEBALL));
          }
        } else {
          LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, "")
          const superExpWave = !this.scene.gameMode.isEndless ? (this.scene.offsetGym ? 0 : 20) : 10;
          if (this.scene.gameMode.isEndless && this.scene.currentBattle.waveIndex === 10) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.EXP_SHARE));
          }
          if (this.scene.currentBattle.waveIndex <= 750 && (this.scene.currentBattle.waveIndex <= 500 || (this.scene.currentBattle.waveIndex % 30) === superExpWave)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, (this.scene.currentBattle.waveIndex % 30) !== superExpWave || this.scene.currentBattle.waveIndex > 250 ? modifierTypes.EXP_CHARM : modifierTypes.SUPER_EXP_CHARM));
          }
          if (this.scene.currentBattle.waveIndex <= 150 && !(this.scene.currentBattle.waveIndex % 50)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, modifierTypes.GOLDEN_POKEBALL));
          }
          if (this.scene.gameMode.isEndless && !(this.scene.currentBattle.waveIndex % 50)) {
            this.scene.pushPhase(new ModifierRewardPhase(this.scene, !(this.scene.currentBattle.waveIndex % 250) ? modifierTypes.VOUCHER_PREMIUM : modifierTypes.VOUCHER_PLUS));
            this.scene.pushPhase(new AddEnemyBuffModifierPhase(this.scene));
          }
        }
        this.scene.pushPhase(new NewBattlePhase(this.scene));
      } else {
        LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, "")
        this.scene.currentBattle.battleType = BattleType.CLEAR;
        this.scene.score += this.scene.gameMode.getClearScoreBonus();
        this.scene.updateScoreText();
        this.scene.pushPhase(new GameOverPhase(this.scene, true));
      }
    }

    this.end();
  }
}
//#endregion





//#region 53 TrainerVictoryPhase
export class TrainerVictoryPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    this.scene.disableMenu = true;

    this.scene.playBgm(this.scene.currentBattle.trainer?.config.victoryBgm);

    this.scene.unshiftPhase(new MoneyRewardPhase(this.scene, this.scene.currentBattle.trainer?.config.moneyMultiplier!)); // TODO: is this bang correct?

    const modifierRewardFuncs = this.scene.currentBattle.trainer?.config.modifierRewardFuncs!; // TODO: is this bang correct?
    for (const modifierRewardFunc of modifierRewardFuncs) {
      this.scene.unshiftPhase(new ModifierRewardPhase(this.scene, modifierRewardFunc));
    }

    const trainerType = this.scene.currentBattle.trainer?.config.trainerType!; // TODO: is this bang correct?
    if (vouchers.hasOwnProperty(TrainerType[trainerType])) {
      if (!this.scene.validateVoucher(vouchers[TrainerType[trainerType]]) && this.scene.currentBattle.trainer?.config.isBoss) {
        this.scene.unshiftPhase(new ModifierRewardPhase(this.scene, [modifierTypes.VOUCHER, modifierTypes.VOUCHER, modifierTypes.VOUCHER_PLUS, modifierTypes.VOUCHER_PREMIUM][vouchers[TrainerType[trainerType]].voucherType]));
      }
    }

    this.scene.ui.showText(i18next.t("battle:trainerDefeated", { trainerName: this.scene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) }), null, () => {
      const victoryMessages = this.scene.currentBattle.trainer?.getVictoryMessages()!; // TODO: is this bang correct?
      let message: string;
      this.scene.executeWithSeedOffset(() => message = Utils.randSeedItem(victoryMessages), this.scene.currentBattle.waveIndex);
      message = message!; // tell TS compiler it's defined now

      const showMessage = () => {
        const originalFunc = showMessageOrEnd;
        showMessageOrEnd = () => this.scene.ui.showDialogue(message, this.scene.currentBattle.trainer?.getName(), null, originalFunc);

        showMessageOrEnd();
      };
      let showMessageOrEnd = () => this.end();
      if (victoryMessages?.length) {
        if (this.scene.currentBattle.trainer?.config.hasCharSprite && !this.scene.ui.shouldSkipDialogue(message)) {
          const originalFunc = showMessageOrEnd;
          showMessageOrEnd = () => this.scene.charSprite.hide().then(() => this.scene.hideFieldOverlay(250).then(() => originalFunc()));
          this.scene.showFieldOverlay(500).then(() => this.scene.charSprite.showCharacter(this.scene.currentBattle.trainer?.getKey()!, getCharVariantFromDialogue(victoryMessages[0])).then(() => showMessage())); // TODO: is this bang correct?
        } else {
          showMessage();
        }
      } else {
        showMessageOrEnd();
      }
    }, null, true);

    this.showEnemyTrainer();
  }
}
//#endregion





//#region 54 MoneyRewardPhase
export class MoneyRewardPhase extends BattlePhase {
  private moneyMultiplier: number;

  constructor(scene: BattleScene, moneyMultiplier: number) {
    super(scene);

    this.moneyMultiplier = moneyMultiplier;
  }

  start() {
    const moneyAmount = new Utils.IntegerHolder(this.scene.getWaveMoneyAmount(this.moneyMultiplier));

    this.scene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    if (this.scene.arena.getTag(ArenaTagType.HAPPY_HOUR)) {
      moneyAmount.value *= 2;
    }

    this.scene.addMoney(moneyAmount.value);

    const userLocale = navigator.language || "en-US";
    const formattedMoneyAmount = moneyAmount.value.toLocaleString(userLocale);
    const message = i18next.t("battle:moneyWon", { moneyAmount: formattedMoneyAmount });

    this.scene.ui.showText(message, null, () => this.end(), null, true);
  }
}
//#endregion





//#region 55 ModifierRewardPhase
export class ModifierRewardPhase extends BattlePhase {
  protected modifierType: ModifierType;

  constructor(scene: BattleScene, modifierTypeFunc: ModifierTypeFunc) {
    super(scene);

    this.modifierType = getModifierType(modifierTypeFunc);
  }

  start() {
    super.start();

    this.doReward().then(() => this.end());
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      this.scene.addModifier(newModifier).then(() => {
        this.scene.playSound("item_fanfare");
        this.scene.ui.showText(i18next.t("battle:rewardGain", { modifierName: newModifier?.type.name }), null, () => resolve(), null, true);
      });
    });
  }
}
//#endregion





//#region 56 GameOverModifierRewardPhase
export class GameOverModifierRewardPhase extends ModifierRewardPhase {
  constructor(scene: BattleScene, modifierTypeFunc: ModifierTypeFunc) {
    super(scene, modifierTypeFunc);
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      this.scene.addModifier(newModifier).then(() => {
        this.scene.playSound("level_up_fanfare");
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.fadeIn(250).then(() => {
          this.scene.ui.showText(i18next.t("battle:rewardGain", { modifierName: newModifier?.type.name }), null, () => {
            this.scene.time.delayedCall(1500, () => this.scene.arenaBg.setVisible(true));
            resolve();
          }, null, true, 1500);
        });
      });
    });
  }
}
//#endregion





//#region 57 RibbonModifierRewardPhase
export class RibbonModifierRewardPhase extends ModifierRewardPhase {
  private species: PokemonSpecies;

  constructor(scene: BattleScene, modifierTypeFunc: ModifierTypeFunc, species: PokemonSpecies) {
    super(scene, modifierTypeFunc);

    this.species = species;
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      this.scene.addModifier(newModifier).then(() => {
        this.scene.playSound("level_up_fanfare");
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:beatModeFirstTime", {
          speciesName: this.species.name,
          gameMode: this.scene.gameMode.getName(),
          newModifier: newModifier?.type.name
        }), null, () => {
          resolve();
        }, null, true, 1500);
      });
    });
  }
}
//#endregion





//#region 58 GameOverPhase
export class GameOverPhase extends BattlePhase {
  private victory: boolean;
  private firstRibbons: PokemonSpecies[] = [];

  constructor(scene: BattleScene, victory?: boolean) {
    super(scene);

    this.victory = !!victory;
  }

  start() {
    super.start();

    // Failsafe if players somehow skip floor 200 in classic mode
    if (this.scene.gameMode.isClassic && this.scene.currentBattle.waveIndex > 200) {
      this.victory = true;
    }

    if (this.victory && this.scene.gameMode.isEndless) {
      this.scene.ui.showDialogue(i18next.t("PGMmiscDialogue:ending_endless"), i18next.t("PGMmiscDialogue:ending_name"), 0, () => this.handleGameOver());
    } else if (this.victory || !this.scene.enableRetries) {
      this.handleGameOver();
    } else {
      this.scene.ui.showText(i18next.t("battle:retryBattle"), null, () => {
        this.scene.ui.setMode(Mode.CONFIRM, () => {
          this.scene.ui.fadeOut(1250).then(() => {
            this.scene.reset();
            this.scene.clearPhaseQueue();
            this.scene.gameData.loadSession(this.scene, this.scene.sessionSlotId).then(() => {
              this.scene.pushPhase(new EncounterPhase(this.scene, true));

              const availablePartyMembers = this.scene.getParty().filter(p => p.isAllowedInBattle()).length;

              this.scene.pushPhase(new SummonPhase(this.scene, 0));
              if (this.scene.currentBattle.double && availablePartyMembers > 1) {
                this.scene.pushPhase(new SummonPhase(this.scene, 1));
              }
              if (this.scene.currentBattle.waveIndex > 1 && this.scene.currentBattle.battleType !== BattleType.TRAINER) {
                this.scene.pushPhase(new CheckSwitchPhase(this.scene, 0, this.scene.currentBattle.double));
                if (this.scene.currentBattle.double && availablePartyMembers > 1) {
                  this.scene.pushPhase(new CheckSwitchPhase(this.scene, 1, this.scene.currentBattle.double));
                }
              }

              this.scene.ui.fadeIn(1250);
              this.end();
            });
          });
        }, () => this.handleGameOver(), false, 0, 0, 1000);
      });
    }
  }

  handleGameOver(): void {
    const doGameOver = (newClear: boolean) => {
      this.scene.disableMenu = true;
      this.scene.time.delayedCall(1000, () => {
        let firstClear = false;
        if (this.victory && newClear) {
          if (this.scene.gameMode.isClassic) {
            firstClear = this.scene.validateAchv(achvs.CLASSIC_VICTORY);
            this.scene.validateAchv(achvs.UNEVOLVED_CLASSIC_VICTORY);
            this.scene.gameData.gameStats.sessionsWon++;
            for (const pokemon of this.scene.getParty()) {
              this.awardRibbon(pokemon);

              if (pokemon.species.getRootSpeciesId() !== pokemon.species.getRootSpeciesId(true)) {
                this.awardRibbon(pokemon, true);
              }
            }
          } else if (this.scene.gameMode.isDaily && newClear) {
            this.scene.gameData.gameStats.dailyRunSessionsWon++;
          }
        }
        const fadeDuration = this.victory ? 10000 : 5000;
        this.scene.fadeOutBgm(fadeDuration, true);
        const activeBattlers = this.scene.getField().filter(p => p?.isActive(true));
        activeBattlers.map(p => p.hideInfo());
        this.scene.ui.fadeOut(fadeDuration).then(() => {
          activeBattlers.map(a => a.setVisible(false));
          this.scene.setFieldScale(1, true);
          this.scene.clearPhaseQueue();
          this.scene.ui.clearText();

          if (this.victory && this.scene.gameMode.isChallenge) {
            this.scene.gameMode.challenges.forEach(c => this.scene.validateAchvs(ChallengeAchv, c));
          }

          const clear = (endCardPhase?: EndCardPhase) => {
            if (newClear) {
              this.handleUnlocks();
            }
            if (this.victory && newClear) {
              for (const species of this.firstRibbons) {
                this.scene.unshiftPhase(new RibbonModifierRewardPhase(this.scene, modifierTypes.VOUCHER_PLUS, species));
              }
              if (!firstClear) {
                this.scene.unshiftPhase(new GameOverModifierRewardPhase(this.scene, modifierTypes.VOUCHER_PREMIUM));
              }
            }
            this.scene.pushPhase(new PostGameOverPhase(this.scene, endCardPhase));
            this.end();
          };

          if (this.victory && this.scene.gameMode.isClassic) {
            const message = miscDialogue.ending[this.scene.gameData.gender === PlayerGender.FEMALE ? 0 : 1];

            if (!this.scene.ui.shouldSkipDialogue(message)) {
              this.scene.ui.fadeIn(500).then(() => {
                this.scene.charSprite.showCharacter(`rival_${this.scene.gameData.gender === PlayerGender.FEMALE ? "m" : "f"}`, getCharVariantFromDialogue(miscDialogue.ending[this.scene.gameData.gender === PlayerGender.FEMALE ? 0 : 1])).then(() => {
                  this.scene.ui.showDialogue(message, this.scene.gameData.gender === PlayerGender.FEMALE ? trainerConfigs[TrainerType.RIVAL].name : trainerConfigs[TrainerType.RIVAL].nameFemale, null, () => {
                    this.scene.ui.fadeOut(500).then(() => {
                      this.scene.charSprite.hide().then(() => {
                        const endCardPhase = new EndCardPhase(this.scene);
                        this.scene.unshiftPhase(endCardPhase);
                        clear(endCardPhase);
                      });
                    });
                  });
                });
              });
            } else {
              const endCardPhase = new EndCardPhase(this.scene);
              this.scene.unshiftPhase(endCardPhase);
              clear(endCardPhase);
            }
          } else {
            clear();
          }
        });
      });
    };

    /* Added a local check to see if the game is running offline on victory
    If Online, execute apiFetch as intended
    If Offline, execute offlineNewClear(), a localStorage implementation of newClear daily run checks */
    if (this.victory) {
      if (!Utils.isLocal) {
        Utils.apiFetch(`savedata/session/newclear?slot=${this.scene.sessionSlotId}&clientSessionId=${clientSessionId}`, true)
          .then(response => response.json())
          .then(newClear => doGameOver(newClear));
      } else {
        this.scene.gameData.offlineNewClear(this.scene).then(result => {
          doGameOver(result);
        });
      }
    } else {
      doGameOver(false);
    }
  }

  handleUnlocks(): void {
    if (this.victory && this.scene.gameMode.isClassic) {
      if (!this.scene.gameData.unlocks[Unlockables.ENDLESS_MODE]) {
        this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.ENDLESS_MODE));
      }
      if (this.scene.getParty().filter(p => p.fusionSpecies).length && !this.scene.gameData.unlocks[Unlockables.SPLICED_ENDLESS_MODE]) {
        this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.SPLICED_ENDLESS_MODE));
      }
      if (!this.scene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE]) {
        this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.MINI_BLACK_HOLE));
      }
      if (!this.scene.gameData.unlocks[Unlockables.EVIOLITE] && this.scene.getParty().some(p => p.getSpeciesForm(true).speciesId in pokemonEvolutions)) {
        this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.EVIOLITE));
      }
    }
  }

  awardRibbon(pokemon: Pokemon, forStarter: boolean = false): void {
    const speciesId = getPokemonSpecies(pokemon.species.speciesId);
    const speciesRibbonCount = this.scene.gameData.incrementRibbonCount(speciesId, forStarter);
    // first time classic win, award voucher
    if (speciesRibbonCount === 1) {
      this.firstRibbons.push(getPokemonSpecies(pokemon.species.getRootSpeciesId(forStarter)));
    }
  }
}
//#endregion





//#region 59 EndCardPhase
export class EndCardPhase extends Phase {
  public endCard: Phaser.GameObjects.Image;
  public text: Phaser.GameObjects.Text;

  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    super.start();

    this.scene.ui.getMessageHandler().bg.setVisible(false);
    this.scene.ui.getMessageHandler().nameBoxContainer.setVisible(false);

    this.endCard = this.scene.add.image(0, 0, `end_${this.scene.gameData.gender === PlayerGender.FEMALE ? "f" : "m"}`);
    this.endCard.setOrigin(0);
    this.endCard.setScale(0.5);
    this.scene.field.add(this.endCard);

    this.text = addTextObject(this.scene, this.scene.game.canvas.width / 12, (this.scene.game.canvas.height / 6) - 16, i18next.t("battle:congratulations"), TextStyle.SUMMARY, { fontSize: "128px" });
    this.text.setOrigin(0.5);
    this.scene.field.add(this.text);

    this.scene.ui.clearText();

    this.scene.ui.fadeIn(1000).then(() => {

      this.scene.ui.showText("", null, () => {
        this.scene.ui.getMessageHandler().bg.setVisible(true);
        this.end();
      }, null, true);
    });
  }
}
//#endregion





//#region 60 UnlockPhase
export class UnlockPhase extends Phase {
  private unlockable: Unlockables;

  constructor(scene: BattleScene, unlockable: Unlockables) {
    super(scene);

    this.unlockable = unlockable;
  }

  start(): void {
    this.scene.time.delayedCall(2000, () => {
      this.scene.gameData.unlocks[this.unlockable] = true;
      this.scene.playSound("level_up_fanfare");
      this.scene.ui.setMode(Mode.MESSAGE);
      this.scene.ui.showText(i18next.t("battle:unlockedSomething", { unlockedThing: getUnlockableName(this.unlockable) }), null, () => {
        this.scene.time.delayedCall(1500, () => this.scene.arenaBg.setVisible(true));
        this.end();
      }, null, true, 1500);
    });
  }
}
//#endregion





//#region 61 PostGameOverPhase
export class PostGameOverPhase extends Phase {
  private endCardPhase: EndCardPhase | null;

  constructor(scene: BattleScene, endCardPhase?: EndCardPhase) {
    super(scene);

    this.endCardPhase = endCardPhase!; // TODO: is this bang correct?
  }

  start() {
    super.start();

    const saveAndReset = () => {
      this.scene.gameData.saveAll(this.scene, true, true, true).then(success => {
        if (!success) {
          return this.scene.reset(true);
        }
        this.scene.gameData.tryClearSession(this.scene, this.scene.sessionSlotId).then((success: boolean | [boolean, boolean]) => {
          if (!success[0]) {
            return this.scene.reset(true);
          }
          this.scene.reset();
          this.scene.unshiftPhase(new TitlePhase(this.scene));
          this.end();
        });
      });
    };

    if (this.endCardPhase) {
      this.scene.ui.fadeOut(500).then(() => {
        this.scene.ui.getMessageHandler().bg.setVisible(true);

        this.endCardPhase?.endCard.destroy();
        this.endCardPhase?.text.destroy();
        saveAndReset();
      });
    } else {
      saveAndReset();
    }
  }
}

/**
 * Opens the party selector UI and transitions into a {@linkcode SwitchSummonPhase}
 * for the player (if a switch would be valid for the current battle state).
 */




//#region 62 SwitchPhase
export class SwitchPhase extends BattlePhase {
  protected fieldIndex: integer;
  private isModal: boolean;
  private doReturn: boolean;

  /**
   * Creates a new SwitchPhase
   * @param scene {@linkcode BattleScene} Current battle scene
   * @param fieldIndex Field index to switch out
   * @param isModal Indicates if the switch should be forced (true) or is
   * optional (false).
   * @param doReturn Indicates if the party member on the field should be
   * recalled to ball or has already left the field. Passed to {@linkcode SwitchSummonPhase}.
   */
  constructor(scene: BattleScene, fieldIndex: integer, isModal: boolean, doReturn: boolean) {
    super(scene);

    this.fieldIndex = fieldIndex;
    this.isModal = isModal;
    this.doReturn = doReturn;
  }

  start() {
    super.start();

    // Skip modal switch if impossible (no remaining party members that aren't in battle)
    if (this.isModal && !this.scene.getParty().filter(p => p.isAllowedInBattle() && !p.isActive(true)).length) {
      LoggerTools.isPreSwitch.value = false;
      LoggerTools.isFaintSwitch.value = false;
      return super.end();
    }

    // Skip if the fainted party member has been revived already. doReturn is
    // only passed as `false` from FaintPhase (as opposed to other usages such
    // as ForceSwitchOutAttr or CheckSwitchPhase), so we only want to check this
    // if the mon should have already been returned but is still alive and well
    // on the field. see also; battle.test.ts
    if (this.isModal && !this.doReturn && !this.scene.getParty()[this.fieldIndex].isFainted()) {
      return super.end();
    }

    // Check if there is any space still in field
    if (this.isModal && this.scene.getPlayerField().filter(p => p.isAllowedInBattle() && p.isActive(true)).length >= this.scene.currentBattle.getBattlerCount()) {
      LoggerTools.isPreSwitch.value = false;
      LoggerTools.isFaintSwitch.value = false;
      return super.end();
    }

    // Override field index to 0 in case of double battle where 2/3 remaining legal party members fainted at once
    const fieldIndex = this.scene.currentBattle.getBattlerCount() === 1 || this.scene.getParty().filter(p => p.isAllowedInBattle()).length > 1 ? this.fieldIndex : 0;

    this.scene.ui.setMode(Mode.PARTY, this.isModal ? PartyUiMode.FAINT_SWITCH : PartyUiMode.POST_BATTLE_SWITCH, fieldIndex, (slotIndex: integer, option: PartyOption) => {
      if (this.isModal) {console.error("Forced Switch Detected")}
      if (slotIndex >= this.scene.currentBattle.getBattlerCount() && slotIndex < 6) {
        if (LoggerTools.isPreSwitch.value) {
          LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "Pre-switch" + (option == PartyOption.PASS_BATON ? "+ Baton" : "") + " " + LoggerTools.playerPokeName(this.scene, fieldIndex) + " to " + LoggerTools.playerPokeName(this.scene, slotIndex))
        } else if (LoggerTools.isFaintSwitch.value) {
          LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, (option == PartyOption.PASS_BATON ? "Baton" : "Send") + " in " + LoggerTools.playerPokeName(this.scene, slotIndex))
        } else {
          //LoggerTools.Actions[this.scene.getParty()[fieldIndex].getBattlerIndex()] += " to " + LoggerTools.playerPokeName(this.scene, slotIndex)
          LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, `Switch ${LoggerTools.playerPokeName(this.scene, fieldIndex)} to ${LoggerTools.playerPokeName(this.scene, slotIndex)}`)
        }
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, fieldIndex, slotIndex, this.doReturn, option === PartyOption.PASS_BATON));
      }
      LoggerTools.isPreSwitch.value = false;
      this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
    }, PartyUiHandler.FilterNonFainted);
  }
}
//#endregion





//#region 63 ExpPhase
export class ExpPhase extends PlayerPartyMemberPokemonPhase {
  private expValue: number;

  constructor(scene: BattleScene, partyMemberIndex: integer, expValue: number) {
    super(scene, partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const exp = new Utils.NumberHolder(this.expValue);
    this.scene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);
    this.scene.ui.showText(i18next.t("battle:expGain", { pokemonName: getPokemonNameWithAffix(pokemon), exp: exp.value }), null, () => {
      const lastLevel = pokemon.level;
      pokemon.addExp(exp.value);
      const newLevel = pokemon.level;
      if (newLevel > lastLevel) {
        this.scene.unshiftPhase(new LevelUpPhase(this.scene, this.partyMemberIndex, lastLevel, newLevel));
      }
      pokemon.updateInfo().then(() => this.end());
    }, null, true);
  }
}
//#endregion





//#region 64 ShowPartyExpBarPhase
export class ShowPartyExpBarPhase extends PlayerPartyMemberPokemonPhase {
  private expValue: number;

  constructor(scene: BattleScene, partyMemberIndex: integer, expValue: number) {
    super(scene, partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const exp = new Utils.NumberHolder(this.expValue);
    this.scene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);

    const lastLevel = pokemon.level;
    pokemon.addExp(exp.value);
    const newLevel = pokemon.level;
    if (newLevel > lastLevel) {
      this.scene.unshiftPhase(new LevelUpPhase(this.scene, this.partyMemberIndex, lastLevel, newLevel));
    }
    this.scene.unshiftPhase(new HidePartyExpBarPhase(this.scene));
    pokemon.updateInfo();

    if (this.scene.expParty === ExpNotification.SKIP) {
      this.end();
    } else if (this.scene.expParty === ExpNotification.ONLY_LEVEL_UP) {
      if (newLevel > lastLevel) { // this means if we level up
        // instead of displaying the exp gain in the small frame, we display the new level
        // we use the same method for mode 0 & 1, by giving a parameter saying to display the exp or the level
        this.scene.partyExpBar.showPokemonExp(pokemon, exp.value, this.scene.expParty === ExpNotification.ONLY_LEVEL_UP, newLevel).then(() => {
          setTimeout(() => this.end(), 800 / Math.pow(2, this.scene.expGainsSpeed));
        });
      } else {
        this.end();
      }
    } else if (this.scene.expGainsSpeed < 3) {
      this.scene.partyExpBar.showPokemonExp(pokemon, exp.value, false, newLevel).then(() => {
        setTimeout(() => this.end(), 500 / Math.pow(2, this.scene.expGainsSpeed));
      });
    } else {
      this.end();
    }

  }
}
//#endregion





//#region 65 HidePartyExpBarPhase
export class HidePartyExpBarPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.partyExpBar.hide().then(() => this.end());
  }
}
//#endregion





//#region 66 LevelUpPhase
export class LevelUpPhase extends PlayerPartyMemberPokemonPhase {
  private lastLevel: integer;
  private level: integer;

  constructor(scene: BattleScene, partyMemberIndex: integer, lastLevel: integer, level: integer) {
    super(scene, partyMemberIndex);

    this.lastLevel = lastLevel;
    this.level = level;
    this.scene = scene;
  }

  start() {
    super.start();

    if (this.level > this.scene.gameData.gameStats.highestLevel) {
      this.scene.gameData.gameStats.highestLevel = this.level;
    }

    this.scene.validateAchvs(LevelAchv, new Utils.IntegerHolder(this.level));

    const pokemon = this.getPokemon();
    const prevStats = pokemon.stats.slice(0);
    pokemon.calculateStats();
    pokemon.updateInfo();
    if (this.scene.expParty === ExpNotification.DEFAULT) {
      this.scene.playSound("level_up_fanfare");
      this.scene.ui.showText(i18next.t("battle:levelUp", { pokemonName: getPokemonNameWithAffix(this.getPokemon()), level: this.level }), null, () => this.scene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false).then(() => this.end()), null, true);
    } else if (this.scene.expParty === ExpNotification.SKIP) {
      this.end();
    } else {
      // we still want to display the stats if activated
      this.scene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false).then(() => this.end());
    }
    if (this.lastLevel < 100) { // this feels like an unnecessary optimization
      const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
      for (const lm of levelMoves) {
        this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, lm[1]));
      }
    }
    if (!pokemon.pauseEvolutions) {
      const evolution = pokemon.getEvolution();
      if (evolution) {
        this.scene.unshiftPhase(new EvolutionPhase(this.scene, pokemon as PlayerPokemon, evolution, this.lastLevel));
      }
    }
  }
}
//#endregion





//#region 67 LearnMovePhase
export class LearnMovePhase extends PlayerPartyMemberPokemonPhase {
  private moveId: Moves;

  constructor(scene: BattleScene, partyMemberIndex: integer, moveId: Moves) {
    super(scene, partyMemberIndex);

    this.moveId = moveId;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const move = allMoves[this.moveId];

    const existingMoveIndex = pokemon.getMoveset().findIndex(m => m?.moveId === move.id);

    if (existingMoveIndex > -1) {
      return this.end();
    }

    const emptyMoveIndex = pokemon.getMoveset().length < 4
      ? pokemon.getMoveset().length
      : pokemon.getMoveset().findIndex(m => m === null);

    const messageMode = this.scene.ui.getHandler() instanceof EvolutionSceneHandler
      ? Mode.EVOLUTION_SCENE
      : Mode.MESSAGE;
    const noHandler = () => {
      this.scene.ui.setMode(messageMode).then(() => {
        this.scene.ui.showText(i18next.t("battle:learnMoveStopTeaching", { moveName: move.name }), null, () => {
          this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
            this.scene.ui.setMode(messageMode);
            var W = LoggerTools.getWave(LoggerTools.getDRPD(this.scene), this.scene.currentBattle.waveIndex, this.scene)
            if (W.shop != "") {
              LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, W.shop + "; skip learning it")
            } else {
              var actions = LoggerTools.getActionCount(this.scene, this.scene.currentBattle.waveIndex)
              LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "Skip " + move.name)
            }
            this.scene.ui.showText(i18next.t("battle:learnMoveNotLearned", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => this.end(), null, true);
          }, (false ? movesFullHandler : () => {
            this.scene.ui.setMode(messageMode);
            this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, this.moveId));
            this.end();
          }));
        });
      });
    };
    const noHandlerInstant = () => {
      this.scene.ui.setMode(messageMode);
      var W = LoggerTools.getWave(LoggerTools.getDRPD(this.scene), this.scene.currentBattle.waveIndex, this.scene)
      if (W.shop != "") {
        LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, W.shop + "; skip learning it")
      } else {
        var actions = LoggerTools.getActionCount(this.scene, this.scene.currentBattle.waveIndex)
        LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, (actions == 0 ? "" : "") + LoggerTools.playerPokeName(this.scene, pokemon) + " | Skip " + move.name)
      }
      this.scene.ui.showText(i18next.t("battle:learnMoveNotLearned", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => this.end(), null, true);
    };
    const movesFullHandler = () => {
      this.scene.ui.showText(i18next.t("battle:learnMovePrompt", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => {
        this.scene.ui.showText(i18next.t("battle:learnMoveLimitReached", { pokemonName: getPokemonNameWithAffix(pokemon) }), null, () => {
          this.scene.ui.showText(i18next.t("battle:learnMoveReplaceQuestion", { moveName: move.name }), null, () => {
            this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
              this.scene.ui.setMode(messageMode);
              this.scene.ui.showText(i18next.t("battle:learnMoveForgetQuestion"), null, () => {
                this.scene.ui.setModeWithoutClear(Mode.SUMMARY, this.getPokemon(), SummaryUiMode.LEARN_MOVE, move, (moveIndex: integer) => {
                  if (moveIndex === 4) {
                    noHandler();
                    return;
                  }
                  this.scene.ui.setMode(messageMode).then(() => {
                    this.scene.ui.showText(i18next.t("battle:countdownPoof"), null, () => {
                      this.scene.ui.showText(i18next.t("battle:learnMoveForgetSuccess", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: pokemon.moveset[moveIndex]!.getName() }), null, () => { // TODO: is the bang correct?
                        this.scene.ui.showText(i18next.t("battle:learnMoveAnd"), null, () => {
                          var W = LoggerTools.getWave(LoggerTools.getDRPD(this.scene), this.scene.currentBattle.waveIndex, this.scene)
                          if (W.shop != "") {
                            LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, W.shop + " | " + new PokemonMove(this.moveId).getName() + " → " + pokemon.moveset[moveIndex]!.getName())
                          } else {
                            var actions = LoggerTools.getActionCount(this.scene, this.scene.currentBattle.waveIndex)
                            LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, (actions == 0 ? "" : "") + LoggerTools.playerPokeName(this.scene, pokemon) + " | " + new PokemonMove(this.moveId).getName() + " → " + pokemon.moveset[moveIndex]!.getName())
                          }
                          pokemon.setMove(moveIndex, Moves.NONE);
                          this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, this.moveId));
                          this.end();
                        }, null, true);
                      }, null, true);
                    }, null, true);
                  });
                });
              }, null, true);
            }, noHandler);
          });
        }, null, true);
      }, null, true);
    }
    if (emptyMoveIndex > -1) {
      pokemon.setMove(emptyMoveIndex, this.moveId);
      initMoveAnim(this.scene, this.moveId).then(() => {
        loadMoveAnimAssets(this.scene, [this.moveId], true)
          .then(() => {
            this.scene.ui.setMode(messageMode).then(() => {
              this.scene.playSound("level_up_fanfare");
              this.scene.ui.showText(i18next.t("battle:learnMove", { pokemonName: getPokemonNameWithAffix(pokemon), moveName: move.name }), null, () => {
                this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeMoveLearnedTrigger, true);
                this.end();
              }, messageMode === Mode.EVOLUTION_SCENE ? 1000 : null, true);
            });
          });
      });
    } else if (move.isUnimplemented() && false) {
      this.scene.ui.setMode(messageMode).then(() => {
        this.scene.ui.showText(`${getPokemonNameWithAffix(pokemon)} wants to learn ${move.name}, but this move does nothing.`, null, () => {
          this.scene.ui.showText(`Would you like to teach ${move.name} anyways? (This will be logged as normal)`, null, () => {
            this.scene.ui.setModeWithoutClear(Mode.CONFIRM, movesFullHandler, noHandler)
          })
        })
      });
    } else {
      this.scene.ui.setMode(messageMode).then(movesFullHandler);
    }
  }
}
//#endregion





//#region 68 PokemonHealPhase
export class PokemonHealPhase extends CommonAnimPhase {
  private hpHealed: integer;
  private message: string | null;
  private showFullHpMessage: boolean;
  private skipAnim: boolean;
  private revive: boolean;
  private healStatus: boolean;
  private preventFullHeal: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, hpHealed: integer, message: string | null, showFullHpMessage: boolean, skipAnim: boolean = false, revive: boolean = false, healStatus: boolean = false, preventFullHeal: boolean = false) {
    super(scene, battlerIndex, undefined, CommonAnim.HEALTH_UP);

    this.hpHealed = hpHealed;
    this.message = message;
    this.showFullHpMessage = showFullHpMessage;
    this.skipAnim = skipAnim;
    this.revive = revive;
    this.healStatus = healStatus;
    this.preventFullHeal = preventFullHeal;
  }

  start() {
    if (!this.skipAnim && (this.revive || this.getPokemon().hp) && !this.getPokemon().isFullHp()) {
      super.start();
    } else {
      this.end();
    }
  }

  end() {
    const pokemon = this.getPokemon();

    if (!pokemon.isOnField() || (!this.revive && !pokemon.isActive())) {
      super.end();
      return;
    }

    const hasMessage = !!this.message;
    const healOrDamage = (!pokemon.isFullHp() || this.hpHealed < 0);
    let lastStatusEffect = StatusEffect.NONE;

    if (healOrDamage) {
      const hpRestoreMultiplier = new Utils.IntegerHolder(1);
      if (!this.revive) {
        this.scene.applyModifiers(HealingBoosterModifier, this.player, hpRestoreMultiplier);
      }
      const healAmount = new Utils.NumberHolder(Math.floor(this.hpHealed * hpRestoreMultiplier.value));
      if (healAmount.value < 0) {
        pokemon.damageAndUpdate(healAmount.value * -1, HitResult.HEAL as DamageResult);
        healAmount.value = 0;
      }
      // Prevent healing to full if specified (in case of healing tokens so Sturdy doesn't cause a softlock)
      if (this.preventFullHeal && pokemon.hp + healAmount.value >= pokemon.getMaxHp()) {
        healAmount.value = (pokemon.getMaxHp() - pokemon.hp) - 1;
      }
      healAmount.value = pokemon.heal(healAmount.value);
      if (healAmount.value) {
        this.scene.damageNumberHandler.add(pokemon, healAmount.value, HitResult.HEAL);
      }
      if (pokemon.isPlayer()) {
        this.scene.validateAchvs(HealAchv, healAmount);
        if (healAmount.value > this.scene.gameData.gameStats.highestHeal) {
          this.scene.gameData.gameStats.highestHeal = healAmount.value;
        }
      }
      if (this.healStatus && !this.revive && pokemon.status) {
        lastStatusEffect = pokemon.status.effect;
        pokemon.resetStatus();
      }
      pokemon.updateInfo().then(() => super.end());
    } else if (this.healStatus && !this.revive && pokemon.status) {
      lastStatusEffect = pokemon.status.effect;
      pokemon.resetStatus();
      pokemon.updateInfo().then(() => super.end());
    } else if (this.showFullHpMessage) {
      this.message = i18next.t("battle:hpIsFull", { pokemonName: getPokemonNameWithAffix(pokemon) });
    }

    if (this.message) {
      this.scene.queueMessage(this.message);
    }

    if (this.healStatus && lastStatusEffect && !hasMessage) {
      this.scene.queueMessage(getStatusEffectHealText(lastStatusEffect, getPokemonNameWithAffix(pokemon)));
    }

    if (!healOrDamage && !lastStatusEffect) {
      super.end();
    }
  }
}
//#endregion





//#region 69 AttemptCapturePhase
export class AttemptCapturePhase extends PokemonPhase {
  /** The Pokeball being used. */
  private pokeballType: PokeballType;
  /** The Pokeball sprite. */
  private pokeball: Phaser.GameObjects.Sprite;
  /** The sprite's original Y position. */
  private originalY: number;

  constructor(scene: BattleScene, targetIndex: integer, pokeballType: PokeballType) {
    super(scene, BattlerIndex.ENEMY + targetIndex);

    this.pokeballType = pokeballType;
  }

  roll(y?: integer) {
    var roll = (this.getPokemon() as EnemyPokemon).randSeedInt(65536, undefined, "Capture roll")
    if (y != undefined) {
      console.log(roll, y, roll < y)
    } else {
      console.log(roll)
    }
    return roll;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon() as EnemyPokemon;

    if (!pokemon?.hp) {
      return this.end();
    }

    this.scene.pokeballCounts[this.pokeballType]--;

    this.originalY = pokemon.y;

    const _3m = 3 * pokemon.getMaxHp();
    const _2h = 2 * pokemon.hp;
    const catchRate = pokemon.species.catchRate;
    const pokeballMultiplier = getPokeballCatchMultiplier(this.pokeballType);
    const statusMultiplier = pokemon.status ? getStatusEffectCatchRateMultiplier(pokemon.status.effect) : 1;
    const x = Math.round((((_3m - _2h) * catchRate * pokeballMultiplier) / _3m) * statusMultiplier);
    const y = Math.round(65536 / Math.sqrt(Math.sqrt(255 / x)));
    const fpOffset = pokemon.getFieldPositionOffset();

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball = this.scene.addFieldSprite(16, 80, "pb", pokeballAtlasKey);
    this.pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(this.pokeball);

    this.scene.playSound("pb_throw");
    this.scene.time.delayedCall(300, () => {
      this.scene.field.moveBelow(this.pokeball as Phaser.GameObjects.GameObject, pokemon);
    });

    this.scene.tweens.add({
      targets: this.pokeball,
      x: { value: 236 + fpOffset[0], ease: "Linear" },
      y: { value: 16 + fpOffset[1], ease: "Cubic.easeOut" },
      duration: 500,
      onComplete: () => {
        this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
        this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));
        this.scene.playSound("pb_rel");
        pokemon.tint(getPokeballTintColor(this.pokeballType));

        addPokeballOpenParticles(this.scene, this.pokeball.x, this.pokeball.y, this.pokeballType);

        this.scene.tweens.add({
          targets: pokemon,
          duration: 500,
          ease: "Sine.easeIn",
          scale: 0.25,
          y: 20,
          onComplete: () => {
            this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
            pokemon.setVisible(false);
            this.scene.playSound("pb_catch");
            this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}`));

            const doShake = () => {
              let shakeCount = 0;
              const pbX = this.pokeball.x;
              const shakeCounter = this.scene.tweens.addCounter({
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
                    this.pokeball.setX(pbX + value * 4 * directionMultiplier);
                    this.pokeball.setAngle(value * 27.5 * directionMultiplier);
                  }
                },
                onRepeat: () => {
                  if (!pokemon.species.isObtainable()) {
                    shakeCounter.stop();
                    this.failCatch(shakeCount);
                  } else if (shakeCount++ < 3) {
                    if (pokeballMultiplier === -1 || this.roll(y) < y) {
                      this.scene.playSound("pb_move");
                    } else {
                      shakeCounter.stop();
                      this.failCatch(shakeCount);
                    }
                  } else {
                    this.scene.playSound("pb_lock");
                    addPokeballCaptureStars(this.scene, this.pokeball);

                    const pbTint = this.scene.add.sprite(this.pokeball.x, this.pokeball.y, "pb", "pb");
                    pbTint.setOrigin(this.pokeball.originX, this.pokeball.originY);
                    pbTint.setTintFill(0);
                    pbTint.setAlpha(0);
                    this.scene.field.add(pbTint);
                    this.scene.tweens.add({
                      targets: pbTint,
                      alpha: 0.375,
                      duration: 200,
                      easing: "Sine.easeOut",
                      onComplete: () => {
                        this.scene.tweens.add({
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
                  this.catch();
                }
              });
            };

            this.scene.time.delayedCall(250, () => doPokeballBounceAnim(this.scene, this.pokeball, 16, 72, 350, doShake));
          }
        });
      }
    });
  }

  failCatch(shakeCount: integer) {
    const pokemon = this.getPokemon();

    this.scene.playSound("pb_rel");
    pokemon.setY(this.originalY);
    if (pokemon.status?.effect !== StatusEffect.SLEEP) {
      pokemon.cry(pokemon.getHpRatio() > 0.25 ? undefined : { rate: 0.85 });
    }
    pokemon.tint(getPokeballTintColor(this.pokeballType));
    pokemon.setVisible(true);
    pokemon.untint(250, "Sine.easeOut");

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball.setTexture("pb", `${pokeballAtlasKey}_opening`);
    this.scene.time.delayedCall(17, () => this.pokeball.setTexture("pb", `${pokeballAtlasKey}_open`));

    this.scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: "Sine.easeOut",
      scale: 1
    });

    this.scene.currentBattle.lastUsedPokeball = this.pokeballType;
    this.removePb();
    this.end();
  }

  catch() {
    /** The Pokemon being caught. */
    const pokemon = this.getPokemon() as EnemyPokemon;

    /** Used for achievements. */
    const speciesForm = !pokemon.fusionSpecies ? pokemon.getSpeciesForm() : pokemon.getFusionSpeciesForm();

    // Achievements
    if (speciesForm.abilityHidden && (pokemon.fusionSpecies ? pokemon.fusionAbilityIndex : pokemon.abilityIndex) === speciesForm.getAbilityCount() - 1)
      this.scene.validateAchv(achvs.HIDDEN_ABILITY);
    if (pokemon.species.subLegendary)
      this.scene.validateAchv(achvs.CATCH_SUB_LEGENDARY);
    if (pokemon.species.legendary)
      this.scene.validateAchv(achvs.CATCH_LEGENDARY);
    if (pokemon.species.mythical)
      this.scene.validateAchv(achvs.CATCH_MYTHICAL);

    // Show its info
    this.scene.pokemonInfoContainer.show(pokemon, true);
    // Update new IVs
    this.scene.gameData.updateSpeciesDexIvs(pokemon.species.getRootSpeciesId(true), pokemon.ivs);

    this.scene.ui.showText(i18next.t("battle:pokemonCaught", { pokemonName: getPokemonNameWithAffix(pokemon) }), null, () => {
      const end = () => {
        this.scene.unshiftPhase(new VictoryPhase(this.scene, this.battlerIndex));
        this.scene.pokemonInfoContainer.hide();
        this.removePb();
        this.end();
      };
      LoggerTools.logCapture(this.scene, this.scene.currentBattle.waveIndex, pokemon)
      const removePokemon = () => {
        this.scene.addFaintedEnemyScore(pokemon);
        this.scene.getPlayerField().filter(p => p.isActive(true)).forEach(playerPokemon => playerPokemon.removeTagsBySourceId(pokemon.id));
        pokemon.hp = 0;
        pokemon.trySetStatus(StatusEffect.FAINT);
        this.scene.clearEnemyHeldItemModifiers();
        this.scene.field.remove(pokemon, true);
      };
      const addToParty = () => {
        const newPokemon = pokemon.addToParty(this.pokeballType);
        const modifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        if (this.scene.getParty().filter(p => p.isShiny()).length === 6) {
          this.scene.validateAchv(achvs.SHINY_PARTY);
        }
        Promise.all(modifiers.map(m => this.scene.addModifier(m, true))).then(() => {
          this.scene.updateModifiers(true);
          removePokemon();
          if (newPokemon) {
            newPokemon.loadAssets().then(end);
          } else {
            end();
          }
        });
      };
      Promise.all([pokemon.hideInfo(), this.scene.gameData.setPokemonCaught(pokemon)]).then(() => {
        if (this.scene.getParty().length === 6) {
          const promptRelease = () => {
            // Say that your party is full
            this.scene.ui.showText(i18next.t("battle:partyFull", { pokemonName: pokemon.getNameToRender() }), null, () => {
              // Ask if you want to make room
              this.scene.pokemonInfoContainer.makeRoomForConfirmUi(1, true);
              this.scene.ui.setMode(Mode.CONFIRM, () => {
                // YES
                // Open up the party menu on the RELEASE setting
                const newPokemon = this.scene.addPlayerPokemon(pokemon.species, pokemon.level, pokemon.abilityIndex, pokemon.formIndex, pokemon.gender, pokemon.shiny, pokemon.variant, pokemon.ivs, pokemon.nature, pokemon);
                this.scene.ui.setMode(Mode.SUMMARY, newPokemon, 0, SummaryUiMode.DEFAULT, () => {
                  this.scene.ui.setMode(Mode.MESSAGE).then(() => {
                    promptRelease();
                  });
                }, false);
              }, () => {
                this.scene.ui.setMode(Mode.PARTY, PartyUiMode.RELEASE, this.fieldIndex, (slotIndex: integer, _option: PartyOption) => {
                  this.scene.ui.setMode(Mode.MESSAGE).then(() => {
                    if (slotIndex < 6) {
                      addToParty();
                    } else {
                      promptRelease();
                    }
                  });
                }, undefined, undefined, undefined, undefined, pokemon.name);
              }, () => {
                // NO
                LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "Don't keep " + pokemon.name)
                this.scene.ui.setMode(Mode.MESSAGE).then(() => {
                  removePokemon();
                  end();
                });
              }, "fullParty");
            });
          };
          promptRelease();
        } else {
          //LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, `${pokemon.name} added to party`)
          addToParty();
        }
      });
    }, 0, true);
  }

  /** Remove the Poke Ball from the scene. */
  removePb() {
    this.scene.tweens.add({
      targets: this.pokeball,
      duration: 250,
      delay: 250,
      ease: "Sine.easeIn",
      alpha: 0,
      onComplete: () => this.pokeball.destroy()
    });
  }
}
//#endregion





//#region 70 AttemptRunPhase`
export class AttemptRunPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  start() {
    super.start();

    const playerPokemon = this.getPokemon();
    const enemyField = this.scene.getEnemyField();

    const enemySpeed = enemyField.reduce((total: integer, enemyPokemon: Pokemon) => total + enemyPokemon.getStat(Stat.SPD), 0) / enemyField.length;

    const escapeChance = new Utils.IntegerHolder((((playerPokemon.getStat(Stat.SPD) * 128) / enemySpeed) + (30 * this.scene.currentBattle.escapeAttempts++)) % 256);
    applyAbAttrs(RunSuccessAbAttr, playerPokemon, null, true, escapeChance);

    if (playerPokemon.randSeedInt(256, undefined, "Run attempt") < escapeChance.value) {
      this.scene.playSound("flee");
      LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, "Fled")
      this.scene.queueMessage(i18next.t("battle:runAwaySuccess"), null, true, 500);

      this.scene.tweens.add({
        targets: [this.scene.arenaEnemy, enemyField].flat(),
        alpha: 0,
        duration: 250,
        ease: "Sine.easeIn",
        onComplete: () => enemyField.forEach(enemyPokemon => enemyPokemon.destroy())
      });

      this.scene.clearEnemyHeldItemModifiers();

      enemyField.forEach(enemyPokemon => {
        enemyPokemon.hideInfo().then(() => enemyPokemon.destroy());
        enemyPokemon.hp = 0;
        enemyPokemon.trySetStatus(StatusEffect.FAINT);
      });

      this.scene.pushPhase(new BattleEndPhase(this.scene));
      this.scene.pushPhase(new NewBattlePhase(this.scene));
    } else {
      this.scene.queueMessage(i18next.t("battle:runAwayCannotEscape"), null, true, 500);
    }

    this.end();
  }
}
//#endregion





//#region 71 SelectModifierPhase
const tierNames = [
  "Poké",
  "Great",
  "Ultra",
  "Rogue",
  "Master"
]
/**
 * This function rolls for modifiers with a certain luck value, checking to see if shiny luck would affect your results.
 * @param scene 
 * @param predictionCost 
 * @param rerollOverride 
 * @param modifierOverride 
 * @returns 
 */
export function shinyCheckStep(scene: BattleScene, predictionCost: Utils.IntegerHolder, rerollOverride: integer, modifierOverride?: integer) {
  var minLuck = -1
  var modifierPredictions: ModifierTypeOption[][] = []
  const party = scene.getParty();
  regenerateModifierPoolThresholds(party, ModifierPoolType.PLAYER, rerollOverride);
  const modifierCount = new Utils.IntegerHolder(3);
  scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
  if (modifierOverride) {
    //modifierCount.value = modifierOverride
  }
  var isOk = true;
  const typeOptions: ModifierTypeOption[] = getPlayerModifierTypeOptions(modifierCount.value, scene.getParty(), undefined, scene, true, true);
  typeOptions.forEach((option, idx) => {
    let lastTier = option.type!.tier
    if (option.alternates && option.alternates.length > 0) {
      for (var i = 0; i < option.alternates.length; i++) {
        if (option.alternates[i] > lastTier) {
          //lastTier = option.alternates[i]
          //console.log("Conflict found! (" + i + " luck, " + rerollOverride + " rolls, item " + (idx + 1) + ")")
          isOk = false // Shiny Luck affects this wave in some way
          if (minLuck == -1 && i != 0)
            minLuck = i
        }
      }
    }
  })
  modifierPredictions.push(typeOptions)
  predictionCost.value += (Math.min(Math.ceil(scene.currentBattle.waveIndex / 10) * 250 * Math.pow(2, rerollOverride), Number.MAX_SAFE_INTEGER))
  return [isOk, minLuck];
}
/**
 * Simulates modifier rolls for as many rerolls as you can afford, checking to see if shiny luck will alter your results.
 * @param scene The current `BattleScene`.
 * @returns `true` if no changes were detected, `false` otherwise
 */
export function runShinyCheck(scene: BattleScene, mode: integer, wv?: integer) {
  var minLuck: integer = -1
  if (mode == 1) {
    scene.emulateReset(wv)
  } else {
    scene.resetSeed(wv);
  }
  const predictionCost = new Utils.IntegerHolder(0)
  var isOk = true;
  for (var i = 0; predictionCost.value < scene.money && i < 8; i++) {
    var r = shinyCheckStep(scene, predictionCost, i)
    isOk = isOk && (r[0] as boolean)
    if (isOk || (r[1] as integer) === -1) {
      // Do nothing
    } else if (minLuck == -1) {
      minLuck = (r[1] as integer)
      console.log("Luck " + r[1] + " breaks")
    } else {
      console.log("Updated from " + minLuck + " to " + Math.min(minLuck, (r[1] as integer)))
      minLuck = Math.min(minLuck, (r[1] as integer))
    }
  }
  if (mode == 1) {
    scene.restoreSeed(wv)
  } else {
    scene.resetSeed(wv);
  }
  if (!isOk) {
    console.log("Conflict found!")
  }
  if (minLuck == 15) {
    //minLuck = 0
  }
  return [isOk, minLuck]
}
export class SelectModifierPhase extends BattlePhase {
  private rerollCount: integer;
  private modifierTiers: ModifierTier[] = [];
  private modifierPredictions: ModifierTypeOption[][] = []
  private predictionCost: integer = 0;
  private costTiers: integer[] = [];

  constructor(scene: BattleScene, rerollCount: integer = 0, modifierTiers?: ModifierTier[], predictionCost?: integer, modifierPredictions?: ModifierTypeOption[][]) {
    super(scene);

    this.rerollCount = rerollCount;
    this.modifierTiers = modifierTiers!; // TODO: is this bang correct?
    this.modifierPredictions = []
    if (modifierPredictions != undefined) {
      this.modifierPredictions = modifierPredictions;
    }
    this.predictionCost = 0
    this.costTiers = []
  }

  generateSelection(rerollOverride: integer, modifierOverride?: integer, eviolite?: boolean) {
    //const STATE = Phaser.Math.RND.state() // Store RNG state
    //console.log("====================")
    //console.log("  Reroll Prediction: " + rerollOverride)
    const party = this.scene.getParty();
    if (eviolite) {
      setEvioliteOverride("on")
    } else {
      setEvioliteOverride("off")
    }
    regenerateModifierPoolThresholds(party, this.getPoolType(), rerollOverride);
    const modifierCount = new Utils.IntegerHolder(3);
    if (this.isPlayer()) {
      this.scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
    }
    if (modifierOverride) {
      //modifierCount.value = modifierOverride
    }
    const typeOptions: ModifierTypeOption[] = this.getModifierTypeOptions(modifierCount.value, true, true);
    setEvioliteOverride("")
    typeOptions.forEach((option, idx) => {
      option.netprice = this.predictionCost
      if (option.type.name == "Nugget") {
        option.netprice -= this.scene.getWaveMoneyAmount(1)
      }
      if (option.type.name == "Big Nugget") {
        option.netprice -= this.scene.getWaveMoneyAmount(2.5)
      }
      if (option.type.name == "Relic Gold") {
        option.netprice -= this.scene.getWaveMoneyAmount(10)
      }
      //console.log(option.type.name)
    })
    //console.log("====================")
    if (eviolite) {
      this.modifierPredictions[rerollOverride].forEach((m, i) => {
        if (m.type.name != typeOptions[i].type.name) {
          m.eviolite = typeOptions[i].type
        }
      })
    } else {
      this.modifierPredictions[rerollOverride] = typeOptions
    }
    this.costTiers.push(this.predictionCost)
    this.predictionCost += this.getRerollCost(typeOptions, false, rerollOverride)
    //Phaser.Math.RND.state(STATE) // Restore RNG state like nothing happened
  }

  start() {
    super.start();

    if (!this.rerollCount) {
      this.updateSeed();
      console.log(calculateItemConditions(this.scene.getParty(), false, true))
      console.log("\n\nPerforming reroll prediction (Eviolite OFF)\n\n\n")
      this.predictionCost = 0
      this.costTiers = []
      for (var idx = 0; idx < 10 && this.predictionCost < this.scene.money; idx++) {
        this.generateSelection(idx, undefined, false)
      }
      this.updateSeed();
      console.log("\n\nPerforming reroll prediction (Eviolite ON)\n\n\n")
      this.predictionCost = 0
      this.costTiers = []
      for (var idx = 0; idx < 10 && this.predictionCost < this.scene.money; idx++) {
        this.generateSelection(idx, undefined, true)
      }
      this.updateSeed();
    } else {
      this.scene.reroll = false;
    }

    const party = this.scene.getParty();
    regenerateModifierPoolThresholds(party, this.getPoolType(), this.rerollCount);
    const modifierCount = new Utils.IntegerHolder(3);
    if (this.isPlayer()) {
      this.scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
    }
    const typeOptions: ModifierTypeOption[] = this.getModifierTypeOptions(modifierCount.value);

    const modifierSelectCallback = (rowCursor: integer, cursor: integer) => {
      if (rowCursor < 0 || cursor < 0) {
        this.scene.ui.showText(i18next.t("battle:skipItemQuestion"), null, () => {
          this.scene.ui.setOverlayMode(Mode.CONFIRM, () => {
            LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, "Skip taking items")
            this.scene.ui.revertMode();
            this.scene.ui.setMode(Mode.MESSAGE);
            super.end();
          }, () => this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers), this.modifierPredictions));
        });
        return false;
      }
      let modifierType: ModifierType;
      let cost: integer;
      switch (rowCursor) {
      case 0:
        switch (cursor) {
          case 0:
            const rerollCost1 = this.getRerollCost(typeOptions, this.scene.lockModifierTiers);
            if (this.scene.money < rerollCost1) {
              this.scene.ui.playError();
              return false;
            } else {
              this.scene.reroll = true;
              LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "Reroll" + (this.scene.lockModifierTiers ? " (Locked)" : ""))
              this.scene.unshiftPhase(new SelectModifierPhase(this.scene, this.rerollCount + 1, typeOptions.map(o => o.type?.tier).filter(t => t !== undefined) as ModifierTier[], this.predictionCost, this.modifierPredictions));
              this.scene.ui.clearText();
              this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
              if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                this.scene.money -= rerollCost1;
                this.scene.updateMoneyText();
                this.scene.animateMoneyChanged(false);
                this.scene.playSound("buy");
              }
            }
            break;
          case 0.1:
            const rerollCost2 = this.getRerollCost(this.modifierPredictions[this.rerollCount], false);
            if (this.scene.money < rerollCost2) {
              this.scene.ui.playError();
              return false;
            } else {
              this.scene.reroll = true;
              LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "+1 Reroll")
              this.scene.unshiftPhase(new SelectModifierPhase(this.scene, this.rerollCount + 1, typeOptions.map(o => o.type!.tier), this.predictionCost, this.modifierPredictions));
              this.scene.ui.clearText();
              this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
              if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                this.scene.money -= rerollCost2;
                this.scene.updateMoneyText();
                this.scene.animateMoneyChanged(false);
                this.scene.playSound("buy");
              }
            }
            break;
          case 0.2:
            const rerollCost3 = this.getRerollCost(this.modifierPredictions[this.rerollCount + 1], false);
            {
              this.scene.reroll = true;
              LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "-1 Reroll")
              this.scene.unshiftPhase(new SelectModifierPhase(this.scene, this.rerollCount - 1, typeOptions.map(o => o.type!.tier), this.predictionCost, this.modifierPredictions));
              this.scene.ui.clearText();
              this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
              if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                this.scene.money -= rerollCost3;
                this.scene.updateMoneyText();
                this.scene.animateMoneyChanged(false);
                this.scene.playSound("buy");
              }
            }
            break;
        case 1:
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.MODIFIER_TRANSFER, -1, (fromSlotIndex: integer, itemIndex: integer, itemQuantity: integer, toSlotIndex: integer, isAll: boolean, isFirst: boolean) => {
            if (toSlotIndex !== undefined && fromSlotIndex < 6 && toSlotIndex < 6 && fromSlotIndex !== toSlotIndex && itemIndex > -1) {
              const itemModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
                    && m.isTransferrable && m.pokemonId === party[fromSlotIndex].id) as PokemonHeldItemModifier[];
              const itemModifier = itemModifiers[itemIndex];
              if (isAll) {
                if (isFirst)
                  LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, `Transfer ALL | ${LoggerTools.playerPokeName(this.scene, fromSlotIndex)} → ${LoggerTools.playerPokeName(this.scene, toSlotIndex)}`)
              } else {
                LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, `Transfer ${itemModifier.type.name + (itemQuantity == itemModifier.getStackCount() ? "" : " x" + itemQuantity)} | ${LoggerTools.playerPokeName(this.scene, fromSlotIndex)} → ${LoggerTools.playerPokeName(this.scene, toSlotIndex)}`)
              }
              this.scene.tryTransferHeldItemModifier(itemModifier, party[toSlotIndex], true, itemQuantity);
            } else {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
            }
          }, PartyUiHandler.FilterItemMaxStacks);
          break;
        case 2:
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.CHECK, -1, () => {
            this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
          });
          break;
        case 3:
          this.scene.lockModifierTiers = !this.scene.lockModifierTiers;
          const uiHandler = this.scene.ui.getHandler() as ModifierSelectUiHandler;
          uiHandler.setRerollCost(this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
          uiHandler.updateLockRaritiesText();
          uiHandler.updateRerollCostText();
          return false;
        }
        return true;
      case 1:
        if (typeOptions[cursor].type) {
          modifierType = typeOptions[cursor].type;
        }
        break;
      default:
        const shopOptions = getPlayerShopModifierTypeOptionsForWave(this.scene.currentBattle.waveIndex, this.scene.getWaveMoneyAmount(1));
        const shopOption = shopOptions[rowCursor > 2 || shopOptions.length <= SHOP_OPTIONS_ROW_LIMIT ? cursor : cursor + SHOP_OPTIONS_ROW_LIMIT];
        if (shopOption.type) {
          modifierType = shopOption.type;
        }
        cost = shopOption.cost;
        break;
      }

      if (cost! && (this.scene.money < cost) && !Overrides.WAIVE_ROLL_FEE_OVERRIDE) { // TODO: is the bang on cost correct?
        this.scene.ui.playError();
        return false;
      }

      const applyModifier = (modifier: Modifier, playSound: boolean = false) => {
        const result = this.scene.addModifier(modifier, false, playSound);
        if (cost) {
          result.then(success => {
            if (success) {
              if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
                this.scene.money -= cost;
                this.scene.updateMoneyText();
                this.scene.animateMoneyChanged(false);
              }
              this.scene.playSound("buy");
              (this.scene.ui.getHandler() as ModifierSelectUiHandler).updateCostText();
            } else {
              this.scene.ui.playError();
            }
          });
        } else {
          const doEnd = () => {
            this.scene.ui.clearText();
            this.scene.ui.setMode(Mode.MESSAGE);
            super.end();
          };
          if (result instanceof Promise) {
            result.then(() => doEnd());
          } else {
            doEnd();
          }
        }
      };

      if (modifierType! instanceof PokemonModifierType) { //TODO: is the bang correct?
        if (modifierType instanceof FusePokemonModifierType) {
          this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.SPLICE, -1, (fromSlotIndex: integer, spliceSlotIndex: integer) => {
            if (spliceSlotIndex !== undefined && fromSlotIndex < 6 && spliceSlotIndex < 6 && fromSlotIndex !== spliceSlotIndex) {
              LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType.name + " → " + this.scene.getParty()[fromSlotIndex].name + " + " + this.scene.getParty()[spliceSlotIndex].name)
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer()).then(() => {
                const modifier = modifierType.newModifier(party[fromSlotIndex], party[spliceSlotIndex])!; //TODO: is the bang correct?
                applyModifier(modifier, true);
              });
            } else {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
            }
          }, modifierType.selectFilter);
        } else {
          const pokemonModifierType = modifierType as PokemonModifierType;
          const isMoveModifier = modifierType instanceof PokemonMoveModifierType;
          const isTmModifier = modifierType instanceof TmModifierType;
          const isRememberMoveModifier = modifierType instanceof RememberMoveModifierType;
          const isPpRestoreModifier = (modifierType instanceof PokemonPpRestoreModifierType || modifierType instanceof PokemonPpUpModifierType);
          const partyUiMode = isMoveModifier ? PartyUiMode.MOVE_MODIFIER
            : isTmModifier ? PartyUiMode.TM_MODIFIER
              : isRememberMoveModifier ? PartyUiMode.REMEMBER_MOVE_MODIFIER
                : PartyUiMode.MODIFIER;
          const tmMoveId = isTmModifier
            ? (modifierType as TmModifierType).moveId
            : undefined;
          this.scene.ui.setModeWithoutClear(Mode.PARTY, partyUiMode, -1, (slotIndex: integer, option: PartyOption) => {
            if (slotIndex < 6) {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer()).then(() => {
                const modifier = !isMoveModifier
                  ? !isRememberMoveModifier
                    ? modifierType.newModifier(party[slotIndex])
                    : modifierType.newModifier(party[slotIndex], option as integer)
                  : modifierType.newModifier(party[slotIndex], option - PartyOption.MOVE_1);
                if (isPpRestoreModifier) {
                  LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType.name + " → " + this.scene.getParty()[slotIndex].name + " → " + this.scene.getParty()[slotIndex].moveset[option - PartyOption.MOVE_1]!.getName())
                } else if (isRememberMoveModifier) {
                  LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType.name + " → " + this.scene.getParty()[slotIndex].name)
                } else if (isTmModifier) {
                  LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType.name + " → " + this.scene.getParty()[slotIndex].name)
                } else {
                  LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType.name + " → " + this.scene.getParty()[slotIndex].name)
                }
                applyModifier(modifier!, true); // TODO: is the bang correct?
              });
            } else {
              this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
            }
          }, pokemonModifierType.selectFilter, modifierType instanceof PokemonMoveModifierType ? (modifierType as PokemonMoveModifierType).moveSelectFilter : undefined, tmMoveId, isPpRestoreModifier);
        }
      } else {
        LoggerTools.logShop(this.scene, this.scene.currentBattle.waveIndex, modifierType!.name)
        applyModifier(modifierType!.newModifier()!); // TODO: is the bang correct?
      }

      return !cost!;// TODO: is the bang correct?
    };
    if (this.rerollCount == 0) {
      if (true) {
        this.modifierPredictions.forEach((mp, r) => {
          // costTiers
          console.log("Rerolls: " + r + (this.costTiers[r] != 0 ? " - ₽" + this.costTiers[r] : ""))
          mp.forEach((m, i) => {
            console.log("  " + m.type!.name + (m.netprice != this.costTiers[r] ? " - ₽" + m.netprice : ""))
            if (m.eviolite) {
              console.log("    With Eviolite unlocked: " + m.eviolite.name)
            }
            if (m.alternates) {
              //console.log(m.alternates)
              let showedLuckFlag = false
              for (var j = 0, currentTier = m.type!.tier; j < m.alternates.length; j++) {
                if (m.alternates[j] > currentTier) {
                  currentTier = m.alternates[j]
                  if (m.advancedAlternates) {
                    if (!showedLuckFlag) {
                      showedLuckFlag = true
                      console.log("    Your luck: " + getPartyLuckValue(party) + " (" + getLuckString(getPartyLuckValue(party)) + ")")
                    }
                    console.log("    At " + j + " luck (" + getLuckString(j) + "): " + m.advancedAlternates[j])
                  } else {
                    if (!showedLuckFlag) {
                      showedLuckFlag = true
                      console.log("    Your luck: " + getPartyLuckValue(party) + " (" + getLuckString(getPartyLuckValue(party)) + ")")
                    }
                    console.log("    At " + j + " luck (" + getLuckString(j) + "): " + tierNames[currentTier] + "-tier item (failed to generate item)")
                  }
                }
              }
            } else {
              //console.log("    No alt-luck data")
            }
          })
        })
      } else {
        let modifierList: string[] = []
        this.modifierPredictions.forEach((mp, r) => {
          //console.log("Rerolls: " + r)
          mp.forEach((m, i) => {
            modifierList.push(m.type!.name + (r > 0 ? " (x" + r + ")" : ""))
            //console.log("  " + m.type!.name)
            if (m.eviolite) {
              modifierList.push(m.type!.name + (r > 0 ? " (x" + r + " with eviolite unlocked)" : " (With eviolite unlocked)"))
              //console.log("    With Eviolite unlocked: " + m.eviolite.name)
            }
            if (m.alternates) {
              //console.log(m.alternates)
              let showedLuckFlag = false
              for (var j = 0, currentTier = m.type!.tier; j < m.alternates.length; j++) {
                if (m.alternates[j] > currentTier) {
                  currentTier = m.alternates[j]
                  if (m.advancedAlternates) {
                    if (!showedLuckFlag) {
                      showedLuckFlag = true
                      console.log("    Your luck: " + getPartyLuckValue(party) + " (" + getLuckString(getPartyLuckValue(party)) + ")")
                    }
                    console.log("    At " + j + " luck (" + getLuckString(j) + "): " + m.advancedAlternates[j])
                  } else {
                    if (!showedLuckFlag) {
                      showedLuckFlag = true
                      console.log("    Your luck: " + getPartyLuckValue(party) + " (" + getLuckString(getPartyLuckValue(party)) + ")")
                    }
                    console.log("    At " + j + " luck (" + getLuckString(j) + "): " + tierNames[currentTier] + "-tier item (failed to generate item)")
                  }
                }
              }
            } else {
              //console.log("    No alt-luck data")
            }
          })
        })
        modifierList.sort()
        modifierList.forEach(v => {
          console.log(v)
        })
      }
    }
    this.scene.ui.setMode(Mode.MODIFIER_SELECT, this.isPlayer(), typeOptions, modifierSelectCallback, this.getRerollCost(typeOptions, this.scene.lockModifierTiers));
  }

  updateSeed(): void {
    this.scene.resetSeed();
  }

  isPlayer(): boolean {
    return true;
  }

  getRerollCost(typeOptions: ModifierTypeOption[], lockRarities: boolean, rerollOverride?: integer): integer {
    let baseValue = 0;
    if (Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
      return baseValue;
    } else if (lockRarities) {
      const tierValues = [50, 125, 300, 750, 2000];
      for (const opt of typeOptions) {
        baseValue += tierValues[opt.type.tier ?? 0];
      }
    } else {
      baseValue = 250;
    }
    return Math.min(Math.ceil(this.scene.currentBattle.waveIndex / 10) * baseValue * Math.pow(2, (rerollOverride != undefined ? rerollOverride : this.rerollCount)), Number.MAX_SAFE_INTEGER);
  }

  getPoolType(): ModifierPoolType {
    return ModifierPoolType.PLAYER;
  }

  getModifierTypeOptions(modifierCount: integer, shutUpBro?: boolean, calcAllLuck?: boolean, advanced?: boolean): ModifierTypeOption[] {
    return getPlayerModifierTypeOptions(modifierCount, this.scene.getParty(), this.scene.lockModifierTiers ? this.modifierTiers : undefined, this.scene, shutUpBro, calcAllLuck, advanced);
  }

  addModifier(modifier: Modifier): Promise<boolean> {
    return this.scene.addModifier(modifier, false, true);
  }
}
//#endregion





//#region 72 EggLapsePhase
export class EggLapsePhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const eggsToHatch: Egg[] = this.scene.gameData.eggs.filter((egg: Egg) => {
      return Overrides.EGG_IMMEDIATE_HATCH_OVERRIDE ? true : --egg.hatchWaves < 1;
    });

    let eggCount: integer = eggsToHatch.length;

    if (eggCount) {
      this.scene.queueMessage(i18next.t("battle:eggHatching"));

      for (const egg of eggsToHatch) {
        this.scene.unshiftPhase(new EggHatchPhase(this.scene, egg, eggCount));
        if (eggCount > 0) {
          eggCount--;
        }
      }

    }
    this.end();
  }
}
//#endregion





//#region 73 AddEnemyBuffModifierPhase
export class AddEnemyBuffModifierPhase extends Phase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const waveIndex = this.scene.currentBattle.waveIndex;
    const tier = !(waveIndex % 1000) ? ModifierTier.ULTRA : !(waveIndex % 250) ? ModifierTier.GREAT : ModifierTier.COMMON;

    regenerateModifierPoolThresholds(this.scene.getEnemyParty(), ModifierPoolType.ENEMY_BUFF);

    const count = Math.ceil(waveIndex / 250);
    for (let i = 0; i < count; i++) {
      this.scene.addEnemyModifier(getEnemyBuffModifierForWave(tier, this.scene.findModifiers(m => m instanceof EnemyPersistentModifier, false), this.scene), true, true);
    }
    this.scene.updateModifiers(false, true).then(() => this.end());
  }
}
//#endregion





//#region 74 PartyStatusCurePhase
/**
 * Cures the party of all non-volatile status conditions, shows a message
 * @param {BattleScene} scene The current scene
 * @param {Pokemon} user The user of the move that cures the party
 * @param {string} message The message that should be displayed
 * @param {Abilities} abilityCondition Pokemon with this ability will not be affected ie. Soundproof
 */
export class PartyStatusCurePhase extends BattlePhase {
  private user: Pokemon;
  private message: string;
  private abilityCondition: Abilities;

  constructor(scene: BattleScene, user: Pokemon, message: string, abilityCondition: Abilities) {
    super(scene);

    this.user = user;
    this.message = message;
    this.abilityCondition = abilityCondition;
  }

  start() {
    super.start();
    for (const pokemon of this.scene.getParty()) {
      if (!pokemon.isOnField() || pokemon === this.user) {
        pokemon.resetStatus(false);
        pokemon.updateInfo(true);
      } else {
        if (!pokemon.hasAbility(this.abilityCondition)) {
          pokemon.resetStatus();
          pokemon.updateInfo(true);
        } else {
          // Manually show ability bar, since we're not hooked into the targeting system
          pokemon.scene.unshiftPhase(new ShowAbilityPhase(pokemon.scene, pokemon.id, pokemon.getPassiveAbility()?.id === this.abilityCondition));
        }
      }
    }
    if (this.message) {
      this.scene.queueMessage(this.message);
    }
    this.end();
  }
}
//#endregion





//#region 75 PartyHealPhase
export class PartyHealPhase extends BattlePhase {
  private resumeBgm: boolean;

  constructor(scene: BattleScene, resumeBgm: boolean) {
    super(scene);

    this.resumeBgm = resumeBgm;
  }

  start() {
    super.start();

    const bgmPlaying = this.scene.isBgmPlaying();
    if (bgmPlaying) {
      this.scene.fadeOutBgm(1000, false);
    }
    this.scene.ui.fadeOut(1000).then(() => {
      for (const pokemon of this.scene.getParty()) {
        pokemon.hp = pokemon.getMaxHp();
        pokemon.resetStatus();
        for (const move of pokemon.moveset) {
          move!.ppUsed = 0; // TODO: is this bang correct?
        }
        pokemon.updateInfo(true);
      }
      const healSong = this.scene.playSoundWithoutBgm("heal");
      this.scene.time.delayedCall(Utils.fixedInt(healSong.totalDuration * 1000), () => {
        healSong.destroy();
        if (this.resumeBgm && bgmPlaying) {
          this.scene.playBgm();
        }
        this.scene.ui.fadeIn(500).then(() => this.end());
      });
    });
  }
}
//#endregion





//#region 76 ShinySparklePhase
export class ShinySparklePhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    this.getPokemon().sparkle();
    this.scene.time.delayedCall(1000, () => this.end());
  }
}
//#endregion





//#region 77 ScanIvsPhase
export class ScanIvsPhase extends PokemonPhase {
  private shownIvs: integer;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, shownIvs: integer) {
    super(scene, battlerIndex);

    this.shownIvs = shownIvs;
  }

  start() {
    super.start();

    if (!this.shownIvs) {
      return this.end();
    }

    const pokemon = this.getPokemon();

    let enemyIvs: number[] = [];
    let statsContainer: Phaser.GameObjects.Sprite[] = [];
    let statsContainerLabels: Phaser.GameObjects.Sprite[] = [];
    const enemyField = this.scene.getEnemyField();
    const uiTheme = (this.scene as BattleScene).uiTheme; // Assuming uiTheme is accessible
    for (let e = 0; e < enemyField.length; e++) {
      enemyIvs = enemyField[e].ivs;
      const currentIvs = this.scene.gameData.dexData[enemyField[e].species.getRootSpeciesId()].ivs;  // we are using getRootSpeciesId() here because we want to check against the baby form, not the mid form if it exists
      const ivsToShow = this.scene.ui.getMessageHandler().getTopIvs(enemyIvs, this.shownIvs);
      statsContainer = enemyField[e].getBattleInfo().getStatsValueContainer().list as Phaser.GameObjects.Sprite[];
      statsContainerLabels = statsContainer.filter(m => m.name.indexOf("icon_stat_label") >= 0);
      for (let s = 0; s < statsContainerLabels.length; s++) {
        const ivStat = Stat[statsContainerLabels[s].frame.name];
        if (enemyIvs[ivStat] > currentIvs[ivStat] && ivsToShow.indexOf(Number(ivStat)) >= 0) {
          const hexColour = enemyIvs[ivStat] === 31 ? getTextColor(TextStyle.PERFECT_IV, false, uiTheme) : getTextColor(TextStyle.SUMMARY_GREEN, false, uiTheme);
          const hexTextColour = Phaser.Display.Color.HexStringToColor(hexColour).color;
          statsContainerLabels[s].setTint(hexTextColour);
        }
        statsContainerLabels[s].setVisible(true);
      }
    }

    if (!this.scene.hideIvs) {
      this.scene.ui.showText(i18next.t("battle:ivScannerUseQuestion", { pokemonName: getPokemonNameWithAffix(pokemon) }), null, () => {
        this.scene.ui.setMode(Mode.CONFIRM, () => {
        LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "IV Scanner → " + LoggerTools.enemyPokeName(this.scene, pokemon))
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.clearText();
          new CommonBattleAnim(CommonAnim.LOCK_ON, pokemon, pokemon).play(this.scene, () => {
            this.scene.ui.getMessageHandler().promptIvs(pokemon.id, pokemon.ivs, this.shownIvs).then(() => this.end());
          });
        }, () => {
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.clearText();
          this.end();
        });
      });
    } else {
      this.end();
    }
  }
}
//#endregion





//#region 78 TrainerMessageTestPhase
export class TrainerMessageTestPhase extends BattlePhase {
  private trainerTypes: TrainerType[];

  constructor(scene: BattleScene, ...trainerTypes: TrainerType[]) {
    super(scene);

    this.trainerTypes = trainerTypes;
  }

  start() {
    super.start();

    const testMessages: string[] = [];

    for (const t of Object.keys(trainerConfigs)) {
      const type = parseInt(t);
      if (this.trainerTypes.length && !this.trainerTypes.find(tt => tt === type as TrainerType)) {
        continue;
      }
      const config = trainerConfigs[type];
      [config.encounterMessages, config.femaleEncounterMessages, config.victoryMessages, config.femaleVictoryMessages, config.defeatMessages, config.femaleDefeatMessages]
        .map(messages => {
          if (messages?.length) {
            testMessages.push(...messages);
          }
        });
    }

    for (const message of testMessages) {
      this.scene.pushPhase(new TestMessagePhase(this.scene, message));
    }

    this.end();
  }
}
//#endregion





//#region 79 TestMessagePhase
export class TestMessagePhase extends MessagePhase {
  constructor(scene: BattleScene, message: string) {
    super(scene, message, null, true);
  }
}
//#endregion