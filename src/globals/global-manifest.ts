/** A manifest used to cache various files requested from the server. */
export let globalManifest: Record<string, string> | undefined;

export function initializeManifest(manifest?: Record<string, string>): void {
  globalManifest = manifest;
}
