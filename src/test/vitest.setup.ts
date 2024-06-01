import "vitest-canvas-mock";
import "#app/test/phaser.setup";
import "#app/test/fontFace.setup";

import {initAbilities} from "#app/data/ability";
import {initBiomes} from "#app/data/biomes";
import {initEggMoves} from "#app/data/egg-moves";
import {initMoves} from "#app/data/move";
import {initPokemonForms} from "#app/data/pokemon-forms";
import {initPokemonPrevolutions} from "#app/data/pokemon-evolutions";
import {initSpecies} from "#app/data/pokemon-species";
import {initStatsKeys} from "#app/ui/game-stats-ui-handler";

initStatsKeys();
initPokemonPrevolutions();
initBiomes();
initEggMoves();
initPokemonForms();
initSpecies();
initMoves();
initAbilities();
