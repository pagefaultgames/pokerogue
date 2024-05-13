import { ability } from "./ability";
import { abilityTriggers } from "./ability-trigger";
import { battle } from "./battle";
import { commandUiHandler } from "./command-ui-handler";
import { fightUiHandler } from "./fight-ui-handler";
import { growth } from "./growth";
import { menu } from "./menu";
import { menuUiHandler } from "./menu-ui-handler";
import { move } from "./move";
import { nature } from "./nature";
import { pokeball } from "./pokeball";
import { pokemon } from "./pokemon";
import { pokemonStat } from "./pokemon-stat";
import { starterSelectUiHandler } from "./starter-select-ui-handler";
import { tutorial } from "./tutorial";


export const enConfig = {    
    ability: ability,
    abilityTriggers: abilityTriggers,
    battle: battle,
    commandUiHandler: commandUiHandler,
    fightUiHandler: fightUiHandler,
    menuUiHandler: menuUiHandler,
    menu: menu,
    move: move,
    pokeball: pokeball,
    pokemonStat: pokemonStat,
    pokemon: pokemon,
    starterSelectUiHandler: starterSelectUiHandler,
    tutorial: tutorial,
    nature: nature,
    growth: growth
}