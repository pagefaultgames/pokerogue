import Phaser from 'phaser';
import BattleScene from './battle-scene';
import BattleInfo, { PlayerBattleInfo, EnemyBattleInfo } from './ui/battle-info';
import Move, { StatChangeAttr, HighCritAttr, HitsTagAttr, applyMoveAttrs, FixedDamageAttr, VariablePowerAttr, Moves, allMoves, MoveCategory } from "./data/move";
import { pokemonLevelMoves } from './data/pokemon-level-moves';
import { default as PokemonSpecies, PokemonSpeciesForm, getPokemonSpecies } from './data/pokemon-species';
import * as Utils from './utils';
import { Type, TypeDamageMultiplier, getTypeDamageMultiplier } from './data/type';
import { getLevelTotalExp } from './data/exp';
import { Stat } from './data/pokemon-stat';
import { AttackTypeBoosterModifier, PokemonBaseStatModifier, ShinyRateBoosterModifier, SurviveDamageModifier, TempBattleStatBoosterModifier } from './modifier/modifier';
import { PokeballType } from './data/pokeball';
import { Gender } from './data/gender';
import { initMoveAnim, loadMoveAnimAssets } from './data/battle-anims';
import { Status, StatusEffect } from './data/status-effect';
import { tmSpecies } from './data/tms';
import { pokemonEvolutions, pokemonPrevolutions, SpeciesEvolution, SpeciesEvolutionCondition } from './data/pokemon-evolutions';
import { DamagePhase, FaintPhase } from './battle-phases';
import { BattleStat } from './data/battle-stat';
import { BattlerTag, BattlerTagLapseType, BattlerTagType, getBattlerTag } from './data/battler-tag';
import { Species } from './data/species';
import { WeatherType } from './data/weather';
import { TempBattleStat } from './data/temp-battle-stat';
import { WeakenMoveTypeTag } from './data/arena-tag';
import { Biome } from './data/biome';
import { Abilities, Ability, TypeImmunityAttr, abilities, applyPreDefendAbilityAttrs } from './data/ability';

export default abstract class Pokemon extends Phaser.GameObjects.Container {
  public id: integer;
  public name: string;
  public species: PokemonSpecies;
  public formIndex: integer;
  public abilityIndex: integer;
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

  constructor(scene: BattleScene, x: number, y: number, species: PokemonSpecies, level: integer, abilityIndex?: integer, formIndex?: integer, gender?: Gender, shiny?: boolean, dataSource?: Pokemon) {
    super(scene, x, y);

    if (!species.isObtainable() && this.isPlayer())
      throw `Cannot create a player Pokemon for species '${species.name}'`;

    this.name = Utils.toPokemonUpperCase(species.name);
    this.species = species;
    this.battleInfo = this.isPlayer()
      ? new PlayerBattleInfo(scene)
      : new EnemyBattleInfo(scene);
    this.pokeball = dataSource?.pokeball || PokeballType.POKEBALL;
    this.level = level;
    this.abilityIndex = abilityIndex || (species.ability2 ? Utils.randInt(2) : 0);
    this.formIndex = formIndex || 0;
    if (gender !== undefined)
      this.gender = gender;
    if (shiny !== undefined)
      this.shiny = shiny;
    this.exp = dataSource?.exp || getLevelTotalExp(this.level, species.growthRate);
    this.levelExp = dataSource?.levelExp || 0;
    if (dataSource) {
      this.id = dataSource.id;
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
    
      if (this.gender === undefined) {
        if (this.getSpeciesForm().malePercent === null)
          this.gender = Gender.GENDERLESS;
        else {
          const genderChance = (this.id % 256) * 0.390625;
          if (genderChance < this.getSpeciesForm().malePercent)
            this.gender = Gender.MALE;
          else
            this.gender = Gender.FEMALE;
        }
      }

      const rand1 = Utils.binToDec(Utils.decToBin(this.id).substring(0, 16));
      const rand2 = Utils.binToDec(Utils.decToBin(this.id).substring(16, 32));

      const E = this.scene.gameData.trainerId ^ this.scene.gameData.secretId;
      const F = rand1 ^ rand2;

      if (this.shiny === undefined) {
        let shinyThreshold = new Utils.IntegerHolder(32);
        this.scene.applyModifiers(ShinyRateBoosterModifier, true, shinyThreshold);
        console.log(shinyThreshold.value);

        this.shiny = (E ^ F) < shinyThreshold.value;
        if ((E ^ F) < 32)
          console.log('REAL SHINY!!');
        if (this.shiny)
          console.log((E ^ F), shinyThreshold.value);
      }

      this.winCount = 0;
    }

    if (!species.isObtainable())
      this.shiny = false;

    //this.setPipeline(this.scene).spritePipeline);

    this.calculateStats();

    scene.fieldUI.addAt(this.battleInfo, 0);
    
    this.battleInfo.initInfo(this);

    const getSprite = () => {
      const ret = this.scene.add.sprite(0, 0, `pkmn__${this.isPlayer() ? 'back__' : ''}sub`);
      ret.setOrigin(0.5, 1);
      return ret;
    };
    
    const sprite = getSprite();
    const tintSprite = getSprite();

    tintSprite.setVisible(false);

    this.add(sprite);
    this.add(tintSprite);

    this.getSpeciesForm().generateIconAnim(scene, this.gender === Gender.FEMALE, formIndex);

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
          loadMoveAnimAssets(this.scene, moveIds);
          this.getSpeciesForm().loadAssets(this.scene, this.gender === Gender.FEMALE, this.formIndex, this.shiny);
          if (this.isPlayer())
            this.scene.loadAtlas(this.getBattleSpriteKey(), 'pokemon', this.getBattleSpriteAtlasPath());
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
    return this.getSpeciesForm().getSpriteId(this.gender === Gender.FEMALE, this.formIndex, this.shiny);
  }

  getBattleSpriteId(): string {
    return `${this.isPlayer() ? 'back__' : ''}${this.getSpriteId()}`;
  }

  getSpriteKey(): string {
    return this.getSpeciesForm().getSpriteKey(this.gender === Gender.FEMALE, this.formIndex, this.shiny);
  }

  getBattleSpriteKey(): string {
    return `pkmn__${this.getBattleSpriteId()}`;
  }

  getIconId(): string {
    return this.getSpeciesForm().getIconId(this.gender === Gender.FEMALE, this.formIndex);
  }

  getIconKey(): string {
    return `pkmn_icon__${this.getIconId()}`;
  }

  getSpeciesForm(): PokemonSpeciesForm {
    if (!this.species.forms?.length)
      return this.species;
    return this.species.forms[this.formIndex];
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.getAt(0) as Phaser.GameObjects.Sprite;
  }

  getTintSprite(): Phaser.GameObjects.Sprite {
    return !this.maskEnabled
      ? this.getAt(1) as Phaser.GameObjects.Sprite
      : this.maskSprite;
  }

  playAnim(): void{
    this.getSprite().play(this.getBattleSpriteKey());
    this.getTintSprite().play(this.getBattleSpriteKey());
  }

  getBattleStat(stat: Stat): integer {
    if (stat === Stat.HP)
      return this.stats[Stat.HP];
    const battleStat = (stat - 1) as BattleStat;
    const statLevel = new Utils.IntegerHolder(this.summonData.battleStats[battleStat]);
    if (this.isPlayer())
      this.scene.applyModifiers(TempBattleStatBoosterModifier, this.isPlayer(), battleStat as integer as TempBattleStat, statLevel);
    let ret = this.stats[stat] * (Math.max(2, 2 + statLevel.value) / Math.max(2, 2 - statLevel.value));
    if (stat === Stat.SPDEF && this.scene.arena.weather?.weatherType === WeatherType.SANDSTORM)
      ret *= 1.5;
    if (stat === Stat.SPD && this.status && this.status.effect === StatusEffect.PARALYSIS)
      ret >>= 2;
    return ret;
  }

  calculateStats(): void {
    if (!this.stats)
      this.stats = [ 0, 0, 0, 0, 0, 0 ];
    const baseStats = this.getSpeciesForm().baseStats.slice(0);
    this.scene.applyModifiers(PokemonBaseStatModifier, this.isPlayer(), this, baseStats);
    const stats = Utils.getEnumValues(Stat);
    for (let s of stats) {
      const isHp = s === Stat.HP;
      let baseStat = baseStats[s];
      let value = Math.floor(((2 * baseStat + this.ivs[s] + (0 / 4)) * this.level) * 0.01);
      if (isHp) {
        value = Math.min(value + this.level + 10, 99999);
        if (this.hp > value || this.hp === undefined)
          this.hp = value;
        else if (this.hp) {
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

  getTypes(): Type[] {
    const types = [];

    if (this.summonData.types)
      this.summonData.types.forEach(t => types.push(t));
    else {
      const speciesForm = this.getSpeciesForm();
      
      types.push(speciesForm.type1);
      if (speciesForm.type2 !== null)
        types.push(speciesForm.type1);
    }

    if (this.getTag(BattlerTagType.IGNORE_FLYING)) {
      const flyingIndex = types.indexOf(Type.FLYING);
      if (flyingIndex > -1)
        types.splice(flyingIndex, 1);
    }

    if (!types.length)
      types.push(Type.NORMAL);

    return types;
  }

  isOfType(type: Type) {
    return this.getTypes().indexOf(type) > -1;
  }

  getAbility(): Ability {
    return abilities[this.species.getAbility(this.abilityIndex)];
  }

  getAttackMoveEffectiveness(moveType: Type): TypeDamageMultiplier {
    const types = this.getTypes();
    return getTypeDamageMultiplier(moveType, types[0]) * (types.length ? getTypeDamageMultiplier(moveType, types[1]) : 1) as TypeDamageMultiplier;
  }

  getEvolution(): SpeciesEvolution {
    if (!pokemonEvolutions.hasOwnProperty(this.species.speciesId))
      return null;

    const evolutions = pokemonEvolutions[this.species.speciesId];
    for (let e of evolutions) {
      if (!e.item && this.level >= e.level) {
        if (e.condition === null || (e.condition as SpeciesEvolutionCondition).predicate(this))
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
      const move = allMoves[m];
      return move.category !== MoveCategory.STATUS;
    });

    if (attackMovePool.length) {
      const moveIndex = Utils.randInt(attackMovePool.length);
      this.moveset.push(new PokemonMove(attackMovePool[moveIndex], 0, 0));
      console.log(allMoves[attackMovePool[moveIndex]]);
      movePool.splice(movePool.findIndex(m => m === attackMovePool[moveIndex]), 1);
    }

    while (movePool.length && this.moveset.length < 4) {
      const moveIndex = Utils.randInt(movePool.length);
      this.moveset.push(new PokemonMove(movePool[moveIndex], 0, 0));
      console.log(allMoves[movePool[moveIndex]]);
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

  hideInfo(): Promise<void> {
    return new Promise(resolve => {
      if (this.battleInfo.visible) {
        this.scene.tweens.add({
          targets: this.battleInfo,
          x: this.isPlayer() ? '+=150' : '-=150',
          duration: 500,
          ease: 'Sine.easeIn',
          onComplete: () => {
            this.battleInfo.setVisible(false);
            this.battleInfo.setX(this.battleInfo.x - (this.isPlayer() ? 150 : -150));
            resolve();
          }
        });
      } else
        resolve();
    });
  }

  updateInfo(instant?: boolean): Promise<void> {
    return this.battleInfo.updateInfo(this, instant);
  }

  addExp(exp: integer) {
    this.exp += exp;
    while (this.exp >= getLevelTotalExp(this.level + 1, this.getSpeciesForm().growthRate))
      this.level++;
    this.levelExp = this.exp - getLevelTotalExp(this.level, this.getSpeciesForm().growthRate);
  }

  apply(source: Pokemon, battlerMove: PokemonMove): MoveResult {
    let result: MoveResult;
    const move = battlerMove.getMove();
    const moveCategory = move.category;
    let damage = 0;
    switch (moveCategory) {
      case MoveCategory.PHYSICAL:
      case MoveCategory.SPECIAL:
        const isPhysical = moveCategory === MoveCategory.PHYSICAL;
        const cancelled = new Utils.BooleanHolder(false);
        const power = new Utils.NumberHolder(move.power);
        const typeMultiplier = new Utils.NumberHolder(getTypeDamageMultiplier(move.type, this.getSpeciesForm().type1) * (this.getSpeciesForm().type2 !== null ? getTypeDamageMultiplier(move.type, this.getSpeciesForm().type2) : 1));
        const weatherTypeMultiplier = this.scene.arena.getAttackTypeMultiplier(move.type);
        applyPreDefendAbilityAttrs(TypeImmunityAttr, this, source, battlerMove, cancelled, typeMultiplier);

        if (cancelled.value)
          result = MoveResult.NO_EFFECT;
        else {
          applyMoveAttrs(VariablePowerAttr, source, this, move, power);
          this.scene.arena.applyTags(WeakenMoveTypeTag, move.type, power);
          this.scene.applyModifiers(AttackTypeBoosterModifier, source.isPlayer(), source, power);
          const critLevel = new Utils.IntegerHolder(0);
          applyMoveAttrs(HighCritAttr, source, this, move, critLevel);
          this.scene.applyModifiers(TempBattleStatBoosterModifier, source.isPlayer(), TempBattleStat.CRIT, critLevel);
          if (source.getTag(BattlerTagType.CRIT_BOOST))
            critLevel.value += 2;
          const critChance = Math.ceil(16 / Math.pow(2, critLevel.value));
          let isCritical = !source.getTag(BattlerTagType.NO_CRIT) && (critChance === 1 || !Utils.randInt(critChance));
          const sourceAtk = source.getBattleStat(isPhysical ? Stat.ATK : Stat.SPATK);
          const targetDef = this.getBattleStat(isPhysical ? Stat.DEF : Stat.SPDEF);
          const stabMultiplier = source.species.type1 === move.type || (source.species.type2 !== null && source.species.type2 === move.type) ? 1.5 : 1;
          const criticalMultiplier = isCritical ? 2 : 1;
          damage = Math.ceil(((((2 * source.level / 5 + 2) * power.value * sourceAtk / targetDef) / 50) + 2) * stabMultiplier * typeMultiplier.value * weatherTypeMultiplier * ((Utils.randInt(15) + 85) / 100)) * criticalMultiplier;
          if (isPhysical && source.status && source.status.effect === StatusEffect.BURN)
            damage = Math.floor(damage / 2);
          move.getAttrs(HitsTagAttr).map(hta => hta as HitsTagAttr).filter(hta => hta.doubleDamage).forEach(hta => {
            if (this.getTag(hta.tagType))
              damage *= 2;
          });

          const fixedDamage = new Utils.IntegerHolder(0);
          applyMoveAttrs(FixedDamageAttr, source, this, move, fixedDamage);
          if (damage && fixedDamage.value) {
            damage = fixedDamage.value;
            isCritical = false;
            result = MoveResult.EFFECTIVE;
          }

          console.log('damage', damage, move.name, move.power, sourceAtk, targetDef);
          
          if (!result) {
            if (typeMultiplier.value >= 2)
              result = MoveResult.SUPER_EFFECTIVE;
            else if (typeMultiplier.value >= 1)
              result = MoveResult.EFFECTIVE;
            else if (typeMultiplier.value > 0)
              result = MoveResult.NOT_VERY_EFFECTIVE;
            else
              result = MoveResult.NO_EFFECT;
          }

          if (damage) {
            this.scene.unshiftPhase(new DamagePhase(this.scene, this.isPlayer(), result as DamageResult));
            if (isCritical)
              this.scene.queueMessage('A critical hit!');
            this.damage(damage);
            source.turnData.damageDealt += damage;
          }

          switch (result) {
            case MoveResult.SUPER_EFFECTIVE:
              this.scene.queueMessage('It\'s super effective!');
              break;
            case MoveResult.NOT_VERY_EFFECTIVE:
              this.scene.queueMessage('It\'s not very effective!');
              break;
            case MoveResult.NO_EFFECT:
              this.scene.queueMessage(`It doesn\'t affect ${this.name}!`);
              break;
          }
        }
        break;
      case MoveCategory.STATUS:
        result = MoveResult.STATUS;
        break;
    }

    return result;
  }

  damage(damage: integer, preventEndure?: boolean): void {
    if (!this.hp)
      return;

    if (this.hp > 1 && this.hp - damage <= 0 && !preventEndure) {
      const surviveDamage = new Utils.BooleanHolder(false);
      this.scene.applyModifiers(SurviveDamageModifier, this.isPlayer(), this, surviveDamage);
      if (surviveDamage.value)
        damage = this.hp - 1;
    }

    this.hp = Math.max(this.hp - damage, 0);
    if (!this.hp) {
      this.scene.pushPhase(new FaintPhase(this.scene, this.isPlayer()));
      this.resetSummonData();
      (this.isPlayer() ? this.scene.getEnemyPokemon() : this.scene.getPlayerPokemon()).resetBattleSummonData();
    }
  }

  addTag(tagType: BattlerTagType, turnCount?: integer, sourceMove?: Moves, sourceId?: integer): boolean {
    const existingTag = this.getTag(tagType);
    if (existingTag) {
      existingTag.onOverlap(this);
      return false;
    }

    const newTag = getBattlerTag(tagType, turnCount || 0, sourceMove, sourceId);

    if (newTag.canAdd(this)) {
      this.summonData.tags.push(newTag);
      newTag.onAdd(this);

      return true;
    }

    return false;
  }

  getTag(tagType: BattlerTagType | { new(...args: any[]): BattlerTag }): BattlerTag {
    return typeof(tagType) === 'number'
      ? this.summonData.tags.find(t => t.tagType === tagType)
      : this.summonData.tags.find(t => t instanceof tagType);
  }

  findTag(tagFilter: ((tag: BattlerTag) => boolean)) {
    return this.summonData.tags.find(t => tagFilter(t));
  }

  getTags(tagType: BattlerTagType | { new(...args: any[]): BattlerTag }): BattlerTag[] {
    return typeof(tagType) === 'number'
      ? this.summonData.tags.filter(t => t.tagType === tagType)
      : this.summonData.tags.filter(t => t instanceof tagType);
  }

  findTags(tagFilter: ((tag: BattlerTag) => boolean)) {
    return this.summonData.tags.filter(t => tagFilter(t));
  }

  lapseTag(tagType: BattlerTagType): boolean {
    const tags = this.summonData.tags;
    const tag = tags.find(t => t.tagType === tagType);
    if (tag && !(tag.lapse(this, BattlerTagLapseType.CUSTOM))) {
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);
    }
    return !!tag;
  }

  lapseTags(lapseType: BattlerTagLapseType): void {
    const tags = this.summonData.tags;
    tags.filter(t => lapseType === BattlerTagLapseType.FAINT || ((t.lapseType === lapseType) && !(t.lapse(this, lapseType))) || (lapseType === BattlerTagLapseType.TURN_END && t.turnCount < 1)).forEach(t => {
      t.onRemove(this);
      tags.splice(tags.indexOf(t), 1);
    });
  }

  removeTagsBySourceId(sourceId: integer): void {
    const tags = this.summonData.tags;
    tags.filter(t => t.sourceId === sourceId).forEach(t => {
      t.onRemove(this);
      tags.splice(tags.indexOf(t), 1);
    });
  }

  getMoveHistory(): TurnMove[] {
    return this.summonData.moveHistory;
  }

  pushMoveHistory(turnMove: TurnMove) {
    turnMove.turn = this.scene.currentBattle?.turn;
    this.getMoveHistory().push(turnMove);
  }

  getLastXMoves(turnCount?: integer): TurnMove[] {
    const moveHistory = this.getMoveHistory();
    return moveHistory.slice(turnCount >= 0 ? Math.max(moveHistory.length - (turnCount || 1), 0) : 0, moveHistory.length).reverse();
  }

  getMoveQueue(): QueuedMove[] {
    return this.summonData.moveQueue;
  }

  cry(soundConfig?: Phaser.Types.Sound.SoundConfig): integer {
    return this.getSpeciesForm().cry(this.scene, soundConfig);
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
    const delay = Math.max(this.scene.sound.get(key).totalDuration * 50, 25);
    let frameProgress = 0;
    let frameThreshold: number;
    sprite.anims.pause();
    tintSprite.anims.pause();
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
        if (this.isOfType(Type.POISON) || this.isOfType(Type.STEEL))
          return false;
        break;
      case StatusEffect.FREEZE:
        if (this.isOfType(Type.ICE))
          return false;
        break;
      case StatusEffect.BURN:
        if (this.isOfType(Type.FIRE))
          return false;
        break;
    }
    this.status = new Status(effect);
    return true;
  }

  resetStatus(): void {
    const lastStatus = this.status.effect;
    this.status = undefined;
    if (lastStatus === StatusEffect.SLEEP) {
      if (this.getTag(BattlerTagType.NIGHTMARE))
        this.lapseTag(BattlerTagType.NIGHTMARE);
    }
  }

  resetSummonData(): void {
    this.summonData = new PokemonSummonData();
    this.resetBattleSummonData();
  }

  resetBattleSummonData(): void {
    this.battleSummonData = new PokemonBattleSummonData();
    if (this.getTag(BattlerTagType.SEEDED))
      this.lapseTag(BattlerTagType.SEEDED);
  }

  resetTurnData(): void {
    this.turnData = new PokemonTurnData();
  }

  getExpValue(): integer {
    // Logic to factor in victor level has been removed for balancing purposes, so the player doesn't have to focus on EXP maxxing
    return (this.getSpeciesForm().baseExp * this.level) / 5 + 1;
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

export default interface Pokemon {
  scene: BattleScene
}

export class PlayerPokemon extends Pokemon {
  public metBiome: Biome;
  public metLevel: integer;
  public compatibleTms: Moves[];

  constructor(scene: BattleScene, species: PokemonSpecies, level: integer, abilityIndex: integer, formIndex: integer, gender?: Gender, shiny?: boolean, dataSource?: Pokemon) {
    super(scene, 106, 148, species, level, abilityIndex, formIndex, gender, shiny, dataSource);
    
    this.metBiome = scene.arena?.biomeType || Biome.TOWN;
    this.metLevel = level;
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
      this.handleSpecialEvolutions(evolution);
      this.species = getPokemonSpecies(evolution.speciesId);
      this.name = this.species.name.toUpperCase();
      const abilityCount = this.species.getAbilityCount();
      if (this.abilityIndex >= abilityCount) // Shouldn't happen
        this.abilityIndex = abilityCount - 1;
      this.getSpeciesForm().generateIconAnim(this.scene, this.gender === Gender.FEMALE, this.formIndex);
      this.compatibleTms.splice(0, this.compatibleTms.length);
      this.generateCompatibleTms();
      this.scene.gameData.setPokemonSeen(this);
      this.scene.gameData.setPokemonCaught(this);
      this.loadAssets().then(() => {
        this.calculateStats();
        this.updateInfo().then(() => resolve());
      });
    });
  }

  private handleSpecialEvolutions(evolution: SpeciesEvolution) {
    if (this.species.speciesId === Species.NINCADA && evolution.speciesId === Species.NINJASK) {
      const newEvolution = pokemonEvolutions[this.species.speciesId][1];
      if (newEvolution.condition.predicate(this)) {
        const newPokemon = new PlayerPokemon(this.scene, this.species, this.level, this.abilityIndex, this.formIndex, this.gender, this.shiny);
        this.scene.getParty().push(newPokemon);
        newPokemon.evolve(newEvolution);
      }
    }
  }
}

export class EnemyPokemon extends Pokemon {
  public aiType: AiType;

  constructor(scene: BattleScene, species: PokemonSpecies, level: integer) {
    super(scene, -66, 84, species, level, scene.arena.getFormIndex(species));

    let prevolution: Species;
    let speciesId = species.speciesId;
    while ((prevolution = pokemonPrevolutions[speciesId])) {
      const evolution = pokemonEvolutions[prevolution].find(pe => pe.speciesId === speciesId);
      if (evolution.condition?.enforceFunc)
        evolution.condition.enforceFunc(this);
      speciesId = prevolution;
    }

    this.aiType = AiType.SMART_RANDOM;
  }

  getNextMove(): PokemonMove {
    const queuedMove = this.getMoveQueue().length
      ? this.moveset.find(m => m.moveId === this.getMoveQueue()[0].move)
      : null;
    if (queuedMove) {
      if (queuedMove.isUsable(this.getMoveQueue()[0].ignorePP))
        return queuedMove;
      else {
        this.getMoveQueue().shift();
        return this.getNextMove();
      }
    }

    const movePool = this.moveset.filter(m => m.isUsable());
    if (movePool.length) {
      if (movePool.length === 1)
        return movePool[0];
      switch (this.aiType) {
        case AiType.RANDOM:
          return movePool[Utils.randInt(movePool.length)];
        case AiType.SMART_RANDOM:
        case AiType.SMART:
          const target = this.scene.getPlayerPokemon();
          const moveScores = movePool.map(() => 0);
          for (let m in movePool) {
            const pokemonMove = movePool[m];
            const move = pokemonMove.getMove();
            let moveScore = moveScores[m];
            if (move.category === MoveCategory.STATUS)
              moveScore++;
            else {
              const effectiveness = this.getAttackMoveEffectiveness(move.type);
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
    const party = this.scene.getParty();
    let ret: PlayerPokemon = null;

    if (party.length < 6) {
      const newPokemon = new PlayerPokemon(this.scene, this.species, this.level, this.abilityIndex, this.formIndex, this.gender, this.shiny, this);
      party.push(newPokemon);
      ret = newPokemon;
    }

    return ret;
  }
}

export interface TurnMove {
  move: Moves;
  result: MoveResult;
  virtual?: boolean;
  turn?: integer;
}

export interface QueuedMove {
  move: Moves;
  ignorePP?: boolean;
}

export class PokemonSummonData {
  public battleStats: integer[] = [ 0, 0, 0, 0, 0, 0, 0 ];
  public moveHistory: TurnMove[] = [];
  public moveQueue: QueuedMove[] = [];
  public tags: BattlerTag[] = [];
  public types: Type[];
}

export class PokemonBattleSummonData {
  public turnCount: integer = 1;
}

export class PokemonTurnData {
  public flinched: boolean;
  public hitCount: integer;
  public hitsLeft: integer;
  public hitsTotal: integer;
  public damageDealt: integer = 0;
}

export enum AiType {
  RANDOM,
  SMART_RANDOM,
  SMART
};

export enum MoveResult {
  EFFECTIVE = 1,
  SUPER_EFFECTIVE,
  NOT_VERY_EFFECTIVE,
  NO_EFFECT,
  STATUS,
  FAILED,
  MISSED,
  OTHER
};

export type DamageResult = MoveResult.EFFECTIVE | MoveResult.SUPER_EFFECTIVE | MoveResult.NOT_VERY_EFFECTIVE | MoveResult.OTHER;

export class PokemonMove {
  public moveId: Moves;
  public ppUsed: integer;
  public ppUp: integer;
  public virtual: boolean;
  public disableTurns: integer;

  constructor(moveId: Moves, ppUsed?: integer, ppUp?: integer, virtual?: boolean) {
    this.moveId = moveId;
    this.ppUsed = ppUsed || 0;
    this.ppUp = ppUp || 0;
    this.virtual = !!virtual;
    this.disableTurns = 0;
  }

  isUsable(ignorePp?: boolean): boolean {
    if (this.isDisabled())
      return false;
    return ignorePp || this.ppUsed < this.getMove().pp + this.ppUp || this.getMove().pp === -1;
  }

  isDisabled(): boolean {
    return !!this.disableTurns;
  }

  getMove(): Move {
    return allMoves[this.moveId];
  }

  getName(): string {
    return this.getMove().name;
  }
}