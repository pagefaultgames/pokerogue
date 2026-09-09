import type { SpeciesDataRegistry } from "#data/species-data-registry";

export let speciesDataRegistry: SpeciesDataRegistry;

export function setSpeciesDataRegistry(registry: SpeciesDataRegistry): void {
  speciesDataRegistry = registry;
}
