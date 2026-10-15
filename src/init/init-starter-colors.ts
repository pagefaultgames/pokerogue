import { starterColors } from "#data/data-lists";
import { cachedFetch } from "#utils/fetch-utils";

export async function initStarterColors(): Promise<void> {
  if (Object.keys(starterColors).length > 0) {
    // already initialized
    return;
  }

  const jsonResponse = await cachedFetch("./starter-colors.json");
  const starterColorsJSON: Record<string, [string, string]> = await jsonResponse.json();

  for (const key of Object.keys(starterColorsJSON)) {
    starterColors[key] = starterColorsJSON[key];
  }
}
