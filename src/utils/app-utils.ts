/** @returns Whether the device has a touchscreen */
export function hasTouchscreen(): boolean {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/**
 * Checks if the orientation of the scene is landscape
 * @param scene - The scene to check (Must have a `scale: Phaser.Scale.ScaleManager` property)
 * @returns Whether the game is running in landscape mode (Primary or Secondary)
 */
export function isLandscapeMode(scene: { scale: Phaser.Scale.ScaleManager }): boolean {
  const landscapeModes = [Phaser.Scale.Orientation.LANDSCAPE, Phaser.Scale.Orientation.LANDSCAPE_SECONDARY];
  return landscapeModes.includes(scene.scale.orientation);
}
