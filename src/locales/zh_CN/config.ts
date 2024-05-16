import { ability } from "./ability";
import { abilityTriggers } from "./ability-trigger";
import { battle } from "./battle";
import { commandUiHandler } from "./command-ui-handler";
import { fightUiHandler } from "./fight-ui-handler";
import { menu } from "./menu";
import { menuUiHandler } from "./menu-ui-handler";
import { move } from "./move";
import { pokeball } from "./pokeball";
import { pokemon } from "./pokemon";
import { pokemonStat } from "./pokemon-stat";
import { starterSelectUiHandler } from "./starter-select-ui-handler";
import { tutorial } from "./tutorial";
import { titles,trainerClasses,trainerNames } from "./trainers";
import { nature } from "./nature";
import { partyUiHandler } from "./party-ui-handler";
import { SummaryUiHandler } from "./summary-ui-handler";
import { biome } from "./biome";
import { weather } from "./weather";
import { modifierType } from "./modifier-type";
import { growth } from "./growth";


export const zhCnConfig = {
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
    nature: nature,
    titles: titles,
    trainerClasses: trainerClasses,
    trainerNames: trainerNames,
    tutorial: tutorial,
    nature: nature,
    partyUiHandler: partyUiHandler,
    summaryUiHandler: SummaryUiHandler,
    biome: biome,
    growth: growth,
    weather: weather,
    modifierType: modifierType,
}
