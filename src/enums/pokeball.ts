export enum PokeballType {
  POKEBALL,
  GREAT_BALL,
  ULTRA_BALL,
  ROGUE_BALL,
  MASTER_BALL,
  // TODO: Remove - this is unused and requires using `Exclude<PokeballType, PokeballType.LUXURY_BALL>` everywhere
  LUXURY_BALL,
}
