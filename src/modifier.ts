import * as ModifierTypes from './modifier-type';
import { LearnMovePhase, LevelUpPhase } from "./battle-phases";
import BattleScene from "./battle-scene";
import { getLevelTotalExp } from "./exp";
import { PokeballType } from "./pokeball";
import Pokemon, { PlayerPokemon } from "./pokemon";
import { Stat } from "./pokemon-stat";
import { addTextObject, TextStyle } from "./text";
import * as Utils from "./utils";

type ModifierType = ModifierTypes.ModifierType;

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

  constructor(type: ModifierTypes.PokemonBaseStatBoosterModifierType, pokemonId: integer, stat: Stat) {
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
    return new PokemonBaseStatModifier(this.type as ModifierTypes.PokemonBaseStatBoosterModifierType, this.pokemonId, this.stat);
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
    const move = pokemon.moveset[this.moveIndex];
    console.log(move.ppUsed, this.restorePoints, this.restorePoints >= -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0);
    move.ppUsed = this.restorePoints >= -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;

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
    for (let move of pokemon.moveset)
      move.ppUsed = this.restorePoints >= -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;

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
  constructor(type: ModifierTypes.TmModifierType, pokemonId: integer) {
    super(type, pokemonId);
  }

  apply(args: any[]): boolean {
    const pokemon = args[0] as PlayerPokemon;

    const scene = pokemon.scene as BattleScene;
    scene.unshiftPhase(new LearnMovePhase(scene, scene.getParty().indexOf(pokemon), (this.type as ModifierTypes.TmModifierType).moveId));

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