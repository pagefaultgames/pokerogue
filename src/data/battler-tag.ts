import { CommonAnim, CommonBattleAnim } from "./battle-anims";
import { CommonAnimPhase, DamagePhase, MessagePhase, MovePhase, ObtainStatusEffectPhase, PokemonHealPhase } from "../battle-phases";
import { getPokemonMessage } from "../messages";
import Pokemon from "../pokemon";
import { Stat } from "./pokemon-stat";
import { StatusEffect } from "./status-effect";
import * as Utils from "../utils";
import { Moves } from "./move";

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

  constructor(tagType: BattlerTagType, lapseType: BattlerTagLapseType, turnCount: integer) {
    this.tagType = tagType;
    this.lapseType = lapseType;
    this.turnCount = turnCount;
  }

  onAdd(pokemon: Pokemon): void { }

  onRemove(pokemon: Pokemon): void { }

  onOverlap(pokemon: Pokemon): void { }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    return --this.turnCount > 0;
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

export class PseudoStatusTag extends BattlerTag {
  constructor(tagType: BattlerTagType, lapseType: BattlerTagLapseType, turnCount: integer) {
    super(tagType, lapseType, turnCount);
  }
}

export class ConfusedTag extends PseudoStatusTag {
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
        pokemon.damage(damage);
        pokemon.scene.queueMessage('It hurt itself in its\nconfusion!');
        pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.isPlayer()));
        (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
      }
    }
    
    return ret;
  }
}

export class SeedTag extends PseudoStatusTag {
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
      pokemon.damage(damage);
      pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.isPlayer()));
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, !pokemon.isPlayer(), damage, getPokemonMessage(pokemon, '\'s health is\nsapped by LEECH SEED!'), false, true));
    }
    
    return ret;
  }
}

export class NightmareTag extends PseudoStatusTag {
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
      pokemon.damage(damage);
      pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.isPlayer()));
    }
    
    return ret;
  }
}

export class IngrainTag extends PseudoStatusTag {
  constructor() {
    super(BattlerTagType.INGRAIN, BattlerTagLapseType.TURN_END, 1);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' planted its roots!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret)
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.isPlayer(), Math.floor(pokemon.getMaxHp() / 16),
        getPokemonMessage(pokemon, ` absorbed\nnutrients with its roots!`), true));
    
    return ret;
  }
}

export class AquaRingTag extends PseudoStatusTag {
  constructor() {
    super(BattlerTagType.AQUA_RING, BattlerTagLapseType.TURN_END, 1);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.queueMessage(getPokemonMessage(pokemon, ' surrounded\nitself with a veil of water!'));
  }

  lapse(pokemon: Pokemon, lapseType: BattlerTagLapseType): boolean {
    const ret = lapseType !== BattlerTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret)
      pokemon.scene.unshiftPhase(new PokemonHealPhase(pokemon.scene, pokemon.isPlayer(), Math.floor(pokemon.getMaxHp() / 16), `AQUA RING restored\n${pokemon.name}\'s HP!`, true));
    
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

export function getBattlerTag(tagType: BattlerTagType, turnCount: integer): BattlerTag {
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
      return new IngrainTag();
    case BattlerTagType.AQUA_RING:
      return new AquaRingTag();
    case BattlerTagType.DROWSY:
      return new DrowsyTag();
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