import BattleScene from "./battle-scene";
import { default as Pokemon, PlayerPokemon, EnemyPokemon, PokemonMove } from "./pokemon";
import * as Utils from './utils';
import { allMoves, applyMoveAttrs, MissEffectAttr, MoveCategory, MoveHitEffectAttr, Moves, MultiHitAttr } from "./move";
import { Mode } from './ui/ui';
import { Command } from "./ui/command-ui-handler";
import { Stat } from "./pokemon-stat";
import { ExpBoosterModifier, ExpShareModifier, ExtraModifierModifier } from "./modifier";
import PartyUiHandler, { PartyOption, PartyUiMode } from "./ui/party-ui-handler";
import { doPokeballBounceAnim, getPokeballAtlasKey, getPokeballCatchMultiplier, getPokeballTintColor, PokeballType } from "./pokeball";
import { CommonAnim, CommonBattleAnim, MoveAnim, initMoveAnim, loadMoveAnimAssets } from "./battle-anims";
import { StatusEffect, getStatusEffectActivationText, getStatusEffectHealText, getStatusEffectObtainText, getStatusEffectOverlapText } from "./status-effect";
import { SummaryUiMode } from "./ui/summary-ui-handler";
import EvolutionSceneHandler from "./ui/evolution-scene-handler";
import { EvolutionPhase } from "./evolution-phase";
import { BattlePhase } from "./battle-phase";
import { BattleStat, getBattleStatLevelChangeDescription, getBattleStatName } from "./battle-stat";
import { Biome, biomeLinks } from "./biome";
import { ModifierType, PokemonModifierType, PokemonMoveModifierType, getModifierTypesForWave, regenerateModifierPoolThresholds } from "./modifier-type";

export class SelectStarterPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.ui.setMode(Mode.STARTER_SELECT);
  }
}

export class EncounterPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const battle = this.scene.currentBattle;
    const enemySpecies = this.scene.arena.randomSpecies(1, battle.enemyLevel);
		battle.enemyPokemon = new EnemyPokemon(this.scene, enemySpecies, battle.enemyLevel);
    const enemyPokemon = this.scene.getEnemyPokemon();
    enemyPokemon.resetSummonData();

    console.log(enemyPokemon.species.name, enemyPokemon.species.speciesId, enemyPokemon.stats);

    enemyPokemon.loadAssets().then(() => {
      this.scene.field.add(enemyPokemon);
      if (this.scene.getPlayerPokemon().visible)
        this.scene.field.moveBelow(enemyPokemon, this.scene.getPlayerPokemon());
      enemyPokemon.tint(0, 0.5);

      this.scene.ui.setMode(Mode.MESSAGE).then(() => this.doEncounter());
    });
  }

  doEncounter() {
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

    this.scene.arena.fadeOutBgm(2000);

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

        this.scene.newBiome(this.nextBiome);

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

    this.scene.ui.showText('Will you switch\nPOKéMON?', null, () => {
      this.scene.ui.setMode(Mode.CONFIRM, () => {
        this.scene.unshiftPhase(new SwitchPhase(this.scene, false, true));
        this.end();
      }, () => this.end());
    });
  }
}

export class CommandPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene)
  }

  start() {
    super.start();

    this.scene.ui.setMode(Mode.COMMAND).then(() => {
      this.scene.currentBattle.addParticipant(this.scene.getPlayerPokemon());

      this.scene.getPlayerPokemon().resetTurnData();
      this.scene.getEnemyPokemon().resetTurnData();
    });
  }

  handleCommand(command: Command, cursor: integer): boolean {
    const playerPokemon = this.scene.getPlayerPokemon();
    const enemyPokemon = this.scene.getEnemyPokemon();
    let success: boolean;

    const playerSpeed = playerPokemon.getBattleStat(Stat.SPD);
    const enemySpeed = enemyPokemon.getBattleStat(Stat.SPD);

    const isDelayed = () => playerSpeed < enemySpeed || (playerSpeed === enemySpeed && Utils.randInt(2) === 1);

    switch (command) {
      case Command.FIGHT:
        if (playerPokemon.trySelectMove(cursor)) {
          const playerPhase = new PlayerMovePhase(this.scene, playerPokemon, playerPokemon.moveset[cursor]);
          this.scene.pushPhase(playerPhase);
          success = true;
        }
        break;
      case Command.BALL:
        if (cursor < 4) {
          this.scene.unshiftPhase(new AttemptCapturePhase(this.scene, cursor as PokeballType));
          success = true;
        }
        break;
      case Command.POKEMON:
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, cursor, true));
        success = true;
        break;
    }

    if (success) {
      const enemyMove = enemyPokemon.getNextMove();
      const enemyPhase = new EnemyMovePhase(this.scene, enemyPokemon, enemyMove);
      if (isDelayed())
        this.scene.unshiftPhase(enemyPhase);
      else
        this.scene.pushPhase(enemyPhase);

      const statusEffectPhases: PostTurnStatusEffectPhase[] = [];
      if (playerPokemon.status && playerPokemon.status.isPostTurn())
        statusEffectPhases.push(new PostTurnStatusEffectPhase(this.scene, true));
      if (enemyPokemon.status && enemyPokemon.status.isPostTurn()) {
        const enemyStatusEffectPhase = new PostTurnStatusEffectPhase(this.scene, false);
        if (isDelayed())
          statusEffectPhases.unshift(enemyStatusEffectPhase);
        else
          statusEffectPhases.push(enemyStatusEffectPhase);
      }
      for (let sef of statusEffectPhases)
        this.scene.pushPhase(sef);

      this.end();
    }

    return success;
  }

  end() {
    this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
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

abstract class MovePhase extends BattlePhase {
  protected pokemon: Pokemon;
  protected move: PokemonMove;
  protected cancelled: boolean;

  constructor(scene: BattleScene, pokemon: Pokemon, move: PokemonMove) {
    super(scene);

    this.pokemon = pokemon;
    this.move = move;
    this.cancelled = false;
  }

  abstract getEffectPhase(): MoveEffectPhase;

  canMove(): boolean {
    return !!this.pokemon.hp;
  }

  start() {
    super.start();

    const doMove = () => {
      if (this.cancelled) {
        this.end();
        return;
      }
      if (!this.move)
        console.log(this.pokemon.moveset);
      this.move.ppUsed++;
      this.scene.unshiftPhase(new MessagePhase(this.scene, `${this.pokemon.name} used\n${this.move.getName()}!`, 500));
      this.scene.unshiftPhase(this.getEffectPhase());
      this.end();
    };

    if (!this.canMove()) {
      this.end();
      return;
    }

    if (this.pokemon.status && !this.pokemon.status.isPostTurn()) {
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
          healed = this.pokemon.status.turnCount === this.pokemon.status.cureTurn;
          activated = !healed;
          this.cancelled = activated;
          break;
        case StatusEffect.FREEZE:
          healed = Utils.randInt(5) === 0;
          activated = !healed;
          this.cancelled = activated;
          break;
      }
      if (activated) {
        this.scene.unshiftPhase(new MessagePhase(this.scene,
          `${this.pokemon instanceof PlayerPokemon ? '' : 'Foe '}${this.pokemon.name}${getStatusEffectActivationText(this.pokemon.status.effect)}`));
        new CommonBattleAnim(CommonAnim.POISON + (this.pokemon.status.effect - 1), this.pokemon).play(this.scene, () => doMove());
      } else {
        if (healed) {
          this.scene.unshiftPhase(new MessagePhase(this.scene,
            `${this.pokemon instanceof PlayerPokemon ? '' : 'Foe '}${this.pokemon.name}${getStatusEffectHealText(this.pokemon.status.effect)}`));
          this.pokemon.resetStatus();
          this.pokemon.updateInfo(true);
        }
        doMove();
      }
    } else
      doMove();
  }
}

export class PlayerMovePhase extends MovePhase {
  constructor(scene: BattleScene, pokemon: PlayerPokemon, move: PokemonMove) {
    super(scene, pokemon, move);
  }

  getEffectPhase(): MoveEffectPhase {
    return new PlayerMoveEffectPhase(this.scene, this.move);
  }
}

export class EnemyMovePhase extends MovePhase {
  constructor(scene: BattleScene, pokemon: EnemyPokemon, move: PokemonMove) {
    super(scene, pokemon, move);
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

    if (user.turnData.hitsLeft === undefined) {
      const hitCount = new Utils.IntegerHolder(1);
      applyMoveAttrs(MultiHitAttr, this.scene, user, target, this.move.getMove(), hitCount);
      user.turnData.hitCount = 0;
      user.turnData.hitsLeft = user.turnData.hitsTotal = hitCount.value;
    }

    if (!this.hitCheck()) {
      this.scene.unshiftPhase(new MessagePhase(this.scene, `${!this.player ? 'Foe ' : ''}${user.name}'s\nattack missed!`));
      applyMoveAttrs(MissEffectAttr, this.scene, user, target, this.move.getMove());
      this.end();
      return;
    }

    new MoveAnim(this.move.getMove().id as Moves, user, target).play(this.scene, () => {
      this.getTargetPokemon().apply(this.getUserPokemon(), this.move, () => {
        ++user.turnData.hitCount;
        if (this.getTargetPokemon().hp)
          applyMoveAttrs(MoveHitEffectAttr, this.scene, user, target, this.move.getMove());
        this.end();
      });
      if (this.getUserPokemon().hp <= 0) {
        this.scene.pushPhase(new FaintPhase(this.scene, this.player));
        this.getTargetPokemon().resetBattleSummonData();
      }
      if (this.getTargetPokemon().hp <= 0) {
        this.scene.pushPhase(new FaintPhase(this.scene, !this.player));
        this.getUserPokemon().resetBattleSummonData();
      }
    });
  }

  end() {
    const user = this.getUserPokemon();
    if (--user.turnData.hitsLeft && this.getTargetPokemon().hp)
      this.scene.unshiftPhase(this.getNewHitPhase());
    else if (user.turnData.hitsTotal > 1)
      this.scene.unshiftPhase(new MessagePhase(this.scene, `Hit ${user.turnData.hitCount} time(s)!`));
    
    super.end();
  }

  hitCheck(): boolean {
    if (this.move.getMove().category !== MoveCategory.STATUS) {
      const userAccuracyLevel = this.getUserPokemon().summonData.battleStats[BattleStat.ACC];
      const targetEvasionLevel = this.getTargetPokemon().summonData.battleStats[BattleStat.EVA];
      const rand = Utils.randInt(100, 1);
      let accuracyMultiplier = 1;
      if (userAccuracyLevel !== targetEvasionLevel) {
        accuracyMultiplier = userAccuracyLevel > targetEvasionLevel
          ? (3 + Math.min(userAccuracyLevel - targetEvasionLevel, 6)) / 3
          : 3 / (3 + Math.min(targetEvasionLevel - userAccuracyLevel, 6));
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

export class StatChangePhase extends PokemonPhase {
  private stats: BattleStat[];
  private levels: integer;

  constructor(scene: BattleScene, player: boolean, stats: BattleStat[], levels: integer) {
    super(scene, player);

    this.stats = stats;
    this.levels = levels;
  }

  start() {
    const pokemon = this.getPokemon();
    
    const battleStats = this.getPokemon().summonData.battleStats;
    const relLevels = this.stats.map(stat => (this.levels >= 1 ? Math.min(battleStats[stat] + this.levels, 6) : Math.max(battleStats[stat] + this.levels, -6)) - battleStats[stat]);

    const end = () => {
      const messages = this.getStatChangeMessages(relLevels);
      for (let message of messages)
        this.scene.unshiftPhase(new MessagePhase(this.scene, message));

      for (let stat of this.stats)
        pokemon.summonData.battleStats[stat] = Math.max(Math.min(pokemon.summonData.battleStats[stat] + this.levels, 6), -6);
      
      console.log(pokemon.summonData.battleStats);
      
      this.end();
    };

    if (relLevels.filter(l => l).length) {
      pokemon.enableMask();
      const pokemonMaskSprite = pokemon.maskSprite;

      const statSprite = this.scene.add.tileSprite((this.player ? 106 : 236) * 6, ((this.player ? 148 : 84) + (this.levels >= 1 ? 160 : 0)) * 6, 128, 288, 'battle_stats', this.stats.length > 1 ? 'mix' : BattleStat[this.stats[0]].toLowerCase());
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
      messages.push(`${this.player ? '' : 'Foe '}${this.getPokemon().name}'s ${getBattleStatName(this.stats[s])} ${getBattleStatLevelChangeDescription(Math.abs(relLevels[s]), this.levels >= 1)}!`);
    return messages;
  }
}

export class ObtainStatusEffectPhase extends PokemonPhase {
  private statusEffect: StatusEffect;

  constructor(scene: BattleScene, player: boolean, statusEffect: StatusEffect) {
    super(scene, player);

    this.statusEffect = statusEffect;
  }

  start() {
    const pokemon = this.getPokemon();
    if (!pokemon.status) {
      if (pokemon.trySetStatus(this.statusEffect)) {
        pokemon.updateInfo(true);
        new CommonBattleAnim(CommonAnim.POISON + (this.statusEffect - 1), pokemon).play(this.scene, () => {
          this.scene.unshiftPhase(new MessagePhase(this.scene, `${this.player ? '' : 'Foe '}${pokemon.name}${getStatusEffectObtainText(this.statusEffect)}`));
          if (pokemon.status.isPostTurn())
            this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, this.player));
          this.end();
        });
        return;
      }
    } else if (pokemon.status.effect === this.statusEffect)
      this.scene.unshiftPhase(new MessagePhase(this.scene, `${this.player ? '' : 'Foe '}${pokemon.name}${getStatusEffectOverlapText(this.statusEffect)}`));
    this.end();
  }
}

export class PostTurnStatusEffectPhase extends PokemonPhase {
  constructor(scene: BattleScene, player: boolean) {
    super(scene, player);
  }

  start() {
    const pokemon = this.getPokemon();
    if (pokemon.hp && pokemon.status && pokemon.status.isPostTurn()) {
      pokemon.status.incrementTurn();
      new CommonBattleAnim(CommonAnim.POISON + (pokemon.status.effect - 1), pokemon).play(this.scene, () => {
        this.scene.unshiftPhase(new MessagePhase(this.scene,
            `${pokemon instanceof PlayerPokemon ? '' : 'Foe '}${pokemon.name}${getStatusEffectActivationText(pokemon.status.effect)}`));
        switch (pokemon.status.effect) {
          case StatusEffect.POISON:
          case StatusEffect.BURN:
            pokemon.hp = Math.max(pokemon.hp - Math.max(pokemon.getMaxHp() >> 3, 1), 0);
            break;
          case StatusEffect.TOXIC:
            pokemon.hp = Math.max(pokemon.hp - Math.max(Math.floor((pokemon.getMaxHp() / 16) * pokemon.status.turnCount), 1), 0);
            break;
        }
        if (pokemon.hp <= 0) {
          this.scene.pushPhase(new FaintPhase(this.scene, this.player));
          (this.player ? this.scene.getEnemyPokemon() : this.scene.getPlayerPokemon()).resetBattleSummonData();
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

export class FaintPhase extends PokemonPhase {
  constructor(scene: BattleScene, player: boolean) {
    super(scene, player);
  }

  start() {
    super.start();

    if (this.player) {
      this.scene.unshiftPhase(new MessagePhase(this.scene, `${this.getPokemon().name} fainted!`, null, true));
      this.scene.unshiftPhase(new SwitchPhase(this.scene, true, false));
    } else {
      this.scene.unshiftPhase(new MessagePhase(this.scene, `Foe ${this.getPokemon().name} fainted!`, null, true));
      this.scene.unshiftPhase(new VictoryPhase(this.scene));
    }
      
    const pokemon = this.getPokemon();
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
          if (pokemon instanceof PlayerPokemon)
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
    const expShareModifier = this.scene.getModifier(ExpShareModifier) as ExpShareModifier;
    const expValue = this.scene.getEnemyPokemon().getExpValue(party[0]);
    for (let pm = 0; pm < party.length; pm++) {
      const pokemon = party[pm];
      if (!pokemon.hp)
        continue;
      const pId = pokemon.id;
      const participated = participantIds.has(pId);
      if (!participated && !expShareModifier)
        continue;
      if (pokemon.level < 100) {
        let expMultiplier = 0;
        if (participated)
          expMultiplier += (1 / participantIds.size);
        if (expShareModifier)
          expMultiplier += expShareModifier.stackCount * 0.1;
        console.log(pokemon.species.name, expMultiplier)
        this.scene.unshiftPhase(new ExpPhase(this.scene, pm, expValue * expMultiplier));
      }
    }
    this.scene.unshiftPhase(new SelectModifierPhase(this.scene));
    this.scene.newBattle();

    this.end();
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
    this.scene.applyModifiers(ExpBoosterModifier, exp);
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
    this.scene.pauseBgm();
    this.scene.sound.play('level_up_fanfare');
    this.scene.ui.showText(`${this.getPokemon().name} grew to\nLV. ${this.level}!`, null, () => this.scene.ui.getMessageHandler().promptLevelUpStats(prevStats, false, () => this.end()), null, true);
    const levelMoves = this.getPokemon().getLevelMoves(this.lastLevel + 1);
    for (let lm of levelMoves)
      this.scene.unshiftPhase(new LearnMovePhase(this.scene, this.partyMemberIndex, lm));
    const evolution = pokemon.getEvolution();
    if (evolution)
      this.scene.unshiftPhase(new EvolutionPhase(this.scene, this.partyMemberIndex, evolution, this.lastLevel));
    this.scene.time.delayedCall(1500, () => this.scene.resumeBgm());
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
    const move = allMoves[this.moveId - 1];

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
              this.scene.pauseBgm();
              this.scene.sound.play('level_up_fanfare');
              this.scene.ui.showText(`${pokemon.name} learned\n${Utils.toPokemonUpperCase(move.name)}!`, null, () => this.end(), messageMode === Mode.EVOLUTION_SCENE ? 1000 : null, true);
              this.scene.time.delayedCall(1500, () => this.scene.resumeBgm());
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
    const statusMultiplier = 1;
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

            const doShake = this.pokeballType !== PokeballType.MASTER_BALL ? () => {
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
                onComplete: () => {
                  this.catch();
                }
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
      pokemon.hideInfo();
      const end = () => {
        this.removePb();
        this.end();
      };
      const addToParty = () => {
        const newPokemon = pokemon.addToParty();
        pokemon.hp = 0;
        this.scene.field.remove(pokemon, true);
        if (newPokemon)
          newPokemon.loadAssets().then(end);
        else
          end();
      };
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
              pokemon.hp = 0;
              end();
            });
          });
        };
        promptRelease();
      } else
        addToParty();
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
    this.scene.applyModifiers(ExtraModifierModifier, modifierCount);
    const types: Array<ModifierType> = getModifierTypesForWave(this.scene.currentBattle.waveIndex - 1, modifierCount.value, party);

    const modifierSelectCallback = (cursor: integer) => {
      if (cursor < 0) {
        this.scene.ui.setMode(Mode.MESSAGE);
        super.end();
        return;
      }

      const modifierType = types[cursor];
      if (modifierType instanceof PokemonModifierType) {
        const pokemonModifierType = modifierType as PokemonModifierType;
        const isMoveModifier = modifierType instanceof PokemonMoveModifierType;
        this.scene.ui.setModeWithoutClear(Mode.PARTY, !isMoveModifier ? PartyUiMode.MODIFIER : PartyUiMode.MOVE_MODIFIER, (slotIndex: integer, option: PartyOption) => {
          if (slotIndex < 6) {
            this.scene.ui.setMode(Mode.MODIFIER_SELECT);
            const modifierType = types[cursor];
            const modifier = !isMoveModifier
              ? modifierType.newModifier(party[slotIndex])
              : modifierType.newModifier(party[slotIndex], option - PartyOption.MOVE_1);
            this.scene.addModifier(modifier).then(() => super.end());
            this.scene.ui.clearText();
            this.scene.ui.setMode(Mode.MESSAGE);
          } else
            this.scene.ui.setMode(Mode.MODIFIER_SELECT, types, modifierSelectCallback);
        }, pokemonModifierType.selectFilter, modifierType instanceof PokemonMoveModifierType ? (modifierType as PokemonMoveModifierType).moveSelectFilter : undefined);
      } else {
        this.scene.addModifier(types[cursor].newModifier()).then(() => super.end());
        this.scene.ui.clearText();
        this.scene.ui.setMode(Mode.MESSAGE);
      }
    };
    this.scene.ui.setMode(Mode.MODIFIER_SELECT, types, modifierSelectCallback);
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