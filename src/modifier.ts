import BattleScene from "./battle-scene";
import { getPokeballName, PokeballType } from "./pokeball";
import Pokemon, { PlayerPokemon } from "./pokemon";
import { Stat, getStatName } from "./pokemon-stat";
import { addTextObject, TextStyle } from "./text";
import PartyUiHandler from "./ui/party-ui-handler";
import * as Utils from "./utils";

export class ModifierBar extends Phaser.GameObjects.Container {
  constructor(scene: BattleScene) {
    super(scene, 1, 2);

    this.setScale(0.5);
  }

  addModifier(modifier: Modifier) {
    const icon = modifier.getIcon(this.scene as BattleScene);
    this.add(icon);
    this.setModifierIconPosition(icon);
  }

  updateModifier(modifier: Modifier, modifiers: Modifier[]) {
    const index = modifiers.indexOf(modifier);
    if (index > -1) {
      this.getAt(index).destroy();
      const newIcon = modifier.getIcon(this.scene as BattleScene);
      this.addAt(newIcon, index);
      this.setModifierIconPosition(newIcon);
    }
  }

  setModifierIconPosition(icon: Phaser.GameObjects.Container) {
    const x = (this.getIndex(icon) % 12) * 26;
    const y = Math.floor((this.getIndex(icon) * 6) / (this.scene.game.canvas.width / 6)) * 20;

    icon.setPosition(x, y);
  }
}

export abstract class Modifier {
  public type: ModifierType;
  public stackCount: integer;

  constructor(type: ModifierType) {
    this.type = type;
    this.stackCount = 1;
  }

  add(modifierBar: ModifierBar, modifiers: Modifier[]): boolean {
    modifiers.push(this);

    modifierBar.addModifier(this);

    return true;
  }

  shouldApply(_args: any[]): boolean {
    return true;
  }

  abstract apply(args: any[]): boolean;

  incrementStack(): void {
    this.stackCount++;
  }

  getIcon(scene: BattleScene): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    const item = scene.add.sprite(0, 12, 'items');
    item.setFrame(this.type.iconImage);
    item.setOrigin(0, 0.5);
    container.add(item);

    const stackText = this.getIconStackText(scene);
    if (stackText)
      container.add(stackText);

    return container;
  }

  getIconStackText(scene: BattleScene): Phaser.GameObjects.Text {
    if (this.stackCount <= 1)
      return null;

    const text = addTextObject(scene, 16, 12, this.stackCount.toString(), TextStyle.PARTY, { fontSize: '66px' });
    text.setStroke('#424242', 16)
    text.setOrigin(1, 0);

    return text;
  }
}

export abstract class ConsumableModifier extends Modifier {
  constructor(type: ModifierType) {
    super(type);
  }

  add(_modifierBar: ModifierBar, _modifiers: Modifier[]): boolean {
    return true;
  }

  shouldApply(args: any[]): boolean {
    return args.length === 1 && args[0] instanceof BattleScene;
  }
}

class AddPokeballModifier extends ConsumableModifier {
  private pokeballType: PokeballType;
  private count: integer;

  constructor(type: ModifierType, pokeballType: PokeballType, count: integer) {
    super(type);

    this.pokeballType = pokeballType;
    this.count = count;
  }

  apply(args: any[]): boolean {
    (args[0] as BattleScene).pokeballCounts[this.pokeballType] += this.count;
    console.log((args[0] as BattleScene).pokeballCounts);

    return true;
  }
}

export abstract class PokemonModifier extends Modifier {
  public pokemonId: integer;

  constructor(type: ModifierType, pokemonId: integer) {
    super(type);

    this.pokemonId = pokemonId;
  }

  shouldApply(args: any[]): boolean {
    return args.length && args[0] === this.pokemonId;
  }

  getIcon(scene: BattleScene): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    const pokemon = this.getPokemon(scene);
    const pokemonIcon = scene.add.sprite(0, 8, pokemon.getIconAtlasKey());
    pokemonIcon.play(pokemon.getIconKey()).stop();
    pokemonIcon.setOrigin(0, 0.5);

    container.add(pokemonIcon);

    return container;
  }

  getPokemon(scene: BattleScene) {
    return scene.getParty().find(p => p.id === this.pokemonId);
  }
}

export class PokemonBaseStatModifier extends PokemonModifier {
  protected stat: Stat;

  constructor(type: PokemonBaseStatBoosterModifierType, pokemonId: integer, stat: Stat) {
    super(type, pokemonId);
    this.stat = stat;
  }

  add(modifierBar: ModifierBar, modifiers: Modifier[]): boolean {
    for (let modifier of modifiers) {
      if (modifier instanceof PokemonBaseStatModifier) {
        const pokemonStatModifier = modifier as PokemonBaseStatModifier;
        console.log(pokemonStatModifier.stat, this.stat, pokemonStatModifier.pokemonId === this.pokemonId && pokemonStatModifier.stat === this.stat)
        if (pokemonStatModifier.pokemonId === this.pokemonId && pokemonStatModifier.stat === this.stat) {
          pokemonStatModifier.incrementStack();
          modifierBar.updateModifier(pokemonStatModifier, modifiers);
          return true;
        }
      }
    }

    return super.add(modifierBar, modifiers);
  }

  shouldApply(args: any[]): boolean {
    console.log(args, this.pokemonId, args)
    return super.shouldApply(args) && args.length === 2 && args[1] instanceof Array<integer>;
  }

  apply(args: any[]): boolean {
    args[1][this.stat] = Math.min(Math.floor(args[1][this.stat] * (1 + this.stackCount * 0.1)), 999999);

    return true;
  }

  getIcon(scene: BattleScene): Phaser.GameObjects.Container {
    const container = super.getIcon(scene);

    const item = scene.add.sprite(16, 16, 'items');
    item.setScale(0.5);
    item.setOrigin(0, 0.5);
    item.setTexture('items', this.type.iconImage);
    container.add(item);

    const stackText = this.getIconStackText(scene);
    if (stackText)
      container.add(stackText);

    return container;
  }
}

export abstract class ConsumablePokemonModifier extends PokemonModifier {
  constructor(type: ModifierType, pokemonId: integer) {
    super(type, pokemonId);
  }

  add(_modifierBar: ModifierBar, _modifiers: Modifier[]): boolean {
    return true;
  }

  shouldApply(args: any[]): boolean {
    return args.length === 1 && args[0] instanceof Pokemon && (this.pokemonId === -1 || (args[0] as Pokemon).id === this.pokemonId);
  }
}

export class PokemonHpRestoreModifier extends ConsumablePokemonModifier {
  private restorePercent: integer;
  private fainted: boolean;

  constructor(type: ModifierType, pokemonId: integer, restorePercent: integer, fainted?: boolean) {
    super(type, pokemonId);

    this.restorePercent = restorePercent;
    this.fainted = !!fainted;
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    if (!pokemon.hp === this.fainted)
      pokemon.hp = Math.min(pokemon.hp + Math.max((this.restorePercent * 0.01) * pokemon.getMaxHp(), this.restorePercent), pokemon.getMaxHp());

    return true;
  }
}

export class ExpBoosterModifier extends Modifier {
  private boostMultiplier: integer;

  constructor(type: ModifierType, boostPercent: integer) {
    super(type);

    this.boostMultiplier = boostPercent * 0.01;
  }

  add(modifierBar: ModifierBar, modifiers: Modifier[]): boolean {
    for (let modifier of modifiers) {
      if (modifier instanceof ExpBoosterModifier) {
        const expModifier = modifier as ExpBoosterModifier;
        if (expModifier.boostMultiplier === this.boostMultiplier) {
          expModifier.incrementStack();
          modifierBar.updateModifier(expModifier, modifiers);
          return true;
        }
      }
    }

    return super.add(modifierBar, modifiers);
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = Math.floor((args[0] as Utils.IntegerHolder).value * (1 + (this.stackCount * (this.boostMultiplier))));

    return true;
  }
}

export class ShinyRateBoosterModifier extends Modifier {
  constructor(type: ModifierType) {
    super(type);
  }

  add(modifierBar: ModifierBar, modifiers: Modifier[]): boolean {
    for (let modifier of modifiers) {
      if (modifier instanceof ShinyRateBoosterModifier) {
        const shinyRateModifier = modifier as ShinyRateBoosterModifier;
        shinyRateModifier.incrementStack();
        modifierBar.updateModifier(shinyRateModifier, modifiers);
        return true;
      }
    }

    return super.add(modifierBar, modifiers);
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = Math.pow((args[0] as Utils.IntegerHolder).value * 0.5, this.stackCount + 1);

    return true;
  }
}

export class ExtraModifierModifier extends Modifier {
  constructor(type: ModifierType) {
    super(type);
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value += this.stackCount;

    return true;
  }
}

export enum ModifierTier {
  COMMON,
  GREAT,
  ULTRA,
  MASTER,
  LUXURY
};

export class ModifierType {
  public name: string;
  public description: string;
  public iconImage: string;
  public tier: ModifierTier;
  private newModifierFunc: Function;

  constructor(name: string, description: string, newModifierFunc: Function, iconImage?: string) {
    this.name = name;
    this.description = description;
    this.iconImage = iconImage || name.replace(/[ \-]/g, '_').toLowerCase();
    this.newModifierFunc = newModifierFunc;
  }

  setTier(tier: ModifierTier) {
    this.tier = tier;
  }

  newModifier(...args: any[]) {
    return this.newModifierFunc(this, args);
  }
}

class AddPokeballModifierType extends ModifierType {
  constructor(pokeballType: PokeballType, count: integer, iconImage?: string) {
    super(`${count}x ${getPokeballName(pokeballType)}`, `Receive ${getPokeballName(pokeballType)} x${count}`, (_type, _args) => new AddPokeballModifier(this, pokeballType, count), iconImage);
  }
}

export abstract class PokemonModifierType extends ModifierType {
  public selectFilter: Function;

  constructor(name: string, description: string, newModifierFunc: Function, selectFilter?: Function, iconImage?: string) {
    super(name, description, newModifierFunc, iconImage);

    this.selectFilter = selectFilter;
  }
}

export class PokemonHpRestoreModifierType extends PokemonModifierType {
  protected restorePercent: integer;

  constructor(name: string, restorePercent: integer, newModifierFunc?: Function, iconImage?: string) {
    super(name, `Restore ${restorePercent} HP or ${restorePercent}% HP for one POKéMON, whichever is higher`,
      newModifierFunc || ((_type, args) => new PokemonHpRestoreModifier(this, args[0], this.restorePercent, false)),
    (pokemon: PlayerPokemon) => {
      if (pokemon.hp >= pokemon.getMaxHp())
        return PartyUiHandler.NoEffectMessage;
      return null;
    }, iconImage);

    this.restorePercent = restorePercent;
  }
}

export class PokemonReviveModifierType extends PokemonHpRestoreModifierType {
  constructor(name: string, restorePercent: integer, iconImage?: string) {
    super(name, restorePercent, (_type, args) => new PokemonHpRestoreModifier(this, args[0], this.restorePercent, true), iconImage);

    this.description = `Revive one POKéMON and restore ${restorePercent}% HP`;
    this.selectFilter = (pokemon: PlayerPokemon) => {
      if (pokemon.hp)
        return PartyUiHandler.NoEffectMessage;
      return null;
    };
  }
}

export class PokemonBaseStatBoosterModifierType extends PokemonModifierType {
  private stat: Stat;

  constructor(name: string, stat: Stat, _iconImage?: string) {
    super(name, `Increases one POKéMON's base ${getStatName(stat)} by 10%` , (_type, args) => new PokemonBaseStatModifier(this, args[0], this.stat));

    this.stat = stat;
  }
}

class AllPokemonFullHpRestoreModifierType extends ModifierType {
  constructor(name: string, description?: string, newModifierFunc?: Function, iconImage?: string) {
    super(name, description || `Restore 100% HP for all POKéMON`, newModifierFunc || ((_type, _args) => new PokemonHpRestoreModifier(this, -1, 100, false)), iconImage);
  }
}

class AllPokemonFullReviveModifierType extends AllPokemonFullHpRestoreModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, `Revives all fainted POKéMON, restoring 100% HP`, (_type, _args) => new PokemonHpRestoreModifier(this, -1, 100, true), iconImage);
  }
}

class ExpBoosterModifierType extends ModifierType {
  constructor(name: string, boostPercent: integer, iconImage?: string) {
    super(name, `Increases gain of EXP. Points by ${boostPercent}%`, () => new ExpBoosterModifier(this, boostPercent), iconImage);
  }
}

class WeightedModifierType {
  public modifierType: ModifierType;
  public weight: integer | Function;

  constructor(modifierType: ModifierType, weight: integer | Function) {
    this.modifierType = modifierType;
    this.weight = weight;
  }

  setTier(tier: ModifierTier) {
    this.modifierType.setTier(tier);
  }
}

const modifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(new AddPokeballModifierType(PokeballType.POKEBALL, 5, 'pb'), 2),
    new WeightedModifierType(new PokemonHpRestoreModifierType('POTION', 20), (party: Array<PlayerPokemon>) => {
      const thresholdPartyMemberCount = party.filter(p => p.getHpRatio() <= 0.9).length;
      console.log(thresholdPartyMemberCount, party.map(p => p.getHpRatio()));
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(new PokemonHpRestoreModifierType('SUPER POTION', 50), (party: Array<PlayerPokemon>) => {
      const thresholdPartyMemberCount = party.filter(p => p.getHpRatio() <= 0.75).length;
      return Math.ceil(thresholdPartyMemberCount / 3);
    }),
    new PokemonBaseStatBoosterModifierType('HP-UP', Stat.HP),
    new PokemonBaseStatBoosterModifierType('PROTEIN', Stat.ATK),
    new PokemonBaseStatBoosterModifierType('IRON', Stat.DEF),
    new PokemonBaseStatBoosterModifierType('CALCIUM', Stat.SPATK),
    new PokemonBaseStatBoosterModifierType('ZINC', Stat.SPDEF),
    new PokemonBaseStatBoosterModifierType('CARBOS', Stat.SPD)
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new AddPokeballModifierType(PokeballType.GREAT_BALL, 5, 'gb'),
    new WeightedModifierType(new PokemonReviveModifierType('REVIVE', 50), (party: Array<PlayerPokemon>) => {
      const faintedPartyMemberCount = party.filter(p => !p.hp).length;
      return faintedPartyMemberCount;
    }),
    new WeightedModifierType(new PokemonHpRestoreModifierType('HYPER POTION', 80), (party: Array<PlayerPokemon>) => {
      const thresholdPartyMemberCount = party.filter(p => p.getHpRatio() <= 0.6).length;
      return Math.ceil(thresholdPartyMemberCount / 3);
    })
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new AddPokeballModifierType(PokeballType.ULTRA_BALL, 5, 'ub'),
    new WeightedModifierType(new AllPokemonFullHpRestoreModifierType('MAX POTION'), (party: Array<PlayerPokemon>) => {
      const thresholdPartyMemberCount = party.filter(p => p.getHpRatio() <= 0.5).length;
      return Math.ceil(thresholdPartyMemberCount / 3);
    }),
    new ExpBoosterModifierType('LUCKY EGG', 25)
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.MASTER]: [
    new AddPokeballModifierType(PokeballType.MASTER_BALL, 1, 'mb'),
    new WeightedModifierType(new AllPokemonFullReviveModifierType('SACRED ASH'), (party: Array<PlayerPokemon>) => {
      return party.filter(p => !p.hp).length >= Math.ceil(party.length / 2) ? 1 : 0;
    }),
    new WeightedModifierType(new ModifierType('SHINY CHARM', 'Dramatically increases the chance of a wild POKéMON being shiny', (type, _args) => new ShinyRateBoosterModifier(type)), 2)
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; }),
  [ModifierTier.LUXURY]: [
    new ExpBoosterModifierType('GOLDEN EGG', 100),
    new ModifierType(`GOLDEN ${getPokeballName(PokeballType.POKEBALL)}`, 'Adds 1 extra ITEM option at the end of every battle', (type, _args) => new ExtraModifierModifier(type), 'pb_gold')
  ].map(m => { m.setTier(ModifierTier.LUXURY); return m; }),
};

let modifierPoolThresholds = {};
let ignoredPoolIndexes = {};

export function regenerateModifierPoolThresholds(party: Array<PlayerPokemon>) {
  ignoredPoolIndexes = {};
  modifierPoolThresholds = Object.fromEntries(new Map(Object.keys(modifierPool).map(t => {
    ignoredPoolIndexes[t] = [];
    const thresholds = new Map();
    let i = 0;
    modifierPool[t].reduce((total: integer, modifierType: ModifierType | WeightedModifierType) => {
      if (modifierType instanceof WeightedModifierType) {
        const weightedModifierType = modifierType as WeightedModifierType;
        const weight = weightedModifierType.weight instanceof Function
        ? (weightedModifierType.weight as Function)(party)
        : weightedModifierType.weight as integer;
        if (weight)
          total += weight;
        else {
          ignoredPoolIndexes[t].push(i++);
          return total;
        }
      } else
        total++;
      thresholds.set(total, i++);
      return total;
    }, 0);
    return [ t, Object.fromEntries(thresholds) ]
  })));
  console.log(modifierPoolThresholds)
}

export function getModifierTypesForWave(waveIndex: integer, count: integer): Array<ModifierType> {
  if (waveIndex % 10 === 0)
    return modifierPool[ModifierTier.LUXURY];
  const ret = [];
  for (let m = 0; m < count; m++)
    ret.push(getNewModifierType());
  return ret;
}

function getNewModifierType() {
  const tierValue = Utils.randInt(256);
  const tier = tierValue >= 52 ? ModifierTier.COMMON : tierValue >= 8 ? ModifierTier.GREAT : tierValue >= 1 ? ModifierTier.ULTRA : ModifierTier.MASTER;
  const thresholds = Object.keys(modifierPoolThresholds[tier]);
  const totalWeight = parseInt(thresholds[thresholds.length - 1]);
  const value = Utils.randInt(totalWeight);
  let index: integer;
  for (let t of thresholds) {
    let threshold = parseInt(t);
    if (value < threshold) {
      index = modifierPoolThresholds[tier][threshold];
      break;
    }
  }
  console.log(index, ignoredPoolIndexes[tier].filter(i => i <= index).length, ignoredPoolIndexes[tier])
  let modifierType: ModifierType | WeightedModifierType = modifierPool[tier][index];
  if (modifierType instanceof WeightedModifierType)
    return (modifierType as WeightedModifierType).modifierType;
  return modifierType;
}