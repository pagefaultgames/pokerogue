import type {
  AttackMove,
  StatusMove,
  SelfStatusMove,
  ChargingAttackMove,
  ChargingSelfStatusMove,
  MoveAttrConstructorMap,
  MoveAttr,
} from "#app/data/moves/move";

export type MoveAttrFilter = (attr: MoveAttr) => boolean;

export type * from "#app/data/moves/move";

/**
 * Map of move subclass names to their respective classes.
 */
export type MoveClassMap = {
  AttackMove: typeof AttackMove;
  StatusMove: typeof StatusMove;
  SelfStatusMove: typeof SelfStatusMove;
  ChargingAttackMove: typeof ChargingAttackMove;
  ChargingSelfStatusMove: typeof ChargingSelfStatusMove;
  ChargeMove: typeof ChargingAttackMove | typeof ChargingSelfStatusMove;
};

/**
 * Union type of all move subclass names
 */
export type MoveClass = keyof MoveClassMap;

export type MoveAttrMap = {
  [K in keyof MoveAttrConstructorMap]: InstanceType<MoveAttrConstructorMap[K]>;
};

/**
 * Union type of all move attribute names as strings.
 */
export type MoveAttrString = keyof MoveAttrMap;

export type ChargingMove = ChargingAttackMove | ChargingSelfStatusMove;
