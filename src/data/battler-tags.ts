import { CommonAnim, CommonBattleAnim } from "./battle-anims";
import { CommonAnimPhase, MoveEffectPhase, MovePhase, PokemonHealPhase, ShowAbilityPhase, StatChangePhase } from "../phases";
import { getPokemonMessage, getPokemonNameWithAffix } from "../messages";
import Pokemon, { MoveResult, HitResult } from "../field/pokemon";
import { Stat, getStatName } from "./pokemon-stat";
import { StatusEffect } from "./status-effect";
import * as Utils from "../utils";
import { ChargeAttr, MoveFlags, allMoves } from "./move";
import { Type } from "./type";
import { BlockNonDirectDamageAbAttr, FlinchEffectAbAttr, ReverseDrainAbAttr, applyAbAttrs } from "./ability";
import { TerrainType } from "./terrain";
import { WeatherType } from "./weather";
import { BattleStat } from "./battle-stat";
import { allAbilities } from "./ability";
import { SpeciesFormChangeManualTrigger } from "./pokemon-forms";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";

export enum BattlerTagLapseType {
  FAINT,
  MOVE,
  PRE_MOVE,
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
    return "";
  }

  isSourceLinked(): boolean {
    return false;
  }

  getMoveName(): string {
    return this.sourceMove
      ? allMoves[this.sourceMove].name
      : null;
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * This is meant to be inherited from by any battler tag with custom attributes
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    this.turnCount = source.turnCount;
    this.sourceMove = source.sourceMove;
    this.sourceId = source.sourceId;
  }
}

export interface WeatherBattlerTag {
  weatherTypes: WeatherType[];
}

export interface TerrainBattlerTag {
  terrainTypes: TerrainType[];
}

export class RechargingTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.RECHARGING, BattlerTagLapseType.PRE_MOVE, 1, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.getMoveQueue().push({ move: Moves.NONE, targets: [] });
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    super.lapse(pokemon, lapseType);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " must\nrecharge!"));
    (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
    pokemon.getMoveQueue().shift();

    return true;
  }
}

export class TrappedTag extends BattlerTag {
  constructor(tagType: BattlerTagType, lapseType: BattlerTagLapseType, turnCount: integer, sourceMove: Moves, sourceId: integer) {
    super(tagType, lapseType, turnCount, sourceMove, sourceId);
  }

  canAdd(pokemon: Pokemon): boolean {
    const isGhost = pokemon.isOfType(Type.GHOST);
    const isTrapped = pokemon.getTag(BattlerTagType.TRAPPED);

    return !isTrapped && !isGhost;
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
    return "trapping";
  }

  isSourceLinked(): boolean {
    return true;
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, " can no\nlonger escape!");
  }
}

export class FlinchedTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.FLINCHED, BattlerTagLapseType.PRE_MOVE, 0, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    applyAbAttrs(FlinchEffectAbAttr, pokemon, null);
  }

  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isMax();
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    super.lapse(pokemon, lapseType);

    (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " flinched!"));

    return true;
  }

  getDescriptor(): string {
    return "flinching";
  }
}

export class InterruptedTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.INTERRUPTED, BattlerTagLapseType.PRE_MOVE, 0, sourceMove);
  }

  canAdd(pokemon: Pokemon): boolean {
    return !!pokemon.getTag(BattlerTagType.FLYING);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.getMoveQueue().shift();
    pokemon.pushMoveHistory({move: Moves.NONE, result: MoveResult.OTHER});
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    super.lapse(pokemon, lapseType);
    (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
    return true;
  }
}

/**
 * BattlerTag that represents the {@link https://bulbapedia.bulbagarden.net/wiki/Confusion_(status_condition)}
 */
export class ConfusedTag extends BattlerTag {
  constructor(turnCount: integer, sourceMove: Moves) {
    super(BattlerTagType.CONFUSED, BattlerTagLapseType.MOVE, turnCount, sourceMove);
  }

  canAdd(pokemon: Pokemon): boolean {
    return pokemon.scene.arena.terrain?.terrainType !== TerrainType.MISTY || !pokemon.isGrounded();
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), undefined, CommonAnim.CONFUSION));
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " became\nconfused!"));
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " snapped\nout of confusion!"));
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is\nalready confused!"));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM && super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is\nconfused!"));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), undefined, CommonAnim.CONFUSION));

      // 1/3 chance of hitting self with a 40 base power move
      if (pokemon.randSeedInt(3) === 0) {
        const atk = pokemon.getBattleStat(Stat.ATK);
        const def = pokemon.getBattleStat(Stat.DEF);
        const damage = Math.ceil(((((2 * pokemon.level / 5 + 2) * 40 * atk / def) / 50) + 2) * (pokemon.randSeedInt(15, 85) / 100));
        pokemon.scene.queueMessage("It hurt itself in its\nconfusion!");
        pokemon.damageAndUpdate(damage);
        pokemon.battleData.hitCount++;
        (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
      }
    }

    return ret;
  }

  getDescriptor(): string {
    return "confusion";
  }
}

/**
 * Tag applied to the {@linkcode Move.DESTINY_BOND} user.
 * @extends BattlerTag
 * @see {@linkcode apply}
 */
export class DestinyBondTag extends BattlerTag {
  constructor(sourceMove: Moves, sourceId: integer) {
    super(BattlerTagType.DESTINY_BOND, BattlerTagLapseType.PRE_MOVE, 1, sourceMove, sourceId);
  }

  /**
   * Lapses either before the user's move and does nothing
   * or after receiving fatal damage. When the damage is fatal,
   * the attacking Pokemon is taken down as well, unless it's a boss.
   *
   * @param {Pokemon} pokemon Pokemon that is attacking the Destiny Bond user.
   * @param {BattlerTagLapseType} lapseType CUSTOM or PRE_MOVE
   * @returns false if the tag source fainted or one turn has passed since the application
   */
  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType !== BattlerTagLapseType.CUSTOM) {
      return super.lapse(pokemon, lapseType);
    }
    const source = pokemon.scene.getPokemonById(this.sourceId);
    if (!source.isFainted()) {
      return true;
    }

    if (source.getAlly() === pokemon) {
      return false;
    }

    const targetMessage = getPokemonMessage(pokemon, "");

    if (pokemon.isBossImmune()) {
      pokemon.scene.queueMessage(`${targetMessage} is unaffected\nby the effects of Destiny Bond.`);
      return false;
    }

    pokemon.scene.queueMessage(`${getPokemonMessage(source, ` took\n${targetMessage} down with it!`)}`);
    pokemon.damageAndUpdate(pokemon.hp, HitResult.ONE_HIT_KO, false, false, true);
    return false;
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

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is\nalready in love!"));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` is in love\nwith ${pokemon.scene.getPokemonById(this.sourceId).name}!`));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), undefined, CommonAnim.ATTRACT));

      if (pokemon.randSeedInt(2)) {
        pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is\nimmobilized by love!"));
        (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
      }
    }

    return ret;
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " got over\nits infatuation."));
  }

  isSourceLinked(): boolean {
    return true;
  }

  getDescriptor(): string {
    return "infatuation";
  }
}

export class SeedTag extends BattlerTag {
  private sourceIndex: integer;

  constructor(sourceId: integer) {
    super(BattlerTagType.SEEDED, BattlerTagLapseType.TURN_END, 1, Moves.LEECH_SEED, sourceId);
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.sourceIndex = source.sourceIndex;
  }

  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isOfType(Type.GRASS);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " was seeded!"));
    this.sourceIndex = pokemon.scene.getPokemonById(this.sourceId).getBattlerIndex();
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      const source = pokemon.getOpponents().find(o => o.getBattlerIndex() === this.sourceIndex);
      if (source) {
        const cancelled = new Utils.BooleanHolder(false);
        applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

        if (!cancelled.value) {
          pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, source.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.LEECH_SEED));

          const damage = pokemon.damageAndUpdate(Math.max(Math.floor(pokemon.getMaxHp() / 8), 1));
          const reverseDrain = pokemon.hasAbilityWithAttr(ReverseDrainAbAttr, false);
          pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, source.getBattlerIndex(),
            !reverseDrain ? damage : damage * -1,
            !reverseDrain ? getPokemonMessage(pokemon, "'s health is\nsapped by Leech Seed!") : getPokemonMessage(source, "'s Leech Seed\nsucked up the liquid ooze!"),
            false, true));
        }
      }
    }

    return ret;
  }

  getDescriptor(): string {
    return "seeding";
  }
}

export class NightmareTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.NIGHTMARE, BattlerTagLapseType.AFTER_MOVE, 1, Moves.NIGHTMARE);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " began\nhaving a Nightmare!"));
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is\nalready locked in a Nightmare!"));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is locked\nin a Nightmare!"));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), undefined, CommonAnim.CURSE)); // TODO: Update animation type

      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

      if (!cancelled.value) {
        pokemon.damageAndUpdate(Math.ceil(pokemon.getMaxHp() / 4));
      }
    }

    return ret;
  }

  getDescriptor(): string {
    return "nightmares";
  }
}

export class FrenzyTag extends BattlerTag {
  constructor(sourceMove: Moves, sourceId: integer) {
    super(BattlerTagType.FRENZY, BattlerTagLapseType.CUSTOM, 1, sourceMove, sourceId);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.addTag(BattlerTagType.CONFUSED, pokemon.randSeedIntRange(2, 4));
  }
}

export class ChargingTag extends BattlerTag {
  constructor(sourceMove: Moves, sourceId: integer) {
    super(BattlerTagType.CHARGING, BattlerTagLapseType.CUSTOM, 1, sourceMove, sourceId);
  }
}

export class EncoreTag extends BattlerTag {
  public moveId: Moves;

  constructor(sourceId: integer) {
    super(BattlerTagType.ENCORE, BattlerTagLapseType.AFTER_MOVE, 3, Moves.ENCORE, sourceId);
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.moveId = source.moveId as Moves;
  }

  canAdd(pokemon: Pokemon): boolean {
    if (pokemon.isMax()) {
      return false;
    }

    const lastMoves = pokemon.getLastXMoves(1);
    if (!lastMoves.length) {
      return false;
    }

    const repeatableMove = lastMoves[0];

    if (!repeatableMove.move || repeatableMove.virtual) {
      return false;
    }

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

    if (allMoves[repeatableMove.move].hasAttr(ChargeAttr) && repeatableMove.result === MoveResult.OTHER) {
      return false;
    }

    this.moveId = repeatableMove.move;

    return true;
  }

  onAdd(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " got\nan Encore!"));

    const movePhase = pokemon.scene.findPhase(m => m instanceof MovePhase && m.pokemon === pokemon);
    if (movePhase) {
      const movesetMove = pokemon.getMoveset().find(m => m.moveId === this.moveId);
      if (movesetMove) {
        const lastMove = pokemon.getLastXMoves(1)[0];
        pokemon.scene.tryReplacePhase((m => m instanceof MovePhase && m.pokemon === pokemon),
          new MovePhase(pokemon.scene, pokemon, lastMove.targets, movesetMove));
      }
    }
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, "'s Encore\nended!"));
  }
}

export class HelpingHandTag extends BattlerTag {
  constructor(sourceId: integer) {
    super(BattlerTagType.HELPING_HAND, BattlerTagLapseType.TURN_END, 1, Moves.HELPING_HAND, sourceId);
  }

  onAdd(pokemon: Pokemon): void {
    pokemon.scene.queueMessage(getPokemonMessage(pokemon.scene.getPokemonById(this.sourceId), ` is ready to\nhelp ${pokemon.name}!`));
  }
}

/**
 * Applies the Ingrain tag to a pokemon
 * @extends TrappedTag
 */
export class IngrainTag extends TrappedTag {
  constructor(sourceId: integer) {
    super(BattlerTagType.INGRAIN, BattlerTagLapseType.TURN_END, 1, Moves.INGRAIN, sourceId);
  }

  /**
   * Check if the Ingrain tag can be added to the pokemon
   * @param pokemon {@linkcode Pokemon} The pokemon to check if the tag can be added to
   * @returns boolean True if the tag can be added, false otherwise
   */
  canAdd(pokemon: Pokemon): boolean {
    const isTrapped = pokemon.getTag(BattlerTagType.TRAPPED);

    return !isTrapped;
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(), Math.floor(pokemon.getMaxHp() / 16),
        getPokemonMessage(pokemon, " absorbed\nnutrients with its roots!"), true));
    }

    return ret;
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, " planted its roots!");
  }

  getDescriptor(): string {
    return "roots";
  }
}

export class AquaRingTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.AQUA_RING, BattlerTagLapseType.TURN_END, 1, Moves.AQUA_RING, undefined);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " surrounded\nitself with a veil of water!"));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.getBattlerIndex(),
        Math.floor(pokemon.getMaxHp() / 16), `${this.getMoveName()} restored\n${pokemon.name}\'s HP!`, true));
    }

    return ret;
  }
}

/** Tag used to allow moves that interact with {@link Moves.MINIMIZE} to function */
export class MinimizeTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.MINIMIZED, BattlerTagLapseType.TURN_END, 1, Moves.MINIMIZE, undefined);
  }

  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isMax();
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    //If a pokemon dynamaxes they lose minimized status
    if (pokemon.isMax()) {
      return false;
    }
    return lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);
  }
}

export class DrowsyTag extends BattlerTag {
  constructor() {
    super(BattlerTagType.DROWSY, BattlerTagLapseType.TURN_END, 2, Moves.YAWN);
  }

  canAdd(pokemon: Pokemon): boolean {
    return pokemon.scene.arena.terrain?.terrainType !== TerrainType.ELECTRIC || !pokemon.isGrounded();
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " grew drowsy!"));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (!super.lapse(pokemon, lapseType)) {
      pokemon.trySetStatus(StatusEffect.SLEEP, true);
      return false;
    }

    return true;
  }

  getDescriptor(): string {
    return "drowsiness";
  }
}

export abstract class DamagingTrapTag extends TrappedTag {
  private commonAnim: CommonAnim;

  constructor(tagType: BattlerTagType, commonAnim: CommonAnim, turnCount: integer, sourceMove: Moves, sourceId: integer) {
    super(tagType, BattlerTagLapseType.TURN_END, turnCount, sourceMove, sourceId);

    this.commonAnim = commonAnim;
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.commonAnim = source.commonAnim as CommonAnim;
  }

  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isOfType(Type.GHOST) && !pokemon.findTag(t => t instanceof DamagingTrapTag);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` is hurt\nby ${this.getMoveName()}!`));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), undefined, this.commonAnim));

      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

      if (!cancelled.value) {
        pokemon.damageAndUpdate(Math.ceil(pokemon.getMaxHp() / 8));
      }
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
    return getPokemonMessage(pokemon, " was trapped\nin the vortex!");
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
    return getPokemonMessage(pokemon, ` became trapped\nby ${this.getMoveName()}!`);
  }
}

export class MagmaStormTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.MAGMA_STORM, CommonAnim.MAGMA_STORM, turnCount, Moves.MAGMA_STORM, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, " became trapped\nby swirling magma!");
  }
}

export class SnapTrapTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.SNAP_TRAP, CommonAnim.SNAP_TRAP, turnCount, Moves.SNAP_TRAP, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, " got trapped\nby a snap trap!");
  }
}

export class ThunderCageTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.THUNDER_CAGE, CommonAnim.THUNDER_CAGE, turnCount, Moves.THUNDER_CAGE, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon.scene.getPokemonById(this.sourceId), ` trapped\n${getPokemonNameWithAffix(pokemon)}!`);
  }
}

export class InfestationTag extends DamagingTrapTag {
  constructor(turnCount: integer, sourceId: integer) {
    super(BattlerTagType.INFESTATION, CommonAnim.INFESTATION, turnCount, Moves.INFESTATION, sourceId);
  }

  getTrapMessage(pokemon: Pokemon): string {
    return getPokemonMessage(pokemon, ` has been afflicted \nwith an infestation by ${getPokemonNameWithAffix(pokemon.scene.getPokemonById(this.sourceId))}!`);
  }
}


export class ProtectedTag extends BattlerTag {
  constructor(sourceMove: Moves, tagType: BattlerTagType = BattlerTagType.PROTECTED) {
    super(tagType, BattlerTagLapseType.CUSTOM, 0, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, "\nprotected itself!"));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.CUSTOM) {
      new CommonBattleAnim(CommonAnim.PROTECT, pokemon).play(pokemon.scene);
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, "\nprotected itself!"));
      return true;
    }

    return super.lapse(pokemon, lapseType);
  }
}

export class ContactDamageProtectedTag extends ProtectedTag {
  private damageRatio: integer;

  constructor(sourceMove: Moves, damageRatio: integer) {
    super(sourceMove, BattlerTagType.SPIKY_SHIELD);

    this.damageRatio = damageRatio;
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.damageRatio = source.damageRatio;
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (lapseType === BattlerTagLapseType.CUSTOM) {
      const effectPhase = pokemon.scene.getCurrentPhase();
      if (effectPhase instanceof MoveEffectPhase && effectPhase.move.getMove().hasFlag(MoveFlags.MAKES_CONTACT)) {
        const attacker = effectPhase.getPokemon();
        attacker.damageAndUpdate(Math.ceil(attacker.getMaxHp() * (1 / this.damageRatio)), HitResult.OTHER);
      }
    }

    return ret;
  }
}

export class ContactStatChangeProtectedTag extends ProtectedTag {
  private stat: BattleStat;
  private levels: integer;

  constructor(sourceMove: Moves, tagType: BattlerTagType, stat: BattleStat, levels: integer) {
    super(sourceMove, tagType);

    this.stat = stat;
    this.levels = levels;
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.stat = source.stat as BattleStat;
    this.levels = source.levels;
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (lapseType === BattlerTagLapseType.CUSTOM) {
      const effectPhase = pokemon.scene.getCurrentPhase();
      if (effectPhase instanceof MoveEffectPhase && effectPhase.move.getMove().hasFlag(MoveFlags.MAKES_CONTACT)) {
        const attacker = effectPhase.getPokemon();
        pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, attacker.getBattlerIndex(), true, [ this.stat ], this.levels));
      }
    }

    return ret;
  }
}

export class ContactPoisonProtectedTag extends ProtectedTag {
  constructor(sourceMove: Moves) {
    super(sourceMove, BattlerTagType.BANEFUL_BUNKER);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (lapseType === BattlerTagLapseType.CUSTOM) {
      const effectPhase = pokemon.scene.getCurrentPhase();
      if (effectPhase instanceof MoveEffectPhase && effectPhase.move.getMove().hasFlag(MoveFlags.MAKES_CONTACT)) {
        const attacker = effectPhase.getPokemon();
        attacker.trySetStatus(StatusEffect.POISON, true, pokemon);
      }
    }

    return ret;
  }
}

export class ContactBurnProtectedTag extends ProtectedTag {
  constructor(sourceMove: Moves) {
    super(sourceMove, BattlerTagType.BURNING_BULWARK);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (lapseType === BattlerTagLapseType.CUSTOM) {
      const effectPhase = pokemon.scene.getCurrentPhase();
      if (effectPhase instanceof MoveEffectPhase && effectPhase.move.getMove().hasFlag(MoveFlags.MAKES_CONTACT)) {
        const attacker = effectPhase.getPokemon();
        attacker.trySetStatus(StatusEffect.BURN, true);
      }
    }

    return ret;
  }
}

export class EnduringTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.ENDURING, BattlerTagLapseType.TURN_END, 0, sourceMove);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " braced\nitself!"));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.CUSTOM) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, " endured\nthe hit!"));
      return true;
    }

    return super.lapse(pokemon, lapseType);
  }
}

export class SturdyTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.STURDY, BattlerTagLapseType.TURN_END, 0, sourceMove);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (lapseType === BattlerTagLapseType.CUSTOM) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, " endured\nthe hit!"));
      return true;
    }

    return super.lapse(pokemon, lapseType);
  }
}

export class PerishSongTag extends BattlerTag {
  constructor(turnCount: integer) {
    super(BattlerTagType.PERISH_SONG, BattlerTagLapseType.TURN_END, turnCount, Moves.PERISH_SONG);
  }

  canAdd(pokemon: Pokemon): boolean {
    return !pokemon.isBossImmune();
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, `\'s perish count fell to ${this.turnCount}.`));
    } else {
      pokemon.damageAndUpdate(pokemon.hp, HitResult.ONE_HIT_KO, false, true, true);
    }

    return ret;
  }
}

/**
 * Applies the "Center of Attention" volatile status effect, the effect applied by Follow Me, Rage Powder, and Spotlight.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Center_of_attention | Center of Attention}
 */
export class CenterOfAttentionTag extends BattlerTag {
  public powder: boolean;

  constructor(sourceMove: Moves) {
    super(BattlerTagType.CENTER_OF_ATTENTION, BattlerTagLapseType.TURN_END, 1, sourceMove);

    this.powder = (this.sourceMove === Moves.RAGE_POWDER);
  }

  /** "Center of Attention" can't be added if an ally is already the Center of Attention. */
  canAdd(pokemon: Pokemon): boolean {
    const activeTeam = pokemon.isPlayer() ? pokemon.scene.getPlayerField() : pokemon.scene.getEnemyField();

    return !activeTeam.find(p => p.getTag(BattlerTagType.CENTER_OF_ATTENTION));
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " became the center\nof attention!"));
  }
}

export class AbilityBattlerTag extends BattlerTag {
  public ability: Abilities;

  constructor(tagType: BattlerTagType, ability: Abilities, lapseType: BattlerTagLapseType, turnCount: integer) {
    super(tagType, lapseType, turnCount, undefined);

    this.ability = ability;
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.ability = source.ability as Abilities;
  }
}

export class TruantTag extends AbilityBattlerTag {
  constructor() {
    super(BattlerTagType.TRUANT, Abilities.TRUANT, BattlerTagLapseType.MOVE, 1);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (!pokemon.hasAbility(Abilities.TRUANT)) {
      return super.lapse(pokemon, lapseType);
    }
    const passive = pokemon.getAbility().id !== Abilities.TRUANT;

    const lastMove = pokemon.getLastXMoves().find(() => true);

    if (lastMove && lastMove.move !== Moves.NONE) {
      (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
      pokemon.scene.unshiftPhase(new ShowAbilityPhase(pokemon.scene, pokemon.id, passive));
      pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is\nloafing around!"));
    }

    return true;
  }
}

export class SlowStartTag extends AbilityBattlerTag {
  constructor() {
    super(BattlerTagType.SLOW_START, Abilities.SLOW_START, BattlerTagLapseType.TURN_END, 5);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " can't\nget it going!"), null, false, null, true);
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    if (!pokemon.hasAbility(this.ability)) {
      this.turnCount = 1;
    }

    return super.lapse(pokemon, lapseType);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " finally\ngot its act together!"), null, false, null);
  }
}

export class HighestStatBoostTag extends AbilityBattlerTag {
  public stat: Stat;
  public multiplier: number;

  constructor(tagType: BattlerTagType, ability: Abilities) {
    super(tagType, ability, BattlerTagLapseType.CUSTOM, 1);
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.stat = source.stat as Stat;
    this.multiplier = source.multiplier;
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    const stats = [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ];
    let highestStat: Stat;
    stats.map(s => pokemon.getBattleStat(s)).reduce((highestValue: integer, value: integer, i: integer) => {
      if (value > highestValue) {
        highestStat = stats[i];
        return value;
      }
      return highestValue;
    }, 0);

    this.stat = highestStat;

    switch (this.stat) {
    case Stat.SPD:
      this.multiplier = 1.5;
      break;
    default:
      this.multiplier = 1.3;
      break;
    }

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, `'s ${getStatName(highestStat)}\nwas heightened!`), null, false, null, true);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(`The effects of ${getPokemonMessage(pokemon, `'s\n${allAbilities[this.ability].name} wore off!`)}`);
  }
}

export class WeatherHighestStatBoostTag extends HighestStatBoostTag implements WeatherBattlerTag {
  public weatherTypes: WeatherType[];

  constructor(tagType: BattlerTagType, ability: Abilities, ...weatherTypes: WeatherType[]) {
    super(tagType, ability);
    this.weatherTypes = weatherTypes;
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.weatherTypes = source.weatherTypes.map(w => w as WeatherType);
  }
}

export class TerrainHighestStatBoostTag extends HighestStatBoostTag implements TerrainBattlerTag {
  public terrainTypes: TerrainType[];

  constructor(tagType: BattlerTagType, ability: Abilities, ...terrainTypes: TerrainType[]) {
    super(tagType, ability);
    this.terrainTypes = terrainTypes;
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.terrainTypes = source.terrainTypes.map(w => w as TerrainType);
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

export class TypeImmuneTag extends BattlerTag {
  public immuneType: Type;

  constructor(tagType: BattlerTagType, sourceMove: Moves, immuneType: Type, length: number = 1) {
    super(tagType, BattlerTagLapseType.TURN_END, length, sourceMove);

    this.immuneType = immuneType;
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.immuneType = source.immuneType as Type;
  }
}

export class MagnetRisenTag extends TypeImmuneTag {
  constructor(tagType: BattlerTagType, sourceMove: Moves) {
    super(tagType, sourceMove, Type.GROUND, 5);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " levitated with electromagnetism!"));
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " stopped levitating!"));
  }
}

export class TypeBoostTag extends BattlerTag {
  public boostedType: Type;
  public boostValue: number;
  public oneUse: boolean;

  constructor(tagType: BattlerTagType, sourceMove: Moves, boostedType: Type, boostValue: number, oneUse: boolean) {
    super(tagType, BattlerTagLapseType.TURN_END, 1, sourceMove);

    this.boostedType = boostedType;
    this.boostValue = boostValue;
    this.oneUse = oneUse;
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.boostedType = source.boostedType as Type;
    this.boostValue = source.boostValue;
    this.oneUse = source.oneUse;
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

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is getting\npumped!"));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    return lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " relaxed."));
  }
}

export class AlwaysCritTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.ALWAYS_CRIT, BattlerTagLapseType.TURN_END, 2, sourceMove);
  }
}

export class IgnoreAccuracyTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.IGNORE_ACCURACY, BattlerTagLapseType.TURN_END, 2, sourceMove);
  }
}

export class SaltCuredTag extends BattlerTag {
  private sourceIndex: integer;

  constructor(sourceId: integer) {
    super(BattlerTagType.SALT_CURED, BattlerTagLapseType.TURN_END, 1, Moves.SALT_CURE, sourceId);
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.sourceIndex = source.sourceIndex;
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " is being salt cured!"));
    this.sourceIndex = pokemon.scene.getPokemonById(this.sourceId).getBattlerIndex();
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.SALT_CURE));

      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

      if (!cancelled.value) {
        const pokemonSteelOrWater = pokemon.isOfType(Type.STEEL) || pokemon.isOfType(Type.WATER);
        pokemon.damageAndUpdate(Math.max(Math.floor(pokemonSteelOrWater ? pokemon.getMaxHp() / 4 : pokemon.getMaxHp() / 8), 1));

        pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` is hurt by ${this.getMoveName()}!`));
      }
    }

    return ret;
  }
}

export class CursedTag extends BattlerTag {
  private sourceIndex: integer;

  constructor(sourceId: integer) {
    super(BattlerTagType.CURSED, BattlerTagLapseType.TURN_END, 1, Moves.CURSE, sourceId);
  }

  /**
  * When given a battler tag or json representing one, load the data for it.
  * @param {BattlerTag | any} source A battler tag
  */
  loadTag(source: BattlerTag | any): void {
    super.loadTag(source);
    this.sourceIndex = source.sourceIndex;
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.queueMessage(getPokemonMessage(pokemon, " has been cursed!"));
    this.sourceIndex = pokemon.scene.getPokemonById(this.sourceId).getBattlerIndex();
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.getBattlerIndex(), pokemon.getBattlerIndex(), CommonAnim.SALT_CURE));

      const cancelled = new Utils.BooleanHolder(false);
      applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

      if (!cancelled.value) {
        pokemon.damageAndUpdate(Math.max(Math.floor(pokemon.getMaxHp() / 4), 1));
        pokemon.scene.queueMessage(getPokemonMessage(pokemon, ` is hurt by the ${this.getMoveName()}!`));
      }
    }

    return ret;
  }
}

/**
 * Provides the Ice Face ability's effects.
 */
export class IceFaceTag extends BattlerTag {
  constructor(sourceMove: Moves) {
    super(BattlerTagType.ICE_FACE, BattlerTagLapseType.CUSTOM, 1, sourceMove);
  }

  /**
   * Determines if the Ice Face tag can be added to the Pokémon.
   * @param {Pokemon} pokemon - The Pokémon to which the tag might be added.
   * @returns {boolean} - True if the tag can be added, false otherwise.
   */
  canAdd(pokemon: Pokemon): boolean {
    const weatherType = pokemon.scene.arena.weather?.weatherType;
    const isWeatherSnowOrHail = weatherType === WeatherType.HAIL || weatherType === WeatherType.SNOW;
    const isFormIceFace = pokemon.formIndex === 0;


    // Hard code Eiscue for now, this is to prevent the game from crashing if fused pokemon has Ice Face
    if ((pokemon.species.speciesId === Species.EISCUE && isFormIceFace) ||  isWeatherSnowOrHail) {
      return true;
    }
    return false;
  }

  /**
   * Applies the Ice Face tag to the Pokémon.
   * Triggers a form change to Ice Face if the Pokémon is not in its Ice Face form.
   * @param {Pokemon} pokemon - The Pokémon to which the tag is added.
   */
  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    if (pokemon.formIndex !== 0) {
      pokemon.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger);
    }
  }

  /**
   * Removes the Ice Face tag from the Pokémon.
   * Triggers a form change to Noice when the tag is removed.
   * @param {Pokemon} pokemon - The Pokémon from which the tag is removed.
   */
  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);

    pokemon.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger);
  }
}

export function getBattlerTag(tagType: BattlerTagType, turnCount: integer, sourceMove: Moves, sourceId: integer): BattlerTag {
  switch (tagType) {
  case BattlerTagType.RECHARGING:
    return new RechargingTag(sourceMove);
  case BattlerTagType.FLINCHED:
    return new FlinchedTag(sourceMove);
  case BattlerTagType.INTERRUPTED:
    return new InterruptedTag(sourceMove);
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
  case BattlerTagType.CHARGING:
    return new ChargingTag(sourceMove, sourceId);
  case BattlerTagType.ENCORE:
    return new EncoreTag(sourceId);
  case BattlerTagType.HELPING_HAND:
    return new HelpingHandTag(sourceId);
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
  case BattlerTagType.SNAP_TRAP:
    return new SnapTrapTag(turnCount, sourceId);
  case BattlerTagType.THUNDER_CAGE:
    return new ThunderCageTag(turnCount, sourceId);
  case BattlerTagType.INFESTATION:
    return new InfestationTag(turnCount, sourceId);
  case BattlerTagType.PROTECTED:
    return new ProtectedTag(sourceMove);
  case BattlerTagType.SPIKY_SHIELD:
    return new ContactDamageProtectedTag(sourceMove, 8);
  case BattlerTagType.KINGS_SHIELD:
    return new ContactStatChangeProtectedTag(sourceMove, tagType, BattleStat.ATK, -1);
  case BattlerTagType.OBSTRUCT:
    return new ContactStatChangeProtectedTag(sourceMove, tagType, BattleStat.DEF, -2);
  case BattlerTagType.SILK_TRAP:
    return new ContactStatChangeProtectedTag(sourceMove, tagType, BattleStat.SPD, -1);
  case BattlerTagType.BANEFUL_BUNKER:
    return new ContactPoisonProtectedTag(sourceMove);
  case BattlerTagType.BURNING_BULWARK:
    return new ContactBurnProtectedTag(sourceMove);
  case BattlerTagType.ENDURING:
    return new EnduringTag(sourceMove);
  case BattlerTagType.STURDY:
    return new SturdyTag(sourceMove);
  case BattlerTagType.PERISH_SONG:
    return new PerishSongTag(turnCount);
  case BattlerTagType.CENTER_OF_ATTENTION:
    return new CenterOfAttentionTag(sourceMove);
  case BattlerTagType.TRUANT:
    return new TruantTag();
  case BattlerTagType.SLOW_START:
    return new SlowStartTag();
  case BattlerTagType.PROTOSYNTHESIS:
    return new WeatherHighestStatBoostTag(tagType, Abilities.PROTOSYNTHESIS, WeatherType.SUNNY, WeatherType.HARSH_SUN);
  case BattlerTagType.QUARK_DRIVE:
    return new TerrainHighestStatBoostTag(tagType, Abilities.QUARK_DRIVE, TerrainType.ELECTRIC);
  case BattlerTagType.FLYING:
  case BattlerTagType.UNDERGROUND:
  case BattlerTagType.UNDERWATER:
  case BattlerTagType.HIDDEN:
    return new HideSpriteTag(tagType, turnCount, sourceMove);
  case BattlerTagType.FIRE_BOOST:
    return new TypeBoostTag(tagType, sourceMove, Type.FIRE, 1.5, false);
  case BattlerTagType.CRIT_BOOST:
    return new CritBoostTag(tagType, sourceMove);
  case BattlerTagType.ALWAYS_CRIT:
    return new AlwaysCritTag(sourceMove);
  case BattlerTagType.NO_CRIT:
    return new BattlerTag(tagType, BattlerTagLapseType.AFTER_MOVE, turnCount, sourceMove);
  case BattlerTagType.IGNORE_ACCURACY:
    return new IgnoreAccuracyTag(sourceMove);
  case BattlerTagType.BYPASS_SLEEP:
    return new BattlerTag(BattlerTagType.BYPASS_SLEEP, BattlerTagLapseType.TURN_END, turnCount, sourceMove);
  case BattlerTagType.IGNORE_FLYING:
    return new BattlerTag(tagType, BattlerTagLapseType.TURN_END, turnCount, sourceMove);
  case BattlerTagType.GROUNDED:
    return new BattlerTag(tagType, BattlerTagLapseType.TURN_END, turnCount - 1, sourceMove);
  case BattlerTagType.SALT_CURED:
    return new SaltCuredTag(sourceId);
  case BattlerTagType.CURSED:
    return new CursedTag(sourceId);
  case BattlerTagType.CHARGED:
    return new TypeBoostTag(tagType, sourceMove, Type.ELECTRIC, 2, true);
  case BattlerTagType.MAGNET_RISEN:
    return new MagnetRisenTag(tagType, sourceMove);
  case BattlerTagType.MINIMIZED:
    return new MinimizeTag();
  case BattlerTagType.DESTINY_BOND:
    return new DestinyBondTag(sourceMove, sourceId);
  case BattlerTagType.ICE_FACE:
    return new IceFaceTag(sourceMove);
  case BattlerTagType.NONE:
  default:
    return new BattlerTag(tagType, BattlerTagLapseType.CUSTOM, turnCount, sourceMove, sourceId);
  }
}

/**
* When given a battler tag or json representing one, creates an actual BattlerTag object with the same data.
* @param {BattlerTag | any} source A battler tag
* @return {BattlerTag} The valid battler tag
*/
export function loadBattlerTag(source: BattlerTag | any): BattlerTag {
  const tag = getBattlerTag(source.tagType, source.turnCount, source.sourceMove, source.sourceId);
  tag.loadTag(source);
  return tag;
}
