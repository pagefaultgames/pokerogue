import type { Ability, PreAttackModifyDamageAbAttrParams } from "#abilities/ability";
import { applyAbAttrs, applyOnGainAbAttrs, applyOnLoseAbAttrs } from "#abilities/apply-ab-attrs";
import { generateMoveset } from "#app/ai/ai-moveset-gen";
import type { AnySound, BattleScene } from "#app/battle-scene";
import { EVOLVE_MOVE, PLAYER_PARTY_MAX_SIZE, RARE_CANDY_FRIENDSHIP_CAP, RELEARN_MOVE } from "#app/constants";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { speciesEggMoves } from "#balance/egg-moves";
import type { SpeciesFormEvolution } from "#balance/pokemon-evolutions";
import {
  FusionSpeciesFormEvolution,
  pokemonEvolutions,
  pokemonPrevolutions,
  validateShedinjaEvo,
} from "#balance/pokemon-evolutions";
import { BASE_HIDDEN_ABILITY_CHANCE, BASE_SHINY_CHANCE, SHINY_EPIC_CHANCE, SHINY_VARIANT_CHANCE } from "#balance/rates";
import { getStarterValueFriendshipCap, speciesStarterCosts } from "#balance/starters";
import { tmSpecies } from "#balance/tm-species-map";
import { reverseCompatibleTms } from "#balance/tms";
import type { SuppressAbilitiesTag } from "#data/arena-tag";
import { NoCritTag, WeakenMoveScreenTag } from "#data/arena-tag";
import {
  AutotomizedTag,
  BattlerTag,
  CritBoostTag,
  EncoreTag,
  ExposedTag,
  GroundedTag,
  type GrudgeTag,
  getBattlerTag,
  HighestStatBoostTag,
  MoveRestrictionBattlerTag,
  PowerTrickTag,
  SemiInvulnerableTag,
  SubstituteTag,
  TarShotTag,
  TrappedTag,
  TypeImmuneTag,
} from "#data/battler-tags";
import { getDailyEventSeedBoss, getDailyEventSeedBossVariant } from "#data/daily-run";
import { allAbilities, allMoves } from "#data/data-lists";
import { getLevelTotalExp } from "#data/exp";
import {
  SpeciesFormChangeActiveTrigger,
  SpeciesFormChangeLapseTeraTrigger,
  SpeciesFormChangeMoveLearnedTrigger,
  SpeciesFormChangePostMoveTrigger,
} from "#data/form-change-triggers";
import { Gender } from "#data/gender";
import { getNatureStatMultiplier } from "#data/nature";
import {
  CustomPokemonData,
  PokemonBattleData,
  PokemonSummonData,
  PokemonTempSummonData,
  PokemonTurnData,
  PokemonWaveData,
} from "#data/pokemon-data";
import type { SpeciesFormChange } from "#data/pokemon-forms";
import type { PokemonSpeciesForm } from "#data/pokemon-species";
import { PokemonSpecies } from "#data/pokemon-species";
import { getRandomStatus, getStatusEffectHealText, getStatusEffectOverlapText, Status } from "#data/status-effect";
import { getTerrainBlockMessage, TerrainType } from "#data/terrain";
import type { TypeDamageMultiplier } from "#data/type";
import { getTypeDamageMultiplier, getTypeRgb } from "#data/type";
import { AbilityId } from "#enums/ability-id";
import { AiType } from "#enums/ai-type";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleSpec } from "#enums/battle-spec";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { BerryType } from "#enums/berry-type";
import { BiomeId } from "#enums/biome-id";
import { ChallengeType } from "#enums/challenge-type";
import { Challenges } from "#enums/challenges";
import { DexAttr } from "#enums/dex-attr";
import { FieldPosition } from "#enums/field-position";
import { HitResult } from "#enums/hit-result";
import { LearnMoveSituation } from "#enums/learn-move-situation";
import { MoveCategory } from "#enums/move-category";
import { MoveFlags } from "#enums/move-flags";
import { MoveId } from "#enums/move-id";
import { MoveTarget } from "#enums/move-target";
import { isIgnorePP, isVirtual, MoveUseMode } from "#enums/move-use-mode";
import { Nature } from "#enums/nature";
import { PokeballType } from "#enums/pokeball";
import { PokemonAnimType } from "#enums/pokemon-anim-type";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import {
  BATTLE_STATS,
  type BattleStat,
  EFFECTIVE_STATS,
  type EffectiveStat,
  PERMANENT_STATS,
  type PermanentStat,
  Stat,
} from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { SwitchType } from "#enums/switch-type";
import type { TrainerSlot } from "#enums/trainer-slot";
import { UiMode } from "#enums/ui-mode";
import { WeatherType } from "#enums/weather-type";
import { doShinySparkleAnim } from "#field/anims";
import {
  BaseStatModifier,
  CritBoosterModifier,
  EnemyDamageBoosterModifier,
  EnemyDamageReducerModifier,
  EnemyFusionChanceModifier,
  EvoTrackerModifier,
  HiddenAbilityRateBoosterModifier,
  PokemonBaseStatFlatModifier,
  PokemonBaseStatTotalModifier,
  PokemonFriendshipBoosterModifier,
  PokemonHeldItemModifier,
  PokemonIncrementingStatModifier,
  PokemonMultiHitModifier,
  PokemonNatureWeightModifier,
  ShinyRateBoosterModifier,
  StatBoosterModifier,
  SurviveDamageModifier,
  TempCritBoosterModifier,
  TempStatStageBoosterModifier,
} from "#modifiers/modifier";
import { applyMoveAttrs } from "#moves/apply-attrs";
import type { Move } from "#moves/move";
import { getMoveTargets } from "#moves/move-utils";
import { PokemonMove } from "#moves/pokemon-move";
import { loadMoveAnimations } from "#sprites/pokemon-asset-loader";
import type { Variant } from "#sprites/variant";
import { populateVariantColors, variantColorCache, variantData } from "#sprites/variant";
import { achvs } from "#system/achv";
import type { PokemonData } from "#system/pokemon-data";
import { RibbonData } from "#system/ribbons/ribbon-data";
import { awardRibbonsToSpeciesLine } from "#system/ribbons/ribbon-methods";
import type { AbAttrMap, AbAttrString, TypeMultiplierAbAttrParams } from "#types/ability-types";
import type { Constructor } from "#types/common";
import type { getAttackDamageParams, getBaseDamageParams } from "#types/damage-params";
import type { DamageCalculationResult, DamageResult } from "#types/damage-result";
import type { LevelMoves } from "#types/pokemon-level-moves";
import type { StarterDataEntry, StarterMoveset } from "#types/save-data";
import type { TurnMove } from "#types/turn-move";
import { BattleInfo } from "#ui/battle-info";
import { EnemyBattleInfo } from "#ui/enemy-battle-info";
import type { PartyOption } from "#ui/party-ui-handler";
import { PartyUiHandler, PartyUiMode } from "#ui/party-ui-handler";
import { PlayerBattleInfo } from "#ui/player-battle-info";
import { coerceArray } from "#utils/array";
import { applyChallenges } from "#utils/challenge-utils";
import {
  BooleanHolder,
  deltaRgb,
  fixedInt,
  getIvsFromId,
  isBetween,
  NumberHolder,
  randSeedFloat,
  randSeedInt,
  randSeedIntRange,
  randSeedItem,
  rgbaToInt,
  rgbHexToRgba,
  rgbToHsv,
  toDmgValue,
} from "#utils/common";
import { calculateBossSegmentDamage } from "#utils/damage";
import { getEnumValues } from "#utils/enums";
import { getFusedSpeciesName, getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";
import { inSpeedOrder } from "#utils/speed-order-generator";
import { argbFromRgba, QuantizerCelebi, rgbaFromArgb } from "@material/material-color-utilities";
import i18next from "i18next";
import Phaser from "phaser";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";

export abstract class Pokemon extends Phaser.GameObjects.Container {
  /**
   * This pokemon's {@link https://bulbapedia.bulbagarden.net/wiki/Personality_value | Personality value/PID},
   * used to determine various parameters of this Pokemon.
   * Represented as a random 32-bit unsigned integer.
   * TODO: Stop treating this like a unique ID and stop treating 0 as no pokemon
   */
  public id: number;
  /**
   * The Pokemon's current nickname, or `undefined` if it currently lacks one.
   * If omitted, references to this should refer to the default name for this Pokemon's species.
   */
  public nickname?: string;
  public species: PokemonSpecies;
  public formIndex: number;
  public abilityIndex: number;
  public passive: boolean;
  public shiny: boolean;
  public variant: Variant;
  public pokeball: PokeballType;
  protected battleInfo: BattleInfo;
  public level: number;
  public exp: number;
  public levelExp: number;
  public gender: Gender;
  public hp: number;
  public stats: number[];
  public ivs: number[];
  public nature: Nature;
  public moveset: PokemonMove[];
  /**
   * This Pokemon's current {@link https://m.bulbapedia.bulbagarden.net/wiki/Status_condition#Non-volatile_status | non-volatile status condition},
   * or `null` if none exist.
   * @todo Make private
   */
  public status: Status | null;
  /**
   * The Pokémon's current friendship value, ranging from 0 to 255.
   * @see {@link https://bulbapedia.bulbagarden.net/wiki/Friendship}
   */
  public friendship: number;
  /**
   * The level at which this Pokémon was met
   * @remarks
   * Primarily used for displaying in the summary screen
   */
  public metLevel: number;
  /**
   * The ID of the biome this Pokémon was met in
   * @remarks
   * Primarily used for display in the summary screen.
   */
  public metBiome: BiomeId | -1;
  // TODO: figure out why this is used and document it (seems only to be read for getting the Pokémon's egg moves)
  public metSpecies: SpeciesId;
  /** The wave index at which this Pokémon was met/encountered */
  public metWave: number;
  public luck: number;
  public pauseEvolutions: boolean;
  public pokerus: boolean;
  /**
   * Indicates whether this Pokémon has left or is about to leave the field
   * @remarks
   * When `true` on a Wild Pokemon, this indicates it is about to flee.
   */
  public switchOutStatus = false;
  public evoCounter: number;
  /** The type this Pokémon turns into when Terastallized  */
  public teraType: PokemonType;
  /** Whether this Pokémon is currently Terastallized */
  public isTerastallized: boolean;
  /** The set of Types that have been boosted by this Pokémon's Stellar Terastallization. */
  public stellarTypesBoosted: PokemonType[];

  // TODO: Create a fusionData class / interface and move all fusion-related fields there, exposed via getters
  /** If this Pokémon is a fusion, the species it is fused with; `null` if not a fusion */
  public fusionSpecies: PokemonSpecies | null;
  public fusionFormIndex: number;
  public fusionAbilityIndex: number;
  public fusionShiny: boolean;
  public fusionVariant: Variant;
  public fusionGender: Gender;
  public fusionLuck: number;
  public fusionCustomPokemonData: CustomPokemonData | null;
  public fusionTeraType: PokemonType;

  public customPokemonData: CustomPokemonData = new CustomPokemonData();

  /* Pokemon data types, in vaguely decreasing order of precedence */

  /**
   * Data that resets only on *battle* end (hit count, harvest berries, etc.)
   * Kept between waves.
   */
  public battleData: PokemonBattleData = new PokemonBattleData();
  /** Data that resets on switch or battle end (stat stages, battler tags, etc.) */
  public summonData: PokemonSummonData = new PokemonSummonData();
  /** Similar to {@linkcode PokemonSummonData}, but is reset on reload (not saved to file). */
  public tempSummonData: PokemonTempSummonData = new PokemonTempSummonData();
  /** Wave data correponding to moves/ability information revealed */
  public waveData: PokemonWaveData = new PokemonWaveData();
  /** Per-turn data like hit count & flinch tracking */
  public turnData: PokemonTurnData = new PokemonTurnData();

  /** Used by Mystery Encounters to execute pokemon-specific logic (such as stat boosts) at start of battle */
  public mysteryEncounterBattleEffects?: (pokemon: Pokemon) => void;

  /** The position of this Pokémon on the field */
  public fieldPosition: FieldPosition;

  public maskEnabled: boolean;
  public maskSprite: Phaser.GameObjects.Sprite | null;

  /**
   * The set of all TMs that have been used on this Pokémon
   *
   * @remarks
   * Used to allow re-learning TM moves via, e.g., the Memory Mushroom
   */
  public usedTMs: MoveId[];

  private shinySparkle: Phaser.GameObjects.Sprite;

  // TODO: Rework this eventually
  constructor(
    x: number,
    y: number,
    species: PokemonSpecies,
    level: number,
    abilityIndex?: number,
    formIndex?: number,
    gender?: Gender,
    shiny?: boolean,
    variant?: Variant,
    ivs?: number[],
    nature?: Nature,
    dataSource?: Pokemon | PokemonData,
  ) {
    super(globalScene, x, y);

    if (!species.isObtainable() && this.isPlayer()) {
      throw new Error(`Cannot create a player Pokemon for species "${species.getName(formIndex)}"`);
    }

    this.species = species;
    this.pokeball = dataSource?.pokeball || PokeballType.POKEBALL;
    this.level = level;

    this.abilityIndex = abilityIndex ?? this.generateAbilityIndex();

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
      this.nature = dataSource.nature || (0 as Nature);
      this.nickname = dataSource.nickname;
      this.moveset = dataSource.moveset;
      this.status = dataSource.status!; // TODO: is this bang correct?
      this.friendship = dataSource.friendship ?? this.species.baseFriendship;
      this.metLevel = dataSource.metLevel || 5;
      this.luck = dataSource.luck;
      this.metBiome = dataSource.metBiome;
      this.metSpecies =
        dataSource.metSpecies ?? (this.metBiome !== -1 ? this.species.speciesId : this.species.getRootSpeciesId(true));
      this.metWave = dataSource.metWave ?? (this.metBiome === -1 ? -1 : 0);
      this.pauseEvolutions = dataSource.pauseEvolutions;
      this.pokerus = !!dataSource.pokerus;
      this.fusionSpecies =
        dataSource.fusionSpecies instanceof PokemonSpecies
          ? dataSource.fusionSpecies
          : dataSource.fusionSpecies
            ? getPokemonSpecies(dataSource.fusionSpecies)
            : null;
      this.fusionFormIndex = dataSource.fusionFormIndex;
      this.fusionAbilityIndex = dataSource.fusionAbilityIndex;
      this.fusionShiny = dataSource.fusionShiny;
      this.fusionVariant = dataSource.fusionVariant || 0;
      this.fusionGender = dataSource.fusionGender;
      this.fusionLuck = dataSource.fusionLuck;
      this.fusionCustomPokemonData = dataSource.fusionCustomPokemonData;
      this.fusionTeraType = dataSource.fusionTeraType;
      this.usedTMs = dataSource.usedTMs ?? [];
      this.customPokemonData = new CustomPokemonData(dataSource.customPokemonData);
      this.teraType = dataSource.teraType;
      this.isTerastallized = dataSource.isTerastallized;
      this.stellarTypesBoosted = dataSource.stellarTypesBoosted ?? [];
    } else {
      this.id = randSeedInt(4294967296);
      this.ivs = ivs || getIvsFromId(this.id);

      if (this.gender === undefined) {
        this.gender = this.species.generateGender();
      }

      if (this.formIndex === undefined) {
        this.formIndex = globalScene.getSpeciesFormIndex(species, this.gender, this.nature, this.isPlayer());
      }

      if (this.shiny === undefined) {
        this.trySetShiny();
      }

      if (this.variant === undefined) {
        this.variant = this.shiny ? this.generateShinyVariant() : 0;
      }

      if (nature !== undefined) {
        this.setNature(nature);
      } else {
        this.generateNature();
      }

      this.friendship = species.baseFriendship;
      this.metLevel = level;
      this.metBiome = globalScene.currentBattle ? globalScene.arena.biomeType : -1;
      this.metSpecies = species.speciesId;
      this.metWave = globalScene.currentBattle ? globalScene.currentBattle.waveIndex : -1;
      this.pokerus = false;

      if (level > 1) {
        const fused = new BooleanHolder(globalScene.gameMode.isSplicedOnly);
        if (!fused.value && this.isEnemy() && !this.hasTrainer()) {
          globalScene.applyModifier(EnemyFusionChanceModifier, false, fused);
        }

        if (fused.value) {
          this.calculateStats();
          this.generateFusionSpecies();
        }
      }
      this.luck = (this.shiny ? this.variant + 1 : 0) + (this.fusionShiny ? this.fusionVariant + 1 : 0);
      this.fusionLuck = this.luck;

      this.teraType = randSeedItem(this.getTypes(false, false, true));
      this.isTerastallized = false;
      this.stellarTypesBoosted = [];
    }

    this.summonData = new PokemonSummonData(dataSource?.summonData);
    this.battleData = new PokemonBattleData(dataSource?.battleData);

    this.generateName();

    if (!species.isObtainable()) {
      this.shiny = false;
    }

    if (!dataSource) {
      this.calculateStats();
    }
  }

  /**
   * Return the name that will be displayed when this Pokemon is sent out into battle.
   * @param useIllusion - Whether to consider this Pokemon's illusion if present; default `true`
   * @returns The name to render for this {@linkcode Pokemon}.
   */
  getNameToRender(useIllusion = true) {
    const illusion = this.summonData.illusion;
    const name = useIllusion ? (illusion?.name ?? this.name) : this.name;
    const nickname: string | undefined = useIllusion ? (illusion?.nickname ?? this.nickname) : this.nickname;
    try {
      if (nickname) {
        return decodeURIComponent(escape(atob(nickname))); // TODO: Remove `atob` and `escape`... eventually...
      }
      return name;
    } catch (err) {
      console.error(`Failed to decode nickname for ${name}`, err);
      return name;
    }
  }

  /**
   * Return this Pokemon's {@linkcode PokeballType}.
   * @param useIllusion - Whether to consider this Pokemon's illusion if present; default `false`
   * @returns The {@linkcode PokeballType} that will be shown when this Pokemon is sent out into battle.
   */
  getPokeball(useIllusion = false): PokeballType {
    return useIllusion ? (this.summonData.illusion?.pokeball ?? this.pokeball) : this.pokeball;
  }

  init(): void {
    this.fieldPosition = FieldPosition.CENTER;
    this.initBattleInfo();

    globalScene.fieldUI.addAt(this.battleInfo, 0);

    const getSprite = (hasShadow?: boolean) => {
      const ret = globalScene.addPokemonSprite(
        this,
        0,
        0,
        `pkmn__${this.isPlayer() ? "back__" : ""}sub`,
        undefined,
        true,
      );
      ret.setOrigin(0.5, 1);
      ret.setPipeline(globalScene.spritePipeline, {
        tone: [0.0, 0.0, 0.0, 0.0],
        hasShadow: !!hasShadow,
        teraColor: getTypeRgb(this.getTeraType()),
        isTerastallized: this.isTerastallized,
      });
      return ret;
    };

    this.setScale(this.getSpriteScale());

    const sprite = getSprite(true);
    const tintSprite = getSprite();

    tintSprite.setVisible(false);

    this.addAt(sprite, 0);
    this.addAt(tintSprite, 1);

    if (this.isShiny(true) && !this.shinySparkle) {
      this.initShinySparkle();
    }
  }

  abstract initBattleInfo(): void;

  public isOnField(): boolean {
    if (!globalScene) {
      return false;
    }
    if (this.switchOutStatus) {
      return false;
    }
    return globalScene.field.getIndex(this) > -1;
  }

  /**
   * Checks if a pokemon is fainted (ie: its `hp <= 0`).
   * Usually should not be called directly in favor of calling {@linkcode isAllowedInBattle()}.
   * @param checkStatus - Whether to also check that the pokemon's status is {@linkcode StatusEffect.FAINT}; default `false`
   * @returns Whether this Pokemon is fainted, as described above.
   */
  public isFainted(checkStatus = false): boolean {
    return this.hp <= 0 && (!checkStatus || this.status?.effect === StatusEffect.FAINT);
  }

  /**
   * Check if this pokemon is both not fainted and allowed to be used based on currently active challenges.
   * @returns Whether this Pokemon is allowed to partake in battle.
   */
  public isAllowedInBattle(): boolean {
    return !this.isFainted() && this.isAllowedInChallenge();
  }

  /**
   * Check if this pokemon is allowed based on any active challenges.
   * Usually should not be called directly in favor of consulting {@linkcode isAllowedInBattle()}.
   * @returns Whether this Pokemon is allowed under the current challenge conditions.
   */
  public isAllowedInChallenge(): boolean {
    const challengeAllowed = new BooleanHolder(true);
    applyChallenges(ChallengeType.POKEMON_IN_BATTLE, this, challengeAllowed);
    return challengeAllowed.value;
  }

  /**
   * Checks if this {@linkcode Pokemon} is allowed in battle (ie: not fainted, and allowed under any active challenges).
   * @param onField - Whether to also check if the pokemon is currently on the field; default `false`
   * @returns Whether this pokemon is considered "active", as described above.
   * Returns `false` if there is no active {@linkcode BattleScene} or the pokemon is disallowed.
   */
  public isActive(onField = false): boolean {
    if (!globalScene) {
      return false;
    }
    return this.isAllowedInBattle() && (!onField || this.isOnField());
  }

  public getDexAttr(): bigint {
    let ret = 0n;
    if (this.gender !== Gender.GENDERLESS) {
      ret |= this.gender !== Gender.FEMALE ? DexAttr.MALE : DexAttr.FEMALE;
    }
    ret |= !this.shiny ? DexAttr.NON_SHINY : DexAttr.SHINY;
    ret |= this.variant >= 2 ? DexAttr.VARIANT_3 : this.variant === 1 ? DexAttr.VARIANT_2 : DexAttr.DEFAULT_VARIANT;
    ret |= globalScene.gameData.getFormAttr(this.formIndex);
    return ret;
  }

  /**
   * Sets the Pokemon's name. Only called when loading a Pokemon so this function needs to be called when
   * initializing hardcoded Pokemon or else it will not display the form index name properly.
   */
  public generateName(): void {
    if (!this.fusionSpecies) {
      this.name = this.species.getName(this.formIndex);
      return;
    }
    this.name = getFusedSpeciesName(
      this.species.getName(this.formIndex),
      this.fusionSpecies.getName(this.fusionFormIndex),
    );
    if (this.battleInfo) {
      this.updateInfo(true);
    }
  }

  /** Generate `abilityIndex` based on species and hidden ability if not pre-defined. */
  private generateAbilityIndex(): number {
    const hiddenAbilityChance = new NumberHolder(BASE_HIDDEN_ABILITY_CHANCE);
    // Ability Charms should only affect wild Pokemon
    // TODO: move this `if` check into the ability charm code
    if (!this.hasTrainer()) {
      globalScene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);
    }

    // Neither RNG roll depends on the outcome of the other, so that Ability Charms do not affect RNG.
    const regularAbility = this.species.ability2 !== this.species.ability1 ? randSeedInt(2) : 0;
    const useHiddenAbility = this.species.abilityHidden ? !randSeedInt(hiddenAbilityChance.value) : false;

    return useHiddenAbility ? 2 : regularAbility;
  }

  /**
   * Set this pokemon's illusion to the data of the given pokemon.
   *
   * @remarks
   * When setting the illusion of a wild pokemon, a {@linkcode PokemonSpecies} is generally passed.
   * When setting the illusion of a pokemon in this way, the fields required by illusion data
   * but missing from `PokemonSpecies` are set as follows
   * - `pokeball` and `nickname` are both inherited from this pokemon
   * - `shiny` will always be set if this pokemon OR its fusion is shiny
   * - `variant` will always be 0
   * - Fields related to fusion will be set to `undefined` or `0` as appropriate
   * - The gender is set to be the same as this pokemon, if it is compatible with the provided pokemon.
   *   - If the provided pokemon can only ever exist as one gender, it is always that gender
   *   - If this pokemon is genderless but the provided pokemon isn't, then a gender roll is done based on this
   *     pokemon's ID
   */
  setIllusion(pokemon: Pokemon | PokemonSpecies): boolean {
    this.breakIllusion();
    if (pokemon instanceof Pokemon) {
      const speciesId = pokemon.species.speciesId;

      this.summonData.illusion = {
        name: pokemon.name,
        nickname: pokemon.nickname,
        shiny: pokemon.shiny,
        variant: pokemon.variant,
        fusionShiny: pokemon.fusionShiny,
        fusionVariant: pokemon.fusionVariant,
        species: speciesId,
        formIndex: pokemon.formIndex,
        gender: pokemon.gender,
        pokeball: pokemon.pokeball,
        fusionFormIndex: pokemon.fusionFormIndex,
        fusionSpecies: pokemon.fusionSpecies || undefined,
        fusionGender: pokemon.fusionGender,
      };

      if (pokemon.shiny || pokemon.fusionShiny) {
        this.initShinySparkle();
      }
    } else {
      // Correct the gender in case the illusioned species has a gender incompatible with this pokemon
      let gender = this.gender;
      switch (pokemon.malePercent) {
        case null:
          gender = Gender.GENDERLESS;
          break;
        case 0:
          gender = Gender.FEMALE;
          break;
        case 100:
          gender = Gender.MALE;
          break;
        default:
          gender = (this.id % 256) * 0.390625 < pokemon.malePercent ? Gender.MALE : Gender.FEMALE;
      }
      /*
      TODO: Allow setting `variant` to something other than 0, which would require first loading the
      assets for the provided species, as its entry would otherwise not
      be guaranteed to exist in the `variantData` map. But this would prevent `summonData` from being populated
      until the assets are loaded, which would cause issues as this method cannot be easily promisified.
      */
      this.summonData.illusion = {
        fusionShiny: false,
        fusionVariant: 0,
        shiny: this.shiny || this.fusionShiny,
        variant: 0,
        nickname: this.nickname,
        name: pokemon.name,
        species: pokemon.speciesId,
        formIndex: pokemon.formIndex,
        gender,
        pokeball: this.pokeball,
      };

      if (this.shiny || this.fusionShiny) {
        this.initShinySparkle();
      }
    }
    this.loadAssets(false, true).then(() => this.playAnim());
    this.updateInfo();
    return true;
  }

  /**
   * Break the illusion of this pokemon, if it has an active illusion.
   * @returns Whether an illusion was broken.
   */
  breakIllusion(): boolean {
    if (!this.summonData.illusion) {
      return false;
    }
    this.summonData.illusion = null;
    if (this.isOnField()) {
      globalScene.playSound("PRSFX- Transform");
    }
    if (this.shiny) {
      this.initShinySparkle();
    }
    this.loadAssets(false).then(() => this.playAnim());
    this.updateInfo(true);
    return true;
  }

  abstract isPlayer(): this is PlayerPokemon;

  abstract isEnemy(): this is EnemyPokemon;

  abstract hasTrainer(): boolean;

  abstract getFieldIndex(): number;

  abstract getBattlerIndex(): BattlerIndex;

  /**
   * Load all assets needed for this Pokemon's use in battle
   * @param ignoreOverride - Whether to ignore overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `true`
   * @param useIllusion - Whether to consider this pokemon's active illusion; default `false`
   * @returns A promise that resolves once all the corresponding assets have been loaded.
   */
  async loadAssets(ignoreOverride = true, useIllusion = false): Promise<void> {
    /** Promises that are loading assets and can be run concurrently. */
    const loadPromises: Promise<void>[] = [];
    // Assets for moves
    loadPromises.push(loadMoveAnimations(this.getMoveset().map(m => m.getMove().id)));

    /** alias for `this.summonData.illusion`; bangs on this are safe when guarded with `useIllusion` being true   */
    const illusion = this.summonData.illusion;
    useIllusion = useIllusion && !!illusion;

    // Load the assets for the species form
    const formIndex = useIllusion ? illusion!.formIndex : this.formIndex;
    loadPromises.push(
      this.getSpeciesForm(false, useIllusion).loadAssets(
        this.getGender(useIllusion) === Gender.FEMALE,
        formIndex,
        this.isShiny(useIllusion),
        this.getVariant(useIllusion),
      ),
    );

    if (this.isPlayer() || this.getFusionSpeciesForm(false, useIllusion)) {
      globalScene.loadPokemonAtlas(
        this.getBattleSpriteKey(true, ignoreOverride),
        this.getBattleSpriteAtlasPath(true, ignoreOverride),
      );
    }
    if (this.getFusionSpeciesForm()) {
      const { fusionFormIndex, fusionShiny, fusionVariant } = useIllusion ? illusion! : this;
      loadPromises.push(
        this.getFusionSpeciesForm(false, useIllusion).loadAssets(
          this.getFusionGender(false, useIllusion) === Gender.FEMALE,
          fusionFormIndex,
          fusionShiny,
          fusionVariant,
        ),
      );
      globalScene.loadPokemonAtlas(
        this.getFusionBattleSpriteKey(true, ignoreOverride),
        this.getFusionBattleSpriteAtlasPath(true, ignoreOverride),
      );
    }

    if (this.isShiny(true)) {
      loadPromises.push(populateVariantColors(this, false, ignoreOverride));
      if (this.isPlayer()) {
        loadPromises.push(populateVariantColors(this, true, ignoreOverride));
      }
    }

    await Promise.allSettled(loadPromises);

    // This must be initiated before we queue loading, otherwise the load could have finished before
    // we reach the line of code that adds the listener, causing a deadlock.
    const waitOnLoadPromise = new Promise<void>(resolve =>
      globalScene.load.once(Phaser.Loader.Events.COMPLETE, resolve),
    );

    if (!globalScene.load.isLoading()) {
      globalScene.load.start();
    }

    // Wait for the assets we queued to load to finish loading, then...
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#creating_a_promise_around_an_old_callback_api
    await waitOnLoadPromise;

    // With the sprites loaded, generate the animation frame information
    if (this.isPlayer()) {
      const originalWarn = console.warn;
      // Ignore warnings for missing frames, because there will be a lot
      console.warn = () => {};
      const battleSpriteKey = this.getBattleSpriteKey(this.isPlayer(), ignoreOverride);
      const battleFrameNames = globalScene.anims.generateFrameNames(battleSpriteKey, {
        zeroPad: 4,
        suffix: ".png",
        start: 1,
        end: 400,
      });
      console.warn = originalWarn;
      if (!globalScene.anims.exists(battleSpriteKey)) {
        globalScene.anims.create({
          key: battleSpriteKey,
          frames: battleFrameNames,
          frameRate: 10,
          repeat: -1,
        });
      }
    }
    // With everything loaded, now begin playing the animation.
    this.playAnim();

    // update the fusion palette
    this.updateFusionPalette();
    if (this.summonData.speciesForm) {
      this.updateFusionPalette(true);
    }
  }

  /**
   * Gracefully handle errors loading a variant sprite. Log if it fails and attempt to fall back on
   * non-experimental sprites before giving up.
   *
   * @param cacheKey - The cache key for the variant color sprite
   * @param attemptedSpritePath - The sprite path that failed to load
   * @param useExpSprite - Whether the attempted sprite was experimental
   * @param battleSpritePath - The filename of the sprite
   * @param optionalParams - Any additional params to log
   */
  async fallbackVariantColor(
    cacheKey: string,
    attemptedSpritePath: string,
    useExpSprite: boolean,
    battleSpritePath: string,
    ...optionalParams: any[]
  ) {
    console.warn(`Could not load ${attemptedSpritePath}!`, ...optionalParams);
    if (useExpSprite) {
      await this.populateVariantColorCache(cacheKey, false, battleSpritePath);
    }
  }

  /**
   * Attempt to process variant sprite color caches.
   * @param cacheKey - the cache key for the variant color sprite
   * @param useExpSprite - Whether experimental sprites should be used if present
   * @param battleSpritePath - the filename of the sprite
   */
  async populateVariantColorCache(cacheKey: string, useExpSprite: boolean, battleSpritePath: string) {
    const spritePath = `./images/pokemon/variant/${useExpSprite ? "exp/" : ""}${battleSpritePath}.json`;
    return globalScene
      .cachedFetch(spritePath)
      .then(res => {
        // Prevent the JSON from processing if it failed to load
        if (!res.ok) {
          return this.fallbackVariantColor(
            cacheKey,
            res.url,
            useExpSprite,
            battleSpritePath,
            res.status,
            res.statusText,
          );
        }
        return res.json();
      })
      .catch(error => {
        return this.fallbackVariantColor(cacheKey, spritePath, useExpSprite, battleSpritePath, error);
      })
      .then(c => {
        if (c != null) {
          variantColorCache[cacheKey] = c;
        }
      });
  }

  getFormKey(): string {
    if (this.species.forms.length === 0 || this.species.forms.length <= this.formIndex) {
      return "";
    }
    return this.species.forms[this.formIndex].formKey;
  }

  getFusionFormKey(): string | null {
    if (!this.fusionSpecies) {
      return null;
    }
    if (this.fusionSpecies.forms.length === 0 || this.fusionSpecies.forms.length <= this.fusionFormIndex) {
      return "";
    }
    return this.fusionSpecies.forms[this.fusionFormIndex].formKey;
  }

  //#region Atlas and sprite ID methods
  // TODO: Add more documentation for all these attributes.
  // They may be all similar, but what each one actually _does_ is quite unclear at first glance

  getSpriteAtlasPath(ignoreOverride = false): string {
    const spriteId = this.getSpriteId(ignoreOverride).replace(/_{2}/g, "/");

    return `${/_[1-3]$/.test(spriteId) ? "variant/" : ""}${spriteId}`;
  }

  getBattleSpriteAtlasPath(back?: boolean, ignoreOverride?: boolean): string {
    const spriteId = this.getBattleSpriteId(back, ignoreOverride).replace(/_{2}/g, "/");
    return `${/_[1-3]$/.test(spriteId) ? "variant/" : ""}${spriteId}`;
  }

  getSpriteId(ignoreOverride?: boolean): string {
    const formIndex = this.summonData.illusion?.formIndex ?? this.formIndex;
    return this.getSpeciesForm(ignoreOverride, true).getSpriteId(
      this.getGender(ignoreOverride, true) === Gender.FEMALE,
      formIndex,
      this.shiny,
      this.variant,
    );
  }

  getBattleSpriteId(back?: boolean, ignoreOverride?: boolean): string {
    if (back === undefined) {
      back = this.isPlayer();
    }

    const formIndex = this.summonData.illusion?.formIndex ?? this.formIndex;

    return this.getSpeciesForm(ignoreOverride, true).getSpriteId(
      this.getGender(ignoreOverride, true) === Gender.FEMALE,
      formIndex,
      this.shiny,
      this.variant,
      back,
    );
  }

  getSpriteKey(ignoreOverride?: boolean): string {
    return this.getSpeciesForm(ignoreOverride, false).getSpriteKey(
      this.getGender(ignoreOverride) === Gender.FEMALE,
      this.formIndex,
      this.isShiny(false),
      this.getVariant(false),
    );
  }

  getBattleSpriteKey(back?: boolean, ignoreOverride?: boolean): string {
    return `pkmn__${this.getBattleSpriteId(back, ignoreOverride)}`;
  }

  getFusionSpriteId(ignoreOverride?: boolean): string {
    const fusionFormIndex = this.summonData.illusion?.fusionFormIndex ?? this.fusionFormIndex;
    return this.getFusionSpeciesForm(ignoreOverride, true).getSpriteId(
      this.getFusionGender(ignoreOverride, true) === Gender.FEMALE,
      fusionFormIndex,
      this.fusionShiny,
      this.fusionVariant,
    );
  }

  getFusionBattleSpriteId(back?: boolean, ignoreOverride?: boolean): string {
    if (back === undefined) {
      back = this.isPlayer();
    }

    const fusionFormIndex = this.summonData.illusion?.fusionFormIndex ?? this.fusionFormIndex;

    return this.getFusionSpeciesForm(ignoreOverride, true).getSpriteId(
      this.getFusionGender(ignoreOverride, true) === Gender.FEMALE,
      fusionFormIndex,
      this.fusionShiny,
      this.fusionVariant,
      back,
    );
  }

  getFusionBattleSpriteKey(back?: boolean, ignoreOverride?: boolean): string {
    return `pkmn__${this.getFusionBattleSpriteId(back, ignoreOverride)}`;
  }

  getFusionBattleSpriteAtlasPath(back?: boolean, ignoreOverride?: boolean): string {
    return this.getFusionBattleSpriteId(back, ignoreOverride).replace(/_{2}/g, "/");
  }

  getIconAtlasKey(ignoreOverride = false, useIllusion = true): string {
    const illusion = this.summonData.illusion;
    const { formIndex, variant } = useIllusion && illusion ? illusion : this;
    return this.getSpeciesForm(ignoreOverride, useIllusion).getIconAtlasKey(
      formIndex,
      this.isBaseShiny(useIllusion),
      variant,
    );
  }

  getFusionIconAtlasKey(ignoreOverride = false, useIllusion = true): string {
    const illusion = this.summonData.illusion;
    const { fusionFormIndex, fusionVariant } = useIllusion && illusion ? illusion : this;
    return this.getFusionSpeciesForm(ignoreOverride, useIllusion).getIconAtlasKey(
      fusionFormIndex,
      this.isFusionShiny(),
      fusionVariant,
    );
  }

  getIconId(ignoreOverride?: boolean, useIllusion = false): string {
    const illusion = this.summonData.illusion;
    const { formIndex, variant } = useIllusion && illusion ? illusion : this;
    return this.getSpeciesForm(ignoreOverride, useIllusion).getIconId(
      this.getGender(ignoreOverride, useIllusion) === Gender.FEMALE,
      formIndex,
      this.isBaseShiny(),
      variant,
    );
  }

  getFusionIconId(ignoreOverride?: boolean, useIllusion = true): string {
    const illusion = this.summonData.illusion;
    const { fusionFormIndex, fusionVariant } = useIllusion && illusion ? illusion : this;
    return this.getFusionSpeciesForm(ignoreOverride, useIllusion).getIconId(
      this.getFusionGender(ignoreOverride, useIllusion) === Gender.FEMALE,
      fusionFormIndex,
      this.isFusionShiny(),
      fusionVariant,
    );
  }
  //#endregion Atlas and sprite ID methods

  /**
   * Return this Pokemon's {@linkcode PokemonSpeciesForm | SpeciesForm}.
   * @param ignoreOverride - Whether to ignore any overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `false`
   * and overrides `useIllusion`.
   * @param useIllusion - Whether to consider this Pokemon's illusion if present; default `false`.
   * @returns This Pokemon's {@linkcode PokemonSpeciesForm}.
   */
  getSpeciesForm(ignoreOverride = false, useIllusion = false): PokemonSpeciesForm {
    if (!ignoreOverride && this.summonData.speciesForm) {
      return this.summonData.speciesForm;
    }

    const species: PokemonSpecies =
      useIllusion && this.summonData.illusion ? getPokemonSpecies(this.summonData.illusion.species) : this.species;
    const formIndex = useIllusion && this.summonData.illusion ? this.summonData.illusion.formIndex : this.formIndex;

    if (species.forms && species.forms.length > 0) {
      return species.forms[formIndex];
    }

    return species;
  }

  /**
   * Getter function that returns whether this {@linkcode Pokemon} is currently transformed into another one
   * (such as by the effects of {@linkcode MoveId.TRANSFORM} or {@linkcode AbilityId.IMPOSTER}.
   * @returns Whether this Pokemon is currently transformed.
   */
  public isTransformed(): boolean {
    return this.summonData.speciesForm !== null;
  }

  /**
   * Return whether this Pokemon can transform into an opposing Pokemon.
   * @param target - The {@linkcode Pokemon} being transformed into
   * @returns Whether this Pokemon can transform into `target`.
   */
  public canTransformInto(target: Pokemon): boolean {
    return !(
      // Neither pokemon can be already transformed
      (
        this.isTransformed()
        || target.isTransformed() // Neither pokemon can be behind an illusion
        || target.summonData.illusion
        || this.summonData.illusion // The target cannot be behind a substitute
        || target.getTag(BattlerTagType.SUBSTITUTE) // Transforming to/from fusion pokemon causes various problems (crashes, etc.) // TODO: Consider lifting restriction once bug is fixed
        || this.isFusion()
        || target.isFusion()
      )
    );
  }

  /**
   * Return the {@linkcode PokemonSpeciesForm | SpeciesForm} of this Pokemon's fusion counterpart.
   * @param ignoreOverride - Whether to ignore species overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `false`
   * @param useIllusion - Whether to consider the species of this Pokemon's illusion; default `false`
   * @returns The {@linkcode PokemonSpeciesForm} of this Pokemon's fusion counterpart.
   */
  public getFusionSpeciesForm(ignoreOverride = false, useIllusion = false): PokemonSpeciesForm {
    const fusionSpecies: PokemonSpecies =
      useIllusion && this.summonData.illusion ? this.summonData.illusion.fusionSpecies! : this.fusionSpecies!;
    const fusionFormIndex =
      useIllusion && this.summonData.illusion ? this.summonData.illusion.fusionFormIndex! : this.fusionFormIndex;

    if (!ignoreOverride && this.summonData.fusionSpeciesForm) {
      return this.summonData.fusionSpeciesForm;
    }
    if (fusionSpecies?.forms?.length === 0 || fusionFormIndex >= fusionSpecies?.forms.length) {
      return fusionSpecies;
    }
    return fusionSpecies?.forms[fusionFormIndex];
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.getAt(0) as Phaser.GameObjects.Sprite;
  }

  getTintSprite(): Phaser.GameObjects.Sprite | null {
    return !this.maskEnabled ? (this.getAt(1) as Phaser.GameObjects.Sprite) : this.maskSprite;
  }

  getSpriteScale(): number {
    const formKey = this.getFormKey();
    if (
      this.isMax() === true
      || formKey === "segin-starmobile"
      || formKey === "schedar-starmobile"
      || formKey === "navi-starmobile"
      || formKey === "ruchbah-starmobile"
      || formKey === "caph-starmobile"
    ) {
      // G-Max and starmobiles have flat 1.5x scale
      return 1.5;
    }

    // TODO: Rather than using -1 as a default... why don't we just change it to 1????????
    if (this.customPokemonData.spriteScale <= 0) {
      return 1;
    }
    return this.customPokemonData.spriteScale;
  }

  /** Resets the pokemon's field sprite properties, including position, alpha, and scale */
  public resetSprite(): void {
    // Resetting properties should not be shown on the field
    this.setVisible(false);

    // Remove the offset from having a Substitute active
    if (this.isOffsetBySubstitute()) {
      this.x -= this.getSubstituteOffset()[0];
      this.y -= this.getSubstituteOffset()[1];
    }

    // Reset sprite display properties
    this.setAlpha(1);
    this.setScale(this.getSpriteScale());
  }

  getHeldItems(): PokemonHeldItemModifier[] {
    if (!globalScene) {
      return [];
    }
    return globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === this.id,
      this.isPlayer(),
    ) as PokemonHeldItemModifier[];
  }

  updateScale(): void {
    this.setScale(this.getSpriteScale());
  }

  updateSpritePipelineData(): void {
    [this.getSprite(), this.getTintSprite()]
      .filter(s => !!s)
      .map(s => {
        s.pipelineData["teraColor"] = getTypeRgb(this.getTeraType());
        s.pipelineData["isTerastallized"] = this.isTerastallized;
      });
    this.updateInfo(true);
  }

  initShinySparkle(): void {
    const shinySparkle = globalScene.addFieldSprite(0, 0, "shiny");
    shinySparkle.setVisible(false);
    shinySparkle.setOrigin(0.5, 1);
    this.add(shinySparkle);

    this.shinySparkle = shinySparkle;
  }

  /**
   * Attempts to animate a given {@linkcode Phaser.GameObjects.Sprite}
   * @see {@linkcode Phaser.GameObjects.Sprite.play}
   * @param sprite - Sprite to animate
   * @param tintSprite - Sprite placed on top of the sprite to add a color tint
   * @param animConfig - String to pass to the sprite's {@linkcode Phaser.GameObjects.Sprite.play | play} method
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
    this.tryPlaySprite(this.getSprite(), this.getTintSprite()!, this.getBattleSpriteKey()); // TODO: is the bang correct?
  }

  getFieldPositionOffset(): [number, number] {
    switch (this.fieldPosition) {
      case FieldPosition.CENTER:
        return [0, 0];
      case FieldPosition.LEFT:
        return [-32, -8];
      case FieldPosition.RIGHT:
        return [32, 0];
    }
  }

  /**
   * Returns the Pokemon's offset from its current field position in the event that
   * it has a Substitute doll in effect. The offset is returned in `[ x, y ]` format.
   * @see {@linkcode SubstituteTag}
   * @see {@linkcode getFieldPositionOffset}
   */
  getSubstituteOffset(): [number, number] {
    return this.isPlayer() ? [-30, 10] : [30, -10];
  }

  /**
   * Returns whether or not the Pokemon's position on the field is offset because
   * the Pokemon has a Substitute active.
   * @see {@linkcode SubstituteTag}
   */
  isOffsetBySubstitute(): boolean {
    const substitute = this.getTag(SubstituteTag);
    if (!substitute || substitute.sprite === undefined) {
      return false;
    }
    // During the Pokemon's MoveEffect phase, the offset is removed to put the Pokemon "in focus"
    const currentPhase = globalScene.phaseManager.getCurrentPhase();
    return !(currentPhase.is("MoveEffectPhase") && currentPhase.getPokemon() === this);
  }

  /** If this Pokemon has a Substitute on the field, removes its sprite from the field. */
  destroySubstitute(): void {
    const substitute = this.getTag(SubstituteTag);
    if (substitute?.sprite) {
      substitute.sprite.destroy();
    }
  }

  /**
   * Set the field position of this Pokémon
   * @param fieldPosition - The new field position
   * @param duration - How long the transition should take, in milliseconds; if `0` or `undefined`, the position is changed instantly
   */
  public setFieldPosition(fieldPosition: FieldPosition, duration?: number): Promise<void> {
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

      const subTag = this.getTag(SubstituteTag);

      if (duration) {
        // TODO: can this use stricter typing?
        const targets: any[] = [this];
        if (subTag?.sprite) {
          targets.push(subTag.sprite);
        }
        globalScene.tweens.add({
          targets,
          x: (_target, _key, value: number) => value + relX,
          y: (_target, _key, value: number) => value + relY,
          duration,
          ease: "Sine.easeOut",
          onComplete: () => resolve(),
        });
      } else {
        this.x += relX;
        this.y += relY;
        if (subTag?.sprite) {
          subTag.sprite.x += relX;
          subTag.sprite.y += relY;
        }
      }
    });
  }

  /**
   * Retrieves the entire set of stats of this {@linkcode Pokemon}.
   * @param bypassSummonData - Whether to prefer actual stats (`true`) or in-battle overridden stats (`false`); default `true`
   * @returns The numeric values of this {@linkcode Pokemon}'s stats as an array.
   */
  getStats(bypassSummonData = true): number[] {
    if (!bypassSummonData) {
      // Only grab summon data stats if nonzero
      return this.summonData.stats.map((s, i) => s || this.stats[i]);
    }
    return this.stats;
  }

  /**
   * Retrieves the corresponding {@linkcode PermanentStat} of the {@linkcode Pokemon}.
   * @param stat - The {@linkcode PermanentStat} to retrieve
   * @param bypassSummonData - Whether to prefer actual stats (`true`) or in-battle overridden stats (`false`); default `true`
   * @returns The numeric value of the desired {@linkcode Stat}.
   */
  getStat(stat: PermanentStat, bypassSummonData = true): number {
    if (!bypassSummonData) {
      // 0 = no override
      return this.summonData.stats[stat] || this.stats[stat];
    }
    return this.stats[stat];
  }

  /**
   * Change one of this {@linkcode Pokemon}'s {@linkcode PermanentStat}s to the specified value.
   * @param stat - The {@linkcode PermanentStat} to be overwritten
   * @param value - The stat value to set. Ignored if `<=0`
   * @param bypassSummonData - Whether to write to actual stats (`true`) or in-battle overridden stats (`false`); default `true`
   */
  setStat(stat: PermanentStat, value: number, bypassSummonData = true): void {
    if (value <= 0) {
      return;
    }

    if (!bypassSummonData) {
      this.summonData.stats[stat] = value;
    } else {
      this.stats[stat] = value;
    }
  }

  /**
   * Retrieves the entire set of in-battle stat stages of the {@linkcode Pokemon}.
   * @returns the numeric values of the {@linkcode Pokemon}'s in-battle stat stages if available, a fresh stat stage array otherwise
   */
  getStatStages(): number[] {
    return this.summonData.statStages;
  }

  /**
   * Retrieve the value of the given stat stage for this {@linkcode Pokemon}.
   * @param stat - The {@linkcode BattleStat} to retrieve the stat stage for
   * @returns The value of the desired stat stage as a number within the range `[-6, +6]`.
   */
  getStatStage(stat: BattleStat): number {
    return this.summonData.statStages[stat - 1];
  }

  /**
   * Sets this {@linkcode Pokemon}'s in-battle stat stage to the corresponding value.
   * @param stat - The {@linkcode BattleStat} whose stage is to be overwritten
   * @param value - The value of the stat stage to set, forcibly clamped within the range `[-6, +6]`.
   */
  setStatStage(stat: BattleStat, value: number): void {
    this.summonData.statStages[stat - 1] = Phaser.Math.Clamp(value, -6, 6);
  }

  /**
   * Calculate the critical-hit stage of a move used **against** this pokemon by
   * the given source.
   *
   * @param source - The {@linkcode Pokemon} using the move
   * @param move - The {@linkcode Move} being used
   * @returns The final critical-hit stage value
   */
  getCritStage(source: Pokemon, move: Move): number {
    const critStage = new NumberHolder(0);
    applyMoveAttrs("HighCritAttr", source, this, move, critStage);
    globalScene.applyModifiers(CritBoosterModifier, source.isPlayer(), source, critStage);
    globalScene.applyModifiers(TempCritBoosterModifier, source.isPlayer(), critStage);
    applyAbAttrs("BonusCritAbAttr", { pokemon: source, critStage });
    const critBoostTag = source.getTag(CritBoostTag);
    if (critBoostTag) {
      // Dragon cheer only gives +1 crit stage to non-dragon types
      critStage.value += critBoostTag.critStages;
    }

    console.log(`crit stage: +${critStage.value}`);
    return critStage.value;
  }

  /**
   * Calculates the category of a move when used by this pokemon after
   * category-changing move effects are applied.
   * @param target - The {@linkcode Pokemon} using the move
   * @param move - The {@linkcode Move} being used
   * @returns The given move's final category
   */
  getMoveCategory(target: Pokemon, move: Move): MoveCategory {
    const moveCategory = new NumberHolder(move.category);
    applyMoveAttrs("VariableMoveCategoryAttr", this, target, move, moveCategory);
    return moveCategory.value;
  }

  /**
   * Calculates and retrieves the final value of a stat considering any held
   * items, move effects, opponent abilities, and whether there was a critical
   * hit.
   * @param stat - The desired {@linkcode EffectiveStat | Stat} to check.
   * @param opponent - The {@linkcode Pokemon} being targeted, if applicable.
   * @param move - The {@linkcode Move} being used, if any. Used to check ability ignoring effects and similar.
   * @param ignoreAbility - Whether to ignore ability effects of the user; default `false`.
   * @param ignoreOppAbility - Whether to ignore ability effects of the target; default `false`.
   * @param ignoreAllyAbility - Whether to ignore ability effects of the user's allies; default `false`.
   * @param isCritical - Whether a critical hit has occurred or not; default `false`.
   * If `true`, will nullify offensive stat drops or defensive stat boosts.
   * @param simulated - Whether to nullify any effects that produce changes to game state during calculations; default `true`
   * @param ignoreHeldItems - Whether to ignore the user's held items during stat calculation; default `false`.
   * @returns The final in-battle value for the given stat.
   */
  // TODO: Replace the optional parameters with an object to make calling this method less cumbersome
  getEffectiveStat(
    stat: EffectiveStat,
    opponent?: Pokemon,
    move?: Move,
    ignoreAbility = false,
    ignoreOppAbility = false,
    ignoreAllyAbility = false,
    isCritical = false,
    simulated = true,
    ignoreHeldItems = false,
  ): number {
    const statVal = new NumberHolder(this.getStat(stat, false));
    if (!ignoreHeldItems) {
      globalScene.applyModifiers(StatBoosterModifier, this.isPlayer(), this, stat, statVal);
    }

    // The Ruin abilities here are never ignored, but they reveal themselves on summon anyway
    const fieldApplied = new BooleanHolder(false);
    for (const pokemon of globalScene.getField(true)) {
      // TODO: remove `canStack` toggle from ability as breaking out renders it useless
      applyAbAttrs("FieldMultiplyStatAbAttr", {
        pokemon,
        stat,
        statVal,
        target: this,
        hasApplied: fieldApplied,
        simulated,
      });
      if (fieldApplied.value) {
        break;
      }
    }

    if (!ignoreAbility) {
      applyAbAttrs("StatMultiplierAbAttr", {
        pokemon: this,
        stat,
        statVal,
        simulated,
        // TODO: maybe just don't call this if the move is none?
        move: move ?? allMoves[MoveId.NONE],
      });
    }

    const ally = this.getAlly();
    if (ally != null) {
      applyAbAttrs("AllyStatMultiplierAbAttr", {
        pokemon: ally,
        stat,
        statVal,
        simulated,
        // TODO: maybe just don't call this if the move is none?
        move: move ?? allMoves[MoveId.NONE],
        ignoreAbility: move?.hasFlag(MoveFlags.IGNORE_ABILITIES) || ignoreAllyAbility,
      });
    }

    let ret =
      statVal.value
      * this.getStatStageMultiplier(stat, opponent, move, ignoreOppAbility, isCritical, simulated, ignoreHeldItems);

    switch (stat) {
      case Stat.ATK:
        if (this.getTag(BattlerTagType.SLOW_START)) {
          ret >>= 1;
        }
        break;
      case Stat.DEF:
        if (this.isOfType(PokemonType.ICE) && globalScene.arena.weather?.weatherType === WeatherType.SNOW) {
          ret *= 1.5;
        }
        break;
      case Stat.SPATK:
        break;
      case Stat.SPDEF:
        if (this.isOfType(PokemonType.ROCK) && globalScene.arena.weather?.weatherType === WeatherType.SANDSTORM) {
          ret *= 1.5;
        }
        break;
      case Stat.SPD: {
        const side = this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
        if (globalScene.arena.getTagOnSide(ArenaTagType.TAILWIND, side)) {
          ret *= 2;
        }
        if (globalScene.arena.getTagOnSide(ArenaTagType.GRASS_WATER_PLEDGE, side)) {
          ret >>= 2;
        }

        if (this.getTag(BattlerTagType.SLOW_START)) {
          ret >>= 1;
        }
        if (this.status && this.status.effect === StatusEffect.PARALYSIS) {
          ret >>= 1;
        }
        if (this.getTag(BattlerTagType.UNBURDEN) && this.hasAbility(AbilityId.UNBURDEN)) {
          ret *= 2;
        }
        break;
      }
    }

    const highestStatBoost = this.findTag(
      t => t instanceof HighestStatBoostTag && (t as HighestStatBoostTag).stat === stat,
    ) as HighestStatBoostTag;
    if (highestStatBoost) {
      ret *= highestStatBoost.multiplier;
    }

    return Math.floor(ret);
  }

  calculateStats(): void {
    if (!this.stats) {
      this.stats = [0, 0, 0, 0, 0, 0];
    }

    // Get and manipulate base stats
    const baseStats = this.calculateBaseStats();
    // Using base stats, calculate and store stats one by one
    for (const s of PERMANENT_STATS) {
      const statHolder = new NumberHolder(Math.floor((2 * baseStats[s] + this.ivs[s]) * this.level * 0.01));
      if (s === Stat.HP) {
        statHolder.value = statHolder.value + this.level + 10;
        globalScene.applyModifier(PokemonIncrementingStatModifier, this.isPlayer(), this, s, statHolder);
        if (this.hasAbility(AbilityId.WONDER_GUARD, false, true)) {
          statHolder.value = 1;
        }
        if (this.hp > statHolder.value || this.hp === undefined) {
          this.hp = statHolder.value;
        } else if (this.hp) {
          const lastMaxHp = this.getMaxHp();
          if (lastMaxHp && statHolder.value > lastMaxHp) {
            this.hp += statHolder.value - lastMaxHp;
          }
        }
      } else {
        statHolder.value += 5;
        const natureStatMultiplier = new NumberHolder(getNatureStatMultiplier(this.getNature(), s));
        globalScene.applyModifier(PokemonNatureWeightModifier, this.isPlayer(), this, natureStatMultiplier);
        if (natureStatMultiplier.value !== 1) {
          statHolder.value = Math.max(
            Math[natureStatMultiplier.value > 1 ? "ceil" : "floor"](statHolder.value * natureStatMultiplier.value),
            1,
          );
        }
        globalScene.applyModifier(PokemonIncrementingStatModifier, this.isPlayer(), this, s, statHolder);
      }

      statHolder.value = Phaser.Math.Clamp(statHolder.value, 1, Number.MAX_SAFE_INTEGER);

      this.setStat(s, statHolder.value);
    }
  }

  calculateBaseStats(): number[] {
    const baseStats = this.getSpeciesForm(true).baseStats.slice(0);
    applyChallenges(ChallengeType.FLIP_STAT, this, baseStats);
    // Shuckle Juice
    globalScene.applyModifiers(PokemonBaseStatTotalModifier, this.isPlayer(), this, baseStats);
    // Old Gateau
    globalScene.applyModifiers(PokemonBaseStatFlatModifier, this.isPlayer(), this, baseStats);
    if (this.isFusion()) {
      const fusionBaseStats = this.getFusionSpeciesForm(true).baseStats;
      applyChallenges(ChallengeType.FLIP_STAT, this, fusionBaseStats);

      for (const s of PERMANENT_STATS) {
        baseStats[s] = Math.ceil((baseStats[s] + fusionBaseStats[s]) / 2);
      }
    } else if (globalScene.gameMode.isSplicedOnly) {
      for (const s of PERMANENT_STATS) {
        baseStats[s] = Math.ceil(baseStats[s] / 2);
      }
    }
    // Vitamins
    globalScene.applyModifiers(BaseStatModifier, this.isPlayer(), this, baseStats);

    return baseStats;
  }

  // TODO: Convert this into a getter
  getNature(): Nature {
    return this.customPokemonData.nature !== -1 ? this.customPokemonData.nature : this.nature;
  }

  // TODO: Convert this into a setter OR just add a listener for calculateStats...
  setNature(nature: Nature): void {
    this.nature = nature;
    this.calculateStats();
  }

  setCustomNature(nature: Nature): void {
    this.customPokemonData.nature = nature;
    this.calculateStats();
  }

  /**
   * Randomly generate and set this Pokémon's nature
   * @param naturePool - An optional array of Natures to choose from. If not provided, all natures will be considered.
   */
  private generateNature(naturePool?: Nature[]): void {
    if (naturePool === undefined) {
      naturePool = getEnumValues(Nature);
    }
    const nature = naturePool[randSeedInt(naturePool.length)];
    this.setNature(nature);
  }

  // TODO: Convert this into a getter
  isFullHp(): boolean {
    return this.hp >= this.getMaxHp();
  }

  // TODO: Convert this into a getter
  getMaxHp(): number {
    return this.getStat(Stat.HP);
  }

  /** Returns the amount of hp currently missing from this {@linkcode Pokemon} (max - current) */
  getInverseHp(): number {
    return this.getMaxHp() - this.hp;
  }

  /**
   * Return the ratio of this Pokémon's current HP to its maximum HP
   * @param precise - Whether to return the exact HP ratio (e.g. `0.54321`), or one rounded to the nearest %; default `false`
   * @returns The current HP ratio
   */
  getHpRatio(precise = false): number {
    return precise ? this.hp / this.getMaxHp() : Math.round((this.hp / this.getMaxHp()) * 100) / 100;
  }

  /**
   * Return this Pokemon's {@linkcode Gender}.
   * @param ignoreOverride - Whether to ignore any overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `false`
   * @param useIllusion - Whether to consider this pokemon's illusion if present; default `false`
   * @returns the {@linkcode Gender} of this {@linkcode Pokemon}.
   */
  getGender(ignoreOverride = false, useIllusion = false): Gender {
    if (useIllusion && this.summonData.illusion) {
      return this.summonData.illusion.gender;
    }
    if (!ignoreOverride && this.summonData.gender != null) {
      return this.summonData.gender;
    }
    return this.gender;
  }

  /**
   * Return this Pokemon's fusion's {@linkcode Gender}.
   * @param ignoreOverride - Whether to ignore any overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `false`
   * @param useIllusion - Whether to consider this pokemon's illusion if present; default `false`
   * @returns The {@linkcode Gender} of this {@linkcode Pokemon}'s fusion.
   */
  getFusionGender(ignoreOverride = false, useIllusion = false): Gender {
    if (useIllusion && this.summonData.illusion?.fusionGender) {
      return this.summonData.illusion.fusionGender;
    }
    if (!ignoreOverride && this.summonData.fusionGender != null) {
      return this.summonData.fusionGender;
    }
    return this.fusionGender;
  }

  /**
   * Check whether this Pokémon is shiny, including its fusion species
   *
   * @param useIllusion - Whether to consider an active illusion
   * @returns Whether this Pokemon is shiny
   * @see {@linkcode isBaseShiny}
   */
  isShiny(useIllusion = false): boolean {
    return this.isBaseShiny(useIllusion) || this.isFusionShiny(useIllusion);
  }

  /**
   * Get whether this Pokémon's _base_ species is shiny
   * @param useIllusion - Whether to consider an active illusion; default `false`
   * @returns Whether the pokemon is shiny
   */
  isBaseShiny(useIllusion = false) {
    return useIllusion ? (this.summonData.illusion?.shiny ?? this.shiny) : this.shiny;
  }

  /**
   * Get whether this Pokémon's _fusion_ species is shiny
   * @param useIllusion - Whether to consider an active illusion; default `true`
   * @returns Whether this Pokémon's fusion species is shiny, or `false` if there is no fusion
   */
  isFusionShiny(useIllusion = false) {
    if (!this.isFusion(useIllusion)) {
      return false;
    }
    return useIllusion ? (this.summonData.illusion?.fusionShiny ?? this.fusionShiny) : this.fusionShiny;
  }

  /**
   * Check whether this Pokemon is doubly shiny (both normal and fusion are shiny).
   * @param useIllusion - Whether to consider an active illusion; default `false`
   * @returns Whether this pokemon's base and fusion counterparts are both shiny.
   */
  isDoubleShiny(useIllusion = false): boolean {
    return this.isFusion(useIllusion) && this.isBaseShiny(useIllusion) && this.isFusionShiny(useIllusion);
  }

  /**
   * Return this Pokemon's shiny variant.
   * If a fusion, returns the maximum of the two variants.
   * Only meaningful if this pokemon is actually shiny.
   * @param useIllusion - Whether to consider an active illusion; default `false`
   * @returns The shiny variant of this Pokemon.
   */
  getVariant(useIllusion = false): Variant {
    const illusion = this.summonData.illusion;
    const baseVariant = useIllusion ? (illusion?.variant ?? this.variant) : this.variant;
    if (!this.isFusion(useIllusion)) {
      return baseVariant;
    }
    const fusionVariant = useIllusion ? (illusion?.fusionVariant ?? this.fusionVariant) : this.fusionVariant;
    return Math.max(baseVariant, fusionVariant) as Variant;
  }

  /**
   * Return the base pokemon's variant. Equivalent to {@linkcode getVariant} if this pokemon is not a fusion.
   * @param useIllusion - Whether to consider an active illusion; default `false`
   * @returns The shiny variant of this Pokemon's base species.
   */
  getBaseVariant(useIllusion = false): Variant {
    const illusion = this.summonData.illusion;
    return useIllusion && illusion ? (illusion.variant ?? this.variant) : this.variant;
  }

  /**
   * Get the shiny variant of this Pokémon's _fusion_ species
   *
   * @remarks
   * Always returns `0` if the pokemon is not a fusion.
   * @param useIllusion - Whether to consider an active illusion
   * @returns The shiny variant of this pokemon's fusion species.
   */
  getFusionVariant(useIllusion = false): Variant {
    if (!this.isFusion(useIllusion)) {
      return 0;
    }
    const illusion = this.summonData.illusion;
    return illusion ? (illusion.fusionVariant ?? this.fusionVariant) : this.fusionVariant;
  }

  /**
   * Return this pokemon's overall luck value, based on its shininess (1 pt per variant lvl).
   * @returns The luck value of this Pokemon.
   */
  getLuck(): number {
    return this.luck + (this.isFusion() ? this.fusionLuck : 0);
  }

  /**
   * Return whether this {@linkcode Pokemon} is currently fused with anything.
   * @param useIllusion - Whether to consider an active illusion; default `false`
   * @returns Whether this Pokemon is currently fused with another species.
   */
  isFusion(useIllusion = false): boolean {
    return !!(useIllusion ? (this.summonData.illusion?.fusionSpecies ?? this.fusionSpecies) : this.fusionSpecies);
  }

  /**
   * Return this {@linkcode Pokemon}'s name.
   * @param useIllusion - Whether to consider an active illusion; default `false`
   * @returns This Pokemon's name.
   * @see {@linkcode getNameToRender} - gets this Pokemon's display name.
   */
  getName(useIllusion = false): string {
    return useIllusion ? (this.summonData.illusion?.name ?? this.name) : this.name;
  }

  /**
   * Check whether this {@linkcode Pokemon} has a fusion with the specified {@linkcode SpeciesId}.
   * @param species - The {@linkcode SpeciesId} to check against.
   * @returns Whether this Pokemon is currently fused with the specified {@linkcode SpeciesId}.
   */
  hasFusionSpecies(species: SpeciesId): boolean {
    return this.fusionSpecies?.speciesId === species;
  }

  /**
   * Check whether this {@linkcode Pokemon} either is or is fused with the given {@linkcode SpeciesId}.
   * @param species - The {@linkcode SpeciesId} to check against.
   * @param formKey - If provided, will require the species to be in the given form.
   * @returns Whether this Pokemon has this species as either its base or fusion counterpart.
   */
  hasSpecies(species: SpeciesId, formKey?: string): boolean {
    if (formKey == null) {
      return this.species.speciesId === species || this.fusionSpecies?.speciesId === species;
    }

    return (
      (this.species.speciesId === species && this.getFormKey() === formKey)
      || (this.fusionSpecies?.speciesId === species && this.getFusionFormKey() === formKey)
    );
  }

  abstract isBoss(): boolean;

  /**
   * Return all the {@linkcode PokemonMove}s that make up this Pokemon's moveset.
   * Takes into account player/enemy moveset overrides (which will also override PP count).
   * @param ignoreOverride - Whether to ignore any overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `false`
   * @returns An array of {@linkcode PokemonMove}, as described above.
   */
  getMoveset(ignoreOverride = false): PokemonMove[] {
    // Override moveset based on arrays specified in overrides.ts
    const overrideArray = coerceArray(this.isPlayer() ? Overrides.MOVESET_OVERRIDE : Overrides.ENEMY_MOVESET_OVERRIDE);
    if (overrideArray.length === 0) {
      return !ignoreOverride && this.summonData.moveset ? this.summonData.moveset : this.moveset;
    }

    if (!this.isPlayer()) {
      this.moveset = [];
    }
    // TODO: Preserve PP used while the moveset override is active
    overrideArray.forEach((move: MoveId, index: number) => {
      const ppUsed = this.moveset[index]?.ppUsed ?? 0;
      this.moveset[index] = new PokemonMove(move, Math.min(ppUsed, allMoves[move].pp));
    });

    return !ignoreOverride && this.summonData.moveset ? this.summonData.moveset : this.moveset;
  }

  /**
   * Check which egg moves have been unlocked for this {@linkcode Pokemon}.
   * Looks at either the species it was met at or the first {@linkcode Species} in its evolution
   * line that can act as a starter and provides those egg moves.
   * @returns An array of all {@linkcode MoveId}s that are egg moves and unlocked for this Pokemon.
   */
  getUnlockedEggMoves(): MoveId[] {
    const moves: MoveId[] = [];
    const species =
      this.metSpecies in speciesEggMoves ? this.metSpecies : this.getSpeciesForm(true).getRootSpeciesId(true);
    if (species in speciesEggMoves) {
      for (let i = 0; i < 4; i++) {
        if (globalScene.gameData.starterData[species].eggMoves & (1 << i)) {
          moves.push(speciesEggMoves[species][i]);
        }
      }
    }
    return moves;
  }

  /**
   * Get all possible learnable level moves for the {@linkcode Pokemon},
   * excluding any moves already known.
   *
   * Available egg moves are only included if the {@linkcode Pokemon} was
   * in the starting party of the run and if Fresh Start is not active.
   * @returns An array of {@linkcode MoveId}s, as described above.
   */
  public getLearnableLevelMoves(): MoveId[] {
    let levelMoves = this.getLevelMoves(1, true, false, true).map(lm => lm[1]);
    if (this.metBiome === -1 && !globalScene.gameMode.isFreshStartChallenge() && !globalScene.gameMode.isDaily) {
      levelMoves = this.getUnlockedEggMoves().concat(levelMoves);
    }
    if (Array.isArray(this.usedTMs) && this.usedTMs.length > 0) {
      levelMoves = this.usedTMs.filter(m => !levelMoves.includes(m)).concat(levelMoves);
    }
    levelMoves = levelMoves.filter(lm => !this.moveset.some(m => m.moveId === lm));
    return levelMoves;
  }

  /**
   * Evaluate and return this Pokemon's typing.
   * @param includeTeraType - Whether to use this Pokemon's tera type if Terastallized; default `false`
   * @param forDefend - Whether this Pokemon is currently receiving an attack; default `false`
   * @param ignoreOverride - Whether to ignore any overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `false`
   * @param useIllusion - Whether to consider an active illusion; default `false`
   * @returns An array of {@linkcode PokemonType}s corresponding to this Pokemon's typing (real or perceived).
   */
  public getTypes(
    includeTeraType = false,
    forDefend = false,
    ignoreOverride = false,
    useIllusion = false,
  ): PokemonType[] {
    const types: PokemonType[] = [];

    if (includeTeraType && this.isTerastallized) {
      const teraType = this.getTeraType();
      if (this.isTerastallized && !(forDefend && teraType === PokemonType.STELLAR)) {
        // Stellar tera uses its original types defensively
        types.push(teraType);
        if (forDefend) {
          return types;
        }
      }
    }
    if (types.length === 0 || !includeTeraType) {
      if (
        !ignoreOverride
        && this.summonData.types
        && this.summonData.types.length > 0
        && (!this.summonData.illusion || !useIllusion)
      ) {
        this.summonData.types.forEach(t => types.push(t));
      } else {
        const speciesForm = this.getSpeciesForm(ignoreOverride, useIllusion);
        const fusionSpeciesForm = this.getFusionSpeciesForm(ignoreOverride, useIllusion);
        const customTypes = this.customPokemonData.types?.length > 0;

        // First type, checking for "permanently changed" types from ME
        const firstType =
          customTypes && this.customPokemonData.types[0] !== PokemonType.UNKNOWN
            ? this.customPokemonData.types[0]
            : speciesForm.type1;
        types.push(firstType);

        // Second type
        let secondType: PokemonType = PokemonType.UNKNOWN;

        if (fusionSpeciesForm) {
          // Check if the fusion Pokemon also has permanent changes from ME when determining the fusion types
          const fusionType1 =
            this.fusionCustomPokemonData?.types
            && this.fusionCustomPokemonData.types.length > 0
            && this.fusionCustomPokemonData.types[0] !== PokemonType.UNKNOWN
              ? this.fusionCustomPokemonData.types[0]
              : fusionSpeciesForm.type1;
          const fusionType2 =
            this.fusionCustomPokemonData?.types
            && this.fusionCustomPokemonData.types.length > 1
            && this.fusionCustomPokemonData.types[1] !== PokemonType.UNKNOWN
              ? this.fusionCustomPokemonData.types[1]
              : fusionSpeciesForm.type2;

          // Assign second type if the fusion can provide one
          if (fusionType2 !== null && fusionType2 !== types[0]) {
            secondType = fusionType2;
          } else if (fusionType1 !== types[0]) {
            secondType = fusionType1;
          }

          if (secondType === PokemonType.UNKNOWN && fusionType2 == null) {
            // If second pokemon was monotype and shared its primary type
            secondType =
              customTypes
              && this.customPokemonData.types.length > 1
              && this.customPokemonData.types[1] !== PokemonType.UNKNOWN
                ? this.customPokemonData.types[1]
                : (speciesForm.type2 ?? PokemonType.UNKNOWN);
          }
        } else {
          // If not a fusion, just get the second type from the species, checking for permanent changes from ME
          secondType =
            customTypes
            && this.customPokemonData.types.length > 1
            && this.customPokemonData.types[1] !== PokemonType.UNKNOWN
              ? this.customPokemonData.types[1]
              : (speciesForm.type2 ?? PokemonType.UNKNOWN);
        }

        if (secondType !== PokemonType.UNKNOWN) {
          types.push(secondType);
        }
      }
    }

    // become UNKNOWN if no types are present
    if (types.length === 0) {
      types.push(PokemonType.UNKNOWN);
    }

    // remove UNKNOWN if other types are present
    if (types.length > 1) {
      const index = types.indexOf(PokemonType.UNKNOWN);
      if (index !== -1) {
        types.splice(index, 1);
      }
    }

    // check type added to Pokemon from moves like Forest's Curse or Trick Or Treat
    if (!ignoreOverride && this.summonData.addedType && !types.includes(this.summonData.addedType)) {
      types.push(this.summonData.addedType);
    }

    // If both types are the same (can happen in weird custom typing scenarios), reduce to single type
    if (types.length > 1 && types[0] === types[1]) {
      types.splice(0, 1);
    }

    return types;
  }

  /**
   * Check if this Pokemon's typing includes the specified type.
   * @param type - The {@linkcode PokemonType} to check
   * @param includeTeraType - Whether to use this Pokemon's tera type if Terastallized; default `true`
   * @param forDefend - Whether this Pokemon is currently receiving an attack; default `false`
   * @param ignoreOverride - Whether to ignore any overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `false`
   * @returns Whether this Pokemon is of the specified type.
   */
  public isOfType(type: PokemonType, includeTeraType = true, forDefend = false, ignoreOverride = false): boolean {
    return this.getTypes(includeTeraType, forDefend, ignoreOverride).includes(type);
  }

  /**
   * Get this Pokemon's non-passive {@linkcode Ability}, factoring in fusions, overrides and ability-changing effects.

   * Should rarely be called directly in favor of {@linkcode hasAbility} or {@linkcode hasAbilityWithAttr},
   * both of which check both ability slots and account for suppression.
   * @see {@linkcode hasAbility} and {@linkcode hasAbilityWithAttr} are the intended ways to check abilities in most cases
   * @param ignoreOverride - Whether to ignore any overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `false`
   * @returns The non-passive {@linkcode Ability} of this Pokemon.
   */
  public getAbility(ignoreOverride = false): Ability {
    if (!ignoreOverride && this.summonData.ability) {
      return allAbilities[this.summonData.ability];
    }
    if (Overrides.ABILITY_OVERRIDE && this.isPlayer()) {
      return allAbilities[Overrides.ABILITY_OVERRIDE];
    }
    if (Overrides.ENEMY_ABILITY_OVERRIDE && this.isEnemy()) {
      return allAbilities[Overrides.ENEMY_ABILITY_OVERRIDE];
    }
    if (this.isFusion()) {
      if (this.fusionCustomPokemonData?.ability != null && this.fusionCustomPokemonData.ability !== -1) {
        return allAbilities[this.fusionCustomPokemonData.ability];
      }
      return allAbilities[this.getFusionSpeciesForm(ignoreOverride).getAbility(this.fusionAbilityIndex)];
    }
    if (this.customPokemonData.ability != null && this.customPokemonData.ability !== -1) {
      return allAbilities[this.customPokemonData.ability];
    }
    let abilityId = this.getSpeciesForm(ignoreOverride).getAbility(this.abilityIndex);
    if (abilityId === AbilityId.NONE) {
      abilityId = this.species.ability1;
    }
    return allAbilities[abilityId];
  }

  /**
   * Gets the passive ability of the pokemon. This should rarely be called, most of the time
   * {@linkcode hasAbility} or {@linkcode hasAbilityWithAttr} are better used as those check both the passive and
   * non-passive abilities and account for ability suppression.
   * @see {@linkcode hasAbility} {@linkcode hasAbilityWithAttr} Intended ways to check abilities in most cases
   * @returns The passive {@linkcode Ability} of the pokemon
   */
  public getPassiveAbility(): Ability {
    if (Overrides.PASSIVE_ABILITY_OVERRIDE && this.isPlayer()) {
      return allAbilities[Overrides.PASSIVE_ABILITY_OVERRIDE];
    }
    if (Overrides.ENEMY_PASSIVE_ABILITY_OVERRIDE && this.isEnemy()) {
      return allAbilities[Overrides.ENEMY_PASSIVE_ABILITY_OVERRIDE];
    }
    if (this.customPokemonData.passive != null && this.customPokemonData.passive !== -1) {
      return allAbilities[this.customPokemonData.passive];
    }

    return allAbilities[this.species.getPassiveAbility(this.formIndex)];
  }

  /**
   * Gets a list of all instances of a given ability attribute among abilities this pokemon has.
   * Accounts for all the various effects which can affect whether an ability will be present or
   * in effect, and both passive and non-passive.
   * @param attrType - {@linkcode AbAttr} The ability attribute to check for.
   * @param canApply - Whether to check if the ability is currently active; Default `true`
   * @param ignoreOverride - Whether to ignore ability changing effects; Default `false`
   * @returns An array of all the ability attributes on this ability.
   */
  public getAbilityAttrs<T extends AbAttrString>(attrType: T, canApply = true, ignoreOverride = false): AbAttrMap[T][] {
    const abilityAttrs: AbAttrMap[T][] = [];

    if (!canApply || this.canApplyAbility()) {
      abilityAttrs.push(...this.getAbility(ignoreOverride).getAttrs(attrType));
    }

    if (!canApply || this.canApplyAbility(true)) {
      abilityAttrs.push(...this.getPassiveAbility().getAttrs(attrType));
    }

    return abilityAttrs;
  }

  /**
   * Set this Pokémon's temporary ability, activating it if it normally activates on summon
   *
   * Also clears primal weather if it is from the ability being changed
   * @param ability - The temporary ability to set
   * @param passive - Whether to set the passive ability instead of the non-passive one; default `false`
   */
  public setTempAbility(ability: Ability, passive = false): void {
    applyOnLoseAbAttrs({ pokemon: this, passive });
    if (passive) {
      this.summonData.passiveAbility = ability.id;
    } else {
      this.summonData.ability = ability.id;
    }
    applyOnGainAbAttrs({ pokemon: this, passive });
  }

  /**
   * Suppresses an ability and calls its onlose attributes
   */
  public suppressAbility() {
    applyOnLoseAbAttrs({ pokemon: this, passive: true });
    applyOnLoseAbAttrs({ pokemon: this, passive: false });
    this.summonData.abilitySuppressed = true;
  }

  /**
   * Checks if a pokemon has a passive either from:
   *  - bought with starter candy
   *  - set by override
   *  - is a boss pokemon
   * @returns `true` if the Pokemon has a passive
   */
  public hasPassive(): boolean {
    // returns override if valid for current case
    if (
      (Overrides.HAS_PASSIVE_ABILITY_OVERRIDE === false && this.isPlayer())
      || (Overrides.ENEMY_HAS_PASSIVE_ABILITY_OVERRIDE === false && this.isEnemy())
    ) {
      return false;
    }
    if (
      ((Overrides.PASSIVE_ABILITY_OVERRIDE !== AbilityId.NONE || Overrides.HAS_PASSIVE_ABILITY_OVERRIDE)
        && this.isPlayer())
      || ((Overrides.ENEMY_PASSIVE_ABILITY_OVERRIDE !== AbilityId.NONE || Overrides.ENEMY_HAS_PASSIVE_ABILITY_OVERRIDE)
        && this.isEnemy())
    ) {
      return true;
    }

    // Classic Final boss and Endless Minor/Major bosses do not have passive
    const { currentBattle, gameMode } = globalScene;
    const waveIndex = currentBattle?.waveIndex;
    if (
      this.isEnemy()
      && (currentBattle?.battleSpec === BattleSpec.FINAL_BOSS
        || gameMode.isEndlessMinorBoss(waveIndex)
        || gameMode.isEndlessMajorBoss(waveIndex))
    ) {
      return false;
    }

    return this.passive || this.isBoss();
  }

  /**
   * Check whether this Pokémon can apply its current ability
   *
   * @remarks
   * This should rarely be
   * directly called, as {@linkcode hasAbility} and {@linkcode hasAbilityWithAttr} already call this.
   * @param passive - Whether to check the passive (`true`) or non-passive (`false`) ability; default `false`
   * @returns Whether the ability can be applied
   */
  public canApplyAbility(passive = false): boolean {
    if (passive && !this.hasPassive()) {
      return false;
    }
    const ability = passive ? this.getPassiveAbility() : this.getAbility();
    if (this.isFusion() && ability.hasAttr("NoFusionAbilityAbAttr")) {
      return false;
    }
    if (this.isTransformed() && ability.hasAttr("NoTransformAbilityAbAttr")) {
      return false;
    }
    const arena = globalScene?.arena;
    if (arena.ignoreAbilities && arena.ignoringEffectSource !== this.getBattlerIndex() && ability.ignorable) {
      return false;
    }
    if (this.summonData.abilitySuppressed && ability.suppressable) {
      return false;
    }
    const suppressAbilitiesTag = arena.getTag(ArenaTagType.NEUTRALIZING_GAS) as SuppressAbilitiesTag;
    const suppressOffField = ability.hasAttr("PreSummonAbAttr");
    if ((this.isOnField() || suppressOffField) && suppressAbilitiesTag && !suppressAbilitiesTag.beingRemoved) {
      const thisAbilitySuppressing = ability.hasAttr("PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr");
      const hasSuppressingAbility = this.hasAbilityWithAttr("PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr", false);
      // Neutralizing gas is up - suppress abilities unless they are unsuppressable or this pokemon is responsible for the gas
      // (Balance decided that the other ability of a neutralizing gas pokemon should not be neutralized)
      // If the ability itself is neutralizing gas, don't suppress it (handled through arena tag)
      const unsuppressable =
        !ability.suppressable
        || thisAbilitySuppressing
        || (hasSuppressingAbility && !suppressAbilitiesTag.shouldApplyToSelf());
      if (!unsuppressable) {
        return false;
      }
    }
    return (this.hp > 0 || ability.bypassFaint) && !ability.conditions.find(condition => !condition(this));
  }

  /**
   * Check whether a pokemon has the specified ability in effect, either as a normal or passive ability.
   * Accounts for all the various effects which can disable or modify abilities.
   * @param ability - The {@linkcode AbilityId | Ability} to check for
   * @param canApply - Whether to check if the ability is currently active; default `true`
   * @param ignoreOverride - Whether to ignore any overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `false`
   * @returns Whether this {@linkcode Pokemon} has the given ability
   */
  public hasAbility(ability: AbilityId, canApply = true, ignoreOverride = false): boolean {
    if (this.getAbility(ignoreOverride).id === ability && (!canApply || this.canApplyAbility())) {
      return true;
    }
    return this.getPassiveAbility().id === ability && this.hasPassive() && (!canApply || this.canApplyAbility(true));
  }

  /**
   * Check whether this pokemon has an ability with the specified attribute in effect, either as a normal or passive ability.
   * Accounts for all the various effects which can disable or modify abilities.
   * @param attrType - The {@linkcode AbAttr | attribute} to check for
   * @param canApply - Whether to check if the ability is currently active; default `true`
   * @param ignoreOverride - Whether to ignore any overrides caused by {@linkcode MoveId.TRANSFORM | Transform}; default `false`
   * @returns Whether this Pokemon has an ability with the given {@linkcode AbAttr}.
   */
  public hasAbilityWithAttr(attrType: AbAttrString, canApply = true, ignoreOverride = false): boolean {
    if ((!canApply || this.canApplyAbility()) && this.getAbility(ignoreOverride).hasAttr(attrType)) {
      return true;
    }
    return this.hasPassive() && (!canApply || this.canApplyAbility(true)) && this.getPassiveAbility().hasAttr(attrType);
  }

  /**
   * Return the ability priorities of the pokemon's ability and, if enabled, its passive ability
   * @returns A tuple containing the ability priorities of the pokemon
   */
  public getAbilityPriorities(): [number] | [activePriority: number, passivePriority: number] {
    const abilityPriority = this.getAbility().postSummonPriority;
    if (this.hasPassive()) {
      return [abilityPriority, this.getPassiveAbility().postSummonPriority];
    }
    return [abilityPriority];
  }

  /**
   * Gets the weight of the Pokemon with subtractive modifiers (Autotomize) happening first
   * and then multiplicative modifiers happening after (Heavy Metal and Light Metal)
   * @returns the kg of the Pokemon (minimum of 0.1)
   */
  public getWeight(): number {
    const autotomizedTag = this.getTag(AutotomizedTag);
    let weightRemoved = 0;
    if (autotomizedTag != null) {
      weightRemoved = 100 * autotomizedTag.autotomizeCount;
    }
    const minWeight = 0.1;
    const weight = new NumberHolder(this.species.weight - weightRemoved);

    // This will trigger the ability overlay so only call this function when necessary
    applyAbAttrs("WeightMultiplierAbAttr", { pokemon: this, weight });
    return Math.max(minWeight, weight.value);
  }

  /**
   * @returns the pokemon's current tera {@linkcode PokemonType}
   */
  getTeraType(): PokemonType {
    if (this.hasSpecies(SpeciesId.TERAPAGOS)) {
      return PokemonType.STELLAR;
    }
    if (this.hasSpecies(SpeciesId.OGERPON)) {
      const ogerponForm = this.species.speciesId === SpeciesId.OGERPON ? this.formIndex : this.fusionFormIndex;
      switch (ogerponForm) {
        case 0:
        case 4:
          return PokemonType.GRASS;
        case 1:
        case 5:
          return PokemonType.WATER;
        case 2:
        case 6:
          return PokemonType.FIRE;
        case 3:
        case 7:
          return PokemonType.ROCK;
      }
    }
    if (this.hasSpecies(SpeciesId.SHEDINJA)) {
      return PokemonType.BUG;
    }
    return this.teraType;
  }

  public isGrounded(): boolean {
    return (
      !!this.getTag(GroundedTag)
      || (!this.isOfType(PokemonType.FLYING, true, true)
        && !this.hasAbility(AbilityId.LEVITATE)
        && !this.getTag(BattlerTagType.FLOATING)
        && !this.getTag(SemiInvulnerableTag))
    );
  }

  /**
   * Determines whether this Pokemon is prevented from running or switching due
   * to effects from moves and/or abilities.
   * @param trappedAbMessages - If defined, ability trigger messages
   * (e.g. from Shadow Tag) are forwarded through this array.
   * @param simulated - If `true`, applies abilities via simulated calls.
   * @returns `true` if the pokemon is trapped
   */
  public isTrapped(trappedAbMessages: string[] = [], simulated = true): boolean {
    const commandedTag = this.getTag(BattlerTagType.COMMANDED);
    if (commandedTag?.getSourcePokemon()?.isActive(true)) {
      return true;
    }

    if (this.isOfType(PokemonType.GHOST)) {
      return false;
    }

    /** Holds whether the pokemon is trapped due to an ability */
    const trapped = new BooleanHolder(false);
    for (const opponent of inSpeedOrder(this.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER)) {
      if (opponent.switchOutStatus === false) {
        applyAbAttrs(
          "CheckTrappedAbAttr",
          { pokemon: opponent, trapped, opponent: this, simulated },
          trappedAbMessages,
        );
      }
    }

    const side = this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    return (
      trapped.value || !!this.getTag(TrappedTag) || !!globalScene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, side)
    );
  }

  /**
   * Calculates the type of a move when used by this Pokemon after
   * type-changing move and ability attributes have applied.
   * @param move - {@linkcode Move} The move being used.
   * @param simulated - If `true`, prevents showing abilities applied in this calculation.
   * @returns The {@linkcode PokemonType} of the move after attributes are applied
   */
  public getMoveType(move: Move, simulated = true): PokemonType {
    const moveTypeHolder = new NumberHolder(move.type);

    applyMoveAttrs("VariableMoveTypeAttr", this, null, move, moveTypeHolder);

    const power = new NumberHolder(move.power);
    applyAbAttrs("MoveTypeChangeAbAttr", {
      pokemon: this,
      move,
      simulated,
      moveType: moveTypeHolder,
      power,
      opponent: this,
    });

    // If the user is terastallized and the move is tera blast, or tera starstorm that is stellar type,
    // then bypass the check for ion deluge and electrify
    if (
      this.isTerastallized
      && (move.id === MoveId.TERA_BLAST
        || (move.id === MoveId.TERA_STARSTORM && moveTypeHolder.value === PokemonType.STELLAR))
    ) {
      return moveTypeHolder.value as PokemonType;
    }

    globalScene.arena.applyTags(ArenaTagType.ION_DELUGE, moveTypeHolder);
    if (this.getTag(BattlerTagType.ELECTRIFIED)) {
      moveTypeHolder.value = PokemonType.ELECTRIC;
    }

    return moveTypeHolder.value as PokemonType;
  }

  /**
   * Calculate the effectiveness of the move against this Pokémon, including
   * modifiers from move and ability attributes
   * @param source - The attacking Pokémon.
   * @param move - The move being used by the attacking Pokémon.
   * @param ignoreAbility - Whether to ignore abilities that might affect type effectiveness or immunity; default `false`
   * @param simulated - (Default `true`) Whether to apply abilities via simulated calls. \
   *   ⚠️ Should only ever be false during `MoveEffectPhase`
   * @param cancelled - Stores whether the move was cancelled by a non-type-based immunity.
   * @param useIllusion - Whether to consider an active illusion
   * @returns The type damage multiplier, indicating the effectiveness of the move
   */
  getMoveEffectiveness(
    source: Pokemon,
    move: Move,
    ignoreAbility = false,
    simulated = true,
    cancelled?: BooleanHolder,
    useIllusion = false,
  ): TypeDamageMultiplier {
    if (this.turnData?.moveEffectiveness != null) {
      return this.turnData?.moveEffectiveness;
    }

    if (move.hasAttr("TypelessAttr")) {
      return 1;
    }
    const moveType = source.getMoveType(move);

    const typeMultiplier = new NumberHolder(
      move.category !== MoveCategory.STATUS || move.hasAttr("RespectAttackTypeImmunityAttr")
        ? this.getAttackTypeEffectiveness(moveType, source, false, simulated, move, useIllusion)
        : 1,
    );

    applyMoveAttrs("VariableMoveTypeMultiplierAttr", source, this, move, typeMultiplier);
    if (this.getTypes(true, true).find(t => move.isTypeImmune(source, this, t))) {
      typeMultiplier.value = 0;
    }

    if (this.getTag(TarShotTag) && this.getMoveType(move) === PokemonType.FIRE) {
      typeMultiplier.value *= 2;
    }

    const cancelledHolder = cancelled ?? new BooleanHolder(false);
    // TypeMultiplierAbAttrParams is shared amongst the type of AbAttrs we will be invoking
    const commonAbAttrParams: TypeMultiplierAbAttrParams = {
      pokemon: this,
      opponent: source,
      move,
      cancelled: cancelledHolder,
      simulated,
      typeMultiplier,
    };
    if (!ignoreAbility) {
      applyAbAttrs("TypeImmunityAbAttr", commonAbAttrParams);

      if (!cancelledHolder.value) {
        applyAbAttrs("MoveImmunityAbAttr", commonAbAttrParams);
      }

      // Do not check queenly majesty unless this is being simulated
      // This is because the move effect phase should not check queenly majesty, as that is handled by the move phase
      if (simulated && !cancelledHolder.value) {
        for (const p of this.getAlliesGenerator()) {
          applyAbAttrs("FieldPriorityMoveImmunityAbAttr", {
            pokemon: p,
            opponent: source,
            move,
            cancelled: cancelledHolder,
            simulated,
          });
        }
      }
    }

    const immuneTags = this.findTags(tag => tag instanceof TypeImmuneTag && tag.immuneType === moveType);
    for (const tag of immuneTags) {
      if (move && !move.getAttrs("HitsTagAttr").some(attr => attr.tagType === tag.tagType)) {
        typeMultiplier.value = 0;
        break;
      }
    }

    // Apply Tera Shell's effect to attacks after all immunities are accounted for
    if (!ignoreAbility && move.category !== MoveCategory.STATUS) {
      applyAbAttrs("FullHpResistTypeAbAttr", commonAbAttrParams);
    }

    if (move.category === MoveCategory.STATUS && move.hitsSubstitute(source, this)) {
      typeMultiplier.value = 0;
    }

    return (cancelledHolder.value ? 0 : typeMultiplier.value) as TypeDamageMultiplier;
  }

  /**
   * Calculates the move's type effectiveness multiplier based on the target's type/s.
   * @param moveType {@linkcode PokemonType} the type of the move being used
   * @param source {@linkcode Pokemon} the Pokemon using the move
   * @param ignoreStrongWinds whether or not this ignores strong winds (anticipation, forewarn, stealth rocks)
   * @param simulated tag to only apply the strong winds effect message when the move is used
   * @param move (optional) the move whose type effectiveness is to be checked. Used for applying {@linkcode VariableMoveTypeChartAttr}
   * @param useIllusion - Whether we want the attack type effectiveness on the illusion or not
   * @returns a multiplier for the type effectiveness
   */
  getAttackTypeEffectiveness(
    moveType: PokemonType,
    source?: Pokemon,
    ignoreStrongWinds = false,
    simulated = true,
    move?: Move,
    useIllusion = false,
  ): TypeDamageMultiplier {
    if (moveType === PokemonType.STELLAR) {
      return this.isTerastallized ? 2 : 1;
    }
    const types = this.getTypes(true, true, undefined, useIllusion);
    const arena = globalScene.arena;

    // Handle flying v ground type immunity without removing flying type so effective types are still effective
    // Related to https://github.com/pagefaultgames/pokerogue/issues/524
    if (moveType === PokemonType.GROUND && (this.isGrounded() || arena.hasTag(ArenaTagType.GRAVITY))) {
      const flyingIndex = types.indexOf(PokemonType.FLYING);
      if (flyingIndex > -1) {
        types.splice(flyingIndex, 1);
      }
    }

    let multiplier = types
      .map(defenderType => {
        const multiplier = new NumberHolder(getTypeDamageMultiplier(moveType, defenderType));
        applyChallenges(ChallengeType.TYPE_EFFECTIVENESS, multiplier);
        if (move) {
          applyMoveAttrs("VariableMoveTypeChartAttr", null, this, move, multiplier, defenderType);
        }
        if (source) {
          const ignoreImmunity = new BooleanHolder(false);
          if (source.isActive(true) && source.hasAbilityWithAttr("IgnoreTypeImmunityAbAttr")) {
            applyAbAttrs("IgnoreTypeImmunityAbAttr", {
              pokemon: source,
              cancelled: ignoreImmunity,
              simulated,
              moveType,
              defenderType,
            });
          }
          if (ignoreImmunity.value && multiplier.value === 0) {
            return 1;
          }

          const exposedTags = this.findTags(tag => tag instanceof ExposedTag) as ExposedTag[];
          if (exposedTags.some(t => t.ignoreImmunity(defenderType, moveType)) && multiplier.value === 0) {
            return 1;
          }
        }
        return multiplier.value;
      })
      .reduce((acc, cur) => acc * cur, 1) as TypeDamageMultiplier;

    const typeMultiplierAgainstFlying = new NumberHolder(getTypeDamageMultiplier(moveType, PokemonType.FLYING));
    applyChallenges(ChallengeType.TYPE_EFFECTIVENESS, typeMultiplierAgainstFlying);
    // Handle strong winds lowering effectiveness of types super effective against pure flying
    if (
      !ignoreStrongWinds
      && arena.weather?.weatherType === WeatherType.STRONG_WINDS
      && !arena.weather.isEffectSuppressed()
      && this.isOfType(PokemonType.FLYING)
      && typeMultiplierAgainstFlying.value === 2
    ) {
      multiplier /= 2;
      if (!simulated) {
        globalScene.phaseManager.queueMessage(i18next.t("weather:strongWindsEffectMessage"));
      }
    }
    return multiplier as TypeDamageMultiplier;
  }

  /**
   * Compute the given Pokémon's matchup score against this Pokémon
   * @remarks
   * In most cases, this score ranges from near-zero to 16, but the maximum possible matchup score is 64.
   * @param opponent - The Pokemon to compare this Pokémon against
   * @returns A score value based on how favorable this Pokémon is when fighting the given Pokémon
   */
  getMatchupScore(opponent: Pokemon): number {
    const enemyTypes = opponent.getTypes(true, false, false, true);
    /** Is this Pokemon faster than the opponent? */
    const outspeed =
      (this.isActive(true) ? this.getEffectiveStat(Stat.SPD, opponent) : this.getStat(Stat.SPD, false))
      >= opponent.getEffectiveStat(Stat.SPD, this);

    /**
     * Based on how effectively this Pokemon defends against the opponent's types.
     * This score cannot be higher than 4.
     */
    let defScore = 1 / Math.max(this.getAttackTypeEffectiveness(enemyTypes[0], opponent), 0.25);
    if (enemyTypes.length > 1) {
      defScore *=
        1 / Math.max(this.getAttackTypeEffectiveness(enemyTypes[1], opponent, false, false, undefined, true), 0.25);
    }

    const moveset = this.moveset;
    let moveAtkScoreLength = 0;
    let atkScore = 0;
    // TODO: this calculation needs to consider more factors; it's currently very simplistic
    for (const move of moveset) {
      const resolvedMove = move.getMove();
      // NOTE: Counter and Mirror Coat are considered as attack moves here
      if (resolvedMove.category === MoveCategory.STATUS || move.getPpRatio() <= 0) {
        continue;
      }
      const moveType = resolvedMove.type;
      let thisScore = opponent.getAttackTypeEffectiveness(moveType, this, false, true, undefined, true);

      // Add STAB multiplier for attack type effectiveness.
      // For now, simply don't apply STAB to moves that may change type
      if (this.getTypes(true).includes(moveType) && !move.getMove().hasAttr("VariableMoveTypeAttr")) {
        thisScore *= 1.5;
      }

      atkScore += thisScore;
      moveAtkScoreLength++;
    }
    // Get average attack score of all damaging moves (|| 1 prevents division by zero))
    // TODO: Averaging the attack score is excessively simplistic, and doesn't reflect the AI's move selection logic
    // e.g. if the mon has one 4x effective move and three 0.5x effective moves, this score would be ~1.375
    // which does not seem fair, given that if the AI were to switch, in all likelihood it would use the 4x move.
    // We could consider a weighted average...
    atkScore /= moveAtkScoreLength || 1;
    /**
     * Based on this Pokemon's HP ratio compared to that of the opponent.
     * This ratio is multiplied by 1.5 if this Pokemon outspeeds the opponent;
     * however, the final ratio cannot be higher than 1.
     */
    const hpRatio = this.getHpRatio();
    const oppHpRatio = opponent.getHpRatio();
    // TODO: use better logic for predicting whether the pokemon "is dying"
    // E.g., perhaps check if it would faint if the opponent were to use the same move it just used
    // (twice if the user is slower)
    const isDying = hpRatio <= 0.2;
    let hpDiffRatio = hpRatio + (1 - oppHpRatio);
    if (isDying && this.isActive(true)) {
      //It might be a sacrifice candidate if hp under 20%
      const badMatchup = atkScore < 1.5 && defScore < 1.5;
      if (!outspeed && badMatchup) {
        //It might not be a worthy sacrifice if it doesn't outspeed or doesn't do enough damage
        hpDiffRatio *= 0.85;
      } else {
        hpDiffRatio = 1 - hpRatio + (outspeed ? 0.2 : 0.1);
      }
    } else if (outspeed) {
      hpDiffRatio *= 1.25;
    } else if (hpRatio > 0.2 && hpRatio <= 0.4) {
      // Might be considered to be switched because it's not in low enough health
      hpDiffRatio *= 0.5;
    }
    return (atkScore + defScore) * Math.min(hpDiffRatio, 1);
  }

  /**
   * Get the first evolution this Pokémon meets the conditions to evolve into
   * @remarks
   * Fusion evolutions are also considered.
   * @returns The evolution this pokemon can currently evolve into, or `null` if it cannot evolve
   */
  getEvolution(): SpeciesFormEvolution | null {
    if (pokemonEvolutions.hasOwnProperty(this.species.speciesId)) {
      const evolutions = pokemonEvolutions[this.species.speciesId];
      for (const e of evolutions) {
        if (e.validate(this)) {
          return e;
        }
      }
    }

    if (this.isFusion() && this.fusionSpecies && pokemonEvolutions.hasOwnProperty(this.fusionSpecies.speciesId)) {
      const fusionEvolutions = pokemonEvolutions[this.fusionSpecies.speciesId].map(
        e => new FusionSpeciesFormEvolution(this.species.speciesId, e),
      );
      for (const fe of fusionEvolutions) {
        if (fe.validate(this, true)) {
          return fe;
        }
      }
    }

    return null;
  }

  /**
   * Get all level up moves in a given range for a particular pokemon.
   * @param startingLevel - Don't include moves below this level
   * @param includeEvolutionMoves - Whether to include evolution moves
   * @param simulateEvolutionChain - Whether to include moves from prior evolutions
   * @param includeRelearnerMoves - Whether to include moves that would require a relearner. Note the move relearner inherently allows evolution moves
   * @returns A list of moves and the levels they can be learned at
   */
  getLevelMoves(
    startingLevel?: number,
    includeEvolutionMoves = false,
    simulateEvolutionChain = false,
    includeRelearnerMoves = false,
    learnSituation: LearnMoveSituation = LearnMoveSituation.MISC,
  ): LevelMoves {
    const ret: LevelMoves = [];
    let levelMoves: LevelMoves = [];
    if (!startingLevel) {
      startingLevel = this.level;
    }
    if (learnSituation === LearnMoveSituation.EVOLUTION_FUSED && this.fusionSpecies) {
      // For fusion evolutions, get ONLY the moves of the component mon that evolved
      levelMoves = this.getFusionSpeciesForm(true)
        .getLevelMoves()
        .filter(
          lm =>
            (includeEvolutionMoves && lm[0] === EVOLVE_MOVE)
            || (includeRelearnerMoves && lm[0] === RELEARN_MOVE)
            || lm[0] > 0,
        );
    } else {
      if (simulateEvolutionChain) {
        const evolutionChain = this.species.getSimulatedEvolutionChain(
          this.level,
          this.hasTrainer(),
          this.isBoss(),
          this.isPlayer(),
        );
        for (let e = 0; e < evolutionChain.length; e++) {
          // TODO: Might need to pass specific form index in simulated evolution chain
          const speciesLevelMoves = getPokemonSpeciesForm(evolutionChain[e][0], this.formIndex).getLevelMoves();
          if (includeRelearnerMoves) {
            levelMoves.push(...speciesLevelMoves);
          } else {
            levelMoves.push(
              ...speciesLevelMoves.filter(
                lm =>
                  (includeEvolutionMoves && lm[0] === EVOLVE_MOVE)
                  || ((!e || lm[0] > 1) && (e === evolutionChain.length - 1 || lm[0] <= evolutionChain[e + 1][1])),
              ),
            );
          }
        }
      } else {
        levelMoves = this.getSpeciesForm(true)
          .getLevelMoves()
          .filter(
            lm =>
              (includeEvolutionMoves && lm[0] === EVOLVE_MOVE)
              || (includeRelearnerMoves && lm[0] === RELEARN_MOVE)
              || lm[0] > 0,
          );
      }
      if (this.fusionSpecies && learnSituation !== LearnMoveSituation.EVOLUTION_FUSED_BASE) {
        // For fusion evolutions, get ONLY the moves of the component mon that evolved
        if (simulateEvolutionChain) {
          const fusionEvolutionChain = this.fusionSpecies.getSimulatedEvolutionChain(
            this.level,
            this.hasTrainer(),
            this.isBoss(),
            this.isPlayer(),
          );
          for (let e = 0; e < fusionEvolutionChain.length; e++) {
            // TODO: Might need to pass specific form index in simulated evolution chain
            const speciesLevelMoves = getPokemonSpeciesForm(
              fusionEvolutionChain[e][0],
              this.fusionFormIndex,
            ).getLevelMoves();
            if (includeRelearnerMoves) {
              levelMoves.push(
                ...speciesLevelMoves.filter(
                  lm => (includeEvolutionMoves && lm[0] === EVOLVE_MOVE) || lm[0] !== EVOLVE_MOVE,
                ),
              );
            } else {
              levelMoves.push(
                ...speciesLevelMoves.filter(
                  lm =>
                    (includeEvolutionMoves && lm[0] === EVOLVE_MOVE)
                    || ((!e || lm[0] > 1)
                      && (e === fusionEvolutionChain.length - 1 || lm[0] <= fusionEvolutionChain[e + 1][1])),
                ),
              );
            }
          }
        } else {
          levelMoves.push(
            ...this.getFusionSpeciesForm(true)
              .getLevelMoves()
              .filter(
                lm =>
                  (includeEvolutionMoves && lm[0] === EVOLVE_MOVE)
                  || (includeRelearnerMoves && lm[0] === RELEARN_MOVE)
                  || lm[0] > 0,
              ),
          );
        }
      }
    }
    levelMoves.sort((lma: [number, number], lmb: [number, number]) => (lma[0] > lmb[0] ? 1 : lma[0] < lmb[0] ? -1 : 0));

    /**
     * Filter out moves not within the correct level range(s)
     * Includes moves below startingLevel, or of specifically level 0 if
     * includeRelearnerMoves or includeEvolutionMoves are true respectively
     */
    levelMoves = levelMoves.filter(lm => {
      const level = lm[0];
      const isRelearner = level < startingLevel;
      const allowedEvolutionMove = level === 0 && includeEvolutionMoves;

      return !(level > this.level) && (includeRelearnerMoves || !isRelearner || allowedEvolutionMove);
    });

    /**
     * This must be done AFTER filtering by level, else if the same move shows up
     * in levelMoves multiple times all but the lowest level one will be skipped.
     * This causes problems when there are intentional duplicates (i.e. Smeargle with Sketch)
     */
    if (levelMoves) {
      Pokemon.getUniqueMoves(levelMoves, ret);
    }

    return ret;
  }

  /**
   * Helper function for getLevelMoves
   *
   * @remarks
   * Finds all non-duplicate items from the input, and pushes them into the output.
   * Two items count as duplicate if they have the same Move, regardless of level.
   *
   * @param levelMoves - The input array to search for non-duplicates from
   * @param ret - The output array to be pushed into.
   */
  private static getUniqueMoves(levelMoves: LevelMoves, ret: LevelMoves): void {
    const uniqueMoves: MoveId[] = [];
    for (const lm of levelMoves) {
      if (!uniqueMoves.find(m => m === lm[1])) {
        uniqueMoves.push(lm[1]);
        ret.push(lm);
      }
    }
  }

  /**
   * Get a list of all egg moves
   * @returns list of egg moves
   */
  getEggMoves(): MoveId[] | undefined {
    return speciesEggMoves[this.getSpeciesForm().getRootSpeciesId()];
  }

  /**
   * Create a new {@linkcode PokemonMove} and set it to the specified move index in this Pokémon's moveset.
   * @param moveIndex - The index of the move to set
   * @param moveId - The ID of the move to set
   */
  setMove(moveIndex: number, moveId: MoveId): void {
    if (moveId === MoveId.NONE) {
      return;
    }
    const move = new PokemonMove(moveId);
    this.moveset[moveIndex] = move;
    if (this.summonData.moveset) {
      this.summonData.moveset[moveIndex] = move;
    }
  }

  /**
   * Attempt to set the Pokémon's shininess based on the trainer's trainer ID and secret ID.
   * Endless Pokemon in the end biome are unable to be set to shiny
   *
   * @remarks
   *
   * The exact mechanic is that it calculates E as the XOR of the player's trainer ID and secret ID.
   * F is calculated as the XOR of the first 16 bits of the Pokemon's ID with the last 16 bits.
   * The XOR of E and F are then compared to the {@linkcode shinyThreshold} (or {@linkcode thresholdOverride} if set) to see whether or not to generate a shiny.
   * The base shiny odds are {@linkcode BASE_SHINY_CHANCE} / 65536
   * @param thresholdOverride - number that is divided by 2^16 (65536) to get the shiny chance, overrides {@linkcode shinyThreshold} if set (bypassing shiny rate modifiers such as Shiny Charm)
   * @returns true if the Pokemon has been set as a shiny, false otherwise
   */
  trySetShiny(thresholdOverride?: number): boolean {
    // Shiny Pokemon should not spawn in the end biome in endless
    if (globalScene.gameMode.isEndless && globalScene.arena.biomeType === BiomeId.END) {
      return false;
    }

    const rand1 = (this.id & 0xffff0000) >>> 16;
    const rand2 = this.id & 0x0000ffff;

    const E = globalScene.gameData.trainerId ^ globalScene.gameData.secretId;
    const F = rand1 ^ rand2;

    const shinyThreshold = new NumberHolder(BASE_SHINY_CHANCE);
    if (thresholdOverride === undefined) {
      if (timedEventManager.isEventActive()) {
        const tchance = timedEventManager.getClassicTrainerShinyChance();
        if (this.isEnemy() && this.hasTrainer() && tchance > 0) {
          shinyThreshold.value = Math.max(tchance, shinyThreshold.value); // Choose the higher boost
        } else {
          // Wild shiny event multiplier
          shinyThreshold.value *= timedEventManager.getShinyEncounterMultiplier();
        }
      }
      if (this.isPlayer() || !this.hasTrainer()) {
        // Apply shiny modifiers only to Player or wild mons
        globalScene.applyModifiers(ShinyRateBoosterModifier, true, shinyThreshold);
      }
    } else {
      shinyThreshold.value = thresholdOverride;
    }

    this.shiny = (E ^ F) < shinyThreshold.value;

    if (this.shiny) {
      this.initShinySparkle();
    }

    return this.shiny;
  }

  /**
   * Tries to set a Pokémon's shininess based on seed
   *
   * @remarks
   * For manual use only, usually to roll a Pokemon's shiny chance a second time.
   * If it rolls shiny, or if it's already shiny, also sets a random variant and give the Pokemon the associated luck.
   *
   * The base shiny odds are {@linkcode BASE_SHINY_CHANCE} / `65536`
   * @param thresholdOverride number that is divided by `2^16` (`65536`) to get the shiny chance, overrides {@linkcode shinyThreshold} if set (bypassing shiny rate modifiers such as Shiny Charm)
   * @param applyModifiersToOverride If {@linkcode thresholdOverride} is set and this is true, will apply Shiny Charm and event modifiers to {@linkcode thresholdOverride}
   * @param maxThreshold The maximum threshold allowed after applying modifiers
   * @returns Whether this Pokémon was set to shiny
   */
  public trySetShinySeed(
    thresholdOverride?: number,
    applyModifiersToOverride?: boolean,
    maxThreshold?: number,
  ): boolean {
    if (!this.shiny) {
      const shinyThreshold = new NumberHolder(thresholdOverride ?? BASE_SHINY_CHANCE);
      if (applyModifiersToOverride) {
        if (timedEventManager.isEventActive()) {
          shinyThreshold.value *= timedEventManager.getShinyEncounterMultiplier();
        }
        globalScene.applyModifiers(ShinyRateBoosterModifier, true, shinyThreshold);
      }

      if (maxThreshold && maxThreshold > 0) {
        shinyThreshold.value = Math.min(maxThreshold, shinyThreshold.value);
      }

      this.shiny = randSeedInt(65536) < shinyThreshold.value;
    }

    if (this.shiny) {
      this.variant = this.variant ?? 0;
      this.variant = Math.max(this.generateShinyVariant(), this.variant) as Variant; // Don't set a variant lower than the current one
      this.luck = this.variant + 1 + (this.fusionShiny ? this.fusionVariant + 1 : 0);
      this.initShinySparkle();
    }

    return this.shiny;
  }

  /**
   * Randomly generate a shiny variant
   *
   * @remarks
   * Variants are returned with the following probabilities:
   *
   * | Variant | Description    | Probability |
   * |---------|----------------|-------------|
   * | 0       | Basic shiny    | 60%         |
   * | 1       | Rare variant   | 30%         |
   * | 2       | Epic variant   | 10%         |
   *
   * @returns The randomly chosen shiny variant
   */
  protected generateShinyVariant(): Variant {
    const formIndex: number = this.formIndex;
    let variantDataIndex: string | number = this.species.speciesId;
    if (this.species.forms.length > 0) {
      const formKey = this.species.forms[formIndex]?.formKey;
      if (formKey) {
        variantDataIndex = `${variantDataIndex}-${formKey}`;
      }
    }
    // Checks if there is no variant data for both the index or index with form
    if (
      !this.shiny
      || (!variantData.hasOwnProperty(variantDataIndex) && !variantData.hasOwnProperty(this.species.speciesId))
    ) {
      return 0;
    }
    const rand = new NumberHolder(0);
    globalScene.executeWithSeedOffset(
      () => {
        rand.value = randSeedInt(10);
      },
      this.id,
      globalScene.waveSeed,
    );
    if (rand.value >= SHINY_VARIANT_CHANCE) {
      return 0; // 6/10
    }
    if (rand.value >= SHINY_EPIC_CHANCE) {
      return 1; // 3/10
    }
    return 2; // 1/10
  }

  /**
   * Function that tries to set this Pokemon to have its hidden ability based on seed, if it exists.
   *
   * @remarks
   * For manual use only, usually to roll a Pokemon's hidden ability chance a second time.
   *
   * The base hidden ability odds are {@linkcode BASE_HIDDEN_ABILITY_CHANCE} / `65536`
   * @param thresholdOverride - number that is divided by `2^16` (`65536`) to get the HA chance, overrides {@linkcode haThreshold} if set (bypassing HA rate modifiers such as Ability Charm)
   * @param applyModifiersToOverride - If {@linkcode thresholdOverride} is set and this is true, will apply Ability Charm to {@linkcode thresholdOverride}
   * @returns `true` if the Pokemon has been set to have its hidden ability, `false` otherwise
   */
  public tryRerollHiddenAbilitySeed(thresholdOverride?: number, applyModifiersToOverride?: boolean): boolean {
    if (!this.species.abilityHidden) {
      return false;
    }
    const haThreshold = new NumberHolder(thresholdOverride ?? BASE_HIDDEN_ABILITY_CHANCE);
    if (applyModifiersToOverride && !this.hasTrainer()) {
      globalScene.applyModifiers(HiddenAbilityRateBoosterModifier, true, haThreshold);
    }

    if (randSeedInt(65536) < haThreshold.value) {
      this.abilityIndex = 2;
    }

    return this.abilityIndex === 2;
  }

  /**
   * Generate a fusion species and add it to this Pokémon
   * @param forStarter - Whether this fusion is being generated for a starter Pokémon; default `false`
   */
  public generateFusionSpecies(forStarter?: boolean): void {
    const hiddenAbilityChance = new NumberHolder(BASE_HIDDEN_ABILITY_CHANCE);
    if (!this.hasTrainer()) {
      globalScene.applyModifiers(HiddenAbilityRateBoosterModifier, true, hiddenAbilityChance);
    }

    const hasHiddenAbility = !randSeedInt(hiddenAbilityChance.value);
    const randAbilityIndex = randSeedInt(2);

    const filter = !forStarter
      ? this.species.getCompatibleFusionSpeciesFilter()
      : (species: PokemonSpecies) => {
          return (
            pokemonEvolutions.hasOwnProperty(species.speciesId)
            && !pokemonPrevolutions.hasOwnProperty(species.speciesId)
            && !species.subLegendary
            && !species.legendary
            && !species.mythical
            && !species.isTrainerForbidden()
            && species.speciesId !== this.species.speciesId
            && species.speciesId !== SpeciesId.DITTO
          );
        };

    let fusionOverride: PokemonSpecies | undefined;

    if (forStarter && this.isPlayer() && Overrides.STARTER_FUSION_SPECIES_OVERRIDE) {
      fusionOverride = getPokemonSpecies(Overrides.STARTER_FUSION_SPECIES_OVERRIDE);
    } else if (this.isEnemy() && Overrides.ENEMY_FUSION_SPECIES_OVERRIDE) {
      fusionOverride = getPokemonSpecies(Overrides.ENEMY_FUSION_SPECIES_OVERRIDE);
    }

    this.fusionSpecies =
      fusionOverride
      ?? globalScene.randomSpecies(globalScene.currentBattle?.waveIndex || 0, this.level, false, filter, true);
    this.fusionAbilityIndex =
      this.fusionSpecies.abilityHidden && hasHiddenAbility
        ? 2
        : this.fusionSpecies.ability2 !== this.fusionSpecies.ability1
          ? randAbilityIndex
          : 0;
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

    this.fusionFormIndex = globalScene.getSpeciesFormIndex(
      this.fusionSpecies,
      this.fusionGender,
      this.getNature(),
      true,
    );
    this.fusionLuck = this.luck;

    this.generateName();
  }

  /** Remove the fusion species from this Pokémon */
  public clearFusionSpecies(): void {
    this.fusionSpecies = null;
    this.fusionFormIndex = 0;
    this.fusionAbilityIndex = 0;
    this.fusionShiny = false;
    this.fusionVariant = 0;
    this.fusionGender = 0;
    this.fusionLuck = 0;
    this.fusionCustomPokemonData = null;

    this.generateName();
    this.calculateStats();
  }

  /** Generate a semi-random moveset for this Pokémon */
  public generateAndPopulateMoveset(): void {
    generateMoveset(this);

    // Trigger FormChange, except for enemy Pokemon during Mystery Encounters, to avoid crashes
    if (
      this.isPlayer()
      || !globalScene.currentBattle?.isBattleMysteryEncounter()
      || !globalScene.currentBattle?.mysteryEncounter
    ) {
      globalScene.triggerPokemonFormChange(this, SpeciesFormChangeMoveLearnedTrigger);
    }
  }

  /**
   * Attempt to select the move at the move index.
   * @param moveIndex - The index of the move to select
   * @param ignorePp - Whether to ignore PP when checking if the move is usable (defaults to false)
   * @returns A tuple containing a boolean indicating if the move can be selected, and a string with the reason if it cannot be selected
   */
  public trySelectMove(moveIndex: number, ignorePp?: boolean): [isUsable: boolean, failureMessage: string] {
    const move = this.getMoveset().length > moveIndex ? this.getMoveset()[moveIndex] : null;
    return move?.isUsable(this, ignorePp, true) ?? [false, ""];
  }

  /** Show this Pokémon's info panel */
  showInfo(): void {
    if (!this.battleInfo.visible) {
      const otherBattleInfo = globalScene.fieldUI
        .getAll()
        .slice(0, 4)
        .find(ui => ui instanceof BattleInfo && (ui as BattleInfo) instanceof PlayerBattleInfo === this.isPlayer());
      if (!otherBattleInfo || !this.getFieldIndex()) {
        globalScene.fieldUI.sendToBack(this.battleInfo);
        globalScene.sendTextToBack(); // Push the top right text objects behind everything else
      } else {
        globalScene.fieldUI.moveAbove(this.battleInfo, otherBattleInfo);
      }
      this.battleInfo.setX(this.battleInfo.x + (this.isPlayer() ? 150 : !this.isBoss() ? -150 : -198));
      this.battleInfo.setVisible(true);
      if (this.isPlayer()) {
        // TODO: How do you get this to not require a private property access?
        this["battleInfo"].expMaskRect.x += 150;
      }
      globalScene.tweens.add({
        targets: [this.battleInfo, this.battleInfo.expMaskRect],
        x: this.isPlayer() ? "-=150" : `+=${!this.isBoss() ? 150 : 246}`,
        duration: 1000,
        ease: "Cubic.easeOut",
      });
    }
  }

  /** Hide this Pokémon's info panel */
  async hideInfo(): Promise<void> {
    return new Promise(resolve => {
      if (this.battleInfo?.visible) {
        globalScene.tweens.add({
          targets: [this.battleInfo, this.battleInfo.expMaskRect],
          x: this.isPlayer() ? "+=150" : `-=${!this.isBoss() ? 150 : 246}`,
          duration: 500,
          ease: "Cubic.easeIn",
          onComplete: () => {
            if (this.isPlayer()) {
              // TODO: How do you get this to not require a private property access?
              this["battleInfo"].expMaskRect.x -= 150;
            }
            this.battleInfo.setVisible(false);
            this.battleInfo.setX(this.battleInfo.x - (this.isPlayer() ? 150 : !this.isBoss() ? -150 : -198));
            resolve();
          },
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

  /**
   * Adds experience to this PlayerPokemon, subject to wave based level caps.
   * @param exp - The amount of experience to add
   * @param ignoreLevelCap - Whether to ignore level caps when adding experience; default `false`
   */
  addExp(exp: number, ignoreLevelCap = false) {
    const maxExpLevel = globalScene.getMaxExpLevel(ignoreLevelCap);
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

  /**
   * Check whether the specified Pokémon is an opponent
   * @param target - The {@linkcode Pokemon} to compare against
   * @returns `true` if the two pokemon are opponents, `false` otherwise
   */
  public isOpponent(target: Pokemon): boolean {
    return this.isPlayer() !== target.isPlayer();
  }

  getOpponent(targetIndex: number): Pokemon | null {
    const ret = this.getOpponents()[targetIndex];
    // TODO: why does this check for summonData and can we remove it?
    if (ret.summonData) {
      return ret;
    }
    return null;
  }

  /**
   * Returns the pokemon that oppose this one and are active in non-speed order
   *
   * @param onField - whether to also check if the pokemon is currently on the field (defaults to true)
   */
  getOpponents(onField = true): Pokemon[] {
    return (this.isPlayer() ? globalScene.getEnemyField() : globalScene.getPlayerField()).filter(p =>
      p.isActive(onField),
    );
  }

  /**
   * @returns A generator of pokemon that oppose this one in speed order
   */
  public getOpponentsGenerator(): Generator<Pokemon, number> {
    return inSpeedOrder(this.isPlayer() ? ArenaTagSide.ENEMY : ArenaTagSide.PLAYER);
  }

  getOpponentDescriptor(): string {
    return this.isPlayer() ? i18next.t("arenaTag:opposingTeam") : i18next.t("arenaTag:yourTeam");
  }

  getAlly(): Pokemon | undefined {
    return (this.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField())[this.getFieldIndex() ? 0 : 1];
  }

  /**
   * @returns A generator of Pokémon on the allied field in speed order.
   */
  getAlliesGenerator(): Generator<Pokemon, number> {
    return inSpeedOrder(this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY);
  }

  /**
   * Calculate the stat stage multiplier of the user against an opponent
   *
   * @remarks
   * This does not apply to evasion or accuracy
   * @see {@linkcode getAccuracyMultiplier}
   * @param stat - The {@linkcode EffectiveStat} to calculate
   * @param opponent - The {@linkcode Pokemon} being targeted
   * @param move - The {@linkcode Move} being used
   * @param ignoreOppAbility - determines whether the effects of the opponent's abilities (i.e. Unaware) should be ignored; default `false`
   * @param isCritical - determines whether a critical hit has occurred or not; default `false`
   * @param simulated - determines whether effects are applied without altering game state; default `true`
   * @param ignoreHeldItems - determines whether this Pokemon's held items should be ignored during the stat calculation; default `false`
   * @returns the stat stage multiplier to be used for effective stat calculation
   */
  getStatStageMultiplier(
    stat: EffectiveStat,
    opponent?: Pokemon,
    move?: Move,
    ignoreOppAbility = false,
    isCritical = false,
    simulated = true,
    ignoreHeldItems = false,
  ): number {
    const statStage = new NumberHolder(this.getStatStage(stat));
    const ignoreStatStage = new BooleanHolder(false);

    if (opponent) {
      if (isCritical) {
        switch (stat) {
          case Stat.ATK:
          case Stat.SPATK:
            statStage.value = Math.max(statStage.value, 0);
            break;
          case Stat.DEF:
          case Stat.SPDEF:
            statStage.value = Math.min(statStage.value, 0);
            break;
        }
      }
      if (!ignoreOppAbility) {
        applyAbAttrs("IgnoreOpponentStatStagesAbAttr", {
          pokemon: opponent,
          ignored: ignoreStatStage,
          stat,
          simulated,
        });
      }
      if (move) {
        applyMoveAttrs("IgnoreOpponentStatStagesAttr", this, opponent, move, ignoreStatStage);
      }
    }

    if (!ignoreStatStage.value) {
      const statStageMultiplier = new NumberHolder(Math.max(2, 2 + statStage.value) / Math.max(2, 2 - statStage.value));
      if (!ignoreHeldItems) {
        globalScene.applyModifiers(TempStatStageBoosterModifier, this.isPlayer(), stat, statStageMultiplier);
      }
      return Math.min(statStageMultiplier.value, 4);
    }
    return 1;
  }

  /**
   * Calculates the accuracy multiplier of the user against a target.
   *
   * This method considers various factors such as the user's accuracy level, the target's evasion level,
   * abilities, and modifiers to compute the final accuracy multiplier.
   *
   * @param target - The target Pokémon against which the move is used.
   * @param sourceMove - The move being used by the user.
   * @returns The calculated accuracy multiplier.
   */
  getAccuracyMultiplier(target: Pokemon, sourceMove: Move): number {
    const isOhko = sourceMove.hasAttr("OneHitKOAccuracyAttr");
    if (isOhko) {
      return 1;
    }

    const userAccStage = new NumberHolder(this.getStatStage(Stat.ACC));
    const targetEvaStage = new NumberHolder(target.getStatStage(Stat.EVA));

    const ignoreAccStatStage = new BooleanHolder(false);
    const ignoreEvaStatStage = new BooleanHolder(false);

    // TODO: consider refactoring this method to accept `simulated` and then pass simulated to these applyAbAttrs
    applyAbAttrs("IgnoreOpponentStatStagesAbAttr", { pokemon: target, stat: Stat.ACC, ignored: ignoreAccStatStage });
    applyAbAttrs("IgnoreOpponentStatStagesAbAttr", { pokemon: this, stat: Stat.EVA, ignored: ignoreEvaStatStage });
    applyMoveAttrs("IgnoreOpponentStatStagesAttr", this, target, sourceMove, ignoreEvaStatStage);

    globalScene.applyModifiers(TempStatStageBoosterModifier, this.isPlayer(), Stat.ACC, userAccStage);

    userAccStage.value = ignoreAccStatStage.value ? 0 : Math.min(userAccStage.value, 6);
    targetEvaStage.value = ignoreEvaStatStage.value ? 0 : targetEvaStage.value;

    if (target.findTag(t => t instanceof ExposedTag)) {
      targetEvaStage.value = Math.min(0, targetEvaStage.value);
    }

    const accuracyMultiplier = new NumberHolder(1);
    if (userAccStage.value !== targetEvaStage.value) {
      accuracyMultiplier.value =
        userAccStage.value > targetEvaStage.value
          ? (3 + Math.min(userAccStage.value - targetEvaStage.value, 6)) / 3
          : 3 / (3 + Math.min(targetEvaStage.value - userAccStage.value, 6));
    }

    applyAbAttrs("StatMultiplierAbAttr", {
      pokemon: this,
      stat: Stat.ACC,
      statVal: accuracyMultiplier,
      move: sourceMove,
    });

    const evasionMultiplier = new NumberHolder(1);
    applyAbAttrs("StatMultiplierAbAttr", {
      pokemon: target,
      stat: Stat.EVA,
      statVal: evasionMultiplier,
      move: sourceMove,
    });

    const ally = this.getAlly();
    if (ally != null) {
      const ignore =
        this.hasAbilityWithAttr("MoveAbilityBypassAbAttr") || sourceMove.hasFlag(MoveFlags.IGNORE_ABILITIES);
      applyAbAttrs("AllyStatMultiplierAbAttr", {
        pokemon: ally,
        stat: Stat.ACC,
        statVal: accuracyMultiplier,
        ignoreAbility: ignore,
        move: sourceMove,
      });

      applyAbAttrs("AllyStatMultiplierAbAttr", {
        pokemon: ally,
        stat: Stat.EVA,
        statVal: evasionMultiplier,
        ignoreAbility: ignore,
        move: sourceMove,
      });
    }

    return accuracyMultiplier.value / evasionMultiplier.value;
  }

  /**
   * Calculates the base damage of the given move against this Pokemon when attacked by the given source.
   * Used during damage calculation and for Shell Side Arm's forecasting effect.
   * @param __namedParameters.source - Needed for proper typedoc rendering
   * @returns The move's base damage against this Pokemon when used by the source Pokemon.
   */
  getBaseDamage({
    source,
    move,
    moveCategory,
    ignoreAbility = false,
    ignoreSourceAbility = false,
    ignoreAllyAbility = false,
    ignoreSourceAllyAbility = false,
    isCritical = false,
    simulated = true,
  }: getBaseDamageParams): number {
    const isPhysical = moveCategory === MoveCategory.PHYSICAL;

    /** A base damage multiplier based on the source's level */
    const levelMultiplier = (2 * source.level) / 5 + 2;

    /** The power of the move after power boosts from abilities, etc. have applied */
    const power = move.calculateBattlePower(source, this, simulated);

    /**
     * The attacker's offensive stat for the given move's category.
     * Critical hits cause negative stat stages to be ignored.
     */
    const sourceAtk = new NumberHolder(
      source.getEffectiveStat(
        isPhysical ? Stat.ATK : Stat.SPATK,
        this,
        undefined,
        ignoreSourceAbility,
        ignoreAbility,
        ignoreAllyAbility,
        isCritical,
        simulated,
      ),
    );
    applyMoveAttrs("VariableAtkAttr", source, this, move, sourceAtk);

    /**
     * This Pokemon's defensive stat for the given move's category.
     * Critical hits cause positive stat stages to be ignored.
     */
    const targetDef = new NumberHolder(
      this.getEffectiveStat(
        isPhysical ? Stat.DEF : Stat.SPDEF,
        source,
        move,
        ignoreAbility,
        ignoreSourceAbility,
        ignoreSourceAllyAbility,
        isCritical,
        simulated,
      ),
    );
    applyMoveAttrs("VariableDefAttr", source, this, move, targetDef);

    /**
     * The attack's base damage, as determined by the source's level, move power
     * and Attack stat as well as this Pokemon's Defense stat
     */
    const baseDamage = (levelMultiplier * power * sourceAtk.value) / targetDef.value / 50 + 2;

    /** Debug message for non-simulated calls (i.e. when damage is actually dealt) */
    if (!simulated) {
      console.log("base damage", baseDamage, move.name, power, sourceAtk.value, targetDef.value);
    }

    return baseDamage;
  }

  /** Determine the STAB multiplier for a move used against this pokemon.
   *
   * @param source - The attacking {@linkcode Pokemon}
   * @param move - The {@linkcode Move} used in the attack
   * @param ignoreSourceAbility - If `true`, ignores the attacking Pokemon's ability effects
   * @param simulated - If `true`, suppresses changes to game state during the calculation
   *
   * @returns The STAB multiplier for the move used against this Pokemon
   */
  calculateStabMultiplier(source: Pokemon, move: Move, ignoreSourceAbility: boolean, simulated: boolean): number {
    // If the move has the Typeless attribute, it doesn't get STAB (e.g. struggle)
    if (move.hasAttr("TypelessAttr")) {
      return 1;
    }
    const sourceTypes = source.getTypes();
    const sourceTeraType = source.getTeraType();
    const moveType = source.getMoveType(move);
    const matchesSourceType = sourceTypes.includes(source.getMoveType(move));
    const stabMultiplier = new NumberHolder(1);
    if (matchesSourceType && moveType !== PokemonType.STELLAR) {
      stabMultiplier.value += 0.5;
    }

    applyMoveAttrs("CombinedPledgeStabBoostAttr", source, this, move, stabMultiplier);

    if (!ignoreSourceAbility) {
      applyAbAttrs("StabBoostAbAttr", { pokemon: source, simulated, multiplier: stabMultiplier });
    }

    if (source.isTerastallized && sourceTeraType === moveType && moveType !== PokemonType.STELLAR) {
      stabMultiplier.value += 0.5;
    }

    if (
      source.isTerastallized
      && source.getTeraType() === PokemonType.STELLAR
      && (!source.stellarTypesBoosted.includes(moveType) || source.hasSpecies(SpeciesId.TERAPAGOS))
    ) {
      stabMultiplier.value += matchesSourceType ? 0.5 : 0.2;
    }

    return Math.min(stabMultiplier.value, 2.25);
  }

  /**
   * Calculates the damage of an attack made by another Pokemon against this Pokemon
   * @param __namedParameters.source - Needed for proper typedoc rendering
   * @returns The {@linkcode DamageCalculationResult}
   */
  getAttackDamage({
    source,
    move,
    ignoreAbility = false,
    ignoreSourceAbility = false,
    ignoreAllyAbility = false,
    ignoreSourceAllyAbility = false,
    isCritical = false,
    simulated = true,
    effectiveness,
  }: getAttackDamageParams): DamageCalculationResult {
    const damage = new NumberHolder(0);
    const defendingSide = this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;

    const variableCategory = new NumberHolder(move.category);
    applyMoveAttrs("VariableMoveCategoryAttr", source, this, move, variableCategory);
    const moveCategory = variableCategory.value as MoveCategory;

    /** The move's type after type-changing effects are applied */
    const moveType = source.getMoveType(move);

    /** If `value` is `true`, cancels the move and suppresses "No Effect" messages */
    const cancelled = new BooleanHolder(false);

    /**
     * The effectiveness of the move being used. Along with type matchups, this
     * accounts for changes in effectiveness from the move's attributes and the
     * abilities of both the source and this Pokemon.
     *
     * Note that the source's abilities are not ignored here
     */
    const typeMultiplier =
      effectiveness ?? this.getMoveEffectiveness(source, move, ignoreAbility, simulated, cancelled);

    const isPhysical = moveCategory === MoveCategory.PHYSICAL;

    /** Combined damage multiplier from field effects such as weather, terrain, etc. */
    const arenaAttackTypeMultiplier = new NumberHolder(
      globalScene.arena.getAttackTypeMultiplier(moveType, source.isGrounded()),
    );
    applyMoveAttrs("IgnoreWeatherTypeDebuffAttr", source, this, move, arenaAttackTypeMultiplier);

    const isTypeImmune = typeMultiplier * arenaAttackTypeMultiplier.value === 0;

    if (cancelled.value || isTypeImmune) {
      return {
        cancelled: cancelled.value,
        result: move.id === MoveId.SHEER_COLD ? HitResult.IMMUNE : HitResult.NO_EFFECT,
        damage: 0,
      };
    }

    // If the attack deals fixed damage, return a result with that much damage
    const fixedDamage = new NumberHolder(0);
    applyMoveAttrs("FixedDamageAttr", source, this, move, fixedDamage);
    if (fixedDamage.value) {
      const multiLensMultiplier = new NumberHolder(1);
      globalScene.applyModifiers(
        PokemonMultiHitModifier,
        source.isPlayer(),
        source,
        move.id,
        null,
        multiLensMultiplier,
      );
      fixedDamage.value = toDmgValue(fixedDamage.value * multiLensMultiplier.value);

      return {
        cancelled: false,
        result: HitResult.EFFECTIVE,
        damage: fixedDamage.value,
      };
    }

    // If the attack is a one-hit KO move, return a result with damage equal to this Pokemon's HP
    const isOneHitKo = new BooleanHolder(false);
    applyMoveAttrs("OneHitKOAttr", source, this, move, isOneHitKo);
    if (isOneHitKo.value) {
      return {
        cancelled: false,
        result: HitResult.ONE_HIT_KO,
        damage: this.hp,
      };
    }

    /**
     * The attack's base damage, as determined by the source's level, move power
     * and Attack stat as well as this Pokemon's Defense stat
     */
    const baseDamage = this.getBaseDamage({
      source,
      move,
      moveCategory,
      ignoreAbility,
      ignoreSourceAbility,
      ignoreAllyAbility,
      ignoreSourceAllyAbility,
      isCritical,
      simulated,
    });

    /** 25% damage debuff on moves hitting more than one non-fainted target (regardless of immunities) */
    const { targets, multiple } = getMoveTargets(source, move.id);
    const numTargets = multiple ? targets.length : 1;
    const targetMultiplier = numTargets > 1 ? 0.75 : 1;

    /** Multiplier for moves enhanced by Multi-Lens and/or Parental Bond */
    const multiStrikeEnhancementMultiplier = new NumberHolder(1);
    globalScene.applyModifiers(
      PokemonMultiHitModifier,
      source.isPlayer(),
      source,
      move.id,
      null,
      multiStrikeEnhancementMultiplier,
    );

    /** Doubles damage if this Pokemon's last move was Glaive Rush */
    const glaiveRushMultiplier = new NumberHolder(1);
    if (this.getTag(BattlerTagType.RECEIVE_DOUBLE_DAMAGE)) {
      glaiveRushMultiplier.value = 2;
    }

    /** The damage multiplier when the given move critically hits */
    const criticalMultiplier = new NumberHolder(isCritical ? 1.5 : 1);
    applyAbAttrs("MultCritAbAttr", { pokemon: source, simulated, critMult: criticalMultiplier });

    /**
     * A multiplier for random damage spread in the range [0.85, 1]
     * This is always 1 for simulated calls.
     */
    const randomMultiplier = simulated ? 1 : this.randBattleSeedIntRange(85, 100) / 100;

    /** A damage multiplier for when the attack is of the attacker's type and/or Tera type. */
    const stabMultiplier = this.calculateStabMultiplier(source, move, ignoreSourceAbility, simulated);

    /** Halves damage if the attacker is using a physical attack while burned */
    let burnMultiplier = 1;
    if (
      isPhysical
      && source.status
      && source.status.effect === StatusEffect.BURN
      && !move.hasAttr("BypassBurnDamageReductionAttr")
    ) {
      const burnDamageReductionCancelled = new BooleanHolder(false);
      if (!ignoreSourceAbility) {
        applyAbAttrs("BypassBurnDamageReductionAbAttr", {
          pokemon: source,
          cancelled: burnDamageReductionCancelled,
          simulated,
        });
      }
      if (!burnDamageReductionCancelled.value) {
        burnMultiplier = 0.5;
      }
    }

    /** Reduces damage if this Pokemon has a relevant screen (e.g. Light Screen for special attacks) */
    const screenMultiplier = new NumberHolder(1);

    // Critical hits should bypass screens
    if (!isCritical) {
      globalScene.arena.applyTagsForSide(WeakenMoveScreenTag, defendingSide, source, moveCategory, screenMultiplier);
    }

    /**
     * For each {@linkcode HitsTagAttr} the move has, doubles the damage of the move if:
     * The target has a {@linkcode BattlerTagType} that this move interacts with
     * AND
     * The move doubles damage when used against that tag
     */
    const hitsTagMultiplier = new NumberHolder(1);
    move
      .getAttrs("HitsTagAttr")
      .filter(hta => hta.doubleDamage)
      .forEach(hta => {
        if (this.getTag(hta.tagType)) {
          hitsTagMultiplier.value *= 2;
        }
      });

    /** Halves damage if this Pokemon is grounded in Misty Terrain against a Dragon-type attack */
    const mistyTerrainMultiplier =
      globalScene.arena.terrain?.terrainType === TerrainType.MISTY
      && this.isGrounded()
      && moveType === PokemonType.DRAGON
        ? 0.5
        : 1;

    damage.value = toDmgValue(
      baseDamage
        * targetMultiplier
        * multiStrikeEnhancementMultiplier.value
        * arenaAttackTypeMultiplier.value
        * glaiveRushMultiplier.value
        * criticalMultiplier.value
        * randomMultiplier
        * stabMultiplier
        * typeMultiplier
        * burnMultiplier
        * screenMultiplier.value
        * hitsTagMultiplier.value
        * mistyTerrainMultiplier,
    );

    if (!ignoreSourceAbility) {
      applyAbAttrs("MoveDamageBoostAbAttr", {
        pokemon: source,
        opponent: this,
        move,
        simulated,
        damage,
      });
    }

    /** Apply the enemy's Damage and Resistance tokens */
    if (!source.isPlayer()) {
      globalScene.applyModifiers(EnemyDamageBoosterModifier, false, damage);
    }
    if (!this.isPlayer()) {
      globalScene.applyModifiers(EnemyDamageReducerModifier, false, damage);
    }

    const abAttrParams: PreAttackModifyDamageAbAttrParams = {
      pokemon: this,
      opponent: source,
      move,
      simulated,
      damage,
    };
    /** Apply this Pokemon's post-calc defensive modifiers (e.g. Fur Coat) */
    if (!ignoreAbility) {
      applyAbAttrs("ReceivedMoveDamageMultiplierAbAttr", abAttrParams);

      const ally = this.getAlly();
      /** Additionally apply friend guard damage reduction if ally has it. */
      if (globalScene.currentBattle.double && ally != null && ally.isActive(true)) {
        applyAbAttrs("AlliedFieldDamageReductionAbAttr", {
          ...abAttrParams,
          // Same parameters as before, except we are applying the ally's ability
          pokemon: ally,
        });
      }
    }

    // This attribute may modify damage arbitrarily, so be careful about changing its order of application.
    applyMoveAttrs("ModifiedDamageAttr", source, this, move, damage);

    if (this.isFullHp() && !ignoreAbility) {
      applyAbAttrs("PreDefendFullHpEndureAbAttr", abAttrParams);
    }

    // debug message for when damage is applied (i.e. not simulated)
    if (!simulated) {
      console.log("damage", damage.value, move.name);
    }

    let hitResult: HitResult;
    if (typeMultiplier < 1) {
      hitResult = HitResult.NOT_VERY_EFFECTIVE;
    } else if (typeMultiplier > 1) {
      hitResult = HitResult.SUPER_EFFECTIVE;
    } else {
      hitResult = HitResult.EFFECTIVE;
    }

    return {
      cancelled: cancelled.value,
      result: hitResult,
      damage: damage.value,
    };
  }

  /**
   * Determine whether the given move will score a critical hit **against** this Pokemon.
   * @param source - The {@linkcode Pokemon} using the move
   * @param move - The {@linkcode Move} being used
   * @returns Whether the move will critically hit the defender.
   */
  getCriticalHitResult(source: Pokemon, move: Move): boolean {
    if (move.hasAttr("FixedDamageAttr")) {
      // fixed damage moves (Dragon Rage, etc.) will never crit
      return false;
    }

    const alwaysCrit = new BooleanHolder(false);
    applyMoveAttrs("CritOnlyAttr", source, this, move, alwaysCrit);
    applyAbAttrs("ConditionalCritAbAttr", { pokemon: source, isCritical: alwaysCrit, target: this, move });
    const alwaysCritTag = !!source.getTag(BattlerTagType.ALWAYS_CRIT);
    const critChance = [24, 8, 2, 1][Phaser.Math.Clamp(this.getCritStage(source, move), 0, 3)];

    let isCritical = alwaysCrit.value || alwaysCritTag || critChance === 1;

    // If we aren't already guaranteed to crit, do a random roll & check overrides
    isCritical ||= Overrides.CRITICAL_HIT_OVERRIDE ?? globalScene.randBattleSeedInt(critChance) === 0;

    // apply crit block effects from lucky chant & co., overriding previous effects
    const blockCrit = new BooleanHolder(false);
    applyAbAttrs("BlockCritAbAttr", { pokemon: this, blockCrit });
    globalScene.arena.applyTagsForSide(
      NoCritTag,
      this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY,
      blockCrit,
    );
    isCritical &&= !blockCrit.value; // need to roll a crit and not be blocked by either crit prevention effect

    return isCritical;
  }

  /**
   * Submethod called by {@linkcode damageAndUpdate} to apply damage to this Pokemon and adjust its HP.
   * @param damage - The damage to deal
   * @param _ignoreSegments - Whether to ignore boss segments; default `false`
   * @param preventEndure - Whether to allow the damage to bypass an Endure/Sturdy effect
   * @param ignoreFaintPhase - Whether to ignore adding a FaintPhase if this damage causes a faint
   * @returns The actual damage dealt
   */
  damage(damage: number, _ignoreSegments = false, preventEndure = false, ignoreFaintPhase = false): number {
    if (this.isFainted()) {
      return 0;
    }
    const surviveDamage = new BooleanHolder(false);

    // check for endure and other abilities that would prevent us from death
    if (!preventEndure && this.hp - damage <= 0) {
      if (this.hp >= 1 && this.getTag(BattlerTagType.ENDURING)) {
        surviveDamage.value = this.lapseTag(BattlerTagType.ENDURING);
      } else if (this.hp > 1 && this.getTag(BattlerTagType.STURDY)) {
        surviveDamage.value = this.lapseTag(BattlerTagType.STURDY);
      } else if (this.hp >= 1 && this.getTag(BattlerTagType.ENDURE_TOKEN)) {
        surviveDamage.value = this.lapseTag(BattlerTagType.ENDURE_TOKEN);
      }
      if (!surviveDamage.value) {
        globalScene.applyModifiers(SurviveDamageModifier, this.isPlayer(), this, surviveDamage);
      }
      if (surviveDamage.value) {
        damage = this.hp - 1;
      }
    }

    damage = Math.min(damage, this.hp);
    this.hp -= damage;
    if (this.isFainted() && !ignoreFaintPhase) {
      globalScene.phaseManager.queueFaintPhase(this.getBattlerIndex(), preventEndure);
      this.destroySubstitute();
      this.lapseTag(BattlerTagType.COMMANDED);
    }
    return damage;
  }

  /**
   * Given the damage, adds a new DamagePhase and update HP values, etc.
   *
   * @remarks
   * Checks for {@linkcode HitResult.INDIRECT | Indirect} hits to account for Endure/Reviver Seed applying correctly
   * @param damage - The damage to inflict on this Pokémon
   * @param __namedParameters.source - Needed for proper typedoc rendering
   * @returns Amount of damage actually done
   */
  damageAndUpdate(
    damage: number,
    {
      result = HitResult.EFFECTIVE,
      isCritical = false,
      ignoreSegments = false,
      ignoreFaintPhase = false,
      source,
    }: {
      /**
       * An enum if it's super effective, not very effective, etc; default {@linkcode HitResult.EFFECTIVE}
       */
      result?: DamageResult;
      /** Whether the attack was a critical hit */
      isCritical?: boolean;
      /** Whether to ignore boss segments */
      ignoreSegments?: boolean;
      /** Whether to ignore adding a FaintPhase if this damage causes a faint; default `false` */
      ignoreFaintPhase?: boolean;
      /** The Pokémon inflicting the damage, or undefined if not caused by a Pokémon */
      source?: Pokemon;
    } = {},
  ): number {
    const isIndirectDamage = [HitResult.INDIRECT, HitResult.INDIRECT_KO].includes(result);
    const damagePhase = globalScene.phaseManager.create(
      "DamageAnimPhase",
      this.getBattlerIndex(),
      damage,
      result as DamageResult,
      isCritical,
    );
    globalScene.phaseManager.unshiftPhase(damagePhase);
    if (this.switchOutStatus && source) {
      damage = 0;
    }
    damage = this.damage(damage, ignoreSegments, isIndirectDamage, ignoreFaintPhase);
    // Damage amount may have changed, but needed to be queued before calling damage function
    damagePhase.updateAmount(damage);
    /**
     * Run PostDamageAbAttr from any source of damage that is not from a multi-hit
     * Multi-hits are handled in move-effect-phase.ts for PostDamageAbAttr
     */
    if (!source || source.turnData.hitCount <= 1) {
      applyAbAttrs("PostDamageAbAttr", { pokemon: this, damage, source });
    }
    return damage;
  }

  /**
   * Restore a specific amount of HP to this Pokémon
   * @param amount - The amount of HP to restore
   * @returns The true amount of HP restored; may be less than `amount` if `amount` would overheal
   */
  public heal(amount: number): number {
    const healAmount = Math.min(amount, this.getMaxHp() - this.hp);
    this.hp += healAmount;
    return healAmount;
  }

  public isBossImmune(): boolean {
    return this.isBoss();
  }

  /**
   * @returns Whether this Pokémon is in a Dynamax or Gigantamax form
   */
  public isMax(): boolean {
    const maxForms = [
      SpeciesFormKey.GIGANTAMAX,
      SpeciesFormKey.GIGANTAMAX_RAPID,
      SpeciesFormKey.GIGANTAMAX_SINGLE,
      SpeciesFormKey.ETERNAMAX,
    ] as string[];
    return (
      maxForms.includes(this.getFormKey()) || (!!this.getFusionFormKey() && maxForms.includes(this.getFusionFormKey()!))
    );
  }

  /**
   * @returns Whether this Pokémon is in a Mega or Primal form
   */
  public isMega(): boolean {
    const megaForms = [
      SpeciesFormKey.MEGA,
      SpeciesFormKey.MEGA_X,
      SpeciesFormKey.MEGA_Y,
      SpeciesFormKey.PRIMAL,
    ] as string[];
    return (
      megaForms.includes(this.getFormKey())
      || (!!this.getFusionFormKey() && megaForms.includes(this.getFusionFormKey()!))
    );
  }

  /**
   * Check whether a battler tag can be added to this Pokémon
   *
   * @param tagType - The tag to check
   * @returns - Whether the tag can be added
   * @see {@linkcode addTag}
   */
  public canAddTag(tagType: BattlerTagType): boolean {
    if (this.getTag(tagType)) {
      return false;
    }

    const stubTag = new BattlerTag(tagType, 0, 0);

    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BattlerTagImmunityAbAttr", { pokemon: this, tag: stubTag, cancelled, simulated: true });

    for (const pokemon of this.getAlliesGenerator()) {
      applyAbAttrs("UserFieldBattlerTagImmunityAbAttr", {
        pokemon,
        tag: stubTag,
        cancelled,
        simulated: true,
        target: this,
      });
    }

    return !cancelled.value;
  }

  /**
   * Add a new {@linkcode BattlerTag} of the specified `tagType`
   *
   * @remarks
   * Also ensures the tag is able to be applied, similar to {@linkcode canAddTag}
   *
   * @param tagType - The type of tag to add
   * @param turnCount - The number of turns the tag should last; default `0`
   * @param sourceMove - The id of the move that causing the tag to be added, if caused by a move
   * @param sourceId - The {@linkcode Pokemon#id | id} of the pokemon causing the tag to be added, if caused by a Pokémon
   * @returns Whether the tag was successfully added
   * @see {@linkcode canAddTag}
   */
  public addTag(tagType: BattlerTagType, turnCount = 0, sourceMove?: MoveId, sourceId?: number): boolean {
    const existingTag = this.getTag(tagType);
    if (existingTag) {
      existingTag.onOverlap(this);
      return false;
    }

    const newTag = getBattlerTag(tagType, turnCount, sourceMove!, sourceId!); // TODO: are the bangs correct?

    // TODO: Just call canAddTag() here? Can possibly overload it to accept an actual tag instead of just a type
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("BattlerTagImmunityAbAttr", { pokemon: this, tag: newTag, cancelled });
    if (cancelled.value) {
      return false;
    }

    for (const pokemon of this.getAlliesGenerator()) {
      applyAbAttrs("UserFieldBattlerTagImmunityAbAttr", { pokemon, tag: newTag, cancelled, target: this });
      if (cancelled.value) {
        return false;
      }
    }

    if (newTag.canAdd(this)) {
      this.summonData.tags.push(newTag);
      newTag.onAdd(this);
      return true;
    }

    return false;
  }

  // TODO: Utilize a type map for these so we can avoid overloads
  public getTag(tagType: BattlerTagType.GRUDGE): GrudgeTag | undefined;
  public getTag(tagType: BattlerTagType.SUBSTITUTE): SubstituteTag | undefined;
  public getTag(tagType: BattlerTagType): BattlerTag | undefined;
  public getTag<T extends BattlerTag>(tagType: Constructor<T>): T | undefined;
  public getTag(tagType: BattlerTagType | Constructor<BattlerTag>): BattlerTag | undefined {
    return typeof tagType === "function"
      ? this.summonData.tags.find(t => t instanceof tagType)
      : this.summonData.tags.find(t => t.tagType === tagType);
  }

  /**
   * Find the first `BattlerTag` matching the specified predicate
   * @remarks
   * Equivalent to `this.summonData.tags.find(tagFilter)`.
   * @param tagFilter - The predicate to match against
   * @returns The first matching tag, or `undefined` if none match
   */
  public findTag(tagFilter: (tag: BattlerTag) => boolean) {
    return this.summonData.tags.find(tagFilter);
  }

  /**
   * Return the list of `BattlerTag`s that satisfy the given predicate
   * @remarks
   * Equivalent to `this.summonData.tags.filter(tagFilter)`.
   * @param tagFilter - The predicate to match against
   * @returns The filtered list of tags
   */
  public findTags(tagFilter: (tag: BattlerTag) => boolean): BattlerTag[] {
    return this.summonData.tags.filter(tagFilter);
  }

  /**
   * Lapse the first {@linkcode BattlerTag} matching `tagType`
   *
   * @remarks
   * Also responsible for removing the tag when the lapse method returns `false`.
   *
   *
   * ⚠️ Lapse types other than `CUSTOM` are generally lapsed automatically. However, some tags
   * support manually lapsing
   *
   * @param tagType - The {@linkcode BattlerTagType} to search for
   * @param lapseType - The lapse type to use for the lapse method; defaults to {@linkcode BattlerTagLapseType.CUSTOM}
   * @returns Whether a tag matching the given type was found
   * @see {@linkcode BattlerTag.lapse}
   */
  public lapseTag(tagType: BattlerTagType, lapseType = BattlerTagLapseType.CUSTOM): boolean {
    const tags = this.summonData.tags;
    const tag = tags.find(t => t.tagType === tagType);
    if (!tag) {
      return false;
    }

    if (!tag.lapse(this, lapseType)) {
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);
    }
    return true;
  }

  /**
   * Tick down all {@linkcode BattlerTags} that lapse on the provided
   * `lapseType`, removing any whose durations fall below 0.
   * @param lapseType - The type of lapse to process
   */
  public lapseTags(lapseType: Exclude<BattlerTagLapseType, BattlerTagLapseType.CUSTOM>): void {
    const tags = this.summonData.tags;
    tags
      .filter(
        t =>
          lapseType === BattlerTagLapseType.FAINT
          || (t.lapseTypes.some(lType => lType === lapseType) && !t.lapse(this, lapseType)),
      )
      .forEach(t => {
        t.onRemove(this);
        tags.splice(tags.indexOf(t), 1);
      });
  }

  /**
   * Remove the first tag matching `tagType` and invoke its
   * {@linkcode BattlerTag#onRemove | onRemove} method.
   * @remarks
   * Only removes the first matching tag, if multiple are present; to remove all
   * matching tags, use {@linkcode findAndRemoveTags} instead.
   * @param tagType - The tag type to search for and remove
   */
  public removeTag(tagType: BattlerTagType): void {
    const tags = this.summonData.tags;
    const tag = tags.find(t => t.tagType === tagType);
    if (tag) {
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);
    }
  }

  /**
   * Find and remove all {@linkcode BattlerTag}s matching the given function and
   * invoke their {@linkcode BattlerTag#onRemove | onRemove} methods.
   * @remarks
   * Removes all matching tags; to remove only the first matching tag, use
   * {@linkcode removeTag} instead.
   * @param tagFilter - A function dictating which tags to remove
   */
  public findAndRemoveTags(tagFilter: (tag: BattlerTag) => boolean): void {
    const tags = this.summonData.tags;
    const tagsToRemove = tags.filter(t => tagFilter(t));
    for (const tag of tagsToRemove) {
      tag.turnCount = 0;
      tag.onRemove(this);
      tags.splice(tags.indexOf(tag), 1);
    }
  }

  /**
   * Remove all tags that were applied by a Pokémon with the given `sourceId`,
   * invoking their {@linkcode BattlerTag#onRemove | onRemove} methods.
   * @param sourceId - Tags with this {@linkcode Pokemon#id | id} as their {@linkcode BattlerTag#sourceId | sourceId} will be removed
   * @see {@linkcode findAndRemoveTags}
   */
  public removeTagsBySourceId(sourceId: number): void {
    this.findAndRemoveTags(t => t.isSourceLinked() && t.sourceId === sourceId);
  }

  /**
   * Change the `sourceId` of all tags on this Pokémon with the given `sourceId` to `newSourceId`.
   * @param sourceId - The {@linkcode Pokemon#id | id} of the pokemon whose tags are to be transferred
   * @param newSourceId - The {@linkcode Pokemon#id | id} of the pokemon to which the tags are being transferred
   */
  public transferTagsBySourceId(sourceId: number, newSourceId: number): void {
    this.summonData.tags.forEach(t => {
      if (t.sourceId === sourceId) {
        t.sourceId = newSourceId;
      }
    });
  }

  /**
   * Transfer stat changes and Tags from another Pokémon
   *
   * @remarks
   * Used to implement Baton Pass and switching via the Baton item.
   *
   * @param source - The pokemon whose stats/Tags are to be passed on from, ie: the Pokemon using Baton Pass
   */
  public transferSummon(source: Pokemon): void {
    for (const s of BATTLE_STATS) {
      const sourceStage = source.getStatStage(s);
      if (this.isPlayer() && sourceStage === 6) {
        globalScene.validateAchv(achvs.TRANSFER_MAX_STAT_STAGE);
      }
      this.setStatStage(s, sourceStage);
    }

    for (const tag of source.summonData.tags) {
      if (
        !tag.isBatonPassable
        || (tag.tagType === BattlerTagType.TELEKINESIS
          && this.species.speciesId === SpeciesId.GENGAR
          && this.getFormKey() === "mega")
      ) {
        continue;
      }

      if (tag instanceof PowerTrickTag) {
        tag.swapStat(this);
      }

      this.summonData.tags.push(tag);
    }

    this.updateInfo();
  }

  /**
   * Get whether the given move is currently disabled for this Pokémon by a move restriction tag.
   *
   * @remarks
   * ⚠️ Only checks for restrictions due to a battler tag, not due to the move's own attributes.
   * @param moveId - The ID of the move to check
   * @returns `true` if the move is disabled for this Pokemon, otherwise `false`
   * @see {@linkcode MoveRestrictionBattlerTag}
   */
  // TODO: Move this behavior into a matcher and expunge it from the codebase - we only use it for tests
  public hasRestrictingTag(moveId: MoveId): boolean {
    return this.getRestrictingTag(moveId, this) !== null;
  }

  /**
   * Determine whether the given move is selectable by this Pokemon and the message to display if it is not.
   *
   * @remarks
   * Checks both the move's own restrictions and any restrictions imposed by battler tags like disable or throat chop.
   *
   * @param moveId - The move ID to check
   * @returns A tuple of the form [response, msg], where msg contains the text to display if `response` is false.
   *
   * @see {@linkcode isMoveRestricted}
   */
  public isMoveSelectable(moveId: MoveId): [boolean, string] {
    const restrictedTag = this.getRestrictingTag(moveId, this);
    if (restrictedTag) {
      return [false, restrictedTag.selectionDeniedText(this, moveId)];
    }
    return allMoves[moveId].checkRestrictions(this);
  }

  /**
   * Get whether the given move is currently disabled for the user based on the player's target selection
   *
   * @param moveId - The ID of the move to check
   * @param user - The move user
   * @param target - The target of the move
   *
   * @returns `true` if the move is disabled for this Pokemon due to the player's target selection
   *
   * @see {@linkcode MoveRestrictionBattlerTag}
   */
  isMoveTargetRestricted(moveId: MoveId, user: Pokemon, target: Pokemon): boolean {
    for (const tag of this.findTags(t => t instanceof MoveRestrictionBattlerTag)) {
      if ((tag as MoveRestrictionBattlerTag).isMoveTargetRestricted(moveId, user, target)) {
        return (tag as MoveRestrictionBattlerTag) !== null;
      }
    }
    return false;
  }

  /**
   * Get the {@link MoveRestrictionBattlerTag} that is restricting a move, if it exists.
   *
   * @param moveId - The ID of the move to check
   * @param user - The move user, optional and used when the target is a factor in the move's restricted status
   * @param target - The target of the move; optional, and used when the target is a factor in the move's restricted status
   * @returns The first tag on this Pokemon that restricts the move, or `null` if the move is not restricted.
   */
  getRestrictingTag(moveId: MoveId, user?: Pokemon, target?: Pokemon): MoveRestrictionBattlerTag | null {
    for (const tag of this.findTags(t => t instanceof MoveRestrictionBattlerTag)) {
      if ((tag as MoveRestrictionBattlerTag).isMoveRestricted(moveId, user)) {
        return tag as MoveRestrictionBattlerTag;
      }
      if (user && target && (tag as MoveRestrictionBattlerTag).isMoveTargetRestricted(moveId, user, target)) {
        return tag as MoveRestrictionBattlerTag;
      }
    }
    return null;
  }

  /**
   * Return this Pokemon's move history.
   * Entries are sorted in order of OLDEST to NEWEST
   * @returns An array of {@linkcode TurnMove}, as described above.
   * @see {@linkcode getLastXMoves}
   */
  public getMoveHistory(): TurnMove[] {
    return this.summonData.moveHistory;
  }

  /**
   * Add a new entry to this Pokemon's move history
   * @remarks
   * Does nothing if this Pokemon is not currently on the field.
   * @param turnMove - The move to add to the history
   */
  public pushMoveHistory(turnMove: TurnMove): void {
    if (!this.isOnField()) {
      return;
    }
    turnMove.turn = globalScene.currentBattle?.turn;
    this.getMoveHistory().push(turnMove);
  }

  /**
   * Return a list of the most recent move entries in this {@linkcode Pokemon}'s move history.
   * The retrieved move entries are sorted in order from **NEWEST** to **OLDEST**.
   * @param moveCount - The maximum number of move entries to retrieve.
   * If negative, retrieves the Pokemon's entire move history (equivalent to reversing the output of {@linkcode getMoveHistory()}).
   * Default is `1`.
   * @returns An array of {@linkcode TurnMove}, as specified above.
   */
  // TODO: Update documentation in dancer PR to mention "getLastNonVirtualMove"
  public getLastXMoves(moveCount = 1): TurnMove[] {
    const moveHistory = this.getMoveHistory();
    if (moveCount > 0) {
      return moveHistory.slice(Math.max(moveHistory.length - moveCount, 0)).reverse();
    }
    return moveHistory.slice().reverse();
  }

  /**
   * Return the most recently executed {@linkcode TurnMove} this {@linkcode Pokemon} has used that is:
   * - Not {@linkcode MoveId.NONE}
   * - Non-virtual ({@linkcode MoveUseMode | useMode} < {@linkcode MoveUseMode.INDIRECT})
   * @param ignoreStruggle - Whether to additionally ignore {@linkcode MoveId.STRUGGLE}; default `false`
   * @param ignoreFollowUp - Whether to ignore moves with a use type of {@linkcode MoveUseMode.FOLLOW_UP}
   * (e.g. ones called by Copycat/Mirror Move); default `true`.
   * @returns The last move this Pokemon has used satisfying the aforementioned conditions,
   * or `undefined` if no applicable moves have been used since switching in.
   */
  public getLastNonVirtualMove(ignoreStruggle = false, ignoreFollowUp = true): TurnMove | undefined {
    return this.getLastXMoves(-1).find(
      m =>
        m.move !== MoveId.NONE
        && (!ignoreStruggle || m.move !== MoveId.STRUGGLE)
        && (!isVirtual(m.useMode) || (!ignoreFollowUp && m.useMode === MoveUseMode.FOLLOW_UP)),
    );
  }

  /**
   * Return this Pokemon's move queue, consisting of all the moves it is slated to perform.
   * @returns An array of {@linkcode TurnMove}, as described above
   */
  public getMoveQueue(): TurnMove[] {
    return this.summonData.moveQueue;
  }

  /**
   * Add a new entry to the end of this Pokemon's move queue.
   * @param queuedMove - A {@linkcode TurnMove} to push to this Pokemon's queue.
   */
  public pushMoveQueue(queuedMove: TurnMove): void {
    this.summonData.moveQueue.push(queuedMove);
  }

  /**
   * Change this Pokémon's form to the specified form, loading the required
   * assets and updating its stats and info display.
   * @param formChange - The form to change to
   * @returns A Promise that resolves once the form change has completed.
   */
  public async changeForm(formChange: SpeciesFormChange): Promise<void> {
    return new Promise(resolve => {
      this.formIndex = Math.max(
        this.species.forms.findIndex(f => f.formKey === formChange.formKey),
        0,
      );
      this.generateName();
      const abilityCount = this.getSpeciesForm().getAbilityCount();
      if (this.abilityIndex >= abilityCount) {
        // Shouldn't happen
        this.abilityIndex = abilityCount - 1;
      }
      globalScene.gameData.setPokemonSeen(this, false);
      this.setScale(this.getSpriteScale());
      this.loadAssets().then(() => {
        this.calculateStats();
        globalScene.updateModifiers(this.isPlayer(), true);
        Promise.all([this.updateInfo(), globalScene.updateFieldScale()]).then(() => resolve());
      });
    });
  }

  /**
   * Play this Pokémon's cry sound
   * @param soundConfig - Optional sound configuration to apply to the cry
   * @param sceneOverride - Optional scene to use instead of the global scene
   */
  public cry(soundConfig?: Phaser.Types.Sound.SoundConfig, sceneOverride?: BattleScene): AnySound | null {
    const scene = sceneOverride ?? globalScene; // TODO: is `sceneOverride` needed?
    const cry = this.getSpeciesForm(undefined, true).cry(soundConfig);
    if (!cry) {
      return cry;
    }
    let duration = cry.totalDuration * 1000;
    if (this.fusionSpecies && this.getSpeciesForm(undefined, true) !== this.getFusionSpeciesForm(undefined, true)) {
      const fusionCry = this.getFusionSpeciesForm(undefined, true).cry(soundConfig, true);
      if (!fusionCry) {
        return cry;
      }
      duration = Math.min(duration, fusionCry.totalDuration * 1000);
      fusionCry.destroy();
      scene.time.delayedCall(fixedInt(Math.ceil(duration * 0.4)), () => {
        try {
          SoundFade.fadeOut(scene, cry, fixedInt(Math.ceil(duration * 0.2)));
          const fusionCryInner = this.getFusionSpeciesForm(undefined, true).cry({
            seek: Math.max(fusionCry.totalDuration * 0.4, 0),
            ...soundConfig,
          });
          if (fusionCryInner) {
            SoundFade.fadeIn(
              scene,
              fusionCryInner,
              fixedInt(Math.ceil(duration * 0.2)),
              scene.masterVolume * scene.fieldVolume,
              0,
            );
          }
        } catch (err) {
          console.error(err);
        }
      });
    }

    return cry;
  }

  /**
   * Play this Pokémon's faint cry, pausing its animation until the cry is finished.
   * @param callback - A function to be called once the cry has finished playing
   */
  public faintCry(callback: () => any): void {
    if (this.fusionSpecies && this.getSpeciesForm() !== this.getFusionSpeciesForm()) {
      this.fusionFaintCry(callback);
      return;
    }

    const key = this.species.getCryKey(this.formIndex);
    const crySoundConfig = { rate: 0.85, detune: 0 };
    if (this.isPlayer()) {
      // If fainting is permanent, emphasize impact
      const preventRevive = new BooleanHolder(false);
      applyChallenges(ChallengeType.PREVENT_REVIVE, preventRevive);
      if (preventRevive.value) {
        crySoundConfig.detune = -100;
        crySoundConfig.rate = 0.7;
      }
    }
    const cry = globalScene.playSound(key, crySoundConfig);
    if (!cry || globalScene.fieldVolume === 0) {
      callback();
      return;
    }
    const sprite = this.getSprite();
    const tintSprite = this.getTintSprite();
    const delay = Math.max(cry.totalDuration * 50, 25);

    let frameProgress = 0;
    let frameThreshold: number;

    sprite.anims.pause();
    tintSprite?.anims.pause();

    let faintCryTimer: Phaser.Time.TimerEvent | null = globalScene.time.addEvent({
      delay: fixedInt(delay),
      repeat: -1,
      callback: () => {
        frameThreshold = sprite.anims.msPerFrame / crySoundConfig.rate;
        frameProgress += delay;
        while (frameProgress > frameThreshold) {
          if (sprite.anims.duration) {
            sprite.anims.nextFrame();
            tintSprite?.anims.nextFrame();
          }
          frameProgress -= frameThreshold;
        }
        if (cry && !cry.pendingRemove) {
          cry.setRate(crySoundConfig.rate * 0.99);
        } else {
          faintCryTimer?.destroy();
          faintCryTimer = null;
          if (callback) {
            callback();
          }
        }
      },
    });

    // Failsafe
    globalScene.time.delayedCall(fixedInt(3000), () => {
      if (!faintCryTimer || !globalScene) {
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

  /**
   * Play this Pokémon's fusion faint cry, which is a mixture of the faint cries
   * for both of its species
   * @param callback - A function to be called once the cry has finished playing
   */
  private fusionFaintCry(callback: () => any): void {
    const key = this.species.getCryKey(this.formIndex);
    let i = 0;
    let rate = 0.85;
    const cry = globalScene.playSound(key, { rate });
    const sprite = this.getSprite();
    const tintSprite = this.getTintSprite();

    const fusionCryKey = this.fusionSpecies!.getCryKey(this.fusionFormIndex);
    let fusionCry = globalScene.playSound(fusionCryKey, {
      rate,
    });
    if (!cry || !fusionCry || globalScene.fieldVolume === 0) {
      callback();
      return;
    }
    fusionCry.stop();
    let duration = cry.totalDuration * 1000;
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
    tintSprite?.anims.pause();

    let faintCryTimer: Phaser.Time.TimerEvent | null = globalScene.time.addEvent({
      delay: fixedInt(delay),
      repeat: -1,
      callback: () => {
        ++i;
        frameThreshold = sprite.anims.msPerFrame / rate;
        frameProgress += delay;
        while (frameProgress > frameThreshold) {
          if (sprite.anims.duration) {
            sprite.anims.nextFrame();
            tintSprite?.anims.nextFrame();
          }
          frameProgress -= frameThreshold;
        }
        if (i === transitionIndex && fusionCryKey) {
          SoundFade.fadeOut(globalScene, cry, fixedInt(Math.ceil((duration / rate) * 0.2)));
          fusionCry = globalScene.playSound(fusionCryKey, {
            // TODO: This bang is correct as this callback can only be called once, but
            // this whole block with conditionally reassigning fusionCry needs a second lock.
            seek: Math.max(fusionCry!.totalDuration * 0.4, 0),
            rate,
          });
          if (fusionCry) {
            SoundFade.fadeIn(
              globalScene,
              fusionCry,
              fixedInt(Math.ceil((duration / rate) * 0.2)),
              globalScene.masterVolume * globalScene.fieldVolume,
              0,
            );
          }
        }
        rate *= 0.99;
        if (cry && !cry.pendingRemove) {
          cry.setRate(rate);
        }
        if (fusionCry && !fusionCry.pendingRemove) {
          fusionCry.setRate(rate);
        }
        if ((!cry || cry.pendingRemove) && (!fusionCry || fusionCry.pendingRemove)) {
          faintCryTimer?.destroy();
          faintCryTimer = null;
          if (callback) {
            callback();
          }
        }
      },
    });

    // Failsafe
    globalScene.time.delayedCall(fixedInt(3000), () => {
      if (!faintCryTimer || !globalScene) {
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

  /**
   * Check the specified pokemon is considered to be the opposite gender as this pokemon
   * @param pokemon - The Pokémon to compare against
   * @returns Whether the pokemon are considered to be opposite genders
   */
  public isOppositeGender(pokemon: Pokemon): boolean {
    return (
      this.gender !== Gender.GENDERLESS
      && pokemon.gender === (this.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE)
    );
  }

  /**
   * Display an immunity message for a failed status application.
   * @param quiet - Whether to suppress message and return early
   * @param reason - The reason for the status application failure;
   * can be "overlap" (already has same status), "other" (generic fail message)
   * or a {@linkcode TerrainType} for terrain-based blockages.
   * Default `"other"`
   */
  public queueStatusImmuneMessage(
    quiet: boolean,
    reason: "overlap" | "other" | Exclude<TerrainType, TerrainType.NONE> = "other",
  ): void {
    if (quiet) {
      return;
    }

    let message: string;
    if (reason === "overlap") {
      // "XYZ is already XXX!"
      message = getStatusEffectOverlapText(this.status?.effect ?? StatusEffect.NONE, getPokemonNameWithAffix(this));
    } else if (typeof reason === "number") {
      // "XYZ was protected by the XXX terrain!" /
      // "XYZ surrounds itself with a protective mist!"
      message = getTerrainBlockMessage(this, reason);
    } else {
      // "It doesn't affect XXX!"
      message = i18next.t("abilityTriggers:moveImmunity", {
        pokemonNameWithAffix: getPokemonNameWithAffix(this),
      });
    }

    globalScene.phaseManager.queueMessage(message);
  }

  /**
   * Check if a status effect can be applied to this {@linkcode Pokemon}.
   *
   * @param effect - The {@linkcode StatusEffect} whose applicability is being checked
   * @param quiet - Whether to suppress in-battle messages for status checks; default `false`
   * @param overrideStatus - Whether to allow overriding the Pokemon's current status with a different one; default `false`
   * @param sourcePokemon - The {@linkcode Pokemon} applying the status effect to the target,
   * or `null` if the status is applied from a non-Pokemon source (hazards, etc.); default `null`
   * @param ignoreField - Whether to ignore field effects (weather, terrain, etc.) preventing status application;
   * default `false`
   * @returns Whether {@linkcode effect} can be applied to this Pokemon.
   */
  // TODO: Review and verify the message order precedence in mainline if multiple status-blocking effects are present at once
  // TODO: Make argument order consistent with `trySetStatus`
  public canSetStatus(
    effect: StatusEffect,
    quiet = false,
    overrideStatus = false,
    sourcePokemon: Pokemon | null = null,
    ignoreField = false,
  ): boolean {
    if (effect !== StatusEffect.FAINT) {
      // Status-overriding moves (i.e. Rest) fail if their respective status already exists;
      // all other moves fail if the target already has _any_ status
      if (overrideStatus ? this.status?.effect === effect : this.status || this.turnData.pendingStatus) {
        this.queueStatusImmuneMessage(quiet, overrideStatus ? "overlap" : "other"); // having different status displays generic fail message
        return false;
      }
      if (this.isGrounded() && !ignoreField && globalScene.arena.terrain?.terrainType === TerrainType.MISTY) {
        this.queueStatusImmuneMessage(quiet, TerrainType.MISTY);
        return false;
      }
    }

    const types = this.getTypes(true, true);

    /* Whether the target is immune to the specific status being applied. */
    let isImmune = false;
    /** The reason for a potential blockage; default "other" for type-based. */
    let reason: "other" | Exclude<TerrainType, TerrainType.NONE> = "other";

    switch (effect) {
      case StatusEffect.POISON:
      case StatusEffect.TOXIC:
        // Check for type based immunities and/or Corrosion from the applier.
        isImmune = types.some(defType => {
          // only 1 immunity needed to block
          if (defType !== PokemonType.POISON && defType !== PokemonType.STEEL) {
            return false;
          }

          // No source (such as from Toxic Spikes) = blocked by default
          if (!sourcePokemon) {
            return true;
          }

          const cancelImmunity = new BooleanHolder(false);
          // TODO: Determine if we need to pass `quiet` as the value for simulated in this call
          applyAbAttrs("IgnoreTypeStatusEffectImmunityAbAttr", {
            pokemon: sourcePokemon,
            cancelled: cancelImmunity,
            statusEffect: effect,
            defenderType: defType,
          });
          return !cancelImmunity.value;
        });
        break;
      case StatusEffect.PARALYSIS:
        isImmune = this.isOfType(PokemonType.ELECTRIC);
        break;
      case StatusEffect.SLEEP:
        isImmune = this.isGrounded() && globalScene.arena.getTerrainType() === TerrainType.ELECTRIC;
        reason = TerrainType.ELECTRIC;
        break;
      case StatusEffect.FREEZE: {
        const weatherType = globalScene.arena.getWeatherType();
        isImmune =
          this.isOfType(PokemonType.ICE)
          || (!ignoreField && (weatherType === WeatherType.SUNNY || weatherType === WeatherType.HARSH_SUN));
        break;
      }
      case StatusEffect.BURN:
        isImmune = this.isOfType(PokemonType.FIRE);
        break;
    }

    if (isImmune) {
      this.queueStatusImmuneMessage(quiet, reason);
      return false;
    }

    // Check for cancellations from self/ally abilities
    const cancelled = new BooleanHolder(false);
    applyAbAttrs("StatusEffectImmunityAbAttr", { pokemon: this, effect, cancelled, simulated: quiet });
    if (cancelled.value) {
      return false;
    }

    for (const pokemon of this.getAlliesGenerator()) {
      applyAbAttrs("UserFieldStatusEffectImmunityAbAttr", {
        pokemon,
        effect,
        cancelled,
        simulated: quiet,
        target: this,
        source: sourcePokemon,
      });
      if (cancelled.value) {
        return false;
      }
    }

    // Perform safeguard checks
    if (sourcePokemon && sourcePokemon !== this && this.isSafeguarded(sourcePokemon)) {
      if (!quiet) {
        globalScene.phaseManager.queueMessage(
          i18next.t("moveTriggers:safeguard", { targetName: getPokemonNameWithAffix(this) }),
        );
      }
      return false;
    }

    return true;
  }

  /**
   * Attempt to set this Pokemon's status to the specified condition.
   * Enqueues a new `ObtainStatusEffectPhase` to trigger animations, etc.
   * @param effect - The {@linkcode StatusEffect} to set
   * @param sourcePokemon - The {@linkcode Pokemon} applying the status effect to the target,
   * or `null` if the status is applied from a non-Pokemon source (hazards, etc.); default `null`
   * @param sleepTurnsRemaining - The number of turns to set {@linkcode StatusEffect.SLEEP} for;
   * defaults to a random number between 2 and 4 and is unused for non-Sleep statuses
   * @param sourceText - The text to show for the source of the status effect, if any; default `null`
   * @param overrideStatus - Whether to allow overriding the Pokemon's current status with a different one; default `false`
   * @param quiet - Whether to suppress in-battle messages for status checks; default `true`
   * @param overrideMessage - String containing text to be displayed upon status setting; defaults to normal key for status
   * and is used exclusively for Rest
   * @returns Whether the status effect phase was successfully created.
   * @see {@linkcode doSetStatus} - alternate function that sets status immediately (albeit without condition checks).
   */
  public trySetStatus(
    effect: StatusEffect,
    sourcePokemon: Pokemon | null = null,
    sleepTurnsRemaining?: number,
    sourceText: string | null = null,
    overrideStatus?: boolean,
    quiet = true,
    overrideMessage?: string,
  ): boolean {
    // TODO: This needs to propagate failure status for status moves
    if (!effect) {
      return false;
    }

    if (!this.canSetStatus(effect, quiet, overrideStatus, sourcePokemon)) {
      return false;
    }
    if (this.isFainted() && effect !== StatusEffect.FAINT) {
      return false;
    }

    /**
     * If this Pokemon falls asleep or freezes in the middle of a multi-hit attack,
     * cancel the attack's subsequent hits.
     */
    if (effect === StatusEffect.SLEEP || effect === StatusEffect.FREEZE) {
      const currentPhase = globalScene.phaseManager.getCurrentPhase();
      if (currentPhase.is("MoveEffectPhase") && currentPhase.getUserPokemon() === this) {
        this.turnData.hitCount = 1;
        this.turnData.hitsLeft = 1;
      }
    }

    if (overrideStatus) {
      this.resetStatus(false);
    } else {
      this.turnData.pendingStatus = effect;
    }

    globalScene.phaseManager.unshiftNew(
      "ObtainStatusEffectPhase",
      this.getBattlerIndex(),
      effect,
      sourcePokemon,
      sleepTurnsRemaining,
      sourceText,
      overrideMessage,
    );

    return true;
  }

  /**
   * Set this Pokemon's {@linkcode status | non-volatile status condition} to the specified effect.
   * @param effect - The {@linkcode StatusEffect} to set
   * @remarks
   * Clears this pokemon's `pendingStatus` in its {@linkcode Pokemon.turnData | turnData}.
   *
   * ⚠️ This method does **not** check for feasibility; that is the responsibility of the caller.
   */
  public doSetStatus(effect: Exclude<StatusEffect, StatusEffect.SLEEP>): void;
  /**
   * Set this Pokemon's {@linkcode status | non-volatile status condition} to the specified effect.
   * @param effect - {@linkcode StatusEffect.SLEEP}
   * @param sleepTurnsRemaining - The number of turns to inflict sleep for; defaults to a random number between 2 and 4
   * @remarks
   * Clears this pokemon's `pendingStatus` in its {@linkcode Pokemon#turnData}.
   *
   * ⚠️ This method does **not** check for feasibility; that is the responsibility of the caller.
   */
  public doSetStatus(effect: StatusEffect.SLEEP, sleepTurnsRemaining?: number): void;
  /**
   * Set this Pokemon's {@linkcode status | non-volatile status condition} to the specified effect.
   * @param effect - The {@linkcode StatusEffect} to set
   * @param sleepTurnsRemaining - The number of turns to inflict sleep for; defaults to a random number between 2 and 4
   * and is unused for all non-sleep Statuses
   * @remarks
   * Clears this pokemon's `pendingStatus` in its {@linkcode Pokemon#turnData}.
   *
   * ⚠️ This method does **not** check for feasibility; that is the responsibility of the caller.
   */
  public doSetStatus(effect: StatusEffect, sleepTurnsRemaining?: number): void;
  /**
   * Set this Pokemon's {@linkcode status | non-volatile status condition} to the specified effect.
   * @param effect - The {@linkcode StatusEffect} to set
   * @param sleepTurnsRemaining - The number of turns to inflict sleep for; defaults to a random number between 2 and 4
   * and is unused for all non-sleep Statuses
   * @remarks
   * Clears this pokemon's `pendingStatus` in its {@linkcode Pokemon#turnData}.
   *
   * ⚠️ This method does **not** check for feasibility; that is the responsibility of the caller.
   * @todo Make this and all related fields private and change tests to use a field-based helper or similar
   */
  public doSetStatus(
    effect: StatusEffect,
    sleepTurnsRemaining = effect !== StatusEffect.SLEEP ? 0 : this.randBattleSeedIntRange(2, 4),
  ): void {
    // Reset any pending status
    this.turnData.pendingStatus = StatusEffect.NONE;
    switch (effect) {
      case StatusEffect.POISON:
      case StatusEffect.TOXIC:
        this.setFrameRate(8);
        break;
      case StatusEffect.PARALYSIS:
        this.setFrameRate(5);
        break;
      case StatusEffect.SLEEP: {
        this.setFrameRate(3);

        // If the user is semi-invulnerable when put asleep (such as due to Yawm),
        // remove their invulnerability and cancel the upcoming move from the queue
        const invulnTagTypes = [
          BattlerTagType.FLYING,
          BattlerTagType.UNDERGROUND,
          BattlerTagType.UNDERWATER,
          BattlerTagType.HIDDEN,
        ];

        if (this.findTag(t => invulnTagTypes.includes(t.tagType))) {
          this.findAndRemoveTags(t => invulnTagTypes.includes(t.tagType));
          this.getMoveQueue().shift();
        }
        break;
      }
      case StatusEffect.FREEZE:
        this.setFrameRate(0);
        break;
      case StatusEffect.BURN:
        this.setFrameRate(14);
        break;
      case StatusEffect.FAINT:
        break;
      default:
        effect satisfies StatusEffect.NONE;
        break;
    }

    this.status = new Status(effect, 0, sleepTurnsRemaining);
  }

  /**
   * Queue the status cure message, reset the status, and update the info display
   * @param effect - The effect to cure. If this does not match the current status, nothing happens.
   * @param msg - A custom message to display when curing the status effect (used for curing freeze due to move use)
   */
  public cureStatus(effect: StatusEffect, msg?: string): void {
    if (effect !== this.status?.effect) {
      return;
    }
    // Freeze healed by move uses its own msg
    globalScene.phaseManager.queueMessage(msg ?? getStatusEffectHealText(effect, getPokemonNameWithAffix(this)));
    // cannot use `asPhase=true` as it will cause status to be reset _after_ this phase ends
    this.resetStatus(undefined, undefined, undefined, false);
    this.updateInfo();
  }
  /**
   * Reset this Pokémon's status
   * @param revive - Whether revive should be cured; default `true`
   * @param confusion - Whether to also cure confusion; default `false`
   * @param reloadAssets - Whether to reload the assets or not; default `false`
   * @param asPhase - Whether to reset the status in a phase or immediately; default `true`
   */
  resetStatus(revive = true, confusion = false, reloadAssets = false, asPhase = true): void {
    const lastStatus = this.status?.effect;
    if (!revive && lastStatus === StatusEffect.FAINT) {
      return;
    }

    if (asPhase) {
      globalScene.phaseManager.unshiftNew("ResetStatusPhase", this, confusion, reloadAssets);
    } else {
      this.clearStatus(confusion, reloadAssets);
    }
  }

  /**
   * Perform the action of clearing a Pokemon's status
   * @remarks
   * This is a helper to {@linkcode resetStatus}, which should be called directly instead of this method
   * @param confusion - Whether to also clear this Pokémon's confusion
   * @param reloadAssets - Whether to reload this pokemon's assets
   */
  public clearStatus(confusion: boolean, reloadAssets: boolean) {
    const lastStatus = this.status?.effect;
    this.status = null;
    this.setFrameRate(10);
    if (lastStatus === StatusEffect.SLEEP && this.getTag(BattlerTagType.NIGHTMARE)) {
      this.lapseTag(BattlerTagType.NIGHTMARE);
    }
    if (confusion && this.getTag(BattlerTagType.CONFUSED)) {
      this.lapseTag(BattlerTagType.CONFUSED);
    }
    if (reloadAssets) {
      this.loadAssets(false).then(() => this.playAnim());
    }
    this.updateInfo(true);
  }

  /**
   * Check if this Pokémon is protected by Safeguard
   * @param attacker - The Pokémon responsible for the interaction that needs to check against Safeguard
   * @returns Whether this Pokémon is protected by Safeguard
   */
  public isSafeguarded(attacker: Pokemon): boolean {
    const defendingSide = this.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    if (globalScene.arena.getTagOnSide(ArenaTagType.SAFEGUARD, defendingSide)) {
      const bypassed = new BooleanHolder(false);
      if (attacker) {
        applyAbAttrs("InfiltratorAbAttr", { pokemon: attacker, bypassed });
      }
      return !bypassed.value;
    }
    return false;
  }

  /**
   * Perform miscellaneous setup for when the Pokemon is summoned, like generating the substitute sprite
   * @param resetSummonData - Whether to additionally reset the Pokemon's summon data (default: `false`)
   */
  public fieldSetup(resetSummonData?: boolean): void {
    this.switchOutStatus = false;
    if (globalScene) {
      globalScene.triggerPokemonFormChange(this, SpeciesFormChangePostMoveTrigger, true);
    }
    // If this Pokemon has a Substitute when loading in, play an animation to add its sprite
    if (this.getTag(SubstituteTag)) {
      globalScene.triggerPokemonBattleAnim(this, PokemonAnimType.SUBSTITUTE_ADD);
      this.getTag(SubstituteTag)!.sourceInFocus = false;
    }

    // If this Pokemon has Commander and Dondozo as an active ally, hide this Pokemon's sprite.
    if (
      this.hasAbilityWithAttr("CommanderAbAttr")
      && globalScene.currentBattle.double
      && this.getAlly()?.species.speciesId === SpeciesId.DONDOZO
    ) {
      this.setVisible(false);
    }

    if (resetSummonData) {
      this.resetSummonData();
    }
  }

  /**
   * Reset this Pokemon's {@linkcode PokemonSummonData | SummonData} and {@linkcode PokemonTempSummonData | TempSummonData}
   * in preparation for switching pokemon, as well as removing any relevant on-switch tags.
   */
  public resetSummonData(): void {
    if (this.summonData.speciesForm) {
      this.summonData.speciesForm = null;
      this.updateFusionPalette();
    }
    this.summonData = new PokemonSummonData();
    this.tempSummonData = new PokemonTempSummonData();
    this.updateInfo();
  }

  /**
   * Reset this Pokémon's per-battle {@linkcode PokemonBattleData | battleData}
   * as well as any transient {@linkcode PokemonWaveData | waveData} for the current wave.
   *
   * @remarks
   * Should be called once per arena transition (new biome/trainer battle/Mystery Encounter).
   */
  public resetBattleAndWaveData(): void {
    this.battleData = new PokemonBattleData();
    this.resetWaveData();
  }

  /**
   * Reset this Pokémon's {@linkcode PokemonWaveData | waveData}
   *
   * @remarks
   * Should be called upon starting a new wave in addition to whenever an arena transition occurs.
   * @see {@linkcode resetBattleAndWaveData}
   */
  resetWaveData(): void {
    this.waveData = new PokemonWaveData();
    this.tempSummonData.waveTurnCount = 1;
  }

  /**
   * Reset this Pokémon's Terastallization state
   *
   * @remarks
   * Responsible for all of the cleanup required when a pokemon goes from being
   * terastallized to no longer terastallized:
   * - Resetting stellar type boosts
   * - Updating the Pokémon's terastallization-dependent form
   * - Adjusting the sprite pipeline to remove the Tera effect
   */
  resetTera(): void {
    const wasTerastallized = this.isTerastallized;
    this.isTerastallized = false;
    this.stellarTypesBoosted = [];
    if (wasTerastallized) {
      this.updateSpritePipelineData();
      globalScene.triggerPokemonFormChange(this, SpeciesFormChangeLapseTeraTrigger);
    }
  }

  /**
   * Clear this Pokémon's transient turn data
   */
  resetTurnData(): void {
    this.turnData = new PokemonTurnData();
  }

  getExpValue(): number {
    // Logic to factor in victor level has been removed for balancing purposes, so the player doesn't have to focus on EXP maxxing
    return (this.getSpeciesForm().getBaseExp() * this.level) / 5 + 1;
  }

  //#region Sprite and Animation Methods
  setFrameRate(frameRate: number) {
    globalScene.anims.get(this.getBattleSpriteKey()).frameRate = frameRate;
    try {
      this.getSprite().play(this.getBattleSpriteKey());
    } catch (err: unknown) {
      console.error(`Failed to play animation for ${this.getBattleSpriteKey()}`, err);
    }
    try {
      this.getTintSprite()?.play(this.getBattleSpriteKey());
    } catch (err: unknown) {
      console.error(`Failed to play animation for ${this.getBattleSpriteKey()}`, err);
    }
  }

  tint(color: number, alpha?: number, duration?: number, ease?: string) {
    const tintSprite = this.getTintSprite();
    tintSprite?.setTintFill(color);
    tintSprite?.setVisible(true);

    if (duration) {
      tintSprite?.setAlpha(0);

      globalScene.tweens.add({
        targets: tintSprite,
        alpha: alpha || 1,
        duration,
        ease: ease || "Linear",
      });
    } else {
      tintSprite?.setAlpha(alpha);
    }
  }

  untint(duration: number, ease?: string) {
    const tintSprite = this.getTintSprite();

    if (duration) {
      globalScene.tweens.add({
        targets: tintSprite,
        alpha: 0,
        duration,
        ease: ease || "Linear",
        onComplete: () => {
          tintSprite?.setVisible(false);
          tintSprite?.setAlpha(1);
        },
      });
    } else {
      tintSprite?.setVisible(false);
      tintSprite?.setAlpha(1);
    }
  }

  enableMask() {
    if (!this.maskEnabled) {
      this.maskSprite = this.getTintSprite();
      this.maskSprite?.setVisible(true);
      this.maskSprite?.setPosition(
        this.x * this.parentContainer.scale + this.parentContainer.x,
        this.y * this.parentContainer.scale + this.parentContainer.y,
      );
      this.maskSprite?.setScale(this.getSpriteScale() * this.parentContainer.scale);
      this.maskEnabled = true;
    }
  }

  disableMask() {
    if (this.maskEnabled) {
      this.maskSprite?.setVisible(false);
      this.maskSprite?.setPosition(0, 0);
      this.maskSprite?.setScale(this.getSpriteScale());
      this.maskSprite = null;
      this.maskEnabled = false;
    }
  }

  /** Play the shiny sparkle animation and effects, if applicable */
  sparkle(): void {
    if (this.shinySparkle) {
      doShinySparkleAnim(this.shinySparkle, this.variant);
    }
  }

  updateFusionPalette(ignoreOverride?: boolean): void {
    if (!this.getFusionSpeciesForm(ignoreOverride)) {
      [this.getSprite(), this.getTintSprite()]
        .filter(s => !!s)
        .map(s => {
          s.pipelineData[`spriteColors${ignoreOverride && this.summonData.speciesForm ? "Base" : ""}`] = [];
          s.pipelineData[`fusionSpriteColors${ignoreOverride && this.summonData.speciesForm ? "Base" : ""}`] = [];
        });
      return;
    }

    const speciesForm = this.getSpeciesForm(ignoreOverride);
    const fusionSpeciesForm = this.getFusionSpeciesForm(ignoreOverride);

    const spriteKey = speciesForm.getSpriteKey(
      this.getGender(ignoreOverride) === Gender.FEMALE,
      speciesForm.formIndex,
      this.shiny,
      this.variant,
    );
    const backSpriteKey = speciesForm
      .getSpriteKey(this.getGender(ignoreOverride) === Gender.FEMALE, speciesForm.formIndex, this.shiny, this.variant)
      .replace("pkmn__", "pkmn__back__");
    const fusionSpriteKey = fusionSpeciesForm.getSpriteKey(
      this.getFusionGender(ignoreOverride) === Gender.FEMALE,
      fusionSpeciesForm.formIndex,
      this.fusionShiny,
      this.fusionVariant,
    );
    const fusionBackSpriteKey = fusionSpeciesForm
      .getSpriteKey(
        this.getFusionGender(ignoreOverride) === Gender.FEMALE,
        fusionSpeciesForm.formIndex,
        this.fusionShiny,
        this.fusionVariant,
      )
      .replace("pkmn__", "pkmn__back__");

    const sourceTexture = globalScene.textures.get(spriteKey);
    const sourceBackTexture = globalScene.textures.get(backSpriteKey);
    const fusionTexture = globalScene.textures.get(fusionSpriteKey);
    const fusionBackTexture = globalScene.textures.get(fusionBackSpriteKey);

    const [sourceFrame, sourceBackFrame, fusionFrame, fusionBackFrame] = [
      sourceTexture,
      sourceBackTexture,
      fusionTexture,
      fusionBackTexture,
    ].map(texture => texture.frames[texture.firstFrame]);
    const [sourceImage, sourceBackImage, fusionImage, fusionBackImage] = [
      sourceTexture,
      sourceBackTexture,
      fusionTexture,
      fusionBackTexture,
    ].map(i => i.getSourceImage() as HTMLImageElement);

    const canvas = document.createElement("canvas");
    const backCanvas = document.createElement("canvas");
    const fusionCanvas = document.createElement("canvas");
    const fusionBackCanvas = document.createElement("canvas");

    const spriteColors: number[][] = [];
    const pixelData: Uint8ClampedArray[] = [];

    [canvas, backCanvas, fusionCanvas, fusionBackCanvas].forEach((canv: HTMLCanvasElement, c: number) => {
      const context = canv.getContext("2d");
      const frame = [sourceFrame, sourceBackFrame, fusionFrame, fusionBackFrame][c];
      canv.width = frame.width;
      canv.height = frame.height;

      if (context) {
        context.drawImage(
          [sourceImage, sourceBackImage, fusionImage, fusionBackImage][c],
          frame.cutX,
          frame.cutY,
          frame.width,
          frame.height,
          0,
          0,
          frame.width,
          frame.height,
        );
        const imageData = context.getImageData(frame.cutX, frame.cutY, frame.width, frame.height);
        pixelData.push(imageData.data);
      }
    });

    for (let f = 0; f < 2; f++) {
      const variantColors = variantColorCache[!f ? spriteKey : backSpriteKey];
      const variantColorSet = new Map<number, number[]>();
      if (this.shiny && variantColors && variantColors[this.variant]) {
        Object.keys(variantColors[this.variant]).forEach(k => {
          variantColorSet.set(
            rgbaToInt(Array.from(Object.values(rgbHexToRgba(k)))),
            Array.from(Object.values(rgbHexToRgba(variantColors[this.variant][k]))),
          );
        });
      }

      for (let i = 0; i < pixelData[f].length; i += 4) {
        if (pixelData[f][i + 3]) {
          const pixel = pixelData[f].slice(i, i + 4);
          let [r, g, b, a] = pixel;
          if (variantColors) {
            const color = rgbaToInt([r, g, b, a]);
            if (variantColorSet.has(color)) {
              const mappedPixel = variantColorSet.get(color);
              if (mappedPixel) {
                [r, g, b, a] = mappedPixel;
              }
            }
          }
          if (!spriteColors.find(c => c[0] === r && c[1] === g && c[2] === b)) {
            spriteColors.push([r, g, b, a]);
          }
        }
      }
    }

    const fusionSpriteColors = JSON.parse(JSON.stringify(spriteColors));

    const pixelColors: number[] = [];
    for (let f = 0; f < 2; f++) {
      for (let i = 0; i < pixelData[f].length; i += 4) {
        const total = pixelData[f].slice(i, i + 3).reduce((total: number, value: number) => total + value, 0);
        if (!total) {
          continue;
        }
        pixelColors.push(
          argbFromRgba({
            r: pixelData[f][i],
            g: pixelData[f][i + 1],
            b: pixelData[f][i + 2],
            a: pixelData[f][i + 3],
          }),
        );
      }
    }

    const fusionPixelColors: number[] = [];
    for (let f = 0; f < 2; f++) {
      const variantColors = variantColorCache[!f ? fusionSpriteKey : fusionBackSpriteKey];
      const variantColorSet = new Map<number, number[]>();
      if (this.fusionShiny && variantColors && variantColors[this.fusionVariant]) {
        for (const k of Object.keys(variantColors[this.fusionVariant])) {
          variantColorSet.set(
            rgbaToInt(Array.from(Object.values(rgbHexToRgba(k)))),
            Array.from(Object.values(rgbHexToRgba(variantColors[this.fusionVariant][k]))),
          );
        }
      }
      for (let i = 0; i < pixelData[2 + f].length; i += 4) {
        const total = pixelData[2 + f].slice(i, i + 3).reduce((total: number, value: number) => total + value, 0);
        if (!total) {
          continue;
        }
        let [r, g, b, a] = [
          pixelData[2 + f][i],
          pixelData[2 + f][i + 1],
          pixelData[2 + f][i + 2],
          pixelData[2 + f][i + 3],
        ];
        if (variantColors) {
          const color = rgbaToInt([r, g, b, a]);
          if (variantColorSet.has(color)) {
            const mappedPixel = variantColorSet.get(color);
            if (mappedPixel) {
              [r, g, b, a] = mappedPixel;
            }
          }
        }
        fusionPixelColors.push(argbFromRgba({ r, g, b, a }));
      }
    }

    if (fusionPixelColors.length === 0) {
      // ERROR HANDLING IS NOT OPTIONAL BUDDY
      console.log("Failed to create fusion palette");
      return;
    }

    let paletteColors: Map<number, number>;
    let fusionPaletteColors: Map<number, number>;

    const originalRandom = Math.random;
    Math.random = () => randSeedFloat();

    globalScene.executeWithSeedOffset(
      () => {
        paletteColors = QuantizerCelebi.quantize(pixelColors, 4);
        fusionPaletteColors = QuantizerCelebi.quantize(fusionPixelColors, 4);
      },
      0,
      "This result should not vary",
    );

    Math.random = originalRandom;

    paletteColors = paletteColors!; // erroneously tell TS compiler that paletteColors is defined!
    fusionPaletteColors = fusionPaletteColors!; // mischievously misinform TS compiler that fusionPaletteColors is defined!
    const [palette, fusionPalette] = [paletteColors, fusionPaletteColors].map(paletteColors => {
      let keys = Array.from(paletteColors.keys()).sort((a: number, b: number) =>
        paletteColors.get(a)! < paletteColors.get(b)! ? 1 : -1,
      );
      let rgbaColors: Map<number, number[]>;
      let hsvColors: Map<number, number[]>;

      const mappedColors = new Map<number, number[]>();

      do {
        mappedColors.clear();

        rgbaColors = keys.reduce((map: Map<number, number[]>, k: number) => {
          map.set(k, Object.values(rgbaFromArgb(k)));
          return map;
        }, new Map<number, number[]>());
        hsvColors = Array.from(rgbaColors.keys()).reduce((map: Map<number, number[]>, k: number) => {
          const rgb = rgbaColors.get(k)!.slice(0, 3);
          map.set(k, rgbToHsv(rgb[0], rgb[1], rgb[2]));
          return map;
        }, new Map<number, number[]>());

        for (let c = keys.length - 1; c >= 0; c--) {
          const hsv = hsvColors.get(keys[c])!;
          for (let c2 = 0; c2 < c; c2++) {
            const hsv2 = hsvColors.get(keys[c2])!;
            const diff = Math.abs(hsv[0] - hsv2[0]);
            if (diff < 30 || diff >= 330) {
              if (mappedColors.has(keys[c])) {
                mappedColors.get(keys[c])!.push(keys[c2]);
              } else {
                mappedColors.set(keys[c], [keys[c2]]);
              }
              break;
            }
          }
        }

        mappedColors.forEach((values: number[], key: number) => {
          const keyColor = rgbaColors.get(key)!;
          const valueColors = values.map(v => rgbaColors.get(v)!);
          const color = keyColor.slice(0);
          let count = paletteColors.get(key)!;
          for (const value of values) {
            const valueCount = paletteColors.get(value);
            if (!valueCount) {
              continue;
            }
            count += valueCount;
          }

          for (let c = 0; c < 3; c++) {
            color[c] *= paletteColors.get(key)! / count;
            values.forEach((value: number, i: number) => {
              if (paletteColors.has(value)) {
                const valueCount = paletteColors.get(value)!;
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

          paletteColors.set(
            argbFromRgba({
              r: color[0],
              g: color[1],
              b: color[2],
              a: color[3],
            }),
            count,
          );
        });

        keys = Array.from(paletteColors.keys()).sort((a: number, b: number) =>
          paletteColors.get(a)! < paletteColors.get(b)! ? 1 : -1,
        );
      } while (mappedColors.size > 0);

      return keys.map(c => Object.values(rgbaFromArgb(c)));
    });

    const paletteDeltas: number[][] = [];

    spriteColors.forEach((sc: number[], i: number) => {
      paletteDeltas.push([]);
      for (const p of palette) {
        paletteDeltas[i].push(deltaRgb(sc, p));
      }
    });

    const easeFunc = Phaser.Tweens.Builders.GetEaseFunction("Cubic.easeIn");

    for (let sc = 0; sc < spriteColors.length; sc++) {
      const delta = Math.min(...paletteDeltas[sc]);
      const paletteIndex = Math.min(paletteDeltas[sc].indexOf(delta), fusionPalette.length - 1);
      if (delta < 255) {
        const ratio = easeFunc(delta / 255);
        const color = [0, 0, 0, fusionSpriteColors[sc][3]];
        for (let c = 0; c < 3; c++) {
          color[c] = Math.round(fusionSpriteColors[sc][c] * ratio + fusionPalette[paletteIndex][c] * (1 - ratio));
        }
        fusionSpriteColors[sc] = color;
      }
    }

    [this.getSprite(), this.getTintSprite()]
      .filter(s => !!s)
      .map(s => {
        s.pipelineData[`spriteColors${ignoreOverride && this.summonData.speciesForm ? "Base" : ""}`] = spriteColors;
        s.pipelineData[`fusionSpriteColors${ignoreOverride && this.summonData.speciesForm ? "Base" : ""}`] =
          fusionSpriteColors;
      });

    canvas.remove();
    fusionCanvas.remove();
  }

  //#endregion Sprite and Animation Methods

  /**
   * Generate a random number using the current battle's seed, or the global seed if `globalScene.currentBattle` is falsy
   *
   * @remarks
   * This calls either {@linkcode BattleScene.randBattleSeedInt}({@linkcode range}, {@linkcode min}) in `src/battle-scene.ts`
   * which calls {@linkcode Battle.randSeedInt}({@linkcode range}, {@linkcode min}) in `src/battle.ts`
   * which calls {@linkcode randSeedInt randSeedInt}({@linkcode range}, {@linkcode min}) in `src/utils.ts`,
   * or it directly calls {@linkcode randSeedInt randSeedInt}({@linkcode range}, {@linkcode min}) in `src/utils.ts` if there is no current battle
   *
   * @param range - How large of a range of random numbers to choose from. If {@linkcode range} <= 1, returns {@linkcode min}
   * @param min - The minimum integer to pick; default `0`
   * @returns A random integer between {@linkcode min} and ({@linkcode min} + {@linkcode range} - 1)
   */
  randBattleSeedInt(range: number, min = 0): number {
    return globalScene.currentBattle ? globalScene.randBattleSeedInt(range, min) : randSeedInt(range, min);
  }

  /**
   * Generate a random number using the current battle's seed, or the global seed if `globalScene.currentBattle` is falsy
   * @param min - The minimum integer to generate
   * @param max - The maximum integer to generate
   * @returns A random integer between {@linkcode min} and {@linkcode max} (inclusive)
   */
  randBattleSeedIntRange(min: number, max: number): number {
    return globalScene.currentBattle ? globalScene.randBattleSeedInt(max - min + 1, min) : randSeedIntRange(min, max);
  }

  /**
   * Causes a Pokemon to leave the field (such as in preparation for a switch out/escape).
   * @param clearEffects - Indicates if effects should be cleared (true) or passed
   *    to the next pokemon, such as during a baton pass (false)
   * @param hideInfo - Indicates if this should also play the animation to hide the Pokemon's
   * info container.
   */
  leaveField(clearEffects = true, hideInfo = true, destroy = false) {
    this.resetSprite();
    this.resetTurnData();
    for (const p of inSpeedOrder(ArenaTagSide.BOTH)) {
      if (p !== this) {
        p.removeTagsBySourceId(this.id);
      }
    }

    if (clearEffects) {
      this.destroySubstitute();
      this.resetSummonData();
    }
    if (hideInfo) {
      this.hideInfo();
    }
    // Trigger abilities that activate upon leaving the field
    applyAbAttrs("PreLeaveFieldAbAttr", { pokemon: this });
    this.switchOutStatus = true;
    globalScene.triggerPokemonFormChange(this, SpeciesFormChangeActiveTrigger, true);
    globalScene.field.remove(this, destroy);
  }

  /**
   * @inheritdoc {@linkcode Phaser.GameObjects.Container#destroy}
   *
   * ### Custom Behavior
   * In addition to the base `destroy` behavior, this also destroys the Pokemon's
   * {@linkcode battleInfo} and substitute sprite (as applicable).
   */
  destroy(): void {
    this.battleInfo?.destroy();
    this.destroySubstitute();
    super.destroy();
  }

  // TODO: Turn this into a getter
  getBattleInfo(): BattleInfo {
    return this.battleInfo;
  }

  /**
   * Check whether or not this Pokémon's root form has the same ability
   * @param abilityIndex - The ability index to check
   * @returns Whether the Pokemon's root form has the same ability
   */
  hasSameAbilityInRootForm(abilityIndex: number): boolean {
    const currentAbilityIndex = this.abilityIndex;
    const rootForm = getPokemonSpecies(this.species.getRootSpeciesId());
    return rootForm.getAbility(abilityIndex) === rootForm.getAbility(currentAbilityIndex);
  }

  /**
   * Helper function to check if the player already owns the starter data of this Pokémon's
   * current ability
   * @param ownedAbilityAttrs - The owned abilityAttr of this Pokemon's root form
   * @returns true if the player already has it, false otherwise
   */
  checkIfPlayerHasAbilityOfStarter(ownedAbilityAttrs: number): boolean {
    if ((ownedAbilityAttrs & 1) > 0 && this.hasSameAbilityInRootForm(0)) {
      return true;
    }
    if ((ownedAbilityAttrs & 2) > 0 && this.hasSameAbilityInRootForm(1)) {
      return true;
    }
    return (ownedAbilityAttrs & 4) > 0 && this.hasSameAbilityInRootForm(2);
  }

  /**
   * Reduces one of this Pokemon's held item stacks by 1, removing it if applicable.
   * Does nothing if this Pokemon is somehow not the owner of the held item.
   * @param heldItem - The item stack to be reduced.
   * @param forBattle - Whether to trigger in-battle effects (such as Unburden) after losing the item. Default: `true`
   * Should be `false` for all item loss occurring outside of battle (MEs, etc.).
   * @returns Whether the item was removed successfully.
   */
  public loseHeldItem(heldItem: PokemonHeldItemModifier, forBattle = true): boolean {
    // TODO: What does a -1 pokemon id mean?
    if (heldItem.pokemonId !== -1 && heldItem.pokemonId !== this.id) {
      return false;
    }

    heldItem.stackCount--;
    if (heldItem.stackCount <= 0) {
      globalScene.removeModifier(heldItem, this.isEnemy());
    }
    if (forBattle) {
      applyAbAttrs("PostItemLostAbAttr", { pokemon: this });
    }

    return true;
  }

  /**
   * Record a berry being eaten for ability and move triggers.
   * Only tracks things that proc _every_ time a berry is eaten.
   * @param berryType - The type of berry being eaten.
   * @param updateHarvest - Whether to track the berry for harvest; default `true`.
   */
  public recordEatenBerry(berryType: BerryType, updateHarvest = true) {
    this.battleData.hasEatenBerry = true;
    if (updateHarvest) {
      // Only track for harvest if we actually consumed the berry
      this.battleData.berriesEaten.push(berryType);
    }
    this.turnData.berriesEaten.push(berryType);
  }

  /**
   * Get the number of persistent treasure items this Pokemon has
   * @remarks
   * Persistent treasure items are defined as held items that give money
   * after battle, such as the Lucky Egg or the Amulet Coin.
   * Used exclusively for Gimmighoul's evolution condition
   * @returns The number of persistent treasure items this Pokémon has
   */
  getPersistentTreasureCount(): number {
    return (
      this.getHeldItems().filter(m => m.is("DamageMoneyRewardModifier")).length
      + globalScene.findModifiers(m => m.is("MoneyMultiplierModifier") || m.is("ExtraModifierModifier")).length
    );
  }
}

export class PlayerPokemon extends Pokemon {
  protected declare battleInfo: PlayerBattleInfo;
  public compatibleTms: MoveId[];

  constructor(
    species: PokemonSpecies,
    level: number,
    abilityIndex?: number,
    formIndex?: number,
    gender?: Gender,
    shiny?: boolean,
    variant?: Variant,
    ivs?: number[],
    nature?: Nature,
    dataSource?: Pokemon | PokemonData,
  ) {
    super(106, 148, species, level, abilityIndex, formIndex, gender, shiny, variant, ivs, nature, dataSource);

    if (Overrides.STATUS_OVERRIDE) {
      this.status = new Status(Overrides.STATUS_OVERRIDE, 0, 4);
    }

    if (Overrides.SHINY_OVERRIDE) {
      this.shiny = true;
      this.initShinySparkle();
    } else if (Overrides.SHINY_OVERRIDE === false) {
      this.shiny = false;
    }

    if (Overrides.VARIANT_OVERRIDE !== null && this.shiny) {
      this.variant = Overrides.VARIANT_OVERRIDE;
    }

    if (!dataSource) {
      if (
        globalScene.gameMode.isDaily // Keldeo is excluded due to crashes involving its signature move and the associated form change
        || (Overrides.STARTER_SPECIES_OVERRIDE && Overrides.STARTER_SPECIES_OVERRIDE !== SpeciesId.KELDEO)
      ) {
        this.generateAndPopulateMoveset();
      } else {
        this.moveset = [];
      }
    }
    this.generateCompatibleTms();
  }

  initBattleInfo(): void {
    this.battleInfo = new PlayerBattleInfo();
    this.battleInfo.initInfo(this);
  }

  override isPlayer(): this is PlayerPokemon {
    return true;
  }

  override isEnemy(): this is EnemyPokemon {
    return false;
  }

  override hasTrainer(): boolean {
    return true;
  }

  override isBoss(): boolean {
    return false;
  }

  getFieldIndex(): number {
    return globalScene.getPlayerField().indexOf(this);
  }

  getBattlerIndex(): BattlerIndex {
    return this.getFieldIndex();
  }

  generateCompatibleTms(): void {
    this.compatibleTms = [];

    const tms = Object.keys(tmSpecies);
    for (const tm of tms) {
      const moveId = Number.parseInt(tm) as MoveId;
      let compatible = false;
      for (const p of tmSpecies[tm]) {
        if (Array.isArray(p)) {
          const [pkm, form] = p;
          if (
            (pkm === this.species.speciesId || (this.fusionSpecies && pkm === this.fusionSpecies.speciesId))
            && form === this.getFormKey()
          ) {
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

  /**
   * Attempt to populate this Pokemon's moveset based on those from a Starter
   * @param moveset - The {@linkcode StarterMoveset} to use; will override corresponding slots
   * of this Pokemon's moveset
   * @param ignoreValidate - Whether to ignore validating the passed-in moveset; default `false`
   */
  tryPopulateMoveset(moveset: StarterMoveset, ignoreValidate = false): void {
    // TODO: Why do we need to re-validate starter movesets after picking them?
    if (
      !ignoreValidate
      && !this.getSpeciesForm().validateStarterMoveset(
        moveset,
        globalScene.gameData.starterData[this.species.getRootSpeciesId()].eggMoves,
      )
    ) {
      return;
    }

    moveset.forEach((m, i) => {
      this.moveset[i] = new PokemonMove(m);
    });
  }

  /**
   * Cause this Pokémon to leave the field (via {@linkcode leaveField}) and then
   * open the party switcher UI to switch in a new Pokémon
   * @param switchType - The type of this switch-out. If this is
   * `BATON_PASS` or `SHED_TAIL`, this Pokémon's effects are not cleared upon leaving
   * the field.
   */
  switchOut(switchType: SwitchType = SwitchType.SWITCH): Promise<void> {
    return new Promise(resolve => {
      this.leaveField(switchType === SwitchType.SWITCH);

      globalScene.ui.setMode(
        UiMode.PARTY,
        PartyUiMode.FAINT_SWITCH,
        this.getFieldIndex(),
        (slotIndex: number, _option: PartyOption) => {
          if (slotIndex >= globalScene.currentBattle.getBattlerCount() && slotIndex < 6) {
            globalScene.phaseManager.queueDeferred(
              "SwitchSummonPhase",
              switchType,
              this.getFieldIndex(),
              slotIndex,
              false,
            );
          }
          globalScene.ui.setMode(UiMode.MESSAGE).then(resolve);
        },
        PartyUiHandler.FilterNonFainted,
      );
    });
  }
  /**
   * Add friendship to this Pokemon
   *
   * @remarks
   * This adds friendship to the pokemon's friendship stat (used for evolution, return, etc.) and candy progress.
   * For fusions, candy progress for each species in the fusion is halved.
   *
   * @param friendship - The amount of friendship to add. Negative values will reduce friendship, though not below 0.
   * @param capped - If true, don't allow the friendship gain to exceed {@linkcode RARE_CANDY_FRIENDSHIP_CAP}. Used to cap friendship gains from rare candies.
   */
  addFriendship(friendship: number, capped = false): void {
    // Short-circuit friendship loss, which doesn't impact candy friendship
    if (friendship <= 0) {
      this.friendship = Math.max(this.friendship + friendship, 0);
      return;
    }

    const starterSpeciesId = this.species.getRootSpeciesId();
    const fusionStarterSpeciesId = this.isFusion() && this.fusionSpecies ? this.fusionSpecies.getRootSpeciesId() : 0;
    const starterGameData = globalScene.gameData.starterData;
    const starterData: [StarterDataEntry, SpeciesId][] = [[starterGameData[starterSpeciesId], starterSpeciesId]];
    if (fusionStarterSpeciesId) {
      starterData.push([starterGameData[fusionStarterSpeciesId], fusionStarterSpeciesId]);
    }
    const amount = new NumberHolder(friendship);
    globalScene.applyModifier(PokemonFriendshipBoosterModifier, true, this, amount);
    friendship = amount.value;

    const newFriendship = this.friendship + friendship;
    /** If capped is true, don't allow friendship gain to exceed {@linkcode RARE_CANDY_FRIENDSHIP_CAP} */
    const finalFriendship =
      capped && newFriendship > RARE_CANDY_FRIENDSHIP_CAP
        ? Math.max(RARE_CANDY_FRIENDSHIP_CAP, this.friendship)
        : newFriendship;

    this.friendship = Math.min(finalFriendship, 255);
    if (this.friendship >= 255) {
      globalScene.validateAchv(achvs.MAX_FRIENDSHIP);
      awardRibbonsToSpeciesLine(this.species.speciesId, RibbonData.FRIENDSHIP);
    }

    let candyFriendshipMultiplier = globalScene.gameMode.isClassic
      ? timedEventManager.getClassicFriendshipMultiplier()
      : 1;
    if (fusionStarterSpeciesId) {
      candyFriendshipMultiplier /= timedEventManager.areFusionsBoosted() ? 1.5 : 2;
    }
    const candyFriendshipAmount = Math.floor(friendship * candyFriendshipMultiplier);
    // Add to candy progress for this mon's starter species and its fused species (if it has one)
    starterData.forEach(([sd, id]: [StarterDataEntry, SpeciesId]) => {
      sd.friendship = (sd.friendship || 0) + candyFriendshipAmount;
      if (sd.friendship >= getStarterValueFriendshipCap(speciesStarterCosts[id])) {
        globalScene.gameData.addStarterCandy(getPokemonSpecies(id), 1);
        sd.friendship = 0;
      }
    });
  }

  getPossibleEvolution(evolution: SpeciesFormEvolution | null): Promise<Pokemon> {
    if (!evolution) {
      return new Promise(resolve => resolve(this));
    }
    return new Promise(resolve => {
      const evolutionSpecies = getPokemonSpecies(evolution.speciesId);
      const isFusion = evolution instanceof FusionSpeciesFormEvolution;
      let ret: PlayerPokemon;
      if (isFusion) {
        const originalFusionSpecies = this.fusionSpecies;
        const originalFusionFormIndex = this.fusionFormIndex;
        this.fusionSpecies = evolutionSpecies;
        this.fusionFormIndex =
          evolution.evoFormKey !== null
            ? Math.max(
                evolutionSpecies.forms.findIndex(f => f.formKey === evolution.evoFormKey),
                0,
              )
            : this.fusionFormIndex;
        ret = globalScene.addPlayerPokemon(
          this.species,
          this.level,
          this.abilityIndex,
          this.formIndex,
          this.gender,
          this.shiny,
          this.variant,
          this.ivs,
          this.nature,
          this,
        );
        this.fusionSpecies = originalFusionSpecies;
        this.fusionFormIndex = originalFusionFormIndex;
      } else {
        const formIndex =
          evolution.evoFormKey !== null && !isFusion
            ? Math.max(
                evolutionSpecies.forms.findIndex(f => f.formKey === evolution.evoFormKey),
                0,
              )
            : this.formIndex;
        ret = globalScene.addPlayerPokemon(
          !isFusion ? evolutionSpecies : this.species,
          this.level,
          this.abilityIndex,
          formIndex,
          this.gender,
          this.shiny,
          this.variant,
          this.ivs,
          this.nature,
          this,
        );
      }
      ret.loadAssets().then(() => resolve(ret));
    });
  }

  evolve(evolution: SpeciesFormEvolution | null, preEvolution: PokemonSpeciesForm): Promise<void> {
    if (!evolution) {
      return new Promise(resolve => resolve());
    }
    return new Promise(resolve => {
      this.pauseEvolutions = false;
      // Handles Nincada evolving into Ninjask + Shedinja
      this.handleSpecialEvolutions(evolution);
      const isFusion = evolution instanceof FusionSpeciesFormEvolution;
      if (!isFusion) {
        this.species = getPokemonSpecies(evolution.speciesId);
      } else {
        this.fusionSpecies = getPokemonSpecies(evolution.speciesId);
      }
      if (evolution.preFormKey !== null) {
        const formIndex = Math.max(
          (!isFusion || !this.fusionSpecies ? this.species : this.fusionSpecies).forms.findIndex(
            f => f.formKey === evolution.evoFormKey,
          ),
          0,
        );
        if (!isFusion) {
          this.formIndex = formIndex;
        } else {
          this.fusionFormIndex = formIndex;
        }
      }
      this.generateName();
      if (!isFusion) {
        const abilityCount = this.getSpeciesForm().getAbilityCount();
        const preEvoAbilityCount = preEvolution.getAbilityCount();
        if ([0, 1, 2].includes(this.abilityIndex)) {
          // Handles cases where a Pokemon with 3 abilities evolves into a Pokemon with 2 abilities (ie: Eevee -> any Eeveelution)
          if (this.abilityIndex === 2 && preEvoAbilityCount === 3 && abilityCount === 2) {
            this.abilityIndex = 1;
          }
        } else {
          // Prevent pokemon with an illegal ability value from breaking things
          console.warn("this.abilityIndex is somehow an illegal value, please report this");
          console.warn(this.abilityIndex);
          this.abilityIndex = 0;
        }
      } else {
        // Do the same as above, but for fusions
        const abilityCount = this.getFusionSpeciesForm().getAbilityCount();
        const preEvoAbilityCount = preEvolution.getAbilityCount();
        if ([0, 1, 2].includes(this.fusionAbilityIndex)) {
          if (this.fusionAbilityIndex === 2 && preEvoAbilityCount === 3 && abilityCount === 2) {
            this.fusionAbilityIndex = 1;
          }
        } else {
          console.warn("this.fusionAbilityIndex is somehow an illegal value, please report this");
          console.warn(this.fusionAbilityIndex);
          this.fusionAbilityIndex = 0;
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
      if (preEvolution.speciesId === SpeciesId.GIMMIGHOUL) {
        const evotracker = this.getHeldItems().filter(m => m instanceof EvoTrackerModifier)[0] ?? null;
        if (evotracker) {
          globalScene.removeModifier(evotracker);
        }
      }
      if (!globalScene.gameMode.isDaily || this.metBiome > -1) {
        globalScene.gameData.updateSpeciesDexIvs(this.species.speciesId, this.ivs);
        globalScene.gameData.setPokemonSeen(this, false);
        globalScene.gameData.setPokemonCaught(this, false).then(() => updateAndResolve());
      } else {
        updateAndResolve();
      }
    });
  }

  private handleSpecialEvolutions(evolution: SpeciesFormEvolution) {
    const isFusion = evolution instanceof FusionSpeciesFormEvolution;

    const evoSpecies = !isFusion ? this.species : this.fusionSpecies;
    if (evoSpecies?.speciesId === SpeciesId.NINCADA && evolution.speciesId === SpeciesId.NINJASK) {
      const newEvolution = pokemonEvolutions[evoSpecies.speciesId][1];

      if (validateShedinjaEvo()) {
        const newPokemon = globalScene.addPlayerPokemon(
          this.species,
          this.level,
          this.abilityIndex,
          this.formIndex,
          undefined,
          this.shiny,
          this.variant,
          this.ivs,
          this.nature,
        );
        newPokemon.passive = this.passive;
        newPokemon.moveset = this.moveset.slice();
        newPokemon.moveset = this.copyMoveset();
        newPokemon.luck = this.luck;
        newPokemon.gender = Gender.GENDERLESS;
        newPokemon.metLevel = this.metLevel;
        newPokemon.metBiome = this.metBiome;
        newPokemon.metSpecies = this.metSpecies;
        newPokemon.metWave = this.metWave;
        newPokemon.fusionSpecies = this.fusionSpecies;
        newPokemon.fusionFormIndex = this.fusionFormIndex;
        newPokemon.fusionAbilityIndex = this.fusionAbilityIndex;
        newPokemon.fusionShiny = this.fusionShiny;
        newPokemon.fusionVariant = this.fusionVariant;
        newPokemon.fusionGender = this.fusionGender;
        newPokemon.fusionLuck = this.fusionLuck;
        newPokemon.fusionTeraType = this.fusionTeraType;
        newPokemon.usedTMs = this.usedTMs;

        globalScene.getPlayerParty().push(newPokemon);
        newPokemon.evolve(!isFusion ? newEvolution : new FusionSpeciesFormEvolution(this.id, newEvolution), evoSpecies);
        const modifiers = globalScene.findModifiers(
          m => m instanceof PokemonHeldItemModifier && m.pokemonId === this.id,
          true,
        ) as PokemonHeldItemModifier[];
        modifiers.forEach(m => {
          const clonedModifier = m.clone() as PokemonHeldItemModifier;
          clonedModifier.pokemonId = newPokemon.id;
          globalScene.addModifier(clonedModifier, true);
        });
        globalScene.updateModifiers(true);
      }
    }
  }

  getPossibleForm(formChange: SpeciesFormChange): Promise<Pokemon> {
    return new Promise(resolve => {
      const formIndex = Math.max(
        this.species.forms.findIndex(f => f.formKey === formChange.formKey),
        0,
      );
      const ret = globalScene.addPlayerPokemon(
        this.species,
        this.level,
        this.abilityIndex,
        formIndex,
        this.gender,
        this.shiny,
        this.variant,
        this.ivs,
        this.nature,
        this,
      );
      ret.loadAssets().then(() => resolve(ret));
    });
  }

  changeForm(formChange: SpeciesFormChange): Promise<void> {
    return new Promise(resolve => {
      this.formIndex = Math.max(
        this.species.forms.findIndex(f => f.formKey === formChange.formKey),
        0,
      );
      this.generateName();
      const abilityCount = this.getSpeciesForm().getAbilityCount();
      if (this.abilityIndex >= abilityCount) {
        // Shouldn't happen
        this.abilityIndex = abilityCount - 1;
      }

      this.compatibleTms.splice(0, this.compatibleTms.length);
      this.generateCompatibleTms();
      const updateAndResolve = () => {
        this.loadAssets().then(() => {
          this.calculateStats();
          globalScene.updateModifiers(true, true);
          this.updateInfo(true).then(() => resolve());
        });
      };
      if (!globalScene.gameMode.isDaily || this.metBiome > -1) {
        globalScene.gameData.setPokemonSeen(this, false);
        globalScene.gameData.setPokemonCaught(this, false).then(() => updateAndResolve());
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
   * Fuse another PlayerPokemon into this one
   * @param pokemon - The PlayerPokemon to fuse to this one
   */
  fuse(pokemon: PlayerPokemon): void {
    this.fusionSpecies = pokemon.species;
    this.fusionFormIndex = pokemon.formIndex;
    this.fusionAbilityIndex = pokemon.abilityIndex;
    this.fusionShiny = pokemon.shiny;
    this.fusionVariant = pokemon.variant;
    this.fusionGender = pokemon.gender;
    this.fusionLuck = pokemon.luck;
    this.fusionCustomPokemonData = pokemon.customPokemonData;
    if (pokemon.pauseEvolutions || this.pauseEvolutions) {
      this.pauseEvolutions = true;
    }

    globalScene.validateAchv(achvs.SPLICE);
    globalScene.gameData.gameStats.pokemonFused++;

    // Store the average HP% that each Pokemon has
    const maxHp = this.getMaxHp();
    const newHpPercent = (pokemon.hp / pokemon.getMaxHp() + this.hp / maxHp) / 2;

    this.generateName();
    this.calculateStats();

    // Set this Pokemon's HP to the average % of both fusion components
    this.hp = Math.round(maxHp * newHpPercent);
    if (!this.isFainted()) {
      // If this Pokemon hasn't fainted, make sure the HP wasn't set over the new maximum
      this.hp = Math.min(this.hp, maxHp);
      this.status = getRandomStatus(this.status, pokemon.status); // Get a random valid status between the two
    } else if (!pokemon.isFainted()) {
      // If this Pokemon fainted but the other hasn't, make sure the HP wasn't set to zero
      this.hp = Math.max(this.hp, 1);
      this.status = pokemon.status; // Inherit the other Pokemon's status
    }

    this.generateCompatibleTms();
    this.updateInfo(true);
    const fusedPartyMemberIndex = globalScene.getPlayerParty().indexOf(pokemon);
    let partyMemberIndex = globalScene.getPlayerParty().indexOf(this);
    if (partyMemberIndex > fusedPartyMemberIndex) {
      partyMemberIndex--;
    }

    // combine the two mons' held items
    const fusedPartyMemberHeldModifiers = globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === pokemon.id,
      true,
    ) as PokemonHeldItemModifier[];
    for (const modifier of fusedPartyMemberHeldModifiers) {
      globalScene.tryTransferHeldItemModifier(modifier, this, false, modifier.getStackCount(), true, true, false);
    }
    globalScene.updateModifiers(true, true);
    globalScene.removePartyMemberModifiers(fusedPartyMemberIndex);
    globalScene.getPlayerParty().splice(fusedPartyMemberIndex, 1)[0];
    const newPartyMemberIndex = globalScene.getPlayerParty().indexOf(this);
    pokemon
      .getMoveset(true)
      .map((m: PokemonMove) =>
        globalScene.phaseManager.unshiftNew("LearnMovePhase", newPartyMemberIndex, m.getMove().id),
      );
    pokemon.destroy();
    this.updateFusionPalette();
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
    const newMoveset: PokemonMove[] = [];
    this.moveset.forEach(move => {
      newMoveset.push(new PokemonMove(move.moveId, 0, move.ppUp, move.maxPpOverride));
    });

    return newMoveset;
  }
}

export class EnemyPokemon extends Pokemon {
  protected declare battleInfo: EnemyBattleInfo;
  public trainerSlot: TrainerSlot;
  public aiType: AiType;
  public bossSegments: number;
  public bossSegmentIndex: number;
  public initialTeamIndex: number;
  /** To indicate if the instance was populated with a dataSource -> e.g. loaded & populated from session data */
  public readonly isPopulatedFromDataSource: boolean;

  constructor(
    species: PokemonSpecies,
    level: number,
    trainerSlot: TrainerSlot,
    boss: boolean,
    shinyLock = false,
    dataSource?: PokemonData,
  ) {
    super(
      236,
      84,
      species,
      level,
      dataSource?.abilityIndex,
      dataSource?.formIndex,
      dataSource?.gender,
      !shinyLock && dataSource ? dataSource.shiny : false,
      !shinyLock && dataSource ? dataSource.variant : undefined,
      undefined,
      dataSource ? dataSource.nature : undefined,
      dataSource,
    );

    this.trainerSlot = trainerSlot;
    this.initialTeamIndex = globalScene.currentBattle?.enemyParty.length ?? 0;
    this.isPopulatedFromDataSource = !!dataSource; // if a dataSource is provided, then it was populated from dataSource
    if (boss) {
      this.setBoss(boss, dataSource?.bossSegments);
    }

    if (Overrides.ENEMY_STATUS_OVERRIDE) {
      this.status = new Status(Overrides.ENEMY_STATUS_OVERRIDE, 0, 4);
    }

    if (Overrides.ENEMY_GENDER_OVERRIDE !== null) {
      this.gender = Overrides.ENEMY_GENDER_OVERRIDE;
    }

    const speciesId = this.species.speciesId;

    if (
      speciesId in Overrides.ENEMY_FORM_OVERRIDES
      && Overrides.ENEMY_FORM_OVERRIDES[speciesId] != null
      && this.species.forms[Overrides.ENEMY_FORM_OVERRIDES[speciesId]]
    ) {
      this.formIndex = Overrides.ENEMY_FORM_OVERRIDES[speciesId];
    } else if (globalScene.gameMode.isDaily && globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex)) {
      const eventBoss = getDailyEventSeedBoss(globalScene.seed);
      if (eventBoss != null) {
        this.formIndex = eventBoss.formIndex;
      }
    }

    if (!dataSource) {
      this.generateAndPopulateMoveset();
      if (shinyLock || Overrides.ENEMY_SHINY_OVERRIDE === false) {
        this.shiny = false;
      } else {
        this.trySetShiny();
      }

      if (!this.shiny && Overrides.ENEMY_SHINY_OVERRIDE) {
        this.shiny = true;
        this.initShinySparkle();
      }

      const eventBossVariant = getDailyEventSeedBossVariant(globalScene.seed);
      const eventBossVariantEnabled =
        eventBossVariant != null && globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex);
      if (eventBossVariantEnabled) {
        this.shiny = true;
      }

      if (this.shiny) {
        this.variant = eventBossVariantEnabled ? eventBossVariant : this.generateShinyVariant();
        if (Overrides.ENEMY_VARIANT_OVERRIDE !== null) {
          this.variant = Overrides.ENEMY_VARIANT_OVERRIDE;
        }
      }

      this.luck = (this.shiny ? this.variant + 1 : 0) + (this.fusionShiny ? this.fusionVariant + 1 : 0);

      if (this.hasTrainer() && globalScene.currentBattle) {
        const { waveIndex } = globalScene.currentBattle;
        const ivs: number[] = [];
        while (ivs.length < 6) {
          ivs.push(randSeedIntRange(Math.floor(waveIndex / 10), 31));
        }
        this.ivs = ivs;
        this.friendship = Math.round(255 * (waveIndex / 200));
      }
    }

    this.aiType = boss || this.hasTrainer() ? AiType.SMART : AiType.SMART_RANDOM;
  }

  initBattleInfo(): void {
    if (!this.battleInfo) {
      this.battleInfo = new EnemyBattleInfo();
      this.battleInfo.initInfo(this);
      this.battleInfo.updateBossSegments(this);
    } else {
      this.battleInfo.updateBossSegments(this);
    }
  }

  /**
   * Set this {@linkcode EnemyPokemon}'s boss status.
   *
   * @param boss - Whether this pokemon should be a boss; default `true`
   * @param bossSegments - Optional amount amount of health bar segments to give;
   * will be generated by {@linkcode BattleScene.getEncounterBossSegments} if omitted
   */
  setBoss(boss = true, bossSegments?: number): void {
    if (!boss) {
      this.bossSegments = 0;
      this.bossSegmentIndex = 0;
      return;
    }

    this.bossSegments =
      bossSegments
      ?? globalScene.getEncounterBossSegments(globalScene.currentBattle.waveIndex, this.level, this.species, true);
    this.bossSegmentIndex = this.bossSegments - 1;
  }

  generateAndPopulateMoveset(formIndex?: number): void {
    switch (true) {
      case this.species.speciesId === SpeciesId.SMEARGLE:
        this.moveset = [
          new PokemonMove(MoveId.SKETCH),
          new PokemonMove(MoveId.SKETCH),
          new PokemonMove(MoveId.SKETCH),
          new PokemonMove(MoveId.SKETCH),
        ];
        break;
      case this.species.speciesId === SpeciesId.ETERNATUS:
        this.moveset = (formIndex !== undefined ? formIndex : this.formIndex)
          ? [
              new PokemonMove(MoveId.DYNAMAX_CANNON),
              new PokemonMove(MoveId.CROSS_POISON),
              new PokemonMove(MoveId.FLAMETHROWER),
              new PokemonMove(MoveId.RECOVER, 0, -4),
            ]
          : [
              new PokemonMove(MoveId.ETERNABEAM),
              new PokemonMove(MoveId.SLUDGE_BOMB),
              new PokemonMove(MoveId.FLAMETHROWER),
              new PokemonMove(MoveId.COSMIC_POWER),
            ];
        if (globalScene.gameMode.hasChallenge(Challenges.INVERSE_BATTLE)) {
          this.moveset[2] = new PokemonMove(MoveId.THUNDERBOLT);
        }
        break;
      default:
        super.generateAndPopulateMoveset();
        break;
    }
  }

  /**
   * Determines the move this Pokemon will use on the next turn, as well as
   * the Pokemon the move will target.
   * @returns this Pokemon's next move in the format {move, moveTargets}
   */
  // TODO: split this up and move it elsewhere
  getNextMove(): TurnMove {
    // If this Pokemon has a usable move already queued, return it,
    // removing all unusable moves before it in the queue.
    const moveQueue = this.getMoveQueue();
    for (const [i, queuedMove] of moveQueue.entries()) {
      const movesetMove = this.getMoveset().find(m => m.moveId === queuedMove.move);
      // If the queued move was called indirectly, ignore all PP and usability checks.
      // Otherwise, ensure that the move being used is actually usable & in our moveset.
      // TODO: What should happen if a pokemon forgets a charging move mid-use?
      if (isVirtual(queuedMove.useMode) || movesetMove?.isUsable(this, isIgnorePP(queuedMove.useMode), true)) {
        moveQueue.splice(0, i); // TODO: This should not be done here
        return queuedMove;
      }
    }

    // We went through the entire queue without a match; clear the entire thing.
    this.summonData.moveQueue = [];

    // Filter out any moves this Pokemon cannot use
    let movePool = this.getMoveset().filter(m => m.isUsable(this, false, true)[0]);
    // If no moves are left, use Struggle. Otherwise, continue with move selection
    if (movePool.length > 0) {
      // If there's only 1 move in the move pool, use it.
      if (movePool.length === 1) {
        return {
          move: movePool[0].moveId,
          targets: this.getNextTargets(movePool[0].moveId),
          useMode: MoveUseMode.NORMAL,
        };
      }
      // If a move is forced because of Encore, use it.
      // Said moves are executed normally
      const encoreTag = this.getTag(EncoreTag) as EncoreTag;
      if (encoreTag) {
        const encoreMove = movePool.find(m => m.moveId === encoreTag.moveId);
        if (encoreMove) {
          return {
            move: encoreMove.moveId,
            targets: this.getNextTargets(encoreMove.moveId),
            useMode: MoveUseMode.NORMAL,
          };
        }
      }
      switch (this.aiType) {
        // No enemy should spawn with this AI type in-game
        case AiType.RANDOM: {
          const moveId = movePool[globalScene.randBattleSeedInt(movePool.length)].moveId;
          return { move: moveId, targets: this.getNextTargets(moveId), useMode: MoveUseMode.NORMAL };
        }
        case AiType.SMART_RANDOM:
        case AiType.SMART: {
          /**
           * Search this Pokemon's move pool for moves that will KO an opposing target.
           * If there are any moves that can KO an opponent (i.e. a player Pokemon),
           * those moves are the only ones considered for selection on this turn.
           */
          const koMoves = movePool.filter(pkmnMove => {
            if (!pkmnMove) {
              return false;
            }

            const move = pkmnMove.getMove()!;
            if (move.moveTarget === MoveTarget.ATTACKER) {
              return false;
            }

            const fieldPokemon = globalScene.getField();
            const moveTargets = getMoveTargets(this, move.id)
              .targets.map(ind => fieldPokemon[ind])
              .filter(p => this.isPlayer() !== p.isPlayer());
            // Only considers critical hits for crit-only moves or when this Pokemon is under the effect of Laser Focus
            const isCritical = move.hasAttr("CritOnlyAttr") || !!this.getTag(BattlerTagType.ALWAYS_CRIT);

            return (
              move.category !== MoveCategory.STATUS
              && moveTargets.some(p => {
                const doesNotFail =
                  !globalScene.arena.isMoveWeatherCancelled(this, move)
                  && (move.applyConditions(this, p, -1)
                    || [MoveId.SUCKER_PUNCH, MoveId.UPPER_HAND, MoveId.THUNDERCLAP].includes(move.id));
                return (
                  doesNotFail
                  && p.getAttackDamage({
                    source: this,
                    move,
                    ignoreAbility: !p.waveData.abilityRevealed,
                    ignoreSourceAbility: false,
                    ignoreAllyAbility: !p.getAlly()?.waveData.abilityRevealed,
                    ignoreSourceAllyAbility: false,
                    isCritical,
                    simulated: true,
                  }).damage >= p.hp
                );
              })
            );
          }, this);

          if (koMoves.length > 0) {
            movePool = koMoves;
          }

          /**
           * Move selection is based on the move's calculated "benefit score" against the
           * best possible target(s) (as determined by {@linkcode getNextTargets}).
           * For more information on how benefit scores are calculated, see `docs/enemy-ai.md`.
           */
          const moveScores = movePool.map(() => 0);
          const moveTargets = Object.fromEntries(movePool.map(m => [m.moveId, this.getNextTargets(m.moveId)]));
          for (const m in movePool) {
            const pokemonMove = movePool[m];
            const move = pokemonMove.getMove();

            let moveScore = moveScores[m];
            const targetScores: number[] = [];

            for (const mt of moveTargets[move.id]) {
              // Prevent a target score from being calculated when the target is whoever attacks the user
              if (mt === BattlerIndex.ATTACKER) {
                break;
              }

              const target = globalScene.getField()[mt];
              /**
               * The "target score" of a move is given by the move's user benefit score + the move's target benefit score.
               * If the target is an ally, the target benefit score is multiplied by -1.
               */
              let targetScore =
                move.getUserBenefitScore(this, target, move)
                + move.getTargetBenefitScore(this, target, move)
                  * (mt < BattlerIndex.ENEMY === this.isPlayer() ? 1 : -1);
              if (Number.isNaN(targetScore)) {
                console.error(`Move ${move.name} returned score of NaN`);
                targetScore = 0;
              }
              /**
               * If this move is unimplemented, or the move is known to fail when used, set its
               * target score to -20
               */
              if (
                (move.name.endsWith(" (N)") || !move.applyConditions(this, target, -1))
                && ![MoveId.SUCKER_PUNCH, MoveId.UPPER_HAND, MoveId.THUNDERCLAP].includes(move.id)
              ) {
                targetScore = -20;
              } else if (move.is("AttackMove")) {
                /**
                 * Attack moves are given extra multipliers to their base benefit score based on
                 * the move's type effectiveness against the target and whether the move is a STAB move.
                 */
                const effectiveness = target.getMoveEffectiveness(
                  this,
                  move,
                  !target.waveData.abilityRevealed,
                  undefined,
                  undefined,
                  true,
                );

                if (target.isPlayer() !== this.isPlayer()) {
                  targetScore *= effectiveness;
                  if (this.isOfType(move.type)) {
                    targetScore *= 1.5;
                  }
                } else if (effectiveness) {
                  targetScore /= effectiveness;
                  if (this.isOfType(move.type)) {
                    targetScore /= 1.5;
                  }
                }
                /** If a move has a base benefit score of 0, its benefit score is assumed to be unimplemented at this point */
                if (!targetScore) {
                  targetScore = -20;
                }
              }
              targetScores.push(targetScore);
            }
            // When a move has multiple targets, its score is equal to the maximum target score across all targets
            moveScore += Math.max(...targetScores);

            // could make smarter by checking opponent def/spdef
            moveScores[m] = moveScore;
          }

          console.log(moveScores);

          // Sort the move pool in decreasing order of move score
          const sortedMovePool = movePool.slice(0);
          sortedMovePool.sort((a, b) => {
            const scoreA = moveScores[movePool.indexOf(a)];
            const scoreB = moveScores[movePool.indexOf(b)];
            return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
          });
          let r = 0;
          if (this.aiType === AiType.SMART_RANDOM) {
            // Has a 5/8 chance to select the best move, and a 3/8 chance to advance to the next best move (and repeat this roll)
            while (r < sortedMovePool.length - 1 && globalScene.randBattleSeedInt(8) >= 5) {
              r++;
            }
          } else if (this.aiType === AiType.SMART) {
            // The chance to advance to the next best move increases when the compared moves' scores are closer to each other.
            while (
              r < sortedMovePool.length - 1
              && moveScores[movePool.indexOf(sortedMovePool[r + 1])] / moveScores[movePool.indexOf(sortedMovePool[r])]
                >= 0
              && globalScene.randBattleSeedInt(100)
                < Math.round(
                  (moveScores[movePool.indexOf(sortedMovePool[r + 1])]
                    / moveScores[movePool.indexOf(sortedMovePool[r])])
                    * 50,
                )
            ) {
              r++;
            }
          }
          console.log(
            movePool.map(m => m.getName()),
            moveScores,
            r,
            sortedMovePool.map(m => m.getName()),
          );
          return {
            move: sortedMovePool[r]!.moveId,
            targets: moveTargets[sortedMovePool[r]!.moveId],
            useMode: MoveUseMode.NORMAL,
          };
        }
      }
    }

    // No moves left means struggle
    return {
      move: MoveId.STRUGGLE,
      targets: this.getNextTargets(MoveId.STRUGGLE),
      useMode: MoveUseMode.IGNORE_PP,
    };
  }

  /**
   * Determines the Pokemon the given move would target if used by this Pokemon
   * @param moveId - The move to be used
   * @returns The indexes of the Pokemon the given move would target
   */
  getNextTargets(moveId: MoveId): BattlerIndex[] {
    const moveTargets = getMoveTargets(this, moveId);
    const targets = globalScene.getField(true).filter(p => moveTargets.targets.indexOf(p.getBattlerIndex()) > -1);
    // If the move is multi-target, return all targets' indexes
    if (moveTargets.multiple) {
      return targets.map(p => p.getBattlerIndex());
    }

    const move = allMoves[moveId];

    /**
     * Get the move's target benefit score against each potential target.
     * For allies, this score is multiplied by -1.
     */
    const benefitScores = targets.map(p => [
      p.getBattlerIndex(),
      move.getTargetBenefitScore(this, p, move) * (p.isPlayer() === this.isPlayer() ? 1 : -1),
    ]);

    const sortedBenefitScores = benefitScores.slice(0);
    sortedBenefitScores.sort((a, b) => {
      const scoreA = a[1];
      const scoreB = b[1];
      return scoreA < scoreB ? 1 : scoreA > scoreB ? -1 : 0;
    });

    if (sortedBenefitScores.length === 0) {
      // Set target to BattlerIndex.ATTACKER when using a counter move
      // This is the same as when the player does so
      if (move.hasAttr("CounterDamageAttr")) {
        return [BattlerIndex.ATTACKER];
      }

      return [];
    }

    let targetWeights = sortedBenefitScores.map(s => s[1]);
    const lowestWeight = targetWeights.at(-1) ?? 0;

    // If the lowest target weight (i.e. benefit score) is negative, add abs(lowestWeight) to all target weights
    if (lowestWeight < 1) {
      for (let w = 0; w < targetWeights.length; w++) {
        targetWeights[w] += Math.abs(lowestWeight - 1);
      }
    }

    // Remove any targets whose weights are less than half the max of the target weights from consideration
    const benefitCutoffIndex = targetWeights.findIndex(s => s < targetWeights[0] / 2);
    if (benefitCutoffIndex > -1) {
      targetWeights = targetWeights.slice(0, benefitCutoffIndex);
    }

    const thresholds: number[] = [];
    let totalWeight = 0;
    targetWeights.reduce((total: number, w: number) => {
      total += w;
      thresholds.push(total);
      totalWeight = total;
      return total;
    }, 0);

    /**
     * Generate a random number from 0 to (totalWeight-1),
     * then select the first target whose cumulative weight (with all previous targets' weights)
     * is greater than that random number.
     */
    const randValue = globalScene.randBattleSeedInt(totalWeight);
    let targetIndex = 0;

    thresholds.every((t, i) => {
      if (randValue >= t) {
        return true;
      }

      targetIndex = i;
      return false;
    });

    return [sortedBenefitScores[targetIndex][0]];
  }

  override isPlayer(): this is PlayerPokemon {
    return false;
  }

  override isEnemy(): this is EnemyPokemon {
    return true;
  }

  override hasTrainer(): boolean {
    return !!this.trainerSlot;
  }

  override isBoss(): boolean {
    return !!this.bossSegments;
  }

  getBossSegmentIndex(): number {
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

  /**
   * @inheritdoc
   * @param ignoreSegments - Whether to ignore boss segments when applying damage
   */
  public damage(damage: number, ignoreSegments = false, preventEndure = false, ignoreFaintPhase = false): number {
    if (this.isFainted()) {
      return 0;
    }

    const segmentSize = this.getMaxHp() / this.bossSegments;

    let clearedBossSegmentIndex = this.isBoss() ? this.bossSegmentIndex + 1 : 0;

    if (this.isBoss() && !ignoreSegments) {
      [damage, clearedBossSegmentIndex] = calculateBossSegmentDamage(
        damage,
        this.hp,
        segmentSize,
        this.getMinimumSegmentIndex(),
        this.bossSegmentIndex,
      );
    }

    switch (globalScene.currentBattle.battleSpec) {
      case BattleSpec.FINAL_BOSS:
        if (!this.formIndex && this.bossSegmentIndex < 1) {
          damage = Math.min(damage, this.hp - 1);
        }
    }

    const ret = super.damage(damage, ignoreSegments, preventEndure, ignoreFaintPhase);

    if (this.isBoss()) {
      if (ignoreSegments) {
        clearedBossSegmentIndex = Math.ceil(this.hp / segmentSize);
      }
      if (clearedBossSegmentIndex <= this.bossSegmentIndex) {
        this.handleBossSegmentCleared(clearedBossSegmentIndex);
      }
      this.battleInfo.updateBossSegments(this);
    }

    return ret;
  }

  private getMinimumSegmentIndex(): number {
    if (globalScene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS && !this.formIndex) {
      return 1;
    }

    return 0;
  }

  /**
   * Go through a boss' health segments and give stats boosts for each newly cleared segment
   *
   * @remarks
   * The base boost is 1 to a random stat that's not already maxed out per broken shield
   * For Pokemon with 3 health segments or more, breaking the last shield gives +2 instead
   * For Pokemon with 5 health segments or more, breaking the last two shields give +2 each
   * @param segmentIndex - index of the segment to get down to (0 = no shield left, 1 = 1 shield left, etc.)
   */
  handleBossSegmentCleared(segmentIndex: number): void {
    let doStatBoost = !this.hasTrainer();
    // TODO: Rewrite this bespoke logic to improve clarity
    while (this.bossSegmentIndex > 0 && segmentIndex - 1 < this.bossSegmentIndex) {
      this.bossSegmentIndex--;

      // Continue, _not_ break here, to ensure that each segment is still broken
      if (!doStatBoost) {
        continue;
      }
      let boostedStat: EffectiveStat | undefined;
      // Filter out already maxed out stat stages and weigh the rest based on existing stats
      const leftoverStats = EFFECTIVE_STATS.filter((s: EffectiveStat) => this.getStatStage(s) < 6);
      const statWeights = leftoverStats.map((s: EffectiveStat) => this.getStat(s, false));

      const statThresholds: number[] = [];
      let totalWeight = 0;

      for (const i in statWeights) {
        totalWeight += statWeights[i];
        statThresholds.push(totalWeight);
      }

      // Pick a random stat from the leftover stats to increase its stages
      const randInt = randSeedInt(totalWeight);
      for (const i in statThresholds) {
        if (randInt < statThresholds[i]) {
          boostedStat = leftoverStats[i];
          break;
        }
      }

      if (boostedStat === undefined) {
        doStatBoost = false;
        continue;
      }

      let stages = 1;

      // increase the boost if the boss has at least 3 segments and we passed last shield
      if (this.bossSegments >= 3 && this.bossSegmentIndex === 0) {
        stages++;
      }
      // increase the boost if the boss has at least 5 segments and we passed the second to last shield
      if (this.bossSegments >= 5 && this.bossSegmentIndex === 1) {
        stages++;
      }

      globalScene.phaseManager.unshiftNew(
        "StatStageChangePhase",
        this.getBattlerIndex(),
        true,
        [boostedStat],
        stages,
        true,
        true,
      );
    }
  }

  public getFieldIndex(): number {
    return globalScene.getEnemyField().indexOf(this);
  }

  public getBattlerIndex(): BattlerIndex {
    const fieldIndex = this.getFieldIndex();
    if (fieldIndex === -1) {
      return BattlerIndex.ATTACKER;
    }
    return BattlerIndex.ENEMY + this.getFieldIndex();
  }

  /**
   * Add a new pokemon to the player's party (at `slotIndex` if set).
   * The new pokemon's visibility will be set to `false`.
   * @param pokeballType - The type of pokeball the pokemon was caught with
   * @param slotIndex - An optional index to place the pokemon in the party
   * @returns The pokemon that was added or null if the pokemon could not be added
   */
  public addToParty(pokeballType: PokeballType, slotIndex = -1) {
    const party = globalScene.getPlayerParty();
    let ret: PlayerPokemon | null = null;

    if (party.length < PLAYER_PARTY_MAX_SIZE) {
      this.pokeball = pokeballType;
      this.metLevel = this.level;
      this.metBiome = globalScene.arena.biomeType;
      this.metWave = globalScene.currentBattle.waveIndex;
      this.metSpecies = this.species.speciesId;
      const newPokemon = globalScene.addPlayerPokemon(
        this.species,
        this.level,
        this.abilityIndex,
        this.formIndex,
        this.gender,
        this.shiny,
        this.variant,
        this.ivs,
        this.nature,
        this,
      );

      if (isBetween(slotIndex, 0, PLAYER_PARTY_MAX_SIZE - 1)) {
        party.splice(slotIndex, 0, newPokemon);
      } else {
        party.push(newPokemon);
      }

      // Hide the Pokemon since it is not on the field
      newPokemon.setVisible(false);

      ret = newPokemon;
      globalScene.triggerPokemonFormChange(newPokemon, SpeciesFormChangeActiveTrigger, true);
    }

    return ret;
  }

  /**
   * Show or hide the type effectiveness multiplier window
   * Passing undefined will hide the window
   */
  public updateEffectiveness(effectiveness?: string) {
    this.battleInfo.updateEffectiveness(effectiveness);
  }

  public toggleFlyout(visible: boolean): void {
    this.battleInfo.toggleFlyout(visible);
  }
}
