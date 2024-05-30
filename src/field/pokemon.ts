import Phaser from "phaser";
import BattleScene, { AnySound } from "../battle-scene";
import { Variant, VariantSet, variantColorCache } from "#app/data/variant";
import { variantData } from "#app/data/variant";
import BattleInfo, { PlayerBattleInfo, EnemyBattleInfo } from "../ui/battle-info";
import { Moves } from "../data/enums/moves";
import Move, { HighCritAttr, HitsTagAttr, applyMoveAttrs, FixedDamageAttr, VariableAtkAttr, VariablePowerAttr, allMoves, MoveCategory, TypelessAttr, CritOnlyAttr, getMoveTargets, OneHitKOAttr, MultiHitAttr, StatusMoveTypeImmunityAttr, MoveTarget, VariableDefAttr, AttackMove, ModifiedDamageAttr, VariableMoveTypeMultiplierAttr, IgnoreOpponentStatChangesAttr, SacrificialAttr, VariableMoveTypeAttr, VariableMoveCategoryAttr, CounterDamageAttr, StatChangeAttr, RechargeAttr, ChargeAttr, IgnoreWeatherTypeDebuffAttr, BypassBurnDamageReductionAttr, SacrificialAttrOnHit, MoveFlags } from "../data/move";
import { default as PokemonSpecies, PokemonSpeciesForm, SpeciesFormKey, getFusedSpeciesName, getPokemonSpecies, getPokemonSpeciesForm, getStarterValueFriendshipCap, speciesStarters, starterPassiveAbilities } from "../data/pokemon-species";
import * as Utils from "../utils";
import { Type, TypeDamageMultiplier, getTypeDamageMultiplier, getTypeRgb } from "../data/type";
import { getLevelTotalExp } from "../data/exp";
import { Stat } from "../data/pokemon-stat";
import { AttackTypeBoosterModifier, DamageMoneyRewardModifier, EnemyDamageBoosterModifier, EnemyDamageReducerModifier, EnemyEndureChanceModifier, EnemyFusionChanceModifier, HiddenAbilityRateBoosterModifier, PokemonBaseStatModifier, PokemonFriendshipBoosterModifier, PokemonHeldItemModifier, PokemonMultiHitModifier, PokemonNatureWeightModifier, ShinyRateBoosterModifier, SurviveDamageModifier, TempBattleStatBoosterModifier, TerastallizeModifier } from "../modifier/modifier";
import { PokeballType } from "../data/pokeball";
import { Gender } from "../data/gender";
import { initMoveAnim, loadMoveAnimAssets } from "../data/battle-anims";
import { Status, StatusEffect, getRandomStatus } from "../data/status-effect";
import { pokemonEvolutions, pokemonPrevolutions, SpeciesFormEvolution, SpeciesEvolutionCondition, FusionSpeciesFormEvolution } from "../data/pokemon-evolutions";
import { reverseCompatibleTms, tmSpecies, tmPoolTiers } from "../data/tms";
import { DamagePhase, FaintPhase, LearnMovePhase, ObtainStatusEffectPhase, StatChangePhase, SwitchSummonPhase, ToggleDoublePositionPhase  } from "../phases";
import { BattleStat } from "../data/battle-stat";
import { BattlerTag, BattlerTagLapseType, EncoreTag, HelpingHandTag, HighestStatBoostTag, TypeBoostTag, getBattlerTag } from "../data/battler-tags";
import { BattlerTagType } from "../data/enums/battler-tag-type";
import { Species } from "../data/enums/species";
import { WeatherType } from "../data/weather";
import { TempBattleStat } from "../data/temp-battle-stat";
import { ArenaTagSide, WeakenMoveScreenTag, WeakenMoveTypeTag } from "../data/arena-tag";
import { ArenaTagType } from "../data/enums/arena-tag-type";
import { Biome } from "../data/enums/biome";
import { Ability, AbAttr, BattleStatMultiplierAbAttr, BlockCritAbAttr, BonusCritAbAttr, BypassBurnDamageReductionAbAttr, FieldPriorityMoveImmunityAbAttr, FieldVariableMovePowerAbAttr, IgnoreOpponentStatChangesAbAttr, MoveImmunityAbAttr, MoveTypeChangeAttr, PreApplyBattlerTagAbAttr, PreDefendFullHpEndureAbAttr, ReceivedMoveDamageMultiplierAbAttr, ReduceStatusEffectDurationAbAttr, StabBoostAbAttr, StatusEffectImmunityAbAttr, TypeImmunityAbAttr, VariableMovePowerAbAttr, VariableMoveTypeAbAttr, WeightMultiplierAbAttr, allAbilities, applyAbAttrs, applyBattleStatMultiplierAbAttrs, applyPreApplyBattlerTagAbAttrs, applyPreAttackAbAttrs, applyPreDefendAbAttrs, applyPreSetStatusAbAttrs, UnsuppressableAbilityAbAttr, SuppressFieldAbilitiesAbAttr, NoFusionAbilityAbAttr, MultCritAbAttr, IgnoreTypeImmunityAbAttr, DamageBoostAbAttr, IgnoreTypeStatusEffectImmunityAbAttr, ConditionalCritAbAttr } from "../data/ability";
import { Abilities } from "#app/data/enums/abilities";
import PokemonData from "../system/pokemon-data";
import { BattlerIndex } from "../battle";
import { BattleSpec } from "../enums/battle-spec";
import { Mode } from "../ui/ui";
import PartyUiHandler, { PartyOption, PartyUiMode } from "../ui/party-ui-handler";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { LevelMoves } from "../data/pokemon-level-moves";
import { DamageAchv, achvs } from "../system/achv";
import { DexAttr, StarterDataEntry, StarterMoveset } from "../system/game-data";
import { QuantizerCelebi, argbFromRgba, rgbaFromArgb } from "@material/material-color-utilities";
import { Nature, getNatureStatMultiplier } from "../data/nature";
import { SpeciesFormChange, SpeciesFormChangeActiveTrigger, SpeciesFormChangeMoveLearnedTrigger, SpeciesFormChangePostMoveTrigger, SpeciesFormChangeStatusEffectTrigger } from "../data/pokemon-forms";
import { TerrainType } from "../data/terrain";
import { TrainerSlot } from "../data/trainer-config";
import * as Overrides from "../overrides";
import { BerryType } from "../data/berry";
import i18next from "../plugins/i18n";
import { speciesEggMoves } from "../data/egg-moves";
import { ModifierTier } from "../modifier/modifier-tier";

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
  public passive: boolean;
  public shiny: boolean;
  public variant: Variant;
  public pokeball: PokeballType;
  protected battleInfo: BattleInfo;
  public level: integer;
  public exp: integer;
  public levelExp: integer;
  public gender: Gender;
  public hp: integer;
  public stats: integer[];
  public ivs: integer[];
  public nature: Nature;
  public natureOverride: Nature | -1;
  public moveset: PokemonMove[];
  public status: Status;
  public friendship: integer;
  public metLevel: integer;
  public metBiome: Biome | -1;
  public luck: integer;
  public pauseEvolutions: boolean;
  public pokerus: boolean;

  public fusionSpecies: PokemonSpecies;
  public fusionFormIndex: integer;
  public fusionAbilityIndex: integer;
  public fusionShiny: boolean;
  public fusionVariant: Variant;
  public fusionGender: Gender;
  public fusionLuck: integer;

  private summonDataPrimer: PokemonSummonData;

  public summonData: PokemonSummonData;
  public battleData: PokemonBattleData;
  public battleSummonData: PokemonBattleSummonData;
  public turnData: PokemonTurnData;

  public fieldPosition: FieldPosition;

  public maskEnabled: boolean;
  public maskSprite: Phaser.GameObjects.Sprite;

  private shinySparkle: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, x: number, y: number, species: PokemonSpecies, level: integer, abilityIndex?: integer, formIndex?: integer, gender?: Gender, shiny?: boolean, variant?: Variant, ivs?: integer[], nature?: Nature, dataSource?: Pokemon | PokemonData) {
    super(scene, x, y);

    if (!species.isObtainable() && this.isPlayer()) {
      throw `Cannot create a player Pokemon for species '${species.getName(formIndex)}'`;
    }

    const hiddenAbilityChance = new Utils.IntegerHolder(256);
    if (!this.hasTrainer()) {
      this.scene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);
    }

    const hasHiddenAbility = !Utils.randSeedInt(hiddenAbilityChance.value);
    const randAbilityIndex = Utils.randSeedInt(2);

    this.species = species;
    this.pokeball = dataSource?.pokeball || PokeballType.POKEBALL;
    this.level = level;
    this.abilityIndex = abilityIndex !== undefined
      ? abilityIndex
      : (species.abilityHidden && hasHiddenAbility ? species.ability2 ? 2 : 1 : species.ability2 ? randAbilityIndex : 0);
    if (formIndex !== undefined) {
      this.formIndex = formIndex;
    }
    if (gender !== undefined) {
      this.gender = gender;
    }
    if (shiny !== undefined) {
      this.shiny = shiny;
    }
    if (variant !== undefined) {
      this.variant = variant;
    }
    this.exp = dataSource?.exp || getLevelTotalExp(this.level, species.growthRate);
    this.levelExp = dataSource?.levelExp || 0;
    if (dataSource) {
      this.id = dataSource.id;
      this.hp = dataSource.hp;
      this.stats = dataSource.stats;
      this.ivs = dataSource.ivs;
      this.passive = !!dataSource.passive;
      if (this.variant === undefined) {
        this.variant = 0;
      }
      this.nature = dataSource.nature || 0 as Nature;
      this.natureOverride = dataSource.natureOverride !== undefined ? dataSource.natureOverride : -1;
      this.moveset = dataSource.moveset;
      this.status = dataSource.status;
      this.friendship = dataSource.friendship !== undefined ? dataSource.friendship : this.species.baseFriendship;
      this.metLevel = dataSource.metLevel || 5;
      this.luck = dataSource.luck;
      this.metBiome = dataSource.metBiome;
      this.pauseEvolutions = dataSource.pauseEvolutions;
      this.pokerus = !!dataSource.pokerus;
      this.fusionSpecies = dataSource.fusionSpecies instanceof PokemonSpecies ? dataSource.fusionSpecies : getPokemonSpecies(dataSource.fusionSpecies);
      this.fusionFormIndex = dataSource.fusionFormIndex;
      this.fusionAbilityIndex = dataSource.fusionAbilityIndex;
      this.fusionShiny = dataSource.fusionShiny;
      this.fusionVariant = dataSource.fusionVariant || 0;
      this.fusionGender = dataSource.fusionGender;
      this.fusionLuck = dataSource.fusionLuck;
    } else {
      this.id = Utils.randSeedInt(4294967296);
      this.ivs = ivs || Utils.getIvsFromId(this.id);

      if (this.gender === undefined) {
        this.generateGender();
      }

      if (this.formIndex === undefined) {
        this.formIndex = this.scene.getSpeciesFormIndex(species, this.gender, this.nature, this.isPlayer());
      }

      if (this.shiny === undefined) {
        this.trySetShiny();
      }

      if (this.variant === undefined) {
        this.variant = this.shiny ? this.generateVariant() : 0;
      }

      if (nature !== undefined) {
        this.setNature(nature);
      } else {
        this.generateNature();
      }

      this.natureOverride = -1;

      this.friendship = species.baseFriendship;
      this.metLevel = level;
      this.metBiome = scene.currentBattle ? scene.arena.biomeType : -1;
      this.pokerus = false;

      if (level > 1) {
        const fused = new Utils.BooleanHolder(scene.gameMode.isSplicedOnly);
        if (!fused.value && !this.isPlayer() && !this.hasTrainer()) {
          this.scene.applyModifier(EnemyFusionChanceModifier, false, fused);
        }

        if (fused.value) {
          this.calculateStats();
          this.generateFusionSpecies();
        }
      }

      this.luck = (this.shiny ? this.variant + 1 : 0) + (this.fusionShiny ? this.fusionVariant + 1 : 0);
    }

    this.generateName();

    if (!species.isObtainable()) {
      this.shiny = false;
    }

    this.calculateStats();
  }

  init(): void {
    this.fieldPosition = FieldPosition.CENTER;

    this.initBattleInfo();

    this.scene.fieldUI.addAt(this.battleInfo, 0);

    const getSprite = (hasShadow?: boolean) => {
      const ret = this.scene.addPokemonSprite(this, 0, 0, `pkmn__${this.isPlayer() ? "back__" : ""}sub`, undefined, true);
      ret.setOrigin(0.5, 1);
      ret.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], hasShadow: !!hasShadow, teraColor: getTypeRgb(this.getTeraType()) });
      return ret;
    };

    this.setScale(this.getSpriteScale());

    const sprite = getSprite(true);
    const tintSprite = getSprite();

    tintSprite.setVisible(false);

    this.addAt(sprite, 0);
    this.addAt(tintSprite, 1);

    if (this.isShiny() && !this.shinySparkle) {
      this.initShinySparkle();
    }
  }

  abstract initBattleInfo(): void;

  isOnField(): boolean {
    if (!this.scene) {
      return false;
    }
    return this.scene.field.getIndex(this) > -1;
  }

  isFainted(checkStatus?: boolean): boolean {
    return !this.hp && (!checkStatus || this.status?.effect === StatusEffect.FAINT);
  }

  isActive(onField?: boolean): boolean {
    if (!this.scene) {
      return false;
    }
    return !this.isFainted() && !!this.scene && (!onField || this.isOnField());
  }

  getDexAttr(): bigint {
    let ret = 0n;
    ret |= this.gender !== Gender.FEMALE ? DexAttr.MALE : DexAttr.FEMALE;
    ret |= !this.shiny ? DexAttr.NON_SHINY : DexAttr.SHINY;
    ret |= this.variant >= 2 ? DexAttr.VARIANT_3 : this.variant === 1 ? DexAttr.VARIANT_2 : DexAttr.DEFAULT_VARIANT;
    ret |= this.scene.gameData.getFormAttr(this.formIndex);
    return ret;
  }

  generateName(): void {
    if (!this.fusionSpecies) {
      this.name = this.species.getName(this.formIndex);
      return;
    }
    this.name = getFusedSpeciesName(this.species.getName(this.formIndex), this.fusionSpecies.getName(this.fusionFormIndex));
    if (this.battleInfo) {
      this.updateInfo(true);
    }
  }

  abstract isPlayer(): boolean;

  abstract hasTrainer(): boolean;

  abstract getFieldIndex(): integer;

  abstract getBattlerIndex(): BattlerIndex;

  loadAssets(ignoreOverride: boolean = true): Promise<void> {
    return new Promise(resolve => {
      const moveIds = this.getMoveset().map(m => m.getMove().id);
      Promise.allSettled(moveIds.map(m => initMoveAnim(this.scene, m)))
        .then(() => {
          loadMoveAnimAssets(this.scene, moveIds);
          this.getSpeciesForm().loadAssets(this.scene, this.getGender() === Gender.FEMALE, this.formIndex, this.shiny, this.variant);
          if (this.isPlayer() || this.getFusionSpeciesForm()) {
            this.scene.loadPokemonAtlas(this.getBattleSpriteKey(true, ignoreOverride), this.getBattleSpriteAtlasPath(true, ignoreOverride));
          }
          if (this.getFusionSpeciesForm()) {
            this.getFusionSpeciesForm().loadAssets(this.scene, this.getFusionGender() === Gender.FEMALE, this.fusionFormIndex, this.fusionShiny, this.fusionVariant);
            this.scene.loadPokemonAtlas(this.getFusionBattleSpriteKey(true, ignoreOverride), this.getFusionBattleSpriteAtlasPath(true, ignoreOverride));
          }
          this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
            if (this.isPlayer()) {
              const originalWarn = console.warn;
              // Ignore warnings for missing frames, because there will be a lot
              console.warn = () => {};
              const battleFrameNames = this.scene.anims.generateFrameNames(this.getBattleSpriteKey(), { zeroPad: 4, suffix: ".png", start: 1, end: 400 });
              console.warn = originalWarn;
              if (!(this.scene.anims.exists(this.getBattleSpriteKey()))) {
                this.scene.anims.create({
                  key: this.getBattleSpriteKey(),
                  frames: battleFrameNames,
                  frameRate: 12,
                  repeat: -1
                });
              }
            }
            this.playAnim();
            const updateFusionPaletteAndResolve = () => {
              this.updateFusionPalette();
              if (this.summonData?.speciesForm) {
                this.updateFusionPalette(true);
              }
              resolve();
            };
            if (this.shiny) {
              const populateVariantColors = (key: string, back: boolean = false): Promise<void> => {
                return new Promise(resolve => {
                  const battleSpritePath = this.getBattleSpriteAtlasPath(back, ignoreOverride).replace("variant/", "").replace(/_[1-3]$/, "");
                  let config = variantData;
                  const useExpSprite = this.scene.experimentalSprites && this.scene.hasExpSprite(this.getBattleSpriteKey(back, ignoreOverride));
                  battleSpritePath.split("/").map(p => config ? config = config[p] : null);
                  const variantSet: VariantSet = config as VariantSet;
                  if (variantSet && variantSet[this.variant] === 1) {
                    if (variantColorCache.hasOwnProperty(key)) {
                      return resolve();
                    }
                    this.scene.cachedFetch(`./images/pokemon/variant/${useExpSprite ? "exp/" : ""}${battleSpritePath}.json`).
                      then(res => {
                        // Prevent the JSON from processing if it failed to load
                        if (!res.ok) {
                          console.error(`Could not load ${res.url}!`);
                          return;
                        }
                        return res.json();
                      }).then(c => {
                        variantColorCache[key] = c;
                        resolve();
                      });
                  } else {
                    resolve();
                  }
                });
              };
              if (this.isPlayer()) {
                Promise.all([ populateVariantColors(this.getBattleSpriteKey(false)), populateVariantColors(this.getBattleSpriteKey(true), true) ]).then(() => updateFusionPaletteAndResolve());
              } else {
                populateVariantColors(this.getBattleSpriteKey(false)).then(() => updateFusionPaletteAndResolve());
              }
            } else {
              updateFusionPaletteAndResolve();
            }
          });
          if (!this.scene.load.isLoading()) {
            this.scene.load.start();
          }
        });
    });
  }

  getFormKey(): string {
    if (!this.species.forms.length || this.species.forms.length <= this.formIndex) {
      return "";
    }
    return this.species.forms[this.formIndex].formKey;
  }

  getFusionFormKey(): string {
    if (!this.fusionSpecies) {
      return null;
    }
    if (!this.fusionSpecies.forms.length || this.fusionSpecies.forms.length <= this.fusionFormIndex) {
      return "";
    }
    return this.fusionSpecies.forms[this.fusionFormIndex].formKey;
  }

  getSpriteAtlasPath(ignoreOverride?: boolean): string {
    const spriteId = this.getSpriteId(ignoreOverride).replace(/\_{2}/g, "/");
    return `${/_[1-3]$/.test(spriteId) ? "variant/" : ""}${spriteId}`;
  }

  getBattleSpriteAtlasPath(back?: boolean, ignoreOverride?: boolean): string {
    const spriteId = this.getBattleSpriteId(back, ignoreOverride).replace(/\_{2}/g, "/");
    return `${/_[1-3]$/.test(spriteId) ? "variant/" : ""}${spriteId}`;
  }

  getSpriteId(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getSpriteId(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex, this.shiny, this.variant);
  }

  getBattleSpriteId(back?: boolean, ignoreOverride?: boolean): string {
    if (back === undefined) {
      back = this.isPlayer();
    }
    return this.getSpeciesForm(ignoreOverride).getSpriteId(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex, this.shiny, this.variant, back);
  }

  getSpriteKey(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getSpriteKey(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex, this.shiny, this.variant);
  }

  getBattleSpriteKey(back?: boolean, ignoreOverride?: boolean): string {
    return `pkmn__${this.getBattleSpriteId(back, ignoreOverride)}`;
  }

  getFusionSpriteId(ignoreOverride?: boolean): string {
    return this.getFusionSpeciesForm(ignoreOverride).getSpriteId(this.getFusionGender(ignoreOverride) === Gender.FEMALE, this.fusionFormIndex, this.fusionShiny, this.fusionVariant);
  }

  getFusionBattleSpriteId(back?: boolean, ignoreOverride?: boolean): string {
    if (back === undefined) {
      back = this.isPlayer();
    }
    return this.getFusionSpeciesForm(ignoreOverride).getSpriteId(this.getFusionGender(ignoreOverride) === Gender.FEMALE, this.fusionFormIndex, this.fusionShiny, this.fusionVariant, back);
  }

  getFusionBattleSpriteKey(back?: boolean, ignoreOverride?: boolean): string {
    return `pkmn__${this.getFusionBattleSpriteId(back, ignoreOverride)}`;
  }

  getFusionBattleSpriteAtlasPath(back?: boolean, ignoreOverride?: boolean): string {
    return this.getFusionBattleSpriteId(back, ignoreOverride).replace(/\_{2}/g, "/");
  }

  getIconAtlasKey(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getIconAtlasKey(this.formIndex, this.shiny, this.variant);
  }

  getFusionIconAtlasKey(ignoreOverride?: boolean): string {
    return this.getFusionSpeciesForm(ignoreOverride).getIconAtlasKey(this.fusionFormIndex, this.fusionShiny, this.fusionVariant);
  }

  getIconId(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride).getIconId(this.getGender(ignoreOverride) === Gender.FEMALE, this.formIndex, this.shiny, this.variant);
  }

  getFusionIconId(ignoreOverride?: boolean): string {
    return this.getFusionSpeciesForm(ignoreOverride).getIconId(this.getFusionGender(ignoreOverride) === Gender.FEMALE, this.fusionFormIndex, this.fusionShiny, this.fusionVariant);
  }

  getSpeciesForm(ignoreOverride?: boolean): PokemonSpeciesForm {
    if (!ignoreOverride && this.summonData?.speciesForm) {
      return this.summonData.speciesForm;
    }
    if (!this.species.forms?.length) {
      return this.species;
    }
    return this.species.forms[this.formIndex];
  }

  getFusionSpeciesForm(ignoreOverride?: boolean): PokemonSpeciesForm {
    if (!ignoreOverride && this.summonData?.speciesForm) {
      return this.summonData.fusionSpeciesForm;
    }
    if (!this.fusionSpecies?.forms?.length || this.fusionFormIndex >= this.fusionSpecies?.forms.length) {
      return this.fusionSpecies;
    }
    return this.fusionSpecies?.forms[this.fusionFormIndex];
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.getAt(0) as Phaser.GameObjects.Sprite;
  }

  getTintSprite(): Phaser.GameObjects.Sprite {
    return !this.maskEnabled
      ? this.getAt(1) as Phaser.GameObjects.Sprite
      : this.maskSprite;
  }

  getSpriteScale(): number {
    const formKey = this.getFormKey();
    if (formKey.indexOf(SpeciesFormKey.GIGANTAMAX) > -1 || formKey.indexOf(SpeciesFormKey.ETERNAMAX) > -1) {
      return 1.5;
    }
    return 1;
  }

  getHeldItems(): PokemonHeldItemModifier[] {
    if (!this.scene) {
      return [];
    }
    return this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier && (m as PokemonHeldItemModifier).pokemonId === this.id, this.isPlayer()) as PokemonHeldItemModifier[];
  }

  updateScale(): void {
    this.setScale(this.getSpriteScale());
  }

  updateSpritePipelineData(): void {
    [ this.getSprite(), this.getTintSprite() ].map(s => s.pipelineData["teraColor"] = getTypeRgb(this.getTeraType()));
    this.updateInfo(true);
  }

  initShinySparkle(): void {
    const keySuffix = this.variant ? `_${this.variant + 1}` : "";
    const key = `shiny${keySuffix}`;
    const shinySparkle = this.scene.addFieldSprite(0, 0, key);
    shinySparkle.setVisible(false);
    shinySparkle.setOrigin(0.5, 1);
    const frameNames = this.scene.anims.generateFrameNames(key, { suffix: ".png", end: 34 });
    if (!(this.scene.anims.exists(`sparkle${keySuffix}`))) {
      this.scene.anims.create({
        key: `sparkle${keySuffix}`,
        frames: frameNames,
        frameRate: 32,
        showOnStart: true,
        hideOnComplete: true,
      });
    }
    this.add(shinySparkle);

    this.shinySparkle = shinySparkle;
  }

  /**
   * Attempts to animate a given {@linkcode Phaser.GameObjects.Sprite}
   * @see {@linkcode Phaser.GameObjects.Sprite.play}
   * @param sprite {@linkcode Phaser.GameObjects.Sprite} to animate
   * @param tintSprite {@linkcode Phaser.GameObjects.Sprite} placed on top of the sprite to add a color tint
   * @param animConfig {@linkcode String} to pass to {@linkcode Phaser.GameObjects.Sprite.play}
   * @returns true if the sprite was able to be animated
   */
  tryPlaySprite(sprite: Phaser.GameObjects.Sprite, tintSprite: Phaser.GameObjects.Sprite, key: string): boolean {
    // Catch errors when trying to play an animation that doesn't exist
    try {
      sprite.play(key);
      tintSprite.play(key);
    } catch (error: unknown) {
      console.error(`Couldn't play animation for '${key}'!\nIs the image for this Pokemon missing?\n`, error);

      return false;
    }

    return true;
  }

  playAnim(): void {
    this.tryPlaySprite(this.getSprite(), this.getTintSprite(), this.getBattleSpriteKey());
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

      const relX = newOffset[0] - initialOffset[0];
      const relY = newOffset[1] - initialOffset[1];

      if (duration) {
        this.scene.tweens.add({
          targets: this,
          x: (_target, _key, value: number) => value + relX,
          y: (_target, _key, value: number) => value + relY,
          duration: duration,
          ease: "Sine.easeOut",
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

  getBattleStat(stat: Stat, opponent?: Pokemon, move?: Move, isCritical: boolean = false): integer {
    if (stat === Stat.HP) {
      return this.getStat(Stat.HP);
    }
    const battleStat = (stat - 1) as BattleStat;
    const statLevel = new Utils.IntegerHolder(this.summonData.battleStats[battleStat]);
    if (opponent) {
      if (isCritical) {
        switch (stat) {
        case Stat.ATK:
        case Stat.SPATK:
          statLevel.value = Math.max(statLevel.value, 0);
          break;
        case Stat.DEF:
        case Stat.SPDEF:
          statLevel.value = Math.min(statLevel.value, 0);
          break;
        }
      }
      applyAbAttrs(IgnoreOpponentStatChangesAbAttr, opponent, null, statLevel);
      if (move) {
        applyMoveAttrs(IgnoreOpponentStatChangesAttr, this, opponent, move, statLevel);
      }
    }
    if (this.isPlayer()) {
      this.scene.applyModifiers(TempBattleStatBoosterModifier, this.isPlayer(), battleStat as integer as TempBattleStat, statLevel);
    }
    const statValue = new Utils.NumberHolder(this.getStat(stat));
    applyBattleStatMultiplierAbAttrs(BattleStatMultiplierAbAttr, this, battleStat, statValue);
    let ret = statValue.value * (Math.max(2, 2 + statLevel.value) / Math.max(2, 2 - statLevel.value));
    switch (stat) {
    case Stat.ATK:
      if (this.getTag(BattlerTagType.SLOW_START)) {
        ret >>= 1;
      }
      break;
    case Stat.DEF:
      if (this.isOfType(Type.ICE) && this.scene.arena.weather?.weatherType === WeatherType.SNOW) {
        ret *= 1.5;
      }
      break;
    case Stat.SPATK:
      break;
    case Stat.SPDEF:
      if (this.isOfType(Type.ROCK) && this.scene.arena.weather?.weatherType === WeatherType.SANDSTORM) {
        ret *= 1.5;
      }
      break;
    case Stat.SPD:
      // Check both the player and enemy to see if Tailwind should be multiplying the speed of the Pokemon
      if    ((this.isPlayer() && this.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER))
          ||  (!this.isPlayer() && this.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.ENEMY))) {
        ret *= 2;
      }

      if (this.getTag(BattlerTagType.SLOW_START)) {
        ret >>= 1;
      }
      if (this.status && this.status.effect === StatusEffect.PARALYSIS) {
        ret >>= 1;
      }
      break;
    }

    const highestStatBoost = this.findTag(t => t instanceof HighestStatBoostTag && (t as HighestStatBoostTag).stat === stat) as HighestStatBoostTag;
    if (highestStatBoost) {
      ret *= highestStatBoost.multiplier;
    }

    return Math.floor(ret);
  }

  calculateStats(): void {
    if (!this.stats) {
      this.stats = [ 0, 0, 0, 0, 0, 0 ];
    }
    const baseStats = this.getSpeciesForm().baseStats.slice(0);
    if (this.fusionSpecies) {
      const fusionBaseStats = this.getFusionSpeciesForm().baseStats;
      for (let s = 0; s < this.stats.length; s++) {
        baseStats[s] = Math.ceil((baseStats[s] + fusionBaseStats[s]) / 2);
      }
    } else if (this.scene.gameMode.isSplicedOnly) {
      for (let s = 0; s < this.stats.length; s++) {
        baseStats[s] = Math.ceil(baseStats[s] / 2);
      }
    }
    this.scene.applyModifiers(PokemonBaseStatModifier, this.isPlayer(), this, baseStats);
    const stats = Utils.getEnumValues(Stat);
    for (const s of stats) {
      const isHp = s === Stat.HP;
      const baseStat = baseStats[s];
      let value = Math.floor(((2 * baseStat + this.ivs[s]) * this.level) * 0.01);
      if (isHp) {
        value = value + this.level + 10;
        if (this.hasAbility(Abilities.WONDER_GUARD, false, true)) {
          value = 1;
        }
        if (this.hp > value || this.hp === undefined) {
          this.hp = value;
        } else if (this.hp) {
          const lastMaxHp = this.getMaxHp();
          if (lastMaxHp && value > lastMaxHp) {
            this.hp += value - lastMaxHp;
          }
        }
      } else {
        value += 5;
        const natureStatMultiplier = new Utils.NumberHolder(getNatureStatMultiplier(this.getNature(), s));
        this.scene.applyModifier(PokemonNatureWeightModifier, this.isPlayer(), this, natureStatMultiplier);
        if (natureStatMultiplier.value !== 1) {
          value = Math.max(Math[natureStatMultiplier.value > 1 ? "ceil" : "floor"](value * natureStatMultiplier.value), 1);
        }
      }
      this.stats[s] = value;
    }
  }

  getNature(): Nature {
    return this.natureOverride !== -1 ? this.natureOverride : this.nature;
  }

  setNature(nature: Nature): void {
    this.nature = nature;
    this.calculateStats();
  }

  generateNature(naturePool?: Nature[]): void {
    if (naturePool === undefined) {
      naturePool = Utils.getEnumValues(Nature);
    }
    const nature = naturePool[Utils.randSeedInt(naturePool.length)];
    this.setNature(nature);
  }

  getMaxHp(): integer {
    return this.getStat(Stat.HP);
  }

  getInverseHp(): integer {
    return this.getMaxHp() - this.hp;
  }

  getHpRatio(precise: boolean = false): number {
    return precise
      ? this.hp / this.getMaxHp()
      : Math.round((this.hp / this.getMaxHp()) * 100) / 100;
  }

  generateGender(): void {
    if (this.species.malePercent === null) {
      this.gender = Gender.GENDERLESS;
    } else {
      const genderChance = (this.id % 256) * 0.390625;
      if (genderChance < this.species.malePercent) {
        this.gender = Gender.MALE;
      } else {
        this.gender = Gender.FEMALE;
      }
    }
  }

  getGender(ignoreOverride?: boolean): Gender {
    if (!ignoreOverride && this.summonData?.gender !== undefined) {
      return this.summonData.gender;
    }
    return this.gender;
  }

  getFusionGender(ignoreOverride?: boolean): Gender {
    if (!ignoreOverride && this.summonData?.fusionGender !== undefined) {
      return this.summonData.fusionGender;
    }
    return this.fusionGender;
  }

  isShiny(): boolean {
    return this.shiny || (this.isFusion() && this.fusionShiny);
  }

  getVariant(): Variant {
    return !this.isFusion() ? this.variant : Math.max(this.variant, this.fusionVariant) as Variant;
  }

  getLuck(): integer {
    return this.luck + (this.isFusion() ? this.fusionLuck : 0);
  }

  isFusion(): boolean {
    return !!this.fusionSpecies;
  }

  abstract isBoss(): boolean;

  getMoveset(ignoreOverride?: boolean): PokemonMove[] {
    const ret = !ignoreOverride && this.summonData?.moveset
      ? this.summonData.moveset
      : this.moveset;

    // Overrides moveset based on arrays specified in overrides.ts
    const overrideArray: Array<Moves> = this.isPlayer() ? Overrides.MOVESET_OVERRIDE : Overrides.OPP_MOVESET_OVERRIDE;
    if (overrideArray.length > 0) {
      overrideArray.forEach((move: Moves, index: number) => {
        const ppUsed = this.moveset[index]?.ppUsed || 0;
        this.moveset[index] = new PokemonMove(move, Math.min(ppUsed, allMoves[move].pp));
      });
    }

    return ret;
  }

  getLearnableLevelMoves(): Moves[] {
    return this.getLevelMoves(1, true).map(lm => lm[1]).filter(lm => !this.moveset.filter(m => m.moveId === lm).length).filter((move: Moves, i: integer, array: Moves[]) => array.indexOf(move) === i);
  }

  getTypes(includeTeraType = false, forDefend: boolean = false, ignoreOverride?: boolean): Type[] {
    const types = [];

    if (includeTeraType) {
      const teraType = this.getTeraType();
      if (teraType !== Type.UNKNOWN) {
        types.push(teraType);
      }
    }

    if (!types.length || !includeTeraType) {
      if (!ignoreOverride && this.summonData?.types) {
        this.summonData.types.forEach(t => types.push(t));
      } else {
        const speciesForm = this.getSpeciesForm();

        types.push(speciesForm.type1);

        const fusionSpeciesForm = this.getFusionSpeciesForm();
        if (fusionSpeciesForm) {
          if (fusionSpeciesForm.type2 !== null && fusionSpeciesForm.type2 !== speciesForm.type1) {
            types.push(fusionSpeciesForm.type2);
          } else if (fusionSpeciesForm.type1 !== speciesForm.type1) {
            types.push(fusionSpeciesForm.type1);
          }
        }

        if (types.length === 1 && speciesForm.type2 !== null) {
          types.push(speciesForm.type2);
        }
      }
    }

    if (forDefend && (this.getTag(BattlerTagType.IGNORE_FLYING) || this.scene.arena.getTag(ArenaTagType.GRAVITY) || this.getTag(BattlerTagType.GROUNDED))) {
      const flyingIndex = types.indexOf(Type.FLYING);
      if (flyingIndex > -1) {
        types.splice(flyingIndex, 1);
      }
    }

    if (!types.length) { // become UNKNOWN if no types are present
      types.push(Type.UNKNOWN);
    }

    if (types.length > 1 && types.includes(Type.UNKNOWN)) { // remove UNKNOWN if other types are present
      const index = types.indexOf(Type.UNKNOWN);
      if (index !== -1) {
        types.splice(index, 1);
      }
    }

    return types;
  }

  isOfType(type: Type, forDefend: boolean = false): boolean {
    return !!this.getTypes(true, forDefend).find(t => t === type);
  }

  /**
   * Gets the non-passive ability of the pokemon. This accounts for fusions and ability changing effects.
   * This should rarely be called, most of the time {@link hasAbility} or {@link hasAbilityWithAttr} are better used as
   * those check both the passive and non-passive abilities and account for ability suppression.
   * @see {@link hasAbility} {@link hasAbilityWithAttr} Intended ways to check abilities in most cases
   * @param {boolean} ignoreOverride If true, ignore ability changing effects
   * @returns {Ability} The non-passive ability of the pokemon
   */
  getAbility(ignoreOverride?: boolean): Ability {
    if (!ignoreOverride && this.summonData?.ability) {
      return allAbilities[this.summonData.ability];
    }
    if (Overrides.ABILITY_OVERRIDE && this.isPlayer()) {
      return allAbilities[Overrides.ABILITY_OVERRIDE];
    }
    if (Overrides.OPP_ABILITY_OVERRIDE && !this.isPlayer()) {
      return allAbilities[Overrides.OPP_ABILITY_OVERRIDE];
    }
    if (this.isFusion()) {
      return allAbilities[this.getFusionSpeciesForm(ignoreOverride).getAbility(this.fusionAbilityIndex)];
    }
    let abilityId = this.getSpeciesForm(ignoreOverride).getAbility(this.abilityIndex);
    if (abilityId === Abilities.NONE) {
      abilityId = this.species.ability1;
    }
    return allAbilities[abilityId];
  }

  /**
   * Gets the passive ability of the pokemon. This should rarely be called, most of the time
   * {@link hasAbility} or {@link hasAbilityWithAttr} are better used as those check both the passive and
   * non-passive abilities and account for ability suppression.
   * @see {@link hasAbility} {@link hasAbilityWithAttr} Intended ways to check abilities in most cases
   * @returns {Ability} The passive ability of the pokemon
   */
  getPassiveAbility(): Ability {
    if (Overrides.PASSIVE_ABILITY_OVERRIDE && this.isPlayer()) {
      return allAbilities[Overrides.PASSIVE_ABILITY_OVERRIDE];
    }
    if (Overrides.OPP_PASSIVE_ABILITY_OVERRIDE && !this.isPlayer()) {
      return allAbilities[Overrides.OPP_PASSIVE_ABILITY_OVERRIDE];
    }

    let starterSpeciesId = this.species.speciesId;
    while (pokemonPrevolutions.hasOwnProperty(starterSpeciesId)) {
      starterSpeciesId = pokemonPrevolutions[starterSpeciesId];
    }
    return allAbilities[starterPassiveAbilities[starterSpeciesId]];
  }

  /**
   * Checks if a pokemon has a passive either from:
   *  - bought with starter candy
   *  - set by override
   *  - is a boss pokemon
   * @returns whether or not a pokemon should have a passive
   */
  hasPassive(): boolean {
    // returns override if valid for current case
    if ((Overrides.PASSIVE_ABILITY_OVERRIDE !== Abilities.NONE && this.isPlayer()) ||
        (Overrides.OPP_PASSIVE_ABILITY_OVERRIDE !== Abilities.NONE && !this.isPlayer())) {
      return true;
    }
    return this.passive || this.isBoss();
  }

  /**
   * Checks whether an ability of a pokemon can be currently applied. This should rarely be
   * directly called, as {@link hasAbility} and {@link hasAbilityWithAttr} already call this.
   * @see {@link hasAbility} {@link hasAbilityWithAttr} Intended ways to check abilities in most cases
   * @param {boolean} passive If true, check if passive can be applied instead of non-passive
   * @returns {Ability} The passive ability of the pokemon
   */
  canApplyAbility(passive: boolean = false, forceBypass: boolean = false): boolean {
    if (passive && !this.hasPassive()) {
      return false;
    }
    const ability = (!passive ? this.getAbility() : this.getPassiveAbility());
    if (this.isFusion() && ability.hasAttr(NoFusionAbilityAbAttr)) {
      return false;
    }
    if (this.scene?.arena.ignoreAbilities && ability.isIgnorable) {
      return false;
    }
    if (this.summonData?.abilitySuppressed && !ability.hasAttr(UnsuppressableAbilityAbAttr)) {
      return false;
    }
    if (this.isOnField() && !ability.hasAttr(SuppressFieldAbilitiesAbAttr)) {
      const suppressed = new Utils.BooleanHolder(false);
      this.scene.getField(true).map(p => {
        if (p.getAbility().hasAttr(SuppressFieldAbilitiesAbAttr) && p.canApplyAbility()) {
          p.getAbility().getAttrs(SuppressFieldAbilitiesAbAttr).map(a => a.apply(this, false, suppressed, [ability]));
        }
        if (p.getPassiveAbility().hasAttr(SuppressFieldAbilitiesAbAttr) && p.canApplyAbility(true)) {
          p.getPassiveAbility().getAttrs(SuppressFieldAbilitiesAbAttr).map(a => a.apply(this, true, suppressed, [ability]));
        }
      });
      if (suppressed.value) {
        return false;
      }
    }
    return (this.hp || ability.isBypassFaint || forceBypass) && !ability.conditions.find(condition => !condition(this));
  }

  /**
   * Checks whether a pokemon has the specified ability and it's in effect. Accounts for all the various
   * effects which can affect whether an ability will be present or in effect, and both passive and
   * non-passive. This is the primary way to check whether a pokemon has a particular ability.
   * @param {Abilities} ability The ability to check for
   * @param {boolean} canApply If false, it doesn't check whether the abiltiy is currently active
   * @param {boolean} ignoreOverride If true, it ignores ability changing effects
   * @returns {boolean} Whether the ability is present and active
   */
  hasAbility(ability: Abilities, canApply: boolean = true, ignoreOverride?: boolean): boolean {
    if ((!canApply || this.canApplyAbility()) && this.getAbility(ignoreOverride).id === ability) {
      return true;
    }
    if (this.hasPassive() && (!canApply || this.canApplyAbility(true)) && this.getPassiveAbility().id === ability) {
      return true;
    }
    return false;
  }

  /**
   * Checks whether a pokemon has an ability with the specified attribute and it's in effect.
   * Accounts for all the various effects which can affect whether an ability will be present or
   * in effect, and both passive and non-passive. This is one of the two primary ways to check
   * whether a pokemon has a particular ability.
   * @param {AbAttr} attrType The ability attribute to check for
   * @param {boolean} canApply If false, it doesn't check whether the abiltiy is currently active
   * @param {boolean} ignoreOverride If true, it ignores ability changing effects
   * @returns {boolean} Whether an ability with that attribute is present and active
   */
  hasAbilityWithAttr(attrType: { new(...args: any[]): AbAttr }, canApply: boolean = true, ignoreOverride?: boolean): boolean {
    if ((!canApply || this.canApplyAbility()) && this.getAbility(ignoreOverride).hasAttr(attrType)) {
      return true;
    }
    if (this.hasPassive() && (!canApply || this.canApplyAbility(true)) && this.getPassiveAbility().hasAttr(attrType)) {
      return true;
    }
    return false;
  }

  getWeight(): number {
    const weight = new Utils.NumberHolder(this.species.weight);
    // This will trigger the ability overlay so only call this function when necessary
    applyAbAttrs(WeightMultiplierAbAttr, this, null, weight);
    return weight.value;
  }

  getTeraType(): Type {
    const teraModifier = this.scene.findModifier(m => m instanceof TerastallizeModifier
      && m.pokemonId === this.id && !!m.getBattlesLeft(), this.isPlayer()) as TerastallizeModifier;
    if (teraModifier) {
      return teraModifier.teraType;
    }

    return Type.UNKNOWN;
  }

  isTerastallized(): boolean {
    return this.getTeraType() !== Type.UNKNOWN;
  }

  isGrounded(): boolean {
    return !this.isOfType(Type.FLYING, true) && !this.hasAbility(Abilities.LEVITATE);
  }

  getAttackMoveEffectiveness(source: Pokemon, move: PokemonMove): TypeDamageMultiplier {
    const typeless = !!move.getMove().getAttrs(TypelessAttr).length;
    const typeMultiplier = new Utils.NumberHolder(this.getAttackTypeEffectiveness(move.getMove().type, source));
    const cancelled = new Utils.BooleanHolder(false);
    if (!typeless) {
      applyPreDefendAbAttrs(TypeImmunityAbAttr, this, source, move, cancelled, typeMultiplier, true);
    }
    if (!cancelled.value) {
      applyPreDefendAbAttrs(MoveImmunityAbAttr, this, source, move, cancelled, typeMultiplier, true);
    }
    return (!cancelled.value ? typeMultiplier.value : 0) as TypeDamageMultiplier;
  }

  getAttackTypeEffectiveness(moveType: Type, source?: Pokemon): TypeDamageMultiplier {
    if (moveType === Type.STELLAR) {
      return this.isTerastallized() ? 2 : 1;
    }
    const types = this.getTypes(true, true);

    let multiplier = types.map(defType => {
      if (source) {
        const ignoreImmunity = new Utils.BooleanHolder(false);
        applyAbAttrs(IgnoreTypeImmunityAbAttr, source, ignoreImmunity, moveType, defType);
        if (ignoreImmunity.value) {
          return 1;
        }
      }

      return getTypeDamageMultiplier(moveType, defType);
    }).reduce((acc, cur) => acc * cur, 1) as TypeDamageMultiplier;

    // Handle strong winds lowering effectiveness of types super effective against pure flying
    if (this.scene.arena.weather?.weatherType === WeatherType.STRONG_WINDS && !this.scene.arena.weather.isEffectSuppressed(this.scene) && multiplier >= 2 && this.isOfType(Type.FLYING) && getTypeDamageMultiplier(moveType, Type.FLYING) === 2) {
      multiplier /= 2;
    }
    return multiplier;
  }

  getMatchupScore(pokemon: Pokemon): number {
    const types = this.getTypes(true);
    const enemyTypes = pokemon.getTypes(true, true);
    const outspeed = (this.isActive(true) ? this.getBattleStat(Stat.SPD, pokemon) : this.getStat(Stat.SPD)) <= pokemon.getBattleStat(Stat.SPD, this);
    let atkScore = pokemon.getAttackTypeEffectiveness(types[0], this) * (outspeed ? 1.25 : 1);
    let defScore = 1 / Math.max(this.getAttackTypeEffectiveness(enemyTypes[0], pokemon), 0.25);
    if (types.length > 1) {
      atkScore *= pokemon.getAttackTypeEffectiveness(types[1], this);
    }
    if (enemyTypes.length > 1) {
      defScore *= (1 / Math.max(this.getAttackTypeEffectiveness(enemyTypes[1], pokemon), 0.25));
    }
    let hpDiffRatio = this.getHpRatio() + (1 - pokemon.getHpRatio());
    if (outspeed) {
      hpDiffRatio = Math.min(hpDiffRatio * 1.5, 1);
    }
    return (atkScore + defScore) * hpDiffRatio;
  }

  getEvolution(): SpeciesFormEvolution {
    if (pokemonEvolutions.hasOwnProperty(this.species.speciesId)) {
      const evolutions = pokemonEvolutions[this.species.speciesId];
      for (const e of evolutions) {
        if (!e.item && this.level >= e.level && (!e.preFormKey || this.getFormKey() === e.preFormKey)) {
          if (e.condition === null || (e.condition as SpeciesEvolutionCondition).predicate(this)) {
            return e;
          }
        }
      }
    }

    if (this.isFusion() && pokemonEvolutions.hasOwnProperty(this.fusionSpecies.speciesId)) {
      const fusionEvolutions = pokemonEvolutions[this.fusionSpecies.speciesId].map(e => new FusionSpeciesFormEvolution(this.species.speciesId, e));
      for (const fe of fusionEvolutions) {
        if (!fe.item && this.level >= fe.level && (!fe.preFormKey || this.getFusionFormKey() === fe.preFormKey)) {
          if (fe.condition === null || (fe.condition as SpeciesEvolutionCondition).predicate(this)) {
            return fe;
          }
        }
      }
    }

    return null;
  }

  getLevelMoves(startingLevel?: integer, includeEvolutionMoves: boolean = false, simulateEvolutionChain: boolean = false): LevelMoves {
    const ret: LevelMoves = [];
    let levelMoves: LevelMoves = [];
    if (!startingLevel) {
      startingLevel = this.level;
    }
    if (simulateEvolutionChain) {
      const evolutionChain = this.species.getSimulatedEvolutionChain(this.level, this.hasTrainer(), this.isBoss(), this.isPlayer());
      for (let e = 0; e < evolutionChain.length; e++) {
        // TODO: Might need to pass specific form index in simulated evolution chain
        const speciesLevelMoves = getPokemonSpeciesForm(evolutionChain[e][0] as Species, this.formIndex).getLevelMoves();
        levelMoves.push(...speciesLevelMoves.filter(lm => (includeEvolutionMoves && !lm[0]) || ((!e || lm[0] > 1) && (e === evolutionChain.length - 1 || lm[0] <= evolutionChain[e + 1][1]))));
      }
      levelMoves.sort((lma: [integer, integer], lmb: [integer, integer]) => lma[0] > lmb[0] ? 1 : lma[0] < lmb[0] ? -1 : 0);
      const uniqueMoves: Moves[] = [];
      levelMoves = levelMoves.filter(lm => {
        if (uniqueMoves.find(m => m === lm[1])) {
          return false;
        }
        uniqueMoves.push(lm[1]);
        return true;
      });
    } else {
      levelMoves = this.getSpeciesForm(true).getLevelMoves();
    }
    if (this.fusionSpecies) {
      const evolutionLevelMoves = levelMoves.slice(0, Math.max(levelMoves.findIndex(lm => !!lm[0]), 0));
      const fusionLevelMoves = this.getFusionSpeciesForm(true).getLevelMoves();
      const newLevelMoves: LevelMoves = [];
      while (levelMoves.length && levelMoves[0][0] < startingLevel) {
        levelMoves.shift();
      }
      while (fusionLevelMoves.length && fusionLevelMoves[0][0] < startingLevel) {
        fusionLevelMoves.shift();
      }
      if (includeEvolutionMoves) {
        for (const elm of evolutionLevelMoves.reverse()) {
          levelMoves.unshift(elm);
        }
      }
      for (let l = includeEvolutionMoves ? 0 : startingLevel; l <= this.level; l++) {
        if (l === 1 && startingLevel > 1) {
          l = startingLevel;
        }
        while (levelMoves.length && levelMoves[0][0] === l) {
          const levelMove = levelMoves.shift();
          if (!newLevelMoves.find(lm => lm[1] === levelMove[1])) {
            newLevelMoves.push(levelMove);
          }
        }
        while (fusionLevelMoves.length && fusionLevelMoves[0][0] === l) {
          const fusionLevelMove = fusionLevelMoves.shift();
          if (!newLevelMoves.find(lm => lm[1] === fusionLevelMove[1])) {
            newLevelMoves.push(fusionLevelMove);
          }
        }
      }
      levelMoves = newLevelMoves;
    }
    if (levelMoves) {
      for (const lm of levelMoves) {
        const level = lm[0];
        if ((!includeEvolutionMoves || level) && level < startingLevel) {
          continue;
        } else if (level > this.level) {
          break;
        }
        ret.push(lm);
      }
    }

    return ret;
  }

  setMove(moveIndex: integer, moveId: Moves): void {
    const move = moveId ? new PokemonMove(moveId) : null;
    this.moveset[moveIndex] = move;
    if (this.summonData?.moveset) {
      this.summonData.moveset[moveIndex] = move;
    }
  }

  trySetShiny(thresholdOverride?: integer): boolean {
    const rand1 = Utils.binToDec(Utils.decToBin(this.id).substring(0, 16));
    const rand2 = Utils.binToDec(Utils.decToBin(this.id).substring(16, 32));

    const E = this.scene.gameData.trainerId ^ this.scene.gameData.secretId;
    const F = rand1 ^ rand2;

    const shinyThreshold = new Utils.IntegerHolder(32);
    if (thresholdOverride === undefined) {
      if (!this.hasTrainer()) {
        this.scene.applyModifiers(ShinyRateBoosterModifier, true, shinyThreshold);
      }
    } else {
      shinyThreshold.value = thresholdOverride;
    }

    this.shiny = (E ^ F) < shinyThreshold.value;
    if ((E ^ F) < 32) {
      console.log("REAL SHINY!!");
    }

    if (this.shiny) {
      this.initShinySparkle();
    }

    return this.shiny;
  }

  generateVariant(): Variant {
    if (!this.shiny || !variantData.hasOwnProperty(this.species.speciesId)) {
      return 0;
    }
    const rand = Utils.randSeedInt(10);
    if (rand > 3) {
      return 0;
    }
    if (rand) {
      return 1;
    }
    return 2;
  }

  generateFusionSpecies(forStarter?: boolean): void {
    const hiddenAbilityChance = new Utils.IntegerHolder(256);
    if (!this.hasTrainer()) {
      this.scene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);
    }

    const hasHiddenAbility = !Utils.randSeedInt(hiddenAbilityChance.value);
    const randAbilityIndex = Utils.randSeedInt(2);

    const filter = !forStarter ? this.species.getCompatibleFusionSpeciesFilter()
      : species => {
        return pokemonEvolutions.hasOwnProperty(species.speciesId)
      && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
      && !species.pseudoLegendary
      && !species.legendary
      && !species.mythical
      && !species.isTrainerForbidden()
      && species.speciesId !== this.species.speciesId;
      };

    this.fusionSpecies = this.scene.randomSpecies(this.scene.currentBattle?.waveIndex || 0, this.level, false, filter, true);
    this.fusionAbilityIndex = (this.fusionSpecies.abilityHidden && hasHiddenAbility ? this.fusionSpecies.ability2 ? 2 : 1 : this.fusionSpecies.ability2 ? randAbilityIndex : 0);
    this.fusionShiny = this.shiny;
    this.fusionVariant = this.variant;

    if (this.fusionSpecies.malePercent === null) {
      this.fusionGender = Gender.GENDERLESS;
    } else {
      const genderChance = (this.id % 256) * 0.390625;
      if (genderChance < this.fusionSpecies.malePercent) {
        this.fusionGender = Gender.MALE;
      } else {
        this.fusionGender = Gender.FEMALE;
      }
    }

    this.fusionFormIndex = this.scene.getSpeciesFormIndex(this.fusionSpecies, this.fusionGender, this.getNature(), true);
    this.fusionLuck = this.luck;

    this.generateName();
  }

  clearFusionSpecies(): void {
    this.fusionSpecies = undefined;
    this.fusionFormIndex = 0;
    this.fusionAbilityIndex = 0;
    this.fusionShiny = false;
    this.fusionVariant = 0;
    this.fusionGender = 0;
    this.fusionLuck = 0;

    this.generateName();
    this.calculateStats();
  }

  generateAndPopulateMoveset(): void {
    this.moveset = [];
    let movePool: [Moves, number][] = [];
    const allLevelMoves = this.getLevelMoves(1, true, true);
    if (!allLevelMoves) {
      console.log(this.species.speciesId, "ERROR");
      return;
    }

    for (let m = 0; m < allLevelMoves.length; m++) {
      const levelMove = allLevelMoves[m];
      if (this.level < levelMove[0]) {
        break;
      }
      let weight = levelMove[0];
      if (weight === 0) { // Evo Moves
        weight = 50;
      }
      if (weight === 1 && allMoves[levelMove[1]].power >= 80) { // Assume level 1 moves with 80+ BP are "move reminder" moves and bump their weight
        weight = 40;
      }
      if (allMoves[levelMove[1]].name.endsWith(" (N)")) {
        weight /= 100;
      } // Unimplemented level up moves are possible to generate, but 1% of their normal chance.
      if (!movePool.some(m => m[0] === levelMove[1])) {
        movePool.push([levelMove[1], weight]);
      }
    }

    if (this.hasTrainer()) {
      const tms = Object.keys(tmSpecies);
      for (const tm of tms) {
        const moveId = parseInt(tm) as Moves;
        let compatible = false;
        for (const p of tmSpecies[tm]) {
          if (Array.isArray(p)) {
            if (p[0] === this.species.speciesId || (this.fusionSpecies && p[0] === this.fusionSpecies.speciesId) && p.slice(1).indexOf(this.species.forms[this.formIndex]) > -1) {
              compatible = true;
              break;
            }
          } else if (p === this.species.speciesId || (this.fusionSpecies && p === this.fusionSpecies.speciesId)) {
            compatible = true;
            break;
          }
        }
        if (compatible && !movePool.some(m => m[0] === moveId) && !allMoves[moveId].name.endsWith(" (N)")) {
          if (tmPoolTiers[moveId] === ModifierTier.COMMON && this.level >= 15) {
            movePool.push([moveId, 4]);
          } else if (tmPoolTiers[moveId] === ModifierTier.GREAT && this.level >= 30) {
            movePool.push([moveId, 8]);
          } else if (tmPoolTiers[moveId] === ModifierTier.ULTRA && this.level >= 50) {
            movePool.push([moveId, 14]);
          }
        }
      }

      if (this.level >= 60) { // No egg moves below level 60
        for (let i = 0; i < 3; i++) {
          const moveId = speciesEggMoves[this.species.getRootSpeciesId()][i];
          if (!movePool.some(m => m[0] === moveId) && !allMoves[moveId].name.endsWith(" (N)")) {
            movePool.push([moveId, 40]);
          }
        }
        const moveId = speciesEggMoves[this.species.getRootSpeciesId()][3];
        if (this.level >= 170 && !movePool.some(m => m[0] === moveId) && !allMoves[moveId].name.endsWith(" (N)") && !this.isBoss()) { // No rare egg moves before e4
          movePool.push([moveId, 30]);
        }
        if (this.fusionSpecies) {
          for (let i = 0; i < 3; i++) {
            const moveId = speciesEggMoves[this.fusionSpecies.getRootSpeciesId()][i];
            if (!movePool.some(m => m[0] === moveId) && !allMoves[moveId].name.endsWith(" (N)")) {
              movePool.push([moveId, 40]);
            }
          }
          const moveId = speciesEggMoves[this.fusionSpecies.getRootSpeciesId()][3];
          if (this.level >= 170 && !movePool.some(m => m[0] === moveId) && !allMoves[moveId].name.endsWith(" (N)") && !this.isBoss()) {// No rare egg moves before e4
            movePool.push([moveId, 30]);
          }
        }
      }
    }

    if (this.isBoss()) { // Bosses never get self ko moves
      movePool = movePool.filter(m => !allMoves[m[0]].getAttrs(SacrificialAttr).length);
    }
    movePool = movePool.filter(m => !allMoves[m[0]].getAttrs(SacrificialAttrOnHit).length);
    if (this.hasTrainer()) {
      // Trainers never get OHKO moves
      movePool = movePool.filter(m => !allMoves[m[0]].getAttrs(OneHitKOAttr).length);
      // Half the weight of self KO moves
      movePool = movePool.map(m => [m[0], m[1] * (!!allMoves[m[0]].getAttrs(SacrificialAttr).length ? 0.5 : 1)]);
      movePool = movePool.map(m => [m[0], m[1] * (!!allMoves[m[0]].getAttrs(SacrificialAttrOnHit).length ? 0.5 : 1)]);
      // Trainers get a weight bump to stat buffing moves
      movePool = movePool.map(m => [m[0], m[1] * (allMoves[m[0]].getAttrs(StatChangeAttr).some(a => (a as StatChangeAttr).levels > 1 && (a as StatChangeAttr).selfTarget) ? 1.25 : 1)]);
      // Trainers get a weight decrease to multiturn moves
      movePool = movePool.map(m => [m[0], m[1] * (!!allMoves[m[0]].getAttrs(ChargeAttr).length || !!allMoves[m[0]].getAttrs(RechargeAttr).length ? 0.7 : 1)]);
    }

    // Weight towards higher power moves, by reducing the power of moves below the highest power.
    // Caps max power at 90 to avoid something like hyper beam ruining the stats.
    // This is a pretty soft weighting factor, although it is scaled with the weight multiplier.
    const maxPower = Math.min(movePool.reduce((v, m) => Math.max(allMoves[m[0]].power, v), 40), 90);
    movePool = movePool.map(m => [m[0], m[1] * (allMoves[m[0]].category === MoveCategory.STATUS ? 1 : Math.max(Math.min(allMoves[m[0]].power/maxPower, 1), 0.5))]);

    // Weight damaging moves against the lower stat
    const worseCategory: MoveCategory = this.stats[Stat.ATK] > this.stats[Stat.SPATK] ? MoveCategory.SPECIAL : MoveCategory.PHYSICAL;
    const statRatio = worseCategory === MoveCategory.PHYSICAL ? this.stats[Stat.ATK]/this.stats[Stat.SPATK] : this.stats[Stat.SPATK]/this.stats[Stat.ATK];
    movePool = movePool.map(m => [m[0], m[1] * (allMoves[m[0]].category === worseCategory ? statRatio : 1)]);

    let weightMultiplier = 0.9; // The higher this is the more the game weights towards higher level moves. At 0 all moves are equal weight.
    if (this.hasTrainer()) {
      weightMultiplier += 0.7;
    }
    if (this.isBoss()) {
      weightMultiplier += 0.4;
    }
    const baseWeights: [Moves, number][] = movePool.map(m => [m[0], Math.ceil(Math.pow(m[1], weightMultiplier)*100)]);

    if (this.hasTrainer() || this.isBoss()) { // Trainers and bosses always force a stab move
      const stabMovePool = baseWeights.filter(m => allMoves[m[0]].category !== MoveCategory.STATUS && this.isOfType(allMoves[m[0]].type));

      if (stabMovePool.length) {
        const totalWeight = stabMovePool.reduce((v, m) => v + m[1], 0);
        let rand = Utils.randSeedInt(totalWeight);
        let index = 0;
        while (rand > stabMovePool[index][1]) {
          rand -= stabMovePool[index++][1];
        }
        this.moveset.push(new PokemonMove(stabMovePool[index][0], 0, 0));
      }
    } else { // Normal wild pokemon just force a random damaging move
      const attackMovePool = baseWeights.filter(m => allMoves[m[0]].category !== MoveCategory.STATUS);
      if (attackMovePool.length) {
        const totalWeight = attackMovePool.reduce((v, m) => v + m[1], 0);
        let rand = Utils.randSeedInt(totalWeight);
        let index = 0;
        while (rand > attackMovePool[index][1]) {
          rand -= attackMovePool[index++][1];
        }
        this.moveset.push(new PokemonMove(attackMovePool[index][0], 0, 0));
      }
    }

    while (baseWeights.length > this.moveset.length && this.moveset.length < 4) {
      if (this.hasTrainer()) {
        // Sqrt the weight of any damaging moves with overlapping types. This is about a 0.05 - 0.1 multiplier.
        // Other damaging moves 2x weight if 0-1 damaging moves, 0.5x if 2, 0.125x if 3. These weights double if STAB.
        // Status moves remain unchanged on weight, this encourages 1-2
        movePool = baseWeights.filter(m => !this.moveset.some(mo => m[0] === mo.moveId)).map(m => [m[0], this.moveset.some(mo => mo.getMove().category !== MoveCategory.STATUS && mo.getMove().type === allMoves[m[0]].type) ? Math.ceil(Math.sqrt(m[1])) : allMoves[m[0]].category !== MoveCategory.STATUS ? Math.ceil(m[1]/Math.max(Math.pow(4, this.moveset.filter(mo => mo.getMove().power > 1).length)/8,0.5) * (this.isOfType(allMoves[m[0]].type) ? 2 : 1)) : m[1]]);
      } else { // Non-trainer pokemon just use normal weights
        movePool = baseWeights.filter(m => !this.moveset.some(mo => m[0] === mo.moveId));
      }
      const totalWeight = movePool.reduce((v, m) => v + m[1], 0);
      let rand = Utils.randSeedInt(totalWeight);
      let index = 0;
      while (rand > movePool[index][1]) {
        rand -= movePool[index++][1];
      }
      this.moveset.push(new PokemonMove(movePool[index][0], 0, 0));
    }

    this.scene.triggerPokemonFormChange(this, SpeciesFormChangeMoveLearnedTrigger);
  }

  trySelectMove(moveIndex: integer, ignorePp?: boolean): boolean {
    const move = this.getMoveset().length > moveIndex
      ? this.getMoveset()[moveIndex]
      : null;
    return move?.isUsable(this, ignorePp);
  }

  showInfo(): void {
    if (!this.battleInfo.visible) {
      const otherBattleInfo = this.scene.fieldUI.getAll().slice(0, 4).filter(ui => ui instanceof BattleInfo && ((ui as BattleInfo) instanceof PlayerBattleInfo) === this.isPlayer()).find(() => true);
      if (!otherBattleInfo || !this.getFieldIndex()) {
        this.scene.fieldUI.sendToBack(this.battleInfo);
        this.scene.sendTextToBack(); // Push the top right text objects behind everything else
      } else {
        this.scene.fieldUI.moveAbove(this.battleInfo, otherBattleInfo);
      }
      this.battleInfo.setX(this.battleInfo.x + (this.isPlayer() ? 150 : !this.isBoss() ? -150 : -198));
      this.battleInfo.setVisible(true);
      if (this.isPlayer()) {
        this.battleInfo.expMaskRect.x += 150;
      }
      this.scene.tweens.add({
        targets: [ this.battleInfo, this.battleInfo.expMaskRect ],
        x: this.isPlayer() ? "-=150" : `+=${!this.isBoss() ? 150 : 246}`,
        duration: 1000,
        ease: "Cubic.easeOut"
      });
    }
  }

  hideInfo(): Promise<void> {
    return new Promise(resolve => {
      if (this.battleInfo.visible) {
        this.scene.tweens.add({
          targets: [ this.battleInfo, this.battleInfo.expMaskRect ],
          x: this.isPlayer() ? "+=150" : `-=${!this.isBoss() ? 150 : 246}`,
          duration: 500,
          ease: "Cubic.easeIn",
          onComplete: () => {
            if (this.isPlayer()) {
              this.battleInfo.expMaskRect.x -= 150;
            }
            this.battleInfo.setVisible(false);
            this.battleInfo.setX(this.battleInfo.x - (this.isPlayer() ? 150 : !this.isBoss() ? -150 : -198));
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  updateInfo(instant?: boolean): Promise<void> {
    return this.battleInfo.updateInfo(this, instant);
  }

  toggleStats(visible: boolean): void {
    this.battleInfo.toggleStats(visible);
  }
  toggleFlyout(visible: boolean): void {
    this.battleInfo.flyoutMenu?.toggleFlyout(visible);
  }

  addExp(exp: integer) {
    const maxExpLevel = this.scene.getMaxExpLevel();
    const initialExp = this.exp;
    this.exp += exp;
    while (this.level < maxExpLevel && this.exp >= getLevelTotalExp(this.level + 1, this.species.growthRate)) {
      this.level++;
    }
    if (this.level >= maxExpLevel) {
      console.log(initialExp, this.exp, getLevelTotalExp(this.level, this.species.growthRate));
      this.exp = Math.max(getLevelTotalExp(this.level, this.species.growthRate), initialExp);
    }
    this.levelExp = this.exp - getLevelTotalExp(this.level, this.species.growthRate);
  }

  getOpponent(targetIndex: integer): Pokemon {
    const ret = this.getOpponents()[targetIndex];
    if (ret.summonData) {
      return ret;
    }
    return null;
  }

  getOpponents(): Pokemon[] {
    return ((this.isPlayer() ? this.scene.getEnemyField() : this.scene.getPlayerField()) as Pokemon[]).filter(p => p.isActive());
  }

  getOpponentDescriptor(): string {
    const opponents = this.getOpponents();
    if (opponents.length === 1) {
      return opponents[0].name;
    }
    return this.isPlayer() ? "the opposing team" : "your team";
  }

  getAlly(): Pokemon {
    return (this.isPlayer() ? this.scene.getPlayerField() : this.scene.getEnemyField())[this.getFieldIndex() ? 0 : 1];
  }

  apply(source: Pokemon, battlerMove: PokemonMove): HitResult {
    let result: HitResult;
    const move = battlerMove.getMove();
    const damage = new Utils.NumberHolder(0);
    const defendingSidePlayField = this.isPlayer() ? this.scene.getPlayerField() : this.scene.getEnemyField();

    const variableCategory = new Utils.IntegerHolder(move.category);
    applyMoveAttrs(VariableMoveCategoryAttr, source, this, move, variableCategory);
    const moveCategory = variableCategory.value as MoveCategory;

    const variableType = new Utils.IntegerHolder(move.type);
    const typeChangeMovePowerMultiplier = new Utils.NumberHolder(1);
    applyMoveAttrs(VariableMoveTypeAttr, source, this, move, variableType);
    // 2nd argument is for MoveTypeChangePowerMultiplierAbAttr
    applyAbAttrs(VariableMoveTypeAbAttr, source, null, variableType, typeChangeMovePowerMultiplier);
    applyPreAttackAbAttrs(MoveTypeChangeAttr, source, this, battlerMove, variableType, typeChangeMovePowerMultiplier);
    const type = variableType.value as Type;
    const types = this.getTypes(true, true);

    const cancelled = new Utils.BooleanHolder(false);
    const typeless = !!move.getAttrs(TypelessAttr).length;
    const typeMultiplier = new Utils.NumberHolder(!typeless && (moveCategory !== MoveCategory.STATUS || move.getAttrs(StatusMoveTypeImmunityAttr).find(attr => types.includes((attr as StatusMoveTypeImmunityAttr).immuneType)))
      ? this.getAttackTypeEffectiveness(type, source)
      : 1);
    applyMoveAttrs(VariableMoveTypeMultiplierAttr, source, this, move, typeMultiplier);
    if (typeless) {
      typeMultiplier.value = 1;
    }
    if (types.find(t => move.isTypeImmune(t))) {
      typeMultiplier.value = 0;
    }

    // Apply arena tags for conditional protection
    if (!move.hasFlag(MoveFlags.IGNORE_PROTECT) && !move.isAllyTarget()) {
      const defendingSide = this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
      this.scene.arena.applyTagsForSide(ArenaTagType.QUICK_GUARD, defendingSide, cancelled, this, move.priority);
      this.scene.arena.applyTagsForSide(ArenaTagType.WIDE_GUARD, defendingSide, cancelled, this, move.moveTarget);
      this.scene.arena.applyTagsForSide(ArenaTagType.MAT_BLOCK, defendingSide, cancelled, this, move.category);
      this.scene.arena.applyTagsForSide(ArenaTagType.CRAFTY_SHIELD, defendingSide, cancelled, this, move.category, move.moveTarget);
    }

    switch (moveCategory) {
    case MoveCategory.PHYSICAL:
    case MoveCategory.SPECIAL:
      const isPhysical = moveCategory === MoveCategory.PHYSICAL;
      const power = new Utils.NumberHolder(move.power);
      const sourceTeraType = source.getTeraType();
      if (sourceTeraType !== Type.UNKNOWN && sourceTeraType === type && power.value < 60 && move.priority <= 0 && !move.getAttrs(MultiHitAttr).length && !this.scene.findModifier(m => m instanceof PokemonMultiHitModifier && m.pokemonId === source.id)) {
        power.value = 60;
      }
      applyPreAttackAbAttrs(VariableMovePowerAbAttr, source, this, battlerMove, power);
      this.scene.getField(true).map(p => applyPreAttackAbAttrs(FieldVariableMovePowerAbAttr, this, source, battlerMove, power));

      applyPreDefendAbAttrs(ReceivedMoveDamageMultiplierAbAttr, this, source, battlerMove, cancelled, power);

      power.value *= typeChangeMovePowerMultiplier.value;

      if (!typeless) {
        applyPreDefendAbAttrs(TypeImmunityAbAttr, this, source, battlerMove, cancelled, typeMultiplier);
      }
      if (!cancelled.value) {
        applyPreDefendAbAttrs(MoveImmunityAbAttr, this, source, battlerMove, cancelled, typeMultiplier);
        defendingSidePlayField.forEach((p) => applyPreDefendAbAttrs(FieldPriorityMoveImmunityAbAttr, p, source, battlerMove, cancelled, typeMultiplier));
      }

      if (cancelled.value) {
        result = HitResult.NO_EFFECT;
      } else {
        const typeBoost = source.findTag(t => t instanceof TypeBoostTag && (t as TypeBoostTag).boostedType === type) as TypeBoostTag;
        if (typeBoost) {
          power.value *= typeBoost.boostValue;
          if (typeBoost.oneUse) {
            source.removeTag(typeBoost.tagType);
          }
        }
        const arenaAttackTypeMultiplier = new Utils.NumberHolder(this.scene.arena.getAttackTypeMultiplier(type, source.isGrounded()));
        applyMoveAttrs(IgnoreWeatherTypeDebuffAttr, source, this, move, arenaAttackTypeMultiplier);
        if (this.scene.arena.getTerrainType() === TerrainType.GRASSY && this.isGrounded() && type === Type.GROUND && move.moveTarget === MoveTarget.ALL_NEAR_OTHERS) {
          power.value /= 2;
        }
        applyMoveAttrs(VariablePowerAttr, source, this, move, power);
        this.scene.applyModifiers(PokemonMultiHitModifier, source.isPlayer(), source, new Utils.IntegerHolder(0), power);
        if (!typeless) {
          this.scene.arena.applyTags(WeakenMoveTypeTag, type, power);
          this.scene.applyModifiers(AttackTypeBoosterModifier, source.isPlayer(), source, type, power);
        }
        if (source.getTag(HelpingHandTag)) {
          power.value *= 1.5;
        }
        let isCritical: boolean;
        const critOnly = new Utils.BooleanHolder(false);
        const critAlways = source.getTag(BattlerTagType.ALWAYS_CRIT);
        applyMoveAttrs(CritOnlyAttr, source, this, move, critOnly);
        applyAbAttrs(ConditionalCritAbAttr, source, null, critOnly, this, move);
        if (critOnly.value || critAlways) {
          isCritical = true;
        } else {
          const critLevel = new Utils.IntegerHolder(0);
          applyMoveAttrs(HighCritAttr, source, this, move, critLevel);
          this.scene.applyModifiers(TempBattleStatBoosterModifier, source.isPlayer(), TempBattleStat.CRIT, critLevel);
          const bonusCrit = new Utils.BooleanHolder(false);
          if (applyAbAttrs(BonusCritAbAttr, source, null, bonusCrit)) {
            if (bonusCrit.value) {
              critLevel.value += 1;
            }
          }
          if (source.getTag(BattlerTagType.CRIT_BOOST)) {
            critLevel.value += 2;
          }
          const critChance = [24, 8, 2, 1][Math.max(0, Math.min(critLevel.value, 3))];
          isCritical = !source.getTag(BattlerTagType.NO_CRIT) && (critChance === 1 || !this.scene.randBattleSeedInt(critChance));
        }
        if (isCritical) {
          const blockCrit = new Utils.BooleanHolder(false);
          applyAbAttrs(BlockCritAbAttr, this, null, blockCrit);
          if (blockCrit.value) {
            isCritical = false;
          }
        }
        const sourceAtk = new Utils.IntegerHolder(source.getBattleStat(isPhysical ? Stat.ATK : Stat.SPATK, this, null, isCritical));
        const targetDef = new Utils.IntegerHolder(this.getBattleStat(isPhysical ? Stat.DEF : Stat.SPDEF, source, move, isCritical));
        const criticalMultiplier = new Utils.NumberHolder(isCritical ? 1.5 : 1);
        applyAbAttrs(MultCritAbAttr, source, null, criticalMultiplier);
        const screenMultiplier = new Utils.NumberHolder(1);
        if (!isCritical) {
          this.scene.arena.applyTagsForSide(WeakenMoveScreenTag, this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY, move.category, this.scene.currentBattle.double, screenMultiplier);
        }
        const isTypeImmune = (typeMultiplier.value * arenaAttackTypeMultiplier.value) === 0;
        const sourceTypes = source.getTypes();
        const matchesSourceType = sourceTypes[0] === type || (sourceTypes.length > 1 && sourceTypes[1] === type);
        const stabMultiplier = new Utils.NumberHolder(1);
        if (sourceTeraType === Type.UNKNOWN && matchesSourceType) {
          stabMultiplier.value += 0.5;
        } else if (sourceTeraType !== Type.UNKNOWN && sourceTeraType === type) {
          stabMultiplier.value += 0.5;
        }

        applyAbAttrs(StabBoostAbAttr, source, null, stabMultiplier);

        if (sourceTeraType !== Type.UNKNOWN && matchesSourceType) {
          stabMultiplier.value = Math.min(stabMultiplier.value + 0.5, 2.25);
        }

        applyMoveAttrs(VariableAtkAttr, source, this, move, sourceAtk);
        applyMoveAttrs(VariableDefAttr, source, this, move, targetDef);

        if (!isTypeImmune) {
          damage.value = Math.ceil(((((2 * source.level / 5 + 2) * power.value * sourceAtk.value / targetDef.value) / 50) + 2) * stabMultiplier.value * typeMultiplier.value * arenaAttackTypeMultiplier.value * screenMultiplier.value * ((this.scene.randBattleSeedInt(15) + 85) / 100) * criticalMultiplier.value);
          if (isPhysical && source.status && source.status.effect === StatusEffect.BURN) {
            if (!move.getAttrs(BypassBurnDamageReductionAttr).length) {
              const burnDamageReductionCancelled = new Utils.BooleanHolder(false);
              applyAbAttrs(BypassBurnDamageReductionAbAttr, source, burnDamageReductionCancelled);
              if (!burnDamageReductionCancelled.value) {
                damage.value = Math.floor(damage.value / 2);
              }
            }
          }

          applyPreAttackAbAttrs(DamageBoostAbAttr, source, this, battlerMove, damage);

          /**
             * For each {@link HitsTagAttr} the move has, doubles the damage of the move if:
             *  The target has a {@link BattlerTagType} that this move interacts with
             * AND
             *  The move doubles damage when used against that tag
             * */
          move.getAttrs(HitsTagAttr).map(hta => hta as HitsTagAttr).filter(hta => hta.doubleDamage).forEach(hta => {
            if (this.getTag(hta.tagType)) {
              damage.value *= 2;
            }
          });
        }

        if (this.scene.arena.terrain?.terrainType === TerrainType.MISTY && this.isGrounded() && type === Type.DRAGON) {
          damage.value = Math.floor(damage.value / 2);
        }

        const fixedDamage = new Utils.IntegerHolder(0);
        applyMoveAttrs(FixedDamageAttr, source, this, move, fixedDamage);
        if (!isTypeImmune && fixedDamage.value) {
          damage.value = fixedDamage.value;
          isCritical = false;
          result = HitResult.EFFECTIVE;
        }

        if (!result) {
          if (!typeMultiplier.value) {
            result = move.id === Moves.SHEER_COLD ? HitResult.IMMUNE : HitResult.NO_EFFECT;
          } else {
            const oneHitKo = new Utils.BooleanHolder(false);
            applyMoveAttrs(OneHitKOAttr, source, this, move, oneHitKo);
            if (oneHitKo.value) {
              result = HitResult.ONE_HIT_KO;
              isCritical = false;
              damage.value = this.hp;
            } else if (typeMultiplier.value >= 2) {
              result = HitResult.SUPER_EFFECTIVE;
            } else if (typeMultiplier.value >= 1) {
              result = HitResult.EFFECTIVE;
            } else {
              result = HitResult.NOT_VERY_EFFECTIVE;
            }
          }
        }

        if (!fixedDamage.value) {
          if (!source.isPlayer()) {
            this.scene.applyModifiers(EnemyDamageBoosterModifier, false, damage);
          }
          if (!this.isPlayer()) {
            this.scene.applyModifiers(EnemyDamageReducerModifier, false, damage);
          }
        }

        applyMoveAttrs(ModifiedDamageAttr, source, this, move, damage);

        if (power.value === 0) {
          damage.value = 0;
        }

        console.log("damage", damage.value, move.name, power.value, sourceAtk, targetDef);

        // In case of fatal damage, this tag would have gotten cleared before we could lapse it.
        const destinyTag = this.getTag(BattlerTagType.DESTINY_BOND);

        const oneHitKo = result === HitResult.ONE_HIT_KO;
        if (damage.value) {
          if (this.getHpRatio() === 1) {
            applyPreDefendAbAttrs(PreDefendFullHpEndureAbAttr, this, source, battlerMove, cancelled, damage);
          } else if (!this.isPlayer() && damage.value >= this.hp) {
            this.scene.applyModifiers(EnemyEndureChanceModifier, false, this);
          }

          /**
             * We explicitly require to ignore the faint phase here, as we want to show the messages
             * about the critical hit and the super effective/not very effective messages before the faint phase.
             */
          damage.value = this.damageAndUpdate(damage.value, result as DamageResult, isCritical, oneHitKo, oneHitKo, true);
          this.turnData.damageTaken += damage.value;
          if (isCritical) {
            this.scene.queueMessage(i18next.t("battle:hitResultCriticalHit"));
          }
          if (source.isPlayer()) {
            this.scene.validateAchvs(DamageAchv, damage);
            if (damage.value > this.scene.gameData.gameStats.highestDamage) {
              this.scene.gameData.gameStats.highestDamage = damage.value;
            }
          }
          source.turnData.damageDealt += damage.value;
          source.turnData.currDamageDealt = damage.value;
          this.battleData.hitCount++;
          const attackResult = { move: move.id, result: result as DamageResult, damage: damage.value, critical: isCritical, sourceId: source.id };
          this.turnData.attacksReceived.unshift(attackResult);
          if (source.isPlayer() && !this.isPlayer()) {
            this.scene.applyModifiers(DamageMoneyRewardModifier, true, source, damage);
          }
        }

        if (source.turnData.hitsLeft === 1) {
          switch (result) {
          case HitResult.SUPER_EFFECTIVE:
            this.scene.queueMessage(i18next.t("battle:hitResultSuperEffective"));
            break;
          case HitResult.NOT_VERY_EFFECTIVE:
            this.scene.queueMessage(i18next.t("battle:hitResultNotVeryEffective"));
            break;
          case HitResult.NO_EFFECT:
            this.scene.queueMessage(i18next.t("battle:hitResultNoEffect", { pokemonName: this.name }));
            break;
          case HitResult.IMMUNE:
            this.scene.queueMessage(`${this.name} is unaffected!`);
            break;
          case HitResult.ONE_HIT_KO:
            this.scene.queueMessage(i18next.t("battle:hitResultOneHitKO"));
            break;
          }
        }

        if (this.isFainted()) {
          this.scene.unshiftPhase(new FaintPhase(this.scene, this.getBattlerIndex(), oneHitKo));
          this.resetSummonData();
        }

        if (damage) {
          this.scene.clearPhaseQueueSplice();

          const attacker = this.scene.getPokemonById(source.id);
          destinyTag?.lapse(attacker, BattlerTagLapseType.CUSTOM);
        }
      }
      break;
    case MoveCategory.STATUS:
      if (!typeless) {
        applyPreDefendAbAttrs(TypeImmunityAbAttr, this, source, battlerMove, cancelled, typeMultiplier);
      }
      if (!cancelled.value) {
        applyPreDefendAbAttrs(MoveImmunityAbAttr, this, source, battlerMove, cancelled, typeMultiplier);
        defendingSidePlayField.forEach((p) => applyPreDefendAbAttrs(FieldPriorityMoveImmunityAbAttr, p, source, battlerMove, cancelled, typeMultiplier));
      }
      if (!typeMultiplier.value) {
        this.scene.queueMessage(i18next.t("battle:hitResultNoEffect", { pokemonName: this.name }));
      }
      result = cancelled.value || !typeMultiplier.value ? HitResult.NO_EFFECT : HitResult.STATUS;
      break;
    }

    return result;
  }

  damage(damage: integer, ignoreSegments: boolean = false, preventEndure: boolean = false, ignoreFaintPhase: boolean = false): integer {
    if (this.isFainted()) {
      return 0;
    }
    const surviveDamage = new Utils.BooleanHolder(false);

    if (!preventEndure && this.hp - damage <= 0) {
      if (this.hp >= 1 && this.getTag(BattlerTagType.ENDURING)) {
        surviveDamage.value = this.lapseTag(BattlerTagType.ENDURING);
      } else if (this.hp > 1 && this.getTag(BattlerTagType.STURDY)) {
        surviveDamage.value = this.lapseTag(BattlerTagType.STURDY);
      }
      if (!surviveDamage.value) {
        this.scene.applyModifiers(SurviveDamageModifier, this.isPlayer(), this, surviveDamage);
      }
      if (surviveDamage.value) {
        damage = this.hp - 1;
      }
    }

    damage = Math.min(damage, this.hp);

    this.hp = this.hp - damage;
    if (this.isFainted() && !ignoreFaintPhase) {
      this.scene.unshiftPhase(new FaintPhase(this.scene, this.getBattlerIndex(), preventEndure));
      this.resetSummonData();
    }

    return damage;
  }

  damageAndUpdate(damage: integer, result?: DamageResult, critical: boolean = false, ignoreSegments: boolean = false, preventEndure: boolean = false, ignoreFaintPhase: boolean = false): integer {
    const damagePhase = new DamagePhase(this.scene, this.getBattlerIndex(), damage, result as DamageResult, critical);
    this.scene.unshiftPhase(damagePhase);
    damage = this.damage(damage, ignoreSegments, preventEndure, ignoreFaintPhase);
    // Damage amount may have changed, but needed to be queued before calling damage function
    damagePhase.updateAmount(damage);
    return damage;
  }

  heal(amount: integer): integer {
    const healAmount = Math.min(amount, this.getMaxHp() - this.hp);
    this.hp += healAmount;
    return healAmount;
  }

  isBossImmune(): boolean {
    return this.isBoss();
  }

  isMax(): boolean {
    const maxForms = [SpeciesFormKey.GIGANTAMAX, SpeciesFormKey.GIGANTAMAX_RAPID, SpeciesFormKey.GIGANTAMAX_SINGLE, SpeciesFormKey.ETERNAMAX] as string[];
    return maxForms.includes(this.getFormKey()) || maxForms.includes(this.getFusionFormKey());
  }

  addTag(tagType: BattlerTagType, turnCount: integer = 0, sourceMove?: Moves, sourceId?: integer): boolean {
    const existingTag = this.getTag(tagType);
    if (existingTag) {
      existingTag.onOverlap(this);
      return false;
    }

    const newTag = getBattlerTag(tagType, turnCount, sourceMove, sourceId);

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
    if (!this.summonData) {
      return null;
    }
    return typeof(tagType) === "string"
      ? this.summonData.tags.find(t => t.tagType === tagType)
      : this.summonData.tags.find(t => t instanceof tagType);
  }

  findTag(tagFilter: ((tag: BattlerTag) => boolean)) {
    if (!this.summonData) {
      return null;
    }
    return this.summonData.tags.find(t => tagFilter(t));
  }

  getTags(tagType: BattlerTagType | { new(...args: any[]): BattlerTag }): BattlerTag[] {
    if (!this.summonData) {
      return [];
    }
    return typeof(tagType) === "string"
      ? this.summonData.tags.filter(t => t.tagType === tagType)
      : this.summonData.tags.filter(t => t instanceof tagType);
  }

  findTags(tagFilter: ((tag: BattlerTag) => boolean)): BattlerTag[] {
    if (!this.summonData) {
      return [];
    }
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

  removeTag(tagType: BattlerTagType): boolean {
    const tags = this.summonData.tags;
    const tag = tags.find(t => t.tagType === tagType);
    if (tag) {
      tag.turnCount = 0;
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);
    }
    return !!tag;
  }

  findAndRemoveTags(tagFilter: ((tag: BattlerTag) => boolean)): boolean {
    if (!this.summonData) {
      return false;
    }
    const tags = this.summonData.tags;
    const tagsToRemove = tags.filter(t => tagFilter(t));
    for (const tag of tagsToRemove) {
      tag.turnCount = 0;
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);
    }
    return true;
  }

  removeTagsBySourceId(sourceId: integer): void {
    this.findAndRemoveTags(t => t.isSourceLinked() && t.sourceId === sourceId);
  }

  transferTagsBySourceId(sourceId: integer, newSourceId: integer): void {
    if (!this.summonData) {
      return;
    }
    const tags = this.summonData.tags;
    tags.filter(t => t.sourceId === sourceId).forEach(t => t.sourceId = newSourceId);
  }

  transferSummon(source: Pokemon): void {
    const battleStats = Utils.getEnumValues(BattleStat);
    for (const stat of battleStats) {
      this.summonData.battleStats[stat] = source.summonData.battleStats[stat];
    }
    for (const tag of source.summonData.tags) {
      this.summonData.tags.push(tag);
    }
    if (this instanceof PlayerPokemon && source.summonData.battleStats.find(bs => bs === 6)) {
      this.scene.validateAchv(achvs.TRANSFER_MAX_BATTLE_STAT);
    }
    this.updateInfo();
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

  changeForm(formChange: SpeciesFormChange): Promise<void> {
    return new Promise(resolve => {
      this.formIndex = Math.max(this.species.forms.findIndex(f => f.formKey === formChange.formKey), 0);
      this.generateName();
      const abilityCount = this.getSpeciesForm().getAbilityCount();
      if (this.abilityIndex >= abilityCount) {// Shouldn't happen
        this.abilityIndex = abilityCount - 1;
      }
      this.scene.gameData.setPokemonSeen(this, false);
      this.setScale(this.getSpriteScale());
      this.loadAssets().then(() => {
        this.calculateStats();
        this.scene.updateModifiers(this.isPlayer(), true);
        Promise.all([ this.updateInfo(), this.scene.updateFieldScale() ]).then(() => resolve());
      });
    });
  }

  cry(soundConfig?: Phaser.Types.Sound.SoundConfig, sceneOverride?: BattleScene): AnySound {
    const scene = sceneOverride || this.scene;
    const cry = this.getSpeciesForm().cry(scene, soundConfig);
    let duration = cry.totalDuration * 1000;
    if (this.fusionSpecies && this.getSpeciesForm() !== this.getFusionSpeciesForm()) {
      let fusionCry = this.getFusionSpeciesForm().cry(scene, soundConfig, true);
      duration = Math.min(duration, fusionCry.totalDuration * 1000);
      fusionCry.destroy();
      scene.time.delayedCall(Utils.fixedInt(Math.ceil(duration * 0.4)), () => {
        try {
          SoundFade.fadeOut(scene, cry, Utils.fixedInt(Math.ceil(duration * 0.2)));
          fusionCry = this.getFusionSpeciesForm().cry(scene, Object.assign({ seek: Math.max(fusionCry.totalDuration * 0.4, 0) }, soundConfig));
          SoundFade.fadeIn(scene, fusionCry, Utils.fixedInt(Math.ceil(duration * 0.2)), scene.masterVolume * scene.seVolume, 0);
        } catch (err) {
          console.error(err);
        }
      });
    }

    return cry;
  }

  faintCry(callback: Function): void {
    if (this.fusionSpecies && this.getSpeciesForm() !== this.getFusionSpeciesForm()) {
      return this.fusionFaintCry(callback);
    }

    const key = this.getSpeciesForm().getCryKey(this.formIndex);
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        } else {
          faintCryTimer.destroy();
          faintCryTimer = null;
          if (callback) {
            callback();
          }
        }
      }
    });

    // Failsafe
    this.scene.time.delayedCall(Utils.fixedInt(3000), () => {
      if (!faintCryTimer || !this.scene) {
        return;
      }
      if (cry?.isPlaying) {
        cry.stop();
      }
      faintCryTimer.destroy();
      if (callback) {
        callback();
      }
    });
  }

  private fusionFaintCry(callback: Function): void {
    const key = this.getSpeciesForm().getCryKey(this.formIndex);
    let i = 0;
    let rate = 0.85;
    const cry = this.scene.playSound(key, { rate: rate }) as AnySound;
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
        if (cry && !cry.pendingRemove) {
          cry.setRate(rate);
        }
        if (fusionCry && !fusionCry.pendingRemove) {
          fusionCry.setRate(rate);
        }
        if ((!cry || cry.pendingRemove) && (!fusionCry || fusionCry.pendingRemove)) {
          faintCryTimer.destroy();
          faintCryTimer = null;
          if (callback) {
            callback();
          }
        }
      }
    });

    // Failsafe
    this.scene.time.delayedCall(Utils.fixedInt(3000), () => {
      if (!faintCryTimer || !this.scene) {
        return;
      }
      if (cry?.isPlaying) {
        cry.stop();
      }
      if (fusionCry?.isPlaying) {
        fusionCry.stop();
      }
      faintCryTimer.destroy();
      if (callback) {
        callback();
      }
    });
  }

  isOppositeGender(pokemon: Pokemon): boolean {
    return this.gender !== Gender.GENDERLESS && pokemon.gender === (this.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE);
  }

  canSetStatus(effect: StatusEffect, quiet: boolean = false, overrideStatus: boolean = false, sourcePokemon: Pokemon = null): boolean {
    if (effect !== StatusEffect.FAINT) {
      if (overrideStatus ? this.status?.effect === effect : this.status) {
        return false;
      }
      if (this.isGrounded() && this.scene.arena.terrain?.terrainType === TerrainType.MISTY) {
        return false;
      }
    }

    const types = this.getTypes(true, true);

    switch (effect) {
    case StatusEffect.POISON:
    case StatusEffect.TOXIC:
      // Check if the Pokemon is immune to Poison/Toxic or if the source pokemon is canceling the immunity
      const poisonImmunity = types.map(defType => {
        // Check if the Pokemon is not immune to Poison/Toxic
        if (defType !== Type.POISON && defType !== Type.STEEL) {
          return false;
        }

        // Check if the source Pokemon has an ability that cancels the Poison/Toxic immunity
        const cancelImmunity = new Utils.BooleanHolder(false);
        if (sourcePokemon) {
          applyAbAttrs(IgnoreTypeStatusEffectImmunityAbAttr, sourcePokemon, cancelImmunity, effect, defType);
          if (cancelImmunity.value) {
            return false;
          }
        }

        return true;
      });

      if (this.isOfType(Type.POISON) || this.isOfType(Type.STEEL)) {
        if (poisonImmunity.includes(true)) {
          return false;
        }
      }
      break;
    case StatusEffect.PARALYSIS:
      if (this.isOfType(Type.ELECTRIC)) {
        return false;
      }
      break;
    case StatusEffect.SLEEP:
      if (this.isGrounded() && this.scene.arena.terrain?.terrainType === TerrainType.ELECTRIC) {
        return false;
      }
      break;
    case StatusEffect.FREEZE:
      if (this.isOfType(Type.ICE) || [WeatherType.SUNNY, WeatherType.HARSH_SUN].includes(this.scene?.arena.weather?.weatherType)) {
        return false;
      }
      break;
    case StatusEffect.BURN:
      if (this.isOfType(Type.FIRE)) {
        return false;
      }
      break;
    }

    const cancelled = new Utils.BooleanHolder(false);
    applyPreSetStatusAbAttrs(StatusEffectImmunityAbAttr, this, effect, cancelled, quiet);

    if (cancelled.value) {
      return false;
    }

    return true;
  }

  trySetStatus(effect: StatusEffect, asPhase: boolean = false, sourcePokemon: Pokemon = null, cureTurn: integer = 0, sourceText: string = null): boolean {
    if (!this.canSetStatus(effect, asPhase, false, sourcePokemon)) {
      return false;
    }

    if (asPhase) {
      this.scene.unshiftPhase(new ObtainStatusEffectPhase(this.scene, this.getBattlerIndex(), effect, cureTurn, sourceText, sourcePokemon));
      return true;
    }

    let statusCureTurn: Utils.IntegerHolder;

    if (effect === StatusEffect.SLEEP) {
      statusCureTurn = new Utils.IntegerHolder(this.randSeedIntRange(2, 4));
      applyAbAttrs(ReduceStatusEffectDurationAbAttr, this, null, effect, statusCureTurn);

      this.setFrameRate(4);

      // If the user is invulnerable, lets remove their invulnerability when they fall asleep
      const invulnerableTags = [
        BattlerTagType.UNDERGROUND,
        BattlerTagType.UNDERWATER,
        BattlerTagType.HIDDEN,
        BattlerTagType.FLYING
      ];

      const tag = invulnerableTags.find((t) => this.getTag(t));

      if (tag) {
        this.removeTag(tag);
        this.getMoveQueue().pop();
      }
    }

    this.status = new Status(effect, 0, statusCureTurn?.value);

    if (effect !== StatusEffect.FAINT) {
      this.scene.triggerPokemonFormChange(this, SpeciesFormChangeStatusEffectTrigger, true);
    }

    return true;
  }

  /**
  * Resets the status of a pokemon
  * @param revive whether revive should be cured, defaults to true
  */
  resetStatus(revive: boolean = true): void {
    const lastStatus = this.status?.effect;
    if (!revive && lastStatus === StatusEffect.FAINT) {
      return;
    }
    this.status = undefined;
    if (lastStatus === StatusEffect.SLEEP) {
      this.setFrameRate(12);
      if (this.getTag(BattlerTagType.NIGHTMARE)) {
        this.lapseTag(BattlerTagType.NIGHTMARE);
      }
    }
  }

  primeSummonData(summonDataPrimer: PokemonSummonData): void {
    this.summonDataPrimer = summonDataPrimer;
  }

  resetSummonData(): void {
    if (this.summonData?.speciesForm) {
      this.summonData.speciesForm = null;
      this.updateFusionPalette();
    }
    this.summonData = new PokemonSummonData();
    if (!this.battleData) {
      this.resetBattleData();
    }
    this.resetBattleSummonData();
    if (this.summonDataPrimer) {
      for (const k of Object.keys(this.summonData)) {
        if (this.summonDataPrimer[k]) {
          this.summonData[k] = this.summonDataPrimer[k];
        }
      }
      this.summonDataPrimer = null;
    }
    this.updateInfo();
  }

  resetBattleData(): void {
    this.battleData = new PokemonBattleData();
  }

  resetBattleSummonData(): void {
    this.battleSummonData = new PokemonBattleSummonData();
    if (this.getTag(BattlerTagType.SEEDED)) {
      this.lapseTag(BattlerTagType.SEEDED);
    }
    if (this.scene) {
      this.scene.triggerPokemonFormChange(this, SpeciesFormChangePostMoveTrigger, true);
    }
  }

  resetTurnData(): void {
    this.turnData = new PokemonTurnData();
  }

  getExpValue(): integer {
    // Logic to factor in victor level has been removed for balancing purposes, so the player doesn't have to focus on EXP maxxing
    return ((this.getSpeciesForm().getBaseExp() * this.level) / 5 + 1);
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
        ease: ease || "Linear"
      });
    } else {
      tintSprite.setAlpha(alpha);
    }
  }

  untint(duration: integer, ease?: string) {
    const tintSprite = this.getTintSprite();

    if (duration) {
      this.scene.tweens.add({
        targets: tintSprite,
        alpha: 0,
        duration: duration,
        ease: ease || "Linear",
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
      this.maskSprite.setPosition(this.x * this.parentContainer.scale + this.parentContainer.x,
        this.y * this.parentContainer.scale + this.parentContainer.y);
      this.maskSprite.setScale(this.getSpriteScale() * this.parentContainer.scale);
      this.maskEnabled = true;
    }
  }

  disableMask() {
    if (this.maskEnabled) {
      this.maskSprite.setVisible(false);
      this.maskSprite.setPosition(0, 0);
      this.maskSprite.setScale(this.getSpriteScale());
      this.maskSprite = null;
      this.maskEnabled = false;
    }
  }

  sparkle(): void {
    if (this.shinySparkle) {
      this.shinySparkle.play(`sparkle${this.variant ? `_${this.variant + 1}` : ""}`);
      this.scene.playSound("sparkle");
    }
  }

  updateFusionPalette(ignoreOveride?: boolean): void {
    if (!this.getFusionSpeciesForm(ignoreOveride)) {
      [ this.getSprite(), this.getTintSprite() ].map(s => {
        s.pipelineData[`spriteColors${ignoreOveride && this.summonData?.speciesForm ? "Base" : ""}`] = [];
        s.pipelineData[`fusionSpriteColors${ignoreOveride && this.summonData?.speciesForm ? "Base" : ""}`] = [];
      });
      return;
    }

    const speciesForm = this.getSpeciesForm(ignoreOveride);
    const fusionSpeciesForm = this.getFusionSpeciesForm(ignoreOveride);

    const spriteKey = speciesForm.getSpriteKey(this.getGender(ignoreOveride) === Gender.FEMALE, speciesForm.formIndex, this.shiny, this.variant);
    const backSpriteKey = speciesForm.getSpriteKey(this.getGender(ignoreOveride) === Gender.FEMALE, speciesForm.formIndex, this.shiny, this.variant).replace("pkmn__", "pkmn__back__");
    const fusionSpriteKey = fusionSpeciesForm.getSpriteKey(this.getFusionGender(ignoreOveride) === Gender.FEMALE, fusionSpeciesForm.formIndex, this.fusionShiny, this.fusionVariant);
    const fusionBackSpriteKey = fusionSpeciesForm.getSpriteKey(this.getFusionGender(ignoreOveride) === Gender.FEMALE, fusionSpeciesForm.formIndex, this.fusionShiny, this.fusionVariant).replace("pkmn__", "pkmn__back__");

    const sourceTexture = this.scene.textures.get(spriteKey);
    const sourceBackTexture = this.scene.textures.get(backSpriteKey);
    const fusionTexture = this.scene.textures.get(fusionSpriteKey);
    const fusionBackTexture = this.scene.textures.get(fusionBackSpriteKey);

    const [ sourceFrame, sourceBackFrame, fusionFrame, fusionBackFrame ] = [ sourceTexture, sourceBackTexture, fusionTexture, fusionBackTexture ].map(texture => texture.frames[texture.firstFrame]);
    const [ sourceImage, sourceBackImage, fusionImage, fusionBackImage ] = [ sourceTexture, sourceBackTexture, fusionTexture, fusionBackTexture ].map(i => i.getSourceImage() as HTMLImageElement);

    const canvas = document.createElement("canvas");
    const backCanvas = document.createElement("canvas");
    const fusionCanvas = document.createElement("canvas");
    const fusionBackCanvas = document.createElement("canvas");

    const spriteColors: integer[][] = [];
    const pixelData: Uint8ClampedArray[] = [];

    [ canvas, backCanvas, fusionCanvas, fusionBackCanvas ].forEach((canv: HTMLCanvasElement, c: integer) => {
      const context = canv.getContext("2d");
      const frame = [ sourceFrame, sourceBackFrame, fusionFrame, fusionBackFrame ][c];
      canv.width = frame.width;
      canv.height = frame.height;
      context.drawImage([ sourceImage, sourceBackImage, fusionImage, fusionBackImage ][c], frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
      const imageData = context.getImageData(frame.cutX, frame.cutY, frame.width, frame.height);
      pixelData.push(imageData.data);
    });

    for (let f = 0; f < 2; f++) {
      const variantColors = variantColorCache[!f ? spriteKey : backSpriteKey];
      const variantColorSet = new Map<integer, integer[]>();
      if (this.shiny && variantColors && variantColors[this.variant]) {
        Object.keys(variantColors[this.variant]).forEach(k => {
          variantColorSet.set(Utils.rgbaToInt(Array.from(Object.values(Utils.rgbHexToRgba(k)))), Array.from(Object.values(Utils.rgbHexToRgba(variantColors[this.variant][k]))));
        });
      }

      for (let i = 0; i < pixelData[f].length; i += 4) {
        if (pixelData[f][i + 3]) {
          const pixel = pixelData[f].slice(i, i + 4);
          let [ r, g, b, a ] = pixel;
          if (variantColors) {
            const color = Utils.rgbaToInt([r, g, b, a]);
            if (variantColorSet.has(color)) {
              const mappedPixel = variantColorSet.get(color);
              [ r, g, b, a ] = mappedPixel;
            }
          }
          if (!spriteColors.find(c => c[0] === r && c[1] === g && c[2] === b)) {
            spriteColors.push([ r, g, b, a ]);
          }
        }
      }
    }

    const fusionSpriteColors = JSON.parse(JSON.stringify(spriteColors));

    const pixelColors = [];
    for (let f = 0; f < 2; f++) {
      for (let i = 0; i < pixelData[f].length; i += 4) {
        const total = pixelData[f].slice(i, i + 3).reduce((total: integer, value: integer) => total + value, 0);
        if (!total) {
          continue;
        }
        pixelColors.push(argbFromRgba({ r: pixelData[f][i], g: pixelData[f][i + 1], b: pixelData[f][i + 2], a: pixelData[f][i + 3] }));
      }
    }

    const fusionPixelColors = [];
    for (let f = 0; f < 2; f++) {
      const variantColors = variantColorCache[!f ? fusionSpriteKey : fusionBackSpriteKey];
      const variantColorSet = new Map<integer, integer[]>();
      if (this.fusionShiny && variantColors && variantColors[this.fusionVariant]) {
        Object.keys(variantColors[this.fusionVariant]).forEach(k => {
          variantColorSet.set(Utils.rgbaToInt(Array.from(Object.values(Utils.rgbHexToRgba(k)))), Array.from(Object.values(Utils.rgbHexToRgba(variantColors[this.fusionVariant][k]))));
        });
      }
      for (let i = 0; i < pixelData[2 + f].length; i += 4) {
        const total = pixelData[2 + f].slice(i, i + 3).reduce((total: integer, value: integer) => total + value, 0);
        if (!total) {
          continue;
        }
        let [ r, g, b, a ] = [ pixelData[2 + f][i], pixelData[2 + f][i + 1], pixelData[2 + f][i + 2], pixelData[2 + f][i + 3] ];
        if (variantColors) {
          const color = Utils.rgbaToInt([r, g, b, a]);
          if (variantColorSet.has(color)) {
            const mappedPixel = variantColorSet.get(color);
            [ r, g, b, a ] = mappedPixel;
          }
        }
        fusionPixelColors.push(argbFromRgba({ r, g, b, a }));
      }
    }

    let paletteColors: Map<number, number>;
    let fusionPaletteColors: Map<number, number>;

    const originalRandom = Math.random;
    Math.random = () => Phaser.Math.RND.realInRange(0, 1);

    this.scene.executeWithSeedOffset(() => {
      paletteColors = QuantizerCelebi.quantize(pixelColors, 4);
      fusionPaletteColors = QuantizerCelebi.quantize(fusionPixelColors, 4);
    }, 0, "This result should not vary");

    Math.random = originalRandom;

    const [ palette, fusionPalette ] = [ paletteColors, fusionPaletteColors ]
      .map(paletteColors => {
        let keys = Array.from(paletteColors.keys()).sort((a: integer, b: integer) => paletteColors.get(a) < paletteColors.get(b) ? 1 : -1);
        let rgbaColors: Map<number, integer[]>;
        let hsvColors: Map<number, number[]>;

        const mappedColors = new Map<integer, integer[]>();

        do {
          mappedColors.clear();

          rgbaColors = keys.reduce((map: Map<number, integer[]>, k: number) => {
            map.set(k, Object.values(rgbaFromArgb(k))); return map;
          }, new Map<number, integer[]>());
          hsvColors = Array.from(rgbaColors.keys()).reduce((map: Map<number, number[]>, k: number) => {
            const rgb = rgbaColors.get(k).slice(0, 3);
            map.set(k, Utils.rgbToHsv(rgb[0], rgb[1], rgb[2]));
            return map;
          }, new Map<number, number[]>());

          for (let c = keys.length - 1; c >= 0; c--) {
            const hsv = hsvColors.get(keys[c]);
            for (let c2 = 0; c2 < c; c2++) {
              const hsv2 = hsvColors.get(keys[c2]);
              const diff = Math.abs(hsv[0] - hsv2[0]);
              if (diff < 30 || diff >= 330) {
                if (mappedColors.has(keys[c])) {
                  mappedColors.get(keys[c]).push(keys[c2]);
                } else {
                  mappedColors.set(keys[c], [ keys[c2] ]);
                }
                break;
              }
            }
          }

          mappedColors.forEach((values: integer[], key: integer) => {
            const keyColor = rgbaColors.get(key);
            const valueColors = values.map(v => rgbaColors.get(v));
            const color = keyColor.slice(0);
            let count = paletteColors.get(key);
            for (const value of values) {
              const valueCount = paletteColors.get(value);
              if (!valueCount) {
                continue;
              }
              count += valueCount;
            }

            for (let c = 0; c < 3; c++) {
              color[c] *= (paletteColors.get(key) / count);
              values.forEach((value: integer, i: integer) => {
                if (paletteColors.has(value)) {
                  const valueCount = paletteColors.get(value);
                  color[c] += valueColors[i][c] * (valueCount / count);
                }
              });
              color[c] = Math.round(color[c]);
            }

            paletteColors.delete(key);
            for (const value of values) {
              paletteColors.delete(value);
              if (mappedColors.has(value)) {
                mappedColors.delete(value);
              }
            }

            paletteColors.set(argbFromRgba({ r: color[0], g: color[1], b: color[2], a: color[3] }), count);
          });

          keys = Array.from(paletteColors.keys()).sort((a: integer, b: integer) => paletteColors.get(a) < paletteColors.get(b) ? 1 : -1);
        } while (mappedColors.size);

        return keys.map(c => Object.values(rgbaFromArgb(c)));
      }
      );

    const paletteDeltas: number[][] = [];

    spriteColors.forEach((sc: integer[], i: integer) => {
      paletteDeltas.push([]);
      for (let p = 0; p < palette.length; p++) {
        paletteDeltas[i].push(Utils.deltaRgb(sc, palette[p]));
      }
    });

    const easeFunc = Phaser.Tweens.Builders.GetEaseFunction("Cubic.easeIn");

    for (let sc = 0; sc < spriteColors.length; sc++) {
      const delta = Math.min(...paletteDeltas[sc]);
      const paletteIndex = Math.min(paletteDeltas[sc].findIndex(pd => pd === delta), fusionPalette.length - 1);
      if (delta < 255) {
        const ratio = easeFunc(delta / 255);
        const color = [ 0, 0, 0, fusionSpriteColors[sc][3] ];
        for (let c = 0; c < 3; c++) {
          color[c] = Math.round((fusionSpriteColors[sc][c] * ratio) + (fusionPalette[paletteIndex][c] * (1 - ratio)));
        }
        fusionSpriteColors[sc] = color;
      }
    }

    [ this.getSprite(), this.getTintSprite() ].map(s => {
      s.pipelineData[`spriteColors${ignoreOveride && this.summonData?.speciesForm ? "Base" : ""}`] = spriteColors;
      s.pipelineData[`fusionSpriteColors${ignoreOveride && this.summonData?.speciesForm ? "Base" : ""}`] = fusionSpriteColors;
    });

    canvas.remove();
    fusionCanvas.remove();
  }

  randSeedInt(range: integer, min: integer = 0): integer {
    return this.scene.currentBattle
      ? this.scene.randBattleSeedInt(range, min)
      : Utils.randSeedInt(range, min);
  }

  randSeedIntRange(min: integer, max: integer): integer {
    return this.randSeedInt((max - min) + 1, min);
  }

  destroy(): void {
    this.battleInfo?.destroy();
    super.destroy();
  }

  getBattleInfo(): BattleInfo {
    return this.battleInfo;
  }
}

export default interface Pokemon {
  scene: BattleScene
}

export class PlayerPokemon extends Pokemon {
  public compatibleTms: Moves[];

  constructor(scene: BattleScene, species: PokemonSpecies, level: integer, abilityIndex: integer, formIndex: integer, gender: Gender, shiny: boolean, variant: Variant, ivs: integer[], nature: Nature, dataSource: Pokemon | PokemonData) {
    super(scene, 106, 148, species, level, abilityIndex, formIndex, gender, shiny, variant, ivs, nature, dataSource);

    if (Overrides.SHINY_OVERRIDE) {
      this.shiny = true;
      this.initShinySparkle();
      if (Overrides.VARIANT_OVERRIDE) {
        this.variant = Overrides.VARIANT_OVERRIDE;
      }
    }

    if (!dataSource) {
      this.generateAndPopulateMoveset();
    }
    this.generateCompatibleTms();
  }

  initBattleInfo(): void {
    this.battleInfo = new PlayerBattleInfo(this.scene);
    this.battleInfo.initInfo(this);
  }

  isPlayer(): boolean {
    return true;
  }

  hasTrainer(): boolean {
    return true;
  }

  isBoss(): boolean {
    return false;
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
    for (const tm of tms) {
      const moveId = parseInt(tm) as Moves;
      let compatible = false;
      for (const p of tmSpecies[tm]) {
        if (Array.isArray(p)) {
          if (p[0] === this.species.speciesId || (this.fusionSpecies && p[0] === this.fusionSpecies.speciesId) && p.slice(1).indexOf(this.species.forms[this.formIndex]) > -1) {
            compatible = true;
            break;
          }
        } else if (p === this.species.speciesId || (this.fusionSpecies && p === this.fusionSpecies.speciesId)) {
          compatible = true;
          break;
        }
      }
      if (reverseCompatibleTms.indexOf(moveId) > -1) {
        compatible = !compatible;
      }
      if (compatible) {
        this.compatibleTms.push(moveId);
      }
    }
  }

  tryPopulateMoveset(moveset: StarterMoveset): boolean {
    if (!this.getSpeciesForm().validateStarterMoveset(moveset, this.scene.gameData.starterData[this.species.getRootSpeciesId()].eggMoves)) {
      return false;
    }

    this.moveset = moveset.map(m => new PokemonMove(m));

    return true;
  }

  switchOut(batonPass: boolean, removeFromField: boolean = false): Promise<void> {
    return new Promise(resolve => {
      this.resetTurnData();
      if (!batonPass) {
        this.resetSummonData();
      }
      this.hideInfo();
      this.setVisible(false);

      this.scene.ui.setMode(Mode.PARTY, PartyUiMode.FAINT_SWITCH, this.getFieldIndex(), (slotIndex: integer, option: PartyOption) => {
        if (slotIndex >= this.scene.currentBattle.getBattlerCount() && slotIndex < 6) {
          this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, this.getFieldIndex(), slotIndex, false, batonPass));
        }
        if (removeFromField) {
          this.setVisible(false);
          this.scene.field.remove(this);
          this.scene.triggerPokemonFormChange(this, SpeciesFormChangeActiveTrigger, true);
        }
        this.scene.ui.setMode(Mode.MESSAGE).then(() => resolve());
      }, PartyUiHandler.FilterNonFainted);
    });
  }

  addFriendship(friendship: integer): void {
    const starterSpeciesId = this.species.getRootSpeciesId();
    const fusionStarterSpeciesId = this.isFusion() ? this.fusionSpecies.getRootSpeciesId() : 0;
    const starterData = [
      this.scene.gameData.starterData[starterSpeciesId],
      fusionStarterSpeciesId ? this.scene.gameData.starterData[fusionStarterSpeciesId] : null
    ].filter(d => d);
    const amount = new Utils.IntegerHolder(friendship);
    const starterAmount = new Utils.IntegerHolder(Math.floor(friendship * (this.scene.gameMode.isClassic ? 2 : 1) / (fusionStarterSpeciesId ? 2 : 1)));
    if (amount.value > 0) {
      this.scene.applyModifier(PokemonFriendshipBoosterModifier, true, this, amount);
      this.scene.applyModifier(PokemonFriendshipBoosterModifier, true, this, starterAmount);

      this.friendship = Math.min(this.friendship + amount.value, 255);
      if (this.friendship === 255) {
        this.scene.validateAchv(achvs.MAX_FRIENDSHIP);
      }
      starterData.forEach((sd: StarterDataEntry, i: integer) => {
        const speciesId = !i ? starterSpeciesId : fusionStarterSpeciesId as Species;
        sd.friendship = (sd.friendship || 0) + starterAmount.value;
        if (sd.friendship >= getStarterValueFriendshipCap(speciesStarters[speciesId])) {
          this.scene.gameData.addStarterCandy(getPokemonSpecies(speciesId), 1);
          sd.friendship = 0;
        }
      });
    } else {
      this.friendship = Math.max(this.friendship + amount.value, 0);
      for (const sd of starterData) {
        sd.friendship = Math.max((sd.friendship || 0) + starterAmount.value, 0);
      }
    }
  }
  /**
   * Handles Revival Blessing when used by player.
   * @returns Promise to revive a pokemon.
   * @see {@linkcode RevivalBlessingAttr}
   */
  revivalBlessing(): Promise<void> {
    return new Promise(resolve => {
      this.scene.ui.setMode(Mode.PARTY, PartyUiMode.REVIVAL_BLESSING, this.getFieldIndex(), (slotIndex:integer, option: PartyOption) => {
        if (slotIndex >= 0 && slotIndex<6) {
          const pokemon = this.scene.getParty()[slotIndex];
          if (!pokemon || !pokemon.isFainted()) {
            resolve();
          }

          pokemon.resetTurnData();
          pokemon.resetStatus();
          pokemon.heal(Math.min(Math.max(Math.ceil(Math.floor(0.5 * pokemon.getMaxHp())), 1), pokemon.getMaxHp()));
          this.scene.queueMessage(`${pokemon.name} was revived!`,0,true);

          if (this.scene.currentBattle.double && this.scene.getParty().length > 1) {
            const allyPokemon = this.getAlly();
            if (slotIndex<=1) {
              // Revived ally pokemon
              this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, pokemon.getFieldIndex(), slotIndex, false, false, true));
              this.scene.unshiftPhase(new ToggleDoublePositionPhase(this.scene, true));
            } else if (allyPokemon.isFainted()) {
              // Revived party pokemon, and ally pokemon is fainted
              this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, allyPokemon.getFieldIndex(), slotIndex, false, false, true));
              this.scene.unshiftPhase(new ToggleDoublePositionPhase(this.scene, true));
            }
          }

        }
        this.scene.ui.setMode(Mode.MESSAGE).then(() => resolve());
      }, PartyUiHandler.FilterFainted);
    });
  }

  getPossibleEvolution(evolution: SpeciesFormEvolution): Promise<Pokemon> {
    return new Promise(resolve => {
      const evolutionSpecies = getPokemonSpecies(evolution.speciesId);
      const isFusion = evolution instanceof FusionSpeciesFormEvolution;
      let ret: PlayerPokemon;
      if (isFusion) {
        const originalFusionSpecies = this.fusionSpecies;
        const originalFusionFormIndex = this.fusionFormIndex;
        this.fusionSpecies = evolutionSpecies;
        this.fusionFormIndex = evolution.evoFormKey !== null ? Math.max(evolutionSpecies.forms.findIndex(f => f.formKey === evolution.evoFormKey), 0) : this.fusionFormIndex;
        ret = this.scene.addPlayerPokemon(this.species, this.level, this.abilityIndex, this.formIndex, this.gender, this.shiny, this.variant, this.ivs, this.nature, this);
        this.fusionSpecies = originalFusionSpecies;
        this.fusionFormIndex = originalFusionFormIndex;
      } else {
        const formIndex = evolution.evoFormKey !== null && !isFusion ? Math.max(evolutionSpecies.forms.findIndex(f => f.formKey === evolution.evoFormKey), 0) : this.formIndex;
        ret = this.scene.addPlayerPokemon(!isFusion ? evolutionSpecies : this.species, this.level, this.abilityIndex, formIndex, this.gender, this.shiny, this.variant, this.ivs, this.nature, this);
      }
      ret.loadAssets().then(() => resolve(ret));
    });
  }

  evolve(evolution: SpeciesFormEvolution): Promise<void> {
    return new Promise(resolve => {
      this.pauseEvolutions = false;
      this.handleSpecialEvolutions(evolution);
      const isFusion = evolution instanceof FusionSpeciesFormEvolution;
      if (!isFusion) {
        this.species = getPokemonSpecies(evolution.speciesId);
      } else {
        this.fusionSpecies = getPokemonSpecies(evolution.speciesId);
      }
      if (evolution.preFormKey !== null) {
        const formIndex = Math.max((!isFusion ? this.species : this.fusionSpecies).forms.findIndex(f => f.formKey === evolution.evoFormKey), 0);
        if (!isFusion) {
          this.formIndex = formIndex;
        } else {
          this.fusionFormIndex = formIndex;
        }
      }
      this.generateName();
      if (!isFusion) {
        const abilityCount = this.getSpeciesForm().getAbilityCount();
        if (this.abilityIndex >= abilityCount) { // Shouldn't happen
          this.abilityIndex = abilityCount - 1;
        }
      } else {
        const abilityCount = this.getFusionSpeciesForm().getAbilityCount();
        if (this.fusionAbilityIndex >= abilityCount) {// Shouldn't happen
          this.fusionAbilityIndex = abilityCount - 1;
        }
      }
      this.compatibleTms.splice(0, this.compatibleTms.length);
      this.generateCompatibleTms();
      const updateAndResolve = () => {
        this.loadAssets().then(() => {
          this.calculateStats();
          this.updateInfo(true).then(() => resolve());
        });
      };
      if (!this.scene.gameMode.isDaily || this.metBiome > -1) {
        this.scene.gameData.updateSpeciesDexIvs(this.species.speciesId, this.ivs);
        this.scene.gameData.setPokemonSeen(this, false);
        this.scene.gameData.setPokemonCaught(this, false).then(() => updateAndResolve());
      } else {
        updateAndResolve();
      }
    });
  }

  private handleSpecialEvolutions(evolution: SpeciesFormEvolution) {
    const isFusion = evolution instanceof FusionSpeciesFormEvolution;

    const evoSpecies = (!isFusion ? this.species : this.fusionSpecies);
    if (evoSpecies.speciesId === Species.NINCADA && evolution.speciesId === Species.NINJASK) {
      const newEvolution = pokemonEvolutions[evoSpecies.speciesId][1];

      if (newEvolution.condition.predicate(this)) {
        const newPokemon = this.scene.addPlayerPokemon(this.species, this.level, this.abilityIndex, this.formIndex, undefined, this.shiny, this.variant, this.ivs, this.nature);
        newPokemon.natureOverride = this.natureOverride;
        newPokemon.passive = this.passive;
        newPokemon.moveset = this.moveset.slice();
        newPokemon.moveset = this.copyMoveset();
        newPokemon.luck = this.luck;
        newPokemon.fusionSpecies = this.fusionSpecies;
        newPokemon.fusionFormIndex = this.fusionFormIndex;
        newPokemon.fusionAbilityIndex = this.fusionAbilityIndex;
        newPokemon.fusionShiny = this.fusionShiny;
        newPokemon.fusionVariant = this.fusionVariant;
        newPokemon.fusionGender = this.fusionGender;
        newPokemon.fusionLuck = this.fusionLuck;

        this.scene.getParty().push(newPokemon);
        newPokemon.evolve(!isFusion ? newEvolution : new FusionSpeciesFormEvolution(this.id, newEvolution));
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

  getPossibleForm(formChange: SpeciesFormChange): Promise<Pokemon> {
    return new Promise(resolve => {
      const formIndex = Math.max(this.species.forms.findIndex(f => f.formKey === formChange.formKey), 0);
      const ret = this.scene.addPlayerPokemon(this.species, this.level, this.abilityIndex, formIndex, this.gender, this.shiny, this.variant, this.ivs, this.nature, this);
      ret.loadAssets().then(() => resolve(ret));
    });
  }

  changeForm(formChange: SpeciesFormChange): Promise<void> {
    return new Promise(resolve => {
      this.formIndex = Math.max(this.species.forms.findIndex(f => f.formKey === formChange.formKey), 0);
      this.generateName();
      const abilityCount = this.getSpeciesForm().getAbilityCount();
      if (this.abilityIndex >= abilityCount) { // Shouldn't happen
        this.abilityIndex = abilityCount - 1;
      }
      this.compatibleTms.splice(0, this.compatibleTms.length);
      this.generateCompatibleTms();
      const updateAndResolve = () => {
        this.loadAssets().then(() => {
          this.calculateStats();
          this.scene.updateModifiers(true, true);
          this.updateInfo(true).then(() => resolve());
        });
      };
      if (!this.scene.gameMode.isDaily || this.metBiome > -1) {
        this.scene.gameData.setPokemonSeen(this, false);
        this.scene.gameData.setPokemonCaught(this, false).then(() => updateAndResolve());
      } else {
        updateAndResolve();
      }
    });
  }

  clearFusionSpecies(): void {
    super.clearFusionSpecies();
    this.generateCompatibleTms();
  }

  /**
  * Returns a Promise to fuse two PlayerPokemon together
  * @param pokemon The PlayerPokemon to fuse to this one
  */
  fuse(pokemon: PlayerPokemon): Promise<void> {
    return new Promise(resolve => {
      this.fusionSpecies = pokemon.species;
      this.fusionFormIndex = pokemon.formIndex;
      this.fusionAbilityIndex = pokemon.abilityIndex;
      this.fusionShiny = pokemon.shiny;
      this.fusionVariant = pokemon.variant;
      this.fusionGender = pokemon.gender;
      this.fusionLuck = pokemon.luck;

      this.scene.validateAchv(achvs.SPLICE);
      this.scene.gameData.gameStats.pokemonFused++;

      // Store the average HP% that each Pokemon has
      const newHpPercent = ((pokemon.hp / pokemon.stats[Stat.HP]) + (this.hp / this.stats[Stat.HP])) / 2;

      this.generateName();
      this.calculateStats();

      // Set this Pokemon's HP to the average % of both fusion components
      this.hp = Math.round(this.stats[Stat.HP] * newHpPercent);
      if (!this.isFainted()) {
        // If this Pokemon hasn't fainted, make sure the HP wasn't set over the new maximum
        this.hp = Math.min(this.hp, this.stats[Stat.HP]);
        this.status = getRandomStatus(this.status, pokemon.status); // Get a random valid status between the two
      } else if (!pokemon.isFainted()) {
        // If this Pokemon fainted but the other hasn't, make sure the HP wasn't set to zero
        this.hp = Math.max(this.hp, 1);
        this.status = pokemon.status; // Inherit the other Pokemon's status
      }

      this.generateCompatibleTms();
      this.updateInfo(true);
      const fusedPartyMemberIndex = this.scene.getParty().indexOf(pokemon);
      let partyMemberIndex = this.scene.getParty().indexOf(this);
      if (partyMemberIndex > fusedPartyMemberIndex) {
        partyMemberIndex--;
      }
      const fusedPartyMemberHeldModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
        && (m as PokemonHeldItemModifier).pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
      const transferModifiers: Promise<boolean>[] = [];
      for (const modifier of fusedPartyMemberHeldModifiers) {
        transferModifiers.push(this.scene.tryTransferHeldItemModifier(modifier, this, true, false, true, true));
      }
      Promise.allSettled(transferModifiers).then(() => {
        this.scene.updateModifiers(true, true).then(() => {
          this.scene.removePartyMemberModifiers(fusedPartyMemberIndex);
          this.scene.getParty().splice(fusedPartyMemberIndex, 1)[0];
          const newPartyMemberIndex = this.scene.getParty().indexOf(this);
          pokemon.getMoveset(true).map(m => this.scene.unshiftPhase(new LearnMovePhase(this.scene, newPartyMemberIndex, m.getMove().id)));
          pokemon.destroy();
          this.updateFusionPalette();
          resolve();
        });
      });
    });
  }

  unfuse(): Promise<void> {
    return new Promise(resolve => {
      this.clearFusionSpecies();

      this.updateInfo(true).then(() => resolve());
      this.updateFusionPalette();
    });
  }

  /** Returns a deep copy of this Pokemon's moveset array */
  copyMoveset(): PokemonMove[] {
    const newMoveset = [];
    this.moveset.forEach(move =>
      newMoveset.push(new PokemonMove(move.moveId, 0, move.ppUp, move.virtual)));

    return newMoveset;
  }
}

export class EnemyPokemon extends Pokemon {
  public trainerSlot: TrainerSlot;
  public aiType: AiType;
  public bossSegments: integer;
  public bossSegmentIndex: integer;

  constructor(scene: BattleScene, species: PokemonSpecies, level: integer, trainerSlot: TrainerSlot, boss: boolean, dataSource: PokemonData) {
    super(scene, 236, 84, species, level, dataSource?.abilityIndex, dataSource?.formIndex,
      dataSource?.gender, dataSource ? dataSource.shiny : false, dataSource ? dataSource.variant : undefined, null, dataSource ? dataSource.nature : undefined, dataSource);

    this.trainerSlot = trainerSlot;
    if (boss) {
      this.setBoss();
    }

    if (!dataSource) {
      this.generateAndPopulateMoveset();

      this.trySetShiny();
      if (Overrides.OPP_SHINY_OVERRIDE) {
        this.shiny = true;
        this.initShinySparkle();
      }
      if (this.shiny) {
        this.variant = this.generateVariant();
        if (Overrides.OPP_VARIANT_OVERRIDE) {
          this.variant = Overrides.OPP_VARIANT_OVERRIDE;
        }
      }

      this.luck = (this.shiny ? this.variant + 1 : 0) + (this.fusionShiny ? this.fusionVariant + 1 : 0);

      let prevolution: Species;
      let speciesId = species.speciesId;
      while ((prevolution = pokemonPrevolutions[speciesId])) {
        const evolution = pokemonEvolutions[prevolution].find(pe => pe.speciesId === speciesId && (!pe.evoFormKey || pe.evoFormKey === this.getFormKey()));
        if (evolution.condition?.enforceFunc) {
          evolution.condition.enforceFunc(this);
        }
        speciesId = prevolution;
      }
    }

    this.aiType = boss || this.hasTrainer() ? AiType.SMART : AiType.SMART_RANDOM;
  }

  initBattleInfo(): void {
    if (!this.battleInfo) {
      this.battleInfo = new EnemyBattleInfo(this.scene);
      this.battleInfo.updateBossSegments(this);
      this.battleInfo.initInfo(this);
    } else {
      this.battleInfo.updateBossSegments(this);
    }
  }

  setBoss(boss: boolean = true, bossSegments: integer = 0): void {
    if (boss) {
      this.bossSegments = bossSegments || this.scene.getEncounterBossSegments(this.scene.currentBattle.waveIndex, this.level, this.species, true);
      this.bossSegmentIndex = this.bossSegments - 1;
    } else {
      this.bossSegments = 0;
      this.bossSegmentIndex = 0;
    }
  }

  generateAndPopulateMoveset(formIndex?: integer): void {
    switch (true) {
    case (this.species.speciesId === Species.SMEARGLE):
      this.moveset = [
        new PokemonMove(Moves.SKETCH),
        new PokemonMove(Moves.SKETCH),
        new PokemonMove(Moves.SKETCH),
        new PokemonMove(Moves.SKETCH)
      ];
      break;
    case (this.species.speciesId === Species.ETERNATUS):
      this.moveset = (formIndex !== undefined ? formIndex : this.formIndex)
        ? [
          new PokemonMove(Moves.DYNAMAX_CANNON),
          new PokemonMove(Moves.CROSS_POISON),
          new PokemonMove(Moves.FLAMETHROWER),
          new PokemonMove(Moves.RECOVER, 0, -4)
        ]
        : [
          new PokemonMove(Moves.ETERNABEAM),
          new PokemonMove(Moves.SLUDGE_BOMB),
          new PokemonMove(Moves.DRAGON_DANCE),
          new PokemonMove(Moves.COSMIC_POWER)
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
      if (queuedMove.isUsable(this, this.getMoveQueue()[0].ignorePP)) {
        return { move: queuedMove.moveId, targets: this.getMoveQueue()[0].targets, ignorePP: this.getMoveQueue()[0].ignorePP };
      } else {
        this.getMoveQueue().shift();
        return this.getNextMove();
      }
    }

    const movePool = this.getMoveset().filter(m => m.isUsable(this));
    if (movePool.length) {
      if (movePool.length === 1) {
        return { move: movePool[0].moveId, targets: this.getNextTargets(movePool[0].moveId) };
      }
      const encoreTag = this.getTag(EncoreTag) as EncoreTag;
      if (encoreTag) {
        const encoreMove = movePool.find(m => m.moveId === encoreTag.moveId);
        if (encoreMove) {
          return { move: encoreMove.moveId, targets: this.getNextTargets(encoreMove.moveId) };
        }
      }
      switch (this.aiType) {
      case AiType.RANDOM:
        const moveId = movePool[this.scene.randBattleSeedInt(movePool.length)].moveId;
        return { move: moveId, targets: this.getNextTargets(moveId) };
      case AiType.SMART_RANDOM:
      case AiType.SMART:
        const moveScores = movePool.map(() => 0);
        const moveTargets = Object.fromEntries(movePool.map(m => [ m.moveId, this.getNextTargets(m.moveId) ]));
        for (const m in movePool) {
          const pokemonMove = movePool[m];
          const move = pokemonMove.getMove();

          const variableType = new Utils.IntegerHolder(move.type);
          applyAbAttrs(VariableMoveTypeAbAttr, this, null, variableType);
          const moveType = variableType.value as Type;

          let moveScore = moveScores[m];
          const targetScores: integer[] = [];

          for (const mt of moveTargets[move.id]) {
            // Prevent a target score from being calculated when the target is whoever attacks the user
            if (mt === BattlerIndex.ATTACKER) {
              break;
            }

            const target = this.scene.getField()[mt];
            let targetScore = move.getUserBenefitScore(this, target, move) + move.getTargetBenefitScore(this, target, move) * (mt < BattlerIndex.ENEMY === this.isPlayer() ? 1 : -1);
            if ((move.name.endsWith(" (N)") || !move.applyConditions(this, target, move)) && ![Moves.SUCKER_PUNCH, Moves.UPPER_HAND].includes(move.id)) {
              targetScore = -20;
            } else if (move instanceof AttackMove) {
              const effectiveness = target.getAttackMoveEffectiveness(this, pokemonMove);
              if (target.isPlayer() !== this.isPlayer()) {
                targetScore *= effectiveness;
                if (this.isOfType(moveType)) {
                  targetScore *= 1.5;
                }
              } else if (effectiveness) {
                targetScore /= effectiveness;
                if (this.isOfType(moveType)) {
                  targetScore /= 1.5;
                }
              }
              if (!targetScore) {
                targetScore = -20;
              }
            }
            targetScores.push(targetScore);
          }

          moveScore += Math.max(...targetScores);

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
          while (r < sortedMovePool.length - 1 && this.scene.randBattleSeedInt(8) >= 5) {
            r++;
          }
        } else if (this.aiType === AiType.SMART) {
          while (r < sortedMovePool.length - 1 && (moveScores[movePool.indexOf(sortedMovePool[r + 1])] / moveScores[movePool.indexOf(sortedMovePool[r])]) >= 0
              && this.scene.randBattleSeedInt(100) < Math.round((moveScores[movePool.indexOf(sortedMovePool[r + 1])] / moveScores[movePool.indexOf(sortedMovePool[r])]) * 50)) {
            r++;
          }
        }
        console.log(movePool.map(m => m.getName()), moveScores, r, sortedMovePool.map(m => m.getName()));
        return { move: sortedMovePool[r].moveId, targets: moveTargets[sortedMovePool[r].moveId] };
      }
    }

    return { move: Moves.STRUGGLE, targets: this.getNextTargets(Moves.STRUGGLE) };
  }

  getNextTargets(moveId: Moves): BattlerIndex[] {
    const moveTargets = getMoveTargets(this, moveId);
    const targets = this.scene.getField(true).filter(p => moveTargets.targets.indexOf(p.getBattlerIndex()) > -1);
    if (moveTargets.multiple) {
      return targets.map(p => p.getBattlerIndex());
    }

    const move = allMoves[moveId];

    const benefitScores = targets
      .map(p => [ p.getBattlerIndex(), move.getTargetBenefitScore(this, p, move) * (p.isPlayer() === this.isPlayer() ? 1 : -1) ]);

    const sortedBenefitScores = benefitScores.slice(0);
    sortedBenefitScores.sort((a, b) => {
      const scoreA = a[1];
      const scoreB = b[1];
      return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
    });

    if (!sortedBenefitScores.length) {
      // Set target to BattlerIndex.ATTACKER when using a counter move
      // This is the same as when the player does so
      if (!!move.findAttr(attr => attr instanceof CounterDamageAttr)) {
        return [BattlerIndex.ATTACKER];
      }

      return [];
    }

    let targetWeights = sortedBenefitScores.map(s => s[1]);
    const lowestWeight = targetWeights[targetWeights.length - 1];

    if (lowestWeight < 1) {
      for (let w = 0; w < targetWeights.length; w++) {
        targetWeights[w] += Math.abs(lowestWeight - 1);
      }
    }

    const benefitCutoffIndex = targetWeights.findIndex(s => s < targetWeights[0] / 2);
    if (benefitCutoffIndex > -1) {
      targetWeights = targetWeights.slice(0, benefitCutoffIndex);
    }

    const thresholds: integer[] = [];
    let totalWeight: integer;
    targetWeights.reduce((total: integer, w: integer) => {
      total += w;
      thresholds.push(total);
      totalWeight = total;
      return total;
    }, 0);

    const randValue = this.scene.randBattleSeedInt(totalWeight);
    let targetIndex: integer;

    thresholds.every((t, i) => {
      if (randValue >= t) {
        return true;
      }

      targetIndex = i;
      return false;
    });

    return [ sortedBenefitScores[targetIndex][0] ];
  }

  isPlayer() {
    return false;
  }

  hasTrainer(): boolean {
    return !!this.trainerSlot;
  }

  isBoss(): boolean {
    return !!this.bossSegments;
  }

  getBossSegmentIndex(): integer {
    const segments = (this as EnemyPokemon).bossSegments;
    const segmentSize = this.getMaxHp() / segments;
    for (let s = segments - 1; s > 0; s--) {
      const hpThreshold = Math.round(segmentSize * s);
      if (this.hp > hpThreshold) {
        return s;
      }
    }

    return 0;
  }

  damage(damage: integer, ignoreSegments: boolean = false, preventEndure: boolean = false, ignoreFaintPhase: boolean = false): integer {
    if (this.isFainted()) {
      return 0;
    }

    let clearedBossSegmentIndex = this.isBoss()
      ? this.bossSegmentIndex + 1
      : 0;

    if (this.isBoss() && !ignoreSegments) {
      const segmentSize = this.getMaxHp() / this.bossSegments;
      for (let s = this.bossSegmentIndex; s > 0; s--) {
        const hpThreshold = segmentSize * s;
        const roundedHpThreshold = Math.round(hpThreshold);
        if (this.hp >= roundedHpThreshold) {
          if (this.hp - damage <= roundedHpThreshold) {
            const hpRemainder = this.hp - roundedHpThreshold;
            let segmentsBypassed = 0;
            while (segmentsBypassed < this.bossSegmentIndex && this.canBypassBossSegments(segmentsBypassed + 1) && (damage - hpRemainder) >= Math.round(segmentSize * Math.pow(2, segmentsBypassed + 1))) {
              segmentsBypassed++;
              //console.log('damage', damage, 'segment', segmentsBypassed + 1, 'segment size', segmentSize, 'damage needed', Math.round(segmentSize * Math.pow(2, segmentsBypassed + 1)));
            }

            damage = hpRemainder + Math.round(segmentSize * segmentsBypassed);
            clearedBossSegmentIndex = s - segmentsBypassed;
          }
          break;
        }
      }
    }

    switch (this.scene.currentBattle.battleSpec) {
    case BattleSpec.FINAL_BOSS:
      if (!this.formIndex && this.bossSegmentIndex < 1) {
        damage = Math.min(damage, this.hp - 1);
      }
    }

    const ret = super.damage(damage, ignoreSegments, preventEndure, ignoreFaintPhase);

    if (this.isBoss()) {
      if (ignoreSegments) {
        const segmentSize = this.getMaxHp() / this.bossSegments;
        clearedBossSegmentIndex = Math.ceil(this.hp / segmentSize);
      }
      if (clearedBossSegmentIndex <= this.bossSegmentIndex) {
        this.handleBossSegmentCleared(clearedBossSegmentIndex);
      }
      this.battleInfo.updateBossSegments(this);
    }

    return ret;
  }

  canBypassBossSegments(segmentCount: integer = 1): boolean {
    if (this.scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      if (!this.formIndex && (this.bossSegmentIndex - segmentCount) < 1) {
        return false;
      }
    }

    return true;
  }

  handleBossSegmentCleared(segmentIndex: integer): void {
    while (segmentIndex - 1 < this.bossSegmentIndex) {
      let boostedStat = BattleStat.RAND;

      const battleStats = Utils.getEnumValues(BattleStat).slice(0, -3);
      const statWeights = new Array().fill(battleStats.length).filter((bs: BattleStat) => this.summonData.battleStats[bs] < 6).map((bs: BattleStat) => this.getStat(bs + 1));
      const statThresholds: integer[] = [];
      let totalWeight = 0;
      for (const bs of battleStats) {
        totalWeight += statWeights[bs];
        statThresholds.push(totalWeight);
      }

      const randInt = Utils.randSeedInt(totalWeight);

      for (const bs of battleStats) {
        if (randInt < statThresholds[bs]) {
          boostedStat = bs;
          break;
        }
      }

      let statLevels = 1;

      switch (segmentIndex) {
      case 1:
        if (this.bossSegments >= 3) {
          statLevels++;
        }
        break;
      case 2:
        if (this.bossSegments >= 5) {
          statLevels++;
        }
        break;
      }

      this.scene.unshiftPhase(new StatChangePhase(this.scene, this.getBattlerIndex(), true, [ boostedStat ], statLevels, true, true));

      this.bossSegmentIndex--;
    }
  }

  heal(amount: integer): integer {
    if (this.isBoss()) {
      const amountRatio = amount / this.getMaxHp();
      const segmentBypassCount = Math.floor(amountRatio / (1 / this.bossSegments));
      const segmentSize = this.getMaxHp() / this.bossSegments;
      for (let s = 1; s < this.bossSegments; s++) {
        const hpThreshold = segmentSize * s;
        if (this.hp <= Math.round(hpThreshold)) {
          const healAmount = Math.min(amount, this.getMaxHp() - this.hp, Math.round(hpThreshold + (segmentSize * segmentBypassCount) - this.hp));
          this.hp += healAmount;
          return healAmount;
        } else if (s >= this.bossSegmentIndex) {
          return super.heal(amount);
        }
      }
    }

    return super.heal(amount);
  }

  getFieldIndex(): integer {
    return this.scene.getEnemyField().indexOf(this);
  }

  getBattlerIndex(): BattlerIndex {
    return BattlerIndex.ENEMY + this.getFieldIndex();
  }

  addToParty(pokeballType: PokeballType) {
    const party = this.scene.getParty();
    let ret: PlayerPokemon = null;

    if (party.length < 6) {
      this.pokeball = pokeballType;
      this.metLevel = this.level;
      this.metBiome = this.scene.arena.biomeType;
      const newPokemon = this.scene.addPlayerPokemon(this.species, this.level, this.abilityIndex, this.formIndex, this.gender, this.shiny, this.variant, this.ivs, this.nature, this);
      party.push(newPokemon);
      ret = newPokemon;
      this.scene.triggerPokemonFormChange(newPokemon, SpeciesFormChangeActiveTrigger, true);
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
  public abilitySuppressed: boolean = false;

  public speciesForm: PokemonSpeciesForm;
  public fusionSpeciesForm: PokemonSpeciesForm;
  public ability: Abilities = Abilities.NONE;
  public gender: Gender;
  public fusionGender: Gender;
  public stats: integer[];
  public moveset: PokemonMove[];
  public types: Type[];
}

export class PokemonBattleData {
  public hitCount: integer = 0;
  public endured: boolean = false;
  public berriesEaten: BerryType[] = [];
  public abilitiesApplied: Abilities[] = [];
}

export class PokemonBattleSummonData {
  public turnCount: integer = 1;
  public moveHistory: TurnMove[] = [];
}

export class PokemonTurnData {
  public flinched: boolean;
  public acted: boolean;
  public hitCount: integer;
  public hitsLeft: integer;
  public damageDealt: integer = 0;
  public currDamageDealt: integer = 0;
  public damageTaken: integer = 0;
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
  ONE_HIT_KO,
  NO_EFFECT,
  STATUS,
  HEAL,
  FAIL,
  MISS,
  OTHER,
  IMMUNE
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
    if (this.moveId && pokemon.summonData?.disabledMove === this.moveId) {
      return false;
    }
    return (ignorePp || this.ppUsed < this.getMovePp() || this.getMove().pp === -1) && !this.getMove().name.endsWith(" (N)");
  }

  getMove(): Move {
    return allMoves[this.moveId];
  }

  /**
   * Sets {@link ppUsed} for this move and ensures the value does not exceed {@link getMovePp}
   * @param {number} count Amount of PP to use
   */
  usePp(count: number = 1) {
    this.ppUsed = Math.min(this.ppUsed + count, this.getMovePp());
  }

  getMovePp(): integer {
    return this.getMove().pp + this.ppUp * Math.max(Math.floor(this.getMove().pp / 5), 1);
  }

  getPpRatio(): number {
    return 1 - (this.ppUsed / this.getMovePp());
  }

  getName(): string {
    return this.getMove().name;
  }

  /**
  * Copies an existing move or creates a valid PokemonMove object from json representing one
  * @param {PokemonMove | any} source The data for the move to copy
  * @return {PokemonMove} A valid pokemonmove object
  */
  static loadMove(source: PokemonMove | any): PokemonMove {
    return new PokemonMove(source.moveId, source.ppUsed, source.ppUp, source.virtual);
  }
}
