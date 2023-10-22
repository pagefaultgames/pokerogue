import BattleScene, { startingLevel, startingWave } from "./battle-scene";
import { default as Pokemon, PlayerPokemon, EnemyPokemon, PokemonMove, MoveResult, DamageResult, FieldPosition, HitResult } from "./pokemon";
import * as Utils from './utils';
import { allMoves, applyMoveAttrs, BypassSleepAttr, ChargeAttr, applyFilteredMoveAttrs, HitsTagAttr, MissEffectAttr, MoveAttr, MoveCategory, MoveEffectAttr, MoveFlags, Moves, MultiHitAttr, OverrideMoveEffectAttr, VariableAccuracyAttr, MoveTarget, OneHitKOAttr, getMoveTargets, MoveTargetSet, MoveEffectTrigger, CopyMoveAttr } from "./data/move";
import { Mode } from './ui/ui';
import { Command } from "./ui/command-ui-handler";
import { Stat } from "./data/pokemon-stat";
import { BerryModifier, ContactHeldItemTransferChanceModifier, ExpBalanceModifier, ExpBoosterModifier, ExpShareModifier, ExtraModifierModifier, FlinchChanceModifier, HealingBoosterModifier, HitHealModifier, LapsingPersistentModifier, MapModifier, MultipleParticipantExpBonusModifier, PokemonExpBoosterModifier, PokemonHeldItemModifier, PokemonInstantReviveModifier, SwitchEffectTransferModifier, TempBattleStatBoosterModifier, TurnHealModifier, TurnHeldItemTransferModifier } from "./modifier/modifier";
import PartyUiHandler, { PartyOption, PartyUiMode } from "./ui/party-ui-handler";
import { doPokeballBounceAnim, getPokeballAtlasKey, getPokeballCatchMultiplier, getPokeballTintColor, PokeballType } from "./data/pokeball";
import { CommonAnim, CommonBattleAnim, MoveAnim, initMoveAnim, loadMoveAnimAssets } from "./data/battle-anims";
import { StatusEffect, getStatusEffectActivationText, getStatusEffectCatchRateMultiplier, getStatusEffectHealText, getStatusEffectObtainText, getStatusEffectOverlapText } from "./data/status-effect";
import { SummaryUiMode } from "./ui/summary-ui-handler";
import EvolutionSceneHandler from "./ui/evolution-scene-handler";
import { EvolutionPhase } from "./evolution-phase";
import { BattlePhase } from "./battle-phase";
import { BattleStat, getBattleStatLevelChangeDescription, getBattleStatName } from "./data/battle-stat";
import { Biome, biomeLinks } from "./data/biome";
import { ModifierType, ModifierTypeOption, PokemonModifierType, PokemonMoveModifierType, TmModifierType, getPlayerModifierTypeOptionsForWave, regenerateModifierPoolThresholds } from "./modifier/modifier-type";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { BattlerTagLapseType, BattlerTagType, HideSpriteTag as HiddenTag, TrappedTag } from "./data/battler-tag";
import { getPokemonMessage } from "./messages";
import { Starter } from "./ui/starter-select-ui-handler";
import { Gender } from "./data/gender";
import { Weather, WeatherType, getRandomWeatherType, getWeatherDamageMessage, getWeatherLapseMessage } from "./data/weather";
import { TempBattleStat } from "./data/temp-battle-stat";
import { ArenaTagType, ArenaTrapTag, TrickRoomTag } from "./data/arena-tag";
import { CheckTrappedAbAttr, PostDefendAbAttr, PostSummonAbAttr, PostTurnAbAttr, PostWeatherLapseAbAttr, PreWeatherDamageAbAttr, ProtectStatAbAttr, SuppressWeatherEffectAbAttr, applyCheckTrappedAbAttrs, applyPostDefendAbAttrs, applyPostSummonAbAttrs, applyPostTurnAbAttrs, applyPostWeatherLapseAbAttrs, applyPreStatChangeAbAttrs, applyPreWeatherEffectAbAttrs } from "./data/ability";
import { Unlockables, getUnlockableName } from "./system/unlockables";
import { getBiomeKey } from "./arena";
import { BattleType, BattlerIndex, TurnCommand } from "./battle";
import { GameMode } from "./game-mode";

export class CheckLoadPhase extends BattlePhase {
  private loaded: boolean;

  constructor(scene: BattleScene) {
    super(scene);

    this.loaded = false;
  }

  start(): void {
    if (!this.scene.gameData.hasSession()) {
      this.end();
      return;
    }

    this.scene.ui.showText('You currently have a session in progress.\nWould you like to continue where you left off?', null, () => {
      this.scene.ui.setMode(Mode.CONFIRM, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.gameData.loadSession(this.scene).then((success: boolean) => {
          if (success) {
            this.loaded = true;
            this.scene.ui.showText('Session loaded successfully.', null, () => this.end());
          } else
            this.end();
        }).catch(err => {
          console.error(err);
          this.scene.ui.showText('Your session data could not be loaded.\nIt may be corrupted. Please reload the page.', null);
        });
      }, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.clearText();
        this.end();
      })
    });
  }

  end(): void {
    if (!this.loaded) {
      this.scene.arena.preloadBgm();
      this.scene.pushPhase(new SelectStarterPhase(this.scene));
    } else
      this.scene.playBgm();

    const availablePartyMembers = this.scene.getParty().filter(p => !p.isFainted()).length;

    this.scene.pushPhase(new EncounterPhase(this.scene, this.loaded));
    this.scene.pushPhase(new SummonPhase(this.scene, 0));
    if (this.scene.currentBattle.double && availablePartyMembers > 1)
      this.scene.pushPhase(new SummonPhase(this.scene, 1));
    if (this.scene.currentBattle.waveIndex > 1 && this.scene.currentBattle.battleType !== BattleType.TRAINER) {
      this.scene.pushPhase(new CheckSwitchPhase(this.scene, 0, this.scene.currentBattle.double));
      if (this.scene.currentBattle.double && availablePartyMembers > 1)
        this.scene.pushPhase(new CheckSwitchPhase(this.scene, 1, this.scene.currentBattle.double));
    }

    super.end();
  }
}

export class SelectStarterPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.playSound('menu', { loop: true });

    this.scene.ui.setMode(Mode.STARTER_SELECT, (starters: Starter[]) => {
      const party = this.scene.getParty();
      const loadPokemonAssets: Promise<void>[] = [];
      for (let starter of starters) {
        const starterGender = starter.species.malePercent !== null
          ? !starter.female ? Gender.MALE : Gender.FEMALE
          : Gender.GENDERLESS;
        const starterPokemon = new PlayerPokemon(this.scene, starter.species, startingLevel, starter.abilityIndex, starter.formIndex, starterGender, starter.shiny);
        starterPokemon.setVisible(false);
        party.push(starterPokemon);
        loadPokemonAssets.push(starterPokemon.loadAssets());
      }
      Promise.all(loadPokemonAssets).then(() => {
        this.scene.ui.clearText();
        this.scene.ui.setMode(Mode.MESSAGE).then(() => {
          SoundFade.fadeOut(this.scene.sound.get('menu'), 500, true);
          this.scene.time.delayedCall(500, () => this.scene.playBgm());
          this.end();
        });
      });
    });
  }
}

type PokemonFunc = (pokemon: Pokemon) => void;

export abstract class FieldPhase extends BattlePhase {
  getOrder(): BattlerIndex[] {
    const playerField = this.scene.getPlayerField().filter(p => p.isActive()) as Pokemon[];
    const enemyField = this.scene.getEnemyField().filter(p => p.isActive()) as Pokemon[];

    let orderedTargets: Pokemon[] = playerField.concat(enemyField).sort((a: Pokemon, b: Pokemon) => {
      const aSpeed = a?.getBattleStat(Stat.SPD) || 0;
      const bSpeed = b?.getBattleStat(Stat.SPD) || 0;

      return aSpeed < bSpeed ? 1 : aSpeed > bSpeed ? -1 : !Utils.randInt(2) ? -1 : 1;
    });

    const speedReversed = new Utils.BooleanHolder(false);
    this.scene.arena.applyTags(TrickRoomTag, speedReversed);

    if (speedReversed.value)
      orderedTargets = orderedTargets.reverse();

    return orderedTargets.map(t => t.getFieldIndex() + (!t.isPlayer() ? BattlerIndex.ENEMY : 0));
  }

  executeForAll(func: PokemonFunc): void {
    const field = this.scene.getField().filter(p => p?.isActive());
    field.forEach(pokemon => func(pokemon));
  }
}

export abstract class PokemonPhase extends FieldPhase {
  protected battlerIndex: BattlerIndex;
  protected player: boolean;
  protected fieldIndex: integer;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene);

    if (battlerIndex === undefined)
      battlerIndex = scene.getField().find(p => p?.isActive()).getBattlerIndex();

    this.battlerIndex = battlerIndex;
    this.player = battlerIndex < 2;
    this.fieldIndex = battlerIndex % 2;
  }

  getPokemon() {
    return this.scene.getField()[this.battlerIndex];
  }
}

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

export abstract class PlayerPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, partyMemberIndex, true);
  }

  getPlayerPokemon(): PlayerPokemon {
    return super.getPokemon() as PlayerPokemon;
  }
}

export abstract class EnemyPartyMemberPokemonPhase extends PartyMemberPokemonPhase {
  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, partyMemberIndex, false);
  }

  getEnemyPokemon(): EnemyPokemon {
    return super.getPokemon() as EnemyPokemon;
  }
}

export class EncounterPhase extends BattlePhase {
  private loaded: boolean;

  constructor(scene: BattleScene, loaded?: boolean) {
    super(scene);

    this.loaded = !!loaded;
  }

  start() {
    super.start();

    this.scene.updateWaveCountText();
    this.scene.updateMoneyText();

    const loadEnemyAssets = [];

    const battle = this.scene.currentBattle;

    battle.enemyLevels.forEach((level, e) => {
      if (!this.loaded) {
        if (battle.battleType === BattleType.TRAINER)
          battle.enemyParty[e] = battle.trainer.genPartyMember(e);
        else {
          const enemySpecies = this.scene.randomSpecies(battle.waveIndex, level, null, true);
          battle.enemyParty[e] = new EnemyPokemon(this.scene, enemySpecies, level);
        }
      }
      const enemyPokemon = this.scene.getEnemyParty()[e];
      if (e < (battle.double ? 2 : 1)) {
        enemyPokemon.setX(-66 + enemyPokemon.getFieldPositionOffset()[0]);
        enemyPokemon.resetSummonData();
        this.scene.gameData.setPokemonSeen(enemyPokemon);
      }

      loadEnemyAssets.push(enemyPokemon.loadAssets());
  
      console.log(enemyPokemon.species.name, enemyPokemon.species.speciesId, enemyPokemon.stats);
    });

    if (battle.battleType === BattleType.TRAINER)
      loadEnemyAssets.push(battle.trainer.loadAssets().then(() => battle.trainer.initSprite()));

    Promise.all(loadEnemyAssets).then(() => {
      battle.enemyParty.forEach((enemyPokemon, e) => {
        if (e < (battle.double ? 2 : 1)) {
          if (battle.battleType === BattleType.WILD) {
            this.scene.field.add(enemyPokemon);
            const playerPokemon = this.scene.getPlayerPokemon();
            if (playerPokemon.visible)
              this.scene.field.moveBelow(enemyPokemon as Pokemon, playerPokemon);
            enemyPokemon.tint(0, 0.5);
          } else if (battle.battleType === BattleType.TRAINER) {
            enemyPokemon.setVisible(false);
            this.scene.currentBattle.trainer.tint(0, 0.5);
          }
          if (battle.double)
            enemyPokemon.setFieldPosition(e ? FieldPosition.RIGHT : FieldPosition.LEFT);
        }
      });

      if (!this.loaded) {
        regenerateModifierPoolThresholds(this.scene.getEnemyField(), false);
        this.scene.generateEnemyModifiers();
      }

      this.scene.ui.setMode(Mode.MESSAGE).then(() => {
        if (!this.loaded)
          this.scene.gameData.saveSession(this.scene);
        this.doEncounter();
      });
    });
  }

  doEncounter() {
    this.scene.playBgm(undefined, true);

    if (startingWave > 10) {
      for (let m = 0; m < Math.min(Math.floor(startingWave / 10), 99); m++)
        this.scene.addModifier(getPlayerModifierTypeOptionsForWave((m + 1) * 10, 1, this.scene.getParty())[0].type.newModifier());
    }

    this.scene.arena.trySetWeather(getRandomWeatherType(this.scene.arena.biomeType), false);

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, this.scene.currentBattle.trainer, enemyField, this.scene.arenaPlayer, this.scene.trainer ].flat(),
      x: (_target, _key, value, fieldIndex: integer) => fieldIndex < 2 + (enemyField.length) ? value + 300 : value - 300,
      duration: 2000,
      onComplete: () => this.doEncounterCommon()
    });
  }

  doEncounterCommon() {
    const enemyField = this.scene.getEnemyField();

    if (this.scene.currentBattle.battleType === BattleType.WILD) {
      enemyField.forEach(enemyPokemon => {
        enemyPokemon.untint(100, 'Sine.easeOut');
        enemyPokemon.cry();
        enemyPokemon.showInfo();
      });
      let text = enemyField.length === 1
        ? `A wild ${enemyField[0].name} appeared!`
        : `A wild ${enemyField[0].name}\nand ${enemyField[1].name} appeared!`;
      this.scene.ui.showText(text, null, () => this.end(), 1500);
    } else if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
      const trainer = this.scene.currentBattle.trainer;
      trainer.untint(100, 'Sine.easeOut');
      trainer.playAnim();
      
      const doSummon = () => {
        this.scene.currentBattle.started = true;
        this.scene.playBgm(undefined);
        this.scene.pbTray.showPbTray(this.scene.getParty());
			  this.scene.pbTrayEnemy.showPbTray(this.scene.getEnemyParty());
        const text = `${this.scene.currentBattle.trainer.getName()}\nwould like to battle!`;
        this.scene.ui.showText(text, null, () => {
          this.scene.tweens.add({
            targets: this.scene.currentBattle.trainer,
            x: '+=16',
            y: '-=16',
            alpha: 0,
            ease: 'Sine.easeInOut',
            duration: 750
          });
          this.scene.unshiftPhase(new SummonPhase(this.scene, 0, false));
          if (this.scene.currentBattle.double)
            this.scene.unshiftPhase(new SummonPhase(this.scene, 1, false));
          this.end();
        }, 1500, true);
      };

      if (!trainer.config.encounterMessages.length)
        doSummon();
      else {
        let message: string;
        this.scene.executeWithSeedOffset(() => message = Phaser.Math.RND.pick(this.scene.currentBattle.trainer.config.encounterMessages), this.scene.currentBattle.waveIndex);
        const messagePages = message.split(/\$/g).map(m => m.trim());
        let showMessageAndSummon = () => doSummon();
        for (let p = messagePages.length - 1; p >= 0; p--) {
          const originalFunc = showMessageAndSummon;
          showMessageAndSummon = () => this.scene.ui.showDialogue(messagePages[p], trainer.getName(), null, originalFunc, null, true);
        }
        showMessageAndSummon();
      }
    }
  }

  end() {
    const enemyField = this.scene.getEnemyField();

    enemyField.forEach((enemyPokemon, e) => {
      if (enemyPokemon.shiny)
        this.scene.unshiftPhase(new ShinySparklePhase(this.scene, BattlerIndex.ENEMY + e));
    });

    enemyField.map(p => this.scene.pushPhase(new PostSummonPhase(this.scene, p.getBattlerIndex())));
      
    // TODO: Remove
    //this.scene.unshiftPhase(new SelectModifierPhase(this.scene));

    super.end();
  }
}

export class NextEncounterPhase extends EncounterPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  doEncounter(): void {
    this.scene.playBgm(undefined, true);

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, this.scene.arenaNextEnemy, this.scene.currentBattle.trainer, enemyField, this.scene.lastEnemyTrainer ].flat(),
      x: '+=300',
      duration: 2000,
      onComplete: () => {
        this.scene.arenaEnemy.setX(this.scene.arenaNextEnemy.x);
        this.scene.arenaEnemy.setAlpha(1);
        this.scene.arenaNextEnemy.setX(this.scene.arenaNextEnemy.x - 300);
        
        this.doEncounterCommon();
      }
    });
  }
}

export class NewBiomeEncounterPhase extends NextEncounterPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  doEncounter(): void {
    this.scene.arena.trySetWeather(getRandomWeatherType(this.scene.arena.biomeType), false);

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, enemyField ].flat(),
      x: '+=300',
      duration: 2000,
      onComplete: () => this.doEncounterCommon()
    });
  }
}

export class PostSummonPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    this.scene.arena.applyTags(ArenaTrapTag, pokemon);
    applyPostSummonAbAttrs(PostSummonAbAttr, pokemon);

    this.end();
  }
}

export class SelectBiomePhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.fadeOutBgm(2000, true);

    const currentBiome = this.scene.arena.biomeType;

    const setNextBiome = (nextBiome: Biome) => {
      if (this.scene.gameMode === GameMode.CLASSIC)
        this.scene.unshiftPhase(new PartyHealPhase(this.scene, false));
      this.scene.unshiftPhase(new SwitchBiomePhase(this.scene, nextBiome));
      this.end();
    };

    if (this.scene.gameMode === GameMode.CLASSIC && this.scene.currentBattle.waveIndex === this.scene.finalWave - 9)
      setNextBiome(Biome.END);
    else if (this.scene.gameMode === GameMode.ENDLESS) {
      if (this.scene.currentBattle.waveIndex % 50 === 0)
        setNextBiome(Biome.END);
      else {
        const allBiomes = Utils.getEnumValues(Biome);
        setNextBiome(allBiomes[Utils.randSeedInt(allBiomes.length - 2, 1)]);
      }
    } else if (Array.isArray(biomeLinks[currentBiome])) {
      const biomes = biomeLinks[currentBiome] as Biome[];
      if (this.scene.findModifier(m => m instanceof MapModifier)) {
        this.scene.ui.setMode(Mode.BIOME_SELECT, currentBiome, (biomeIndex: integer) => {
          this.scene.ui.setMode(Mode.MESSAGE);
          setNextBiome(biomes[biomeIndex]);
        });
      } else
        setNextBiome(biomes[Utils.randSeedInt(biomes.length)]);
    } else
      setNextBiome(biomeLinks[currentBiome] as Biome);
  }
}

export class SwitchBiomePhase extends BattlePhase {
  private nextBiome: Biome;

  constructor(scene: BattleScene, nextBiome: Biome) {
    super(scene);

    this.nextBiome = nextBiome;
  }

  start() {
    super.start();

    if (this.nextBiome === undefined)
      return this.end();

    this.scene.tweens.add({
      targets: this.scene.arenaEnemy,
      x: '+=300',
      duration: 2000,
      onComplete: () => {
        this.scene.arenaEnemy.setX(this.scene.arenaEnemy.x - 600);

        this.scene.newArena(this.nextBiome);

        const biomeKey = getBiomeKey(this.nextBiome);
        const bgTexture = `${biomeKey}_bg`;
        this.scene.arenaBgTransition.setTexture(bgTexture)
        this.scene.arenaBgTransition.setAlpha(0);
        this.scene.arenaBgTransition.setVisible(true);
        this.scene.arenaPlayerTransition.setBiome(this.nextBiome);
        this.scene.arenaPlayerTransition.setAlpha(0);
        this.scene.arenaPlayerTransition.setVisible(true);

        this.scene.time.delayedCall(1000, () => this.scene.playBgm());

        this.scene.tweens.add({
          targets: [ this.scene.arenaPlayer, this.scene.arenaBgTransition, this.scene.arenaPlayerTransition ],
          duration: 1000,
          delay: 1000,
          ease: 'Sine.easeInOut',
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

            this.end();
          }
        });
      }
    });
  }
}

export class SummonPhase extends PartyMemberPokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer, player?: boolean) {
    super(scene, fieldIndex, player !== undefined ? player : true);
  }

  start() {
    super.start();

    this.preSummon();
  }

  preSummon(): void {
    const partyMember = this.getPokemon();
    if (partyMember.isFainted()) {
      const party = this.getParty();
      const nonFaintedIndex = party.slice(this.partyMemberIndex).findIndex(p => !p.isFainted()) + this.partyMemberIndex;
      const nonFaintedPartyMember = party[nonFaintedIndex];
      party[nonFaintedIndex] = partyMember;
      party[this.partyMemberIndex] = nonFaintedPartyMember;
    }

    if (this.player) {
      this.scene.ui.showText(`Go! ${this.getPokemon().name}!`);
      if (this.player)
         this.scene.pbTray.hide();
      this.scene.trainer.play('trainer_m_pb');
      this.scene.tweens.add({
        targets: this.scene.trainer,
        x: -36,
        duration: 1000
      });
      this.scene.time.delayedCall(750, () => this.summon());
    } else {
      this.scene.pbTrayEnemy.hide();
      this.scene.ui.showText(`${this.scene.currentBattle.trainer.getName()} sent out\n${this.getPokemon().name}!`, null, () => this.summon());
    }
  }

  summon(): void {
    const pokeball = this.scene.add.sprite(this.player ? 36 : 248, this.player ? 80 : 44, 'pb', 'pb');
    pokeball.setVisible(false);
    pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(pokeball);

    const pokemon = this.getPokemon();

    if (this.fieldIndex === 1)
      pokemon.setFieldPosition(FieldPosition.RIGHT, 0);
    else {
      const availablePartyMembers = this.getParty().filter(p => !p.isFainted()).length;
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
      ease: 'Cubic.easeOut',
      y: (this.player ? 70 : 34) + fpOffset[1],
      onComplete: () => {
        this.scene.tweens.add({
          targets: pokeball,
          duration: 500,
          ease: 'Cubic.easeIn',
          angle: 1440,
          y: (this.player ? 132 : 86) + fpOffset[1],
          onComplete: () => {
            this.scene.playSound('pb_rel');
            pokeball.destroy();
            this.scene.add.existing(pokemon);
            this.scene.field.add(pokemon);
            if (!this.player) {
              const playerPokemon = this.scene.getPlayerPokemon() as Pokemon;
              if (playerPokemon.visible)
                this.scene.field.moveBelow(pokemon, playerPokemon);
            }
            pokemon.showInfo();
            pokemon.playAnim();
            pokemon.setVisible(true);
            pokemon.setScale(0.5);
            pokemon.tint(getPokeballTintColor(pokemon.pokeball));
            pokemon.untint(250, 'Sine.easeIn');
            this.scene.tweens.add({
              targets: pokemon,
              duration: 250,
              ease: 'Sine.easeIn',
              scale: 1,
              onComplete: () => {
                pokemon.cry();
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

    if (pokemon.shiny)
      this.scene.unshiftPhase(new ShinySparklePhase(this.scene, pokemon.getBattlerIndex()));

    pokemon.resetTurnData();

    this.queuePostSummon();
  }

  queuePostSummon(): void {
    this.scene.pushPhase(new PostSummonPhase(this.scene, this.getPokemon().getBattlerIndex()));
  }

  end() {
    this.onEnd();

    super.end();
  }
}

export class SwitchSummonPhase extends SummonPhase {
  private slotIndex: integer;
  private doReturn: boolean;
  private batonPass: boolean;

  private lastPokemon: Pokemon;

  constructor(scene: BattleScene, fieldIndex: integer, slotIndex: integer, doReturn: boolean, batonPass: boolean, player?: boolean) {
    super(scene, fieldIndex, player !== undefined ? player : true);

    this.slotIndex = slotIndex;
    this.doReturn = doReturn;
    this.batonPass = batonPass;
  }

  preSummon(): void {
    if (!this.doReturn || (this.slotIndex !== -1 && !this.scene.getParty()[this.slotIndex])) {
      this.switchAndSummon();
      return;
    }

    const pokemon = this.getPokemon();

    if (!this.batonPass)
      this.scene.getEnemyField().forEach(enemyPokemon => enemyPokemon.removeTagsBySourceId(pokemon.id));

    this.scene.ui.showText(this.player ? `Come back, ${pokemon.name}!` : `${this.scene.currentBattle.trainer.getName()}\nwithdrew ${pokemon.name}!`);
    this.scene.playSound('pb_rel');
    pokemon.hideInfo();
    pokemon.tint(getPokeballTintColor(pokemon.pokeball), 1, 250, 'Sine.easeIn');
    this.scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: 'Sine.easeIn',
      scale: 0.5,
      onComplete: () => {
        pokemon.setVisible(false);
        this.scene.field.remove(pokemon);
        this.scene.time.delayedCall(750, () => this.switchAndSummon());
      }
    });
  }

  switchAndSummon() {
    const party = this.getParty();
    const switchedPokemon = party[this.slotIndex];
    this.lastPokemon = this.getPokemon();
    if (this.batonPass && switchedPokemon) {
      this.scene.getEnemyField().forEach(enemyPokemon => enemyPokemon.transferTagsBySourceId(this.lastPokemon.id, switchedPokemon.id));
      if (!this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === switchedPokemon.id)) {
        const batonPassModifier = this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier
          && (m as SwitchEffectTransferModifier).pokemonId === this.lastPokemon.id) as SwitchEffectTransferModifier;
        this.scene.tryTransferHeldItemModifier(batonPassModifier, switchedPokemon, false, false);
      }
    }
    if (switchedPokemon) {
      party[this.slotIndex] = this.lastPokemon;
      party[this.fieldIndex] = switchedPokemon;
      this.scene.ui.showText(this.player ? `Go! ${switchedPokemon.name}!` : `${this.scene.currentBattle.trainer.getName()} sent out\n${this.getPokemon().name}!`);
      this.summon();
    } else
      this.end();
  }

  onEnd(): void {
    super.onEnd();

    const pokemon = this.getPokemon();

    if (this.batonPass && pokemon)
      pokemon.transferSummon(this.lastPokemon);

    this.lastPokemon?.resetSummonData();
  }

  queuePostSummon(): void {
    this.scene.unshiftPhase(new PostSummonPhase(this.scene, this.getPokemon().getBattlerIndex()));
  }
}

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
  }
}

export class ShowTrainerPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.trainer.setTexture('trainer_m');

    this.scene.tweens.add({
      targets: this.scene.trainer,
      x: 106,
      duration: 1000,
      onComplete: () => this.end()
    });
  }
}

export class ToggleDoublePositionPhase extends BattlePhase {
  private double: boolean;

  constructor(scene: BattleScene, double: boolean) {
    super(scene);

    this.double = double;
  }

  start() {
    super.start();

    const playerPokemon = this.scene.getPlayerField().find(p => p.isActive(true));
    playerPokemon.setFieldPosition(this.double ? FieldPosition.LEFT : FieldPosition.CENTER, 500).then(() => {
      if (playerPokemon.getFieldIndex() === 1) {
        const party = this.scene.getParty();
        party[1] = party[0];
        party[0] = playerPokemon;
      }
      this.end();
    });
  }
}

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

    this.scene.ui.showText(`Will you switch\n${this.useName ? pokemon.name : 'Pokémon'}?`, null, () => {
      this.scene.ui.setMode(Mode.CONFIRM, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.unshiftPhase(new SwitchPhase(this.scene, this.fieldIndex, false, true));
        this.end();
      }, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.end();
      });
    });
  }
}

export class SummonMissingPhase extends SummonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  preSummon(): void {
    this.scene.ui.showText(`Go! ${this.getPokemon().name}!`);
    this.scene.time.delayedCall(250, () => this.summon());
  }
}

export class LevelCapPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start(): void {
    super.start();

    this.scene.ui.setMode(Mode.MESSAGE).then(() => {
      this.scene.playSoundWithoutBgm('level_up_fanfare', 1500);
      this.scene.ui.showText(`The level cap\nhas increased to ${this.scene.getMaxExpLevel()}!`, null, () => this.end(), null, true);
      this.executeForAll(pokemon => pokemon.updateInfo(true));
    });
  }
}

export class TurnInitPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.getField().forEach((pokemon, i) => {
      if (pokemon?.isActive()) {
        if (pokemon.isPlayer())
          this.scene.currentBattle.addParticipant(pokemon as PlayerPokemon);

        pokemon.resetTurnData();

        this.scene.pushPhase(pokemon.isPlayer() ? new CommandPhase(this.scene, i) : new EnemyCommandPhase(this.scene, i - BattlerIndex.ENEMY));
      }
    });

    this.scene.pushPhase(new TurnStartPhase(this.scene));

    this.end();
  }
}

export class CommandPhase extends FieldPhase {
  protected fieldIndex: integer;

  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene);

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];

    const moveQueue = playerPokemon.getMoveQueue();

    while (moveQueue.length && moveQueue[0]
      && moveQueue[0].move && (!playerPokemon.getMoveset().find(m => m.moveId === moveQueue[0].move)
      || !playerPokemon.getMoveset()[playerPokemon.getMoveset().findIndex(m => m.moveId === moveQueue[0].move)].isUsable(moveQueue[0].ignorePP)))
        moveQueue.shift();

    if (moveQueue.length) {
      const queuedMove = moveQueue[0];
      if (!queuedMove.move)
        this.handleCommand(Command.FIGHT, -1, false);
      else {
        const moveIndex = playerPokemon.getMoveset().findIndex(m => m.moveId === queuedMove.move);
        if (moveIndex > -1 && playerPokemon.getMoveset()[moveIndex].isUsable(queuedMove.ignorePP)) {
          this.handleCommand(Command.FIGHT, moveIndex, queuedMove.ignorePP, { targets: queuedMove.targets, multiple: queuedMove.targets.length > 1 });
        } else
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
      }
    } else
      this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
  }

  handleCommand(command: Command, cursor: integer, ...args: any[]): boolean {
    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];
    const enemyField = this.scene.getEnemyField();
    let success: boolean;

    switch (command) {
      case Command.FIGHT:
        if (cursor === -1 || playerPokemon.trySelectMove(cursor, args[0] as boolean)) {
          const turnCommand: TurnCommand = { command: Command.FIGHT, cursor: cursor,
            move: cursor > -1 ? { move: playerPokemon.moveset[cursor].moveId, targets: [] } : null, args: args }; // TODO: Struggle logic
          const moveTargets: MoveTargetSet = args.length < 3 ? getMoveTargets(playerPokemon, cursor > -1 ? playerPokemon.moveset[cursor].moveId : Moves.NONE) : args[2];
          console.log(moveTargets, playerPokemon.name);
          if (moveTargets.targets.length <= 1 || moveTargets.multiple)
            turnCommand.move.targets = moveTargets.targets;
          else
            this.scene.unshiftPhase(new SelectTargetPhase(this.scene, this.fieldIndex));
          this.scene.currentBattle.turnCommands[this.fieldIndex] = turnCommand;
          success = true;
        } else if (cursor < playerPokemon.getMoveset().length) {
          const move = playerPokemon.getMoveset()[cursor];
          if (move.isDisabled()) {
            this.scene.ui.setMode(Mode.MESSAGE);
            this.scene.ui.showText(`${move.getName()} is disabled!`, null, () => {
              this.scene.ui.clearText();
              this.scene.ui.setMode(Mode.FIGHT, this.fieldIndex);
            }, null, true);
          }
        }

        break;
      case Command.BALL:
        if (this.scene.arena.biomeType === Biome.END) {
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.showText(`A strange force\nprevents using Poké Balls.`, null, () => {
            this.scene.ui.showText(null, 0);
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.showText(`You can't catch\nanother trainer's Pokémon!`, null, () => {
            this.scene.ui.showText(null, 0);
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else if (cursor < 4) {
          const targets = this.scene.getEnemyField().filter(p => p.isActive(true)).map(p => p.getBattlerIndex());
          this.scene.currentBattle.turnCommands[this.fieldIndex] = { command: Command.BALL, cursor: cursor };
          this.scene.currentBattle.turnPokeballCounts[cursor as PokeballType]--;
          if (targets.length > 1)
            this.scene.unshiftPhase(new SelectTargetPhase(this.scene, this.fieldIndex));
          else
            this.scene.currentBattle.turnCommands[this.fieldIndex].targets = targets;
          success = true;
        }
        break;
      case Command.POKEMON:
      case Command.RUN:
        const isSwitch = command === Command.POKEMON;
        if (!isSwitch && this.scene.currentBattle.battleType === BattleType.TRAINER) {
          this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.showText(`You can't run\nfrom a trainer battle!`, null, () => {
            this.scene.ui.showText(null, 0);
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
          }, null, true);
        } else {
          const trapTag = playerPokemon.findTag(t => t instanceof TrappedTag) as TrappedTag;
          const trapped = new Utils.BooleanHolder(false);
          const batonPass = isSwitch && args[0] as boolean;
          if (!batonPass)
            enemyField.forEach(enemyPokemon => applyCheckTrappedAbAttrs(CheckTrappedAbAttr, enemyPokemon, trapped));
          if (batonPass || (!trapTag && !trapped.value)) {
            this.scene.currentBattle.turnCommands[this.fieldIndex] = isSwitch
              ? { command: Command.POKEMON, cursor: cursor, args: args }
              : { command: Command.RUN };
            success = true;
          } else if (trapTag) {
            this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            this.scene.ui.setMode(Mode.MESSAGE);
            this.scene.ui.showText(`${this.scene.getPokemonById(trapTag.sourceId).name}'s ${trapTag.getMoveName()}\nprevents ${isSwitch ? 'switching' : 'fleeing'}!`, null, () => {
              this.scene.ui.showText(null, 0);
              this.scene.ui.setMode(Mode.COMMAND, this.fieldIndex);
            }, null, true);
          }
        }
        break;
    }

    if (success)
      this.end();

    return success;
  }

  cancel() {
    if (this.fieldIndex) {
      const lastCommand = this.scene.currentBattle.turnCommands[0];
      if (lastCommand.command === Command.BALL)
        this.scene.currentBattle.turnPokeballCounts[lastCommand.cursor]++;
      this.scene.unshiftPhase(new CommandPhase(this.scene, 0));
      this.scene.unshiftPhase(new CommandPhase(this.scene, 1));
      this.end();
    }
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

export class EnemyCommandPhase extends FieldPhase {
  protected fieldIndex: integer;

  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene);

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    const enemyPokemon = this.scene.getEnemyField()[this.fieldIndex];

    const nextMove = enemyPokemon.getNextMove();

    this.scene.currentBattle.turnCommands[this.fieldIndex + BattlerIndex.ENEMY] =
      { command: Command.FIGHT, move: nextMove };

    this.end();
  }
}

export class SelectTargetPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  start() {
    super.start();

    const turnCommand = this.scene.currentBattle.turnCommands[this.fieldIndex];
    const move = turnCommand.move?.move;
    this.scene.ui.setMode(Mode.TARGET_SELECT, this.fieldIndex, move, (cursor: integer) => {
      this.scene.ui.setMode(Mode.MESSAGE);
      if (cursor === -1) {
        if (turnCommand.command === Command.BALL)
          this.scene.currentBattle.turnPokeballCounts[turnCommand.cursor]++;
        this.scene.currentBattle.turnCommands[this.fieldIndex] = null;
        this.scene.unshiftPhase(new CommandPhase(this.scene, this.fieldIndex));
      } else
        turnCommand.targets = [ cursor ];
      this.end();
    });
  }
}

export class TurnStartPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const field = this.scene.getField();
    const order = this.getOrder();

    const moveOrder = order.slice(0);

    moveOrder.sort((a, b) => {
      const aCommand = this.scene.currentBattle.turnCommands[a];
      const bCommand = this.scene.currentBattle.turnCommands[b];

      if (aCommand.command !== bCommand.command) {
        if (aCommand.command === Command.FIGHT)
          return 1;
        else if (bCommand.command === Command.FIGHT)
          return -1;
      } else if (aCommand.command === Command.FIGHT) {
        const aPriority = allMoves[aCommand.move.move].priority;
        const bPriority = allMoves[bCommand.move.move].priority;
        
        if (aPriority !== bPriority)
          return aPriority < bPriority ? 1 : -1;
      }
      
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);

      return aIndex < bIndex ? -1 : aIndex > bIndex ? 1 : 0;
    });

    for (let o of moveOrder) {

      const pokemon = field[o];
      const turnCommand = this.scene.currentBattle.turnCommands[o];

      switch (turnCommand.command) {
        case Command.FIGHT:
          const queuedMove = turnCommand.move;
          if (!queuedMove)
            continue;
          const move = pokemon.getMoveset().find(m => m.moveId === queuedMove.move) || new PokemonMove(queuedMove.move);
          if (pokemon.isPlayer()) {
            if (turnCommand.cursor === -1)
              this.scene.pushPhase(new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move.targets, move));
            else {
              const playerPhase = new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move.targets, move, false, queuedMove.ignorePP);
              this.scene.pushPhase(playerPhase);
            }
          } else
            this.scene.pushPhase(new MovePhase(this.scene, pokemon, turnCommand.targets || turnCommand.move.targets, move, false, queuedMove.ignorePP));
          break;
        case Command.BALL:
          this.scene.unshiftPhase(new AttemptCapturePhase(this.scene, turnCommand.targets[0] % 2, turnCommand.cursor));
          break;
        case Command.POKEMON:
        case Command.RUN:
          const isSwitch = turnCommand.command === Command.POKEMON;
          if (isSwitch)
            this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, pokemon.getFieldIndex(), turnCommand.cursor, true, turnCommand.args[0] as boolean));
          else
            this.scene.unshiftPhase(new AttemptRunPhase(this.scene, pokemon.getFieldIndex()));
          break;
      }
    }

    if (this.scene.arena.weather)
      this.scene.pushPhase(new WeatherEffectPhase(this.scene, this.scene.arena.weather));

    for (let o of order) {
      if (field[o].status && field[o].status.isPostTurn())
        this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, o));
    }

    this.scene.pushPhase(new TurnEndPhase(this.scene));

    this.end();
  }
}

export class TurnEndPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.currentBattle.incrementTurn(this.scene);
    
    const handlePokemon = (pokemon: Pokemon) => {
      pokemon.lapseTags(BattlerTagLapseType.TURN_END);
      
      const disabledMoves = pokemon.getMoveset().filter(m => m.isDisabled());
      for (let dm of disabledMoves) {
        if (!--dm.disableTurns)
          this.scene.pushPhase(new MessagePhase(this.scene, `${dm.getName()} is disabled\nno more!`));
      }

      const hasUsableBerry = !!this.scene.findModifier(m => m instanceof BerryModifier && m.shouldApply([ pokemon ]), pokemon.isPlayer());
      if (hasUsableBerry)
        this.scene.pushPhase(new BerryPhase(this.scene, pokemon.getBattlerIndex()));

      this.scene.applyModifiers(TurnHealModifier, pokemon.isPlayer(), pokemon);

      applyPostTurnAbAttrs(PostTurnAbAttr, pokemon);

      this.scene.applyModifiers(TurnHeldItemTransferModifier, pokemon.isPlayer(), pokemon);

      pokemon.battleSummonData.turnCount++;
    };

    this.executeForAll(handlePokemon);
      
    this.scene.arena.lapseTags();

    if (this.scene.arena.weather && !this.scene.arena.weather.lapse())
      this.scene.arena.trySetWeather(WeatherType.NONE, false);

    this.end();
  }
}

export class BattleEndPhase extends BattlePhase {
  start() {
    super.start();

    for (let pokemon of this.scene.getField()) {
      if (pokemon)
        pokemon.resetBattleSummonData();
    }

    this.scene.clearEnemyModifiers();

    const lapsingModifiers = this.scene.findModifiers(m => m instanceof LapsingPersistentModifier) as LapsingPersistentModifier[];
    for (let m of lapsingModifiers) {
      if (!m.lapse())
        this.scene.removeModifier(m);
    }

    this.scene.updateModifiers().then(() => this.end());
  }
}

export class NewBattlePhase extends BattlePhase {
  start() {
    super.start();

    this.scene.newBattle();

    this.end();
  }
}

export class CommonAnimPhase extends PokemonPhase {
  private anim: CommonAnim;
  private targetIndex: integer;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, targetIndex: BattlerIndex, anim: CommonAnim) {
    super(scene, battlerIndex);

    this.anim = anim;
    this.targetIndex = targetIndex;
  }

  start() {
    new CommonBattleAnim(this.anim, this.getPokemon(), this.targetIndex !== undefined ? (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField())[this.targetIndex] : this.getPokemon()).play(this.scene, () => {
      this.end();
    });
  }
}

export class MovePhase extends BattlePhase {
  protected pokemon: Pokemon;
  protected targets: BattlerIndex[];
  protected move: PokemonMove;
  protected followUp: boolean;
  protected ignorePp: boolean;
  protected cancelled: boolean;

  constructor(scene: BattleScene, pokemon: Pokemon, targets: BattlerIndex[], move: PokemonMove, followUp?: boolean, ignorePp?: boolean) {
    super(scene);

    this.pokemon = pokemon;
    this.targets = targets;
    this.move = move;
    this.followUp = !!followUp;
    this.ignorePp = !!ignorePp;
    this.cancelled = false;
  }

  canMove(): boolean {
    return this.pokemon.isActive(true) && this.move.isUsable(this.ignorePp) && !!this.targets.length;
  }

  cancel(): void {
    this.cancelled = true;
  }

  start() {
    super.start();

    console.log(Moves[this.move.moveId]);

    if (!this.canMove()) {
      if (this.move.isDisabled())
        this.scene.queueMessage(`${this.move.getName()} is disabled!`);
      this.end();
      return;
    }

    console.log(this.targets);

    const targets = this.scene.getField().filter(p => {
      if (p?.isActive(true) && this.targets.indexOf(p.getBattlerIndex()) > -1) {
        const hiddenTag = p.getTag(HiddenTag);
        if (hiddenTag && !this.move.getMove().getAttrs(HitsTagAttr).filter(hta => (hta as HitsTagAttr).tagType === hiddenTag.tagType).length)
          return false;
        return true;
      }
      return false;
    });

    if (!this.followUp && this.canMove())
      this.pokemon.lapseTags(BattlerTagLapseType.MOVE);

    const doMove = () => {
      const moveQueue = this.pokemon.getMoveQueue();

      if ((moveQueue.length && moveQueue[0].move === Moves.NONE) || !targets.length) {
        moveQueue.shift();
        this.cancel();
      }

      if (this.cancelled) {
        this.pokemon.pushMoveHistory({ move: Moves.NONE, result: MoveResult.FAIL });
        this.end();
        return;
      }

      this.scene.queueMessage(getPokemonMessage(this.pokemon, ` used\n${this.move.getName()}!`), 500);
      if (!moveQueue.length || !moveQueue.shift().ignorePP)
        this.move.ppUsed++;

      if (!allMoves[this.move.moveId].getAttrs(CopyMoveAttr).length)
        this.scene.currentBattle.lastMove = this.move.moveId;

      // Assume conditions affecting targets only apply to moves with a single target
      let success = this.move.getMove().applyConditions(this.pokemon, targets[0], this.move.getMove());
      if (success && this.scene.arena.isMoveWeatherCancelled(this.move.getMove()))
        success = false;
      if (success)
        this.scene.unshiftPhase(this.getEffectPhase());
      else {
        this.pokemon.pushMoveHistory({ move: this.move.moveId, targets: this.targets, result: MoveResult.FAIL, virtual: this.move.virtual });
        this.scene.queueMessage('But it failed!');
      }
      
      this.end();
    };

    if (!this.followUp && this.pokemon.status && !this.pokemon.status.isPostTurn()) {
      this.pokemon.status.incrementTurn();
      let activated = false;
      let healed = false;
      
      switch (this.pokemon.status.effect) {
        case StatusEffect.PARALYSIS:
          if (Utils.randInt(4) === 0) {
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
          healed = Utils.randInt(5) === 0;
          activated = !healed;
          this.cancelled = activated;
          break;
      }
      if (activated) {
        this.scene.queueMessage(getPokemonMessage(this.pokemon, getStatusEffectActivationText(this.pokemon.status.effect)));
        this.scene.unshiftPhase(new CommonAnimPhase(this.scene, this.pokemon.getBattlerIndex(), undefined, CommonAnim.POISON + (this.pokemon.status.effect - 1)));
        doMove();
      } else {
        if (healed) {
          this.scene.queueMessage(getPokemonMessage(this.pokemon, getStatusEffectHealText(this.pokemon.status.effect)));
          this.pokemon.resetStatus();
          this.pokemon.updateInfo();
        }
        doMove();
      }
    } else
      doMove();
  }

  getEffectPhase(): MoveEffectPhase {
    return new MoveEffectPhase(this.scene, this.pokemon.getBattlerIndex(), this.targets, this.move);
  }

  end() {
    if (!this.followUp && this.canMove())
      this.scene.unshiftPhase(new MoveEndPhase(this.scene, this.pokemon.getBattlerIndex()));

    super.end();
  }
}

class MoveEffectPhase extends PokemonPhase {
  protected move: PokemonMove;
  protected targets: BattlerIndex[];
  
  constructor(scene: BattleScene, battlerIndex: BattlerIndex, targets: BattlerIndex[], move: PokemonMove) {
    super(scene, battlerIndex);

    this.move = move;
    this.targets = targets;
  }

  start() {
    super.start();

    const user = this.getUserPokemon();
    const targets = this.getTargets();

    const overridden = new Utils.BooleanHolder(false);

    // Assume single target for override
    applyMoveAttrs(OverrideMoveEffectAttr, user, this.getTarget(), this.move.getMove(), overridden).then(() => {

      if (overridden.value) {
        this.end();
        return;
      }

      user.lapseTags(BattlerTagLapseType.MOVE_EFFECT);

      if (user.turnData.hitsLeft === undefined) {
        const hitCount = new Utils.IntegerHolder(1);
        // Assume single target for multi hit
        applyMoveAttrs(MultiHitAttr, user, this.getTarget(), this.move.getMove(), hitCount);
        user.turnData.hitCount = 0;
        user.turnData.hitsLeft = user.turnData.hitCount = hitCount.value;
      }

      const moveHistoryEntry = { move: this.move.moveId, targets: this.targets, result: MoveResult.PENDING, virtual: this.move.virtual };
      user.pushMoveHistory(moveHistoryEntry);

      const targetHitChecks = Object.fromEntries(targets.map(p => [ p.getBattlerIndex(), this.hitCheck(p) ]));
      if (targets.length === 1 && !targetHitChecks[this.targets[0]]) {
        this.scene.queueMessage(getPokemonMessage(user, '\'s\nattack missed!'));
        moveHistoryEntry.result = MoveResult.MISS;
        applyMoveAttrs(MissEffectAttr, user, null, this.move.getMove());
        this.end();
        return;
      }

      // Move animation only needs one target
      new MoveAnim(this.move.getMove().id as Moves, user, this.getTarget()?.getBattlerIndex()).play(this.scene, () => {
        for (let target of targets) {
          if (!targetHitChecks[target.getBattlerIndex()]) {
            this.scene.queueMessage(getPokemonMessage(user, '\'s\nattack missed!'));
            if (moveHistoryEntry.result === MoveResult.PENDING)
              moveHistoryEntry.result = MoveResult.MISS;
            applyMoveAttrs(MissEffectAttr, user, null, this.move.getMove());
            continue;
          }

          const isProtected = !this.move.getMove().hasFlag(MoveFlags.IGNORE_PROTECT) && target.lapseTag(BattlerTagType.PROTECTED);

          moveHistoryEntry.result = MoveResult.SUCCESS;
          
          const hitResult = !isProtected ? target.apply(user, this.move) : HitResult.NO_EFFECT;

          applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && (attr as MoveEffectAttr).trigger === MoveEffectTrigger.PRE_APPLY,
            user, target, this.move.getMove());
          
          if (hitResult !== HitResult.FAIL) {
            const chargeEffect = !!this.move.getMove().getAttrs(ChargeAttr).find(ca => (ca as ChargeAttr).chargeEffect);
            // Charge attribute with charge effect takes all effect attributes and applies them to charge stage, so ignore them if this is present
            if (!chargeEffect)
              applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && (attr as MoveEffectAttr).trigger === MoveEffectTrigger.POST_APPLY
                && (attr as MoveEffectAttr).selfTarget, user, target, this.move.getMove());
            if (hitResult !== HitResult.NO_EFFECT) {
              applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && (attr as MoveEffectAttr).trigger === MoveEffectTrigger.POST_APPLY
                && !(attr as MoveEffectAttr).selfTarget, user, target, this.move.getMove());
              if (hitResult < HitResult.NO_EFFECT) {
                const flinched = new Utils.BooleanHolder(false);
                user.scene.applyModifiers(FlinchChanceModifier, user.isPlayer(), user, flinched);
                if (flinched.value)
                  target.addTag(BattlerTagType.FLINCHED, undefined, this.move.moveId, user.id);
              }
              if (!isProtected && !chargeEffect) {
                applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && (attr as MoveEffectAttr).trigger === MoveEffectTrigger.HIT,
                  user, target, this.move.getMove());
                if (!target.isFainted())
                  applyPostDefendAbAttrs(PostDefendAbAttr, target, user, this.move, hitResult);
                if (this.move.getMove().hasFlag(MoveFlags.MAKES_CONTACT))
                  this.scene.applyModifiers(ContactHeldItemTransferChanceModifier, this.player, user, target.getFieldIndex());
              }
            }
          }
        }
        this.end();
      });
    });
  }

  end() {
    const user = this.getUserPokemon();
    if (--user.turnData.hitsLeft >= 1 && this.getTarget())
      this.scene.unshiftPhase(this.getNewHitPhase());
    else {
      if (user.turnData.hitCount > 1)
        this.scene.queueMessage(`Hit ${user.turnData.hitCount} time(s)!`);
      this.scene.applyModifiers(HitHealModifier, this.player, user);
    }
    
    super.end();
  }

  hitCheck(target: Pokemon): boolean {
    if (this.move.getMove().moveTarget === MoveTarget.USER)
      return true;

    const hiddenTag = target.getTag(HiddenTag);
    if (hiddenTag && !this.move.getMove().getAttrs(HitsTagAttr).filter(hta => (hta as HitsTagAttr).tagType === hiddenTag.tagType).length)
      return false;

    if (this.getUserPokemon().getTag(BattlerTagType.IGNORE_ACCURACY) && (this.getUserPokemon().getLastXMoves().find(() => true)?.targets || []).indexOf(target.getBattlerIndex()) > -1)
      return true;

    const moveAccuracy = new Utils.NumberHolder(this.move.getMove().accuracy);

    applyMoveAttrs(VariableAccuracyAttr, this.getUserPokemon(), target, this.move.getMove(), moveAccuracy);

    if (moveAccuracy.value === -1)
      return true;

    if (!this.move.getMove().getAttrs(OneHitKOAttr).length && this.scene.arena.getTag(ArenaTagType.GRAVITY))
      moveAccuracy.value = Math.floor(moveAccuracy.value * 1.67);
      
    const userAccuracyLevel = new Utils.IntegerHolder(this.getUserPokemon().summonData.battleStats[BattleStat.ACC]);
    const targetEvasionLevel = new Utils.IntegerHolder(target.summonData.battleStats[BattleStat.EVA]);
    this.scene.applyModifiers(TempBattleStatBoosterModifier, this.player, TempBattleStat.ACC, userAccuracyLevel);
    const rand = Utils.randInt(100, 1);
    let accuracyMultiplier = 1;
    if (userAccuracyLevel.value !== targetEvasionLevel.value) {
      accuracyMultiplier = userAccuracyLevel.value > targetEvasionLevel.value
        ? (3 + Math.min(userAccuracyLevel.value - targetEvasionLevel.value, 6)) / 3
        : 3 / (3 + Math.min(targetEvasionLevel.value - userAccuracyLevel.value, 6));
    }
    return rand <= moveAccuracy.value * accuracyMultiplier;
  }

  getUserPokemon(): Pokemon {
    return (this.player ? this.scene.getPlayerField() : this.scene.getEnemyField())[this.fieldIndex];
  }

  getTargets(): Pokemon[] {
    return this.scene.getField().filter(p => p?.isActive(true) && this.targets.indexOf(p.getBattlerIndex()) > -1);
  }

  getTarget(): Pokemon {
    return this.getTargets().find(() => true);
  }

  getNewHitPhase() {
    return new MoveEffectPhase(this.scene, this.battlerIndex, this.targets, this.move);
  }
}

export class MoveEndPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    this.getPokemon().lapseTags(BattlerTagLapseType.AFTER_MOVE);

    this.end();
  }
}

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
    } else if (player)
      console.log(Moves[moveId]);

    initMoveAnim(moveId).then(() => {
      loadMoveAnimAssets(this.scene, [ moveId ], true)
        .then(() => {
          new MoveAnim(moveId, player ? this.scene.getPlayerPokemon() : this.scene.getEnemyPokemon(), 0).play(this.scene, () => {
            if (player)
              this.playMoveAnim(moveQueue, false);
            else
              this.playMoveAnim(moveQueue, true);
          });
      });
    });
  }
}

export class ShowAbilityPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    this.scene.abilityBar.showAbility(this.getPokemon());

    this.end();
  }
}

export class StatChangePhase extends PokemonPhase {
  private stats: BattleStat[];
  private selfTarget: boolean;
  private levels: integer;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, selfTarget: boolean, stats: BattleStat[], levels: integer) {
    super(scene, battlerIndex);

    const allStats = Utils.getEnumValues(BattleStat);
    this.selfTarget = selfTarget;
    this.stats = stats.map(s => s !== BattleStat.RAND ? s : allStats[Utils.randInt(BattleStat.SPD + 1)]);
    this.levels = levels;
  }

  start() {
    const pokemon = this.getPokemon();

    const filteredStats = this.stats.filter(stat => {
      const cancelled = new Utils.BooleanHolder(false);

      if (!this.selfTarget && this.levels < 0)
        applyPreStatChangeAbAttrs(ProtectStatAbAttr, this.getPokemon(), stat, cancelled);
      
      return !cancelled.value;
    });

    const battleStats = this.getPokemon().summonData.battleStats;
    const relLevels = filteredStats.map(stat => (this.levels >= 1 ? Math.min(battleStats[stat] + this.levels, 6) : Math.max(battleStats[stat] + this.levels, -6)) - battleStats[stat]);

    const end = () => {
      const messages = this.getStatChangeMessages(filteredStats, relLevels);
      for (let message of messages)
        this.scene.queueMessage(message);

      for (let stat of filteredStats)
        pokemon.summonData.battleStats[stat] = Math.max(Math.min(pokemon.summonData.battleStats[stat] + this.levels, 6), -6);
      
      this.end();
    };

    if (relLevels.filter(l => l).length) {
      pokemon.enableMask();
      const pokemonMaskSprite = pokemon.maskSprite;

      const statSprite = this.scene.add.tileSprite((this.player ? 106 : 236) * 6, ((this.player ? 148 : 84) + (this.levels >= 1 ? 160 : 0)) * 6, 156, 316, 'battle_stats', filteredStats.length > 1 ? 'mix' : BattleStat[filteredStats[0]].toLowerCase());
      statSprite.setAlpha(0);
      statSprite.setScale(6);
      statSprite.setOrigin(0.5, 1);

      this.scene.playSound(`stat_${this.levels >= 1 ? 'up' : 'down'}`);

      statSprite.setMask(new Phaser.Display.Masks.BitmapMask(this.scene, pokemonMaskSprite));

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
        y: `${this.levels >= 1 ? '-' : '+'}=${160 * 6}`
      });
      
      this.scene.time.delayedCall(1750, () => {
        pokemon.disableMask();
        end();
      });
    } else
      end();
  }

  getStatChangeMessages(stats: BattleStat[], relLevels: integer[]): string[] {
    const messages: string[] = [];
    
    for (let s = 0; s < stats.length; s++)
      messages.push(getPokemonMessage(this.getPokemon(), `'s ${getBattleStatName(stats[s])} ${getBattleStatLevelChangeDescription(Math.abs(relLevels[s]), this.levels >= 1)}!`));
    return messages;
  }
}

export class WeatherEffectPhase extends CommonAnimPhase {
  private weather: Weather;

  constructor(scene: BattleScene, weather: Weather) {
    super(scene, undefined, undefined, CommonAnim.SUNNY + (weather.weatherType - 1));
    this.weather = weather;
  }

  start() {
    if (this.weather.isDamaging()) {
      
      const cancelled = new Utils.BooleanHolder(false);

      this.executeForAll((pokemon: Pokemon) => applyPreWeatherEffectAbAttrs(SuppressWeatherEffectAbAttr, pokemon, this.weather, cancelled));

      if (!cancelled.value) {
        const inflictDamage = (pokemon: Pokemon) => {
          const cancelled = new Utils.BooleanHolder(false);

          applyPreWeatherEffectAbAttrs(PreWeatherDamageAbAttr, pokemon, this.weather, cancelled);

          if (cancelled.value)
            return;

          this.scene.queueMessage(getWeatherDamageMessage(this.weather.weatherType, pokemon));
          this.scene.unshiftPhase(new DamagePhase(this.scene, pokemon.getBattlerIndex()));
          pokemon.damage(Math.ceil(pokemon.getMaxHp() / 16));
        };

        this.executeForAll((pokemon: Pokemon) => {
          const immune = !pokemon || !!pokemon.getTypes().filter(t => this.weather.isTypeDamageImmune(t)).length;
          if (!immune)
            inflictDamage(pokemon);
        });
      }
    }

    this.scene.ui.showText(getWeatherLapseMessage(this.weather.weatherType), null, () => {
      this.executeForAll((pokemon: Pokemon) => applyPostWeatherLapseAbAttrs(PostWeatherLapseAbAttr, pokemon, this.weather));

      super.start();
    });
  }
}

export class ObtainStatusEffectPhase extends PokemonPhase {
  private statusEffect: StatusEffect;
  private cureTurn: integer;
  private sourceText: string;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, statusEffect: StatusEffect, cureTurn?: integer, sourceText?: string) {
    super(scene, battlerIndex);

    this.statusEffect = statusEffect;
    this.cureTurn = cureTurn;
    this.sourceText = sourceText;
  }

  start() {
    const pokemon = this.getPokemon();
    if (!pokemon.status) {
      if (pokemon.trySetStatus(this.statusEffect)) {
        if (this.cureTurn)
          pokemon.status.cureTurn = this.cureTurn;
        pokemon.updateInfo(true);
        new CommonBattleAnim(CommonAnim.POISON + (this.statusEffect - 1), pokemon).play(this.scene, () => {
          this.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectObtainText(this.statusEffect, this.sourceText)));
          if (pokemon.status.isPostTurn())
            this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, this.battlerIndex));
          this.end();
        });
        return;
      }
    } else if (pokemon.status.effect === this.statusEffect)
      this.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectOverlapText(this.statusEffect)));
    this.end();
  }
}

export class PostTurnStatusEffectPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    const pokemon = this.getPokemon();
    if (pokemon?.isActive(true) && pokemon.status && pokemon.status.isPostTurn()) {
      pokemon.status.incrementTurn();
      new CommonBattleAnim(CommonAnim.POISON + (pokemon.status.effect - 1), pokemon).play(this.scene, () => {
        this.scene.queueMessage(getPokemonMessage(pokemon, getStatusEffectActivationText(pokemon.status.effect)));
        switch (pokemon.status.effect) {
          case StatusEffect.POISON:
          case StatusEffect.BURN:
            pokemon.damage(Math.max(pokemon.getMaxHp() >> 3, 1));
            break;
          case StatusEffect.TOXIC:
            pokemon.damage(Math.max(Math.floor((pokemon.getMaxHp() / 16) * pokemon.status.turnCount), 1));
            break;
        }
        pokemon.updateInfo().then(() => this.end());
      });
    } else
      this.end();
  }
}

export class MessagePhase extends BattlePhase {
  private text: string;
  private callbackDelay: integer;
  private prompt: boolean;
  private promptDelay: integer;

  constructor(scene: BattleScene, text: string, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    super(scene);

    this.text = text;
    this.callbackDelay = callbackDelay;
    this.prompt = prompt;
    this.promptDelay = promptDelay;
  }

  start() {
    super.start();

    if (this.text.indexOf('$') > -1) {
      const pageIndex = this.text.indexOf('$');
      this.scene.unshiftPhase(new MessagePhase(this.scene, this.text.slice(pageIndex + 1), this.callbackDelay, this.prompt, this.promptDelay));
      this.text = this.text.slice(0, pageIndex).trim();
    }

    this.scene.ui.showText(this.text, null, () => this.end(), this.callbackDelay || (this.prompt ? 0 : 1500), this.prompt, this.promptDelay);
  }

  end() {
    if (this.scene.abilityBar.shown)
      this.scene.abilityBar.hide();

    super.end();
  }
}

export class DamagePhase extends PokemonPhase {
  private damageResult: DamageResult;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, damageResult?: DamageResult) {
    super(scene, battlerIndex);

    this.damageResult = damageResult || HitResult.EFFECTIVE;
  }

  start() {
    super.start();

    switch (this.damageResult) {
      case HitResult.EFFECTIVE:
        this.scene.playSound('hit');
        break;
      case HitResult.SUPER_EFFECTIVE:
        this.scene.playSound('hit_strong');
        break;
      case HitResult.NOT_VERY_EFFECTIVE:
        this.scene.playSound('hit_weak');
        break;
    }

    if (this.damageResult !== HitResult.OTHER) {
      const flashTimer = this.scene.time.addEvent({
        delay: 100,
        repeat: 5,
        startAt: 200,
        callback: () => {
          this.getPokemon().getSprite().setVisible(flashTimer.repeatCount % 2 === 0);
          if (!flashTimer.repeatCount)
            this.getPokemon().updateInfo().then(() => this.end());
        }
      });
    } else
      this.getPokemon().updateInfo().then(() => this.end());
  }
}

export class FaintPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    const instantReviveModifier = this.scene.applyModifier(PokemonInstantReviveModifier, this.player, this.getPokemon()) as PokemonInstantReviveModifier;

    if (instantReviveModifier) {
      if (!--instantReviveModifier.stackCount)
        this.scene.removeModifier(instantReviveModifier);
      this.scene.updateModifiers(this.player);
      this.end();
      return;
    }

    this.scene.queueMessage(getPokemonMessage(pokemon, ' fainted!'), null, true);

    if (this.player) {
      const nonFaintedPartyMemberCount = this.scene.getParty().filter(p => !p.isFainted()).length;
      if (!nonFaintedPartyMemberCount)
        this.scene.unshiftPhase(new GameOverPhase(this.scene));
      else if (nonFaintedPartyMemberCount >= this.scene.currentBattle.getBattlerCount())
        this.scene.unshiftPhase(new SwitchPhase(this.scene, this.fieldIndex, true, false));
      else if (nonFaintedPartyMemberCount === 1 && this.scene.currentBattle.double)
        this.scene.unshiftPhase(new ToggleDoublePositionPhase(this.scene, true));
    } else {
      this.scene.unshiftPhase(new VictoryPhase(this.scene, this.battlerIndex));
      if (this.scene.currentBattle.battleType === BattleType.TRAINER) {
        const nonFaintedPartyMemberCount = this.scene.getParty().filter(p => !p.isFainted()).length;
        if (nonFaintedPartyMemberCount >= this.scene.currentBattle.getBattlerCount())
          this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, this.fieldIndex, this.scene.currentBattle.trainer.getNextSummonIndex(), false, false, false));
      }
    }

    pokemon.lapseTags(BattlerTagLapseType.FAINT);
    this.scene.getField().filter(p => p !== pokemon && p?.isActive(true)).forEach(p => p.removeTagsBySourceId(pokemon.id));

    pokemon.faintCry(() => {
      pokemon.hideInfo();
      this.scene.playSound('faint');
      this.scene.tweens.add({
        targets: pokemon,
        duration: 500,
        y: pokemon.y + 150,
        ease: 'Sine.easeIn',
        onComplete: () => {
          pokemon.setVisible(false);
          pokemon.y -= 150;
          pokemon.trySetStatus(StatusEffect.FAINT);
          if (pokemon.isPlayer())
            this.scene.currentBattle.removeFaintedParticipant(pokemon as PlayerPokemon);
          this.scene.field.remove(pokemon);
          this.end();
        }
      });
    });
  }
}

export class VictoryPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    const participantIds = this.scene.currentBattle.playerParticipantIds;
    const party = this.scene.getParty();
    const expShareModifier = this.scene.findModifier(m => m instanceof ExpShareModifier) as ExpShareModifier;
    const expBalanceModifier = this.scene.findModifier(m => m instanceof ExpBalanceModifier) as ExpBalanceModifier;
    const multipleParticipantExpBonusModifier = this.scene.findModifier(m => m instanceof MultipleParticipantExpBonusModifier) as MultipleParticipantExpBonusModifier;
    const expPartyMembers = party.filter(p => p.hp && p.level < this.scene.getMaxExpLevel());
    const partyMemberExp = [];
    let expValue = this.getPokemon().getExpValue();
    if (this.scene.currentBattle.battleType === BattleType.TRAINER)
      expValue = Math.floor(expValue * 1.5);
    for (let partyMember of expPartyMembers) {
      const pId = partyMember.id;
      const participated = participantIds.has(pId);
      if (participated)
        partyMember.winCount++;
      else if (!expShareModifier) {
        partyMemberExp.push(0);
        continue;
      }
      let expMultiplier = 0;
      if (participated)
        expMultiplier += (1 / participantIds.size);
      if (participantIds.size > 1 && multipleParticipantExpBonusModifier)
        expMultiplier += (multipleParticipantExpBonusModifier.getStackCount() * 0.1);
      if (expShareModifier)
        expMultiplier += expShareModifier.getStackCount() * 0.1;
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

      const recipientExpPartyMemberIndexes = [];
      expPartyMembers.forEach((expPartyMember, epm) => {
        if (expPartyMember.level <= medianLevel)
          recipientExpPartyMemberIndexes.push(epm);
      });

      const splitExp = Math.floor(totalExp / recipientExpPartyMemberIndexes.length);

      expPartyMembers.forEach((_partyMember, pm) => {
        partyMemberExp[pm] = recipientExpPartyMemberIndexes.indexOf(pm) > -1 ? splitExp : 0;
      });
    }

    for (let pm = 0; pm < expPartyMembers.length; pm++) {
      const exp = partyMemberExp[pm];

      if (exp) {
        const partyMemberIndex = party.indexOf(expPartyMembers[pm]);
        this.scene.unshiftPhase(expPartyMembers[pm].isOnField() ? new ExpPhase(this.scene, partyMemberIndex, exp) : new ShowPartyExpBarPhase(this.scene, partyMemberIndex, exp));
      }
    }

    if (!this.scene.getEnemyParty().filter(p => !p?.isFainted(true)).length) {
      this.scene.pushPhase(new BattleEndPhase(this.scene));
      if (this.scene.currentBattle.battleType === BattleType.TRAINER)
        this.scene.pushPhase(new TrainerVictoryPhase(this.scene));
      if (this.scene.gameMode === GameMode.ENDLESS || this.scene.currentBattle.waveIndex < this.scene.finalWave) {
        this.scene.pushPhase(new SelectModifierPhase(this.scene));
        this.scene.pushPhase(new NewBattlePhase(this.scene));
      } else
        this.scene.pushPhase(new GameOverPhase(this.scene, true));
    }

    this.end();
  }
}

export class TrainerVictoryPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    this.scene.playBgm(this.scene.currentBattle.trainer.config.victoryBgm);

    const modifierRewardFuncs = this.scene.currentBattle.trainer.config.modifierRewardFuncs;
    for (let modifierRewardFunc of modifierRewardFuncs)
      this.scene.unshiftPhase(new ModifierRewardPhase(this.scene, modifierRewardFunc()));

    this.scene.ui.showText(`You defeated\n${this.scene.currentBattle.trainer.getName()}!`, null, () => {
      const defeatMessages = this.scene.currentBattle.trainer.config.victoryMessages;
      let showMessageAndEnd = () => this.end();//this.scene.ui.showText(`You got ₽0\nfor winning!`, null, () => this.end(), null, true);
      if (defeatMessages.length) {
        let message: string;
        this.scene.executeWithSeedOffset(() => message = Phaser.Math.RND.pick(this.scene.currentBattle.trainer.config.victoryMessages), this.scene.currentBattle.waveIndex);
        const messagePages = message.split(/\$/g).map(m => m.trim());
      
        for (let p = messagePages.length - 1; p >= 0; p--) {
          const originalFunc = showMessageAndEnd;
          showMessageAndEnd = () => this.scene.ui.showDialogue(messagePages[p], this.scene.currentBattle.trainer.getName(), null, originalFunc, null, true);
        }
      }
      showMessageAndEnd();
    }, null, true);

    this.scene.tweens.add({
      targets: this.scene.currentBattle.trainer,
      x: '-=16',
      y: '+=16',
      alpha: 1,
      ease: 'Sine.easeInOut',
      duration: 750
    });
  }
}

export class ModifierRewardPhase extends BattlePhase {
  private modifierType: ModifierType;

  constructor(scene: BattleScene, modifierType: ModifierType) {
    super(scene);

    this.modifierType = modifierType;
  }

  start() {
    super.start();

    const newModifier = this.modifierType.newModifier();

    this.scene.addModifier(newModifier, true).then(() => this.scene.ui.showText(`You received\n${newModifier.type.name}!`, null, () => this.end(), null, true));
  }
}

export class GameOverPhase extends BattlePhase {
  private victory: boolean;

  constructor(scene: BattleScene, victory?: boolean) {
    super(scene);

    this.victory = !!victory;
  }

  start() {
    super.start();

    this.scene.gameData.clearSession();

    this.scene.time.delayedCall(1000, () => {
      const fadeDuration = this.victory ? 10000 : 5000;
      this.scene.fadeOutBgm(fadeDuration, true);
      this.scene.ui.fadeOut(fadeDuration).then(() => {
        this.scene.clearPhaseQueue();
        this.scene.ui.clearText();
        this.scene.reset();
        this.scene.newBattle();
        this.end();
      });
    });
  }

  end(): void {
    if (this.victory) {
      if (!this.scene.gameData.unlocks[Unlockables.ENDLESS_MODE])
        this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.ENDLESS_MODE));
      if (!this.scene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE])
        this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.MINI_BLACK_HOLE));
    }

    super.end();
  }
}

export class UnlockPhase extends BattlePhase {
  private unlockable: Unlockables;

  constructor(scene: BattleScene, unlockable: Unlockables) {
    super(scene);

    this.unlockable = unlockable;
  }

  start(): void {
    this.scene.time.delayedCall(2000, () => {
      this.scene.gameData.unlocks[this.unlockable] = true;
      this.scene.gameData.saveSystem();
      this.scene.playSound('level_up_fanfare');
      this.scene.ui.setMode(Mode.MESSAGE);
      this.scene.arenaBg.setVisible(false);
      this.scene.ui.fadeIn(250).then(() => {
        this.scene.ui.showText(`${getUnlockableName(this.unlockable)}\nhas been unlocked.`, null, () => {
          this.scene.time.delayedCall(1500, () => this.scene.arenaBg.setVisible(true));
          this.end();
        }, null, true, 1500);
      });
    });
  }
}

export class SwitchPhase extends BattlePhase {
  protected fieldIndex: integer;
  private isModal: boolean;
  private doReturn: boolean;

  constructor(scene: BattleScene, fieldIndex: integer, isModal: boolean, doReturn: boolean) {
    super(scene);

    this.fieldIndex = fieldIndex;
    this.isModal = isModal;
    this.doReturn = doReturn;
  }

  start() {
    super.start();

    this.scene.ui.setMode(Mode.PARTY, this.isModal ? PartyUiMode.FAINT_SWITCH : PartyUiMode.POST_BATTLE_SWITCH, this.fieldIndex, (slotIndex: integer, option: PartyOption) => {
      if (slotIndex >= this.scene.currentBattle.getBattlerCount() && slotIndex < 6)
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, this.fieldIndex, slotIndex, this.doReturn, option === PartyOption.PASS_BATON));
      this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
    }, PartyUiHandler.FilterNonFainted);
  }
}

export class ExpPhase extends PlayerPartyMemberPokemonPhase {
  private expValue: number;

  constructor(scene: BattleScene, partyMemberIndex: integer, expValue: number) {
    super(scene, partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    let exp = new Utils.NumberHolder(this.expValue);
    this.scene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);
    this.scene.ui.showText(`${pokemon.name} gained\n${exp.value} EXP. Points!`, null, () => {
      const lastLevel = pokemon.level;
      let newLevel: integer;
      pokemon.addExp(exp.value);
      newLevel = pokemon.level;
      if (newLevel > lastLevel)
        this.scene.unshiftPhase(new LevelUpPhase(this.scene, this.partyMemberIndex, lastLevel, newLevel));
      pokemon.updateInfo().then(() => this.end());
    }, null, true);
  }
}

export class ShowPartyExpBarPhase extends PlayerPartyMemberPokemonPhase {
  private expValue: number;

  constructor(scene: BattleScene, partyMemberIndex: integer, expValue: number) {
    super(scene, partyMemberIndex);

    this.expValue = expValue;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    let exp = new Utils.NumberHolder(this.expValue);
    this.scene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);

    const lastLevel = pokemon.level;
    let newLevel: integer;
    pokemon.addExp(exp.value);
    newLevel = pokemon.level;
    if (newLevel > lastLevel)
      this.scene.unshiftPhase(new LevelUpPhase(this.scene, this.partyMemberIndex, lastLevel, newLevel));
    this.scene.unshiftPhase(new HidePartyExpBarPhase(this.scene));
    pokemon.updateInfo();

    this.scene.partyExpBar.showPokemonExp(pokemon, exp.value).then(() => {
      if (newLevel > lastLevel)
        this.end();
      else
        setTimeout(() => this.end(), 500);
    });
  }
}

export class HidePartyExpBarPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.partyExpBar.hide().then(() => this.end());
  }
}

export class LevelUpPhase extends PlayerPartyMemberPokemonPhase {
  private lastLevel: integer;
  private level: integer;

  constructor(scene: BattleScene, partyMemberIndex: integer, lastLevel: integer, level: integer) {
    super(scene, partyMemberIndex);

    this.lastLevel = lastLevel;
    this.level = level;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const prevStats = pokemon.stats.slice(0);
    pokemon.calculateStats();
    pokemon.updateInfo();
    this.scene.playSoundWithoutBgm('level_up_fanfare', 1500);
    this.scene.ui.showText(`${this.getPokemon().name} grew to\nLv. ${this.level}!`, null, () => this.scene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false, () => this.end()), null, true);
    if (this.level <= 100) {
      const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
      for (let lm of levelMoves)
        this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, lm));
    }
    const evolution = pokemon.getEvolution();
    if (evolution)
      this.scene.unshiftPhase(new EvolutionPhase(this.scene, this.partyMemberIndex, evolution, this.lastLevel));
  }
}

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
      this.end();
      return;
    }

    const emptyMoveIndex = pokemon.getMoveset().length < 4
      ? pokemon.getMoveset().length
      : pokemon.getMoveset().findIndex(m => m === null);

    const messageMode = this.scene.ui.getHandler() instanceof EvolutionSceneHandler
      ? Mode.EVOLUTION_SCENE
      : Mode.MESSAGE;

    if (emptyMoveIndex > -1) {
      pokemon.setMove(emptyMoveIndex, this.moveId);
      initMoveAnim(this.moveId).then(() => {
        loadMoveAnimAssets(this.scene, [ this.moveId ], true)
          .then(() => {
            this.scene.ui.setMode(messageMode).then(() => {
              this.scene.playSoundWithoutBgm('level_up_fanfare', 1500);
              this.scene.ui.showText(`${pokemon.name} learned\n${move.name}!`, null, () => this.end(), messageMode === Mode.EVOLUTION_SCENE ? 1000 : null, true);
            });
          });
        });
    } else {
      this.scene.ui.setMode(messageMode).then(() => {
        this.scene.ui.showText(`${pokemon.name} wants to learn the\nmove ${move.name}.`, null, () => {
          this.scene.ui.showText(`However, ${pokemon.name} already\nknows four moves.`, null, () => {
            this.scene.ui.showText(`Should a move be deleted and\nreplaced with ${move.name}?`, null, () => {
              const noHandler = () => {
                this.scene.ui.setMode(messageMode).then(() => {
                  this.scene.ui.showText(`Stop trying to teach\n${move.name}?`, null, () => {
                    this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
                      this.scene.ui.setMode(messageMode);
                      this.scene.ui.showText(`${pokemon.name} did not learn the\nmove ${move.name}.`, null, () => this.end(), null, true);
                    }, () => {
                      this.scene.ui.setMode(messageMode);
                      this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, this.moveId));
                      this.end();
                    });
                  });
                });
              };
              this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
                this.scene.ui.setMode(messageMode);
                this.scene.ui.showText('Which move should be forgotten?', null, () => {
                  this.scene.ui.setModeWithoutClear(Mode.SUMMARY, this.getPokemon(), SummaryUiMode.LEARN_MOVE, move, (moveIndex: integer) => {
                    if (moveIndex === 4) {
                      noHandler();
                      return;
                    }
                    this.scene.ui.setMode(messageMode).then(() => {
                      this.scene.ui.showText('@d{32}1, @d{15}2, and@d{15}… @d{15}… @d{15}… @d{15}@s{pb_bounce_1}Poof!', null, () => {
                        this.scene.ui.showText(`${pokemon.name} forgot how to\nuse ${pokemon.moveset[moveIndex].getName()}.`, null, () => {
                          this.scene.ui.showText('And…', null, () => {
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
      });
    }
  }
}

export class BerryPhase extends CommonAnimPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex, undefined, CommonAnim.USE_ITEM);
  }

  start() {
    let berryModifier: BerryModifier;

    if ((berryModifier = this.scene.applyModifier(BerryModifier, this.player, this.getPokemon()) as BerryModifier)) {
      if (berryModifier.consumed) {
        if (!--berryModifier.stackCount)
          this.scene.removeModifier(berryModifier);
        else
          berryModifier.consumed = false;
        this.scene.updateModifiers(this.player);
      }
      super.start();
      return;
    }

    this.end();
  }
}

export class PokemonHealPhase extends CommonAnimPhase {
  private hpHealed: integer;
  private message: string;
  private showFullHpMessage: boolean;
  private skipAnim: boolean;
  private revive: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, hpHealed: integer, message: string, showFullHpMessage: boolean, skipAnim?: boolean, revive?: boolean) {
    super(scene, battlerIndex, undefined, CommonAnim.HEALTH_UP);

    this.hpHealed = hpHealed;
    this.message = message;
    this.showFullHpMessage = showFullHpMessage;
    this.skipAnim = !!skipAnim;
    this.revive = !!revive;
  }

  start() {
    if (!this.skipAnim && (this.revive || this.getPokemon().hp) && this.getPokemon().getHpRatio() < 1)
      super.start();
    else
      this.end();
  }

  end() {
    const pokemon = this.getPokemon();
    
    if (!pokemon.isOnField() || (!this.revive && !pokemon.isActive())) {
      super.end();
      return;
    }

    const fullHp = pokemon.getHpRatio() >= 1;

    if (!fullHp) {
      const hpRestoreMultiplier = new Utils.IntegerHolder(1);
      if (!this.revive)
        this.scene.applyModifiers(HealingBoosterModifier, this.player, hpRestoreMultiplier);
      pokemon.hp = Math.min(pokemon.hp + this.hpHealed * hpRestoreMultiplier.value, pokemon.getMaxHp());
      pokemon.updateInfo().then(() => super.end());
    } else if (this.showFullHpMessage)
      this.message = getPokemonMessage(pokemon, `'s\nHP is full!`);

    if (this.message)
      this.scene.queueMessage(this.message);

    if (fullHp)
      super.end();
  }
}

export class AttemptCapturePhase extends PokemonPhase {
  private pokeballType: PokeballType;
  private pokeball: Phaser.GameObjects.Sprite;
  private originalY: number;

  constructor(scene: BattleScene, targetIndex: integer, pokeballType: PokeballType) {
    super(scene, BattlerIndex.ENEMY + targetIndex);

    this.pokeballType = pokeballType;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (!pokemon?.hp) {
      this.end();
      return;
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
    this.pokeball = this.scene.add.sprite(16, 80, 'pb', pokeballAtlasKey);
    this.pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(this.pokeball);

    this.scene.playSound('pb_throw');
    this.scene.time.delayedCall(300, () => {
      this.scene.field.moveBelow(this.pokeball as Phaser.GameObjects.GameObject, pokemon);
    });
    this.scene.tweens.add({
      targets: this.pokeball,
      x: { value: 236 + fpOffset[0], ease: 'Linear' },
      y: { value: 16 + fpOffset[1], ease: 'Cubic.easeOut' },
      duration: 500,
      onComplete: () => {
        this.pokeball.setTexture('pb', `${pokeballAtlasKey}_opening`);
        this.scene.time.delayedCall(17, () => this.pokeball.setTexture('pb', `${pokeballAtlasKey}_open`));
        this.scene.playSound('pb_rel');
        pokemon.tint(getPokeballTintColor(this.pokeballType));
        this.scene.tweens.add({
          targets: pokemon,
          duration: 250,
          ease: 'Sine.easeIn',
          scale: 0.25,
          y: 20,
          onComplete: () => {
            this.pokeball.setTexture('pb', `${pokeballAtlasKey}_opening`);
            pokemon.setVisible(false);
            this.scene.playSound('pb_catch');
            this.scene.time.delayedCall(17, () => this.pokeball.setTexture('pb', `${pokeballAtlasKey}`));

            const doShake = pokeballMultiplier > -1 ? () => {
              let shakeCount = 0;
              const pbX = this.pokeball.x;
              const shakeCounter = this.scene.tweens.addCounter({
                from: 0,
                to: 1,
                repeat: 4,
                yoyo: true,
                ease: 'Cubic.easeOut',
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
                    if (Utils.randInt(65536) < y)
                      this.scene.playSound('pb_move');
                    else {
                      shakeCounter.stop();
                      this.failCatch(shakeCount);
                    }
                  } else
                    this.scene.playSound('pb_lock')
                },
                onComplete: () => this.catch()
              });
            } : () => this.catch();

            this.scene.time.delayedCall(250, () => doPokeballBounceAnim(this.scene, this.pokeball, 16, 72, 350, doShake));
          }
        });
      }
    });
  }

  failCatch(shakeCount: integer) {
    const pokemon = this.getPokemon();

    this.scene.playSound('pb_rel');
    pokemon.setY(this.originalY);
    pokemon.cry();
    pokemon.tint(getPokeballTintColor(this.pokeballType));
    pokemon.setVisible(true);
    pokemon.untint(250, 'Sine.easeOut');

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball.setTexture('pb', `${pokeballAtlasKey}_opening`);
    this.scene.time.delayedCall(17, () => this.pokeball.setTexture('pb', `${pokeballAtlasKey}_open`));

    this.scene.tweens.add({
      targets: pokemon,
      duration: 250,
      ease: 'Sine.easeOut',
      scale: 1
    });
    
    this.removePb();
    this.end();
  }

  catch() {
    const pokemon = this.getPokemon() as EnemyPokemon;
    this.scene.unshiftPhase(new VictoryPhase(this.scene, this.battlerIndex));
    this.scene.ui.showText(`${pokemon.name} was caught!`, null, () => {
      const end = () => {
        this.removePb();
        this.end();
      };
      const removePokemon = () => {
        this.scene.getPlayerField().filter(p => p.isActive()).forEach(playerPokemon => playerPokemon.removeTagsBySourceId(pokemon.id));
        pokemon.hp = 0;
        pokemon.trySetStatus(StatusEffect.FAINT);
        this.scene.clearEnemyModifiers();
        this.scene.field.remove(pokemon, true);
      };
      const addToParty = () => {
        const newPokemon = pokemon.addToParty();
        const modifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        Promise.all(modifiers.map(m => this.scene.addModifier(m))).then(() => {
          removePokemon();
          if (newPokemon)
            newPokemon.loadAssets().then(end);
          else
            end();
        });
      };
      Promise.all([ pokemon.hideInfo(), this.scene.gameData.setPokemonCaught(pokemon) ]).then(() => {
        if (this.scene.getParty().length === 6) {
          const promptRelease = () => {
            this.scene.ui.showText(`Your party is full.\nRelease a Pokémon to make room for ${pokemon.name}?`, null, () => {
              this.scene.ui.setMode(Mode.CONFIRM, () => {
                this.scene.ui.setMode(Mode.PARTY, PartyUiMode.RELEASE, this.fieldIndex, (slotIndex: integer, _option: PartyOption) => {
                  this.scene.ui.setMode(Mode.MESSAGE).then(() => {
                    if (slotIndex < 6)
                      addToParty();
                    else
                      promptRelease();
                  });
                });
              }, () => {
                this.scene.ui.setMode(Mode.MESSAGE).then(() => {
                  removePokemon();
                  end();
                });
              });
            });
          };
          promptRelease();
        } else
          addToParty();
      });
    }, 0, true);
  }

  removePb() {
    this.scene.tweens.add({
      targets: this.pokeball,
      duration: 250,
      delay: 250,
      ease: 'Sine.easeIn',
      alpha: 0,
      onComplete: () => this.pokeball.destroy()
    });
  }
}

export class AttemptRunPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  start() {
    super.start();

    const playerPokemon = this.getPokemon();
    const enemyField = this.scene.getEnemyField();

    const enemySpeed = enemyField.reduce((total: integer, enemyPokemon: Pokemon) => total + enemyPokemon.stats[Stat.SPD], 0) / enemyField.length;

    const escapeChance = (((playerPokemon.stats[Stat.SPD] * 128) / enemySpeed) + (30 * this.scene.currentBattle.escapeAttempts++)) % 256;

    if (Utils.randInt(256) < escapeChance) {
      this.scene.playSound('flee');
      this.scene.queueMessage('You got away safely!', null, true, 500);
      
      this.scene.tweens.add({
        targets: [ this.scene.arenaEnemy, enemyField ].flat(),
        alpha: 0,
        duration: 250,
        ease: 'Sine.easeIn'
      });

      enemyField.forEach(enemyPokemon => {
        enemyPokemon.hideInfo();
        enemyPokemon.hp = 0;
      });

      this.scene.pushPhase(new BattleEndPhase(this.scene));
      this.scene.pushPhase(new NewBattlePhase(this.scene));
    } else
      this.scene.queueMessage('You can\'t escape!', null, true);

    this.end();
  }
}

export class SelectModifierPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.resetSeed();

    const party = this.scene.getParty();
    regenerateModifierPoolThresholds(party);
    const modifierCount = new Utils.IntegerHolder(3);
    this.scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
    const typeOptions: Array<ModifierTypeOption> = getPlayerModifierTypeOptionsForWave(this.scene.currentBattle.waveIndex, modifierCount.value, party);

    const modifierSelectCallback = (cursor: integer) => {
      if (cursor < 0) {
        this.scene.ui.setMode(Mode.MESSAGE);
        super.end();
        return;
      } else if (cursor >= typeOptions.length) {
        this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.MODIFIER_TRANSFER, -1, (fromSlotIndex: integer, itemIndex: integer, toSlotIndex: integer) => {
          if (toSlotIndex !== undefined && fromSlotIndex < 6 && toSlotIndex < 6 && fromSlotIndex !== toSlotIndex && itemIndex > -1) {
            this.scene.ui.setMode(Mode.MODIFIER_SELECT).then(() => {
              const itemModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
                && (m as PokemonHeldItemModifier).getTransferrable(true) && (m as PokemonHeldItemModifier).pokemonId === party[fromSlotIndex].id) as PokemonHeldItemModifier[];
              const itemModifier = itemModifiers[itemIndex];
              this.scene.tryTransferHeldItemModifier(itemModifier, party[toSlotIndex], true, true).then(success => {
                if (success) {
                  this.scene.ui.clearText();
                  this.scene.ui.setMode(Mode.MESSAGE);
                  super.end();
                } else
                  this.scene.ui.setMode(Mode.MODIFIER_SELECT, typeOptions, modifierSelectCallback);
              });
            });
          } else
            this.scene.ui.setMode(Mode.MODIFIER_SELECT, typeOptions, modifierSelectCallback);
        }, PartyUiHandler.FilterItemMaxStacks);
        return;
      }

      const modifierType = typeOptions[cursor].type;
      if (modifierType instanceof PokemonModifierType) {
        const pokemonModifierType = modifierType as PokemonModifierType;
        const isMoveModifier = modifierType instanceof PokemonMoveModifierType;
        const isTmModifier = modifierType instanceof TmModifierType;
        const partyUiMode = isMoveModifier ? PartyUiMode.MOVE_MODIFIER
          : isTmModifier ? PartyUiMode.TM_MODIFIER : PartyUiMode.MODIFIER;
        const tmMoveId = isTmModifier
          ? (modifierType as TmModifierType).moveId
          : undefined;
        this.scene.ui.setModeWithoutClear(Mode.PARTY, partyUiMode, -1, (slotIndex: integer, option: PartyOption) => {
          if (slotIndex < 6) {
            this.scene.ui.setMode(Mode.MODIFIER_SELECT).then(() => {
              const modifierType = typeOptions[cursor].type;
              const modifier = !isMoveModifier
                ? modifierType.newModifier(party[slotIndex])
                : modifierType.newModifier(party[slotIndex], option - PartyOption.MOVE_1);
              this.scene.ui.clearText();
              this.scene.ui.setMode(Mode.MESSAGE);
              this.scene.addModifier(modifier, true).then(() => super.end());
            });
          } else
            this.scene.ui.setMode(Mode.MODIFIER_SELECT, typeOptions, modifierSelectCallback);
        }, pokemonModifierType.selectFilter, modifierType instanceof PokemonMoveModifierType ? (modifierType as PokemonMoveModifierType).moveSelectFilter : undefined, tmMoveId);
      } else {
        this.scene.addModifier(typeOptions[cursor].type.newModifier(), true).then(() => super.end());
        this.scene.ui.clearText();
        this.scene.ui.setMode(Mode.MESSAGE);
      }
    };
    this.scene.ui.setMode(Mode.MODIFIER_SELECT, typeOptions, modifierSelectCallback);
  }
}

export class PartyHealPhase extends BattlePhase {
  private resumeBgm: boolean;

  constructor(scene: BattleScene, resumeBgm: boolean) {
    super(scene);

    this.resumeBgm = resumeBgm;
  }

  start() {
    super.start();

    const bgmPlaying = this.scene.isBgmPlaying();
    if (bgmPlaying)
      this.scene.fadeOutBgm(1000, false);
    this.scene.ui.fadeOut(1000).then(() => {
      for (let pokemon of this.scene.getParty()) {
        pokemon.hp = pokemon.getMaxHp();
        pokemon.resetStatus();
        for (let move of pokemon.moveset)
          move.ppUsed = 0;
        pokemon.updateInfo(true);
      }
      const healSong = this.scene.sound.add('heal');
      healSong.play({ volume: this.scene.gameVolume });
      this.scene.time.delayedCall(healSong.totalDuration * 1000, () => {
        healSong.destroy();
        if (this.resumeBgm && bgmPlaying)
          this.scene.playBgm();
        this.scene.ui.fadeIn(500).then(() => this.end());
      });
    });
  }
}

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

export class TestMessagePhase extends MessagePhase {
  constructor(scene: BattleScene, message: string) {
    super(scene, message, null, true);
  }
}