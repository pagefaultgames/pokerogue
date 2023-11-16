import { CommonAnim, CommonBattleAnim } from "./battle-anims";
import { CommonAnimPhase, DamagePhase, MovePhase, ObtainStatusEffectPhase, PokemonHealPhase, ShowAbilityPhase } from "../battle-phases";
import { getPokemonMessage } from "../messages";
import Pokemon, { MoveResult } from "../pokemon";
import { Stat } from "./pokemon-stat";
import { StatusEffect } from "./status-effect";
import * as Utils from "../utils";
import { ChargeAttr, Moves, allMoves } from "./move";
import { Type } from "./type";
import { Abilities } from "./ability";

export enum BattlerTagType {
  NONE,
  RECHARGING,
  FLINCHED,
  CONFUSED,
  INFATUATED,
  SEEDED,
  NIGHTMARE,
  FRENZY,
  ENCORE,
  INGRAIN,
  AQUA_RING,
  DROWSY,
  TRAPPED,
  BIND,
  WRAP,
  FIRE_SPIN,
  WHIRLPOOL,
  CLAMP,
  SAND_TOMB,
  MAGMA_STORM,
  PROTECTED,
  TRUANT,
  FLYING,
  UNDERGROUND,
  HIDDEN,
  FIRE_BOOST,
  CRIT_BOOST,
  NO_CRIT,
  IGNORE_ACCURACY,
  BYPASS_SLEEP,
  IGNORE_FLYING
}

export enum BattlerTagLapseType {
  FAINT,
  MOVE,
  AFTER_MOVE,
  MOVE_EFFECT,
  TURN_END,
  CUSTOM
}

export class BattlerTag {
  public tagType: BattlerTagType;
  public lapseType: BattlerTagLapseType;
  public turnCount: integer;
  public sourceMove: Moves;
  public sourceId?: integer;

  constructor(tagType: BattlerTagType, lapseType: BattlerTagLapseType, turnCount: integer, sourceMove: Moves, sourceId?: integer) {
    this.tagType = tagType;
    this.lapseType = lapseType;
    this.turnCount = turnCount;
    this.sourceMove = sourceMove;
    this.sourceId = sourceId;
  }

  canAdd(pokemon: Pokemon): boolean {
    return true;
  }

  onAdd(pokemon: Pokemon): void { }

  onRemove(pokemon: Pokemon): void { }

  onOverlap(pokemon: Pokemon): void { }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    return --this.turnCount > 0;
  }

  getDescriptor(): string {
    return '';
  }

  isSourceLinked(): boolean {
    return false;
  }

  getMoveName(): string {
    return this.sourceMove
      ? allMoves[this.sourceMove].name
      : null;
  }
}

export class RechargingTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.RECHARGING, BattlerTagLapseType.MOVE, 1, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.getMoveQueue().push({ move: Moves.NONE, targets: [] })
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    super.lapse(pokemon, lapseType);

    (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' must\nrecharge!'));

    return true;
  }
}

export class TrappedTag extends BattlerTag {
  constructor(tagType: BattlerTagType, lapseType: BattlerTagLapseType, turnCount: integer, sourceMove: Moves, sourceId: integer) {
    super(tagType, lapseType, turnCount, sourceMove, sourceId);
  }
  
  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isOfType(Type.GHOST) && !pokemon.getTag(BattlerTagType.TRAPPED);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(this.getTrapMessage(pokemon));
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` was freed\nfrom ${this.getMoveName()}!`));
  }

  getDescriptor(): string {
    return 'trapping';
  }

  isSourceLinked(): boolean {
    return true;
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ' can no\nlonger escape!');
  }
}

export class FlinchedTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.FLINCHED, BattlerTagLapseType.MOVE, 0, sourceMove);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    super.lapse(pokemon, lapseType);

    (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' flinched!'));

    return true;
  }

  getDescriptor(): string {
    return 'flinching';
  }
}

export class ConfusedTag extends BattlerTag {
  constructor(turnCount: integer, sourceMove: Moves) {
    super(BattlerTagType.CONFUSED, BattlerTagLapseType.MOVE, turnCount, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), undefined, CommonAnim.CONFUSION));
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' became\nconfused!'));
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);
    
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' snapped\nout of confusion!'));
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is\nalready confused!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM && super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is\nconfused!'));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), undefined, CommonAnim.CONFUSION));

      if (Utils.randInt(2)) {
        const atk = pokemon.getBattleStat(Stat.ATK);
        const def = pokemon.getBattleStat(Stat.DEF);
        const damage = Math.ceil(((((2 * pokemon.level / 5 + 2) * 40 * atk / def) / 50) + 2) * (Utils.randInt(15, 85) / 100));
        pokemon.scene.queueMessage('It hurt itself in its\nconfusion!');
        pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.getBattlerIndex()));
        pokemon.damage(damage);
        (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
      }
    }
    
    return ret;
  }

  getDescriptor(): string {
    return 'confusion';
  }
}

export class InfatuatedTag extends BattlerTag {
  constructor(sourceMove: integer, sourceId: integer) {
    super(BattlerTagType.INFATUATED, BattlerTagLapseType.MOVE, 1, sourceMove, sourceId);
  }

  canAdd(pokemon: Pokemon): boolean {
    return pokemon.isOppositeGender(pokemon.scene.getPokemonById(this.sourceId));
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` fell in love\nwith ${pokemon.scene.getPokemonById(this.sourceId).name}!`));
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is\nalready in love!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` is in love\nwith ${pokemon.scene.getPokemonById(this.sourceId).name}!`));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), undefined, CommonAnim.ATTRACT));

      if (Utils.randInt(2)) {
        pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is\nimmobilized by love!'));
        (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
      }
    }
    
    return ret;
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' got over\nits infatuation.'));
  }

  getDescriptor(): string {
    return 'infatuation';
  }
}

export class SeedTag extends BattlerTag {
  constructor(sourceId: integer) {
    super(BattlerTagType.SEEDED, BattlerTagLapseType.AFTER_MOVE, 1, Moves.LEECH_SEED, sourceId);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' was seeded!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      const source = pokemon.scene.getPokemonById(this.sourceId);
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, source.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.LEECH_SEED));

      const damage = Math.max(Math.floor(pokemon.getMaxHp() / 8), 1);
      pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.getBattlerIndex()));
      pokemon.damage(damage);
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, source.getBattlerIndex(), damage, getPokemonMessage(pokemon, '\'s health is\nsapped by Leech Seed!'), false, true));
    }
    
    return ret;
  }

  getDescriptor(): string {
    return 'seeding';
  }
}

export class NightmareTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.NIGHTMARE, BattlerTagLapseType.AFTER_MOVE, 1, Moves.NIGHTMARE);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' began\nhaving a Nightmare!'));
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is\nalready locked in a Nightmare!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is locked\nin a Nightmare!'));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), undefined, CommonAnim.CURSE)); // TODO: Update animation type

      const damage = Math.ceil(pokemon.getMaxHp() / 4);
      pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.getBattlerIndex()));
      pokemon.damage(damage);
    }
    
    return ret;
  }

  getDescriptor(): string {
    return 'nightmares';
  }
}

export class FrenzyTag extends BattlerTag {
  constructor(sourceMove: Moves, sourceId: integer) {
    super(BattlerTagType.FRENZY, BattlerTagLapseType.CUSTOM, 1, sourceMove, sourceId);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.addTag(BattlerTagType.CONFUSED, Utils.randIntRange(1, 4) + 1);
  }
}

export class EncoreTag extends BattlerTag {
  public moveId: Moves;

  constructor(sourceMove: Moves, sourceId: integer) {
    super(BattlerTagType.ENCORE, BattlerTagLapseType.AFTER_MOVE, 3, sourceMove, sourceId);
  }

  canAdd(pokemon: Pokemon): boolean {
    const lastMoves = pokemon.getLastXMoves(1);
    if (!lastMoves.length)
      return false;
  
    const repeatableMove = lastMoves[0];

    if (!repeatableMove.move || repeatableMove.virtual)
      return false;

    switch (repeatableMove.move) {
      case Moves.MIMIC:
      case Moves.MIRROR_MOVE:
      case Moves.TRANSFORM:
      case Moves.STRUGGLE:
      case Moves.SKETCH:
      case Moves.SLEEP_TALK:
      case Moves.ENCORE:
        return false;
    }
  
    if (allMoves[repeatableMove.move].getAttrs(ChargeAttr).length && repeatableMove.result === MoveResult.OTHER)
      return false;

    this.moveId = repeatableMove.move;

    return true;
  }

  onAdd(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' got\nan Encore!'));

    const turnCommand =  pokemon.scene.currentBattle.turnCommands[pokemon.getFieldIndex()];
    if (turnCommand)
      turnCommand.move = { move: this.moveId, targets: pokemon.getLastXMoves(1)[0].targets };
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, '\'s Encore\nended!'));
  }
}

export class IngrainTag extends TrappedTag {
  constructor(sourceId: integer) {
    super(BattlerTagType.INGRAIN, BattlerTagLapseType.TURN_END, 1, Moves.INGRAIN, sourceId);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret)
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(), Math.floor(pokemon.getMaxHp() / 16),
        getPokemonMessage(pokemon, ` absorbed\nnutrients with its roots!`), true));
    
    return ret;
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ' planted its roots!');
  }

  getDescriptor(): string {
    return 'roots';
  }
}

export class AquaRingTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.AQUA_RING, BattlerTagLapseType.TURN_END, 1, Moves.AQUA_RING, undefined);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' surrounded\nitself with a veil of water!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret)
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(),
        Math.floor(pokemon.getMaxHp() / 16), `${this.getMoveName()} restored\n${pokemon.name}\'s HP!`, true));
    
    return ret;
  }
}

export class DrowsyTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.DROWSY, BattlerTagLapseType.TURN_END, 2, Moves.YAWN);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' grew drowsy!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (!super.lapse(pokemon, lapseType)) {
      pokemon.scene.unshiftPhase(new ObtainStatusEffectPhase(pokemon.scene, pokemon.getBattlerIndex(), StatusEffect.SLEEP));
      return false;
    }

    return true;
  }

  getDescriptor(): string {
    return 'drowsiness';
  }
}

export abstract class DamagingTrapTag extends TrappedTag {
  private commonAnim: CommonAnim;

  constructor(tagType: BattlerTagType, commonAnim: CommonAnim, turnCount: integer, sourceMove: Moves, sourceId: integer) {
    super(tagType, BattlerTagLapseType.TURN_END, turnCount, sourceMove, sourceId);

    this.commonAnim = commonAnim;
  }

  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isOfType(Type.GHOST) && !pokemon.findTag(t => t instanceof DamagingTrapTag);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` is hurt\nby ${this.getMoveName()}!`));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), undefined, this.commonAnim));

      const damage = Math.ceil(pokemon.getMaxHp() / 16);
      pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.getBattlerIndex()));
      pokemon.damage(damage);
    }

    return ret;
  }
}

export class BindTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.BIND, CommonAnim.BIND, turnCount, Moves.BIND, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ` was squeezed by\n${pokemon.scene.getPokemonById(this.sourceId).name}'s ${this.getMoveName()}!`);
  }
}

export class WrapTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.WRAP, CommonAnim.WRAP, turnCount, Moves.WRAP, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ` was Wrapped\nby ${pokemon.scene.getPokemonById(this.sourceId).name}!`);
  }
}

export abstract class VortexTrapTag extends DamagingTrapTag {
  constructor(tagType: BattlerTagType, commonAnim: CommonAnim, turnCount: integer, sourceMove: Moves, sourceId: integer) {
    super(tagType, commonAnim, turnCount, sourceMove, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ' was trapped\nin the vortex!');
  }
}

export class FireSpinTag extends VortexTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.FIRE_SPIN, CommonAnim.FIRE_SPIN, turnCount, Moves.FIRE_SPIN, sourceId);
  }
}

export class WhirlpoolTag extends VortexTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.WHIRLPOOL, CommonAnim.WHIRLPOOL, turnCount, Moves.WHIRLPOOL, sourceId);
  }
}

export class ClampTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.CLAMP, CommonAnim.CLAMP, turnCount, Moves.CLAMP, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon.scene.getPokemonById(this.sourceId), ` Clamped\n${pokemon.name}!`);
  }
}

export class SandTombTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.SAND_TOMB, CommonAnim.SAND_TOMB, turnCount, Moves.SAND_TOMB, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon.scene.getPokemonById(this.sourceId), ` became trapped\nby ${this.getMoveName()}!`);
  }
}

export class MagmaStormTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.MAGMA_STORM, CommonAnim.MAGMA_STORM, turnCount, Moves.MAGMA_STORM, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ` became trapped\nby swirling magma!`);
  }
}

export class ProtectedTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.PROTECTED, BattlerTagLapseType.CUSTOM, 0, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, '\nprotected itself!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.CUSTOM) {
      new CommonBattleAnim(CommonAnim.PROTECT, pokemon).play(pokemon.scene);
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, '\nprotected itself!'));
      return true;
    }

    return super.lapse(pokemon, lapseType);
  }
}

export class TruantTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.TRUANT, BattlerTagLapseType.MOVE, 1, undefined);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (pokemon.getAbility().id !== Abilities.TRUANT)
      return super.lapse(pokemon, lapseType);

    const lastMove = pokemon.getLastXMoves().find(() => true);

    if (lastMove && lastMove.move !== Moves.NONE) {
      (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
      pokemon.scene.unshiftPhase(new ShowAbilityPhase(pokemon.scene, pokemon.getBattlerIndex()));
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is\nloafing around!'));
    }

    return true;
  }
}

export class HideSpriteTag extends BattlerTag {
  constructor(tagType: BattlerTagType, turnCount: integer, sourceMove: Moves) {
    super(tagType, BattlerTagLapseType.MOVE_EFFECT, turnCount, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.setVisible(false);
  }

  onRemove(pokemon: Pokemon): void {
    // Wait 2 frames before setting visible for battle animations that don't immediately show the sprite invisible
    pokemon.scene.tweens.addCounter({
      duration: Utils.getFrameMs(2),
      onComplete: () => pokemon.setVisible(true)
    });
  }
}

export class TypeBoostTag extends BattlerTag {
  public boostedType: Type;

  constructor(tagType: BattlerTagType, sourceMove: Moves, boostedType: Type) {
    super(tagType, BattlerTagLapseType.TURN_END, 1, sourceMove);

    this.boostedType = boostedType;
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    return lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);
  }
}

export class CritBoostTag extends BattlerTag {
  constructor(tagType: BattlerTagType, sourceMove: Moves) {
    super(tagType, BattlerTagLapseType.TURN_END, 1, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is getting\npumped!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    return lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' relaxed.'));
  }
}

export class IgnoreAccuracyTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.IGNORE_ACCURACY, BattlerTagLapseType.TURN_END, 1, sourceMove);
  }
}

export function getBattlerTag(tagType: BattlerTagType, turnCount: integer, sourceMove: Moves, sourceId: integer): BattlerTag {
  switch (tagType) {
    case BattlerTagType.RECHARGING:
      return new RechargingTag(sourceMove);
    case BattlerTagType.FLINCHED:
      return new FlinchedTag(sourceMove);
    case BattlerTagType.CONFUSED:
      return new ConfusedTag(turnCount, sourceMove);
    case BattlerTagType.INFATUATED:
      return new InfatuatedTag(sourceMove, sourceId);
    case BattlerTagType.SEEDED:
      return new SeedTag(sourceId);
    case BattlerTagType.NIGHTMARE:
      return new NightmareTag();
    case BattlerTagType.FRENZY:
      return new FrenzyTag(sourceMove, sourceId);
    case BattlerTagType.ENCORE:
      return new EncoreTag(sourceMove, sourceId);
    case BattlerTagType.INGRAIN:
      return new IngrainTag(sourceId);
    case BattlerTagType.AQUA_RING:
      return new AquaRingTag();
    case BattlerTagType.DROWSY:
      return new DrowsyTag();
    case BattlerTagType.TRAPPED:
      return new TrappedTag(tagType, BattlerTagLapseType.CUSTOM, turnCount, sourceMove, sourceId);
    case BattlerTagType.BIND:
      return new BindTag(turnCount, sourceId);
    case BattlerTagType.WRAP:
      return new WrapTag(turnCount, sourceId);
    case BattlerTagType.FIRE_SPIN:
      return new FireSpinTag(turnCount, sourceId);
    case BattlerTagType.WHIRLPOOL:
      return new WhirlpoolTag(turnCount, sourceId);
    case BattlerTagType.CLAMP:
      return new ClampTag(turnCount, sourceId);
    case BattlerTagType.SAND_TOMB:
      return new SandTombTag(turnCount, sourceId);
    case BattlerTagType.MAGMA_STORM:
      return new MagmaStormTag(turnCount, sourceId);
    case BattlerTagType.PROTECTED:
      return new ProtectedTag(sourceMove);
    case BattlerTagType.TRUANT:
      return new TruantTag();
    case BattlerTagType.FLYING:
    case BattlerTagType.UNDERGROUND:
    case BattlerTagType.HIDDEN:
      return new HideSpriteTag(tagType, turnCount, sourceMove);
    case BattlerTagType.FIRE_BOOST:
      return new TypeBoostTag(tagType, sourceMove, Type.FIRE);
    case BattlerTagType.CRIT_BOOST:
      return new CritBoostTag(tagType, sourceMove);
    case BattlerTagType.NO_CRIT:
      return new BattlerTag(tagType, BattlerTagLapseType.AFTER_MOVE, turnCount, sourceMove);
    case BattlerTagType.IGNORE_ACCURACY:
      return new IgnoreAccuracyTag(sourceMove);
    case BattlerTagType.BYPASS_SLEEP:
      return new BattlerTag(BattlerTagType.BYPASS_SLEEP, BattlerTagLapseType.TURN_END, turnCount, sourceMove);
    case BattlerTagType.IGNORE_FLYING:
      return new BattlerTag(tagType, BattlerTagLapseType.TURN_END, turnCount, sourceMove);
    default:
        return new BattlerTag(tagType, BattlerTagLapseType.CUSTOM, turnCount, sourceMove, sourceId);
  }
}