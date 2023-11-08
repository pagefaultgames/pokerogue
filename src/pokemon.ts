import Phaser from 'phaser';
import BattleScene, { AnySound } from './battle-scene';
import BattleInfo, { PlayerBattleInfo, EnemyBattleInfo } from './ui/battle-info';
import Move, { HighCritAttr, HitsTagAttr, applyMoveAttrs, FixedDamageAttr, VariablePowerAttr, Moves, allMoves, MoveCategory, TypelessAttr, CritOnlyAttr, getMoveTargets, AttackMove, AddBattlerTagAttr, OneHitKOAttr } from "./data/move";
import { default as PokemonSpecies, PokemonSpeciesForm, getPokemonSpecies } from './data/pokemon-species';
import * as Utils from './utils';
import { Type, TypeDamageMultiplier, getTypeDamageMultiplier } from './data/type';
import { getLevelTotalExp } from './data/exp';
import { Stat } from './data/pokemon-stat';
import { AttackTypeBoosterModifier, EnemyDamageBoosterModifier, EnemyDamageReducerModifier, HiddenAbilityRateBoosterModifier, PokemonBaseStatModifier, PokemonHeldItemModifier, ShinyRateBoosterModifier, SurviveDamageModifier, TempBattleStatBoosterModifier } from './modifier/modifier';
import { PokeballType } from './data/pokeball';
import { Gender } from './data/gender';
import { initMoveAnim, loadMoveAnimAssets } from './data/battle-anims';
import { Status, StatusEffect } from './data/status-effect';
import { tmSpecies } from './data/tms';
import { pokemonEvolutions, pokemonPrevolutions, SpeciesEvolution, SpeciesEvolutionCondition } from './data/pokemon-evolutions';
import { DamagePhase, FaintPhase, SwitchSummonPhase } from './battle-phases';
import { BattleStat } from './data/battle-stat';
import { BattlerTag, BattlerTagLapseType, BattlerTagType, TypeBoostTag, getBattlerTag } from './data/battler-tag';
import { Species } from './data/species';
import { WeatherType } from './data/weather';
import { TempBattleStat } from './data/temp-battle-stat';
import { ArenaTagType, WeakenMoveTypeTag } from './data/arena-tag';
import { Biome } from './data/biome';
import { Abilities, Ability, BattleStatMultiplierAbAttr, BlockCritAbAttr, IgnoreOpponentStatChangesAbAttr, NonSuperEffectiveImmunityAbAttr, PreApplyBattlerTagAbAttr, StabBoostAbAttr, StatusEffectImmunityAbAttr, TypeImmunityAbAttr, VariableMovePowerAbAttr, abilities, applyAbAttrs, applyBattleStatMultiplierAbAttrs, applyPostDefendAbAttrs, applyPreApplyBattlerTagAbAttrs, applyPreAttackAbAttrs, applyPreDefendAbAttrs, applyPreSetStatusAbAttrs } from './data/ability';
import PokemonData from './system/pokemon-data';
import { BattlerIndex } from './battle';
import { Mode } from './ui/ui';
import PartyUiHandler, { PartyOption, PartyUiMode } from './ui/party-ui-handler';
import SoundFade from 'phaser3-rex-plugins/plugins/soundfade';
import { GameMode } from './game-mode';
import { pokemonFormLevelMoves } from './data/pokemon-level-moves';

export enum FieldPosition {
  CENTER,
  LEFT,
  RIGHT
}

const ABILITY_OVERRIDE = Abilities.NONE;
const MOVE_OVERRIDE = Moves.NONE;

const OPP_ABILITY_OVERRIDE = Abilities.NONE;
const OPP_MOVE_OVERRIDE = Moves.NONE;

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
  public pokerus: boolean;

  public fusionSpecies: PokemonSpecies;
  public fusionFormIndex: integer;
  public fusionAbilityIndex: integer;
  public fusionShiny: boolean;
  public fusionGender: Gender;

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

    const hiddenAbilityChance = new Utils.IntegerHolder(256);
    if (!this.hasTrainer())
      this.scene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);

    const hasHiddenAbility = !Utils.randSeedInt(hiddenAbilityChance.value);
    const randAbilityIndex = Utils.randSeedInt(2);

    this.name = species.name;
    this.species = species;
    this.battleInfo = this.isPlayer()
      ? new PlayerBattleInfo(scene)
      : new EnemyBattleInfo(scene);
    this.pokeball = dataSource?.pokeball || PokeballType.POKEBALL;
    this.level = level;
    this.abilityIndex = abilityIndex || (species.abilityHidden && hasHiddenAbility ? species.ability2 ? 2 : 1 : species.ability2 ? randAbilityIndex : 0);
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
      this.pokerus = !!dataSource.pokerus;
      this.fusionSpecies = dataSource.fusionSpecies instanceof PokemonSpecies ? dataSource.fusionSpecies : getPokemonSpecies(dataSource.fusionSpecies);
      this.fusionFormIndex = dataSource.fusionFormIndex;
      this.fusionAbilityIndex = dataSource.fusionAbilityIndex;
      this.fusionShiny = dataSource.fusionShiny;
      this.fusionGender = dataSource.fusionGender;
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

      if (this.shiny === undefined)
        this.trySetShiny();

      this.winCount = 0;
      this.pokerus = false;

      if (scene.gameMode === GameMode.SPLICED_ENDLESS)
        this.generateFusionSpecies();
    }

    if (!species.isObtainable())
      this.shiny = false;

    this.calculateStats();

    this.fieldPosition = FieldPosition.CENTER;

    scene.fieldUI.add(this.battleInfo);
    
    this.battleInfo.initInfo(this);

    const getSprite = (hasShadow?: boolean) => {
      const ret = this.scene.add.sprite(0, 0, `pkmn__${this.isPlayer() ? 'back__' : ''}sub`);
      ret.setOrigin(0.5, 1);
      ret.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: !!hasShadow });
      return ret;
    };
    
    const sprite = getSprite(true);
    const tintSprite = getSprite();

    tintSprite.setVisible(false);

    this.add(sprite);
    this.add(tintSprite);

    this.getSpeciesForm().generateIconAnim(scene, this.getGender() === Gender.FEMALE, formIndex);

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

  isOnField(): boolean {
    if (!this.scene)
      return false;
    return this.scene.field.getIndex(this) > -1;
  }

  isFainted(checkStatus?: boolean): boolean {
    return !this.hp && (!checkStatus || this.status?.effect === StatusEffect.FAINT);
  }

  isActive(onField?: boolean): boolean {
    if (!this.scene)
      return false;
    return !this.isFainted() && !!this.scene && (!onField || this.isOnField());
  }

  abstract isPlayer(): boolean;

  abstract hasTrainer(): boolean;

  abstract getFieldIndex(): integer;

  abstract getBattlerIndex(): BattlerIndex;

  loadAssets(): Promise<void> {
    return new Promise(resolve => {
      const moveIds = this.getMoveset().map(m => m.getMove().id);
      Promise.allSettled(moveIds.map(m => initMoveAnim(m)))
        .then(() => {
          loadMoveAnimAssets(this.scene, moveIds);
          this.getSpeciesForm().loadAssets(this.scene, this.getGender() === Gender.FEMALE, this.formIndex, this.shiny);
          if (this.fusionSpecies)
            this.getFusionSpeciesForm().loadAssets(this.scene, this.getGender() === Gender.FEMALE, this.fusionFormIndex, this.shiny);
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

  getSpriteAtlasPath(ignoreOverride?: boolean): string {
    return this.getSpriteId(ignoreOverride).replace(/\_{2}/g, '/');
  }

  getBattleSpriteAtlasPath(ignoreOverride?: boolean): string {
    return this.getBattleSpriteId(ignoreOverride).replace(/\_{2}/g, '/');
  }

  getSpriteId(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getSpriteId(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex, this.shiny);
  }

  getBattleSpriteId(ignoreOverride?: boolean): string {
    return `${this.isPlayer() ? 'back__' : ''}${this.getSpriteId(ignoreOverride)}`;
  }

  getSpriteKey(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getSpriteKey(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex, this.shiny);
  }

  getBattleSpriteKey(ignoreOverride?: boolean): string {
    return `pkmn__${this.getBattleSpriteId(ignoreOverride)}`;
  }

  getIconAtlasKey(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getIconAtlasKey(this.formIndex);
  }

  getIconId(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getIconId(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex);
  }

  getIconKey(ignoreOverride?: boolean): string {
    return `pkmn_icon__${this.getIconId(ignoreOverride)}`;
  }

  getSpeciesForm(ignoreOverride?: boolean): PokemonSpeciesForm {
    if (!ignoreOverride && this.summonData?.speciesForm)
      return this.summonData.speciesForm;
    if (!this.species.forms?.length)
      return this.species;
    return this.species.forms[this.formIndex];
  }

  getFusionSpeciesForm(): PokemonSpeciesForm {
    if (!this.fusionSpecies.forms?.length || this.fusionFormIndex >= this.fusionSpecies.forms.length)
      return this.fusionSpecies;
    return this.fusionSpecies.forms[this.fusionFormIndex];
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

  getStat(stat: Stat): integer {
    return this.stats[stat];
  }

  getBattleStat(stat: Stat, opponent?: Pokemon): integer {
    if (stat === Stat.HP)
      return this.getStat(Stat.HP);
    const battleStat = (stat - 1) as BattleStat;
    const statLevel = new Utils.IntegerHolder(this.summonData.battleStats[battleStat]);
    if (opponent)
      applyAbAttrs(IgnoreOpponentStatChangesAbAttr, opponent, null, statLevel);
    if (this.isPlayer())
      this.scene.applyModifiers(TempBattleStatBoosterModifier, this.isPlayer(), battleStat as integer as TempBattleStat, statLevel);
    const statValue = new Utils.NumberHolder(this.getStat(stat));
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
    if (this.fusionSpecies) {
      const fusionBaseStats = this.getFusionSpeciesForm().baseStats;
      for (let s = 0; s < this.stats.length; s++)
        baseStats[s] = Math.ceil((baseStats[s] + fusionBaseStats[s]) / 2);
    }
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
    return this.getStat(Stat.HP);
  }

  getInverseHp(): integer {
    return this.getMaxHp() - this.hp;
  }

  getHpRatio(): number {
    return Math.floor((this.hp / this.getMaxHp()) * 100) / 100;
  }

  getGender(ignoreOverride?: boolean): Gender {
    if (!ignoreOverride && this.summonData?.gender !== undefined)
      return this.summonData.gender;
    return this.gender;
  }

  isShiny(): boolean {
    return this.shiny || (this.fusionSpecies && this.fusionShiny);
  }

  getMoveset(ignoreOverride?: boolean): PokemonMove[] {
    if (!ignoreOverride && this.summonData?.moveset)
      return this.summonData.moveset;
    return this.moveset;
  }

  getLearnableLevelMoves(): Moves[] {
    return this.getLevelMoves(1).filter(lm => !this.moveset.filter(m => m.moveId === lm).length);
  }

  getTypes(ignoreOverride?: boolean): Type[] {
    const types = [];

    if (!ignoreOverride && this.summonData?.types)
      this.summonData.types.forEach(t => types.push(t));
    else {
      const speciesForm = this.getSpeciesForm();
      
      types.push(speciesForm.type1);
      if (speciesForm.type2 !== null)
        types.push(speciesForm.type2);
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
    if (ABILITY_OVERRIDE && this.isPlayer())
      return abilities[ABILITY_OVERRIDE];
    if (OPP_ABILITY_OVERRIDE && !this.isPlayer())
      return abilities[OPP_ABILITY_OVERRIDE];
    if (this.fusionSpecies)
      return abilities[this.getFusionSpeciesForm().getAbility(this.fusionAbilityIndex)];
    return abilities[this.getSpeciesForm().getAbility(this.abilityIndex)];
  }

  canApplyAbility(): boolean {
    return this.hp && !this.getAbility().conditions.find(condition => !condition(this));
  }

  getAttackMoveEffectiveness(moveType: Type): TypeDamageMultiplier {
    const types = this.getTypes();
    return getTypeDamageMultiplier(moveType, types[0]) * (types.length > 1 ? getTypeDamageMultiplier(moveType, types[1]) : 1) as TypeDamageMultiplier;
  }

  getMatchupScore(pokemon: Pokemon): number {
    const types = this.getTypes();
    const enemyTypes = pokemon.getTypes();
    let atkScore = pokemon.getAttackMoveEffectiveness(types[0]);
    let defScore = 1 / this.getAttackMoveEffectiveness(enemyTypes[0]);
    if (types.length > 1)
      atkScore *= pokemon.getAttackMoveEffectiveness(types[1]);
    if (enemyTypes.length > 1)
      defScore *= (1 / this.getAttackMoveEffectiveness(enemyTypes[1]));
    return (atkScore + defScore) * (this.getHpRatio() + (1 - pokemon.getHpRatio()));
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
    const levelMoves = this.getSpeciesForm().getLevelMoves();
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

  trySetShiny(): boolean {
    const rand1 = Utils.binToDec(Utils.decToBin(this.id).substring(0, 16));
    const rand2 = Utils.binToDec(Utils.decToBin(this.id).substring(16, 32));

    const E = this.scene.gameData.trainerId ^ this.scene.gameData.secretId;
    const F = rand1 ^ rand2;

    let shinyThreshold = new Utils.IntegerHolder(32);
    if (!this.hasTrainer()) {
      this.scene.applyModifiers(ShinyRateBoosterModifier, true, shinyThreshold);
      console.log(shinyThreshold.value);
    }

    this.shiny = (E ^ F) < shinyThreshold.value;
    if ((E ^ F) < 32)
      console.log('REAL SHINY!!');

    return this.shiny;
  }

  generateFusionSpecies(forStarter?: boolean): void {
    const hiddenAbilityChance = new Utils.IntegerHolder(256);
    if (!this.hasTrainer())
      this.scene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);

    const hasHiddenAbility = !Utils.randSeedInt(hiddenAbilityChance.value);
    const randAbilityIndex = Utils.randSeedInt(2);

    const filter = !forStarter ? this.species.getCompatibleFusionSpeciesFilter()
    : species => {
      return pokemonEvolutions.hasOwnProperty(species.speciesId)
      && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
      && !species.pseudoLegendary
      && !species.legendary
      && !species.mythical
    };
   
    this.fusionSpecies = this.scene.randomSpecies(this.scene.currentBattle?.waveIndex || 0, this.level, false, filter, true);
    this.fusionAbilityIndex = (this.fusionSpecies.abilityHidden && hasHiddenAbility ? this.fusionSpecies.ability2 ? 2 : 1 : this.fusionSpecies.ability2 ? randAbilityIndex : 0);
    this.fusionFormIndex = this.scene.getSpeciesFormIndex(this.fusionSpecies);
    this.fusionShiny = this.shiny;
    
    if (this.getFusionSpeciesForm().malePercent === null)
      this.fusionGender = Gender.GENDERLESS;
    else {
      const genderChance = (this.id % 256) * 0.390625;
      if (genderChance < this.getFusionSpeciesForm().malePercent)
        this.fusionGender = Gender.MALE;
      else
        this.fusionGender = Gender.FEMALE;
    }
  }

  generateAndPopulateMoveset(): void {
    this.moveset = [];
    const movePool = [];
    const allLevelMoves = this.getSpeciesForm().getLevelMoves();
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
      const moveIndex = Utils.randSeedInt(attackMovePool.length);
      this.moveset.push(new PokemonMove(attackMovePool[moveIndex], 0, 0));
      console.log(allMoves[attackMovePool[moveIndex]]);
      movePool.splice(movePool.findIndex(m => m === attackMovePool[moveIndex]), 1);
    }

    while (movePool.length && this.moveset.length < 4) {
      const moveIndex = Utils.randSeedInt(movePool.length);
      this.moveset.push(new PokemonMove(movePool[moveIndex], 0, 0));
      console.log(allMoves[movePool[moveIndex]]);
      movePool.splice(moveIndex, 1);
    }

    if (MOVE_OVERRIDE && this.isPlayer())
      this.moveset[0] = new PokemonMove(MOVE_OVERRIDE);
    else if (OPP_MOVE_OVERRIDE && !this.isPlayer())
      this.moveset[0] = new PokemonMove(OPP_MOVE_OVERRIDE);
  }

  trySelectMove(moveIndex: integer, ignorePp?: boolean): boolean {
    const move = this.getMoveset().length > moveIndex
      ? this.getMoveset()[moveIndex]
      : null;
    return move?.isUsable(this, ignorePp);
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
    const maxExpLevel = this.scene.getMaxExpLevel();
    const initialExp = this.exp;
    this.exp += exp;
    while (this.level < maxExpLevel && this.exp >= getLevelTotalExp(this.level + 1, this.getSpeciesForm().growthRate))
      this.level++;
    if (this.level >= maxExpLevel) {
      console.log(initialExp, this.exp, getLevelTotalExp(this.level, this.getSpeciesForm().growthRate));
      this.exp = Math.max(getLevelTotalExp(this.level, this.getSpeciesForm().growthRate), initialExp);
    }
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
    let damage = new Utils.NumberHolder(0);

    const cancelled = new Utils.BooleanHolder(false);
    const typeless = !!move.getAttrs(TypelessAttr).length
    const typeMultiplier = new Utils.NumberHolder(!typeless && moveCategory !== MoveCategory.STATUS
      ? getTypeDamageMultiplier(move.type, this.getSpeciesForm().type1) * (this.getSpeciesForm().type2 !== null ? getTypeDamageMultiplier(move.type, this.getSpeciesForm().type2) : 1)
      : 1);
    if (typeless)
      typeMultiplier.value = 1;

    switch (moveCategory) {
      case MoveCategory.PHYSICAL:
      case MoveCategory.SPECIAL:
        const isPhysical = moveCategory === MoveCategory.PHYSICAL;
        const power = new Utils.NumberHolder(move.power);
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
          const sourceAtk = source.getBattleStat(isPhysical ? Stat.ATK : Stat.SPATK, this);
          const targetDef = this.getBattleStat(isPhysical ? Stat.DEF : Stat.SPDEF, source);
          const stabMultiplier = new Utils.IntegerHolder(source.species.type1 === move.type || (source.species.type2 !== null && source.species.type2 === move.type) ? 1.5 : 1);
          const criticalMultiplier = isCritical ? 2 : 1;
          const isTypeImmune = (typeMultiplier.value * weatherTypeMultiplier) === 0;

          applyAbAttrs(StabBoostAbAttr, source, null, stabMultiplier);

          if (!isTypeImmune) {
            damage.value = Math.ceil(((((2 * source.level / 5 + 2) * power.value * sourceAtk / targetDef) / 50) + 2) * stabMultiplier.value * typeMultiplier.value * weatherTypeMultiplier * ((Utils.randInt(15) + 85) / 100)) * criticalMultiplier;
            if (isPhysical && source.status && source.status.effect === StatusEffect.BURN)
              damage.value = Math.floor(damage.value / 2);
            move.getAttrs(HitsTagAttr).map(hta => hta as HitsTagAttr).filter(hta => hta.doubleDamage).forEach(hta => {
              if (this.getTag(hta.tagType))
                damage.value *= 2;
            });
          }

          const fixedDamage = new Utils.IntegerHolder(0);
          applyMoveAttrs(FixedDamageAttr, source, this, move, fixedDamage);
          if (!isTypeImmune && fixedDamage.value) {
            damage.value = fixedDamage.value;
            isCritical = false;
            result = HitResult.EFFECTIVE;
          }

          console.log('damage', damage, move.name, move.power, sourceAtk, targetDef);
          
          if (!result) {
            if (!typeMultiplier.value)
              result = HitResult.NO_EFFECT;
            else {
              const oneHitKo = new Utils.BooleanHolder(false);
              applyMoveAttrs(OneHitKOAttr, source, this, move, oneHitKo);
              if (oneHitKo.value) {
                result = HitResult.ONE_HIT_KO;
                isCritical = false;
                damage.value = this.hp;
              } else if (typeMultiplier.value >= 2)
                result = HitResult.SUPER_EFFECTIVE;
              else if (typeMultiplier.value >= 1)
                result = HitResult.EFFECTIVE;
              else
                result = HitResult.NOT_VERY_EFFECTIVE;
            }
          }

          if (!source.isPlayer())
             this.scene.applyModifiers(EnemyDamageBoosterModifier, false, damage);

          if (!this.isPlayer())
             this.scene.applyModifiers(EnemyDamageReducerModifier, false, damage);

          if (damage) {
            this.scene.unshiftPhase(new DamagePhase(this.scene, this.getBattlerIndex(), result as DamageResult));
            if (isCritical)
              this.scene.queueMessage('A critical hit!');
            this.scene.setPhaseQueueSplice();
            damage.value = Math.min(damage.value, this.hp);
            this.damage(damage.value);
            source.turnData.damageDealt += damage.value;
            this.turnData.attacksReceived.unshift({ move: move.id, result: result as DamageResult, damage: damage.value, critical: isCritical, sourceId: source.id });
          }

          if (source.turnData.hitsLeft === 1) {
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
              case HitResult.ONE_HIT_KO:  
                this.scene.queueMessage('It\'s a one-hit KO!');
                break;
            }
          }

          if (damage)
            this.scene.clearPhaseQueueSplice();
        }
        break;
      case MoveCategory.STATUS:
        if (!typeless)
          applyPreDefendAbAttrs(TypeImmunityAbAttr, this, source, battlerMove, cancelled, typeMultiplier);
        result = cancelled.value || !typeMultiplier.value ? HitResult.NO_EFFECT : HitResult.STATUS;
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
      this.scene.unshiftPhase(new FaintPhase(this.scene, this.getBattlerIndex(), preventEndure));
      this.resetSummonData();
    }
  }

  heal(amount: integer): void {
    this.hp = Math.min(this.hp + amount, this.getMaxHp());
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
    if (!this.summonData)
      return null;
    return typeof(tagType) === 'number'
      ? this.summonData.tags.find(t => t.tagType === tagType)
      : this.summonData.tags.find(t => t instanceof tagType);
  }

  findTag(tagFilter: ((tag: BattlerTag) => boolean)) {
    if (!this.summonData)
      return null;
    return this.summonData.tags.find(t => tagFilter(t));
  }

  getTags(tagType: BattlerTagType | { new(...args: any[]): BattlerTag }): BattlerTag[] {
    if (!this.summonData)
      return [];
    return typeof(tagType) === 'number'
      ? this.summonData.tags.filter(t => t.tagType === tagType)
      : this.summonData.tags.filter(t => t instanceof tagType);
  }

  findTags(tagFilter: ((tag: BattlerTag) => boolean)): BattlerTag[] {
    if (!this.summonData)
      return [];
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

  cry(soundConfig?: Phaser.Types.Sound.SoundConfig): AnySound {
    const cry = this.getSpeciesForm().cry(this.scene, soundConfig);
    let duration = cry.totalDuration * 1000;
    if (this.fusionSpecies) {
      let fusionCry = this.getFusionSpeciesForm().cry(this.scene, soundConfig, true);
      duration = Math.min(duration, fusionCry.totalDuration * 1000);
      fusionCry.destroy();
      this.scene.time.delayedCall(Utils.fixedInt(Math.ceil(duration * 0.4)), () => {
        try {
          SoundFade.fadeOut(this.scene, cry, Utils.fixedInt(Math.ceil(duration * 0.2)));
          fusionCry = this.getFusionSpeciesForm().cry(this.scene, Object.assign({ seek: Math.max(fusionCry.totalDuration * 0.4, 0) }, soundConfig));
          SoundFade.fadeIn(this.scene, fusionCry, Utils.fixedInt(Math.ceil(duration * 0.2)), this.scene.masterVolume * this.scene.seVolume, 0);
        } catch (err) {
          console.error(err);
        }
      });
    }

    return cry;
  }

  faintCry(callback: Function): void {
    if (this.fusionSpecies)
      return this.fusionFaintCry(callback);

    const key = this.getSpeciesForm().getCryKey(this.formIndex);
    let i = 0;
    let rate = 0.85;
    const cry = this.scene.playSound(key, { rate: rate }) as AnySound;
    const sprite = this.getSprite();
    const tintSprite = this.getTintSprite();

    const delay = Math.max(this.scene.sound.get(key).totalDuration * 50, 25);

    let frameProgress = 0;
    let frameThreshold: number;
    
    sprite.anims.pause();
    tintSprite.anims.pause();

    let faintCryTimer = this.scene.time.addEvent({
      delay: Utils.fixedInt(delay),
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
        if (cry && !cry.pendingRemove) {
          rate *= 0.99;
          cry.setRate(rate);
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
    this.scene.time.delayedCall(Utils.fixedInt(3000), () => {
      if (!faintCryTimer || !this.scene)
        return;
      if (cry?.isPlaying)
        cry.stop();
      faintCryTimer.destroy();
      if (callback)
        callback();
    });
  }

  private fusionFaintCry(callback: Function): void {
    const key = this.getSpeciesForm().getCryKey();
    let i = 0;
    let rate = 0.85;
    let cry = this.scene.playSound(key, { rate: rate }) as AnySound;
    const sprite = this.getSprite();
    const tintSprite = this.getTintSprite();
    let duration = cry.totalDuration * 1000;

    let fusionCry = this.scene.playSound(this.getFusionSpeciesForm().getCryKey(this.fusionFormIndex), { rate: rate }) as AnySound;
    fusionCry.stop();
    duration = Math.min(duration, fusionCry.totalDuration * 1000);
    fusionCry.destroy();

    const delay = Math.max(duration * 0.05, 25);

    let transitionIndex = 0;
    let durationProgress = 0;

    const transitionThreshold = Math.ceil(duration * 0.4);
    while (durationProgress < transitionThreshold) {
      ++i;
      durationProgress += delay * rate;
      rate *= 0.99;
    }

    transitionIndex = i;

    i = 0;
    rate = 0.85;

    let frameProgress = 0;
    let frameThreshold: number;

    sprite.anims.pause();
    tintSprite.anims.pause();

    let faintCryTimer = this.scene.time.addEvent({
      delay: Utils.fixedInt(delay),
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
        if (i === transitionIndex) {
          SoundFade.fadeOut(this.scene, cry, Utils.fixedInt(Math.ceil((duration / rate) * 0.2)));
          fusionCry = this.scene.playSound(this.getFusionSpeciesForm().getCryKey(this.fusionFormIndex), Object.assign({ seek: Math.max(fusionCry.totalDuration * 0.4, 0), rate: rate }));
          SoundFade.fadeIn(this.scene, fusionCry, Utils.fixedInt(Math.ceil((duration / rate) * 0.2)), this.scene.masterVolume * this.scene.seVolume, 0);
        }
        rate *= 0.99;
        if (cry && !cry.pendingRemove)
          cry.setRate(rate);
        if (fusionCry && !fusionCry.pendingRemove)
          fusionCry.setRate(rate);
        if ((!cry || cry.pendingRemove) && (!fusionCry || fusionCry.pendingRemove)) {
          faintCryTimer.destroy();
          faintCryTimer = null;
          if (callback)
            callback();
        }
      }
    });

    // Failsafe
    this.scene.time.delayedCall(Utils.fixedInt(3000), () => {
      console.log(faintCryTimer)
      if (!faintCryTimer || !this.scene)
        return;
      if (cry?.isPlaying)
        cry.stop();
      if (fusionCry?.isPlaying)
        fusionCry.stop();
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

    if (effect === StatusEffect.SLEEP)
      this.setFrameRate(4);

    this.status = new Status(effect);
    return true;
  }

  resetStatus(): void {
    const lastStatus = this.status?.effect;
    this.status = undefined;
    if (lastStatus === StatusEffect.SLEEP) {
      this.setFrameRate(12);
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
    return ((this.getSpeciesForm().baseExp * this.level) / 5 + 1);
  }

  setFrameRate(frameRate: integer) {
    this.scene.anims.get(this.getBattleSpriteKey()).frameRate = frameRate;
    this.getSprite().play(this.getBattleSpriteKey());
    this.getTintSprite().play(this.getBattleSpriteKey());
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
      this.scene.playSound('sparkle');
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

  hasTrainer(): boolean {
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

  switchOut(batonPass: boolean): Promise<void> {
    return new Promise(resolve => {
      this.resetTurnData();
      this.resetSummonData();
      this.hideInfo();
      this.setVisible(false);
      
      this.scene.ui.setMode(Mode.PARTY, PartyUiMode.FAINT_SWITCH, this.getFieldIndex(), (slotIndex: integer, option: PartyOption) => {
        if (slotIndex >= this.scene.currentBattle.getBattlerCount() && slotIndex < 6)
          this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, this.getFieldIndex(), slotIndex, false, batonPass));
        this.scene.ui.setMode(Mode.MESSAGE).then(() => resolve());
      }, PartyUiHandler.FilterNonFainted);
    });
  }

  evolve(evolution: SpeciesEvolution): Promise<void> {
    return new Promise(resolve => {
      this.handleSpecialEvolutions(evolution);
      this.species = getPokemonSpecies(evolution.speciesId);
      this.name = this.species.name;
      const abilityCount = this.getSpeciesForm().getAbilityCount();
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
        const modifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
          && (m as PokemonHeldItemModifier).pokemonId === this.id, true) as PokemonHeldItemModifier[];
        modifiers.forEach(m => {
          const clonedModifier = m.clone() as PokemonHeldItemModifier;
          clonedModifier.pokemonId = newPokemon.id;
          this.scene.addModifier(clonedModifier, true);
        });
        this.scene.updateModifiers(true);
      }
    }
  }

  isFusion(): boolean {
    return !!(this.fusionSpecies || (this.species.speciesId === Species.KYUREM && this.formIndex));
  }

  fuse(pokemon: PlayerPokemon): Promise<void> {
    return new Promise(resolve => {
      if (this.species.speciesId === Species.KYUREM && (pokemon.species.speciesId === Species.RESHIRAM || pokemon.species.speciesId === Species.ZEKROM))
        this.formIndex = pokemon.species.speciesId === Species.RESHIRAM ? 1 : 2;
      else {
        this.fusionSpecies = pokemon.species;
        this.fusionFormIndex = pokemon.formIndex;
        this.fusionAbilityIndex = pokemon.abilityIndex;
        this.fusionShiny = pokemon.shiny;
        this.fusionGender = pokemon.gender;
      }

      this.calculateStats();
      this.updateInfo(true).then(() => {
        const fusedPartyMemberIndex = this.scene.getParty().indexOf(pokemon);
        const fusedPartyMemberHeldModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
          && (m as PokemonHeldItemModifier).pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
        const transferModifiers: Promise<boolean>[] = [];
        for (let modifier of fusedPartyMemberHeldModifiers)
          transferModifiers.push(this.scene.tryTransferHeldItemModifier(modifier, this, true, false));
        Promise.allSettled(transferModifiers).then(() => {
          this.scene.removePartyMemberModifiers(fusedPartyMemberIndex);
          this.scene.getParty().splice(fusedPartyMemberIndex, 1)[0];
          pokemon.destroy();
          resolve();
        });
      });
    });
  }

  unfuse(): Promise<void> {
    return new Promise(resolve => {
      this.fusionSpecies = undefined;
      this.fusionFormIndex = 0;
      this.fusionAbilityIndex = 0;
      this.fusionShiny = false;
      this.fusionGender = 0;

      this.calculateStats();
      this.updateInfo(true).then(() => resolve());
    });
  }
}

export class EnemyPokemon extends Pokemon {
  public trainer: boolean;
  public aiType: AiType;

  constructor(scene: BattleScene, species: PokemonSpecies, level: integer, trainer: boolean, dataSource?: PokemonData) {
    super(scene, 236, 84, species, level, dataSource?.abilityIndex, dataSource ? dataSource.formIndex : scene.getSpeciesFormIndex(species),
      dataSource?.gender, dataSource?.shiny, dataSource);

    this.trainer = trainer;

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
      if (queuedMove.isUsable(this, this.getMoveQueue()[0].ignorePP))
        return { move: queuedMove.moveId, targets: this.getMoveQueue()[0].targets, ignorePP: this.getMoveQueue()[0].ignorePP };
      else {
        this.getMoveQueue().shift();
        return this.getNextMove();
      }
    }

    const movePool = this.getMoveset().filter(m => m.isUsable(this));
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

    const benefitScores = targets
      .map(p => [ p.getBattlerIndex(), move.getTargetBenefitScore(this, p, move) * (p.isPlayer() === this.isPlayer() ? 1 : -1) ]);

    const sortedBenefitScores = benefitScores.slice(0);
    sortedBenefitScores.sort((a, b) => {
      const scoreA = a[1];
      const scoreB = b[1];
      return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
    });

    if (!sortedBenefitScores.length)
      return [];

    let targetWeights = sortedBenefitScores.map(s => s[1]);
    const lowestWeight = targetWeights[targetWeights.length - 1];

    if (lowestWeight < 1) {
      for (let w = 0; w < targetWeights.length; w++)
        targetWeights[w] += Math.abs(lowestWeight - 1);
    }

    const benefitCutoffIndex = targetWeights.findIndex(s => s < targetWeights[0] / 2);
    if (benefitCutoffIndex > -1)
      targetWeights = targetWeights.slice(0, benefitCutoffIndex);

    const thresholds: integer[] = [];
    let totalWeight: integer;
    targetWeights.reduce((total: integer, w: integer) => {
      total += w;
      thresholds.push(total);
      totalWeight = total;
      return total;
    }, 0);

    const randValue = Utils.randInt(totalWeight);
    let targetIndex: integer;

    thresholds.every((t, i) => {
      if (randValue >= t)
        return true;

      targetIndex = i;
      return false;
    });

    return [ sortedBenefitScores[targetIndex][0] ];
  }

  isPlayer() {
    return false;
  }

  hasTrainer(): boolean {
    return this.trainer;
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
  critical: boolean;
  sourceId: integer;
}

export class PokemonSummonData {
  public battleStats: integer[] = [ 0, 0, 0, 0, 0, 0, 0 ];
  public moveQueue: QueuedMove[] = [];
  public disabledMove: Moves = Moves.NONE;
  public disabledTurns: integer = 0;
  public tags: BattlerTag[] = [];

  public speciesForm: PokemonSpeciesForm;
  public gender: Gender;
  public stats: integer[];
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
  ONE_HIT_KO,
  STATUS,
  FAIL,
  MISS,
  OTHER
}

export type DamageResult = HitResult.EFFECTIVE | HitResult.SUPER_EFFECTIVE | HitResult.NOT_VERY_EFFECTIVE | HitResult.ONE_HIT_KO | HitResult.OTHER;

export class PokemonMove {
  public moveId: Moves;
  public ppUsed: integer;
  public ppUp: integer;
  public virtual: boolean;

  constructor(moveId: Moves, ppUsed?: integer, ppUp?: integer, virtual?: boolean) {
    this.moveId = moveId;
    this.ppUsed = ppUsed || 0;
    this.ppUp = ppUp || 0;
    this.virtual = !!virtual;
  }

  isUsable(pokemon: Pokemon, ignorePp?: boolean): boolean {
    if (pokemon.summonData?.disabledMove === this.moveId)
      return false;
    return ignorePp || this.ppUsed < this.getMove().pp + this.ppUp || this.getMove().pp === -1;
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