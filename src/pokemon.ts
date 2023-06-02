import Phaser from 'phaser';
import BattleScene from './battle-scene';
import BattleInfo, { PlayerBattleInfo, EnemyBattleInfo } from './ui/battle-info';
import Move, { StatChangeAttr, HighCritAttr, HitsTagAttr, applyMoveAttrs, FixedDamageAttr, VariablePowerAttr, Moves, allMoves, MoveCategory, TypelessAttr, CritOnlyAttr, getMoveTargets, AttackMove, AddBattlerTagAttr } from "./data/move";
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
import { BattlerTag, BattlerTagLapseType, BattlerTagType, TypeBoostTag, getBattlerTag } from './data/battler-tag';
import { Species } from './data/species';
import { WeatherType } from './data/weather';
import { TempBattleStat } from './data/temp-battle-stat';
import { ArenaTagType, WeakenMoveTypeTag } from './data/arena-tag';
import { Biome } from './data/biome';
import { Abilities, Ability, BattleStatMultiplierAbAttr, BlockCritAbAttr, NonSuperEffectiveImmunityAbAttr, PreApplyBattlerTagAbAttr, StatusEffectImmunityAbAttr, TypeImmunityAbAttr, VariableMovePowerAbAttr, abilities, applyBattleStatMultiplierAbAttrs, applyPreApplyBattlerTagAbAttrs, applyPreAttackAbAttrs, applyPreDefendAbAttrs, applyPreSetStatusAbAttrs } from './data/ability';
import PokemonData from './system/pokemon-data';
import { BattlerIndex } from './battle';

export enum FieldPosition {
  CENTER,
  LEFT,
  RIGHT
}

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

  public fieldPosition: FieldPosition;

  public maskEnabled: boolean;
  public maskSprite: Phaser.GameObjects.Sprite;

  private shinySparkle: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, x: number, y: number, species: PokemonSpecies, level: integer, abilityIndex?: integer, formIndex?: integer, gender?: Gender, shiny?: boolean, dataSource?: Pokemon | PokemonData) {
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

    this.fieldPosition = FieldPosition.CENTER;

    scene.fieldUI.add(this.battleInfo);
    
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

  isFainted(checkStatus?: boolean): boolean {
    return !this.hp && (!checkStatus || this.status?.effect === StatusEffect.FAINT);
  }

  isActive(onField?: boolean): boolean {
    return !this.isFainted() && !!this.scene && (!onField || this.scene.field.getIndex(this) > -1);
  }

  abstract isPlayer(): boolean;

  abstract getFieldIndex(): integer;

  abstract getBattlerIndex(): BattlerIndex;

  loadAssets(): Promise<void> {
    return new Promise(resolve => {
      const moveIds = this.getMoveset().map(m => m.getMove().id);
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

  playAnim(): void {
    this.getSprite().play(this.getBattleSpriteKey());
    this.getTintSprite().play(this.getBattleSpriteKey());
  }

  getFieldPositionOffset(): [ number, number ] {
    switch (this.fieldPosition) {
      case FieldPosition.CENTER:
        return [ 0, 0 ];
      case FieldPosition.LEFT:
        return [ -32, -8 ];
      case FieldPosition.RIGHT:
        return [ 32, 0 ];
    }
  }

  setFieldPosition(fieldPosition: FieldPosition, duration?: integer): Promise<void> {
    return new Promise(resolve => {
      if (fieldPosition === this.fieldPosition) {
        resolve();
        return;
      }

      const initialOffset = this.getFieldPositionOffset();

      this.fieldPosition = fieldPosition;

      this.battleInfo.setMini(fieldPosition !== FieldPosition.CENTER);
      this.battleInfo.setOffset(fieldPosition === FieldPosition.RIGHT);

      const newOffset = this.getFieldPositionOffset();

      let relX = newOffset[0] - initialOffset[0];
      let relY = newOffset[1] - initialOffset[1];

      if (duration) {
        this.scene.tweens.add({
          targets: this,
          x: (_target, _key, value: number) => value + relX,
          y: (_target, _key, value: number) => value + relY,
          duration: duration,
          ease: 'Sine.easeOut',
          onComplete: () => resolve()
        });
      } else {
        this.x += relX;
        this.y += relY;
      }
    });
  }

  getBattleStat(stat: Stat): integer {
    if (stat === Stat.HP)
      return this.stats[Stat.HP];
    const battleStat = (stat - 1) as BattleStat;
    const statLevel = new Utils.IntegerHolder(this.summonData.battleStats[battleStat]);
    if (this.isPlayer())
      this.scene.applyModifiers(TempBattleStatBoosterModifier, this.isPlayer(), battleStat as integer as TempBattleStat, statLevel);
    const statValue = new Utils.NumberHolder(this.stats[stat]);
    applyBattleStatMultiplierAbAttrs(BattleStatMultiplierAbAttr, this, battleStat, statValue);
    let ret = statValue.value * (Math.max(2, 2 + statLevel.value) / Math.max(2, 2 - statLevel.value));
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
        if (this.getAbility().hasAttr(NonSuperEffectiveImmunityAbAttr))
          value = 1;
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

  getMoveset(): PokemonMove[] {
    if (this.summonData?.moveset)
      return this.summonData.moveset;
    return this.moveset;
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

    if (this.getTag(BattlerTagType.IGNORE_FLYING) || this.scene.arena.getTag(ArenaTagType.GRAVITY)) {
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

  canApplyAbility(): boolean {
    return this.hp && !this.getAbility().conditions.find(condition => !condition(this));
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
  
  setMove(moveIndex: integer, moveId: Moves): void {
    const move = moveId ? new PokemonMove(moveId) : null;
    this.moveset[moveIndex] = move;
    if (this.summonData?.moveset)
      this.summonData.moveset[moveIndex] = move;
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

  trySelectMove(moveIndex: integer, ignorePp?: boolean): boolean {
    const move = this.getMoveset().length > moveIndex
      ? this.getMoveset()[moveIndex]
      : null;
    return move?.isUsable(ignorePp);
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

  getOpponent(targetIndex: integer): Pokemon {
    const ret = this.getOpponents()[targetIndex];
    if (ret.summonData)
      return ret;
    return null;
  }

  getOpponents(): Pokemon[] {
    return ((this.isPlayer() ? this.scene.getEnemyField() : this.scene.getPlayerField()) as Pokemon[]).filter(p => p.isActive());
  }

  getOpponentDescriptor(): string {
    const opponents = this.getOpponents();
    if (opponents.length === 1)
      return opponents[0].name;
    return this.isPlayer() ? 'the opposing team' : 'your team';
  }

  getAlly(): Pokemon {
    return (this.isPlayer() ? this.scene.getPlayerField() : this.scene.getEnemyField())[this.getFieldIndex() ? 0 : 1];
  }

  apply(source: Pokemon, battlerMove: PokemonMove): HitResult {
    let result: HitResult;
    const move = battlerMove.getMove();
    const moveCategory = move.category;
    let damage = 0;
    switch (moveCategory) {
      case MoveCategory.PHYSICAL:
      case MoveCategory.SPECIAL:
        const isPhysical = moveCategory === MoveCategory.PHYSICAL;
        const typeless = !!move.getAttrs(TypelessAttr).length
        const cancelled = new Utils.BooleanHolder(false);
        const power = new Utils.NumberHolder(move.power);
        const typeMultiplier = new Utils.NumberHolder(!typeless
              ? getTypeDamageMultiplier(move.type, this.getSpeciesForm().type1) * (this.getSpeciesForm().type2 !== null ? getTypeDamageMultiplier(move.type, this.getSpeciesForm().type2) : 1)
              : 1);
        if (typeless)
          typeMultiplier.value = 1;
        applyPreAttackAbAttrs(VariableMovePowerAbAttr, source, this, battlerMove, power);

        if (!typeless)
          applyPreDefendAbAttrs(TypeImmunityAbAttr, this, source, battlerMove, cancelled, typeMultiplier);

        if (cancelled.value)
          result = HitResult.NO_EFFECT;
        else {
          if (source.findTag(t => t instanceof TypeBoostTag && (t as TypeBoostTag).boostedType === move.type))
            power.value *= 1.5;
          const weatherTypeMultiplier = this.scene.arena.getAttackTypeMultiplier(move.type);
          applyMoveAttrs(VariablePowerAttr, source, this, move, power);
          if (!typeless) {
            this.scene.arena.applyTags(WeakenMoveTypeTag, move.type, power);
            this.scene.applyModifiers(AttackTypeBoosterModifier, source.isPlayer(), source, power);
          }
          let isCritical: boolean;
          const critOnly = new Utils.BooleanHolder(false);
          applyMoveAttrs(CritOnlyAttr, source, this, move, critOnly);
          if (critOnly.value)
            isCritical = true;
          else {
            const critLevel = new Utils.IntegerHolder(0);
            applyMoveAttrs(HighCritAttr, source, this, move, critLevel);
            this.scene.applyModifiers(TempBattleStatBoosterModifier, source.isPlayer(), TempBattleStat.CRIT, critLevel);
            if (source.getTag(BattlerTagType.CRIT_BOOST))
              critLevel.value += 2;
            const critChance = Math.ceil(16 / Math.pow(2, critLevel.value));
            isCritical = !source.getTag(BattlerTagType.NO_CRIT) && !(this.getAbility().hasAttr(BlockCritAbAttr)) && (critChance === 1 || !Utils.randInt(critChance));
          }
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
            result = HitResult.EFFECTIVE;
          }

          console.log('damage', damage, move.name, move.power, sourceAtk, targetDef);
          
          if (!result) {
            if (typeMultiplier.value >= 2)
              result = HitResult.SUPER_EFFECTIVE;
            else if (typeMultiplier.value >= 1)
              result = HitResult.EFFECTIVE;
            else if (typeMultiplier.value > 0)
              result = HitResult.NOT_VERY_EFFECTIVE;
            else
              result = HitResult.NO_EFFECT;
          }

          if (damage) {
            this.scene.unshiftPhase(new DamagePhase(this.scene, this.getBattlerIndex(), result as DamageResult));
            if (isCritical)
              this.scene.queueMessage('A critical hit!');
            this.scene.setPhaseQueueSplice();
            this.damage(damage);
            source.turnData.damageDealt += damage;
            this.turnData.attacksReceived.unshift({ move: move.id, result: result as DamageResult, damage: damage, sourceId: source.id });
          }

          switch (result) {
            case HitResult.SUPER_EFFECTIVE:
              this.scene.queueMessage('It\'s super effective!');
              break;
            case HitResult.NOT_VERY_EFFECTIVE:
              this.scene.queueMessage('It\'s not very effective!');
              break;
            case HitResult.NO_EFFECT:
              this.scene.queueMessage(`It doesn\'t affect ${this.name}!`);
              break;
          }

          if (damage)
            this.scene.clearPhaseQueueSplice();
        }
        break;
      case MoveCategory.STATUS:
        result = HitResult.STATUS;
        break;
    }

    return result;
  }

  damage(damage: integer, preventEndure?: boolean): void {
    if (this.isFainted())
      return;

    if (this.hp > 1 && this.hp - damage <= 0 && !preventEndure) {
      const surviveDamage = new Utils.BooleanHolder(false);
      this.scene.applyModifiers(SurviveDamageModifier, this.isPlayer(), this, surviveDamage);
      if (surviveDamage.value)
        damage = this.hp - 1;
    }

    this.hp = Math.max(this.hp - damage, 0);
    if (this.isFainted()) {
      this.scene.unshiftPhase(new FaintPhase(this.scene, this.getBattlerIndex()));
      this.resetSummonData();
    }
  }

  addTag(tagType: BattlerTagType, turnCount?: integer, sourceMove?: Moves, sourceId?: integer): boolean {
    const existingTag = this.getTag(tagType);
    if (existingTag) {
      existingTag.onOverlap(this);
      return false;
    }

    const newTag = getBattlerTag(tagType, turnCount || 0, sourceMove, sourceId);

    const cancelled = new Utils.BooleanHolder(false);
    applyPreApplyBattlerTagAbAttrs(PreApplyBattlerTagAbAttr, this, newTag, cancelled);

    if (!cancelled.value && newTag.canAdd(this)) {
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

  transferTagsBySourceId(sourceId: integer, newSourceId: integer): void {
    const tags = this.summonData.tags;
    tags.filter(t => t.sourceId === sourceId).forEach(t => t.sourceId = newSourceId);
  }

  transferSummon(source: Pokemon): void {
    const battleStats = Utils.getEnumValues(BattleStat);
    for (let stat of battleStats)
      this.summonData.battleStats[stat] = source.summonData.battleStats[stat];
    for (let tag of source.summonData.tags)
      this.summonData.tags.push(tag);
  }

  getMoveHistory(): TurnMove[] {
    return this.battleSummonData.moveHistory;
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

  isOppositeGender(pokemon: Pokemon): boolean {
    return this.gender !== Gender.GENDERLESS && pokemon.gender === (this.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE);
  }

  trySetStatus(effect: StatusEffect): boolean {
    if (this.status && effect !== StatusEffect.FAINT)
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

    const cancelled = new Utils.BooleanHolder(false);
    applyPreSetStatusAbAttrs(StatusEffectImmunityAbAttr, this, effect, cancelled);

    if (cancelled.value)
      return false;

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

  constructor(scene: BattleScene, species: PokemonSpecies, level: integer, abilityIndex: integer, formIndex: integer, gender?: Gender, shiny?: boolean, dataSource?: Pokemon | PokemonData) {
    super(scene, 106, 148, species, level, abilityIndex, formIndex, gender, shiny, dataSource);
    
    this.metBiome = scene.arena?.biomeType || Biome.TOWN;
    this.metLevel = level;
    this.generateCompatibleTms();
  }

  isPlayer(): boolean {
    return true;
  }

  getFieldIndex(): integer {
    return this.scene.getPlayerField().indexOf(this);
  }

  getBattlerIndex(): BattlerIndex {
    return this.getFieldIndex();
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

  constructor(scene: BattleScene, species: PokemonSpecies, level: integer, dataSource?: PokemonData) {
    super(scene, -66, 84, species, level, dataSource?.abilityIndex, dataSource ? dataSource.formIndex : scene.arena.getFormIndex(species),
      dataSource?.gender, dataSource?.shiny, dataSource);

    if (!dataSource) {
      let prevolution: Species;
      let speciesId = species.speciesId;
      while ((prevolution = pokemonPrevolutions[speciesId])) {
        const evolution = pokemonEvolutions[prevolution].find(pe => pe.speciesId === speciesId);
        if (evolution.condition?.enforceFunc)
          evolution.condition.enforceFunc(this);
        speciesId = prevolution;
      }
    }

    this.aiType = AiType.SMART_RANDOM;
  }

  generateAndPopulateMoveset(): void {
    switch (true) {
      case (this.species.speciesId === Species.ETERNATUS):
        this.moveset = [
          new PokemonMove(Moves.DYNAMAX_CANNON),
          new PokemonMove(Moves.CROSS_POISON),
          new PokemonMove(Moves.DRAGON_DANCE),
          new PokemonMove(Moves.RECOVER)
        ];
      break;
      default:
        super.generateAndPopulateMoveset();
        break;
    }
  }

  getNextMove(): QueuedMove {
    const queuedMove = this.getMoveQueue().length
      ? this.getMoveset().find(m => m.moveId === this.getMoveQueue()[0].move)
      : null;
    if (queuedMove) {
      if (queuedMove.isUsable(this.getMoveQueue()[0].ignorePP))
        return { move: queuedMove.moveId, targets: this.getMoveQueue()[0].targets, ignorePP: this.getMoveQueue()[0].ignorePP };
      else {
        this.getMoveQueue().shift();
        return this.getNextMove();
      }
    }

    const movePool = this.getMoveset().filter(m => m.isUsable());
    if (movePool.length) {
      if (movePool.length === 1)
        return { move: movePool[0].moveId, targets: this.getNextTargets(movePool[0].moveId) };
      switch (this.aiType) {
        case AiType.RANDOM:
          const moveId = movePool[Utils.randInt(movePool.length)].moveId;
          return { move: moveId, targets: this.getNextTargets(moveId) };
        case AiType.SMART_RANDOM:
        case AiType.SMART:
          const moveScores = movePool.map(() => 0);
          const moveTargets = Object.fromEntries(movePool.map(m => [ m.moveId, this.getNextTargets(m.moveId) ]));
          for (let m in movePool) {
            const pokemonMove = movePool[m];
            const move = pokemonMove.getMove();
            let moveScore = moveScores[m];

            for (let mt of moveTargets[move.id]) {
              const target = this.scene.getField()[mt];
              moveScore += move.getUserBenefitScore(this, target, move) + move.getTargetBenefitScore(this, target, move) * (mt < BattlerIndex.ENEMY === this.isPlayer() ? 1 : -1);
            }

            moveScore /= moveTargets[move.id].length

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
          return { move: sortedMovePool[r].moveId, targets: moveTargets[sortedMovePool[r].moveId] };
      }
    }

    return { move: Moves.STRUGGLE, targets: this.getNextTargets(Moves.STRUGGLE) };
  }

  getNextTargets(moveId: Moves): BattlerIndex[] {
    const moveTargets = getMoveTargets(this, moveId);
    const targets = this.scene.getField().filter(p => p?.isActive(true) && moveTargets.targets.indexOf(p.getBattlerIndex()) > -1);
    if (moveTargets.multiple)
      return targets.map(p => p.getBattlerIndex());

    const move = allMoves[moveId];

    let benefitScores = targets
      .map(p => [ p.getBattlerIndex(), move.getTargetBenefitScore(this, p, move) * (p.isPlayer() === this.isPlayer() ? 1 : -1) ]);

    const sortedBenefitScores = benefitScores.slice(0);
    sortedBenefitScores.sort((a, b) => {
      const scoreA = a[1];
      const scoreB = b[1];
      return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
    });

    // TODO: Add some randomness

    if (!sortedBenefitScores.length)
      return [];

    return [ sortedBenefitScores[0][0] ];
  }

  isPlayer() {
    return false;
  }

  getFieldIndex(): integer {
    return this.scene.getEnemyField().indexOf(this);
  }

  getBattlerIndex(): BattlerIndex {
    return BattlerIndex.ENEMY + this.getFieldIndex();
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
  targets?: BattlerIndex[];
  result: MoveResult;
  virtual?: boolean;
  turn?: integer;
}

export interface QueuedMove {
  move: Moves;
  targets: BattlerIndex[];
  ignorePP?: boolean;
}

export interface AttackMoveResult {
  move: Moves;
  result: DamageResult;
  damage: integer;
  sourceId: integer;
}

export class PokemonSummonData {
  public battleStats: integer[] = [ 0, 0, 0, 0, 0, 0, 0 ];
  public moveQueue: QueuedMove[] = [];
  public tags: BattlerTag[] = [];
  public moveset: PokemonMove[];
  public types: Type[];
}

export class PokemonBattleSummonData {
  public turnCount: integer = 1;
  public moveHistory: TurnMove[] = [];
}

export class PokemonTurnData {
  public flinched: boolean;
  public hitCount: integer;
  public hitsLeft: integer;
  public damageDealt: integer = 0;
  public attacksReceived: AttackMoveResult[] = [];
}

export enum AiType {
  RANDOM,
  SMART_RANDOM,
  SMART
}

export enum MoveResult {
  PENDING,
  SUCCESS,
  FAIL,
  MISS,
  OTHER
}

export enum HitResult {
  EFFECTIVE = 1,
  SUPER_EFFECTIVE,
  NOT_VERY_EFFECTIVE,
  NO_EFFECT,
  STATUS,
  FAIL,
  MISS,
  OTHER
}

export type DamageResult = HitResult.EFFECTIVE | HitResult.SUPER_EFFECTIVE | HitResult.NOT_VERY_EFFECTIVE | HitResult.OTHER;

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

  getPpRatio(): number {
    return 1 - (this.ppUsed / (this.getMove().pp + this.ppUp));
  }

  getName(): string {
    return this.getMove().name;
  }
}