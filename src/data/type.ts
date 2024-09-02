export enum Type {
  UNKNOWN = -1,
  NORMAL = 0,
  FIGHTING,
  FLYING,
  POISON,
  GROUND,
  ROCK,
  BUG,
  GHOST,
  STEEL,
  FIRE,
  WATER,
  GRASS,
  ELECTRIC,
  PSYCHIC,
  ICE,
  DRAGON,
  DARK,
  FAIRY,
  STELLAR
}

export type TypeDamageMultiplier = 0 | 0.125 | 0.25 | 0.5 | 1 | 2 | 4 | 8;

export function getTypeDamageMultiplier(attackType: Type, defType: Type): TypeDamageMultiplier {
  if (attackType === Type.UNKNOWN || defType === Type.UNKNOWN) {
    return 1;
  }

  switch (defType) {
  case Type.NORMAL:
    switch (attackType) {
    case Type.FIGHTING:
      return 2;
    case Type.GHOST:
      return 0;
    default:
      return 1;
    }
  case Type.FIGHTING:
    switch (attackType) {
    case Type.FLYING:
    case Type.PSYCHIC:
    case Type.FAIRY:
      return 2;
    case Type.ROCK:
    case Type.BUG:
    case Type.DARK:
      return 0.5;
    default:
      return 1;
    }
  case Type.FLYING:
    switch (attackType) {
    case Type.ROCK:
    case Type.ELECTRIC:
    case Type.ICE:
      return 2;
    case Type.FIGHTING:
    case Type.BUG:
    case Type.GRASS:
      return 0.5;
    case Type.GROUND:
      return 0;
    default:
      return 1;
    }
  case Type.POISON:
    switch (attackType) {
    case Type.GROUND:
    case Type.PSYCHIC:
      return 2;
    case Type.FIGHTING:
    case Type.POISON:
    case Type.BUG:
    case Type.GRASS:
    case Type.FAIRY:
      return 0.5;
    default:
      return 1;
    }
  case Type.GROUND:
    switch (attackType) {
    case Type.WATER:
    case Type.GRASS:
    case Type.ICE:
      return 2;
    case Type.POISON:
    case Type.ROCK:
      return 0.5;
    case Type.ELECTRIC:
      return 0;
    default:
      return 1;
    }
  case Type.ROCK:
    switch (attackType) {
    case Type.FIGHTING:
    case Type.GROUND:
    case Type.STEEL:
    case Type.WATER:
    case Type.GRASS:
      return 2;
    case Type.NORMAL:
    case Type.FLYING:
    case Type.POISON:
    case Type.FIRE:
      return 0.5;
    default:
      return 1;
    }
  case Type.BUG:
    switch (attackType) {
    case Type.FLYING:
    case Type.ROCK:
    case Type.FIRE:
      return 2;
    case Type.FIGHTING:
    case Type.GROUND:
    case Type.GRASS:
      return 0.5;
    default:
      return 1;
    }
  case Type.GHOST:
    switch (attackType) {
    case Type.GHOST:
    case Type.DARK:
      return 2;
    case Type.POISON:
    case Type.BUG:
      return 0.5;
    case Type.NORMAL:
    case Type.FIGHTING:
      return 0;
    default:
      return 1;
    }
  case Type.STEEL:
    switch (attackType) {
    case Type.FIGHTING:
    case Type.GROUND:
    case Type.FIRE:
      return 2;
    case Type.NORMAL:
    case Type.FLYING:
    case Type.ROCK:
    case Type.BUG:
    case Type.STEEL:
    case Type.GRASS:
    case Type.PSYCHIC:
    case Type.ICE:
    case Type.DRAGON:
    case Type.FAIRY:
      return 0.5;
    case Type.POISON:
      return 0;
    default:
      return 1;
    }
  case Type.FIRE:
    switch (attackType) {
    case Type.GROUND:
    case Type.ROCK:
    case Type.WATER:
      return 2;
    case Type.BUG:
    case Type.STEEL:
    case Type.FIRE:
    case Type.GRASS:
    case Type.ICE:
    case Type.FAIRY:
      return 0.5;
    default:
      return 1;
    }
  case Type.WATER:
    switch (attackType) {
    case Type.GRASS:
    case Type.ELECTRIC:
      return 2;
    case Type.STEEL:
    case Type.FIRE:
    case Type.WATER:
    case Type.ICE:
      return 0.5;
    default:
      return 1;
    }
  case Type.GRASS:
    switch (attackType) {
    case Type.FLYING:
    case Type.POISON:
    case Type.BUG:
    case Type.FIRE:
    case Type.ICE:
      return 2;
    case Type.GROUND:
    case Type.WATER:
    case Type.GRASS:
    case Type.ELECTRIC:
      return 0.5;
    default:
      return 1;
    }
  case Type.ELECTRIC:
    switch (attackType) {
    case Type.GROUND:
      return 2;
    case Type.FLYING:
    case Type.STEEL:
    case Type.ELECTRIC:
      return 0.5;
    default:
      return 1;
    }
  case Type.PSYCHIC:
    switch (attackType) {
    case Type.BUG:
    case Type.GHOST:
    case Type.DARK:
      return 2;
    case Type.FIGHTING:
    case Type.PSYCHIC:
      return 0.5;
    default:
      return 1;
    }
  case Type.ICE:
    switch (attackType) {
    case Type.FIGHTING:
    case Type.ROCK:
    case Type.STEEL:
    case Type.FIRE:
      return 2;
    case Type.ICE:
      return 0.5;
    default:
      return 1;
    }
  case Type.DRAGON:
    switch (attackType) {
    case Type.ICE:
    case Type.DRAGON:
    case Type.FAIRY:
      return 2;
    case Type.FIRE:
    case Type.WATER:
    case Type.GRASS:
    case Type.ELECTRIC:
      return 0.5;
    default:
      return 1;
    }
  case Type.DARK:
    switch (attackType) {
    case Type.FIGHTING:
    case Type.BUG:
    case Type.FAIRY:
      return 2;
    case Type.GHOST:
    case Type.DARK:
      return 0.5;
    case Type.PSYCHIC:
      return 0;
    default:
      return 1;
    }
  case Type.FAIRY:
    switch (attackType) {
    case Type.POISON:
    case Type.STEEL:
      return 2;
    case Type.FIGHTING:
    case Type.BUG:
    case Type.DARK:
      return 0.5;
    case Type.DRAGON:
      return 0;
    default:
      return 1;
    }
  case Type.STELLAR:
    return 1;
  }

  return 1;
}

/**
 * Retrieve the color corresponding to a specific damage multiplier
 * @returns A color or undefined if the default color should be used
 */
export function getTypeDamageMultiplierColor(multiplier: TypeDamageMultiplier, side: "defense" | "offense"): string | undefined {
  if (side === "offense") {
    switch (multiplier) {
    case 0:
      return "#929292";
    case 0.125:
      return "#FF5500";
    case 0.25:
      return "#FF7400";
    case 0.5:
      return "#FE8E00";
    case 1:
      return undefined;
    case 2:
      return "#4AA500";
    case 4:
      return "#4BB400";
    case 8:
      return "#52C200";
    }
  } else if (side === "defense") {
    switch (multiplier) {
    case 0:
      return "#B1B100";
    case 0.125:
      return "#2DB4FF";
    case 0.25:
      return "#00A4FF";
    case 0.5:
      return "#0093FF";
    case 1:
      return undefined;
    case 2:
      return "#FE8E00";
    case 4:
      return "#FF7400";
    case 8:
      return "#FF5500";
    }
  }
}

export function getTypeRgb(type: Type): [ integer, integer, integer ] {
  switch (type) {
  case Type.NORMAL:
    return [ 168, 168, 120 ];
  case Type.FIGHTING:
    return [ 192, 48, 40 ];
  case Type.FLYING:
    return [ 168, 144, 240 ];
  case Type.POISON:
    return [ 160, 64, 160 ];
  case Type.GROUND:
    return [ 224, 192, 104 ];
  case Type.ROCK:
    return [ 184, 160, 56 ];
  case Type.BUG:
    return [ 168, 184, 32 ];
  case Type.GHOST:
    return [ 112, 88, 152 ];
  case Type.STEEL:
    return [ 184, 184, 208 ];
  case Type.FIRE:
    return [ 240, 128, 48 ];
  case Type.WATER:
    return [ 104, 144, 240 ];
  case Type.GRASS:
    return [ 120, 200, 80 ];
  case Type.ELECTRIC:
    return [ 248, 208, 48 ];
  case Type.PSYCHIC:
    return [ 248, 88, 136 ];
  case Type.ICE:
    return [ 152, 216, 216 ];
  case Type.DRAGON:
    return [ 112, 56, 248 ];
  case Type.DARK:
    return [ 112, 88, 72 ];
  case Type.FAIRY:
    return [ 232, 136, 200 ];
  case Type.STELLAR:
    return [ 255, 255, 255 ];
  default:
    return [ 0, 0, 0 ];
  }
}
