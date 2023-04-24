import { CommonAnim, CommonBattleAnim } from "./battle-anims";
import { CommonAnimPhase, DamagePhase, MessagePhase, MovePhase, ObtainStatusEffectPhase, PokemonHealPhase } from "../battle-phases";
import { getPokemonMessage } from "../messages";
import Pokemon from "../pokemon";
import { Stat } from "./pokemon-stat";
import { StatusEffect } from "./status-effect";
import * as Utils from "../utils";
import { Moves, allMoves } from "./move";
import { Type } from "./type";

export enum BattlerTagType {
  NONE,
  RECHARGING,
  FLINCHED,
  CONFUSED,
  SEEDED,
  NIGHTMARE,
  FRENZY,
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
  FLYING,
  UNDERGROUND,
  NO_CRIT,
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
  public sourceId: integer;
  public sourceMove: Moves;

  constructor(tagType: BattlerTagType, lapseType: BattlerTagLapseType, turnCount: integer, sourceId?: integer, sourceMove?: Moves) {
    this.tagType = tagType;
    this.lapseType = lapseType;
    this.turnCount = turnCount;
    this.sourceId = sourceId;
    this.sourceMove = sourceMove;
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

  getMoveName(): string {
    return this.sourceMove
      ? allMoves[this.sourceMove].name
      : null;
  }
}

export class RechargingTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.RECHARGING, BattlerTagLapseType.MOVE, 1);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.getMoveQueue().push({ move: Moves.NONE })
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    super.lapse(pokemon, lapseType);

    (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' must\nrecharge!'));

    return true;
  }
}

export class TrappedTag extends BattlerTag {
  constructor(tagType: BattlerTagType, lapseType: BattlerTagLapseType, turnCount: integer, sourceId: integer, sourceMove: Moves) {
    super(tagType, lapseType, turnCount, sourceId, sourceMove);
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

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ' can no\nlonger escape!');
  }
}

export class FlinchedTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.FLINCHED, BattlerTagLapseType.MOVE, 0);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    super.lapse(pokemon, lapseType);

    (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' flinched!'));

    return true;
  }
}

export class ConfusedTag extends BattlerTag {
  constructor(turnCount: integer) {
    super(BattlerTagType.CONFUSED, BattlerTagLapseType.MOVE, turnCount);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.isPlayer(), CommonAnim.CONFUSION));
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
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.isPlayer(), CommonAnim.CONFUSION));

      if (Utils.randInt(2)) {
        const atk = pokemon.getBattleStat(Stat.ATK);
        const def = pokemon.getBattleStat(Stat.DEF);
        const damage = Math.ceil(((((2 * pokemon.level / 5 + 2) * 40 * atk / def) / 50) + 2) * ((Utils.randInt(15) + 85) / 100));
        pokemon.scene.queueMessage('It hurt itself in its\nconfusion!');
        pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.isPlayer()));
        pokemon.damage(damage);
        (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
      }
    }
    
    return ret;
  }
}

export class SeedTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.SEEDED, BattlerTagLapseType.AFTER_MOVE, 1);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' was seeded!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, !pokemon.isPlayer(), CommonAnim.LEECH_SEED));

      const damage = Math.max(Math.floor(pokemon.getMaxHp() / 8), 1);
      pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.isPlayer()));
      pokemon.damage(damage);
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, !pokemon.isPlayer(), damage, getPokemonMessage(pokemon, '\'s health is\nsapped by LEECH SEED!'), false, true));
    }
    
    return ret;
  }
}

export class NightmareTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.NIGHTMARE, BattlerTagLapseType.AFTER_MOVE, 1);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' began\nhaving a NIGHTMARE!'));
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is\nalready locked in a NIGHTMARE!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' is locked\nin a NIGHTMARE!'));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.isPlayer(), CommonAnim.CURSE)); // TODO: Update animation type

      const damage = Math.ceil(pokemon.getMaxHp() / 4);
      pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.isPlayer()));
      pokemon.damage(damage);
    }
    
    return ret;
  }
}

export class IngrainTag extends TrappedTag {
  constructor(sourceId: integer) {
    super(BattlerTagType.INGRAIN, BattlerTagLapseType.TURN_END, 1, sourceId, Moves.INGRAIN);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret)
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.isPlayer(), Math.floor(pokemon.getMaxHp() / 16),
        getPokemonMessage(pokemon, ` absorbed\nnutrients with its roots!`), true));
    
    return ret;
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ' planted its roots!');
  }
}

export class AquaRingTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.AQUA_RING, BattlerTagLapseType.TURN_END, 1, undefined, Moves.AQUA_RING);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' surrounded\nitself with a veil of water!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret)
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.isPlayer(), Math.floor(pokemon.getMaxHp() / 16), `${this.getMoveName()} restored\n${pokemon.name}\'s HP!`, true));
    
    return ret;
  }
}

export class DrowsyTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.DROWSY, BattlerTagLapseType.TURN_END, 2);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' grew drowsy!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (!super.lapse(pokemon, lapseType)) {
      pokemon.scene.unshiftPhase(new ObtainStatusEffectPhase(pokemon.scene, pokemon.isPlayer(), StatusEffect.SLEEP));
      return false;
    }

    return true;
  }
}

export abstract class DamagingTrapTag extends TrappedTag {
  private commonAnim: CommonAnim;

  constructor(tagType: BattlerTagType, commonAnim: CommonAnim, turnCount: integer, sourceId: integer, sourceMove: Moves) {
    super(tagType, BattlerTagLapseType.TURN_END, turnCount, sourceId, sourceMove);

    this.commonAnim = commonAnim;
  }

  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isOfType(Type.GHOST) && !pokemon.findTag(t => t instanceof DamagingTrapTag);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` is hurt\nby ${this.getMoveName()}!`));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.isPlayer(), this.commonAnim));

      const damage = Math.ceil(pokemon.getMaxHp() / 16);
      pokemon.damage(damage);
      pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.isPlayer()));
    }

    return ret;
  }
}

export class BindTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.BIND, CommonAnim.BIND, turnCount, sourceId, Moves.BIND);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ` was squeezed by\n${pokemon.scene.getPokemonById(this.sourceId)}'s ${this.getMoveName()}!`);
  }
}

export class WrapTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.WRAP, CommonAnim.WRAP, turnCount, sourceId, Moves.WRAP);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ` was WRAPPED\nby ${pokemon.scene.getPokemonById(this.sourceId)}!`);
  }
}

export abstract class VortexTrapTag extends DamagingTrapTag {
  constructor(tagType: BattlerTagType, commonAnim: CommonAnim, turnCount: integer, sourceId: integer, sourceMove: Moves) {
    super(tagType, commonAnim, turnCount, sourceId, sourceMove);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ' was trapped\nin the vortex!');
  }
}

export class FireSpinTag extends VortexTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.FIRE_SPIN, CommonAnim.FIRE_SPIN, turnCount, sourceId, Moves.FIRE_SPIN);
  }
}

export class WhirlpoolTag extends VortexTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.WHIRLPOOL, CommonAnim.WHIRLPOOL, turnCount, sourceId, Moves.WHIRLPOOL);
  }
}

export class ClampTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.CLAMP, CommonAnim.CLAMP, turnCount, sourceId, Moves.CLAMP);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon.scene.getPokemonById(this.sourceId), ` CLAMPED\n${pokemon.name}!`);
  }
}

export class SandTombTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.SAND_TOMB, CommonAnim.SAND_TOMB, turnCount, sourceId, Moves.SAND_TOMB);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon.scene.getPokemonById(this.sourceId), ` became trapped\nby ${this.getMoveName()}!`);
  }
}

export class MagmaStormTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.MAGMA_STORM, CommonAnim.MAGMA_STORM, turnCount, sourceId, Moves.MAGMA_STORM);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ` became trapped\nby swirling magma!`);
  }
}

export class ProtectedTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.PROTECTED, BattlerTagLapseType.CUSTOM, 0);
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

export class HideSpriteTag extends BattlerTag {
  constructor(tagType: BattlerTagType, turnCount: integer) {
    super(tagType, BattlerTagLapseType.MOVE_EFFECT, turnCount);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.setVisible(false);
  }

  onRemove(pokemon: Pokemon): void {
    // Wait 2 frames before setting visible for battle animations that don't immediately show the sprite invisible
    pokemon.scene.tweens.addCounter({
      duration: 2,
      useFrames: true,
      onComplete: () => pokemon.setVisible(true)
    });
  }
}

export function getBattlerTag(tagType: BattlerTagType, turnCount: integer, sourceId: integer, sourceMove: Moves): BattlerTag {
  switch (tagType) {
    case BattlerTagType.RECHARGING:
      return new RechargingTag();
    case BattlerTagType.FLINCHED:
      return new FlinchedTag();
    case BattlerTagType.CONFUSED:
      return new ConfusedTag(turnCount);
    case BattlerTagType.SEEDED:
      return new SeedTag();
    case BattlerTagType.NIGHTMARE:
      return new NightmareTag();
    case BattlerTagType.INGRAIN:
      return new IngrainTag(sourceId);
    case BattlerTagType.AQUA_RING:
      return new AquaRingTag();
    case BattlerTagType.DROWSY:
      return new DrowsyTag();
    case BattlerTagType.TRAPPED:
      return new TrappedTag(tagType, BattlerTagLapseType.CUSTOM, turnCount, sourceId, sourceMove);
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
      return new ProtectedTag();
    case BattlerTagType.FLYING:
    case BattlerTagType.UNDERGROUND:
      return new HideSpriteTag(tagType, turnCount);
    case BattlerTagType.NO_CRIT:
      return new BattlerTag(tagType, BattlerTagLapseType.AFTER_MOVE, turnCount);
    case BattlerTagType.BYPASS_SLEEP:
      return new BattlerTag(BattlerTagType.BYPASS_SLEEP, BattlerTagLapseType.TURN_END, turnCount);
    case BattlerTagType.IGNORE_FLYING:
      return new BattlerTag(tagType, BattlerTagLapseType.TURN_END, turnCount);
    default:
        return new BattlerTag(tagType, BattlerTagLapseType.CUSTOM, turnCount);
  }
}