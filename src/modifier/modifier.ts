import * as ModifierTypes from "./modifier-type";
import BattleScene from "../battle-scene";
import { getLevelTotalExp } from "../data/exp";
import { MAX_PER_TYPE_POKEBALLS, PokeballType } from "../data/pokeball";
import Pokemon, { PlayerPokemon } from "../field/pokemon";
import { addTextObject, TextStyle } from "../ui/text";
import { Type } from "../data/type";
import { EvolutionPhase } from "../phases/evolution-phase";
import { FusionSpeciesFormEvolution, pokemonEvolutions, pokemonPrevolutions } from "../data/pokemon-evolutions";
import { getPokemonNameWithAffix } from "../messages";
import * as Utils from "../utils";
import { getBerryEffectFunc, getBerryPredicate } from "../data/berry";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { StatusEffect, getStatusEffectHealText } from "../data/status-effect";
import { achvs } from "../system/achv";
import { VoucherType } from "../system/voucher";
import { FormChangeItem, SpeciesFormChangeItemTrigger } from "../data/pokemon-forms";
import { Nature } from "#app/data/nature";
import Overrides from "#app/overrides";
import { ModifierType, modifierTypes } from "./modifier-type";
import { Command } from "#app/ui/command-ui-handler";
import { Species } from "#enums/species";
import { Stat, type PermanentStat, type TempBattleStat, BATTLE_STATS, TEMP_BATTLE_STATS  } from "#app/enums/stat";
import i18next from "i18next";

import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { LearnMovePhase } from "#app/phases/learn-move-phase.js";
import { LevelUpPhase } from "#app/phases/level-up-phase.js";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase.js";

export type ModifierPredicate = (modifier: Modifier) => boolean;

const iconOverflowIndex = 24;

export const modifierSortFunc = (a: Modifier, b: Modifier): number => {
  const itemNameMatch = a.type.name.localeCompare(b.type.name);
  const typeNameMatch = a.constructor.name.localeCompare(b.constructor.name);
  const aId = a instanceof PokemonHeldItemModifier && a.pokemonId ? a.pokemonId : 4294967295;
  const bId = b instanceof PokemonHeldItemModifier && b.pokemonId ? b.pokemonId : 4294967295;

  //First sort by pokemonID
  if (aId < bId) {
    return 1;
  } else if (aId > bId) {
    return -1;
  } else if (aId === bId) {
    //Then sort by item type
    if (typeNameMatch === 0) {
      return itemNameMatch;
      //Finally sort by item name
    } else {
      return typeNameMatch;
    }
  } else {
    return 0;
  }
};

export class ModifierBar extends Phaser.GameObjects.Container {
  private player: boolean;
  private modifierCache: PersistentModifier[];

  constructor(scene: BattleScene, enemy?: boolean) {
    super(scene, 1 + (enemy ? 302 : 0), 2);

    this.player = !enemy;
    this.setScale(0.5);
  }

  /**
   * Method to update content displayed in {@linkcode ModifierBar}
   * @param {PersistentModifier[]} modifiers - The list of modifiers to be displayed in the {@linkcode ModifierBar}
   * @param {boolean} hideHeldItems - If set to "true", only modifiers not assigned to a Pokémon are displayed
   */
  updateModifiers(modifiers: PersistentModifier[], hideHeldItems: boolean = false) {
    this.removeAll(true);

    const visibleIconModifiers = modifiers.filter(m => m.isIconVisible(this.scene as BattleScene));
    const nonPokemonSpecificModifiers = visibleIconModifiers.filter(m => !(m as PokemonHeldItemModifier).pokemonId).sort(modifierSortFunc);
    const pokemonSpecificModifiers = visibleIconModifiers.filter(m => (m as PokemonHeldItemModifier).pokemonId).sort(modifierSortFunc);

    const sortedVisibleIconModifiers = hideHeldItems ? nonPokemonSpecificModifiers : nonPokemonSpecificModifiers.concat(pokemonSpecificModifiers);

    const thisArg = this;

    sortedVisibleIconModifiers.forEach((modifier: PersistentModifier, i: integer) => {
      const icon = modifier.getIcon(this.scene as BattleScene);
      if (i >= iconOverflowIndex) {
        icon.setVisible(false);
      }
      this.add(icon);
      this.setModifierIconPosition(icon, sortedVisibleIconModifiers.length);
      icon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 32, 24), Phaser.Geom.Rectangle.Contains);
      icon.on("pointerover", () => {
        (this.scene as BattleScene).ui.showTooltip(modifier.type.name, modifier.type.getDescription(this.scene as BattleScene));
        if (this.modifierCache && this.modifierCache.length > iconOverflowIndex) {
          thisArg.updateModifierOverflowVisibility(true);
        }
      });
      icon.on("pointerout", () => {
        (this.scene as BattleScene).ui.hideTooltip();
        if (this.modifierCache && this.modifierCache.length > iconOverflowIndex) {
          thisArg.updateModifierOverflowVisibility(false);
        }
      });
    });

    for (const icon of this.getAll()) {
      this.sendToBack(icon);
    }

    this.modifierCache = modifiers;
  }

  updateModifierOverflowVisibility(ignoreLimit: boolean) {
    const modifierIcons = this.getAll().reverse();
    for (const modifier of modifierIcons.map(m => m as Phaser.GameObjects.Container).slice(iconOverflowIndex)) {
      modifier.setVisible(ignoreLimit);
    }
  }

  setModifierIconPosition(icon: Phaser.GameObjects.Container, modifierCount: integer) {
    const rowIcons: integer = 12 + 6 * Math.max((Math.ceil(Math.min(modifierCount, 24) / 12) - 2), 0);

    const x = (this.getIndex(icon) % rowIcons) * 26 / (rowIcons / 12);
    const y = Math.floor(this.getIndex(icon) / rowIcons) * 20;

    icon.setPosition(this.player ? x : -x, y);
  }
}

export abstract class Modifier {
  public type: ModifierType;

  constructor(type: ModifierType) {
    this.type = type;
  }

  match(_modifier: Modifier): boolean {
    return false;
  }

  shouldApply(_args: any[]): boolean {
    return true;
  }

  abstract apply(args: any[]): boolean | Promise<boolean>;
}

export abstract class PersistentModifier extends Modifier {
  public stackCount: integer;
  public virtualStackCount: integer;

  constructor(type: ModifierType, stackCount?: integer) {
    super(type);
    this.stackCount = stackCount === undefined ? 1 : stackCount;
    this.virtualStackCount = 0;
  }

  add(modifiers: PersistentModifier[], virtual: boolean, scene: BattleScene): boolean {
    for (const modifier of modifiers) {
      if (this.match(modifier)) {
        return modifier.incrementStack(scene, this.stackCount, virtual);
      }
    }

    if (virtual) {
      this.virtualStackCount += this.stackCount;
      this.stackCount = 0;
    }
    modifiers.push(this);
    return true;
  }

  abstract clone(): PersistentModifier;

  getArgs(): any[] {
    return [];
  }

  incrementStack(scene: BattleScene, amount: integer, virtual: boolean): boolean {
    if (this.getStackCount() + amount <= this.getMaxStackCount(scene)) {
      if (!virtual) {
        this.stackCount += amount;
      } else {
        this.virtualStackCount += amount;
      }
      return true;
    }

    return false;
  }

  getStackCount(): integer {
    return this.stackCount + this.virtualStackCount;
  }

  abstract getMaxStackCount(scene: BattleScene, forThreshold?: boolean): integer;

  isIconVisible(scene: BattleScene): boolean {
    return true;
  }

  getIcon(scene: BattleScene, forSummary?: boolean): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    const item = scene.add.sprite(0, 12, "items");
    item.setFrame(this.type.iconImage);
    item.setOrigin(0, 0.5);
    container.add(item);

    const stackText = this.getIconStackText(scene);
    if (stackText) {
      container.add(stackText);
    }

    const virtualStackText = this.getIconStackText(scene, true);
    if (virtualStackText) {
      container.add(virtualStackText);
    }

    return container;
  }

  getIconStackText(scene: BattleScene, virtual?: boolean): Phaser.GameObjects.BitmapText | null {
    if (this.getMaxStackCount(scene) === 1 || (virtual && !this.virtualStackCount)) {
      return null;
    }

    const text = scene.add.bitmapText(10, 15, "item-count", this.stackCount.toString(), 11);
    text.letterSpacing = -0.5;
    if (this.getStackCount() >= this.getMaxStackCount(scene)) {
      text.setTint(0xf89890);
    }
    text.setOrigin(0, 0);

    return text;
  }
}

export abstract class ConsumableModifier extends Modifier {
  constructor(type: ModifierType) {
    super(type);
  }

  add(_modifiers: Modifier[]): boolean {
    return true;
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 1 && args[0] instanceof BattleScene;
  }
}

export class AddPokeballModifier extends ConsumableModifier {
  private pokeballType: PokeballType;
  private count: integer;

  constructor(type: ModifierType, pokeballType: PokeballType, count: integer) {
    super(type);

    this.pokeballType = pokeballType;
    this.count = count;
  }

  apply(args: any[]): boolean {
    const pokeballCounts = (args[0] as BattleScene).pokeballCounts;
    pokeballCounts[this.pokeballType] = Math.min(pokeballCounts[this.pokeballType] + this.count, MAX_PER_TYPE_POKEBALLS);

    return true;
  }
}

export class AddVoucherModifier extends ConsumableModifier {
  private voucherType: VoucherType;
  private count: integer;

  constructor(type: ModifierType, voucherType: VoucherType, count: integer) {
    super(type);

    this.voucherType = voucherType;
    this.count = count;
  }

  apply(args: any[]): boolean {
    const voucherCounts = (args[0] as BattleScene).gameData.voucherCounts;
    voucherCounts[this.voucherType] += this.count;

    return true;
  }
}

/**
 * Modifier used for party-wide or passive items that start an initial
 * {@linkcode battleCount} equal to {@linkcode maxBattles} that, for every
 * battle, decrements. Typically, when {@linkcode battleCount} reaches 0, the
 * modifier will be removed. If a modifier of the same type is to be added, it
 * will reset {@linkcode battleCount} back to {@linkcode maxBattles} of the
 * existing modifier instead of adding that modifier directly.
 * @extends PersistentModifier
 * @abstract
 * @see {@linkcode add}
 */
export abstract class LapsingPersistentModifier extends PersistentModifier {
  /** The maximum amount of battles the modifier will exist for */
  private maxBattles: number;
  /** The current amount of battles the modifier will exist for */
  private battleCount: number;

  constructor(type: ModifierTypes.ModifierType, maxBattles: number, battleCount?: number, stackCount?: integer) {
    super(type, stackCount);

    this.maxBattles = maxBattles;
    this.battleCount = battleCount ?? this.maxBattles;
  }

  /**
   * Goes through existing modifiers for any that match the selected modifier,
   * which will then either add it to the existing modifiers if none were found
   * or, if one was found, it will refresh {@linkcode battleCount}.
   * @param modifiers {@linkcode PersistentModifier} array of the player's modifiers
   * @param _virtual N/A
   * @param _scene N/A
   * @returns true if the modifier was successfully added or applied, false otherwise
   */
  add(modifiers: PersistentModifier[], _virtual: boolean, scene: BattleScene): boolean {
    for (const modifier of modifiers) {
      if (this.match(modifier)) {
        const modifierInstance = modifier as LapsingPersistentModifier;
        if (modifierInstance.getBattleCount() < modifierInstance.getMaxBattles()) {
          modifierInstance.resetBattleCount();
          scene.playSound("se/restore");
          return true;
        }
        // should never get here
        return false;
      }
    }

    modifiers.push(this);
    return true;
  }

  lapse(_args: any[]): boolean {
    this.battleCount--;
    return this.battleCount > 0;
  }

  getIcon(scene: BattleScene): Phaser.GameObjects.Container {
    const container = super.getIcon(scene);

    // Linear interpolation on hue
    const hue = Math.floor(120 * (this.battleCount / this.maxBattles) + 5);

    // Generates the color hex code with a constant saturation and lightness but varying hue
    const typeHex = Utils.hslToHex(hue, 0.50, 0.90);
    const strokeHex = Utils.hslToHex(hue, 0.70, 0.30);

    const battleCountText = addTextObject(scene, 27, 0, this.battleCount.toString(), TextStyle.PARTY, { fontSize: "66px", color: typeHex });
    battleCountText.setShadow(0, 0);
    battleCountText.setStroke(strokeHex, 16);
    battleCountText.setOrigin(1, 0);
    container.add(battleCountText);

    return container;
  }

  getIconStackText(_scene: BattleScene, _virtual?: boolean): Phaser.GameObjects.BitmapText | null {
    return null;
  }

  getBattleCount(): number {
    return this.battleCount;
  }

  resetBattleCount(): void {
    this.battleCount = this.maxBattles;
  }

  getMaxBattles(): number {
    return this.maxBattles;
  }

  getArgs(): any[] {
    return [ this.maxBattles, this.battleCount ];
  }

  getMaxStackCount(_scene: BattleScene, _forThreshold?: boolean): number {
    // Must be an abitrary number greater than 1
    return 2;
  }
}

/**
 * Modifier used for passive items, specifically lures, that
 * temporarily increases the chance of a double battle.
 * @extends LapsingPersistentModifier
 * @see {@linkcode apply}
 */
export class DoubleBattleChanceBoosterModifier extends LapsingPersistentModifier {
  constructor(type: ModifierType, maxBattles:number, battleCount?: number, stackCount?: integer) {
    super(type, maxBattles, battleCount, stackCount);
  }

  match(modifier: Modifier): boolean {
    return (modifier instanceof DoubleBattleChanceBoosterModifier) && (modifier.getMaxBattles() === this.getMaxBattles());
  }

  clone(): DoubleBattleChanceBoosterModifier {
    return new DoubleBattleChanceBoosterModifier(this.type as ModifierTypes.DoubleBattleChanceBoosterModifierType, this.getMaxBattles(), this.getBattleCount(), this.stackCount);
  }

  /**
   * Modifies the chance of a double battle occurring
   * @param args [0] {@linkcode Utils.NumberHolder} for double battle chance
   * @returns true if the modifier was applied
   */
  apply(args: any[]): boolean {
    const doubleBattleChance = args[0] as Utils.NumberHolder;
    // This is divided because the chance is generated as a number from 0 to doubleBattleChance.value using Utils.randSeedInt
    // A double battle will initiate if the generated number is 0
    doubleBattleChance.value = Math.ceil(doubleBattleChance.value / 4);

    return true;
  }
}

/**
 * Modifier used for party-wide items, specifically the X items, that
 * temporarily increases the stat stage multiplier of the corresponding
 * {@linkcode TempBattleStat}.
 * @extends LapsingPersistentModifier
 * @see {@linkcode apply}
 */
export class TempStatStageBoosterModifier extends LapsingPersistentModifier {
  /** The stat whose stat stage multiplier will be temporarily increased */
  private stat: TempBattleStat;
  /** The amount by which the stat stage itself or its multiplier will be increased by */
  private boost: number;

  constructor(type: ModifierType, stat: TempBattleStat, maxBattles: number, battleCount?: number, stackCount?: number) {
    super(type, maxBattles, battleCount, stackCount);

    this.stat = stat;
    // Note that, because we want X Accuracy to maintain its original behavior,
    // it will increment as it did previously, directly to the stat stage.
    this.boost = (stat !== Stat.ACC) ? 0.3 : 1;
  }

  match(modifier: Modifier): boolean {
    if (modifier instanceof TempStatStageBoosterModifier) {
      const modifierInstance = modifier as TempStatStageBoosterModifier;
      return (modifierInstance.stat === this.stat);
    }
    return false;
  }

  clone() {
    return new TempStatStageBoosterModifier(this.type, this.stat, this.getMaxBattles(), this.getBattleCount(), this.stackCount);
  }

  getArgs(): any[] {
    return [ this.stat, ...super.getArgs() ];
  }

  /**
   * Checks if {@linkcode args} contains the necessary elements and if the
   * incoming stat is matches {@linkcode stat}.
   * @param args [0] {@linkcode TempBattleStat} being checked at the time
   *             [1] {@linkcode Utils.NumberHolder} N/A
   * @returns true if the modifier can be applied, false otherwise
   */
  shouldApply(args: any[]): boolean {
    return args && (args.length === 2) && TEMP_BATTLE_STATS.includes(args[0]) && (args[0] === this.stat) && (args[1] instanceof Utils.NumberHolder);
  }

  /**
   * Increases the incoming stat stage matching {@linkcode stat} by {@linkcode boost}.
   * @param args [0] {@linkcode TempBattleStat} N/A
   *             [1] {@linkcode Utils.NumberHolder} that holds the resulting value of the stat stage multiplier
   */
  apply(args: any[]): boolean {
    (args[1] as Utils.NumberHolder).value += this.boost;
    return true;
  }
}

/**
 * Modifier used for party-wide items, namely Dire Hit, that
 * temporarily increments the critical-hit stage
 * @extends LapsingPersistentModifier
 * @see {@linkcode apply}
 */
export class TempCritBoosterModifier extends LapsingPersistentModifier {
  constructor(type: ModifierType, maxBattles: number, battleCount?: number, stackCount?: number) {
    super(type, maxBattles, battleCount, stackCount);
  }

  clone() {
    return new TempCritBoosterModifier(this.type, this.getMaxBattles(), this.getBattleCount(), this.stackCount);
  }

  match(modifier: Modifier): boolean {
    return (modifier instanceof TempCritBoosterModifier);
  }

  /**
   * Checks if {@linkcode args} contains the necessary elements.
   * @param args [1] {@linkcode Utils.NumberHolder} N/A
   * @returns true if the critical-hit stage boost applies successfully
   */
  shouldApply(args: any[]): boolean {
    return args && (args.length === 1) && (args[0] instanceof Utils.NumberHolder);
  }

  /**
   * Increases the current critical-hit stage value by 1.
   * @param args [0] {@linkcode Utils.IntegerHolder} that holds the resulting critical-hit level
   * @returns true if the critical-hit stage boost applies successfully
   */
  apply(args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value++;
    return true;
  }
}

export class MapModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  clone(): MapModifier {
    return new MapModifier(this.type, this.stackCount);
  }

  apply(args: any[]): boolean {
    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 1;
  }
}

export class MegaEvolutionAccessModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  clone(): MegaEvolutionAccessModifier {
    return new MegaEvolutionAccessModifier(this.type, this.stackCount);
  }

  apply(args: any[]): boolean {
    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 1;
  }
}

export class GigantamaxAccessModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  clone(): GigantamaxAccessModifier {
    return new GigantamaxAccessModifier(this.type, this.stackCount);
  }

  apply(args: any[]): boolean {
    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 1;
  }
}

export class TerastallizeAccessModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  clone(): TerastallizeAccessModifier {
    return new TerastallizeAccessModifier(this.type, this.stackCount);
  }

  apply(args: any[]): boolean {
    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 1;
  }
}

export abstract class PokemonHeldItemModifier extends PersistentModifier {
  public pokemonId: integer;
  readonly isTransferrable: boolean = true;

  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, stackCount);

    this.pokemonId = pokemonId;
  }

  abstract matchType(_modifier: Modifier): boolean;

  match(modifier: Modifier) {
    return this.matchType(modifier) && (modifier as PokemonHeldItemModifier).pokemonId === this.pokemonId;
  }

  getArgs(): any[] {
    return [ this.pokemonId ];
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length !== 0 && args[0] instanceof Pokemon && (this.pokemonId === -1 || (args[0] as Pokemon).id === this.pokemonId);
  }

  isIconVisible(scene: BattleScene): boolean {
    return !!(this.getPokemon(scene)?.isOnField());
  }

  getIcon(scene: BattleScene, forSummary?: boolean): Phaser.GameObjects.Container {
    const container = !forSummary ? scene.add.container(0, 0) : super.getIcon(scene);

    if (!forSummary) {
      const pokemon = this.getPokemon(scene);
      if (pokemon) {
        const pokemonIcon = scene.addPokemonIcon(pokemon, -2, 10, 0, 0.5);
        container.add(pokemonIcon);
        container.setName(pokemon.id.toString());
      }

      const item = scene.add.sprite(16, this.virtualStackCount ? 8 : 16, "items");
      item.setScale(0.5);
      item.setOrigin(0, 0.5);
      item.setTexture("items", this.type.iconImage);
      container.add(item);

      const stackText = this.getIconStackText(scene);
      if (stackText) {
        container.add(stackText);
      }

      const virtualStackText = this.getIconStackText(scene, true);
      if (virtualStackText) {
        container.add(virtualStackText);
      }
    } else {
      container.setScale(0.5);
    }

    return container;
  }

  getPokemon(scene: BattleScene): Pokemon | undefined {
    return this.pokemonId ? scene.getPokemonById(this.pokemonId) ?? undefined : undefined;
  }

  getScoreMultiplier(): number {
    return 1;
  }

  //Applies to items with chance of activating secondary effects ie Kings Rock
  getSecondaryChanceMultiplier(pokemon: Pokemon): integer {
    // Temporary quickfix to stop game from freezing when the opponet uses u-turn while holding on to king's rock
    if (!pokemon.getLastXMoves(0)[0]) {
      return 1;
    }
    const sheerForceAffected = allMoves[pokemon.getLastXMoves(0)[0].move].chance >= 0 && pokemon.hasAbility(Abilities.SHEER_FORCE);

    if (sheerForceAffected) {
      return 0;
    } else if (pokemon.hasAbility(Abilities.SERENE_GRACE)) {
      return 2;
    }
    return 1;
  }

  getMaxStackCount(scene: BattleScene, forThreshold?: boolean): integer {
    const pokemon = this.getPokemon(scene);
    if (!pokemon) {
      return 0;
    }
    if (pokemon.isPlayer() && forThreshold) {
      return scene.getParty().map(p => this.getMaxHeldItemCount(p)).reduce((stackCount: integer, maxStackCount: integer) => Math.max(stackCount, maxStackCount), 0);
    }
    return this.getMaxHeldItemCount(pokemon);
  }

  abstract getMaxHeldItemCount(pokemon?: Pokemon): integer;
}

export abstract class LapsingPokemonHeldItemModifier extends PokemonHeldItemModifier {
  protected battlesLeft: integer;
  readonly isTransferrable: boolean = false;

  constructor(type: ModifierTypes.ModifierType, pokemonId: integer, battlesLeft?: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);

    this.battlesLeft = battlesLeft!; // TODO: is this bang correct?
  }

  lapse(args: any[]): boolean {
    return !!--this.battlesLeft;
  }

  getIcon(scene: BattleScene, forSummary?: boolean): Phaser.GameObjects.Container {
    const container = super.getIcon(scene, forSummary);

    if (this.getPokemon(scene)?.isPlayer()) {
      const battleCountText = addTextObject(scene, 27, 0, this.battlesLeft.toString(), TextStyle.PARTY, { fontSize: "66px", color: "#f89890" });
      battleCountText.setShadow(0, 0);
      battleCountText.setStroke("#984038", 16);
      battleCountText.setOrigin(1, 0);
      container.add(battleCountText);
    }

    return container;
  }

  getBattlesLeft(): integer {
    return this.battlesLeft;
  }

  getMaxStackCount(scene: BattleScene, forThreshold?: boolean): number {
    return 1;
  }
}

export class TerastallizeModifier extends LapsingPokemonHeldItemModifier {
  public teraType: Type;
  readonly isTransferrable: boolean = false;

  constructor(type: ModifierTypes.TerastallizeModifierType, pokemonId: integer, teraType: Type, battlesLeft?: integer, stackCount?: integer) {
    super(type, pokemonId, battlesLeft || 10, stackCount);

    this.teraType = teraType;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof TerastallizeModifier && modifier.teraType === this.teraType) {
      return true;
    }
    return false;
  }

  clone(): TerastallizeModifier {
    return new TerastallizeModifier(this.type as ModifierTypes.TerastallizeModifierType, this.pokemonId, this.teraType, this.battlesLeft, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.pokemonId, this.teraType, this.battlesLeft ];
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    if (pokemon.isPlayer()) {
      pokemon.scene.validateAchv(achvs.TERASTALLIZE);
      if (this.teraType === Type.STELLAR) {
        pokemon.scene.validateAchv(achvs.STELLAR_TERASTALLIZE);
      }
    }
    pokemon.updateSpritePipelineData();
    return true;
  }

  lapse(args: any[]): boolean {
    const ret = super.lapse(args);
    if (!ret) {
      const pokemon = args[0] as Pokemon;
      pokemon.updateSpritePipelineData();
    }
    return ret;
  }

  getScoreMultiplier(): number {
    return 1.25;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 1;
  }
}

/**
 * Modifier used for held items, specifically vitamins like Carbos, Hp Up, etc., that
 * increase the value of a given {@linkcode PermanentStat}.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class BaseStatModifier extends PokemonHeldItemModifier {
  protected stat: PermanentStat;
  readonly isTransferrable: boolean = false;

  constructor(type: ModifierType, pokemonId: integer, stat: PermanentStat, stackCount?: integer) {
    super(type, pokemonId, stackCount);
    this.stat = stat;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof BaseStatModifier) {
      return (modifier as BaseStatModifier).stat === this.stat;
    }
    return false;
  }

  clone(): PersistentModifier {
    return new BaseStatModifier(this.type, this.pokemonId, this.stat, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.stat);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 2 && Array.isArray(args[1]);
  }

  apply(args: any[]): boolean {
    const baseStats = args[1] as number[];
    baseStats[this.stat] = Math.floor(baseStats[this.stat] * (1 + this.getStackCount() * 0.1));
    return true;
  }

  getScoreMultiplier(): number {
    return 1.1;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return pokemon.ivs[this.stat];
  }
}

/**
 * Modifier used for held items that apply {@linkcode Stat} boost(s)
 * using a multiplier.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class StatBoosterModifier extends PokemonHeldItemModifier {
  /** The stats that the held item boosts */
  protected stats: Stat[];
  /** The multiplier used to increase the relevant stat(s) */
  protected multiplier: number;

  constructor(type: ModifierType, pokemonId: integer, stats: Stat[], multiplier: number, stackCount?: integer) {
    super(type, pokemonId, stackCount);

    this.stats = stats;
    this.multiplier = multiplier;
  }

  clone() {
    return new StatBoosterModifier(this.type, this.pokemonId, this.stats, this.multiplier, this.stackCount);
  }

  getArgs(): any[] {
    return [ ...super.getArgs(), this.stats, this.multiplier ];
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof StatBoosterModifier) {
      const modifierInstance = modifier as StatBoosterModifier;
      if ((modifierInstance.multiplier === this.multiplier) && (modifierInstance.stats.length === this.stats.length)) {
        return modifierInstance.stats.every((e, i) => e === this.stats[i]);
      }
    }

    return false;
  }

  /**
   * Checks if the incoming stat is listed in {@linkcode stats}
   * @param args [0] {@linkcode Pokemon} N/A
   *             [1] {@linkcode Stat} being checked at the time
   *             [2] {@linkcode Utils.NumberHolder} N/A
   * @returns true if the stat could be boosted, false otherwise
   */
  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && this.stats.includes(args[1] as Stat);
  }

  /**
   * Boosts the incoming stat by a {@linkcode multiplier} if the stat is listed
   * in {@linkcode stats}.
   * @param args [0] {@linkcode Pokemon} N/A
   *             [1] {@linkcode Stat} N/A
   *             [2] {@linkcode Utils.NumberHolder} that holds the resulting value of the stat
   * @returns true if the stat boost applies successfully, false otherwise
   * @see shouldApply
   */
  apply(args: any[]): boolean {
    const statValue = args[2] as Utils.NumberHolder;

    statValue.value *= this.multiplier;
    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }
}

/**
 * Modifier used for held items, specifically Eviolite, that apply
 * {@linkcode Stat} boost(s) using a multiplier if the holder can evolve.
 * @extends StatBoosterModifier
 * @see {@linkcode apply}
 */
export class EvolutionStatBoosterModifier extends StatBoosterModifier {
  clone() {
    return super.clone() as EvolutionStatBoosterModifier;
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof EvolutionStatBoosterModifier;
  }

  /**
   * Boosts the incoming stat value by a {@linkcode multiplier} if the holder
   * can evolve. Note that, if the holder is a fusion, they will receive
   * only half of the boost if either of the fused members are fully
   * evolved. However, if they are both unevolved, the full boost
   * will apply.
   * @param args [0] {@linkcode Pokemon} that holds the held item
   *             [1] {@linkcode Stat} N/A
   *             [2] {@linkcode Utils.NumberHolder} that holds the resulting value of the stat
   * @returns true if the stat boost applies successfully, false otherwise
   * @see shouldApply
   */
  apply(args: any[]): boolean {
    const holder = args[0] as Pokemon;
    const statValue = args[2] as Utils.NumberHolder;
    const isUnevolved = holder.getSpeciesForm(true).speciesId in pokemonEvolutions;

    if (holder.isFusion() && (holder.getFusionSpeciesForm(true).speciesId in pokemonEvolutions) !== isUnevolved) {
      // Half boost applied if holder is fused and either part of fusion is fully evolved
      statValue.value *= 1 + (this.multiplier - 1) / 2;
      return true;
    } else if (isUnevolved) {
      // Full boost applied if holder is unfused and unevolved or, if fused, both parts of fusion are unevolved
      return super.apply(args);
    }

    return false;
  }
}

/**
 * Modifier used for held items that apply {@linkcode Stat} boost(s) using a
 * multiplier if the holder is of a specific {@linkcode Species}.
 * @extends StatBoosterModifier
 * @see {@linkcode apply}
 */
export class SpeciesStatBoosterModifier extends StatBoosterModifier {
  /** The species that the held item's stat boost(s) apply to */
  private species: Species[];

  constructor(type: ModifierType, pokemonId: integer, stats: Stat[], multiplier: number, species: Species[], stackCount?: integer) {
    super(type, pokemonId, stats, multiplier, stackCount);

    this.species = species;
  }

  clone() {
    return new SpeciesStatBoosterModifier(this.type, this.pokemonId, this.stats, this.multiplier, this.species, this.stackCount);
  }

  getArgs(): any[] {
    return [ ...super.getArgs(), this.species ];
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof SpeciesStatBoosterModifier) {
      const modifierInstance = modifier as SpeciesStatBoosterModifier;
      if (modifierInstance.species.length === this.species.length) {
        return super.matchType(modifier) && modifierInstance.species.every((e, i) => e === this.species[i]);
      }
    }

    return false;
  }

  /**
   * Checks if the incoming stat is listed in {@linkcode stats} and if the holder's {@linkcode Species}
   * (or its fused species) is listed in {@linkcode species}.
   * @param args [0] {@linkcode Pokemon} that holds the held item
   *             [1] {@linkcode Stat} being checked at the time
   *             [2] {@linkcode Utils.NumberHolder} N/A
   * @returns true if the stat could be boosted, false otherwise
   */
  shouldApply(args: any[]): boolean {
    const holder = args[0] as Pokemon;
    return super.shouldApply(args) && (this.species.includes(holder.getSpeciesForm(true).speciesId) || (holder.isFusion() && this.species.includes(holder.getFusionSpeciesForm(true).speciesId)));
  }

  /**
   * Checks if either parameter is included in the corresponding lists
   * @param speciesId {@linkcode Species} being checked
   * @param stat {@linkcode Stat} being checked
   * @returns true if both parameters are in {@linkcode species} and {@linkcode stats} respectively, false otherwise
   */
  contains(speciesId: Species, stat: Stat): boolean {
    return this.species.includes(speciesId) && this.stats.includes(stat);
  }
}

/**
 * Modifier used for held items that apply critical-hit stage boost(s).
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class CritBoosterModifier extends PokemonHeldItemModifier {
  /** The amount of stages by which the held item increases the current critical-hit stage value */
  protected stageIncrement: number;

  constructor(type: ModifierType, pokemonId: integer, stageIncrement: number, stackCount?: integer) {
    super(type, pokemonId, stackCount);

    this.stageIncrement = stageIncrement;
  }

  clone() {
    return new CritBoosterModifier(this.type, this.pokemonId, this.stageIncrement, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.stageIncrement);
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof CritBoosterModifier) {
      return (modifier as CritBoosterModifier).stageIncrement === this.stageIncrement;
    }

    return false;
  }

  /**
   * Increases the current critical-hit stage value by {@linkcode stageIncrement}.
   * @param args [0] {@linkcode Pokemon} N/A
   *             [1] {@linkcode Utils.IntegerHolder} that holds the resulting critical-hit level
   * @returns true if the critical-hit stage boost applies successfully, false otherwise
   */
  apply(args: any[]): boolean {
    const critStage = args[1] as Utils.NumberHolder;

    critStage.value += this.stageIncrement;
    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }
}

/**
 * Modifier used for held items that apply critical-hit stage boost(s)
 * if the holder is of a specific {@linkcode Species}.
 * @extends CritBoosterModifier
 * @see {@linkcode shouldApply}
 */
export class SpeciesCritBoosterModifier extends CritBoosterModifier {
  /** The species that the held item's critical-hit stage boost applies to */
  private species: Species[];

  constructor(type: ModifierType, pokemonId: integer, stageIncrement: number, species: Species[], stackCount?: integer) {
    super(type, pokemonId, stageIncrement, stackCount);

    this.species = species;
  }

  clone() {
    return new SpeciesCritBoosterModifier(this.type, this.pokemonId, this.stageIncrement, this.species, this.stackCount);
  }

  getArgs(): any[] {
    return [ ...super.getArgs(), this.species ];
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof SpeciesCritBoosterModifier;
  }

  /**
   * Checks if the holder's {@linkcode Species} (or its fused species) is listed
   * in {@linkcode species}.
   * @param args [0] {@linkcode Pokemon} that holds the held item
   *             [1] {@linkcode Utils.IntegerHolder} N/A
   * @returns true if the critical-hit level can be incremented, false otherwise
   */
  shouldApply(args: any[]) {
    const holder = args[0] as Pokemon;

    return super.shouldApply(args) && (this.species.includes(holder.getSpeciesForm(true).speciesId) || (holder.isFusion() && this.species.includes(holder.getFusionSpeciesForm(true).speciesId)));
  }
}

/**
 * Applies Specific Type item boosts (e.g., Magnet)
 */
export class AttackTypeBoosterModifier extends PokemonHeldItemModifier {
  private moveType: Type;
  private boostMultiplier: number;

  constructor(type: ModifierType, pokemonId: integer, moveType: Type, boostPercent: number, stackCount?: integer) {
    super(type, pokemonId, stackCount);

    this.moveType = moveType;
    this.boostMultiplier = boostPercent * 0.01;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof AttackTypeBoosterModifier) {
      const attackTypeBoosterModifier = modifier as AttackTypeBoosterModifier;
      return attackTypeBoosterModifier.moveType === this.moveType && attackTypeBoosterModifier.boostMultiplier === this.boostMultiplier;
    }

    return false;
  }

  clone() {
    return new AttackTypeBoosterModifier(this.type, this.pokemonId, this.moveType, this.boostMultiplier * 100, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat([ this.moveType, this.boostMultiplier * 100 ]);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 3 && typeof args[1] === "number" && args[2] instanceof Utils.NumberHolder;
  }

  /**
 * @param {Array<any>} args Array
 *                          - Index 0: {Pokemon} Pokemon
 *                          - Index 1: {number} Move type
 *                          - Index 2: {Utils.NumberHolder} Move power
 * @returns {boolean} Returns true if boosts have been applied to the move.
 */
  apply(args: any[]): boolean {
    if (args[1] === this.moveType && (args[2] as Utils.NumberHolder).value >= 1) {
      (args[2] as Utils.NumberHolder).value = Math.floor((args[2] as Utils.NumberHolder).value * (1 + (this.getStackCount() * this.boostMultiplier)));
      return true;
    }

    return false;
  }

  getScoreMultiplier(): number {
    return 1.2;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 99;
  }
}

export class SurviveDamageModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof SurviveDamageModifier;
  }

  clone() {
    return new SurviveDamageModifier(this.type, this.pokemonId, this.stackCount);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 2 && args[1] instanceof Utils.BooleanHolder;
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    const surviveDamage = args[1] as Utils.BooleanHolder;

    if (!surviveDamage.value && pokemon.randSeedInt(10) < this.getStackCount()) {
      surviveDamage.value = true;

      pokemon.scene.queueMessage(i18next.t("modifier:surviveDamageApply", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), typeName: this.type.name }));
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 5;
  }
}

export class BypassSpeedChanceModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier) {
    return modifier instanceof BypassSpeedChanceModifier;
  }

  clone() {
    return new BypassSpeedChanceModifier(this.type, this.pokemonId, this.stackCount);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 2 && args[1] instanceof Utils.BooleanHolder;
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    const bypassSpeed = args[1] as Utils.BooleanHolder;

    if (!bypassSpeed.value && pokemon.randSeedInt(10) < this.getStackCount()) {
      bypassSpeed.value = true;
      const isCommandFight = pokemon.scene.currentBattle.turnCommands[pokemon.getBattlerIndex()]?.command === Command.FIGHT;
      const hasQuickClaw = this.type instanceof ModifierTypes.PokemonHeldItemModifierType && this.type.id === "QUICK_CLAW";

      if (isCommandFight && hasQuickClaw) {
        pokemon.scene.queueMessage(i18next.t("modifier:bypassSpeedChanceApply", { pokemonName: getPokemonNameWithAffix(pokemon), itemName: i18next.t("modifierType:ModifierType.QUICK_CLAW.name") }));
      }
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 3;
  }
}

export class FlinchChanceModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier) {
    return modifier instanceof FlinchChanceModifier;
  }

  clone() {
    return new FlinchChanceModifier(this.type, this.pokemonId, this.stackCount);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 2 && args[1] instanceof Utils.BooleanHolder;
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    const flinched = args[1] as Utils.BooleanHolder;

    if (!flinched.value && pokemon.randSeedInt(10) < (this.getStackCount() * this.getSecondaryChanceMultiplier(pokemon))) {
      flinched.value = true;
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 3;
  }
}

export class TurnHealModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier) {
    return modifier instanceof TurnHealModifier;
  }

  clone() {
    return new TurnHealModifier(this.type, this.pokemonId, this.stackCount);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;

    if (!pokemon.isFullHp()) {
      const scene = pokemon.scene;
      scene.unshiftPhase(new PokemonHealPhase(scene, pokemon.getBattlerIndex(),
        Utils.toDmgValue(pokemon.getMaxHp() / 16) * this.stackCount, i18next.t("modifier:turnHealApply", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), typeName: this.type.name }), true));
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 4;
  }
}

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class TurnStatusEffectModifier extends PokemonHeldItemModifier {
  /** The status effect to be applied by the held item */
  private effect: StatusEffect;

  constructor (type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);

    switch (type.id) {
    case "TOXIC_ORB":
      this.effect = StatusEffect.TOXIC;
      break;
    case "FLAME_ORB":
      this.effect = StatusEffect.BURN;
      break;
    }
  }

  /**
   * Checks if {@linkcode modifier} is an instance of this class,
   * intentionally ignoring potentially different {@linkcode effect}s
   * to prevent held item stockpiling since the item obtained first
   * would be the only item able to {@linkcode apply} successfully.
   * @override
   * @param modifier {@linkcode Modifier} being type tested
   * @return true if {@linkcode modifier} is an instance of
   * TurnStatusEffectModifier, false otherwise
   */
  matchType(modifier: Modifier): boolean {
    return modifier instanceof TurnStatusEffectModifier;
  }

  clone() {
    return new TurnStatusEffectModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Tries to inflicts the holder with the associated {@linkcode StatusEffect}.
   * @param args [0] {@linkcode Pokemon} that holds the held item
   * @returns true if the status effect was applied successfully, false if
   * otherwise
   */
  apply(args: any[]): boolean {
    return (args[0] as Pokemon).trySetStatus(this.effect, true, undefined, undefined, this.type.name);
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 1;
  }

  getStatusEffect(): StatusEffect {
    return this.effect;
  }
}

export class HitHealModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier) {
    return modifier instanceof HitHealModifier;
  }

  clone() {
    return new HitHealModifier(this.type, this.pokemonId, this.stackCount);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;

    if (pokemon.turnData.damageDealt && !pokemon.isFullHp()) {
      const scene = pokemon.scene;
      scene.unshiftPhase(new PokemonHealPhase(scene, pokemon.getBattlerIndex(),
        Utils.toDmgValue(pokemon.turnData.damageDealt / 8) * this.stackCount, i18next.t("modifier:hitHealApply", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), typeName: this.type.name }), true));
    }

    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 4;
  }
}

export class LevelIncrementBoosterModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier) {
    return modifier instanceof LevelIncrementBoosterModifier;
  }

  clone() {
    return new LevelIncrementBoosterModifier(this.type, this.stackCount);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args[0] instanceof Utils.IntegerHolder;
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value += this.getStackCount();

    return true;
  }

  getMaxStackCount(scene: BattleScene, forThreshold?: boolean): number {
    return 99;
  }
}

export class BerryModifier extends PokemonHeldItemModifier {
  public berryType: BerryType;
  public consumed: boolean;

  constructor(type: ModifierType, pokemonId: integer, berryType: BerryType, stackCount?: integer) {
    super(type, pokemonId, stackCount);

    this.berryType = berryType;
    this.consumed = false;
  }

  matchType(modifier: Modifier) {
    return modifier instanceof BerryModifier && (modifier as BerryModifier).berryType === this.berryType;
  }

  clone() {
    return new BerryModifier(this.type, this.pokemonId, this.berryType, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.berryType);
  }

  shouldApply(args: any[]): boolean {
    return !this.consumed && super.shouldApply(args) && getBerryPredicate(this.berryType)(args[0] as Pokemon);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;

    const preserve = new Utils.BooleanHolder(false);
    pokemon.scene.applyModifiers(PreserveBerryModifier, pokemon.isPlayer(), pokemon, preserve);

    getBerryEffectFunc(this.berryType)(pokemon);
    if (!preserve.value) {
      this.consumed = true;
    }

    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    if ([BerryType.LUM, BerryType.LEPPA, BerryType.SITRUS, BerryType.ENIGMA].includes(this.berryType)) {
      return 2;
    }
    return 3;
  }
}

export class PreserveBerryModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier) {
    return modifier instanceof PreserveBerryModifier;
  }

  clone() {
    return new PreserveBerryModifier(this.type, this.stackCount);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args[0] instanceof Pokemon && args[1] instanceof Utils.BooleanHolder;
  }

  apply(args: any[]): boolean {
    if (!(args[1] as Utils.BooleanHolder).value) {
      (args[1] as Utils.BooleanHolder).value = (args[0] as Pokemon).randSeedInt(10) < this.getStackCount() * 3;
    }

    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 3;
  }
}

export class PokemonInstantReviveModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier) {
    return modifier instanceof PokemonInstantReviveModifier;
  }

  clone() {
    return new PokemonInstantReviveModifier(this.type, this.pokemonId, this.stackCount);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;

    pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(),
      Utils.toDmgValue(pokemon.getMaxHp() / 2), i18next.t("modifier:pokemonInstantReviveApply", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), typeName: this.type.name }), false, false, true));

    pokemon.resetStatus(true, false, true);
    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 1;
  }
}

/**
 * Modifier used for held items, namely White Herb, that restore adverse stat
 * stages in battle.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class ResetNegativeStatStageModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier) {
    return modifier instanceof ResetNegativeStatStageModifier;
  }

  clone() {
    return new ResetNegativeStatStageModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Goes through the holder's stat stages and, if any are negative, resets that
   * stat stage back to 0.
   * @param args [0] {@linkcode Pokemon} that holds the held item
   * @returns true if any stat stages were reset, false otherwise
   */
  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    let statRestored = false;

    for (const s of BATTLE_STATS) {
      if (pokemon.getStatStage(s) < 0) {
        pokemon.setStatStage(s, 0);
        statRestored = true;
      }
    }

    if (statRestored) {
      pokemon.scene.queueMessage(i18next.t("modifier:resetNegativeStatStageApply", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon), typeName: this.type.name }));
    }
    return statRestored;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): integer {
    return 2;
  }
}

export abstract class ConsumablePokemonModifier extends ConsumableModifier {
  public pokemonId: integer;

  constructor(type: ModifierType, pokemonId: integer) {
    super(type);

    this.pokemonId = pokemonId;
  }

  shouldApply(args: any[]): boolean {
    return args.length !== 0 && args[0] instanceof PlayerPokemon && (this.pokemonId === -1 || (args[0] as PlayerPokemon).id === this.pokemonId);
  }

  getPokemon(scene: BattleScene) {
    return scene.getParty().find(p => p.id === this.pokemonId);
  }
}

export class PokemonHpRestoreModifier extends ConsumablePokemonModifier {
  private restorePoints: integer;
  private restorePercent: number;
  private healStatus: boolean;
  public fainted: boolean;

  constructor(type: ModifierType, pokemonId: integer, restorePoints: integer, restorePercent: number, healStatus: boolean, fainted?: boolean) {
    super(type, pokemonId);

    this.restorePoints = restorePoints;
    this.restorePercent = restorePercent;
    this.healStatus = healStatus;
    this.fainted = !!fainted;
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && (this.fainted || (args.length > 1 && typeof(args[1]) === "number"));
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    if (!pokemon.hp === this.fainted) {
      let restorePoints = this.restorePoints;
      if (!this.fainted) {
        restorePoints = Math.floor(restorePoints * (args[1] as number));
      }
      if (this.fainted || this.healStatus) {
        pokemon.resetStatus(true, true);
      }
      pokemon.hp = Math.min(pokemon.hp + Math.max(Math.ceil(Math.max(Math.floor((this.restorePercent * 0.01) * pokemon.getMaxHp()), restorePoints)), 1), pokemon.getMaxHp());
      return true;
    }
    return false;
  }
}

export class PokemonStatusHealModifier extends ConsumablePokemonModifier {
  constructor(type: ModifierType, pokemonId: integer) {
    super(type, pokemonId);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    pokemon.resetStatus(true, true);
    return true;
  }
}

export abstract class ConsumablePokemonMoveModifier extends ConsumablePokemonModifier {
  public moveIndex: integer;

  constructor(type: ModifierType, pokemonId: integer, moveIndex: integer) {
    super(type, pokemonId);

    this.moveIndex = moveIndex;
  }
}

export class PokemonPpRestoreModifier extends ConsumablePokemonMoveModifier {
  private restorePoints: integer;

  constructor(type: ModifierType, pokemonId: integer, moveIndex: integer, restorePoints: integer) {
    super(type, pokemonId, moveIndex);

    this.restorePoints = restorePoints;
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    const move = pokemon.getMoveset()[this.moveIndex]!; //TODO: is the bang correct?
    move.ppUsed = this.restorePoints > -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;

    return true;
  }
}

export class PokemonAllMovePpRestoreModifier extends ConsumablePokemonModifier {
  private restorePoints: integer;

  constructor(type: ModifierType, pokemonId: integer, restorePoints: integer) {
    super(type, pokemonId);

    this.restorePoints = restorePoints;
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    for (const move of pokemon.getMoveset()) {
      move!.ppUsed = this.restorePoints > -1 ? Math.max(move!.ppUsed - this.restorePoints, 0) : 0; // TODO: are those bangs correct?
    }

    return true;
  }
}

export class PokemonPpUpModifier extends ConsumablePokemonMoveModifier {
  private upPoints: integer;

  constructor(type: ModifierType, pokemonId: integer, moveIndex: integer, upPoints: integer) {
    super(type, pokemonId, moveIndex);

    this.upPoints = upPoints;
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    const move = pokemon.getMoveset()[this.moveIndex]!; // TODO: is the bang correct?
    move.ppUp = Math.min(move.ppUp + this.upPoints, 3);

    return true;
  }
}

export class PokemonNatureChangeModifier extends ConsumablePokemonModifier {
  public nature: Nature;

  constructor(type: ModifierType, pokemonId: integer, nature: Nature) {
    super(type, pokemonId);

    this.nature = nature;
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    pokemon.natureOverride = this.nature;
    let speciesId = pokemon.species.speciesId;
    pokemon.scene.gameData.dexData[speciesId].natureAttr |= 1 << (this.nature + 1);

    while (pokemonPrevolutions.hasOwnProperty(speciesId)) {
      speciesId = pokemonPrevolutions[speciesId];
      pokemon.scene.gameData.dexData[speciesId].natureAttr |= 1 << (this.nature + 1);
    }

    return true;
  }
}

export class PokemonLevelIncrementModifier extends ConsumablePokemonModifier {
  constructor(type: ModifierType, pokemonId: integer) {
    super(type, pokemonId);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as PlayerPokemon;
    const levelCount = new Utils.IntegerHolder(1);
    pokemon.scene.applyModifiers(LevelIncrementBoosterModifier, true, levelCount);

    pokemon.level += levelCount.value;
    if (pokemon.level <= pokemon.scene.getMaxExpLevel(true)) {
      pokemon.exp = getLevelTotalExp(pokemon.level, pokemon.species.growthRate);
      pokemon.levelExp = 0;
    }

    pokemon.addFriendship(5);

    pokemon.scene.unshiftPhase(new LevelUpPhase(pokemon.scene, pokemon.scene.getParty().indexOf(pokemon), pokemon.level - levelCount.value, pokemon.level));

    return true;
  }
}

export class TmModifier extends ConsumablePokemonModifier {
  constructor(type: ModifierTypes.TmModifierType, pokemonId: integer) {
    super(type, pokemonId);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as PlayerPokemon;

    pokemon.scene.unshiftPhase(new LearnMovePhase(pokemon.scene, pokemon.scene.getParty().indexOf(pokemon), (this.type as ModifierTypes.TmModifierType).moveId, true));

    return true;
  }
}

export class RememberMoveModifier extends ConsumablePokemonModifier {
  public levelMoveIndex: integer;

  constructor(type: ModifierTypes.ModifierType, pokemonId: integer, levelMoveIndex: integer) {
    super(type, pokemonId);

    this.levelMoveIndex = levelMoveIndex;
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as PlayerPokemon;

    pokemon.scene.unshiftPhase(new LearnMovePhase(pokemon.scene, pokemon.scene.getParty().indexOf(pokemon), pokemon.getLearnableLevelMoves()[this.levelMoveIndex]));

    return true;
  }
}

export class EvolutionItemModifier extends ConsumablePokemonModifier {
  constructor(type: ModifierTypes.EvolutionItemModifierType, pokemonId: integer) {
    super(type, pokemonId);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as PlayerPokemon;

    let matchingEvolution = pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId)
      ? pokemonEvolutions[pokemon.species.speciesId].find(e => e.item === (this.type as ModifierTypes.EvolutionItemModifierType).evolutionItem
        && (e.evoFormKey === null || (e.preFormKey || "") === pokemon.getFormKey())
        && (!e.condition || e.condition.predicate(pokemon)))
      : null;

    if (!matchingEvolution && pokemon.isFusion()) {
      matchingEvolution = pokemonEvolutions[pokemon.fusionSpecies!.speciesId].find(e => e.item === (this.type as ModifierTypes.EvolutionItemModifierType).evolutionItem // TODO: is the bang correct?
        && (e.evoFormKey === null || (e.preFormKey || "") === pokemon.getFusionFormKey())
        && (!e.condition || e.condition.predicate(pokemon)));
      if (matchingEvolution) {
        matchingEvolution = new FusionSpeciesFormEvolution(pokemon.species.speciesId, matchingEvolution);
      }
    }

    if (matchingEvolution) {
      pokemon.scene.unshiftPhase(new EvolutionPhase(pokemon.scene, pokemon, matchingEvolution, pokemon.level - 1));
      return true;
    }

    return false;
  }
}

export class FusePokemonModifier extends ConsumablePokemonModifier {
  public fusePokemonId: integer;

  constructor(type: ModifierType, pokemonId: integer, fusePokemonId: integer) {
    super(type, pokemonId);

    this.fusePokemonId = fusePokemonId;
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args[1] instanceof PlayerPokemon && this.fusePokemonId === (args[1] as PlayerPokemon).id;
  }

  apply(args: any[]): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      (args[0] as PlayerPokemon).fuse(args[1] as PlayerPokemon).then(() => resolve(true));
    });
  }
}

export class MultipleParticipantExpBonusModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof MultipleParticipantExpBonusModifier;
  }

  apply(_args: any[]): boolean {
    return true;
  }

  clone(): MultipleParticipantExpBonusModifier {
    return new MultipleParticipantExpBonusModifier(this.type, this.stackCount);
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 5;
  }
}

export class HealingBoosterModifier extends PersistentModifier {
  private multiplier: number;

  constructor(type: ModifierType, multiplier: number, stackCount?: integer) {
    super(type, stackCount);

    this.multiplier = multiplier;
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof HealingBoosterModifier;
  }

  clone(): HealingBoosterModifier {
    return new HealingBoosterModifier(this.type, this.multiplier, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.multiplier ];
  }

  apply(args: any[]): boolean {
    const healingMultiplier = args[0] as Utils.IntegerHolder;
    healingMultiplier.value *= 1 + ((this.multiplier - 1) * this.getStackCount());

    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 5;
  }
}

export class ExpBoosterModifier extends PersistentModifier {
  private boostMultiplier: integer;

  constructor(type: ModifierType, boostPercent: number, stackCount?: integer) {
    super(type, stackCount);

    this.boostMultiplier = boostPercent * 0.01;
  }

  match(modifier: Modifier): boolean {
    if (modifier instanceof ExpBoosterModifier) {
      const expModifier = modifier as ExpBoosterModifier;
      return expModifier.boostMultiplier === this.boostMultiplier;
    }
    return false;
  }

  clone(): ExpBoosterModifier {
    return new ExpBoosterModifier(this.type, this.boostMultiplier * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.boostMultiplier * 100 ];
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value = Math.floor((args[0] as Utils.NumberHolder).value * (1 + (this.getStackCount() * this.boostMultiplier)));

    return true;
  }

  getMaxStackCount(scene: BattleScene, forThreshold?: boolean): integer {
    return this.boostMultiplier < 1 ? this.boostMultiplier < 0.6 ? 99 : 30 : 10;
  }
}

export class PokemonExpBoosterModifier extends PokemonHeldItemModifier {
  private boostMultiplier: integer;

  constructor(type: ModifierTypes.PokemonExpBoosterModifierType, pokemonId: integer, boostPercent: number, stackCount?: integer) {
    super(type, pokemonId, stackCount);
    this.boostMultiplier = boostPercent * 0.01;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof PokemonExpBoosterModifier) {
      const pokemonExpModifier = modifier as PokemonExpBoosterModifier;
      return pokemonExpModifier.boostMultiplier === this.boostMultiplier;
    }
    return false;
  }

  clone(): PersistentModifier {
    return new PokemonExpBoosterModifier(this.type as ModifierTypes.PokemonExpBoosterModifierType, this.pokemonId, this.boostMultiplier * 100, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.boostMultiplier * 100);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 2 && args[1] instanceof Utils.NumberHolder;
  }

  apply(args: any[]): boolean {
    (args[1] as Utils.NumberHolder).value = Math.floor((args[1] as Utils.NumberHolder).value * (1 + (this.getStackCount() * this.boostMultiplier)));

    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 99;
  }
}

export class ExpShareModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof ExpShareModifier;
  }

  clone(): ExpShareModifier {
    return new ExpShareModifier(this.type, this.stackCount);
  }

  apply(_args: any[]): boolean {
    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 5;
  }
}

export class ExpBalanceModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof ExpBalanceModifier;
  }

  clone(): ExpBalanceModifier {
    return new ExpBalanceModifier(this.type, this.stackCount);
  }

  apply(_args: any[]): boolean {
    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 4;
  }
}

export class PokemonFriendshipBoosterModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierTypes.PokemonFriendshipBoosterModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonFriendshipBoosterModifier;
  }

  clone(): PersistentModifier {
    return new PokemonFriendshipBoosterModifier(this.type as ModifierTypes.PokemonFriendshipBoosterModifierType, this.pokemonId, this.stackCount);
  }

  apply(args: any[]): boolean {
    const friendship = args[1] as Utils.IntegerHolder;
    friendship.value = Math.floor(friendship.value * (1 + 0.5 * this.getStackCount()));

    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 3;
  }
}

export class PokemonNatureWeightModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierTypes.ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonNatureWeightModifier;
  }

  clone(): PersistentModifier {
    return new PokemonNatureWeightModifier(this.type, this.pokemonId, this.stackCount);
  }

  apply(args: any[]): boolean {
    const multiplier = args[1] as Utils.IntegerHolder;
    if (multiplier.value !== 1) {
      multiplier.value += 0.1 * this.getStackCount() * (multiplier.value > 1 ? 1 : -1);
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 10;
  }
}

export class PokemonMoveAccuracyBoosterModifier extends PokemonHeldItemModifier {
  private accuracyAmount: integer;

  constructor(type: ModifierTypes.PokemonMoveAccuracyBoosterModifierType, pokemonId: integer, accuracy: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
    this.accuracyAmount = accuracy;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof PokemonMoveAccuracyBoosterModifier) {
      const pokemonAccuracyBoosterModifier = modifier as PokemonMoveAccuracyBoosterModifier;
      return pokemonAccuracyBoosterModifier.accuracyAmount === this.accuracyAmount;
    }
    return false;
  }

  clone(): PersistentModifier {
    return new PokemonMoveAccuracyBoosterModifier(this.type as ModifierTypes.PokemonMoveAccuracyBoosterModifierType, this.pokemonId, this.accuracyAmount, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.accuracyAmount);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 2 && args[1] instanceof Utils.NumberHolder;
  }

  apply(args: any[]): boolean {
    const moveAccuracy = (args[1] as Utils.IntegerHolder);
    moveAccuracy.value = Math.min(moveAccuracy.value + this.accuracyAmount * this.getStackCount(), 100);

    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 3;
  }
}

export class PokemonMultiHitModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierTypes.PokemonMultiHitModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonMultiHitModifier;
  }

  clone(): PersistentModifier {
    return new PokemonMultiHitModifier(this.type as ModifierTypes.PokemonMultiHitModifierType, this.pokemonId, this.stackCount);
  }

  apply(args: any[]): boolean {
    (args[1] as Utils.IntegerHolder).value *= (this.getStackCount() + 1);

    const power = args[2] as Utils.NumberHolder;
    switch (this.getStackCount()) {
    case 1:
      power.value *= 0.4;
      break;
    case 2:
      power.value *= 0.25;
      break;
    case 3:
      power.value *= 0.175;
      break;
    }

    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 3;
  }
}

export class PokemonFormChangeItemModifier extends PokemonHeldItemModifier {
  public formChangeItem: FormChangeItem;
  public active: boolean;
  readonly isTransferrable: boolean = false;

  constructor(type: ModifierTypes.FormChangeItemModifierType, pokemonId: integer, formChangeItem: FormChangeItem, active: boolean, stackCount?: integer) {
    super(type, pokemonId, stackCount);
    this.formChangeItem = formChangeItem;
    this.active = active;
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonFormChangeItemModifier && modifier.formChangeItem === this.formChangeItem;
  }

  clone(): PersistentModifier {
    return new PokemonFormChangeItemModifier(this.type as ModifierTypes.FormChangeItemModifierType, this.pokemonId, this.formChangeItem, this.active, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.formChangeItem, this.active);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    const active = args[1] as boolean;

    const switchActive = this.active && !active;

    if (switchActive) {
      this.active = false;
    }

    const ret = pokemon.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeItemTrigger);

    if (switchActive) {
      this.active = true;
    }

    return ret;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 1;
  }
}

export class MoneyRewardModifier extends ConsumableModifier {
  private moneyMultiplier: number;

  constructor(type: ModifierType, moneyMultiplier: number) {
    super(type);

    this.moneyMultiplier = moneyMultiplier;
  }

  apply(args: any[]): boolean {
    const scene = args[0] as BattleScene;
    const moneyAmount = new Utils.IntegerHolder(scene.getWaveMoneyAmount(this.moneyMultiplier));

    scene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    scene.addMoney(moneyAmount.value);

    return true;
  }
}

export class MoneyMultiplierModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof MoneyMultiplierModifier;
  }

  clone(): MoneyMultiplierModifier {
    return new MoneyMultiplierModifier(this.type, this.stackCount);
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value += Math.floor((args[0] as Utils.IntegerHolder).value * 0.2 * this.getStackCount());

    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 5;
  }
}

export class DamageMoneyRewardModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof DamageMoneyRewardModifier;
  }

  clone(): DamageMoneyRewardModifier {
    return new DamageMoneyRewardModifier(this.type, this.pokemonId, this.stackCount);
  }

  apply(args: any[]): boolean {
    const scene = (args[0] as Pokemon).scene;
    const moneyAmount = new Utils.IntegerHolder(Math.floor((args[1] as Utils.IntegerHolder).value * (0.5 * this.getStackCount())));
    scene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);
    scene.addMoney(moneyAmount.value);

    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 5;
  }
}

export class MoneyInterestModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof MoneyInterestModifier;
  }

  apply(args: any[]): boolean {
    const scene = args[0] as BattleScene;
    const interestAmount = Math.floor(scene.money * 0.1 * this.getStackCount());
    scene.addMoney(interestAmount);

    const userLocale = navigator.language || "en-US";
    const formattedMoneyAmount = interestAmount.toLocaleString(userLocale);
    const message = i18next.t("modifier:moneyInterestApply", { moneyAmount: formattedMoneyAmount, typeName: this.type.name });
    scene.queueMessage(message, undefined, true);

    return true;
  }

  clone(): MoneyInterestModifier {
    return new MoneyInterestModifier(this.type, this.stackCount);
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 5;
  }
}

export class HiddenAbilityRateBoosterModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof HiddenAbilityRateBoosterModifier;
  }

  clone(): HiddenAbilityRateBoosterModifier {
    return new HiddenAbilityRateBoosterModifier(this.type, this.stackCount);
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value *= Math.pow(2, -1 - this.getStackCount());

    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 4;
  }
}

export class ShinyRateBoosterModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof ShinyRateBoosterModifier;
  }

  clone(): ShinyRateBoosterModifier {
    return new ShinyRateBoosterModifier(this.type, this.stackCount);
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value *= Math.pow(2, 1 + this.getStackCount());

    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 4;
  }
}

export class LockModifierTiersModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof LockModifierTiersModifier;
  }

  apply(args: any[]): boolean {
    return true;
  }

  clone(): LockModifierTiersModifier {
    return new LockModifierTiersModifier(this.type, this.stackCount);
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 1;
  }
}

export class SwitchEffectTransferModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof SwitchEffectTransferModifier;
  }

  clone(): SwitchEffectTransferModifier {
    return new SwitchEffectTransferModifier(this.type, this.pokemonId, this.stackCount);
  }

  apply(args: any[]): boolean {
    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 1;
  }
}

/**
 * Abstract class for held items that steal other Pokemon's items.
 * @see {@linkcode TurnHeldItemTransferModifier}
 * @see {@linkcode ContactHeldItemTransferChanceModifier}
 */
export abstract class HeldItemTransferModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  /**
   * Determines the targets to transfer items from when this applies.
   * @param args\[0\] the {@linkcode Pokemon} holding this item
   * @returns the opponents of the source {@linkcode Pokemon}
   */
  getTargets(args: any[]): Pokemon[] {
    const pokemon = args[0];

    return pokemon instanceof Pokemon
      ? pokemon.getOpponents()
      : [];
  }

  /**
   * Steals an item from a set of target Pokemon.
   * This prioritizes high-tier held items when selecting the item to steal.
   * @param args \[0\] The {@linkcode Pokemon} holding this item
   * @returns true if an item was stolen; false otherwise.
   */
  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    const opponents = this.getTargets(args);

    if (!opponents.length) {
      return false;
    }

    const targetPokemon = opponents[pokemon.randSeedInt(opponents.length)];

    const transferredItemCount = this.getTransferredItemCount();
    if (!transferredItemCount) {
      return false;
    }

    const poolType = pokemon.isPlayer() ? ModifierTypes.ModifierPoolType.PLAYER : pokemon.hasTrainer() ? ModifierTypes.ModifierPoolType.TRAINER : ModifierTypes.ModifierPoolType.WILD;

    const transferredModifierTypes: ModifierTypes.ModifierType[] = [];
    const itemModifiers = pokemon.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
        && m.pokemonId === targetPokemon.id && m.isTransferrable, targetPokemon.isPlayer()) as PokemonHeldItemModifier[];
    let highestItemTier = itemModifiers.map(m => m.type.getOrInferTier(poolType)).reduce((highestTier, tier) => Math.max(tier!, highestTier), 0); // TODO: is this bang correct?
    let tierItemModifiers = itemModifiers.filter(m => m.type.getOrInferTier(poolType) === highestItemTier);

    const heldItemTransferPromises: Promise<void>[] = [];

    for (let i = 0; i < transferredItemCount; i++) {
      if (!tierItemModifiers.length) {
        while (highestItemTier-- && !tierItemModifiers.length) {
          tierItemModifiers = itemModifiers.filter(m => m.type.tier === highestItemTier);
        }
        if (!tierItemModifiers.length) {
          break;
        }
      }
      const randItemIndex = pokemon.randSeedInt(itemModifiers.length);
      const randItem = itemModifiers[randItemIndex];
      heldItemTransferPromises.push(pokemon.scene.tryTransferHeldItemModifier(randItem, pokemon, false).then(success => {
        if (success) {
          transferredModifierTypes.push(randItem.type);
          itemModifiers.splice(randItemIndex, 1);
        }
      }));
    }

    Promise.all(heldItemTransferPromises).then(() => {
      for (const mt of transferredModifierTypes) {
        pokemon.scene.queueMessage(this.getTransferMessage(pokemon, targetPokemon, mt));
      }
    });

    return !!transferredModifierTypes.length;
  }

  abstract getTransferredItemCount(): integer;

  abstract getTransferMessage(pokemon: Pokemon, targetPokemon: Pokemon, item: ModifierTypes.ModifierType): string;
}

/**
 * Modifier for held items that steal items from the enemy at the end of
 * each turn.
 * @see {@linkcode modifierTypes[MINI_BLACK_HOLE]}
 */
export class TurnHeldItemTransferModifier extends HeldItemTransferModifier {
  isTransferrable: boolean = true;
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof TurnHeldItemTransferModifier;
  }

  clone(): TurnHeldItemTransferModifier {
    return new TurnHeldItemTransferModifier(this.type, this.pokemonId, this.stackCount);
  }

  getTransferredItemCount(): integer {
    return this.getStackCount();
  }

  getTransferMessage(pokemon: Pokemon, targetPokemon: Pokemon, item: ModifierTypes.ModifierType): string {
    return i18next.t("modifier:turnHeldItemTransferApply", { pokemonNameWithAffix: getPokemonNameWithAffix(targetPokemon), itemName: item.name, pokemonName: pokemon.getNameToRender(), typeName: this.type.name });
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 1;
  }

  setTransferrableFalse(): void {
    this.isTransferrable = false;
  }
}

/**
 * Modifier for held items that add a chance to steal items from the target of a
 * successful attack.
 * @see {@linkcode modifierTypes[GRIP_CLAW]}
 * @see {@linkcode HeldItemTransferModifier}
 */
export class ContactHeldItemTransferChanceModifier extends HeldItemTransferModifier {
  private chance: number;

  constructor(type: ModifierType, pokemonId: integer, chancePercent: number, stackCount?: integer) {
    super(type, pokemonId, stackCount);

    this.chance = chancePercent / 100;
  }

  /**
   * Determines the target to steal items from when this applies.
   * @param args\[0\] The {@linkcode Pokemon} holding this item
   * @param args\[1\] The {@linkcode Pokemon} the holder is targeting with an attack
   * @returns The target (args[1]) stored in array format for use in {@linkcode HeldItemTransferModifier.apply}
   */
  getTargets(args: any[]): Pokemon[] {
    const target = args[1];

    return target instanceof Pokemon
      ? [ target ]
      : [];
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof ContactHeldItemTransferChanceModifier;
  }

  clone(): ContactHeldItemTransferChanceModifier {
    return new ContactHeldItemTransferChanceModifier(this.type, this.pokemonId, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.chance * 100);
  }

  getTransferredItemCount(): integer {
    return Phaser.Math.RND.realInRange(0, 1) < (this.chance * this.getStackCount()) ? 1 : 0;
  }

  getTransferMessage(pokemon: Pokemon, targetPokemon: Pokemon, item: ModifierTypes.ModifierType): string {
    return i18next.t("modifier:contactHeldItemTransferApply", { pokemonNameWithAffix: getPokemonNameWithAffix(targetPokemon), itemName: item.name, pokemonName: getPokemonNameWithAffix(pokemon), typeName: this.type.name });
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 5;
  }
}

export class IvScannerModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof IvScannerModifier;
  }

  clone(): IvScannerModifier {
    return new IvScannerModifier(this.type, this.stackCount);
  }

  apply(args: any[]): boolean {
    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 3;
  }
}

export class ExtraModifierModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof ExtraModifierModifier;
  }

  clone(): ExtraModifierModifier {
    return new ExtraModifierModifier(this.type, this.stackCount);
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value += this.getStackCount();

    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 3;
  }
}

export abstract class EnemyPersistentModifier extends PersistentModifier {
  constructor(type: ModifierType, stackCount?: integer) {
    super(type, stackCount);
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 5;
  }
}

abstract class EnemyDamageMultiplierModifier extends EnemyPersistentModifier {
  protected damageMultiplier: number;

  constructor(type: ModifierType, damageMultiplier: number, stackCount?: integer) {
    super(type, stackCount);

    this.damageMultiplier = damageMultiplier;
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value = Math.floor((args[0] as Utils.NumberHolder).value * Math.pow(this.damageMultiplier, this.getStackCount()));

    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 99;
  }
}

export class EnemyDamageBoosterModifier extends EnemyDamageMultiplierModifier {
  constructor(type: ModifierType, boostPercent: number, stackCount?: integer) {
    //super(type, 1 + ((boostPercent || 10) * 0.01), stackCount);
    super(type, 1.05, stackCount); // Hardcode multiplier temporarily
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyDamageBoosterModifier;
  }

  clone(): EnemyDamageBoosterModifier {
    return new EnemyDamageBoosterModifier(this.type, (this.damageMultiplier - 1) * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [ (this.damageMultiplier - 1) * 100 ];
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 999;
  }
}

export class EnemyDamageReducerModifier extends EnemyDamageMultiplierModifier {
  constructor(type: ModifierType, reductionPercent: number, stackCount?: integer) {
    //super(type, 1 - ((reductionPercent || 5) * 0.01), stackCount);
    super(type, 0.975, stackCount); // Hardcode multiplier temporarily
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyDamageReducerModifier;
  }

  clone(): EnemyDamageReducerModifier {
    return new EnemyDamageReducerModifier(this.type, (1 - this.damageMultiplier) * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [ (1 - this.damageMultiplier) * 100 ];
  }

  getMaxStackCount(scene: BattleScene): integer {
    return scene.currentBattle.waveIndex < 2000 ? super.getMaxStackCount(scene) : 999;
  }
}

export class EnemyTurnHealModifier extends EnemyPersistentModifier {
  public healPercent: number;

  constructor(type: ModifierType, healPercent: number, stackCount?: integer) {
    super(type, stackCount);

    // Hardcode temporarily
    this.healPercent = 2;
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyTurnHealModifier;
  }

  clone(): EnemyTurnHealModifier {
    return new EnemyTurnHealModifier(this.type, this.healPercent, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.healPercent ];
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;

    if (!pokemon.isFullHp()) {
      const scene = pokemon.scene;
      scene.unshiftPhase(new PokemonHealPhase(scene, pokemon.getBattlerIndex(),
        Math.max(Math.floor(pokemon.getMaxHp() / (100 / this.healPercent)) * this.stackCount, 1), i18next.t("modifier:enemyTurnHealApply", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }), true, false, false, false, true));
      return true;
    }

    return false;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 10;
  }
}

export class EnemyAttackStatusEffectChanceModifier extends EnemyPersistentModifier {
  public effect: StatusEffect;
  public chance: number;

  constructor(type: ModifierType, effect: StatusEffect, chancePercent: number, stackCount?: integer) {
    super(type, stackCount);

    this.effect = effect;
    //Hardcode temporarily
    this.chance = .025 * ((this.effect === StatusEffect.BURN || this.effect === StatusEffect.POISON) ? 2 : 1);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyAttackStatusEffectChanceModifier && modifier.effect === this.effect;
  }

  clone(): EnemyAttackStatusEffectChanceModifier {
    return new EnemyAttackStatusEffectChanceModifier(this.type, this.effect, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.effect, this.chance * 100 ];
  }

  apply(args: any[]): boolean {
    const target = (args[0] as Pokemon);
    if (Phaser.Math.RND.realInRange(0, 1) < (this.chance * this.getStackCount())) {
      return target.trySetStatus(this.effect, true);
    }

    return false;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 10;
  }
}

export class EnemyStatusEffectHealChanceModifier extends EnemyPersistentModifier {
  public chance: number;

  constructor(type: ModifierType, chancePercent: number, stackCount?: integer) {
    super(type, stackCount);

    //Hardcode temporarily
    this.chance = .025;
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyStatusEffectHealChanceModifier;
  }

  clone(): EnemyStatusEffectHealChanceModifier {
    return new EnemyStatusEffectHealChanceModifier(this.type, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.chance * 100 ];
  }

  apply(args: any[]): boolean {
    const target = (args[0] as Pokemon);
    if (target.status && Phaser.Math.RND.realInRange(0, 1) < (this.chance * this.getStackCount())) {
      target.scene.queueMessage(getStatusEffectHealText(target.status.effect, getPokemonNameWithAffix(target)));
      target.resetStatus();
      target.updateInfo();
      return true;
    }

    return false;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 10;
  }
}

export class EnemyEndureChanceModifier extends EnemyPersistentModifier {
  public chance: number;

  constructor(type: ModifierType, chancePercent?: number, stackCount?: integer) {
    super(type, stackCount || 10);

    //Hardcode temporarily
    this.chance = .02;
  }

  match(modifier: Modifier) {
    return modifier instanceof EnemyEndureChanceModifier;
  }

  clone() {
    return new EnemyEndureChanceModifier(this.type, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.chance * 100 ];
  }

  apply(args: any[]): boolean {
    const target = (args[0] as Pokemon);

    if (target.battleData.endured || Phaser.Math.RND.realInRange(0, 1) >= (this.chance * this.getStackCount())) {
      return false;
    }

    target.addTag(BattlerTagType.ENDURING, 1);

    target.battleData.endured = true;

    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 10;
  }
}

export class EnemyFusionChanceModifier extends EnemyPersistentModifier {
  private chance: number;

  constructor(type: ModifierType, chancePercent: number, stackCount?: integer) {
    super(type, stackCount);

    this.chance = chancePercent / 100;
  }

  match(modifier: Modifier) {
    return modifier instanceof EnemyFusionChanceModifier && modifier.chance === this.chance;
  }

  clone() {
    return new EnemyFusionChanceModifier(this.type, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.chance * 100 ];
  }

  apply(args: any[]): boolean {
    if (Phaser.Math.RND.realInRange(0, 1) >= (this.chance * this.getStackCount())) {
      return false;
    }

    (args[0] as Utils.BooleanHolder).value = true;

    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 10;
  }
}

/**
 * Uses either `MODIFIER_OVERRIDE` in overrides.ts to set {@linkcode PersistentModifier}s for either:
 *  - The player
 *  - The enemy
 * @param scene current {@linkcode BattleScene}
 * @param isPlayer {@linkcode boolean} for whether the player (`true`) or enemy (`false`) is being overridden
 */
export function overrideModifiers(scene: BattleScene, isPlayer: boolean = true): void {
  const modifiersOverride: ModifierTypes.ModifierOverride[] = isPlayer ? Overrides.STARTING_MODIFIER_OVERRIDE : Overrides.OPP_MODIFIER_OVERRIDE;
  if (!modifiersOverride || modifiersOverride.length === 0 || !scene) {
    return;
  }

  // If it's the opponent, clear all of their current modifiers to avoid stacking
  if (!isPlayer) {
    scene.clearEnemyModifiers();
  }

  modifiersOverride.forEach(item => {
    const modifierFunc = modifierTypes[item.name];
    let modifierType: ModifierType | null = modifierFunc();

    if (modifierType instanceof ModifierTypes.ModifierTypeGenerator) {
      const pregenArgs = ("type" in item) && (item.type !== null) ? [item.type] : undefined;
      modifierType = modifierType.generateType([], pregenArgs);
    }

    const modifier = modifierType && modifierType.withIdFromFunc(modifierFunc).newModifier() as PersistentModifier;
    if (modifier) {
      modifier.stackCount = item.count || 1;

      if (isPlayer) {
        scene.addModifier(modifier, true, false, false, true);
      } else {
        scene.addEnemyModifier(modifier, true, true);
      }
    }
  });
}

/**
 * Uses either `HELD_ITEMS_OVERRIDE` in overrides.ts to set {@linkcode PokemonHeldItemModifier}s for either:
 *  - The first member of the player's team when starting a new game
 *  - An enemy {@linkcode Pokemon} being spawned in
 * @param scene current {@linkcode BattleScene}
 * @param pokemon {@linkcode Pokemon} whose held items are being overridden
 * @param isPlayer {@linkcode boolean} for whether the {@linkcode pokemon} is the player's (`true`) or an enemy (`false`)
 */
export function overrideHeldItems(scene: BattleScene, pokemon: Pokemon, isPlayer: boolean = true): void {
  const heldItemsOverride: ModifierTypes.ModifierOverride[] = isPlayer ? Overrides.STARTING_HELD_ITEMS_OVERRIDE : Overrides.OPP_HELD_ITEMS_OVERRIDE;
  if (!heldItemsOverride || heldItemsOverride.length === 0 || !scene) {
    return;
  }

  heldItemsOverride.forEach(item => {
    const modifierFunc = modifierTypes[item.name];
    let modifierType: ModifierType | null = modifierFunc();
    const qty = item.count || 1;

    if (modifierType instanceof ModifierTypes.ModifierTypeGenerator) {
      const pregenArgs = ("type" in item) && (item.type !== null) ? [item.type] : undefined;
      modifierType = modifierType.generateType([], pregenArgs);
    }

    const heldItemModifier = modifierType && modifierType.withIdFromFunc(modifierFunc).newModifier(pokemon) as PokemonHeldItemModifier;
    if (heldItemModifier) {
      heldItemModifier.pokemonId = pokemon.id;
      heldItemModifier.stackCount = qty;
      if (isPlayer) {
        scene.addModifier(heldItemModifier, true, false, false, true);
      } else {
        scene.addEnemyModifier(heldItemModifier, true, true);
      }
    }
  });
}
