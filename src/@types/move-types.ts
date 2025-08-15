import type { Pokemon } from "#field/pokemon";
import type {
  AttackMove,
  ChargingAttackMove,
  ChargingSelfStatusMove,
  Move,
  MoveAttr,
  MoveAttrConstructorMap,
  SelfStatusMove,
  StatusMove,
} from "#moves/move";

/**
 * A generic function producing a message during a Move's execution.
 * @param user - The {@linkcode Pokemon} using the move
 * @param target - The {@linkcode Pokemon} targeted by the move
 * @param move - The {@linkcode Move} being used
 * @returns a string
 */
export type MoveMessageFunc = (user: Pokemon, target: Pokemon, move: Move) => string;

export type MoveAttrFilter = (attr: MoveAttr) => boolean;

export type * from "#moves/move";

/**
 * Map of move subclass names to their respective classes.
 * Does not include the ChargeMove subclasses. For that, use `ChargingMoveClassMap`.
 *
 * @privateRemarks
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
