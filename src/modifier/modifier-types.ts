/**
 * 
 */

import type { AddPokeballModifierType, AllPokemonLevelIncrementModifierType, EvolutionItemModifierTypeGenerator, ModifierType, ModifierTypeGenerator, PokemonLevelIncrementModifierType } from "./modifier-type";

interface ModifierTypes {
    POKEBALL: () => AddPokeballModifierType;
    GREAT_BALL: () => AddPokeballModifierType;
    ULTRA_BALL: () => AddPokeballModifierType;
    ROGUE_BALL: () => AddPokeballModifierType;
    MASTER_BALL: () => AddPokeballModifierType;

    RARE_CANDY: () => PokemonLevelIncrementModifierType;
    RARER_CANDY: () => AllPokemonLevelIncrementModifierType;

    EVOLUTION_ITEM: () => EvolutionItemModifierTypeGenerator;
    RARE_EVOLUTION_ITEM: () => EvolutionItemModifierTypeGenerator;

    FORM_CHANGE_ITEM: () => 

}