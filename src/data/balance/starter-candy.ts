const starterCandyCosts: { passive: integer; costReduction: [integer, integer]; egg: integer; }[] = [
  { passive: 40, costReduction: [25, 60], egg: 30 }, // 1 Cost
  { passive: 40, costReduction: [25, 60], egg: 30 }, // 2 Cost
  { passive: 35, costReduction: [20, 50], egg: 25 }, // 3 Cost
  { passive: 30, costReduction: [15, 40], egg: 20 }, // 4 Cost
  { passive: 25, costReduction: [12, 35], egg: 18 }, // 5 Cost
  { passive: 20, costReduction: [10, 30], egg: 15 }, // 6 Cost
  { passive: 15, costReduction: [8, 20], egg: 12 }, // 7 Cost
  { passive: 10, costReduction: [5, 15], egg: 10 }, // 8 Cost
  { passive: 10, costReduction: [5, 15], egg: 10 }, // 9 Cost
  { passive: 10, costReduction: [5, 15], egg: 10 }, // 10 Cost
];
export function getPassiveCandyCount(baseValue: integer): integer {
  return starterCandyCosts[baseValue - 1].passive;
}
export function getValueReductionCandyCounts(baseValue: integer): [integer, integer] {
  return starterCandyCosts[baseValue - 1].costReduction;
}
export function getSameSpeciesEggCandyCounts(baseValue: integer): integer {
  return starterCandyCosts[baseValue - 1].egg;
}
