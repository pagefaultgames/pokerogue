import { CommonAnim, CommonBattleAnim } from "./battle-anims";
import { CommonAnimPhase, DamagePhase, MessagePhase, MovePhase, PokemonHealPhase } from "./battle-phases";
import { getPokemonMessage } from "./messages";
import Pokemon from "./pokemon";
import { Stat } from "./pokemon-stat";
import * as Utils from "./utils";

export enum BattleTagType {
  NONE,
  FLINCHED,
  CONFUSED,
  SEEDED,
  NIGHTMARE,
  FRENZY,
  PROTECTED,
  FLYING,
  UNDERGROUND,
  BYPASS_SLEEP,
  IGNORE_FLYING
}

export enum BattleTagLapseType {
  FAINT,
  MOVE,
  AFTER_MOVE,
  MOVE_EFFECT,
  TURN_END,
  CUSTOM
}

export class BattleTag {
  public tagType: BattleTagType;
  public lapseType: BattleTagLapseType;
  public turnCount: integer;

  constructor(tagType: BattleTagType, lapseType: BattleTagLapseType, turnCount: integer) {
    this.tagType = tagType;
    this.lapseType = lapseType;
    this.turnCount = turnCount;
  }

  onAdd(pokemon: Pokemon): void { }

  onRemove(pokemon: Pokemon): void { }

  onOverlap(pokemon: Pokemon): void { }

  lapse(pokemon: Pokemon, lapseType: BattleTagLapseType): boolean {
    return --this.turnCount > 0;
  }
}

export class FlinchedTag extends BattleTag {
  constructor() {
    super(BattleTagType.FLINCHED, BattleTagLapseType.MOVE, 0);
  }

  lapse(pokemon: Pokemon, lapseType: BattleTagLapseType): boolean {
    super.lapse(pokemon, lapseType);

    (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
    pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, ' flinched!')));

    return true;
  }
}

export class PseudoStatusTag extends BattleTag {
  constructor(tagType: BattleTagType, lapseType: BattleTagLapseType, turnCount: integer) {
    super(tagType, lapseType, turnCount);
  }
}

export class ConfusedTag extends PseudoStatusTag {
  constructor(turnCount: integer) {
    super(BattleTagType.CONFUSED, BattleTagLapseType.MOVE, turnCount);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.isPlayer(), CommonAnim.CONFUSION));
    pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, ' became\nconfused!')));
  }

  onRemove(pokemon: Pokemon): void {
    super.onRemove(pokemon);
    
    pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, ' snapped\nout of confusion!')));
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, ' is\nalready confused!')));
  }

  lapse(pokemon: Pokemon, lapseType: BattleTagLapseType): boolean {
    const ret = super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, ' is\nconfused!')));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.isPlayer(), CommonAnim.CONFUSION));

      if (Utils.randInt(2)) {
        const atk = pokemon.getBattleStat(Stat.ATK);
        const def = pokemon.getBattleStat(Stat.DEF);
        const damage = Math.ceil(((((2 * pokemon.level / 5 + 2) * 40 * atk / def) / 50) + 2) * ((Utils.randInt(15) + 85) / 100));
        pokemon.damage(damage);
        pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, 'It hurt itself in its\nconfusion!'));
        pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.isPlayer()));
        (pokemon.scene.getCurrentPhase() as MovePhase).cancel();
      }
    }
    
    return ret;
  }
}

export class SeedTag extends PseudoStatusTag {
  constructor() {
    super(BattleTagType.SEEDED, BattleTagLapseType.AFTER_MOVE, 1);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, ' was seeded!')));
  }

  lapse(pokemon: Pokemon, lapseType: BattleTagLapseType): boolean {
    console.trace(lapseType);
    const ret = lapseType !== BattleTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

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
    super(BattleTagType.NIGHTMARE, BattleTagLapseType.AFTER_MOVE, 1);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);
    
    pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, ' began\nhaving a NIGHTMARE!')));
  }

  onOverlap(pokemon: Pokemon): void {
    super.onOverlap(pokemon);

    pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, ' is\nalready locked in a NIGHTMARE!')));
  }

  lapse(pokemon: Pokemon, lapseType: BattleTagLapseType): boolean {
    const ret = lapseType !== BattleTagLapseType.CUSTOM || super.lapse(pokemon, lapseType);

    if (ret) {
      pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, ' is locked\nin a NIGHTMARE!')));
      pokemon.scene.unshiftPhase(new CommonAnimPhase(pokemon.scene, pokemon.isPlayer(), CommonAnim.CURSE)); // TODO: Update animation type

      const damage = Math.ceil(pokemon.getMaxHp() / 4);
      pokemon.damage(damage);
      pokemon.scene.unshiftPhase(new DamagePhase(pokemon.scene, pokemon.isPlayer()));
    }
    
    return ret;
  }
}

export class ProtectedTag extends BattleTag {
  constructor() {
    super(BattleTagType.PROTECTED, BattleTagLapseType.CUSTOM, 0);
  }

  onAdd(pokemon: Pokemon): void {
    super.onAdd(pokemon);

    pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, '\nprotected itself!')));
  }

  lapse(pokemon: Pokemon, lapseType: BattleTagLapseType): boolean {
    console.log(pokemon, BattleTagLapseType[lapseType]);
    if (lapseType === BattleTagLapseType.CUSTOM) {
      new CommonBattleAnim(CommonAnim.PROTECT, pokemon).play(pokemon.scene);
      pokemon.scene.unshiftPhase(new MessagePhase(pokemon.scene, getPokemonMessage(pokemon, '\nprotected itself!')));
      return true;
    }

    return super.lapse(pokemon, lapseType);
  }
}

export class HideSpriteTag extends BattleTag {
  constructor(tagType: BattleTagType, turnCount: integer) {
    super(tagType, BattleTagLapseType.MOVE_EFFECT, turnCount);
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

export function getBattleTag(tagType: BattleTagType, turnCount: integer): BattleTag {
  switch (tagType) {
    case BattleTagType.FLINCHED:
      return new FlinchedTag();
    case BattleTagType.CONFUSED:
      return new ConfusedTag(turnCount);
    case BattleTagType.SEEDED:
      return new SeedTag();
    case BattleTagType.NIGHTMARE:
      return new NightmareTag();
    case BattleTagType.PROTECTED:
      return new ProtectedTag();
    case BattleTagType.FLYING:
    case BattleTagType.UNDERGROUND:
      return new HideSpriteTag(tagType, turnCount);
    case BattleTagType.BYPASS_SLEEP:
      return new BattleTag(BattleTagType.BYPASS_SLEEP, BattleTagLapseType.TURN_END, turnCount);
    case BattleTagType.IGNORE_FLYING:
      return new BattleTag(tagType, BattleTagLapseType.TURN_END, turnCount);
    default:
        return new BattleTag(tagType, BattleTagLapseType.CUSTOM, turnCount);
  }
}