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
 * Does not include the ChargeMove subclasses. For that, use `ChargingMoveClassMap`.
 *
 * @privateremarks
 * The `never` field (`declare private _: never`) in some classes is necessary
 * to ensure typescript does not improperly narrow a failed `is` guard to `never`.
 *
 * For example, if we did not have the never, and wrote
 * ```
 * function Foo(move: Move) {
 * if (move.is("AttackMove")) {
 *
 * } else if (move.is("StatusMove")) { // typescript errors on the `is`, saying that `move` is `never`
 *
 * }
 * ```
 */
export type MoveClassMap = {
  AttackMove: AttackMove;
  StatusMove: StatusMove;
  SelfStatusMove: SelfStatusMove;
};

/**
 * Union type of all move subclass names
 */
export type MoveKindString = "AttackMove" | "StatusMove" | "SelfStatusMove";

/**
 * Map of move attribute names to attribute instances.
 */
export type MoveAttrMap = {
  [K in keyof MoveAttrConstructorMap]: InstanceType<MoveAttrConstructorMap[K]>;
};

/**
 * Union type of all move attribute names as strings.
 */
export type MoveAttrString = keyof MoveAttrMap;

export type ChargingMove = ChargingAttackMove | ChargingSelfStatusMove;
