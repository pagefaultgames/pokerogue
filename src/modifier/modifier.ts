import * as ModifierTypes from './modifier-type';
import { LearnMovePhase, LevelUpPhase, PokemonHealPhase } from "../phases";
import BattleScene from "../battle-scene";
import { getLevelTotalExp } from "../data/exp";
import { PokeballType } from "../data/pokeball";
import Pokemon, { PlayerPokemon } from "../field/pokemon";
import { Stat } from "../data/pokemon-stat";
import { addTextObject, TextStyle } from "../ui/text";
import { Type } from '../data/type';
import { EvolutionPhase } from '../evolution-phase';
import { FusionSpeciesFormEvolution, pokemonEvolutions } from '../data/pokemon-evolutions';
import { getPokemonMessage } from '../messages';
import * as Utils from "../utils";
import { TempBattleStat } from '../data/temp-battle-stat';
import { BerryType, getBerryEffectFunc, getBerryPredicate } from '../data/berry';
import { StatusEffect, getStatusEffectHealText } from '../data/status-effect';
import { MoneyAchv, achvs } from '../system/achv';
import { VoucherType } from '../system/voucher';
import { PreventBerryUseAbAttr, applyAbAttrs } from '../data/ability';
import { FormChangeItem, SpeciesFormChangeItemTrigger } from '../data/pokemon-forms';
import { Nature } from '#app/data/nature';
import { BattlerTagType } from '#app/data/enums/battler-tag-type';

type ModifierType = ModifierTypes.ModifierType;
export type ModifierPredicate = (modifier: Modifier) => boolean;

const iconOverflowIndex = 24;

export const modifierSortFunc = (a: Modifier, b: Modifier) => {
  const aId = a instanceof PokemonHeldItemModifier ? a.pokemonId : 4294967295;
  const bId = b instanceof PokemonHeldItemModifier ? b.pokemonId : 4294967295;

  return aId < bId ? 1 : aId > bId ? -1 : 0;
};

export class ModifierBar extends Phaser.GameObjects.Container {
  private player: boolean;
  private modifierCache: PersistentModifier[];

  constructor(scene: BattleScene, enemy?: boolean) {
    super(scene, 1 + (enemy ? 302 : 0), 2);

    this.player = !enemy;
    this.setScale(0.5);
  }

  updateModifiers(modifiers: PersistentModifier[]) {
    this.removeAll(true);

    const visibleIconModifiers = modifiers.filter(m => m.isIconVisible(this.scene as BattleScene));

    visibleIconModifiers.sort(modifierSortFunc);

    const thisArg = this;

    visibleIconModifiers.forEach((modifier: PersistentModifier, i: integer) => {
      const icon = modifier.getIcon(this.scene as BattleScene);
      if (i >= iconOverflowIndex)
        icon.setVisible(false);
      this.add(icon);
      this.setModifierIconPosition(icon, visibleIconModifiers.length);
      icon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 32, 24), Phaser.Geom.Rectangle.Contains);
      icon.on('pointerover', () => {
        (this.scene as BattleScene).ui.showTooltip(modifier.type.name, modifier.type.getDescription(this.scene as BattleScene));
        if (this.modifierCache && this.modifierCache.length > iconOverflowIndex)
          thisArg.updateModifierOverflowVisibility(true);
      });
      icon.on('pointerout', () => {
        (this.scene as BattleScene).ui.hideTooltip();
        if (this.modifierCache && this.modifierCache.length > iconOverflowIndex)
          thisArg.updateModifierOverflowVisibility(false);
      });
    });

    for (let icon of this.getAll())
      this.sendToBack(icon);

    this.modifierCache = modifiers;
  }

  updateModifierOverflowVisibility(ignoreLimit: boolean) {
    const modifierIcons = this.getAll().reverse();
    for (let modifier of modifierIcons.map(m => m as Phaser.GameObjects.Container).slice(iconOverflowIndex))
      modifier.setVisible(ignoreLimit);
  }

  setModifierIconPosition(icon: Phaser.GameObjects.Container, modifierCount: integer) {
    let rowIcons: integer = 12 + 6 * Math.max((Math.ceil(Math.min(modifierCount, 24) / 12) - 2), 0);

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

  constructor(type: ModifierType, stackCount: integer) {
    super(type);
    this.stackCount = stackCount === undefined ? 1 : stackCount;
    this.virtualStackCount = 0;
  }

  add(modifiers: PersistentModifier[], virtual: boolean, scene: BattleScene): boolean {
    for (let modifier of modifiers) {
      if (this.match(modifier))
        return modifier.incrementStack(scene, this.stackCount, virtual);
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
      if (!virtual)
        this.stackCount += amount;
      else
        this.virtualStackCount += amount;
      return true;
    }

    return false;
  }

  getStackCount(): integer {
    return this.stackCount + this.virtualStackCount;
  }

  abstract getMaxStackCount(scene: BattleScene, forThreshold?: boolean): integer

  isIconVisible(scene: BattleScene): boolean {
    return true;
  }

  getIcon(scene: BattleScene, forSummary?: boolean): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    const item = scene.add.sprite(0, 12, 'items');
    item.setFrame(this.type.iconImage);
    item.setOrigin(0, 0.5);
    container.add(item);

    const stackText = this.getIconStackText(scene);
    if (stackText)
      container.add(stackText);

    const virtualStackText = this.getIconStackText(scene, true);
    if (virtualStackText)
      container.add(virtualStackText);

    return container;
  }

  getIconStackText(scene: BattleScene, virtual?: boolean): Phaser.GameObjects.BitmapText {
    if (this.getMaxStackCount(scene) === 1 || (virtual && !this.virtualStackCount))
      return null;

    const text = scene.add.bitmapText(10, 15, 'item-count', this.stackCount.toString(), 11);
    text.letterSpacing = -0.5;
    if (this.getStackCount() >= this.getMaxStackCount(scene))
      text.setTint(0xf89890)
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
    pokeballCounts[this.pokeballType] = Math.min(pokeballCounts[this.pokeballType] + this.count, 99);

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

export abstract class LapsingPersistentModifier extends PersistentModifier {
  protected battlesLeft: integer;

  constructor(type: ModifierTypes.ModifierType, battlesLeft?: integer, stackCount?: integer) {
    super(type, stackCount);

    this.battlesLeft = battlesLeft;
  }

  lapse(args: any[]): boolean {
    return !!--this.battlesLeft;
  }

  getIcon(scene: BattleScene): Phaser.GameObjects.Container {
    const container = super.getIcon(scene);

    const battleCountText = addTextObject(scene, 27, 0, this.battlesLeft.toString(), TextStyle.PARTY, { fontSize: '66px', color: '#f89890' });
    battleCountText.setShadow(0, 0, null);
    battleCountText.setStroke('#984038', 16)
    battleCountText.setOrigin(1, 0);
    container.add(battleCountText);

    return container;
  }

  getBattlesLeft(): integer {
    return this.battlesLeft;
  }

  getMaxStackCount(scene: BattleScene, forThreshold?: boolean): number {
    return 99;
  }
}

export class DoubleBattleChanceBoosterModifier extends LapsingPersistentModifier {
  constructor(type: ModifierTypes.DoubleBattleChanceBoosterModifierType, battlesLeft: integer, stackCount?: integer) {
    super(type, battlesLeft, stackCount);
  }

  match(modifier: Modifier): boolean {
    if (modifier instanceof DoubleBattleChanceBoosterModifier)
      return (modifier as DoubleBattleChanceBoosterModifier).battlesLeft === this.battlesLeft;
    return false;
  }

  clone(): DoubleBattleChanceBoosterModifier {
    return new DoubleBattleChanceBoosterModifier(this.type as ModifierTypes.DoubleBattleChanceBoosterModifierType, this.battlesLeft, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.battlesLeft ];
  }

  apply(args: any[]): boolean {
    const doubleBattleChance = args[0] as Utils.NumberHolder;
    doubleBattleChance.value = Math.ceil(doubleBattleChance.value / 2);

    return true;
  }
}

export class TempBattleStatBoosterModifier extends LapsingPersistentModifier {
  private tempBattleStat: TempBattleStat;

  constructor(type: ModifierTypes.TempBattleStatBoosterModifierType, tempBattleStat: TempBattleStat, battlesLeft?: integer, stackCount?: integer) {
    super(type, battlesLeft || 5, stackCount);

    this.tempBattleStat = tempBattleStat;
  }

  match(modifier: Modifier): boolean {
    if (modifier instanceof TempBattleStatBoosterModifier)
      return (modifier as TempBattleStatBoosterModifier).tempBattleStat === this.tempBattleStat
        && (modifier as TempBattleStatBoosterModifier).battlesLeft === this.battlesLeft;
    return false;
  }

  clone(): TempBattleStatBoosterModifier {
    return new TempBattleStatBoosterModifier(this.type as ModifierTypes.TempBattleStatBoosterModifierType, this.tempBattleStat, this.battlesLeft, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.tempBattleStat, this.battlesLeft ];
  }

  apply(args: any[]): boolean {
    const tempBattleStat = args[0] as TempBattleStat;

    if (tempBattleStat === this.tempBattleStat) {
      const statLevel = args[1] as Utils.IntegerHolder;
      statLevel.value = Math.min(statLevel.value + 1, 6);
      return true;
    }

    return false;
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

  constructor(type: ModifierType, pokemonId: integer, stackCount: integer) {
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
    return super.shouldApply(args) && args.length && args[0] instanceof Pokemon && (this.pokemonId === -1 || (args[0] as Pokemon).id === this.pokemonId);
  }

  getTransferrable(withinParty: boolean) {
    return true;
  }

  isIconVisible(scene: BattleScene): boolean {
    return this.getPokemon(scene).isOnField();
  }

  getIcon(scene: BattleScene, forSummary?: boolean): Phaser.GameObjects.Container {
    const container = !forSummary ? scene.add.container(0, 0) : super.getIcon(scene);

    if (!forSummary) {
      const pokemon = this.getPokemon(scene);
      const pokemonIcon = scene.addPokemonIcon(pokemon, -2, 10, 0, 0.5);

      container.add(pokemonIcon);

      const item = scene.add.sprite(16, this.virtualStackCount ? 8 : 16, 'items');
      item.setScale(0.5);
      item.setOrigin(0, 0.5);
      item.setTexture('items', this.type.iconImage);
      container.add(item);

      const stackText = this.getIconStackText(scene);
      if (stackText)
        container.add(stackText);

      const virtualStackText = this.getIconStackText(scene, true);
      if (virtualStackText)
        container.add(virtualStackText);
    } else
      container.setScale(0.5);

    return container;
  }

  getPokemon(scene: BattleScene): Pokemon {
    return scene.getPokemonById(this.pokemonId);
  }

  getScoreMultiplier(): number {
    return 1;
  }

  getMaxStackCount(scene: BattleScene, forThreshold?: boolean): integer {
    const pokemon = this.getPokemon(scene);
    if (!pokemon)
      return 0;
    if (pokemon.isPlayer() && forThreshold)
      return scene.getParty().map(p => this.getMaxHeldItemCount(p)).reduce((stackCount: integer, maxStackCount: integer) => Math.max(stackCount, maxStackCount), 0);
    return this.getMaxHeldItemCount(pokemon);
  }

  abstract getMaxHeldItemCount(pokemon: Pokemon): integer
}

export abstract class LapsingPokemonHeldItemModifier extends PokemonHeldItemModifier {
  protected battlesLeft: integer;

  constructor(type: ModifierTypes.ModifierType, pokemonId: integer, battlesLeft?: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);

    this.battlesLeft = battlesLeft;
  }

  lapse(args: any[]): boolean {
    return !!--this.battlesLeft;
  }

  getIcon(scene: BattleScene, forSummary?: boolean): Phaser.GameObjects.Container {
    const container = super.getIcon(scene, forSummary);

    if (this.getPokemon(scene).isPlayer()) {
      const battleCountText = addTextObject(scene, 27, 0, this.battlesLeft.toString(), TextStyle.PARTY, { fontSize: '66px', color: '#f89890' });
      battleCountText.setShadow(0, 0, null);
      battleCountText.setStroke('#984038', 16)
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

  constructor(type: ModifierTypes.TerastallizeModifierType, pokemonId: integer, teraType: Type, battlesLeft?: integer, stackCount?: integer) {
    super(type, pokemonId, battlesLeft || 10, stackCount);

    this.teraType = teraType;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof TerastallizeModifier && modifier.teraType === this.teraType)
      return true;
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
      if (this.teraType === Type.STELLAR)
        pokemon.scene.validateAchv(achvs.STELLAR_TERASTALLIZE);
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
  
  getTransferrable(withinParty: boolean): boolean {
    return false;
  }

  getScoreMultiplier(): number {
    return 1.25;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 1;
  }
}

export class PokemonBaseStatModifier extends PokemonHeldItemModifier {
  protected stat: Stat;

  constructor(type: ModifierTypes.PokemonBaseStatBoosterModifierType, pokemonId: integer, stat: Stat, stackCount?: integer) {
    super(type, pokemonId, stackCount);
    this.stat = stat;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof PokemonBaseStatModifier)
      return (modifier as PokemonBaseStatModifier).stat === this.stat;
    return false;
  }

  clone(): PersistentModifier {
    return new PokemonBaseStatModifier(this.type as ModifierTypes.PokemonBaseStatBoosterModifierType, this.pokemonId, this.stat, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.stat);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 2 && args[1] instanceof Array;
  }

  apply(args: any[]): boolean {
    args[1][this.stat] = Math.min(Math.floor(args[1][this.stat] * (1 + this.getStackCount() * 0.1)), 999999);

    return true;
  }

  getTransferrable(_withinParty: boolean): boolean {
    return false;
  }

  getScoreMultiplier(): number {
    return 1.1;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return pokemon.ivs[this.stat];
  }
}

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
    return super.shouldApply(args) && args.length === 3 && typeof args[1] === 'number' && args[2] instanceof Utils.NumberHolder;
  }

  apply(args: any[]): boolean {
    if (args[1] === this.moveType) {
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

      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` hung on\nusing its ${this.type.name}!`));
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 5;
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

    if (!flinched.value && pokemon.randSeedInt(10) < this.getStackCount()) {
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

    if (pokemon.getHpRatio() < 1) {
      const scene = pokemon.scene;
      scene.unshiftPhase(new PokemonHealPhase(scene, pokemon.getBattlerIndex(),
        Math.max(Math.floor(pokemon.getMaxHp() / 16) * this.stackCount, 1), getPokemonMessage(pokemon, `'s ${this.type.name}\nrestored its HP a little!`), true));
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 4;
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

    if (pokemon.turnData.damageDealt && pokemon.getHpRatio() < 1) {
      const scene = pokemon.scene;
      scene.unshiftPhase(new PokemonHealPhase(scene, pokemon.getBattlerIndex(),
        Math.max(Math.floor(pokemon.turnData.damageDealt / 8) * this.stackCount, 1), getPokemonMessage(pokemon, `'s ${this.type.name}\nrestored its HP a little!`), true));
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
    if (!preserve.value)
      this.consumed = true;

    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 10;
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
    if (!(args[1] as Utils.BooleanHolder).value)
      (args[1] as Utils.BooleanHolder).value = (args[0] as Pokemon).randSeedInt(this.getMaxStackCount(null)) < this.getStackCount();

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
      Math.max(Math.floor(pokemon.getMaxHp() / 2), 1), getPokemonMessage(pokemon, ` was revived\nby its ${this.type.name}!`), false, false, true));

    pokemon.resetStatus();

    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 1;
  }
}

export abstract class ConsumablePokemonModifier extends ConsumableModifier {
  public pokemonId: integer;

  constructor(type: ModifierType, pokemonId: integer) {
    super(type);

    this.pokemonId = pokemonId;
  }

  shouldApply(args: any[]): boolean {
    return args.length && args[0] instanceof PlayerPokemon && (this.pokemonId === -1 || (args[0] as PlayerPokemon).id === this.pokemonId);
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
    return super.shouldApply(args) && (this.fainted || (args.length > 1 && typeof(args[1]) === 'number'));
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    if (!pokemon.hp === this.fainted) {
      let restorePoints = this.restorePoints;
      if (!this.fainted)
        restorePoints = Math.floor(restorePoints * (args[1] as number));
      if (this.fainted || this.healStatus)
        pokemon.resetStatus();
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
    pokemon.resetStatus();

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
    const move = pokemon.getMoveset()[this.moveIndex];
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
    for (let move of pokemon.getMoveset())
      move.ppUsed = this.restorePoints > -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;

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
    const move = pokemon.getMoveset()[this.moveIndex];
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

    const friendshipIncrease = new Utils.IntegerHolder(5);
    pokemon.scene.applyModifier(PokemonFriendshipBoosterModifier, true, pokemon, friendshipIncrease);
    pokemon.friendship = Math.min(pokemon.friendship + friendshipIncrease.value, 255);

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

    pokemon.scene.unshiftPhase(new LearnMovePhase(pokemon.scene, pokemon.scene.getParty().indexOf(pokemon), (this.type as ModifierTypes.TmModifierType).moveId));

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
        && (e.evoFormKey === null || (e.preFormKey || '') === pokemon.getFormKey())
        && (!e.condition || e.condition.predicate(pokemon)))
      : null;

    if (!matchingEvolution && pokemon.isFusion()) {
      matchingEvolution = pokemonEvolutions[pokemon.fusionSpecies.speciesId].find(e => e.item === (this.type as ModifierTypes.EvolutionItemModifierType).evolutionItem
        && (e.evoFormKey === null || (e.preFormKey || '') === pokemon.getFusionFormKey())
        && (!e.condition || e.condition.predicate(pokemon)));
      if (matchingEvolution)
        matchingEvolution = new FusionSpeciesFormEvolution(pokemon.species.speciesId, matchingEvolution);
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
    return 5;
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
    (args[1] as Utils.IntegerHolder).value *= 1 + 0.5 * this.getStackCount();

    return true;
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 5;
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

    let switchActive = this.active && !active;

    if (switchActive)
      this.active = false;

    const ret = pokemon.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeItemTrigger);

    if (switchActive)
      this.active = true;

    return ret;
  }

  getTransferrable(withinParty: boolean) {
    return withinParty;
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

    scene.queueMessage(`You received interest of ₽${interestAmount.toLocaleString('en-US')}\nfrom the ${this.type.name}!`, null, true);

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
    (args[0] as Utils.IntegerHolder).value *= Math.pow(2, 2 + this.getStackCount());

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

export abstract class HeldItemTransferModifier extends PokemonHeldItemModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    const opponents = pokemon.getOpponents();

    if (!opponents.length)
      return false;

    const targetPokemon = opponents[pokemon.randSeedInt(opponents.length)];

    const transferredItemCount = this.getTransferredItemCount();
    if (!transferredItemCount)
      return false;

    const withinParty = pokemon.isPlayer() === targetPokemon.isPlayer();
    const poolType = pokemon.isPlayer() ? ModifierTypes.ModifierPoolType.PLAYER : pokemon.hasTrainer() ? ModifierTypes.ModifierPoolType.TRAINER : ModifierTypes.ModifierPoolType.WILD;

    const transferredModifierTypes: ModifierTypes.ModifierType[] = [];
    const itemModifiers = pokemon.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
        && (m as PokemonHeldItemModifier).pokemonId === targetPokemon.id && m.getTransferrable(withinParty), targetPokemon.isPlayer()) as PokemonHeldItemModifier[];
    let highestItemTier = itemModifiers.map(m => m.type.getOrInferTier(poolType)).reduce((highestTier, tier) => Math.max(tier, highestTier), 0);
    let tierItemModifiers = itemModifiers.filter(m => m.type.getOrInferTier(poolType) === highestItemTier);

    let heldItemTransferPromises: Promise<void>[] = [];
    
    for (let i = 0; i < transferredItemCount; i++) {
      if (!tierItemModifiers.length) {
        while (highestItemTier-- && !tierItemModifiers.length)
          tierItemModifiers = itemModifiers.filter(m => m.type.tier === highestItemTier);
        if (!tierItemModifiers.length)
          break;
      }
      const randItemIndex = pokemon.randSeedInt(itemModifiers.length);
      const randItem = itemModifiers[randItemIndex];
      heldItemTransferPromises.push(pokemon.scene.tryTransferHeldItemModifier(randItem, pokemon, false, false).then(success => {
        if (success) {
          transferredModifierTypes.push(randItem.type);
          itemModifiers.splice(randItemIndex, 1);
        }
      }));
    }

    Promise.all(heldItemTransferPromises).then(() => {
      for (let mt of transferredModifierTypes)
        pokemon.scene.queueMessage(this.getTransferMessage(pokemon, targetPokemon, mt));
    });

    return !!transferredModifierTypes.length;
  }

  abstract getTransferredItemCount(): integer

  abstract getTransferMessage(pokemon: Pokemon, targetPokemon: Pokemon, item: ModifierTypes.ModifierType): string
}

export class TurnHeldItemTransferModifier extends HeldItemTransferModifier {
  constructor(type: ModifierType, pokemonId: integer, stackCount?: integer) {
    super(type, pokemonId, stackCount);
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof TurnHeldItemTransferModifier;
  }

  clone(): TurnHeldItemTransferModifier {
    return new TurnHeldItemTransferModifier(this.type, this.pokemonId, this.stackCount);
  }

  getTransferrable(withinParty: boolean) {
    return withinParty;
  }

  getTransferredItemCount(): integer {
    return this.getStackCount();
  }

  getTransferMessage(pokemon: Pokemon, targetPokemon: Pokemon, item: ModifierTypes.ModifierType): string {
    return getPokemonMessage(targetPokemon, `'s ${item.name} was absorbed\nby ${pokemon.name}'s ${this.type.name}!`);
  }

  getMaxHeldItemCount(pokemon: Pokemon): integer {
    return 1;
  }
}

export class ContactHeldItemTransferChanceModifier extends HeldItemTransferModifier {
  private chance: number;

  constructor(type: ModifierType, pokemonId: integer, chancePercent: number, stackCount?: integer) {
    super(type, pokemonId, stackCount);

    this.chance = chancePercent / 100;
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
    return getPokemonMessage(targetPokemon, `'s ${item.name} was snatched\nby ${pokemon.name}'s ${this.type.name}!`);
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
  private healPercent: number;

  constructor(type: ModifierType, healPercent: number, stackCount?: integer) {
    super(type, stackCount);

    // Hardcode temporarily
    this.healPercent = 3;
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

    if (pokemon.getHpRatio() < 1) {
      const scene = pokemon.scene;
      scene.unshiftPhase(new PokemonHealPhase(scene, pokemon.getBattlerIndex(),
        Math.max(Math.floor(pokemon.getMaxHp() / (100 / this.healPercent)) * this.stackCount, 1), getPokemonMessage(pokemon, `\nrestored some HP!`), true, false, false, false, true));
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
  private chance: number;

  constructor(type: ModifierType, effect: StatusEffect, chancePercent: number, stackCount?: integer) {
    super(type, stackCount);

    this.effect = effect;
    this.chance = (chancePercent || 10) / 100;
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyAttackStatusEffectChanceModifier && modifier.effect === this.effect && modifier.chance === this.chance;
  }

  clone(): EnemyAttackStatusEffectChanceModifier {
    return new EnemyAttackStatusEffectChanceModifier(this.type, this.effect, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.effect, this.chance * 100 ];
  }

  apply(args: any[]): boolean {
    const target = (args[0] as Pokemon);
    if (Phaser.Math.RND.realInRange(0, 1) < (this.chance * this.getStackCount()))
      return target.trySetStatus(this.effect, true);

    return false;
  }
}

export class EnemyStatusEffectHealChanceModifier extends EnemyPersistentModifier {
  private chance: number;

  constructor(type: ModifierType, chancePercent: number, stackCount?: integer) {
    super(type, stackCount);

    this.chance = (chancePercent || 10) / 100;
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyStatusEffectHealChanceModifier && modifier.chance === this.chance;
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
      target.scene.queueMessage(getPokemonMessage(target, getStatusEffectHealText(target.status.effect)));
      target.resetStatus();
      target.updateInfo();
      return true;
    }

    return false;
  }
}

export class EnemyEndureChanceModifier extends EnemyPersistentModifier {
  private chance: number;

  constructor(type: ModifierType, chancePercent: number, stackCount?: integer) {
    super(type, stackCount);

    this.chance = (chancePercent || 2.5) / 100;
  }

  match(modifier: Modifier) {
    return modifier instanceof EnemyEndureChanceModifier && modifier.chance === this.chance;
  }

  clone() {
    return new EnemyEndureChanceModifier(this.type, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [ this.chance * 100 ];
  }

  apply(args: any[]): boolean {
    const target = (args[0] as Pokemon);

    if (target.battleData.endured || Phaser.Math.RND.realInRange(0, 1) >= (this.chance * this.getStackCount()))
      return false;
    
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
    if (Phaser.Math.RND.realInRange(0, 1) >= (this.chance * this.getStackCount()))
      return false;

    (args[0] as Utils.BooleanHolder).value = true;

    return true;
  }

  getMaxStackCount(scene: BattleScene): integer {
    return 10;
  }
}