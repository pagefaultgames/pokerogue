/**
 * Add an external mask filter whose mask object never changes after creation.
 * The mask texture is rendered once and cached instead of being re-rendered every frame.
 * @param target - The GameObject to apply the mask to.
 * @param maskObject - The GameObject to use as the mask.
 * @param autoUpdate - (default `false`) Whether to automatically update the mask when the mask object changes.
 * @returns The Mask controller; set `needsUpdate = true` on it after changing the mask object.
 *
 * @privateRemarks
 * See https://github.com/phaserjs/phaser/issues/7306
 */
export function addMask(
  target: Phaser.GameObjects.GameObject,
  maskObject: Phaser.GameObjects.GameObject,
  autoUpdate = false,
): Phaser.Filters.Mask {
  const mask = target.enableFilters().filters!.external.addMask(maskObject);
  mask.autoUpdate = autoUpdate;
  return mask;
}
