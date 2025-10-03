/*
 * SPDX-Copyright-Text: 2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * Utility functions relating to damage calculations.
 * @module
 */

import { toDmgValue } from "#utils/common";

/**
 * Calculate the adjusted damage and number of boss segments bypassed for a damage interaction
 * @param damage - The raw damage dealt.
 * @param currentHp - The target's current HP
 * @param segmentHp - The HP in each segment (total HP / number of segments)
 * @param minSegmentIndex - The minimum segment index that can be cleared; default `0` (all segments). Used for the final boss
 * @param currentSegmentIndex - The current segment index of the target; if not provided, it will be calculated from `currentHp` and `segmentHp`.
 * @returns A tuple consisting of the adjusted damage and index of the boss segment the target is in after damage is applied.
 */
export function calculateBossSegmentDamage(
  damage: number,
  currentHp: number,
  segmentHp: number,
  minSegmentIndex = 0,
  currentSegmentIndex?: number,
): [adjustedDamage: number, clearedBossSegmentIndex: number] {
  const segmentIndex = currentSegmentIndex ?? Math.ceil(currentHp / segmentHp) - 1;
  if (segmentIndex <= 0) {
    return [damage, 1];
  }

  /**
   * The HP that the current segment ends at.
   *
   * @example
   * If a Pokemon has 3 segments and 300 max HP, each segment is 100 HP.
   * In the first iteration, this would be 200 HP, as the first segment ends at 200 HP.
   */
  const segmentThreshold = segmentHp * segmentIndex;
  const roundedSegmentThreshold = Math.round(segmentThreshold);

  const remainingSegmentHp = currentHp - roundedSegmentThreshold;

  const leftoverDamage = damage - remainingSegmentHp;

  // Insufficient damage to get down to current segment HP, return original damage
  // Segment index + 1 because this segment is not considered cleared
  if (leftoverDamage < 0) {
    return [damage, segmentIndex + 1];
  }
  if (leftoverDamage === 0) {
    return [damage, segmentIndex];
  }

  // Breaking the nth segment requires dealing at least segmentHp * 2^(n-1) damage
  // and must ensure at least `segmentIndex - minSegmentIndex` segments remain
  const segmentsBypassed = Math.min(
    Math.max(Math.floor(Math.log2(leftoverDamage / segmentHp)), 0),
    segmentIndex - minSegmentIndex,
  );
  const adjustedDamage = toDmgValue(currentHp - segmentThreshold + segmentHp * segmentsBypassed);
  const clearedBossSegmentIndex = segmentIndex - segmentsBypassed;

  return [adjustedDamage, clearedBossSegmentIndex];
}
