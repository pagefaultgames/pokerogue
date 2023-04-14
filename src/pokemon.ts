import Phaser from 'phaser';
import BattleScene from './battle-scene';
import BattleInfo, { PlayerBattleInfo, EnemyBattleInfo } from './battle-info';
import { default as Move, allMoves, MoveCategory, Moves, StatChangeAttr, applyMoveAttrs, HighCritAttr, HitsTagAttr } from './move';
import { pokemonLevelMoves } from './pokemon-level-moves';
import { default as PokemonSpecies, getPokemonSpecies } from './pokemon-species';
import * as Utils from './utils';
import { Type, getTypeDamageMultiplier } from './type';
import { getLevelTotalExp } from './exp';
import { Stat } from './pokemon-stat';
import { PokemonBaseStatModifier as PokemonBaseStatBoosterModifier, ShinyRateBoosterModifier } from './modifier';
import { PokeballType } from './pokeball';
import { Gender } from './gender';
import { initMoveAnim, loadMoveAnimAssets } from './battle-anims';
import { Status, StatusEffect } from './status-effect';
import { tmSpecies } from './tms';
import { pokemonEvolutions, SpeciesEvolution, SpeciesEvolutionCondition } from './pokemon-evolutions';
import { MessagePhase } from './battle-phases';
import { BattleStat } from './battle-stat';
import { BattleTag, BattleTagLapseType, BattleTagType } from './battle-tag';

export default abstract class Pokemon extends Phaser.GameObjects.Container {
  public id: integer;
  public name: string;
  public species: PokemonSpecies;
  public shiny: boolean;
  public pokeball: PokeballType;
  protected battleInfo: BattleInfo;
  public level: integer;
  public exp: integer;
  public levelExp: integer;
  public gender: Gender;
  public hp: integer;
  public stats: integer[];
  public ivs: integer[];
  public moveset: PokemonMove[];
  public status: Status;
  public winCount: integer;

  public summonData: PokemonSummonData;
  public battleSummonData: PokemonBattleSummonData;
  public turnData: PokemonTurnData;

  public maskEnabled: boolean;
  public maskSprite: Phaser.GameObjects.Sprite;

  private shinySparkle: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, x: number, y: number, species: PokemonSpecies, level: integer, dataSource?: Pokemon) {
    super(scene, x, y);
    this.name = Utils.toPokemonUpperCase(species.name);
    this.species = species;
    this.battleInfo = this.isPlayer()
      ? new PlayerBattleInfo(scene)
      : new EnemyBattleInfo(scene);
    this.pokeball = dataSource?.pokeball || PokeballType.POKEBALL;
    this.level = level;//Utils.randInt(player ? 100 : 30, player ? 41 : 1);
    this.exp = dataSource?.exp || getLevelTotalExp(this.level, species.growthRate);
    this.levelExp = dataSource?.levelExp || 0;
    if (dataSource) {
      this.id = dataSource.id;
      this.shiny = dataSource.shiny;
      this.gender = dataSource.gender;
      this.hp = dataSource.hp;
      this.stats = dataSource.stats;
      this.ivs = dataSource.ivs;
      this.moveset = dataSource.moveset;
      this.status = dataSource.status;
      this.winCount = dataSource.winCount;
    } else {
      this.generateAndPopulateMoveset();

      this.id = Utils.randInt(4294967295);
      this.ivs = [
        Utils.binToDec(Utils.decToBin(this.id).substring(0, 5)),
        Utils.binToDec(Utils.decToBin(this.id).substring(5, 10)),
        Utils.binToDec(Utils.decToBin(this.id).substring(10, 15)),
        Utils.binToDec(Utils.decToBin(this.id).substring(15, 20)),
        Utils.binToDec(Utils.decToBin(this.id).substring(20, 25)),
        Utils.binToDec(Utils.decToBin(this.id).substring(25, 30))
      ];
    //} else
    //this.id = parseInt(Utils.decToBin(this.ivs[Stat.HP]) + Utils.decToBin(this.ivs[Stat.ATK]) + Utils.decToBin(this.ivs[Stat.DEF]) + Utils.decToBin(this.ivs[Stat.SPATK]) + Utils.decToBin(this.ivs[Stat.SPDEF]) + Utils.decToBin(this.ivs[Stat.SPD]) + this.id.toString(2).slice(30));
    
      if (this.species.malePercent === null)
        this.gender = Gender.GENDERLESS;
      else {
        const genderChance = (this.id % 256) * 0.390625;
        if (genderChance < this.species.malePercent)
          this.gender = Gender.MALE;
        else
          this.gender = Gender.FEMALE;
      }

      const rand1 = Utils.binToDec(Utils.decToBin(this.id).substring(0, 16));
      const rand2 = Utils.binToDec(Utils.decToBin(this.id).substring(16, 32));

      const E = (this.scene as BattleScene).trainerId ^ (this.scene as BattleScene).secretId;
      const F = rand1 ^ rand2;

      let shinyThreshold = new Utils.IntegerHolder(32);
      (this.scene as BattleScene).applyModifiers(ShinyRateBoosterModifier, shinyThreshold);
      console.log(shinyThreshold.value);

      this.shiny = (E ^ F) < shinyThreshold.value;
      if ((E ^ F) < 32)
        console.log('REAL SHINY!!');
      if (this.shiny)
        console.log((E ^ F), shinyThreshold.value);
      /*else
        this.shiny = Utils.randInt(16) === 0;*/

      this.winCount = 0;
    }

    //this.setPipeline((this.scene as BattleScene).spritePipeline);

    this.calculateStats();

    (scene as BattleScene).fieldUI.addAt(this.battleInfo, 0);
    
    this.battleInfo.initInfo(this);

    const getSprite = () => {
      const ret = this.scene.add.sprite(0, 0, `pkmn__${this.isPlayer() ? 'back__' : ''}sub`);
      ret.setOrigin(0.5, 1);
      return ret;
    };
    
    const sprite = getSprite();
    const tintSprite = getSprite();
    const zoomSprite = getSprite();

    tintSprite.setVisible(false);
    zoomSprite.setAlpha(0.5);

    this.add(sprite);
    this.add(tintSprite);
    this.add(zoomSprite);

    if (this.shiny) {
      const shinySparkle = this.scene.add.sprite(0, 0, 'shiny');
      shinySparkle.setVisible(false);
      shinySparkle.setOrigin(0.5, 1);
      const frameNames = this.scene.anims.generateFrameNames('shiny', { suffix: '.png', end: 34 });
      this.scene.anims.create({
        key: 'sparkle',
        frames: frameNames,
        frameRate: 32,
        showOnStart: true,
        hideOnComplete: true,
      });
      this.add(shinySparkle);

      this.shinySparkle = shinySparkle;
    }
  }

  abstract isPlayer(): boolean;

  loadAssets(): Promise<void> {
    return new Promise(resolve => {
      const moveIds = this.moveset.map(m => m.getMove().id);
      Promise.allSettled(moveIds.map(m => initMoveAnim(m)))
        .then(() => {
          loadMoveAnimAssets(this.scene as BattleScene, moveIds);
          this.species.loadAssets(this.scene as BattleScene, this.gender === Gender.FEMALE);
          if (this.isPlayer())
            (this.scene as BattleScene).loadAtlas(this.getBattleSpriteKey(), 'pokemon', this.getBattleSpriteAtlasPath());
          this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
            if (this.isPlayer()) {
              const originalWarn = console.warn;
              // Ignore warnings for missing frames, because there will be a lot
              console.warn = () => {};
              const battleFrameNames = this.scene.anims.generateFrameNames(this.getBattleSpriteKey(), { zeroPad: 4, suffix: ".png", start: 1, end: 256 });
              console.warn = originalWarn;
              if (this.isPlayer()) {
                this.scene.anims.create({
                  key: this.getBattleSpriteKey(),
                  frames: battleFrameNames,
                  frameRate: 12,
                  repeat: -1
                });
              }
            }
            this.playAnim();
            resolve();
          });
          if (!this.scene.load.isLoading())
            this.scene.load.start();
        });
    });
  }

  getSpriteAtlasPath(): string {
    return this.getSpriteId().replace(/\_{2}/g, '/');
  }

  getBattleSpriteAtlasPath(): string {
    return this.getBattleSpriteId().replace(/\_{2}/g, '/');
  }

  getSpriteId(): string {
    return this.species.getSpriteId(this.gender === Gender.FEMALE, this.shiny);
  }

  getBattleSpriteId(): string {
    return `${this.isPlayer() ? 'back__' : ''}${this.getSpriteId()}`;
  }

  getSpriteKey(): string {
    return this.species.getSpriteKey(this.gender === Gender.FEMALE, this.shiny);
  }

  getBattleSpriteKey(): string {
    return `pkmn__${this.getBattleSpriteId()}`;
  }

  getIconId(): string {
    // TODO: Add form special cases
    return this.species.getIconId();
  }

  getIconKey(): string {
    return `pkmn_icon__${this.getIconId()}`;
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.getAt(0) as Phaser.GameObjects.Sprite;
  }

  getTintSprite(): Phaser.GameObjects.Sprite {
    return !this.maskEnabled
      ? this.getAt(1) as Phaser.GameObjects.Sprite
      : this.maskSprite;
  }

  getZoomSprite(): Phaser.GameObjects.Sprite {
    return this.getAt(!this.maskEnabled ? 2 : 1) as Phaser.GameObjects.Sprite;
  }

  playAnim(): void{
    this.getSprite().play(this.getBattleSpriteKey());
    this.getTintSprite().play(this.getBattleSpriteKey());
    this.getZoomSprite().play(this.getBattleSpriteKey());
  }

  getBattleStat(stat: Stat) {
    if (stat === Stat.HP)
      return this.stats[Stat.HP];
    const statLevel = this.summonData.battleStats[(stat + 1) as BattleStat];
    let ret = this.stats[stat] * (Math.max(2, 2 + statLevel) / Math.max(2, 2 - statLevel));
    if (this.status && this.status.effect === StatusEffect.PARALYSIS)
      ret >>= 2;
    return ret;
  }

  calculateStats(): void {
    if (!this.stats)
      this.stats = [ 0, 0, 0, 0, 0, 0 ];
    const baseStats = this.species.baseStats.slice(0);
    console.log(this.id);
    (this.scene as BattleScene).applyModifiers(PokemonBaseStatBoosterModifier, this, baseStats);
    const stats = Utils.getEnumValues(Stat);
    for (let s of stats) {
      const isHp = s === Stat.HP;
      let baseStat = baseStats[s];
      let value = Math.floor(((2 * baseStat + this.ivs[s] + (0 / 4)) * this.level) * 0.01);
      if (isHp) {
        value = Math.min(value + this.level + 10, 99999);
        if (this.hp > value || this.hp === undefined)
          this.hp = value;
        else {
          const lastMaxHp = this.getMaxHp();
          if (lastMaxHp && value > lastMaxHp)
            this.hp += value - lastMaxHp;
        }
      } else
        value = Math.min(value + 5, 99999);
      this.stats[s] = value;
    }
  }

  getMaxHp(): integer {
    return this.stats[Stat.HP];
  }

  getInverseHp(): integer {
    return this.getMaxHp() - this.hp;
  }

  getHpRatio(): number {
    return Math.floor((this.hp / this.getMaxHp()) * 100) / 100;
  }

  getEvolution(): SpeciesEvolution {
    if (!pokemonEvolutions.hasOwnProperty(this.species.speciesId))
      return null;

    const evolutions = pokemonEvolutions[this.species.speciesId];
    for (let e of evolutions) {
      if (this.level >= e.level) {
        // TODO: Remove string conditions
        if (e.condition === null || typeof e.condition === 'string' || (e.condition as SpeciesEvolutionCondition).predicate(this))
          return e;
      }
    }

    return null;
  }

  getLevelMoves(startingLevel?: integer): Moves[] {
    const ret: Moves[] = [];
    const levelMoves = pokemonLevelMoves[this.species.speciesId];
    if (levelMoves) {
      if (!startingLevel)
        startingLevel = this.level;
      for (let lm of levelMoves) {
        const level = lm[0];
        if (level < startingLevel)
          continue;
        else if (level > this.level)
          break;
        ret.push(lm[1]);
      }
    }

    return ret;
  }

  generateAndPopulateMoveset(): void {
    this.moveset = [];
    const movePool = [];
    const allLevelMoves = pokemonLevelMoves[this.species.speciesId];
    if (!allLevelMoves) {
      console.log(this.species.speciesId, 'ERROR')
      return;
    }
    for (let m = 0; m < allLevelMoves.length; m++) {
      const levelMove = allLevelMoves[m];
      if (this.level < levelMove[0])
        break;
      if (movePool.indexOf(levelMove[1]) === -1)
        movePool.push(levelMove[1]);
    }

    const attackMovePool = movePool.filter(m => {
      const move = allMoves[m - 1];
      return move.category !== MoveCategory.STATUS;
    });

    if (attackMovePool.length) {
      const moveIndex = Utils.randInt(attackMovePool.length);
      this.moveset.push(new PokemonMove(attackMovePool[moveIndex], 0, 0));
      console.log(allMoves[attackMovePool[moveIndex] - 1]);
      movePool.splice(movePool.findIndex(m => m === attackMovePool[moveIndex]), 1);
    }

    while (movePool.length && this.moveset.length < 4) {
      const moveIndex = Utils.randInt(movePool.length);
      this.moveset.push(new PokemonMove(movePool[moveIndex], 0, 0));
      console.log(allMoves[movePool[moveIndex] - 1]);
      movePool.splice(moveIndex, 1);
    }
  }

  trySelectMove(moveIndex: integer): boolean {
    const move = this.moveset.length > moveIndex
      ? this.moveset[moveIndex]
      : null;
    return move?.isUsable();
  }

  showInfo() {
    if (!this.battleInfo.visible) {
      this.battleInfo.setX(this.battleInfo.x + (this.isPlayer() ? 150 : -150));
      this.battleInfo.setVisible(true);
      this.scene.tweens.add({
        targets: this.battleInfo,
        x: this.isPlayer() ? '-=150' : '+=150',
        duration: 1000,
        ease: 'Sine.easeOut'
      });
    }
  }

  hideInfo() {
    if (this.battleInfo.visible) {
      this.scene.tweens.add({
        targets: this.battleInfo,
        x: this.isPlayer() ? '+=150' : '-=150',
        duration: 500,
        ease: 'Sine.easeIn',
        onComplete: () => {
          this.battleInfo.setVisible(false);
          this.battleInfo.setX(this.battleInfo.x - (this.isPlayer() ? 150 : -150));
        }
      });
    }
  }

  updateInfo(instant?: boolean): Promise<void> {
    return this.battleInfo.updateInfo(this, instant);
  }

  addExp(exp: integer) {
    this.exp += exp;
    while (this.exp >= getLevelTotalExp(this.level + 1, this.species.growthRate))
      this.level++;
    this.levelExp = this.exp - getLevelTotalExp(this.level, this.species.growthRate);
  }

  apply(source: Pokemon, battlerMove: PokemonMove): Promise<MoveResult> {
    return new Promise(resolve => {
      const battleScene = this.scene as BattleScene;
      let result: MoveResult = MoveResult.STATUS;
      let success = false;
      const move = battlerMove.getMove();
      const moveCategory = move.category;
      let damage = 0;
      switch (moveCategory) {
        case MoveCategory.PHYSICAL:
        case MoveCategory.SPECIAL:
          const isPhysical = moveCategory === MoveCategory.PHYSICAL;
          const critChance = new Utils.IntegerHolder(16);
          applyMoveAttrs(HighCritAttr, this.scene as BattleScene, source, this, move, critChance);
          const isCritical = Utils.randInt(critChance.value) === 0;
          const sourceAtk = source.getBattleStat(isPhysical ? Stat.ATK : Stat.SPATK);
          const targetDef = this.getBattleStat(isPhysical ? Stat.DEF : Stat.SPDEF);
          const stabMultiplier = source.species.type1 === move.type || (source.species.type2 > -1 && source.species.type2 === move.type) ? 1.5 : 1;
          const typeMultiplier = getTypeDamageMultiplier(move.type, this.species.type1) * (this.species.type2 > -1 ? getTypeDamageMultiplier(move.type, this.species.type2) : 1);
          const criticalMultiplier = isCritical ? 2 : 1;
          damage = Math.ceil(((((2 * source.level / 5 + 2) * move.power * sourceAtk / targetDef) / 50) + 2) * stabMultiplier * typeMultiplier * ((Utils.randInt(15) + 85) / 100)) * criticalMultiplier;
          if (isPhysical && source.status && source.status.effect === StatusEffect.BURN)
            damage = Math.floor(damage / 2);
          move.getAttrs(HitsTagAttr).map(hta => hta as HitsTagAttr).filter(hta => hta.doubleDamage).forEach(hta => {
            if (this.getTag(hta.tagType)) {
              console.log('ye');
              damage *= 2;
            }
          });
          console.log('damage', damage, move.name, move.power, sourceAtk, targetDef);
          if (damage) {
            this.hp = Math.max(this.hp - damage, 0);
            if (isCritical)
              battleScene.unshiftPhase(new MessagePhase(battleScene, 'A critical hit!'));
          }
          if (typeMultiplier >= 2)
            result = MoveResult.SUPER_EFFECTIVE;
          else if (typeMultiplier >= 1)
            result = MoveResult.EFFECTIVE;
          else if (typeMultiplier > 0)
            result = MoveResult.NOT_VERY_EFFECTIVE;
          else
            result = MoveResult.NO_EFFECT;

          switch (result) {
            case MoveResult.EFFECTIVE:
              this.scene.sound.play('hit');
              success = true;
              break;
            case MoveResult.SUPER_EFFECTIVE:
              this.scene.sound.play('hit_strong');
              battleScene.unshiftPhase(new MessagePhase(battleScene, 'It\'s super effective!'));
              success = true;
              break;
            case MoveResult.NOT_VERY_EFFECTIVE:
              this.scene.sound.play('hit_weak');
              battleScene.unshiftPhase(new MessagePhase(battleScene, 'It\'s not very effective!'))
              success = true;
              break;
            case MoveResult.NO_EFFECT:
              battleScene.unshiftPhase(new MessagePhase(battleScene, `It doesn\'t affect ${this.name}!`))
              success = true;
              break;
          }
          break;
        case MoveCategory.STATUS:
          result = MoveResult.STATUS;
          success = true;
          break;
      }

      if (success) {
        if (result <= MoveResult.NOT_VERY_EFFECTIVE) {
          const flashTimer = this.scene.time.addEvent({
            delay: 100,
            repeat: 5,
            startAt: 200,
            callback: () => {
              this.getSprite().setVisible(flashTimer.repeatCount % 2 === 0);
              if (!flashTimer.repeatCount) {
                this.battleInfo.updateInfo(this).then(() => resolve(result));
              }
            }
          });
        } else {
          this.battleInfo.updateInfo(this).then(() => resolve(result));
        }
      } else
        resolve(result);
    });
  }

  addTag(tagType: BattleTagType, lapseType: BattleTagLapseType, turnCount?: integer): boolean {
    if (this.getTag(tagType))
      return false;

    const newTag = new BattleTag(tagType, lapseType || BattleTagLapseType.FAINT, turnCount || 1);
    this.summonData.tags.push(newTag);
    if (newTag.isHidden())
      this.setVisible(false);
  }

  getTag(tagFilter: BattleTagType | ((tag: BattleTag) => boolean)): BattleTag {
    return typeof(tagFilter) === 'number'
      ? this.summonData.tags.find(t => t.tagType === tagFilter)
      : this.summonData.tags.find(t => tagFilter(t));
  }

  getTags(tagFilter: BattleTagType | ((tag: BattleTag) => boolean)): BattleTag[] {
    return typeof(tagFilter) === 'number'
      ? this.summonData.tags.filter(t => t.tagType === tagFilter)
      : this.summonData.tags.filter(t => tagFilter(t));
  }

  lapseTags(lapseType: BattleTagLapseType) {
    const tags = this.summonData.tags;
    tags.filter(t => lapseType === BattleTagLapseType.FAINT || ((t.lapseType === lapseType) && !(--t.turnCount))).forEach(t => tags.splice(tags.indexOf(t), 1));
    const visible = !this.getTag(t => t.isHidden());
    if (visible && !this.visible) {
      // Wait 2 frames before setting visible for battle animations that don't immediately show the sprite invisible
      this.scene.tweens.addCounter({
        duration: 2,
        useFrames: true,
        onComplete: () => this.setVisible(true)
      });
    } else
      this.setVisible(visible);
  }

  getLastXMoves(turnCount?: integer): TurnMove[] {
    const moveHistory = this.summonData.moveHistory;
    return moveHistory.slice(Math.max(moveHistory.length - (turnCount || 1), 0), moveHistory.length).reverse();
  }

  cry(soundConfig?: Phaser.Types.Sound.SoundConfig): integer {
    return this.species.cry(this.scene as BattleScene, soundConfig);
  }

  faintCry(callback: Function) {
    const key = this.species.speciesId.toString();
    let i = 0;
    let rate = 0.85;
    this.scene.sound.play(key, {
      rate: rate
    });
    const sprite = this.getSprite();
    const tintSprite = this.getTintSprite();
    const zoomSprite = this.getZoomSprite();
    const delay = Math.max(this.scene.sound.get(key).totalDuration * 50, 25);
    let frameProgress = 0;
    let frameThreshold: number;
    sprite.anims.pause();
    tintSprite.anims.pause();
    zoomSprite.anims.pause();
    let faintCryTimer = this.scene.time.addEvent({
      delay: delay,
      repeat: -1,
      callback: () => {
        ++i;
        frameThreshold = sprite.anims.msPerFrame / rate;
        frameProgress += delay;
        while (frameProgress > frameThreshold) {
          if (sprite.anims.duration) {
            sprite.anims.nextFrame();
            tintSprite.anims.nextFrame();
            zoomSprite.anims.nextFrame();
          }
          frameProgress -= frameThreshold;
        }
        const crySound = this.scene.sound.get(key);
        if (crySound) {
          rate *= 0.99;
          crySound.play({
            rate: rate,
            seek: (i * delay * 0.001) * rate
          });
        }
        else {
          faintCryTimer.destroy();
          faintCryTimer = null;
          if (callback)
            callback();
        }
      }
    });
    // Failsafe
    this.scene.time.delayedCall(3000, () => {
      if (!faintCryTimer || !this.scene)
        return;
      const crySound = this.scene.sound.get(key);
      if (crySound?.isPlaying)
        crySound.stop();
      faintCryTimer.destroy();
      if (callback)
        callback();
    });
  }

  trySetStatus(effect: StatusEffect): boolean {
    if (this.status)
      return false;
    switch (effect) {
      case StatusEffect.POISON:
      case StatusEffect.TOXIC:
        if (this.species.isOfType(Type.POISON) || this.species.isOfType(Type.STEEL))
          return false;
        break;
      case StatusEffect.FREEZE:
        if (this.species.isOfType(Type.ICE))
          return false;
        break;
      case StatusEffect.BURN:
        if (this.species.isOfType(Type.FIRE))
          return false;
        break;
    }
    this.status = new Status(effect);
    return true;
  }

  resetStatus(): void {
    this.status = undefined;
  }

  resetSummonData(): void {
    this.summonData = new PokemonSummonData();
    this.resetBattleSummonData();
  }

  resetBattleSummonData(): void {
    this.battleSummonData = new PokemonBattleSummonData();
  }

  resetTurnData(): void {
    this.turnData = new PokemonTurnData();
  }

  getExpValue(victor: Pokemon): integer {
    return ((this.species.baseExp * this.level) / 5) * ((Math.round(Math.sqrt(2 * this.level + 10))
      * Math.pow(2 * this.level + 10, 2)) / (Math.round(Math.sqrt(this.level + victor.level + 10)) * Math.pow(this.level + victor.level + 10, 2))) + 1;
  }

  tint(color: number, alpha?: number, duration?: integer, ease?: string) {
    const tintSprite = this.getTintSprite();
    tintSprite.setTintFill(color);
    tintSprite.setVisible(true);

    if (duration) {
      tintSprite.setAlpha(0);

      this.scene.tweens.add({
        targets: tintSprite,
        alpha: alpha || 1,
        duration: duration,
        ease: ease || 'Linear'
      });
    } else
      tintSprite.setAlpha(alpha);
  }

  untint(duration: integer, ease?: string) {
    const tintSprite = this.getTintSprite();

    if (duration) {
      this.scene.tweens.add({
        targets: tintSprite,
        alpha: 0,
        duration: duration,
        ease: ease || 'Linear',
        onComplete: () => {
          tintSprite.setVisible(false);
          tintSprite.setAlpha(1);
        }
      });
    } else {
      tintSprite.setVisible(false);
      tintSprite.setAlpha(1);
    }
  }

  enableMask() {
    if (!this.maskEnabled) {
      this.maskSprite = this.getTintSprite();
      this.maskSprite.setVisible(true);
      this.maskSprite.setPosition(this.x * 6, this.y * 6);
      this.maskSprite.setScale(6);
      this.maskEnabled = true;
    }
  }

  disableMask() {
    if (this.maskEnabled) {
      this.maskSprite.setVisible(false);
      this.maskSprite.setPosition(0, 0);
      this.maskSprite.setScale(1);
      this.maskSprite = null;
      this.maskEnabled = false;
    }
  }

  sparkle(): void {
    if (this.shinySparkle) {
      this.shinySparkle.play('sparkle');
      this.scene.sound.play('sparkle');
    }
  }

  destroy(): void {
    this.battleInfo.destroy();
    super.destroy();
  }
}

export class PlayerPokemon extends Pokemon {
  public compatibleTms: Moves[];

  constructor(scene: BattleScene, species: PokemonSpecies, level: integer, dataSource?: Pokemon) {
    super(scene, 106, 148, species, level, dataSource);

    this.species.generateIconAnim(scene);
    this.generateCompatibleTms();
  }

  isPlayer(): boolean {
    return true;
  }

  generateCompatibleTms(): void {
    this.compatibleTms = [];

    const tms = Object.keys(tmSpecies);
    for (let tm of tms) {
      const moveId = parseInt(tm) as Moves;
      for (let p of tmSpecies[tm]) {
        if (Array.isArray(p)) {
          if (p[0] === this.species.speciesId) {
            this.compatibleTms.push(moveId);
            break;
          }
        } else if (p === this.species.speciesId) {
          this.compatibleTms.push(moveId);
          break;
        }
      }
    }
  }

  evolve(evolution: SpeciesEvolution): Promise<void> {
    return new Promise(resolve => {
      this.species = getPokemonSpecies(evolution.speciesId);
      this.name = this.species.name.toUpperCase();
      this.species.generateIconAnim(this.scene as BattleScene);
      this.compatibleTms.splice(0, this.compatibleTms.length);
      this.generateCompatibleTms();
      this.loadAssets().then(() => {
        this.calculateStats();
        this.updateInfo().then(() => resolve());
      });
    });
  }
}

export class EnemyPokemon extends Pokemon {
  public aiType: AiType;

  constructor(scene: BattleScene, species: PokemonSpecies, level: integer) {
    super(scene, -66, 84, species, level);

    this.aiType = AiType.SMART_RANDOM;
  }

  getNextMove(): PokemonMove {
    const queuedMove = this.summonData.moveQueue.length
      ? this.moveset.find(m => m.moveId === this.summonData.moveQueue[0].move)
      : null;
    if (queuedMove && (this.summonData.moveQueue[0].ignorePP || queuedMove.isUsable()))
      return queuedMove;

    const movePool = this.moveset.filter(m => m.isUsable());
    if (movePool.length) {
      if (movePool.length === 1)
        return movePool[0];
      switch (this.aiType) {
        case AiType.RANDOM:
          return movePool[Utils.randInt(movePool.length)];
        case AiType.SMART_RANDOM:
        case AiType.SMART:
          const target = (this.scene as BattleScene).getPlayerPokemon();
          const moveScores = movePool.map(() => 0);
          for (let m in movePool) {
            const pokemonMove = movePool[m];
            const move = pokemonMove.getMove();
            let moveScore = moveScores[m];
            if (move.category === MoveCategory.STATUS)
              moveScore++;
            else {
              const effectiveness = getTypeDamageMultiplier(move.type, target.species.type1) * (target.species.type2 > -1 ? getTypeDamageMultiplier(move.type, target.species.type2) : 1);
              moveScore = Math.pow(effectiveness - 1, 2) * effectiveness < 1 ? -2 : 2;
              if (moveScore) {
                if (move.category === MoveCategory.PHYSICAL) {
                  if (this.getBattleStat(Stat.ATK) > this.getBattleStat(Stat.SPATK)) {
                    const statRatio = this.getBattleStat(Stat.SPATK) / this.getBattleStat(Stat.ATK);
                    if (statRatio <= 0.75)
                      moveScore *= 2;
                    else if (statRatio <= 0.875)
                      moveScore *= 1.5;
                  }
                } else {
                  if (this.getBattleStat(Stat.SPATK) > this.getBattleStat(Stat.ATK)) {
                    const statRatio = this.getBattleStat(Stat.ATK) / this.getBattleStat(Stat.SPATK);
                    if (statRatio <= 0.75)
                      moveScore *= 2;
                    else if (statRatio <= 0.875)
                      moveScore *= 1.5;
                  }
                }

                moveScore += Math.floor(move.power / 5);
              }
            }

            const statChangeAttrs = move.getAttrs(StatChangeAttr) as StatChangeAttr[];

            for (let sc of statChangeAttrs) {
              moveScore += ((sc.levels >= 1) === sc.selfTarget ? -2 : 2) + sc.levels * (sc.selfTarget ? 4 : -4);
              // TODO: Add awareness of current levels
            }

            // could make smarter by checking opponent def/spdef
            moveScores[m] = moveScore;
          }

          console.log(moveScores);

          const sortedMovePool = movePool.slice(0);
          sortedMovePool.sort((a, b) => {
            const scoreA = moveScores[movePool.indexOf(a)];
            const scoreB = moveScores[movePool.indexOf(b)];
            return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
          });
          let r = 0;
          if (this.aiType === AiType.SMART_RANDOM) {
            while (r < sortedMovePool.length - 1 && Utils.randInt(8) >= 5)
              r++;
          }
          console.log(movePool.map(m => m.getName()), moveScores, r, sortedMovePool.map(m => m.getName()));
          return sortedMovePool[r];
      }
    }
    return new PokemonMove(Moves.STRUGGLE, 0, 0);
  }

  isPlayer() {
    return false;
  }

  addToParty() {
    const party = (this.scene as BattleScene).getParty();
    let ret: PlayerPokemon = null;

    if (party.length < 6) {
      const newPokemon = new PlayerPokemon(this.scene as BattleScene, this.species, this.level, this);
      party.push(newPokemon);
      ret = newPokemon;
    }

    return ret;
  }
}

export interface TurnMove {
  move: Moves;
  result: MoveResult;
}

export interface QueuedMove {
  move: Moves;
  ignorePP?: boolean;
}

export class PokemonSummonData {
  public battleStats: integer[] = [ 0, 0, 0, 0, 0, 0, 0 ];
  public moveHistory: TurnMove[] = [];
  public moveQueue: QueuedMove[] = [];
  public tags: BattleTag[] = [];
  public charging: boolean;
  public confusionTurns: integer;
}

export class PokemonBattleSummonData {
  public infatuated: boolean;
}

export class PokemonTurnData {
  public flinched: boolean;
  public hitCount: integer;
  public hitsLeft: integer;
  public hitsTotal: integer;
}

export enum AiType {
  RANDOM,
  SMART_RANDOM,
  SMART
};

export enum MoveResult {
  EFFECTIVE,
  SUPER_EFFECTIVE,
  NOT_VERY_EFFECTIVE,
  NO_EFFECT,
  STATUS,
  FAILED,
  MISSED,
  OTHER
};

export class PokemonMove {
  public moveId: Moves;
  public ppUsed: integer;
  public ppUp: integer;
  public disableTurns: integer;

  constructor(moveId: Moves, ppUsed?: integer, ppUp?: integer) {
    this.moveId = moveId;
    this.ppUsed = ppUsed || 0;
    this.ppUp = ppUp || 0;
    this.disableTurns = 0;
  }

  isUsable(): boolean {
    if (this.disableTurns > 0)
      return false;
    return this.ppUsed < this.getMove().pp + this.ppUp;
  }

  getMove(): Move {
    return allMoves[this.moveId - 1];
  }

  getName(): string {
    return this.getMove().name;
  }
}