import { LearnMovePhase, LevelUpPhase } from "./battle-phases";
import BattleScene from "./battle-scene";
import { getLevelTotalExp } from "./exp";
import { allMoves, Moves } from "./move";
import { getPokeballName, PokeballType } from "./pokeball";
import Pokemon, { PlayerPokemon } from "./pokemon";
import { Stat, getStatName } from "./pokemon-stat";
import { addTextObject, TextStyle } from "./text";
import { tmSpecies } from "./tms";
import { Type } from "./type";
import PartyUiHandler from "./ui/party-ui-handler";
import * as Utils from "./utils";

export class ModifierBar extends Phaser.GameObjects.Container {
  constructor(scene: BattleScene) {
    super(scene, 1, 2);

    this.setScale(0.5);
  }

  updateModifiers(modifiers: PersistentModifier[]) {
    this.removeAll(true);

    for (let modifier of modifiers) {
      const icon = modifier.getIcon(this.scene as BattleScene);
      this.add(icon);
      this.setModifierIconPosition(icon);
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

  constructor(type: ModifierType) {
    this.type = type;
  }

  match(_modifier: Modifier): boolean {
    return false;
  }

  shouldApply(_args: any[]): boolean {
    return true;
  }

  abstract apply(args: any[]): boolean;
}

export abstract class PersistentModifier extends Modifier {
  public stackCount: integer;
  public virtualStackCount: integer;

  constructor(type: ModifierType) {
    super(type);
    this.stackCount = 1;
    this.virtualStackCount = 0;
  }

  add(modifiers: PersistentModifier[], virtual: boolean): boolean {
    for (let modifier of modifiers) {
      if (this.match(modifier)) {
        modifier.incrementStack(virtual);
        return true;
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

  incrementStack(virtual: boolean): void {
    if (this.getStackCount() < this.getMaxStackCount()) {
      if (!virtual)
        this.stackCount++;
      else
        this.virtualStackCount++;
    }
  }

  getStackCount(): integer {
    return this.stackCount + this.virtualStackCount;
  }

  getMaxStackCount(): integer {
    return 99;
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

    const virtualStackText = this.getIconStackText(scene, true);
    if (virtualStackText)
      container.add(virtualStackText);

    return container;
  }

  getIconStackText(scene: BattleScene, virtual?: boolean): Phaser.GameObjects.Text {
    if (this.getMaxStackCount() === 1 || (virtual && !this.virtualStackCount))
      return null;

    const isStackMax = this.getStackCount() >= this.getMaxStackCount();
    const maxColor = '#f89890';
    const maxStrokeColor = '#984038';

    if (virtual) {
      const virtualText = addTextObject(scene, 1 * 11 + 16, 12, `+${this.virtualStackCount.toString()}`, TextStyle.PARTY, { fontSize: '66px', color: !isStackMax ? '#40c8f8' : maxColor });
      virtualText.setShadow(0, 0, null);
      virtualText.setStroke(!isStackMax ? '#006090' : maxStrokeColor, 16)
      virtualText.setOrigin(1, 0);

      return virtualText;
    }

    const text = addTextObject(scene, 8, 12, this.stackCount.toString(), TextStyle.PARTY, { fontSize: '66px', color: !isStackMax ? '#f8f8f8' : maxColor });
    text.setShadow(0, 0, null);
    text.setStroke('#424242', 16)
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

class AddPokeballModifier extends ConsumableModifier {
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

export abstract class PokemonHeldItemModifier extends PersistentModifier {
  public pokemonId: integer;

  constructor(type: ModifierType, pokemonId: integer) {
    super(type);

    this.pokemonId = pokemonId;
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length && args[0] instanceof Pokemon && (this.pokemonId === -1 || (args[0] as Pokemon).id === this.pokemonId);
  }

  getIcon(scene: BattleScene): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    const pokemon = this.getPokemon(scene);
    const pokemonIcon = scene.add.sprite(0, 8, pokemon.species.getIconAtlasKey());
    pokemonIcon.play(pokemon.species.getIconKey()).stop();
    pokemonIcon.setOrigin(0, 0.5);

    container.add(pokemonIcon);

    return container;
  }

  getPokemon(scene: BattleScene) {
    return scene.getParty().find(p => p.id === this.pokemonId);
  }
}

export class PokemonBaseStatModifier extends PokemonHeldItemModifier {
  protected stat: Stat;

  constructor(type: PokemonBaseStatBoosterModifierType, pokemonId: integer, stat: Stat) {
    super(type, pokemonId);
    this.stat = stat;
  }

  match(modifier: Modifier): boolean {
    if (modifier instanceof PokemonBaseStatModifier) {
      const pokemonStatModifier = modifier as PokemonBaseStatModifier;
      return pokemonStatModifier.pokemonId === this.pokemonId && pokemonStatModifier.stat === this.stat;
    }
    return false;
  }

  clone(): PersistentModifier {
    return new PokemonBaseStatModifier(this.type as PokemonBaseStatBoosterModifierType, this.pokemonId, this.stat);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 2 && args[1] instanceof Array<integer>;
  }

  apply(args: any[]): boolean {
    args[1][this.stat] = Math.min(Math.floor(args[1][this.stat] * (1 + this.getStackCount() * 0.2)), 999999);

    return true;
  }

  getIcon(scene: BattleScene): Phaser.GameObjects.Container {
    const container = super.getIcon(scene);

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

    return container;
  }
}

export abstract class ConsumablePokemonModifier extends ConsumableModifier {
  public pokemonId: integer;

  constructor(type: ModifierType, pokemonId: integer) {
    super(type);

    this.pokemonId = pokemonId;
  }

  shouldApply(args: any[]): boolean {
    return args.length && args[0] instanceof Pokemon && (this.pokemonId === -1 || (args[0] as Pokemon).id === this.pokemonId);
  }

  getPokemon(scene: BattleScene) {
    return scene.getParty().find(p => p.id === this.pokemonId);
  }
}

export class PokemonHpRestoreModifier extends ConsumablePokemonModifier {
  private restorePoints: integer;
  private percent: boolean;
  private fainted: boolean;

  constructor(type: ModifierType, pokemonId: integer, restorePoints: integer, percent: boolean, fainted?: boolean) {
    super(type, pokemonId);

    this.restorePoints = restorePoints;
    this.percent = percent;
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
      pokemon.hp = Math.min(pokemon.hp + (this.percent ? (restorePoints * 0.01) * pokemon.getMaxHp() : restorePoints), pokemon.getMaxHp());
    }

    return true;
  }
}

export class PokemonPpRestoreModifier extends ConsumablePokemonModifier {
  private restorePoints: integer;

  constructor(type: ModifierType, pokemonId: integer, restorePoints: integer) {
    super(type, pokemonId);

    this.restorePoints = restorePoints;
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length > 1 && typeof(args[1]) === 'number';
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as Pokemon;
    const moveIndex = args[1] as integer;
    const move = pokemon.moveset[moveIndex];
    move.ppUsed = this.restorePoints >= 0 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;

    return true;
  }
}

export class PokemonLevelIncrementModifier extends ConsumablePokemonModifier {
  constructor(type: ModifierType, pokemonId: integer) {
    super(type, pokemonId);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as PlayerPokemon;
    pokemon.level++;
    pokemon.exp = getLevelTotalExp(pokemon.level, pokemon.species.growthRate);
    pokemon.levelExp = 0;

    const scene = pokemon.scene as BattleScene;
    scene.unshiftPhase(new LevelUpPhase(scene, scene.getParty().indexOf(pokemon), pokemon.level - 1, pokemon.level));

    return true;
  }
}

export class TmModifier extends ConsumablePokemonModifier {
  constructor(type: TmModifierType, pokemonId: integer) {
    super(type, pokemonId);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as PlayerPokemon;

    const scene = pokemon.scene as BattleScene;
    scene.unshiftPhase(new LearnMovePhase(scene, scene.getParty().indexOf(pokemon), (this.type as TmModifierType).moveId));

    return true;
  }
}

export class PartyShareModifier extends PersistentModifier {
  constructor(type: ModifierType) {
    super(type);
  }

  match(modifier: Modifier) {
    return modifier instanceof PartyShareModifier;
  }

  clone(): PartyShareModifier {
    return new PartyShareModifier(this.type);
  }

  shouldApply(args: any[]): boolean {
    return super.shouldApply(args) && args.length === 2 && args[0] instanceof BattleScene && args[1] instanceof Array<Modifier>;
  }

  apply(args: any[]): boolean {
    const scene = args[0] as BattleScene;
    const modifiers = args[1] as Modifier[];
    const party = scene.getParty();
    for (let modifier of modifiers) {
      if (modifier instanceof PokemonHeldItemModifier) {
        const heldItemModifier = modifier as PokemonHeldItemModifier;
        const extraStacks = Math.floor(modifier.stackCount / Math.max(party.length - (this.getStackCount() - 1), 1));
        for (let s = 0; s < extraStacks; s++) {
          for (let p of party) {
            if (p.id === heldItemModifier.pokemonId)
              continue;
            const newHeldItemModifier = heldItemModifier.clone() as PokemonHeldItemModifier;
            newHeldItemModifier.pokemonId = p.id;
            scene.addModifier(newHeldItemModifier, true);
          }
        }
      }
    }

    return true;
  }

  getMaxStackCount(): number {
    return 6;
  }
}

export class HealingBoosterModifier extends PersistentModifier {
  private multiplier: number;

  constructor(type: ModifierType, multiplier: number) {
    super(type);

    this.multiplier = multiplier;
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof HealingBoosterModifier;
  }

  clone(): HealingBoosterModifier {
    return new HealingBoosterModifier(this.type, this.multiplier);
  }

  apply(args: any[]): boolean {
    const healingMultiplier = args[0] as Utils.IntegerHolder;
    for (let s = 0; s < this.getStackCount(); s++)
      healingMultiplier.value *= this.multiplier;
    healingMultiplier.value = Math.floor(healingMultiplier.value);

    return true;
  }
}

export class ExpBoosterModifier extends PersistentModifier {
  private boostMultiplier: integer;

  constructor(type: ModifierType, boostPercent: integer) {
    super(type);

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
    return new ExpBoosterModifier(this.type, this.boostMultiplier * 100);
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.NumberHolder).value = Math.floor((args[0] as Utils.NumberHolder).value * (1 + (this.getStackCount() * this.boostMultiplier)));

    return true;
  }
}

export class ExpShareModifier extends PersistentModifier {
  constructor(type: ModifierType) {
    super(type);
  }

  apply(_args: any[]): boolean {
    return true;
  }

  clone(): ExpShareModifier {
    return new ExpShareModifier(this.type);
  }

  getMaxStackCount(): integer {
    return 5;
  }
}

export class ShinyRateBoosterModifier extends PersistentModifier {
  constructor(type: ModifierType) {
    super(type);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof ShinyRateBoosterModifier;
  }

  clone(): ShinyRateBoosterModifier {
    return new ShinyRateBoosterModifier(this.type);
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value = Math.pow((args[0] as Utils.IntegerHolder).value * 0.5, this.getStackCount() + 1);

    return true;
  }

  getMaxStackCount(): integer {
    return 5;
  }
}

export class ExtraModifierModifier extends PersistentModifier {
  constructor(type: ModifierType) {
    super(type);
  }

  clone(): ExtraModifierModifier {
    return new ExtraModifierModifier(this.type);
  }

  apply(args: any[]): boolean {
    (args[0] as Utils.IntegerHolder).value += this.getStackCount();

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
    this.iconImage = iconImage || name?.replace(/[ \-]/g, '_')?.toLowerCase();
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
  protected restorePoints: integer;
  protected percent: boolean;

  constructor(name: string, restorePoints: integer, percent?: boolean, newModifierFunc?: Function, selectFilter?: Function, iconImage?: string) {
    super(name, `Restore ${restorePoints}${percent ? '%' : ''} HP for one POKéMON`,
      newModifierFunc || ((_type, args) => new PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints, this.percent, false)),
    selectFilter || ((pokemon: PlayerPokemon) => {
      if (!pokemon.hp || pokemon.hp >= pokemon.getMaxHp())
        return PartyUiHandler.NoEffectMessage;
      return null;
    }), iconImage);

    this.restorePoints = restorePoints;
    this.percent = !!percent;
  }
}

export class PokemonReviveModifierType extends PokemonHpRestoreModifierType {
  constructor(name: string, restorePercent: integer, iconImage?: string) {
    super(name, restorePercent, true, (_type, args) => new PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints, true, true),
      ((pokemon: PlayerPokemon) => {
        if (pokemon.hp)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }), iconImage);

    this.description = `Revive one POKéMON and restore ${restorePercent}% HP`;
    this.selectFilter = (pokemon: PlayerPokemon) => {
      if (pokemon.hp)
        return PartyUiHandler.NoEffectMessage;
      return null;
    };
  }
}

export class PokemonLevelIncrementModifierType extends PokemonModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, `Increase a POKéMON\'s level by 1`, (_type, args) => new PokemonLevelIncrementModifier(this, (args[0] as PlayerPokemon).id),
      (_pokemon: PlayerPokemon) => null, iconImage);
  }
}

export class PokemonPpRestoreModifierType extends PokemonModifierType {
  protected restorePoints: integer;

  constructor(name: string, restorePoints: integer, iconImage?: string) {
    super(name, `Restore ${restorePoints} PP for one POKéMON's move`, (_type, args) => new PokemonPpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints),
      (pokemon: PlayerPokemon) => {
      return null;
    }, iconImage);

    this.restorePoints = this.restorePoints;
  }
}

export class PokemonBaseStatBoosterModifierType extends PokemonModifierType {
  private stat: Stat;

  constructor(name: string, stat: Stat, _iconImage?: string) {
    super(name, `Increases one POKéMON's base ${getStatName(stat)} by 20%` , (_type, args) => new PokemonBaseStatModifier(this, (args[0] as PlayerPokemon).id, this.stat));

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

export class ExpBoosterModifierType extends ModifierType {
  constructor(name: string, boostPercent: integer, iconImage?: string) {
    super(name, `Increases gain of EXP. Points by ${boostPercent}%`, () => new ExpBoosterModifier(this, boostPercent), iconImage);
  }
}

export class TmModifierType extends PokemonModifierType {
  public moveId: Moves;

  constructor(moveId: Moves) {
    super(`TM${Utils.padInt(Object.keys(tmSpecies).indexOf(moveId.toString()) + 1, 3)} - ${allMoves[moveId - 1].name}`, `Teach ${allMoves[moveId - 1].name} to a POKéMON`, (_type, args) => new TmModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemon.compatibleTms.indexOf(moveId) === -1 || pokemon.moveset.filter(m => m?.moveId === moveId).length)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }, `tm_${Type[allMoves[moveId - 1].type].toLowerCase()}`);

    this.moveId = moveId;
  }
}

class ModifierTypeGenerator extends ModifierType {
  private genTypeFunc: Function;

  constructor(genTypeFunc: Function) {
    super(null, null, null, null);
    this.genTypeFunc = genTypeFunc;
  }

  generateType(party: PlayerPokemon[]) {
    const ret = this.genTypeFunc(party);
    ret.setTier(this.tier);
    return ret;
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
    new WeightedModifierType(new PokemonHpRestoreModifierType('POTION', 20), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getHpRatio() <= 0.9).length;
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(new PokemonHpRestoreModifierType('SUPER POTION', 50), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getHpRatio() <= 0.75).length;
      return Math.ceil(thresholdPartyMemberCount / 3);
    })
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(new AddPokeballModifierType(PokeballType.GREAT_BALL, 5, 'gb'), 3),
    new WeightedModifierType(new PokemonReviveModifierType('REVIVE', 50), (party: PlayerPokemon[]) => {
      const faintedPartyMemberCount = party.filter(p => !p.hp).length;
      return faintedPartyMemberCount * 3;
    }),
    new WeightedModifierType(new PokemonReviveModifierType('MAX REVIVE', 100), (party: PlayerPokemon[]) => {
      const faintedPartyMemberCount = party.filter(p => !p.hp).length;
      return faintedPartyMemberCount;
    }),
    new WeightedModifierType(new PokemonHpRestoreModifierType('HYPER POTION', 200), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getHpRatio() <= 0.6).length;
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(new ModifierTypeGenerator((party: PlayerPokemon[]) => {
      const partyMemberCompatibleTms = party.map(p => p.compatibleTms);
      const uniqueCompatibleTms = partyMemberCompatibleTms.flat().filter((tm, i, array) => array.indexOf(tm) === i);
      const randTmIndex = Utils.randInt(uniqueCompatibleTms.length);
      return new TmModifierType(uniqueCompatibleTms[randTmIndex]);
    }), 2),
    new PokemonLevelIncrementModifierType('RARE CANDY'),
    new PokemonBaseStatBoosterModifierType('HP-UP', Stat.HP),
    new PokemonBaseStatBoosterModifierType('PROTEIN', Stat.ATK),
    new PokemonBaseStatBoosterModifierType('IRON', Stat.DEF),
    new PokemonBaseStatBoosterModifierType('CALCIUM', Stat.SPATK),
    new PokemonBaseStatBoosterModifierType('ZINC', Stat.SPDEF),
    new PokemonBaseStatBoosterModifierType('CARBOS', Stat.SPD)
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new AddPokeballModifierType(PokeballType.ULTRA_BALL, 5, 'ub'),
    new WeightedModifierType(new AllPokemonFullHpRestoreModifierType('MAX POTION'), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getHpRatio() <= 0.5).length;
      return Math.ceil(thresholdPartyMemberCount / 3);
    }),
    new WeightedModifierType(new AllPokemonFullReviveModifierType('SACRED ASH'), (party: PlayerPokemon[]) => {
      return party.filter(p => !p.hp).length >= Math.ceil(party.length / 2) ? 1 : 0;
    }),
    new ModifierType('OVAL CHARM', 'For every X (no. of party members) items in a POKéMON\'s held item stack, give one to each other party member',
      (type, _args) => new PartyShareModifier(type), 'oval_charm'),
    new ModifierType('HEALING CHARM', 'Doubles the effectiveness of HP restoring items (excludes revives)', (type, _args) => new HealingBoosterModifier(type, 2), 'healing_charm'),
    new ExpBoosterModifierType('LUCKY EGG', 25),
    new ModifierType('EXP. SHARE', 'All POKéMON in your party gain an additional 10% of a battle\'s EXP. Points', (type, _args) => new ExpShareModifier(type), 'exp_share')
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.MASTER]: [
    new AddPokeballModifierType(PokeballType.MASTER_BALL, 1, 'mb'),
    new WeightedModifierType(new ModifierType('SHINY CHARM', 'Dramatically increases the chance of a wild POKéMON being shiny', (type, _args) => new ShinyRateBoosterModifier(type)), 2)
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; }),
  [ModifierTier.LUXURY]: [
    new ExpBoosterModifierType('GOLDEN EGG', 100),
    new ModifierType(`GOLDEN ${getPokeballName(PokeballType.POKEBALL)}`, 'Adds 1 extra ITEM option at the end of every battle', (type, _args) => new ExtraModifierModifier(type), 'pb_gold')
  ].map(m => { m.setTier(ModifierTier.LUXURY); return m; }),
};

let modifierPoolThresholds = {};
let ignoredPoolIndexes = {};

export function regenerateModifierPoolThresholds(party: PlayerPokemon[]) {
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

export function getModifierTypesForWave(waveIndex: integer, count: integer, party: PlayerPokemon[]): Array<ModifierType> {
  if (waveIndex % 10 === 0)
    return modifierPool[ModifierTier.LUXURY];
  const ret = [];
  for (let m = 0; m < count; m++)
    ret.push(getNewModifierType(party));
  return ret;
}

function getNewModifierType(party: PlayerPokemon[]) {
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
    modifierType = (modifierType as WeightedModifierType).modifierType;
  if (modifierType instanceof ModifierTypeGenerator)
    modifierType = (modifierType as ModifierTypeGenerator).generateType(party);
  return modifierType;
}