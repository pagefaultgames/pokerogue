import { ability } from "./ability";
import { abilityTriggers } from "./ability-trigger";
import { battle } from "./battle";
import { biome } from "./biome";
import { commandUiHandler } from "./command-ui-handler";
import { egg } from "./egg";
import { fightUiHandler } from "./fight-ui-handler";
import { growth } from "./growth";
import { menu } from "./menu";
import { menuUiHandler } from "./menu-ui-handler";
import { modifierType } from "./modifier-type";
import { move } from "./move";
import { nature } from "./nature";
import { partyUiHandler } from "./party-ui-handler";
import { pokeball } from "./pokeball";
import { pokemon } from "./pokemon";
import { pokemonStat } from "./pokemon-stat";
import { starterSelectUiHandler } from "./starter-select-ui-handler";
import { SummaryUiHandler } from "./summary-ui-handler";
import { tutorial } from "./tutorial";
import { titles,trainerClasses,trainerNames } from "./trainers";
import { splashMessages } from "./splash-messages"
import { weather } from "./weather";


export const itConfig = {
    ability: ability,
    abilityTriggers: abilityTriggers,
    battle: battle,
    commandUiHandler: commandUiHandler,
    egg: egg,
    fightUiHandler: fightUiHandler,
    menuUiHandler: menuUiHandler,
    menu: menu,
    move: move,
    pokeball: pokeball,
    pokemonStat: pokemonStat,
    pokemon: pokemon,
    starterSelectUiHandler: starterSelectUiHandler,
    titles: titles,
    trainerClasses: trainerClasses,
    trainerNames: trainerNames,
    tutorial: tutorial,
    splashMessages: splashMessages,
    nature: nature,
    growth: growth,
    partyUiHandler: partyUiHandler,
    summaryUiHandler: SummaryUiHandler,
    biome: biome,
    weather: weather,
    modifierType: modifierType,
}
