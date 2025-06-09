/**
 * Module holding functions to apply move attributes.
 * Must not import anything that is not a type.
 */
import type Pokemon from "#app/field/pokemon";
import type { default as Move, MoveAttr } from "./move";
import type { ChargingMove } from "#app/@types/move-types";
import type { MoveAttrFilter, MoveAttrString } from "#app/@types/move-types";

function applyMoveAttrsInternal(
  attrFilter: MoveAttrFilter,
  user: Pokemon | null,
  target: Pokemon | null,
  move: Move,
  args: any[],
): void {
  move.attrs.filter(attr => attrFilter(attr)).forEach(attr => attr.apply(user, target, move, args));
}

function applyMoveChargeAttrsInternal(
  attrFilter: MoveAttrFilter,
  user: Pokemon | null,
  target: Pokemon | null,
  move: ChargingMove,
  args: any[],
): void {
  move.chargeAttrs.filter(attr => attrFilter(attr)).forEach(attr => attr.apply(user, target, move, args));
}

export function applyMoveAttrs(
  attrType: MoveAttrString,
  user: Pokemon | null,
  target: Pokemon | null,
  move: Move,
  ...args: any[]
): void {
  applyMoveAttrsInternal((attr: MoveAttr) => attr.is(attrType), user, target, move, args);
}

export function applyFilteredMoveAttrs(
  attrFilter: MoveAttrFilter,
  user: Pokemon,
  target: Pokemon | null,
  move: Move,
  ...args: any[]
): void {
  applyMoveAttrsInternal(attrFilter, user, target, move, args);
}

export function applyMoveChargeAttrs(
  attrType: MoveAttrString,
  user: Pokemon | null,
  target: Pokemon | null,
  move: ChargingMove,
  ...args: any[]
): void {
  applyMoveChargeAttrsInternal((attr: MoveAttr) => attr.is(attrType), user, target, move, args);
}
