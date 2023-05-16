import BattleScene, { maxExpLevel, startingLevel, startingWave } from "./battle-scene";
import { default as Pokemon, PlayerPokemon, EnemyPokemon, PokemonMove, MoveResult, DamageResult, FieldPosition, HitResult } from "./pokemon";
import * as Utils from './utils';
import { allMoves, applyMoveAttrs, BypassSleepAttr, ChargeAttr, applyFilteredMoveAttrs, HitsTagAttr, MissEffectAttr, MoveAttr, MoveCategory, MoveEffectAttr, MoveFlags, MoveHitEffectAttr, Moves, MultiHitAttr, OverrideMoveEffectAttr, VariableAccuracyAttr, MoveTarget, OneHitKOAttr, getMoveTargets } from "./data/move";
import { Mode } from './ui/ui';
import { Command } from "./ui/command-ui-handler";
import { Stat } from "./data/pokemon-stat";
import { BerryModifier, ContactHeldItemTransferChanceModifier, ExpBalanceModifier, ExpBoosterModifier, ExpShareModifier, ExtraModifierModifier, FlinchChanceModifier, HealingBoosterModifier, HitHealModifier, MapModifier, MultipleParticipantExpBonusModifier, PokemonExpBoosterModifier, PokemonHeldItemModifier, SwitchEffectTransferModifier, TempBattleStatBoosterModifier, TurnHealModifier, TurnHeldItemTransferModifier } from "./modifier/modifier";
import PartyUiHandler, { PartyOption, PartyUiMode } from "./ui/party-ui-handler";
import { doPokeballBounceAnim, getPokeballAtlasKey, getPokeballCatchMultiplier, getPokeballName, getPokeballTintColor, PokeballType } from "./data/pokeball";
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
import { BattleTarget, TurnCommand } from "./battle";

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
      this.scene.arena.playBgm();

    this.scene.pushPhase(new EncounterPhase(this.scene, this.loaded));
    this.scene.pushPhase(new SummonPhase(this.scene, 0));
    if (this.scene.currentBattle.double)
      this.scene.pushPhase(new SummonPhase(this.scene, 1));

    super.end();
  }
}

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
        const starterPokemon = new PlayerPokemon(this.scene, starter.species, startingLevel, starter.abilityIndex, starter.formIndex, starterGender, starter.shiny);
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

type PokemonFunc = (pokemon: Pokemon) => void;

export abstract class FieldPhase extends BattlePhase {
  getOrder(): BattleTarget[] {
    const playerField = this.scene.getPlayerField() as Pokemon[];
    const enemyField = this.scene.getEnemyField() as Pokemon[];

    let orderedTargets: Pokemon[] = playerField.concat(enemyField).sort((a: Pokemon, b: Pokemon) => {
      const aSpeed = a?.getBattleStat(Stat.SPD) || 0;
      const bSpeed = b?.getBattleStat(Stat.SPD) || 0;

      return aSpeed < bSpeed ? 1 : aSpeed > bSpeed ? -1 : !Utils.randInt(2) ? -1 : 1;
    });

    const speedReversed = new Utils.BooleanHolder(false);
    this.scene.arena.applyTags(TrickRoomTag, speedReversed);

    if (speedReversed.value)
      orderedTargets = orderedTargets.reverse();

    return orderedTargets.map(t => t.getFieldIndex() + (!t.isPlayer() ? BattleTarget.ENEMY : 0));
  }

  executeForAll(func: PokemonFunc): void {
    const field = this.scene.getField().filter(p => p?.hp);
    field.forEach(pokemon => func(pokemon));
  }
}

export abstract class PokemonPhase extends FieldPhase {
  protected player: boolean;
  protected fieldIndex: integer;

  constructor(scene: BattleScene, player: boolean, fieldIndex: integer) {
    super(scene);

    this.player = player;
    this.fieldIndex = fieldIndex;
  }

  getPokemon() {
    return (this.player ? this.scene.getPlayerField() : this.scene.getEnemyField())[this.fieldIndex || 0];
  }
}

export abstract class PartyMemberPokemonPhase extends PokemonPhase {
  protected partyMemberIndex: integer;

  constructor(scene: BattleScene, partyMemberIndex: integer) {
    super(scene, true, partyMemberIndex);

    this.partyMemberIndex = partyMemberIndex;
  }

  getPokemon() {
    return this.scene.getParty()[this.partyMemberIndex];
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

    const loadEnemyAssets = [];

    const battle = this.scene.currentBattle;

    battle.enemyLevels.forEach((level, e) => {
      const enemySpecies = this.scene.randomSpecies(battle.waveIndex, level, true);
      if (!this.loaded)
        battle.enemyField[e] = new EnemyPokemon(this.scene, enemySpecies, level);
      const enemyPokemon = this.scene.getEnemyField()[e];
      enemyPokemon.resetSummonData();
  
      this.scene.gameData.setPokemonSeen(enemyPokemon);

      loadEnemyAssets.push(enemyPokemon.loadAssets());
  
      console.log(enemyPokemon.species.name, enemyPokemon.species.speciesId, enemyPokemon.stats);
    });

    Promise.all(loadEnemyAssets).then(() => {
      battle.enemyField.forEach((enemyPokemon, e) => {
        this.scene.field.add(enemyPokemon);
        const playerPokemon = this.scene.getPlayerPokemon();
        if (playerPokemon.visible)
          this.scene.field.moveBelow(enemyPokemon, playerPokemon);
        enemyPokemon.tint(0, 0.5);
        if (battle.enemyField.length > 1)
          enemyPokemon.setFieldPosition(e ? FieldPosition.RIGHT : FieldPosition.LEFT);
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
    if (startingWave > 10) {
      for (let m = 0; m < Math.floor(startingWave / 10); m++)
        this.scene.addModifier(getPlayerModifierTypeOptionsForWave((m + 1) * 10, 1, this.scene.getParty())[0].type.newModifier());
    }

    this.scene.arena.trySetWeather(getRandomWeatherType(this.scene.arena.biomeType), false);

    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, enemyField, this.scene.arenaPlayer, this.scene.trainer ].flat(),
      x: (_target, _key, value, fieldIndex: integer) => fieldIndex < 1 + (enemyField.length) ? value + 300 : value - 300,
      duration: 2000,
      onComplete: () => {
        enemyField.forEach(enemyPokemon => {
          enemyPokemon.untint(100, 'Sine.easeOut');
          enemyPokemon.cry();
          enemyPokemon.showInfo();
        });
        const text = enemyField.length === 1
          ? `A wild ${enemyField[0].name} appeared!`
          : `A wild ${enemyField[0].name}\nand ${enemyField[1].name} appeared!`;
        this.scene.ui.showText(text, null, () => this.end(), 1500);
      }
    });
  }

  end() {
    const enemyField = this.scene.getEnemyField();

    enemyField.forEach((enemyPokemon, e) => {
      if (enemyPokemon.shiny)
        this.scene.unshiftPhase(new ShinySparklePhase(this.scene, false, e));
    });

    enemyField.forEach(enemyPokemon => this.scene.arena.applyTags(ArenaTrapTag, enemyPokemon));

    enemyField.forEach(enemyPokemon => applyPostSummonAbAttrs(PostSummonAbAttr, enemyPokemon));
      
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
    const enemyField = this.scene.getEnemyField();
    this.scene.tweens.add({
      targets: [ this.scene.arenaEnemy, this.scene.arenaNextEnemy, enemyField ].flat(),
      x: '+=300',
      duration: 2000,
      onComplete: () => {
        this.scene.arenaEnemy.setX(this.scene.arenaNextEnemy.x);
        this.scene.arenaEnemy.setAlpha(1);
        this.scene.arenaNextEnemy.setX(this.scene.arenaNextEnemy.x - 300);
        enemyField.forEach(enemyPokemon => {
          enemyPokemon.untint(100, 'Sine.easeOut');
          enemyPokemon.cry();
          enemyPokemon.showInfo();
        });
        const text = enemyField.length === 1
          ? `A wild ${enemyField[0].name} appeared!`
          : `A wild ${enemyField[0].name}\nand ${enemyField[1].name} appeared!`;
        this.scene.ui.showText(text, null, () => this.end(), 1500);
      }
    });
  }

  end() {
    this.scene.getEnemyField().forEach((enemyPokemon, e) => {
      if (enemyPokemon.shiny)
        this.scene.unshiftPhase(new ShinySparklePhase(this.scene, false, e));
    });

    this.scene.unshiftPhase(new CheckSwitchPhase(this.scene, 0));
    if (this.scene.currentBattle.double)
      this.scene.unshiftPhase(new CheckSwitchPhase(this.scene, 1));

    super.end();
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
      x: (_target, _key, value, fieldIndex: integer) => fieldIndex < 2 ? value + 300 : value - 300,
      duration: 2000,
      onComplete: () => {
        enemyField.forEach(enemyPokemon => {
          enemyPokemon.untint(100, 'Sine.easeOut');
          enemyPokemon.cry();
          enemyPokemon.showInfo();
        });
        const text = enemyField.length === 1
          ? `A wild ${enemyField[0].name} appeared!`
          : `A wild ${enemyField[0].name}\nand ${enemyField[1].name} appeared!`;
        this.scene.ui.showText(text, null, () => this.end(), 1500);
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

    if (this.scene.currentBattle.waveIndex === this.scene.finalWave - 9)
      setNextBiome(Biome.END);
    else if (Array.isArray(biomeLinks[currentBiome])) {
      const biomes = biomeLinks[currentBiome] as Biome[];
      if (this.scene.findModifier(m => m instanceof MapModifier)) {
        this.scene.ui.setMode(Mode.BIOME_SELECT, currentBiome, (biomeIndex: integer) => {
          this.scene.ui.setMode(Mode.MESSAGE);
          setNextBiome(biomes[biomeIndex]);
        });
      } else
        setNextBiome(biomes[Utils.randInt(biomes.length)]);
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

        this.scene.time.delayedCall(1000, () => this.scene.arena.playBgm());

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
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, fieldIndex);
  }

  start() {
    super.start();

    this.preSummon();
  }

  preSummon(): void {
    this.scene.ui.showText(`Go! ${this.getPokemon().name}!`);
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

    const playerPokemon = this.getPokemon();

    if (this.fieldIndex === 1) {
      this.scene.getPlayerField()[0].setFieldPosition(FieldPosition.LEFT, 250);
      playerPokemon.setFieldPosition(FieldPosition.RIGHT, 0);
    } else
      playerPokemon.setFieldPosition(!this.scene.currentBattle.double ? FieldPosition.CENTER : FieldPosition.LEFT);

    const xOffset = playerPokemon.getFieldPositionOffset()[0];

    pokeball.setVisible(true);

    this.scene.tweens.add({
      targets: pokeball,
      duration: 650,
      x: 100 + xOffset
    });

    this.scene.tweens.add({
      targets: pokeball,
      duration: 150,
      ease: 'Cubic.easeOut',
      y: 70,
      onComplete: () => {
        this.scene.tweens.add({
          targets: pokeball,
          duration: 500,
          ease: 'Cubic.easeIn',
          angle: 1440,
          y: 132,
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
    const playerField = this.scene.getPlayerField();

    playerField.forEach((pokemon, p) => {
      if (pokemon.shiny)
        this.scene.unshiftPhase(new ShinySparklePhase(this.scene, true, p));
    });

    playerField.forEach(pokemon => pokemon.resetTurnData());

    playerField.forEach(pokemon => this.scene.arena.applyTags(ArenaTrapTag, pokemon));

    playerField.forEach(pokemon => applyPostSummonAbAttrs(PostSummonAbAttr, pokemon));

    super.end();
  }
}

export class SwitchSummonPhase extends SummonPhase {
  private slotIndex: integer;
  private doReturn: boolean;
  private batonPass: boolean;

  private lastPokemon: PlayerPokemon;

  constructor(scene: BattleScene, fieldIndex: integer, slotIndex: integer, doReturn: boolean, batonPass: boolean) {
    super(scene, fieldIndex);

    this.slotIndex = slotIndex;
    this.doReturn = doReturn;
    this.batonPass = batonPass;
  }

  start() {
    super.start();
  }

  preSummon(): void {
    if (!this.doReturn) {
      this.switchAndSummon();
      return;
    }

    const playerPokemon = this.getPokemon();

    if (!this.batonPass)
      this.scene.getEnemyField().forEach(enemyPokemon => enemyPokemon.removeTagsBySourceId(playerPokemon.id));

    this.scene.ui.showText(`Come back, ${playerPokemon.name}!`);
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
    this.lastPokemon = this.getPokemon();
    if (this.batonPass) {
      this.scene.getEnemyField().forEach(enemyPokemon => enemyPokemon.transferTagsBySourceId(this.lastPokemon.id, switchedPokemon.id));
      if (!this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier && (m as SwitchEffectTransferModifier).pokemonId === switchedPokemon.id)) {
        const batonPassModifier = this.scene.findModifier(m => m instanceof SwitchEffectTransferModifier
          && (m as SwitchEffectTransferModifier).pokemonId === this.lastPokemon.id) as SwitchEffectTransferModifier;
        this.scene.tryTransferHeldItemModifier(batonPassModifier, switchedPokemon, false, false);
      }
    }
    party[this.slotIndex] = this.lastPokemon;
    party[this.fieldIndex] = switchedPokemon;
    this.scene.ui.showText(`Go! ${switchedPokemon.name}!`);
    this.summon();
  }

  end() {
    if (this.batonPass)
      this.getPokemon().transferSummon(this.lastPokemon);

    this.lastPokemon.resetSummonData();

    super.end();
  }
}

export class CheckSwitchPhase extends BattlePhase {
  protected fieldIndex: integer;

  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene);

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    const pokemon = this.scene.getPlayerField()[this.fieldIndex];

    if (this.scene.field.getAll().indexOf(pokemon) === -1) {
      this.scene.unshiftPhase(new SummonMissingPhase(this.scene, this.fieldIndex));
      super.end();
      return;
    }

    if (!this.scene.getParty().slice(1).filter(p => p.hp).length) {
      super.end();
      return;
    }

    if (pokemon.getTag(BattlerTagType.FRENZY)) {
      super.end();
      return;
    }

    this.scene.ui.showText('Will you switch\nPOKéMON?', null, () => {
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

export class TurnInitPhase extends FieldPhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    this.scene.getPlayerField().forEach(playerPokemon => {
      this.scene.currentBattle.addParticipant(playerPokemon);

      playerPokemon.resetTurnData();
    });

    this.scene.getEnemyField().forEach(enemyPokemon => enemyPokemon.resetTurnData());

    const order = this.getOrder();
    for (let o of order) {
      if (o < BattleTarget.ENEMY)
        this.scene.pushPhase(new CommandPhase(this.scene, o));
      else
        this.scene.pushPhase(new EnemyCommandPhase(this.scene, o - BattleTarget.ENEMY));
    }

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
        if (moveIndex > -1 && playerPokemon.getMoveset()[moveIndex].isUsable(queuedMove.ignorePP))
          this.handleCommand(Command.FIGHT, moveIndex, queuedMove.ignorePP);
      }
    } else
      this.scene.ui.setMode(Mode.COMMAND);
  }

  handleCommand(command: Command, cursor: integer, ...args: any[]): boolean {
    const playerPokemon = this.scene.getPlayerField()[this.fieldIndex];
    const enemyField = this.scene.getEnemyField();
    let success: boolean;

    switch (command) {
      case Command.FIGHT:
        if (cursor === -1 || playerPokemon.trySelectMove(cursor, args[0] as boolean)) {
          const turnCommand: TurnCommand = { command: Command.FIGHT, cursor: cursor,
            move: cursor > -1 ? { move: playerPokemon.moveset[cursor].moveId } : null, args: args }; // TODO: Struggle logic
          const moveTargets = getMoveTargets(playerPokemon, playerPokemon.moveset[cursor].moveId);
          if (moveTargets.targets.length <= 1 || moveTargets.multiple)
            turnCommand.targets = moveTargets.targets;
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
              this.scene.ui.setMode(Mode.FIGHT);
            }, null, true);
          }
        }

        break;
      case Command.BALL:
        if (this.scene.arena.biomeType === Biome.END) {
          this.scene.ui.setMode(Mode.COMMAND);
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.showText(`A strange force\nprevents using POKé BALLS.`, null, () => {
            this.scene.ui.showText(null, 0);
            this.scene.ui.setMode(Mode.COMMAND);
          }, null, true);
        } else if (cursor < 4) {
          this.scene.currentBattle.turnCommands[this.fieldIndex] = { command: Command.BALL, cursor: cursor };
          this.scene.unshiftPhase(new SelectTargetPhase(this.scene, this.fieldIndex))
          success = true;
        }
        break;
      case Command.POKEMON:
      case Command.RUN:
        const isSwitch = command === Command.POKEMON;
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
        } else if (trapTag)
          this.scene.ui.showText(`${this.scene.getPokemonById(trapTag.sourceId).name}'s ${trapTag.getMoveName()}\nprevents ${isSwitch ? 'switching' : 'fleeing'}!`, null, () => {
            this.scene.ui.showText(null, 0);
          }, null, true);
        break;
    }

    if (success)
      this.end();

    return success;
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
    const moveTargets = getMoveTargets(enemyPokemon, nextMove.move);

    this.scene.currentBattle.turnCommands[this.fieldIndex + BattleTarget.ENEMY] =
      { command: Command.FIGHT, move: nextMove, targets: !moveTargets.multiple ? [ moveTargets.targets[Utils.randInt(moveTargets.targets.length)] ] : moveTargets.targets };

    this.end();
  }
}

export class SelectTargetPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, true, fieldIndex);
  }

  start() {
    super.start();

    const move = this.scene.currentBattle.turnCommands[this.fieldIndex].move?.move || Moves.NONE;
    this.scene.ui.setMode(Mode.TARGET_SELECT, this.fieldIndex, move, (cursor: integer) => {
      this.scene.ui.setMode(Mode.MESSAGE);
      if (cursor === -1) {
        this.scene.currentBattle.turnCommands[this.fieldIndex] = null;
        this.scene.unshiftPhase(new CommandPhase(this.scene, this.fieldIndex));
      } else
        this.scene.currentBattle.turnCommands[this.fieldIndex].targets = [ cursor ];
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

    if (this.scene.arena.weather)
      this.scene.unshiftPhase(new WeatherEffectPhase(this.scene, this.scene.arena.weather));

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
              this.scene.pushPhase(new MovePhase(this.scene, pokemon, turnCommand.targets, move));
            else {
              const playerPhase = new MovePhase(this.scene, pokemon, turnCommand.targets, move, false, queuedMove.ignorePP);
              this.scene.pushPhase(playerPhase);
            }
          } else
            this.scene.pushPhase(new MovePhase(this.scene, pokemon, turnCommand.targets, move, false, queuedMove.ignorePP));
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

    for (let o of order) {
      if (field[o].status && field[o].status.isPostTurn())
        this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, !Math.floor(o / 2), o % 2));
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

    this.scene.currentBattle.incrementTurn();
    
    const handlePokemon = (pokemon: Pokemon) => {
      if (!pokemon || !pokemon.hp)
        return;

      pokemon.lapseTags(BattlerTagLapseType.TURN_END);
      
      const disabledMoves = pokemon.getMoveset().filter(m => m.isDisabled());
      for (let dm of disabledMoves) {
        if (!--dm.disableTurns)
          this.scene.pushPhase(new MessagePhase(this.scene, `${dm.getName()} is disabled\nno more!`));
      }

      const hasUsableBerry = !!this.scene.findModifier(m => m instanceof BerryModifier && m.shouldApply([ pokemon ]), pokemon.isPlayer());
      if (hasUsableBerry)
        this.scene.pushPhase(new BerryPhase(this.scene, pokemon.isPlayer(), pokemon.getFieldIndex()));

      this.scene.applyModifiers(TurnHealModifier, pokemon.isPlayer(), pokemon);

      this.executeForAll((pokemon: Pokemon) => applyPostTurnAbAttrs(PostTurnAbAttr, pokemon));

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
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    for (let pokemon of this.scene.getField()) {
      if (pokemon)
        pokemon.resetBattleSummonData();
    }

    this.scene.clearEnemyModifiers();

    const tempBattleStatBoosterModifiers = this.scene.getModifiers(TempBattleStatBoosterModifier) as TempBattleStatBoosterModifier[];
    for (let m of tempBattleStatBoosterModifiers) {
      if (!m.lapse())
        this.scene.removeModifier(m);
    }

    this.scene.updateModifiers().then(() => this.end());
  }
}

export class CommonAnimPhase extends PokemonPhase {
  private anim: CommonAnim;
  private targetIndex: integer;

  constructor(scene: BattleScene, player: boolean, fieldIndex: integer, targetIndex: integer, anim: CommonAnim) {
    super(scene, player, fieldIndex);

    this.anim = anim;
    this.targetIndex = targetIndex;
  }

  start() {
    new CommonBattleAnim(this.anim, this.getPokemon(), (this.player ? this.scene.getEnemyField() : this.scene.getPlayerField())[this.targetIndex]).play(this.scene, () => {
      this.end();
    });
  }
}

export class MovePhase extends BattlePhase {
  protected pokemon: Pokemon;
  protected targets: BattleTarget[];
  protected move: PokemonMove;
  protected followUp: boolean;
  protected ignorePp: boolean;
  protected cancelled: boolean;

  constructor(scene: BattleScene, pokemon: Pokemon, targets: BattleTarget[], move: PokemonMove, followUp?: boolean, ignorePp?: boolean) {
    super(scene);

    this.pokemon = pokemon;
    this.targets = targets;
    this.move = move;
    this.followUp = !!followUp;
    this.ignorePp = !!ignorePp;
    this.cancelled = false;
  }

  canMove(): boolean {
    return !!this.pokemon.hp && this.move.isUsable(this.ignorePp) && !!this.targets.length;
  }

  cancel(): void {
    this.cancelled = true;
  }

  start() {
    super.start();

    console.log(Moves[this.move.moveId]);

    console.log(this.scene.currentBattle.turnCommands);

    if (!this.canMove()) {
      if (this.move.isDisabled())
        this.scene.queueMessage(`${this.move.getName()} is disabled!`);
      this.end();
      return;
    }

    console.log(this.targets);

    const targets = this.scene.getField().filter(p => p && p.hp && this.targets.indexOf(p.getBattleTarget()) > -1);

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
        this.scene.unshiftPhase(new CommonAnimPhase(this.scene, this.pokemon.isPlayer(), this.pokemon.getFieldIndex(), this.pokemon.getBattleTarget(), CommonAnim.POISON + (this.pokemon.status.effect - 1)));
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
    return new MoveEffectPhase(this.scene, this.pokemon.isPlayer(), this.pokemon.getFieldIndex(), this.targets, this.move);
  }

  end() {
    if (!this.followUp && this.canMove())
      this.scene.unshiftPhase(new MoveEndPhase(this.scene, this.pokemon.isPlayer(), this.pokemon.getFieldIndex()));

    super.end();
  }
}

class MoveEffectPhase extends PokemonPhase {
  protected move: PokemonMove;
  protected targets: BattleTarget[];
  
  constructor(scene: BattleScene, player: boolean, fieldIndex: integer, targets: BattleTarget[], move: PokemonMove) {
    super(scene, player, fieldIndex);

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

      const targetHitChecks = Object.fromEntries(targets.map(p => [ p.getBattleTarget(), this.hitCheck(p) ]));
      if (targets.length === 1 && !targetHitChecks[this.targets[0]]) {
        this.scene.queueMessage(getPokemonMessage(user, '\'s\nattack missed!'));
        moveHistoryEntry.result = MoveResult.MISS;
        applyMoveAttrs(MissEffectAttr, user, null, this.move.getMove());
        this.end();
        return;
      }

      // Move animation only needs one target
      new MoveAnim(this.move.getMove().id as Moves, user, this.getTarget()?.getBattleTarget()).play(this.scene, () => {
        for (let target of targets) {
          if (!targetHitChecks[target.getBattleTarget()]) {
            this.scene.queueMessage(getPokemonMessage(user, '\'s\nattack missed!'));
            if (moveHistoryEntry.result === MoveResult.PENDING)
              moveHistoryEntry.result = MoveResult.MISS;
            applyMoveAttrs(MissEffectAttr, user, null, this.move.getMove());
            continue;
          }

          const isProtected = !this.move.getMove().hasFlag(MoveFlags.IGNORE_PROTECT) && target.lapseTag(BattlerTagType.PROTECTED);

          moveHistoryEntry.result = MoveResult.SUCCESS;
          
          const hitResult = !isProtected ? target.apply(user, this.move) : HitResult.NO_EFFECT;
          
          if (hitResult !== HitResult.NO_EFFECT && hitResult !== HitResult.FAIL) {
            const chargeEffect = !!this.move.getMove().getAttrs(ChargeAttr).find(ca => (ca as ChargeAttr).chargeEffect);
            // Charge attribute with charge effect takes all effect attributes and applies them to charge stage, so ignore them if this is present
            if (!chargeEffect)
              applyMoveAttrs(MoveEffectAttr, user, target, this.move.getMove());
            if (hitResult < HitResult.NO_EFFECT) {
              const flinched = new Utils.BooleanHolder(false);
              user.scene.applyModifiers(FlinchChanceModifier, user.isPlayer(), user, flinched);
              if (flinched.value)
                target.addTag(BattlerTagType.FLINCHED, undefined, this.move.moveId, user.id);
            }
            if (!isProtected && !chargeEffect) {
              applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveHitEffectAttr && (!!target.hp || (attr as MoveHitEffectAttr).selfTarget), user, target, this.move.getMove());
              if (target.hp)
                applyPostDefendAbAttrs(PostDefendAbAttr, target, user, this.move, hitResult);
              if (this.move.getMove().hasFlag(MoveFlags.MAKES_CONTACT))
                this.scene.applyModifiers(ContactHeldItemTransferChanceModifier, this.player, user, target.getFieldIndex());
            }
          }
        }
        this.end();
      });
    });
  }

  end() {
    const user = this.getUserPokemon();
    if (--user.turnData.hitsLeft >= 1 && this.getTarget()?.hp)
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
    if (hiddenTag) {
      if (!this.move.getMove().getAttrs(HitsTagAttr).filter(hta => (hta as HitsTagAttr).tagType === hiddenTag.tagType).length)
        return false;
    }

    if (this.getUserPokemon().getTag(BattlerTagType.IGNORE_ACCURACY))
      return true;

    const moveAccuracy = new Utils.NumberHolder(this.move.getMove().accuracy);

    if (moveAccuracy.value === -1)
      return true;

    applyMoveAttrs(VariableAccuracyAttr, this.getUserPokemon(), target, this.move.getMove(), moveAccuracy);

    if (!this.move.getMove().getAttrs(OneHitKOAttr).length && this.scene.arena.getTag(ArenaTagType.GRAVITY))
      moveAccuracy.value = Math.floor(moveAccuracy.value * 1.67);
      
    if (this.move.getMove().category !== MoveCategory.STATUS) {
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

    return true;
  }

  getUserPokemon(): Pokemon {
    return (this.player ? this.scene.getPlayerField() : this.scene.getEnemyField())[this.fieldIndex];
  }

  getTargets(): Pokemon[] {
    return this.scene.getField().filter(p => p?.hp && this.targets.indexOf(p.getBattleTarget()) > -1);
  }

  getTarget(): Pokemon {
    return this.getTargets().find(() => true);
  }

  getNewHitPhase() {
    return new MoveEffectPhase(this.scene, this.player, this.fieldIndex, this.targets, this.move);
  }
}

export class MoveEndPhase extends PokemonPhase {
  constructor(scene: BattleScene, player: boolean, fieldIndex: integer) {
    super(scene, player, fieldIndex);
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
  constructor(scene: BattleScene, player: boolean, fieldIndex: integer) {
    super(scene, player, fieldIndex);
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

  constructor(scene: BattleScene, player: boolean, fieldIndex: integer, selfTarget: boolean, stats: BattleStat[], levels: integer) {
    super(scene, player, fieldIndex);

    console.log(this.player, this.fieldIndex);

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
    super(scene, true, 0, 0, CommonAnim.SUNNY + (weather.weatherType - 1));
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
          this.scene.unshiftPhase(new DamagePhase(this.scene, pokemon.isPlayer(), pokemon.getFieldIndex()));
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

  constructor(scene: BattleScene, player: boolean, fieldIndex: integer, statusEffect: StatusEffect, cureTurn?: integer, sourceText?: string) {
    super(scene, player, fieldIndex);

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
            this.scene.pushPhase(new PostTurnStatusEffectPhase(this.scene, this.player, this.fieldIndex));
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
  constructor(scene: BattleScene, player: boolean, fieldIndex: integer) {
    super(scene, player, fieldIndex);
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

  constructor(scene: BattleScene, player: boolean, fieldIndex: integer, damageResult?: DamageResult) {
    super(scene, player, fieldIndex);

    this.damageResult = damageResult || HitResult.EFFECTIVE;
  }

  start() {
    super.start();

    switch (this.damageResult) {
      case HitResult.EFFECTIVE:
        this.scene.sound.play('hit');
        break;
      case HitResult.SUPER_EFFECTIVE:
        this.scene.sound.play('hit_strong');
        break;
      case HitResult.NOT_VERY_EFFECTIVE:
        this.scene.sound.play('hit_weak');
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
  constructor(scene: BattleScene, player: boolean, fieldIndex: integer) {
    super(scene, player, fieldIndex);
  }

  start() {
    super.start();

    this.scene.queueMessage(getPokemonMessage(this.getPokemon(), ' fainted!'), null, true);

    if (this.player) {
      this.scene.unshiftPhase(this.scene.getParty().filter(p => p.hp).length ? new SwitchPhase(this.scene, this.fieldIndex, true, false) : new GameOverPhase(this.scene));
    } else
      this.scene.unshiftPhase(new VictoryPhase(this.scene, this.fieldIndex));
      
    const pokemon = this.getPokemon();

    pokemon.lapseTags(BattlerTagLapseType.FAINT);
    this.scene.getField().filter(p => p && p !== pokemon).forEach(p => p.removeTagsBySourceId(pokemon.id));

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
  constructor(scene: BattleScene, targetIndex: integer) {
    super(scene, true, targetIndex);
  }

  start() {
    super.start();

    const participantIds = this.scene.currentBattle.playerParticipantIds;
    const party = this.scene.getParty();
    const expShareModifier = this.scene.findModifier(m => m instanceof ExpShareModifier) as ExpShareModifier;
    const expBalanceModifier = this.scene.findModifier(m => m instanceof ExpBalanceModifier) as ExpBalanceModifier;
    const multipleParticipantExpBonusModifier = this.scene.findModifier(m => m instanceof MultipleParticipantExpBonusModifier) as MultipleParticipantExpBonusModifier;
    const expValue = this.getPokemon().getExpValue();
    const expPartyMembers = party.filter(p => p.hp && p.level < maxExpLevel);
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
        this.scene.unshiftPhase(new ExpPhase(this.scene, partyMemberIndex, exp));
      }
    }

    if (!this.scene.currentBattle.enemyField.filter(p => p?.hp).length) {
      this.scene.pushPhase(new BattleEndPhase(this.scene));
      if (this.scene.currentBattle.waveIndex < this.scene.finalWave) {
        this.scene.pushPhase(new SelectModifierPhase(this.scene));
        this.scene.newBattle();
      } else
        this.scene.pushPhase(new GameOverPhase(this.scene, true));
    }

    this.end();
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
    if (!this.scene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE])
      this.scene.unshiftPhase(new UnlockPhase(this.scene, Unlockables.MINI_BLACK_HOLE));

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
      this.scene.sound.play('level_up_fanfare');
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
    }
    const evolution = pokemon.getEvolution();
    if (evolution)
      this.scene.unshiftPhase(new EvolutionPhase(this.scene, this.partyMemberIndex, evolution, this.lastLevel));
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
  constructor(scene: BattleScene, player: boolean, fieldIndex: integer) {
    super(scene, player, fieldIndex, 0, CommonAnim.USE_ITEM);
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

  constructor(scene: BattleScene, player: boolean, fieldIndex: integer, hpHealed: integer, message: string, showFullHpMessage: boolean, skipAnim?: boolean) {
    super(scene, player, fieldIndex, 0, CommonAnim.HEALTH_UP);

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

export class AttemptCapturePhase extends PokemonPhase {
  private pokeballType: PokeballType;
  private pokeball: Phaser.GameObjects.Sprite;
  private originalY: number;

  constructor(scene: BattleScene, targetIndex: integer, pokeballType: PokeballType) {
    super(scene, false, targetIndex);

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

    this.scene.sound.play('pb_throw');
    this.scene.time.delayedCall(300, () => {
      this.scene.field.moveBelow(this.pokeball, pokemon);
    });
    this.scene.tweens.add({
      targets: this.pokeball,
      x: { value: 236 + fpOffset[0], ease: 'Linear' },
      y: { value: 16 + fpOffset[1], ease: 'Cubic.easeOut' },
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
                  if (!pokemon.species.isObtainable()) {
                    shakeCounter.stop();
                    this.failCatch(shakeCount);
                  } else if (shakeCount++ < 3) {
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
    const pokemon = this.getPokemon();

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
    const pokemon = this.getPokemon() as EnemyPokemon;
    this.scene.unshiftPhase(new VictoryPhase(this.scene, this.fieldIndex));
    this.scene.ui.showText(`${pokemon.name} was caught!`, null, () => {
      const end = () => {
        this.removePb();
        this.end();
      };
      const addToParty = () => {
        const newPokemon = pokemon.addToParty();
        const modifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier, false);
        Promise.all(modifiers.map(m => this.scene.addModifier(m))).then(() => {
          this.scene.getPlayerField().forEach(playerPokemon => playerPokemon.removeTagsBySourceId(pokemon.id));
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
                this.scene.ui.setMode(Mode.PARTY, PartyUiMode.RELEASE, this.fieldIndex, (slotIndex: integer, _option: PartyOption) => {
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

export class AttemptRunPhase extends PokemonPhase {
  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene, true, fieldIndex);
  }

  start() {
    super.start();

    const playerPokemon = this.getPokemon();
    const enemyField = this.scene.getEnemyField();

    const enemySpeed = enemyField.reduce((total: integer, enemyPokemon: Pokemon) => total + enemyPokemon.stats[Stat.SPD], 0) / enemyField.length;

    const escapeChance = (((playerPokemon.stats[Stat.SPD] * 128) / enemySpeed) + (30 * this.scene.currentBattle.escapeAttempts++)) % 256;

    if (Utils.randInt(256) < escapeChance) {
      this.scene.sound.play('flee');
      this.scene.queueMessage('You got away safely!', null, true, 500);
      
      this.scene.tweens.add({
        targets: [ this.scene.arenaEnemy, enemyField ].flat(),
        alpha: 0,
        duration: 250,
        ease: 'Sine.easeIn'
      });

      enemyField.forEach(enemyPokemon => enemyPokemon.hp = 0);

      this.scene.pushPhase(new BattleEndPhase(this.scene));
      this.scene.newBattle();
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
        this.scene.ui.setModeWithoutClear(Mode.PARTY, PartyUiMode.MODIFIER_TRANSFER, -1, (fromSlotIndex: integer, itemIndex: integer, toSlotIndex: integer) => {
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
        this.scene.ui.setModeWithoutClear(Mode.PARTY, !isMoveModifier ? PartyUiMode.MODIFIER : PartyUiMode.MOVE_MODIFIER, -1, (slotIndex: integer, option: PartyOption) => {
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
  constructor(scene: BattleScene, player: boolean, fieldIndex: integer) {
    super(scene, player, fieldIndex);
  }

  start() {
    super.start();

    this.getPokemon().sparkle();
    this.scene.time.delayedCall(1000, () => this.end());
  }
}