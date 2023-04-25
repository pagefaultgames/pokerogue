import BattleScene, { startingLevel, startingWave } from "./battle-scene";
import { default as Pokemon, PlayerPokemon, EnemyPokemon, PokemonMove, MoveResult, DamageResult } from "./pokemon";
import * as Utils from './utils';
import { allMoves, applyMoveAttrs, BypassSleepAttr, ChargeAttr, HitsTagAttr, MissEffectAttr, MoveCategory, MoveEffectAttr, MoveFlags, MoveHitEffectAttr, Moves, MultiHitAttr, OverrideMoveEffectAttr, VariableAccuracyAttr } from "./data/move";
import { Mode } from './ui/ui';
import { Command } from "./ui/command-ui-handler";
import { Stat } from "./data/pokemon-stat";
import { BerryModifier, ExpBalanceModifier, ExpBoosterModifier, ExpShareModifier, ExtraModifierModifier, FlinchChanceModifier, HealingBoosterModifier, HeldItemTransferModifier, HitHealModifier, PokemonExpBoosterModifier, PokemonHeldItemModifier, TempBattleStatBoosterModifier, TurnHealModifier } from "./modifier/modifier";
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
import { ModifierTypeOption, PokemonModifierType, PokemonMoveModifierType, getPlayerModifierTypeOptionsForWave, regenerateModifierPoolThresholds } from "./modifier/modifier-type";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { BattlerTagLapseType, BattlerTagType, HideSpriteTag as HiddenTag, TrappedTag as TrapTag } from "./data/battler-tag";
import { getPokemonMessage } from "./messages";
import { Starter } from "./ui/starter-select-ui-handler";
import { Gender } from "./data/gender";
import { Weather, WeatherType, getRandomWeatherType, getWeatherDamageMessage, getWeatherLapseMessage } from "./data/weather";
import { TempBattleStat } from "./data/temp-battle-stat";
import { ArenaTrapTag, TrickRoomTag } from "./data/arena-tag";

export class SelectStarterPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.sound.play('menu', { loop: true });

    this.scene.ui.setMode(Mode.STARTER_SELECT, (starters: Starter[]) => {
      const party = this.scene.getParty();
      const loadPokemonAssets: Promise<void>[] = [];
      for (let starter of starters) {
        const starterGender = starter.species.malePercent !== null
          ? !starter.female ? Gender.MALE : Gender.FEMALE
          : Gender.GENDERLESS;
        const starterPokemon = new PlayerPokemon(this.scene, starter.species, startingLevel, 0, starter.formIndex, starterGender, starter.shiny);
        starterPokemon.setVisible(false);
        party.push(starterPokemon);
        loadPokemonAssets.push(starterPokemon.loadAssets());
      }
      Promise.all(loadPokemonAssets).then(() => {
        this.scene.ui.clearText();
        this.scene.ui.setMode(Mode.MESSAGE).then(() => {
          SoundFade.fadeOut(this.scene.sound.get('menu'), 500, true);
          this.scene.time.delayedCall(500, () => this.scene.arena.playBgm());
          this.end();
        });
      });
    });
  }
}

export class EncounterPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.updateWaveCountText();

    const battle = this.scene.currentBattle;
    const enemySpecies = this.scene.arena.randomSpecies(battle.waveIndex, battle.enemyLevel);
		battle.enemyPokemon = new EnemyPokemon(this.scene, enemySpecies, battle.enemyLevel);
    const enemyPokemon = this.scene.getEnemyPokemon();
    enemyPokemon.resetSummonData();

    this.scene.gameData.setPokemonSeen(enemyPokemon);

    console.log(enemyPokemon.species.name, enemyPokemon.species.speciesId, enemyPokemon.stats);

    enemyPokemon.loadAssets().then(() => {
      this.scene.field.add(enemyPokemon);
      if (this.scene.getPlayerPokemon().visible)
        this.scene.field.moveBelow(enemyPokemon, this.scene.getPlayerPokemon());
      enemyPokemon.tint(0, 0.5);

      regenerateModifierPoolThresholds(this.scene.getEnemyParty(), false);
      this.scene.generateEnemyModifiers();

      this.scene.ui.setMode(Mode.MESSAGE).then(() => this.doEncounter());
    });
  }

  doEncounter() {
    if (startingWave > 10 && startingLevel < 100) {
      for (let m = 0; m < Math.floor(startingWave / 10); m++)
        this.scene.addModifier(getPlayerModifierTypeOptionsForWave((m + 1) * 10, 1, this.scene.getParty())[0].type.newModifier());
    }

    this.scene.arena.trySetWeather(getRandomWeatherType(this.scene.arena.biomeType), false);

    const enemyPokemon = this.scene.getEnemyPokemon();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, enemyPokemon, this.scene.arenaPlayer, this.scene.trainer ],
      x: (_target, _key, value, targetIndex: integer) => targetIndex < 2 ? value + 300 : value - 300,
      duration: 2000,
      onComplete: () => {
        enemyPokemon.untint(100, 'Sine.easeOut');
        enemyPokemon.cry();
        enemyPokemon.showInfo();
        this.scene.ui.showText(`A wild ${enemyPokemon.name} appeared!`, null, () => this.end(), 1500);
      }
    });
  }

  end() {
    if (this.scene.getEnemyPokemon().shiny)
      this.scene.unshiftPhase(new ShinySparklePhase(this.scene, false));

    this.scene.arena.applyTags(ArenaTrapTag, this.scene.getEnemyPokemon());
      
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
    const enemyPokemon = this.scene.getEnemyPokemon();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, this.scene.arenaNextEnemy, enemyPokemon ],
      x: '+=300',
      duration: 2000,
      onComplete: () => {
        this.scene.arenaEnemy.setX(this.scene.arenaNextEnemy.x);
        this.scene.arenaNextEnemy.setX(this.scene.arenaNextEnemy.x - 300);
        enemyPokemon.untint(100, 'Sine.easeOut');
        enemyPokemon.cry();
        enemyPokemon.showInfo();
        this.scene.ui.showText(`A wild ${enemyPokemon.name} appeared!`, null, () => this.end(), 1500);
      }
    });
  }

  end() {
    if (this.scene.getEnemyPokemon().shiny)
      this.scene.unshiftPhase(new ShinySparklePhase(this.scene, false));

    this.scene.unshiftPhase(new CheckSwitchPhase(this.scene));

    super.end();
  }
}

export class NewBiomeEncounterPhase extends NextEncounterPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  doEncounter(): void {
    this.scene.arena.trySetWeather(getRandomWeatherType(this.scene.arena.biomeType), false);

    const enemyPokemon = this.scene.getEnemyPokemon();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, enemyPokemon ],
      x: (_target, _key, value, targetIndex: integer) => targetIndex < 2 ? value + 300 : value - 300,
      duration: 2000,
      onComplete: () => {
        enemyPokemon.untint(100, 'Sine.easeOut');
        enemyPokemon.cry();
        enemyPokemon.showInfo();
        this.scene.ui.showText(`A wild ${enemyPokemon.name} appeared!`, null, () => this.end(), 1500);
      }
    });
  }
}

export class SelectBiomePhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.arena.fadeOutBgm(2000, true);

    const currentBiome = this.scene.arena.biomeType;

    const setNextBiome = (nextBiome: Biome) => {
      this.scene.unshiftPhase(new SwitchBiomePhase(this.scene, nextBiome));
      this.end();
    };

    if (Array.isArray(biomeLinks[currentBiome]))
      this.scene.ui.setMode(Mode.BIOME_SELECT, currentBiome, (biomeIndex: integer) => {
        this.scene.ui.setMode(Mode.MESSAGE);
        setNextBiome((biomeLinks[currentBiome] as Biome[])[biomeIndex]);
      });
    else
      setNextBiome(biomeLinks[currentBiome] as Biome)
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

    this.scene.tweens.add({
      targets: this.scene.arenaEnemy,
      x: '+=300',
      duration: 2000,
      onComplete: () => {
        this.scene.arenaEnemy.setX(this.scene.arenaEnemy.x - 600);

        this.scene.newArena(this.nextBiome);

        const biomeKey = this.scene.arena.getBiomeKey();
        const bgTexture = `${biomeKey}_bg`;
        const playerTexture = `${biomeKey}_a`;
        const enemyTexture = `${biomeKey}_b`;
        this.scene.arenaBgTransition.setTexture(bgTexture)
        this.scene.arenaBgTransition.setAlpha(0);
        this.scene.arenaBgTransition.setVisible(true);
        this.scene.arenaPlayerTransition.setTexture(playerTexture)
        this.scene.arenaPlayerTransition.setAlpha(0);
        this.scene.arenaPlayerTransition.setVisible(true);

        this.scene.time.delayedCall(1000, () => this.scene.arena.playBgm());

        this.scene.tweens.add({
          targets: [ this.scene.arenaBgTransition, this.scene.arenaPlayerTransition ],
          duration: 1000,
          delay: 1000,
          ease: 'Sine.easeInOut',
          alpha: 1,
          onComplete: () => {
            this.scene.arenaBg.setTexture(bgTexture);
            this.scene.arenaPlayer.setTexture(playerTexture);
            this.scene.arenaEnemy.setTexture(enemyTexture);
            this.scene.arenaNextEnemy.setTexture(enemyTexture);
            this.scene.arenaBgTransition.setVisible(false);
            this.scene.arenaPlayerTransition.setVisible(false);

            this.end();
          }
        })
      }
    });
  }
}

export class SummonPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.preSummon();
  }

  preSummon(): void {
    this.scene.ui.showText(`Go! ${this.scene.getPlayerPokemon().name}!`);
    this.scene.trainer.play('trainer_m_pb');
    this.scene.tweens.add({
      targets: this.scene.trainer,
      x: -36,
      duration: 1000
    });
    this.scene.time.delayedCall(750, () => this.summon());
  }

  summon(): void {
    const pokeball = this.scene.add.sprite(36, 80, 'pb', 'pb');
    pokeball.setVisible(false);
    pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(pokeball);

    const playerPokemon = this.scene.getPlayerPokemon();

    pokeball.setVisible(true);
    this.scene.tweens.add({
      targets: pokeball,
      ease: 'Cubic.easeOut',
      duration: 150,
      x: 54,
      y: 70,
      onComplete: () => {
        this.scene.tweens.add({
          targets: pokeball,
          duration: 500,
          angle: 1440,
          x: 100,
          y: 132,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            this.scene.sound.play('pb_rel');
            pokeball.destroy();
            this.scene.add.existing(playerPokemon);
            this.scene.field.add(playerPokemon);
            playerPokemon.showInfo();
            playerPokemon.playAnim();
            playerPokemon.setVisible(true);
            playerPokemon.setScale(0.5);
            playerPokemon.tint(getPokeballTintColor(playerPokemon.pokeball));
            playerPokemon.untint(250, 'Sine.easeIn');
            this.scene.tweens.add({
              targets: playerPokemon,
              duration: 250,
              ease: 'Sine.easeIn',
              scale: 1,
              onComplete: () => {
                playerPokemon.cry();
                playerPokemon.getSprite().clearTint();
                playerPokemon.resetSummonData();
                this.scene.time.delayedCall(1000, () => this.end());
                this.scene.arena.applyTags(ArenaTrapTag, playerPokemon);
              }
            });
          }
        });
      }
    });
  }

  end() {
    if (this.scene.getPlayerPokemon().shiny)
      this.scene.unshiftPhase(new ShinySparklePhase(this.scene, true));

    super.end();
  }
}

export class SwitchSummonPhase extends SummonPhase {
  private slotIndex: integer;
  private doReturn: boolean;

  constructor(scene: BattleScene, slotIndex: integer, doReturn: boolean) {
    super(scene);

    this.slotIndex = slotIndex;
    this.doReturn = doReturn;
  }

  start() {
    super.start();
  }

  preSummon(): void {
    if (!this.doReturn) {
      this.switchAndSummon();
      return;
    }

    const playerPokemon = this.scene.getPlayerPokemon();

    this.scene.getEnemyPokemon()?.removeTagsBySourceId(playerPokemon.id);

    this.scene.ui.showText(`Come back, ${this.scene.getPlayerPokemon().name}!`);
    this.scene.sound.play('pb_rel');
    playerPokemon.hideInfo();
    playerPokemon.tint(getPokeballTintColor(playerPokemon.pokeball), 1, 250, 'Sine.easeIn');
    this.scene.tweens.add({
      targets: playerPokemon,
      duration: 250,
      ease: 'Sine.easeIn',
      scale: 0.5,
      onComplete: () => {
        playerPokemon.setVisible(false);
        this.scene.field.remove(playerPokemon);
        this.scene.time.delayedCall(750, () => this.switchAndSummon());
      }
    });
  }

  switchAndSummon() {
    const party = this.scene.getParty();
    const switchedPokemon = party[this.slotIndex];
    party[this.slotIndex] = this.scene.getPlayerPokemon();
    party[0] = switchedPokemon;
    this.scene.ui.showText(`Go! ${switchedPokemon.name}!`);
    this.summon();
  }
}

export class CheckSwitchPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene)
  }

  start() {
    super.start();

    if (this.scene.field.getAll().indexOf(this.scene.getPlayerPokemon()) === -1) {
      this.scene.unshiftPhase(new SummonMissingPhase(this.scene));
      super.end();
      return;
    }

    if (!this.scene.getParty().slice(1).filter(p => p.hp).length) {
      super.end();
      return;
    }

    if (this.scene.getPlayerPokemon().getTag(BattlerTagType.FRENZY)) {
      super.end();
      return;
    }

    this.scene.ui.showText('Will you switch\nPOKéMON?', null, () => {
      this.scene.ui.setMode(Mode.CONFIRM, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.unshiftPhase(new SwitchPhase(this.scene, false, true));
        this.end();
      }, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.end();
      });
    });
  }
}

export class SummonMissingPhase extends SummonPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  preSummon(): void {
    this.scene.ui.showText(`Go! ${this.scene.getPlayerPokemon().name}!`);
    this.scene.time.delayedCall(250, () => this.summon());
  }
}

export class CommandPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene)
  }

  start() {
    super.start();

    const playerPokemon = this.scene.getPlayerPokemon();

    this.scene.currentBattle.addParticipant(playerPokemon);

    playerPokemon.resetTurnData();
    this.scene.getEnemyPokemon().resetTurnData();

    const moveQueue = playerPokemon.getMoveQueue();

    while (moveQueue.length && moveQueue[0]
      && moveQueue[0].move && (playerPokemon.moveset.find(m => m.moveId === moveQueue[0].move)
      || !playerPokemon.moveset[playerPokemon.moveset.findIndex(m => m.moveId === moveQueue[0].move)].isUsable(moveQueue[0].ignorePP)))
        moveQueue.shift();

    if (moveQueue.length) {
      const queuedMove = moveQueue[0];
      if (!queuedMove.move)
        this.handleCommand(Command.FIGHT, -1);
      else {
        const moveIndex = playerPokemon.moveset.findIndex(m => m.moveId === queuedMove.move);
        if (playerPokemon.moveset[moveIndex].isUsable(queuedMove.ignorePP))
          this.handleCommand(Command.FIGHT, moveIndex);
      }
    } else
      this.scene.ui.setMode(Mode.COMMAND);
  }

  handleCommand(command: Command, cursor: integer): boolean {
    const playerPokemon = this.scene.getPlayerPokemon();
    const enemyPokemon = this.scene.getEnemyPokemon();
    let success: boolean;

    const playerSpeed = playerPokemon.getBattleStat(Stat.SPD);
    const enemySpeed = enemyPokemon.getBattleStat(Stat.SPD);

    let isDelayed = (command: Command, playerMove: PokemonMove, enemyMove: PokemonMove) => {
      switch (command) {
        case Command.FIGHT:
          if (playerMove && enemyMove) {
            const playerMovePriority = playerMove.getMove().priority;
            const enemyMovePriority = enemyMove.getMove().priority;
            if (playerMovePriority !== enemyMovePriority)
              return playerMovePriority < enemyMovePriority;
          }
          break;
        case Command.BALL:
        case Command.POKEMON:
          return false;
        case Command.RUN:
          return true;
      }

      const speedDelayed = new Utils.BooleanHolder(playerSpeed < enemySpeed);
      this.scene.arena.applyTags(TrickRoomTag, speedDelayed);
      
      return speedDelayed.value || (playerSpeed === enemySpeed && Utils.randInt(2) === 1);
    };

    let playerMove: PokemonMove;

    switch (command) {
      case Command.FIGHT:
        if (cursor == -1) {
          this.scene.pushPhase(new PlayerMovePhase(this.scene, playerPokemon, new PokemonMove(Moves.NONE)));
          success = true;
          break;
        }

        if (playerPokemon.trySelectMove(cursor)) {
          playerMove = playerPokemon.moveset[cursor];
          const playerPhase = new PlayerMovePhase(this.scene, playerPokemon, playerMove);
          this.scene.pushPhase(playerPhase);
          success = true;
        } else if (cursor < playerPokemon.moveset.length) {
          const move = playerPokemon.moveset[cursor];
          if (move.isDisabled()) {
            this.scene.ui.setMode(Mode.MESSAGE);
            this.scene.ui.showText(`${move.getName()} is disabled!`, null, () => {
              this.scene.ui.clearText();
              this.scene.ui.setMode(Mode.FIGHT);
            }, null, true);
          }
        }

        break;
      case Command.BALL:
        if (cursor < 4) {
          this.scene.unshiftPhase(new AttemptCapturePhase(this.scene, cursor as PokeballType));
          success = true;
        }
        break;
      case Command.POKEMON:
        const trapTag = playerPokemon.findTag(t => t instanceof TrapTag) as TrapTag;
        if (!trapTag) {
          this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, cursor, true));
          success = true;
        } else
          this.scene.ui.showText(`${this.scene.getPokemonById(trapTag.sourceId).name}'s ${trapTag.getMoveName()}\nprevents switching!`, null, () => {
            this.scene.ui.showText(null, 0);
          }, null, true);
        break;
      case Command.RUN:
        //this.scene.unshiftPhase(new MoveAnimTestPhase(this.scene));
        //success = true;
        break;
    }

    if (success) {
      if (this.scene.arena.weather)
        this.scene.unshiftPhase(new WeatherEffectPhase(this.scene, this.scene.arena.weather, isDelayed(command, null, null)));

      const enemyMove = enemyPokemon.getNextMove();
      const enemyPhase = new EnemyMovePhase(this.scene, enemyPokemon, enemyMove);
      if (isDelayed(command, playerMove, enemyMove))
        this.scene.unshiftPhase(enemyPhase);
      else
        this.scene.pushPhase(enemyPhase);

      const statusEffectPhases: PostTurnStatusEffectPhase[] = [];
      if (playerPokemon.status && playerPokemon.status.isPostTurn())
        statusEffectPhases.push(new PostTurnStatusEffectPhase(this.scene, true));
      if (enemyPokemon.status && enemyPokemon.status.isPostTurn()) {
        const enemyStatusEffectPhase = new PostTurnStatusEffectPhase(this.scene, false);
        if (isDelayed(command, playerMove, enemyMove))
          statusEffectPhases.unshift(enemyStatusEffectPhase);
        else
          statusEffectPhases.push(enemyStatusEffectPhase);
      }
      for (let sef of statusEffectPhases)
        this.scene.pushPhase(sef);

      this.scene.pushPhase(new TurnEndPhase(this.scene));

      this.end();
    }

    return success;
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
  }
}

export class TurnEndPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.currentBattle.incrementTurn();

    const playerPokemon = this.scene.getPlayerPokemon();
    const enemyPokemon = this.scene.getEnemyPokemon();
    
    const handlePokemon = (pokemon: Pokemon) => {
      if (!pokemon || !pokemon.hp)
        return;

      pokemon.lapseTags(BattlerTagLapseType.TURN_END);
      
      const disabledMoves = pokemon.moveset.filter(m => m.isDisabled());
      for (let dm of disabledMoves) {
        if (!--dm.disableTurns)
          this.scene.pushPhase(new MessagePhase(this.scene, `${dm.getName()} is disabled\nno more!`));
      }

      const hasUsableBerry = !!this.scene.findModifier(m => m instanceof BerryModifier && m.shouldApply([ pokemon ]), pokemon.isPlayer());
      if (hasUsableBerry)
        this.scene.pushPhase(new BerryPhase(this.scene, pokemon.isPlayer()));

      this.scene.applyModifiers(TurnHealModifier, pokemon.isPlayer(), pokemon);

      this.scene.applyModifiers(HeldItemTransferModifier, pokemon.isPlayer(), pokemon);

      pokemon.battleSummonData.turnCount++;
    };

    const playerSpeed = playerPokemon?.getBattleStat(Stat.SPD) || 0;
    const enemySpeed = enemyPokemon?.getBattleStat(Stat.SPD) || 0;

    const speedDelayed = new Utils.BooleanHolder(playerSpeed < enemySpeed);
    this.scene.arena.applyTags(TrickRoomTag, speedDelayed);

    const isDelayed = speedDelayed.value || (playerSpeed === enemySpeed && Utils.randInt(2) === 1);

    if (!isDelayed)
      handlePokemon(playerPokemon);
    handlePokemon(enemyPokemon);
    if (isDelayed)
      handlePokemon(playerPokemon);
      
    this.scene.arena.lapseTags();

    if (this.scene.arena.weather && !this.scene.arena.weather.lapse())
      this.scene.arena.trySetWeather(WeatherType.NONE, false);

    this.end();
  }
}

export class BattleEndPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.clearEnemyModifiers();

    const tempBattleStatBoosterModifiers = this.scene.getModifiers(TempBattleStatBoosterModifier) as TempBattleStatBoosterModifier[];
    for (let m of tempBattleStatBoosterModifiers) {
      if (!m.lapse())
        this.scene.removeModifier(m);
    }

    this.scene.updateModifiers().then(() => this.end());
  }
}

export abstract class PokemonPhase extends BattlePhase {
  protected player: boolean;

  constructor(scene: BattleScene, player: boolean) {
    super(scene);

    this.player = player;
  }

  getPokemon() {
    return this.player ? this.scene.getPlayerPokemon() : this.scene.getEnemyPokemon();
  }
}

export abstract class PartyMemberPokemonPhase extends PokemonPhase {
  protected partyMemberIndex: integer;

  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, true);

    this.partyMemberIndex = partyMemberIndex;
  }

  getPokemon() {
    return this.scene.getParty()[this.partyMemberIndex];
  }
}

export class CommonAnimPhase extends PokemonPhase {
  private anim: CommonAnim;

  constructor(scene: BattleScene, player: boolean, anim: CommonAnim) {
    super(scene, player);

    this.anim = anim;
  }

  start() {
    new CommonBattleAnim(this.anim, this.getPokemon(), this.player ? this.scene.getEnemyPokemon() : this.scene.getPlayerPokemon()).play(this.scene, () => {
      this.end();
    });
  }
}

export abstract class MovePhase extends BattlePhase {
  protected pokemon: Pokemon;
  protected move: PokemonMove;
  protected followUp: boolean;
  protected cancelled: boolean;

  constructor(scene: BattleScene, pokemon: Pokemon, move: PokemonMove, followUp?: boolean) {
    super(scene);

    this.pokemon = pokemon;
    this.move = move;
    this.followUp = !!followUp;
    this.cancelled = false;
  }

  abstract getEffectPhase(): MoveEffectPhase;

  canMove(): boolean {
    return !!this.pokemon.hp && this.move.isUsable();
  }

  cancel(): void {
    this.cancelled = true;
  }

  start() {
    super.start();

    console.log(Moves[this.move.moveId]);

    const target = this.pokemon.isPlayer() ? this.scene.getEnemyPokemon() : this.scene.getPlayerPokemon();

    if (!this.followUp && this.canMove())
      this.pokemon.lapseTags(BattlerTagLapseType.MOVE);

    const doMove = () => {
      const moveQueue = this.pokemon.getMoveQueue();

      if (moveQueue.length && moveQueue[0].move === Moves.NONE) {
        moveQueue.shift();
        this.cancel();
      }

      if (this.cancelled) {
        this.pokemon.pushMoveHistory({ move: Moves.NONE, result: MoveResult.FAILED });
        this.end();
        return;
      }

      this.scene.queueMessage(getPokemonMessage(this.pokemon, ` used\n${this.move.getName()}!`), 500);
      if (!moveQueue.length || !moveQueue.shift().ignorePP)
        this.move.ppUsed++;

      let success = this.move.getMove().applyConditions(this.pokemon, target, this.move.getMove());
      if (success && this.scene.arena.isMoveWeatherCancelled(this.move.getMove()))
        success = false;
      if (success)
        this.scene.unshiftPhase(this.getEffectPhase());
      else {
        this.pokemon.pushMoveHistory({ move: this.move.moveId, result: MoveResult.FAILED, virtual: this.move.virtual });
        this.scene.queueMessage('But it failed!');
      }
      
      this.end();
    };

    if (!this.canMove()) {
      if (this.move.isDisabled())
        this.scene.queueMessage(`${this.move.getName()} is disabled!`);
      this.end();
      return;
    }

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
          applyMoveAttrs(BypassSleepAttr, this.pokemon, target, this.move.getMove());
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
        this.scene.unshiftPhase(new CommonAnimPhase(this.scene, this.pokemon.isPlayer(), CommonAnim.POISON + (this.pokemon.status.effect - 1)));
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

  end() {
    if (!this.followUp && this.canMove())
      this.scene.unshiftPhase(new MoveEndPhase(this.scene, this.pokemon.isPlayer()));

    super.end();
  }
}

export class PlayerMovePhase extends MovePhase {
  constructor(scene: BattleScene, pokemon: PlayerPokemon, move: PokemonMove, followUp?: boolean) {
    super(scene, pokemon, move, followUp);
  }

  getEffectPhase(): MoveEffectPhase {
    return new PlayerMoveEffectPhase(this.scene, this.move);
  }
}

export class EnemyMovePhase extends MovePhase {
  constructor(scene: BattleScene, pokemon: EnemyPokemon, move: PokemonMove, followUp?: boolean) {
    super(scene, pokemon, move, followUp);
  }

  getEffectPhase(): MoveEffectPhase {
    return new EnemyMoveEffectPhase(this.scene, this.move);
  }
}

abstract class MoveEffectPhase extends PokemonPhase {
  protected move: PokemonMove;
  
  constructor(scene: BattleScene, player: boolean, move: PokemonMove) {
    super(scene, player);

    this.move = move;
  }

  start() {
    super.start();

    const user = this.getUserPokemon();
    const target = this.getTargetPokemon();

    const overridden = new Utils.BooleanHolder(false);

    applyMoveAttrs(OverrideMoveEffectAttr, user, target, this.move.getMove(), overridden).then(() => {

      if (overridden.value) {
        this.end();
        return;
      }

      user.lapseTags(BattlerTagLapseType.MOVE_EFFECT);

      if (user.turnData.hitsLeft === undefined) {
        const hitCount = new Utils.IntegerHolder(1);
        applyMoveAttrs(MultiHitAttr, user, target, this.move.getMove(), hitCount);
        user.turnData.hitCount = 0;
        user.turnData.hitsLeft = user.turnData.hitsTotal = hitCount.value;
      }

      if (!this.hitCheck()) {
        this.scene.queueMessage(getPokemonMessage(user, '\'s\nattack missed!'));
        user.pushMoveHistory({ move: this.move.moveId, result: MoveResult.MISSED, virtual: this.move.virtual });
        applyMoveAttrs(MissEffectAttr, user, target, this.move.getMove());
        this.end();
        return;
      }

      const isProtected = !this.move.getMove().hasFlag(MoveFlags.IGNORE_PROTECT) && target.lapseTag(BattlerTagType.PROTECTED);
      
      new MoveAnim(this.move.getMove().id as Moves, user, target).play(this.scene, () => {
        const result = !isProtected ? target.apply(user, this.move) : MoveResult.NO_EFFECT;
        ++user.turnData.hitCount;
        user.pushMoveHistory({ move: this.move.moveId, result: result, virtual: this.move.virtual });
        if (result !== MoveResult.NO_EFFECT && result !== MoveResult.FAILED) {
          applyMoveAttrs(MoveEffectAttr, user, target, this.move.getMove());
          if (result < MoveResult.NO_EFFECT) {
            const flinched = new Utils.BooleanHolder(false);
            user.scene.applyModifiers(FlinchChanceModifier, user.isPlayer(), user, flinched);
            if (flinched.value)
              target.addTag(BattlerTagType.FLINCHED, undefined, this.move.moveId, user.id);
          }
          // Charge attribute with charge effect takes all effect attributes and applies them to charge stage, so ignore them if this is present
          if (!isProtected && target.hp && !this.move.getMove().getAttrs(ChargeAttr).filter(ca => (ca as ChargeAttr).chargeEffect).length)
            applyMoveAttrs(MoveHitEffectAttr, user, target, this.move.getMove());
        }
        this.end();
      });
    });
  }

  end() {
    const user = this.getUserPokemon();
    if (--user.turnData.hitsLeft >= 1 && this.getTargetPokemon().hp)
      this.scene.unshiftPhase(this.getNewHitPhase());
    else {
      if (user.turnData.hitsTotal > 1)
        this.scene.queueMessage(`Hit ${user.turnData.hitCount} time(s)!`);
      this.scene.applyModifiers(HitHealModifier, this.player, user);
    }
    
    super.end();
  }

  hitCheck(): boolean {
    if (this.move.getMove().selfTarget)
      return true;

    const hiddenTag = this.getTargetPokemon().getTag(HiddenTag);
    if (hiddenTag) {
      if (!this.move.getMove().getAttrs(HitsTagAttr).filter(hta => (hta as HitsTagAttr).tagType === hiddenTag.tagType).length)
        return false;
    }

    const moveAccuracy = new Utils.NumberHolder(this.move.getMove().accuracy);
    applyMoveAttrs(VariableAccuracyAttr, this.getUserPokemon(), this.getTargetPokemon(), this.move.getMove(), moveAccuracy);

    if (moveAccuracy.value === -1)
      return true;
      
    if (this.move.getMove().category !== MoveCategory.STATUS) {
      const userAccuracyLevel = new Utils.IntegerHolder(this.getUserPokemon().summonData.battleStats[BattleStat.ACC]);
      const targetEvasionLevel = new Utils.IntegerHolder(this.getTargetPokemon().summonData.battleStats[BattleStat.EVA]);
      this.scene.applyModifiers(TempBattleStatBoosterModifier, this.player, TempBattleStat.ACC, userAccuracyLevel);
      const rand = Utils.randInt(100, 1);
      let accuracyMultiplier = 1;
      if (userAccuracyLevel.value !== targetEvasionLevel.value) {
        accuracyMultiplier = userAccuracyLevel.value > targetEvasionLevel.value
          ? (3 + Math.min(userAccuracyLevel.value - targetEvasionLevel.value, 6)) / 3
          : 3 / (3 + Math.min(targetEvasionLevel.value - userAccuracyLevel.value, 6));
      }
      return rand <= this.move.getMove().accuracy * accuracyMultiplier;
    }
    return true;
  }

  abstract getUserPokemon(): Pokemon;

  abstract getTargetPokemon(): Pokemon;

  abstract getNewHitPhase(): MoveEffectPhase;
}

export class PlayerMoveEffectPhase extends MoveEffectPhase {
  constructor(scene: BattleScene, move: PokemonMove) {
    super(scene, true, move);
  }

  getUserPokemon(): Pokemon {
    return this.scene.getPlayerPokemon();
  }

  getTargetPokemon(): Pokemon {
    /*if (this.move.getMove().category === MoveCategory.STATUS)
      return this.getUserPokemon();*/
    return this.scene.getEnemyPokemon();
  }

  getNewHitPhase() {
    return new PlayerMoveEffectPhase(this.scene, this.move);
  }
}

export class EnemyMoveEffectPhase extends MoveEffectPhase {
  constructor(scene: BattleScene, move: PokemonMove) {
    super(scene, false, move);
  }

  getUserPokemon(): Pokemon {
    return this.scene.getEnemyPokemon();
  }

  getTargetPokemon(): Pokemon {
    /*if (this.move.getMove().category === MoveCategory.STATUS)
      return this.getUserPokemon();*/
    return this.scene.getPlayerPokemon();
  }

  getNewHitPhase() {
    return new EnemyMoveEffectPhase(this.scene, this.move);
  }
}

export class MoveEndPhase extends PokemonPhase {
  constructor(scene: BattleScene, player: boolean) {
    super(scene, player);
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
          new MoveAnim(moveId, player ? this.scene.getPlayerPokemon() : this.scene.getEnemyPokemon(),
            player ? this.scene.getEnemyPokemon() : this.scene.getPlayerPokemon()).play(this.scene, () => {
            if (player)
              this.playMoveAnim(moveQueue, false);
            else
              this.playMoveAnim(moveQueue, true);
          });
      });
    });
  }
}

export class StatChangePhase extends PokemonPhase {
  private stats: BattleStat[];
  private levels: integer;

  constructor(scene: BattleScene, player: boolean, stats: BattleStat[], levels: integer) {
    super(scene, player);

    const allStats = Utils.getEnumValues(BattleStat);
    this.stats = stats.map(s => s !== BattleStat.RAND ? s : allStats[Utils.randInt(BattleStat.SPD + 1)]);
    this.levels = levels;
  }

  start() {
    const pokemon = this.getPokemon();
    
    const battleStats = this.getPokemon().summonData.battleStats;
    const relLevels = this.stats.map(stat => (this.levels >= 1 ? Math.min(battleStats[stat] + this.levels, 6) : Math.max(battleStats[stat] + this.levels, -6)) - battleStats[stat]);

    const end = () => {
      const messages = this.getStatChangeMessages(relLevels);
      for (let message of messages)
        this.scene.queueMessage(message);

      for (let stat of this.stats)
        pokemon.summonData.battleStats[stat] = Math.max(Math.min(pokemon.summonData.battleStats[stat] + this.levels, 6), -6);
      
      console.log(pokemon.summonData.battleStats);
      
      this.end();
    };

    if (relLevels.filter(l => l).length) {
      pokemon.enableMask();
      const pokemonMaskSprite = pokemon.maskSprite;

      const statSprite = this.scene.add.tileSprite((this.player ? 106 : 236) * 6, ((this.player ? 148 : 84) + (this.levels >= 1 ? 160 : 0)) * 6, 156, 316, 'battle_stats', this.stats.length > 1 ? 'mix' : BattleStat[this.stats[0]].toLowerCase());
      statSprite.setAlpha(0);
      statSprite.setScale(6);
      statSprite.setOrigin(0.5, 1);

      this.scene.sound.play(`stat_${this.levels >= 1 ? 'up' : 'down'}`);

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

  getStatChangeMessages(relLevels: integer[]): string[] {
    const messages: string[] = [];
    
    for (let s = 0; s < this.stats.length; s++)
      messages.push(getPokemonMessage(this.getPokemon(), `'s ${getBattleStatName(this.stats[s])} ${getBattleStatLevelChangeDescription(Math.abs(relLevels[s]), this.levels >= 1)}!`));
    return messages;
  }
}

export class WeatherEffectPhase extends CommonAnimPhase {
  private weather: Weather;
  private playerDelayed: boolean;

  constructor(scene: BattleScene, weather: Weather, playerDelayed: boolean) {
    super(scene, true, CommonAnim.SUNNY + (weather.weatherType - 1));
    this.weather = weather;
    this.playerDelayed = playerDelayed;
  }

  start() {
    if (this.weather.isDamaging()) {
      const inflictDamage = (pokemon: Pokemon) => {
        this.scene.queueMessage(getWeatherDamageMessage(this.weather.weatherType, pokemon));
        this.scene.unshiftPhase(new DamagePhase(this.scene, pokemon.isPlayer()));
        pokemon.damage(Math.ceil(pokemon.getMaxHp() / 16));
      };

      const playerPokemon = this.scene.getPlayerPokemon();
      const enemyPokemon = this.scene.getEnemyPokemon();

      const playerImmune = !playerPokemon || !!playerPokemon.getTypes().filter(t => this.weather.isTypeDamageImmune(t)).length;
      const enemyImmune = !enemyPokemon || !!enemyPokemon.getTypes().filter(t => this.weather.isTypeDamageImmune(t)).length;

      if (!this.playerDelayed && !playerImmune)
        inflictDamage(playerPokemon);
      if (!enemyImmune)
        inflictDamage(enemyPokemon);
      if (this.playerDelayed && !playerImmune)
        inflictDamage(playerPokemon);
    }

    this.scene.ui.showText(getWeatherLapseMessage(this.weather.weatherType), null, () => super.start());
  }
}

export class ObtainStatusEffectPhase extends PokemonPhase {
  private statusEffect: StatusEffect;
  private cureTurn: integer;
  private sourceText: string;

  constructor(scene: BattleScene, player: boolean, statusEffect: StatusEffect, cureTurn?: integer, sourceText?: string) {
    super(scene, player);

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
            this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, this.player));
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
  constructor(scene: BattleScene, player: boolean) {
    super(scene, player);
  }

  start() {
    const pokemon = this.getPokemon();
    if (pokemon?.hp && pokemon.status && pokemon.status.isPostTurn()) {
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

  constructor(scene: BattleScene, text: string, callbackDelay?: integer, prompt?: boolean) {
    super(scene);

    this.text = text;
    this.callbackDelay = callbackDelay;
    this.prompt = prompt;
  }

  start() {
    super.start();

    this.scene.ui.showText(this.text, null, () => this.end(), this.callbackDelay || (this.prompt ? 0 : 1500), this.prompt);
  }
}

export class DamagePhase extends PokemonPhase {
  private damageResult: DamageResult;

  constructor(scene: BattleScene, player: boolean, damageResult?: DamageResult) {
    super(scene, player);

    this.damageResult = damageResult || MoveResult.EFFECTIVE;
  }

  start() {
    super.start();

    switch (this.damageResult) {
      case MoveResult.EFFECTIVE:
        this.scene.sound.play('hit');
        break;
      case MoveResult.SUPER_EFFECTIVE:
        this.scene.sound.play('hit_strong');
        break;
      case MoveResult.NOT_VERY_EFFECTIVE:
        this.scene.sound.play('hit_weak');
        break;
    }

    if (this.damageResult !== MoveResult.OTHER) {
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
  constructor(scene: BattleScene, player: boolean) {
    super(scene, player);
  }

  start() {
    super.start();

    this.scene.queueMessage(getPokemonMessage(this.getPokemon(), ' fainted!'), null, true);

    if (this.player) {
      this.scene.unshiftPhase(this.scene.getParty().filter(p => p.hp).length ? new SwitchPhase(this.scene, true, false) : new GameOverPhase(this.scene));
    } else
      this.scene.unshiftPhase(new VictoryPhase(this.scene));
      
    const pokemon = this.getPokemon();

    pokemon.lapseTags(BattlerTagLapseType.FAINT);
    if (pokemon.isPlayer())
      this.scene.getEnemyPokemon()?.removeTagsBySourceId(pokemon.id);
    else
      this.scene.getPlayerPokemon()?.removeTagsBySourceId(pokemon.id);

    pokemon.faintCry(() => {
      pokemon.hideInfo();
      this.scene.sound.play('faint');
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
  constructor(scene: BattleScene) {
    super(scene, true);
  }

  start() {
    super.start();

    const participantIds = this.scene.currentBattle.playerParticipantIds;
    const party = this.scene.getParty();
    const expShareModifier = this.scene.findModifier(m => m instanceof ExpShareModifier) as ExpShareModifier;
    const expBalanceModifier = this.scene.findModifier(m => m instanceof ExpBalanceModifier) as ExpBalanceModifier;
    const expValue = this.scene.getEnemyPokemon().getExpValue();
    const expPartyMembers = party.filter(p => p.hp && p.level < 100);
    const partyMemberExp = [];
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
      if (expShareModifier)
        expMultiplier += expShareModifier.stackCount * 0.1;
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
        this.scene.unshiftPhase(new ExpPhase(this.scene, partyMemberIndex, exp));
      }
    }
    
    this.scene.pushPhase(new BattleEndPhase(this.scene));
    this.scene.pushPhase(new SelectModifierPhase(this.scene));
    this.scene.newBattle();

    this.end();
  }
}

export class GameOverPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.time.delayedCall(1000, () => {
      this.scene.fadeOutBgm(5000, true);
      this.scene.ui.fadeOut(5000).then(() => {
        this.scene.clearPhaseQueue();
        this.scene.ui.clearText();
        this.scene.reset();
        this.scene.newBattle();
        this.end();
      });
    });
  }
}

export class SwitchPhase extends BattlePhase {
  private isModal: boolean;
  private doReturn: boolean;

  constructor(scene: BattleScene, isModal: boolean, doReturn: boolean) {
    super(scene);

    this.isModal = isModal;
    this.doReturn = doReturn;
  }

  start() {
    super.start();

    this.scene.ui.setMode(Mode.PARTY, this.isModal ? PartyUiMode.FAINT_SWITCH : PartyUiMode.POST_BATTLE_SWITCH, (slotIndex: integer, _option: PartyOption) => {
      if (slotIndex && slotIndex < 6)
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, slotIndex, this.doReturn));
      this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
    }, PartyUiHandler.FilterNonFainted);
  }
}

export class ExpPhase extends PartyMemberPokemonPhase {
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

export class LevelUpPhase extends PartyMemberPokemonPhase {
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
    this.scene.ui.showText(`${this.getPokemon().name} grew to\nLV. ${this.level}!`, null, () => this.scene.ui.getMessageHandler().promptLevelUpStats(this.partyMemberIndex, prevStats, false, () => this.end()), null, true);
    if (this.level <= 100) {
      const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
      for (let lm of levelMoves)
        this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, lm));
      const evolution = pokemon.getEvolution();
      if (evolution)
        this.scene.unshiftPhase(new EvolutionPhase(this.scene, this.partyMemberIndex, evolution, this.lastLevel));
    }
  }
}

export class LearnMovePhase extends PartyMemberPokemonPhase {
  private moveId: Moves;

  constructor(scene: BattleScene, partyMemberIndex: integer, moveId: Moves) {
    super(scene, partyMemberIndex);

    this.moveId = moveId;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();
    const move = allMoves[this.moveId];

    const existingMoveIndex = pokemon.moveset.findIndex(m => m?.moveId === move.id);

    if (existingMoveIndex > -1) {
      this.end();
      return;
    }

    const emptyMoveIndex = pokemon.moveset.length < 4
      ? pokemon.moveset.length
      : pokemon.moveset.findIndex(m => m === null);

    const messageMode = this.scene.ui.getHandler() instanceof EvolutionSceneHandler
      ? Mode.EVOLUTION_SCENE
      : Mode.MESSAGE;

    if (emptyMoveIndex > -1) {
      pokemon.moveset[emptyMoveIndex] = new PokemonMove(this.moveId, 0, 0);
      initMoveAnim(this.moveId).then(() => {
        loadMoveAnimAssets(this.scene, [ this.moveId ], true)
          .then(() => {
            this.scene.ui.setMode(messageMode).then(() => {
              this.scene.playSoundWithoutBgm('level_up_fanfare', 1500);
              this.scene.ui.showText(`${pokemon.name} learned\n${Utils.toPokemonUpperCase(move.name)}!`, null, () => this.end(), messageMode === Mode.EVOLUTION_SCENE ? 1000 : null, true);
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
                            pokemon.moveset[moveIndex] = null;
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
  constructor(scene: BattleScene, player: boolean) {
    super(scene, player, CommonAnim.USE_ITEM);
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

  constructor(scene: BattleScene, player: boolean, hpHealed: integer, message: string, showFullHpMessage: boolean, skipAnim?: boolean) {
    super(scene, player, CommonAnim.HEALTH_UP);

    this.hpHealed = hpHealed;
    this.message = message;
    this.showFullHpMessage = showFullHpMessage;
    this.skipAnim = !!skipAnim;
  }

  start() {
    if (!this.skipAnim && this.getPokemon().hp && this.getPokemon().getHpRatio() < 1)
      super.start();
    else
      this.end();
  }

  end() {
    const pokemon = this.getPokemon();
    
    if (!this.getPokemon().hp) {
      super.end();
      return;
    }

    const fullHp = pokemon.getHpRatio() >= 1;

    if (!fullHp) {
      const hpRestoreMultiplier = new Utils.IntegerHolder(1);
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

export class AttemptCapturePhase extends BattlePhase {
  private pokeballType: PokeballType;
  private pokeball: Phaser.GameObjects.Sprite;
  private originalY: number;

  constructor(scene: BattleScene, pokeballType: PokeballType) {
    super(scene);

    this.pokeballType = pokeballType;
  }

  start() {
    super.start();

    this.scene.pokeballCounts[this.pokeballType]--;

    const pokemon = this.scene.getEnemyPokemon();
    this.originalY = pokemon.y;

    const _3m = 3 * pokemon.getMaxHp();
    const _2h = 2 * pokemon.hp;
    const catchRate = pokemon.species.catchRate;
    const pokeballMultiplier = getPokeballCatchMultiplier(this.pokeballType);
    const statusMultiplier = pokemon.status ? getStatusEffectCatchRateMultiplier(pokemon.status.effect) : 1;
    const x = Math.round((((_3m - _2h) * catchRate * pokeballMultiplier) / _3m) * statusMultiplier);
    const y = Math.round(65536 / Math.sqrt(Math.sqrt(255 / x)));

    const pokeballAtlasKey = getPokeballAtlasKey(this.pokeballType);
    this.pokeball = this.scene.add.sprite(16, 80, 'pb', pokeballAtlasKey);
    this.pokeball.setOrigin(0.5, 0.625);
    this.scene.field.add(this.pokeball);

    this.scene.sound.play('pb_throw');
    this.scene.time.delayedCall(300, () => {
      this.scene.field.moveBelow(this.pokeball, pokemon);
    });
    this.scene.tweens.add({
      targets: this.pokeball,
      x: { value: 236, ease: 'Linear' },
      y: { value: 16, ease: 'Cubic.easeOut' },
      duration: 500,
      onComplete: () => {
        this.pokeball.setTexture('pb', `${pokeballAtlasKey}_opening`);
        this.scene.time.delayedCall(17, () => this.pokeball.setTexture('pb', `${pokeballAtlasKey}_open`));
        this.scene.sound.play('pb_rel');
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
            this.scene.sound.play('pb_catch');
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
                  if (shakeCount++ < 3) {
                    if (Utils.randInt(65536) < y)
                      this.scene.sound.play('pb_move');
                    else {
                      shakeCounter.stop();
                      this.failCatch(shakeCount);
                    }
                  } else
                    this.scene.sound.play('pb_lock')
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
    const pokemon = this.scene.getEnemyPokemon();

    this.scene.sound.play('pb_rel');
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
    const pokemon = this.scene.getEnemyPokemon();
    this.scene.unshiftPhase(new VictoryPhase(this.scene));
    this.scene.ui.showText(`${pokemon.name} was caught!`, null, () => {
      const end = () => {
        this.removePb();
        this.end();
      };
      const addToParty = () => {
        const newPokemon = pokemon.addToParty();
        const modifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        Promise.all(modifiers.map(m => this.scene.addModifier(m))).then(() => {
          this.scene.getPlayerPokemon().removeTagsBySourceId(pokemon.id);
          pokemon.hp = 0;
          this.scene.clearEnemyModifiers();
          this.scene.field.remove(pokemon, true);
          if (newPokemon)
            newPokemon.loadAssets().then(end);
          else
            end();
        });
      };
      Promise.all([ pokemon.hideInfo(), this.scene.gameData.setPokemonCaught(pokemon) ]).then(() => {
        if (this.scene.getParty().length === 6) {
          const promptRelease = () => {
            this.scene.ui.showText(`Your party is full.\nRelease a POKéMON to make room for ${pokemon.name}?`, null, () => {
              this.scene.ui.setMode(Mode.CONFIRM, () => {
                this.scene.ui.setMode(Mode.PARTY, PartyUiMode.RELEASE, (slotIndex: integer, _option: PartyOption) => {
                  this.scene.ui.setMode(Mode.MESSAGE).then(() => {
                    if (slotIndex < 6)
                      addToParty();
                    else
                      promptRelease();
                  });
                });
              }, () => {
                this.scene.ui.setMode(Mode.MESSAGE);
                pokemon.hp = 0;
                end();
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

export class SelectModifierPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const party = this.scene.getParty();
    regenerateModifierPoolThresholds(party);
    const modifierCount = new Utils.IntegerHolder(3);
    this.scene.applyModifiers(ExtraModifierModifier, true, modifierCount);
    const typeOptions: Array<ModifierTypeOption> = getPlayerModifierTypeOptionsForWave(this.scene.currentBattle.waveIndex - 1, modifierCount.value, party);

    const modifierSelectCallback = (cursor: integer) => {
      if (cursor < 0) {
        this.scene.ui.setMode(Mode.MESSAGE);
        super.end();
        return;
      } else if (cursor >= typeOptions.length) {
        this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.MODIFIER_TRANSFER, (fromSlotIndex: integer, itemIndex: integer, toSlotIndex: integer) => {
          if (toSlotIndex !== undefined && fromSlotIndex < 6 && toSlotIndex < 6 && fromSlotIndex !== toSlotIndex && itemIndex > -1) {
            this.scene.ui.setMode(Mode.MODIFIER_SELECT).then(() => {
              const itemModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
                && (m as PokemonHeldItemModifier).pokemonId === party[fromSlotIndex].id) as PokemonHeldItemModifier[];
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
        this.scene.ui.setModeWithoutClear(Mode.PARTY, !isMoveModifier ? PartyUiMode.MODIFIER : PartyUiMode.MOVE_MODIFIER, (slotIndex: integer, option: PartyOption) => {
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
        }, pokemonModifierType.selectFilter, modifierType instanceof PokemonMoveModifierType ? (modifierType as PokemonMoveModifierType).moveSelectFilter : undefined);
      } else {
        this.scene.addModifier(typeOptions[cursor].type.newModifier(), true).then(() => super.end());
        this.scene.ui.clearText();
        this.scene.ui.setMode(Mode.MESSAGE);
      }
    };
    this.scene.ui.setMode(Mode.MODIFIER_SELECT, typeOptions, modifierSelectCallback);
  }
}

export class ShinySparklePhase extends PokemonPhase {
  constructor(scene: BattleScene, player: boolean) {
    super(scene, player);
  }

  start() {
    super.start();

    this.getPokemon().sparkle();
    this.scene.time.delayedCall(1000, () => this.end());
  }
}