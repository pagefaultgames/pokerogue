import { calculateBossSegmentDamage } from "#utils/damage";
import { describe, expect, it } from "vitest";

describe("Unit Test - calculateBossSegmentDamage", () => {
  it("Allows multiple segments to be cleared", () => {
    // Deal 850 damage to a target with 800 max HP that has 8 segments.
    const [adjusted, clearedIndex] = calculateBossSegmentDamage(850, 800, 100);
    expect(adjusted).toEqual(300);
    expect(clearedIndex).toEqual(5);
  });

  it("returns original damage and next segment index if damage is insufficient to clear current segment", () => {
    // segmentHp = 100, currentHp = 250 (segmentIndex = 2), damage = 30
    // remainingSegmentHp = 250 - 200 = 50, leftoverDamage = 30 - 50 = -20
    const [adjusted, clearedIndex] = calculateBossSegmentDamage(30, 250, 100);
    expect(adjusted).toBe(30);
    expect(clearedIndex).toBe(3); // segmentIndex + 1
  });

  it("returns adjusted damage and decremented segment index when damage clears one segment", () => {
    // segmentHp = 100, currentHp = 250 (segmentIndex = 2), damage = 60
    // remainingSegmentHp = 50, leftoverDamage = 10
    const [adjusted, clearedIndex] = calculateBossSegmentDamage(60, 250, 100);
    expect(adjusted).toBeGreaterThanOrEqual(50); // at least remainingSegmentHp
    expect(clearedIndex).toBe(2); // segmentIndex - segmentsBypassed (0)
  });

  it("handles exact segment boundary", () => {
    // segmentHp = 100, currentHp = 200 (segmentIndex = 1), damage = 150
    // remainingSegmentHp = 200 = 100, leftoverDamage = 0
    const [adjusted, clearedIndex] = calculateBossSegmentDamage(150, 200, 100);
    expect(adjusted).toBe(100);
    expect(clearedIndex).toBe(1);
  });

  it("handles exact segment boundary for small damage", () => {
    // segmentHp = 100, currentHp = 200 (segmentIndex = 1), damage = 150
    // remainingSegmentHp = 200 = 100, leftoverDamage = 0
    const [adjusted, clearedIndex] = calculateBossSegmentDamage(50, 200, 100);
    expect(adjusted).toBe(50);
    expect(clearedIndex).toBe(2);
  });

  it("handles single segment case", () => {
    // segmentHp = 100, currentHp = 100, damage = 50
    const [adjusted, clearedIndex] = calculateBossSegmentDamage(50, 100, 100);
    expect(adjusted).toBe(50);
    expect(clearedIndex).toBe(1);
  });

  it("handles zero damage", () => {
    // segmentHp = 100, currentHp = 250, damage = 0
    const [adjusted, clearedIndex] = calculateBossSegmentDamage(0, 250, 100);
    expect(adjusted).toBe(0);
    expect(clearedIndex).toBe(3);
  });
});
