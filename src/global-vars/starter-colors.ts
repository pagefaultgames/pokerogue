import type { SpeciesId } from "#enums/species-id";

export const starterColors: {
  [key: string]: [string, string];
} = {};

/**
 * Get the starter color for a given speciesId.
 * Falls back to white if no color is found for the speciesId.
 * @param speciesId - The {@linkcode SpeciesId} of the Pokémon to get the starter color for
 * @returns A tuple of the starter color
 */
export function getStarterColors(speciesId: SpeciesId): [string, string] {
  if (!starterColors[speciesId]) {
    // Default to white if no colors are found
    starterColors[speciesId] = ["#FFFFFF", "#FFFFFF"];
  }
  return starterColors[speciesId];
}
