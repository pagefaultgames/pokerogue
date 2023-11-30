import { MainClient, NamedAPIResource } from 'pokenode-ts';
import { MoveTarget, Moves, allMoves } from './move';
import fs from 'vite-plugin-fs/browser';

const targetMap = {
  'specific-move': MoveTarget.ATTACKER,
  'selected-pokemon-me-first': MoveTarget.NEAR_ENEMY,
  'ally': MoveTarget.NEAR_ALLY,
  'users-field': MoveTarget.USER_SIDE,
  'user-or-ally': MoveTarget.USER_OR_NEAR_ALLY,
  'opponents-field': MoveTarget.ENEMY_SIDE,
  'user': MoveTarget.USER,
  'random-opponent': MoveTarget.RANDOM_NEAR_ENEMY,
  'all-other-pokemon': MoveTarget.ALL_NEAR_OTHERS,
  'selected-pokemon': MoveTarget.NEAR_OTHER,
  'all-opponents': MoveTarget.ALL_NEAR_ENEMIES,
  'entire-field': MoveTarget.BOTH_SIDES,
  'user-and-allies': MoveTarget.USER_AND_ALLIES,
  'all-pokemon': MoveTarget.ALL,
  'all-allies': MoveTarget.NEAR_ALLY,
  'fainting-pokemon': MoveTarget.NEAR_OTHER
};

const generationMap = {
  'generation-i': 1,
  'generation-ii': 2,
  'generation-iii': 3,
  'generation-iv': 4,
  'generation-v': 5,
  'generation-vi': 6,
  'generation-vii': 7,
  'generation-viii': 8,
  'generation-ix': 9
};

const versions = [ 'scarlet-violet', 'sword-shield', 'sun-moon' ];

export async function printPokemon() {
  const api = new MainClient();
}

export async function printMoves() {
  return;
  const replaceText = true;

  let moveContent: string = await fs.readFile('./src/data/move.ts');
  
  const api = new MainClient();

  let enumStr = `export enum Moves {\n  NONE,`;
  let moveStr = '  allMoves.push(';

  moveContent = moveContent.slice(moveContent.indexOf(moveStr));

  let moves: NamedAPIResource[] = [];
  let offset = 0;
  let movesResponse = await api.move.listMoves(offset, 2000);
  moves = moves.concat(movesResponse.results);
  while (movesResponse.next) {
    offset += movesResponse.count;
    movesResponse = await api.move.listMoves(offset, 2000);
    moves = moves.concat(movesResponse.results);
  }
  
  console.log(moves);

  for (let m of moves) {
    const move = await api.move.getMoveByName(m.name);
    const moveEnumName = move.name.toUpperCase().replace(/\_/g, '').replace(/\-/g, '_');
    enumStr += `\n  ${moveEnumName},`;
    console.log(move.name, move);

    const matchingLineIndex = moveContent.search(new RegExp(`new (?:Attack|(?:Self)?Status)Move\\\(Moves.${Moves[move.id]},`));
    let matchingLine = matchingLineIndex > -1 ? moveContent.slice(matchingLineIndex) : null;
    if (matchingLine)
      matchingLine = matchingLine.slice(0, matchingLine.search(/,(?: \/\/.*?)?(?:\r)?\n[ \t]+(?:new|\);)/));

    let moveName = move.names.find(ln => ln.language.name === 'en').name;
    [ 'N', 'P' ].every(s => {
      if (!matchingLine || matchingLine.indexOf(` (${s})`) > -1) {
        moveName += ` (${s})`;
        return false;
      }
      return true;
    });

    let flavorText: string;
    if (!matchingLine || replaceText) {
      for (let version of versions) {
        if ((flavorText = move.flavor_text_entries.find(fte => fte.language.name === 'en' && fte.version_group.name === version)?.flavor_text) || '') {
          if (flavorText.indexOf('forgotten') > -1)
            continue;
          break;
        }
      }
    } else if (matchingLine)
      flavorText = allMoves[move.id].effect;
    const moveTarget = targetMap[move.target.name];
    const moveTm = move.id < allMoves.length ? allMoves[move.id].tm : -1;
    moveStr += `\n    new ${move.damage_class.name !== 'status' ? 'Attack' : (moveTarget === MoveTarget.USER ? 'Self' : '') + 'Status'}Move(Moves.${moveEnumName}, "${moveName}", Type.${move.type.name.toUpperCase()}${move.damage_class.name !== 'status' ? `, MoveCategory.${move.damage_class.name.toUpperCase()}` : ''}${move.damage_class.name !== 'status' ? `, ${move.power || -1}` : ''}, ${move.accuracy || -1}, ${move.pp}, ${moveTm}, "${flavorText?.replace(/\n/g, '\\n').replace(/  /g, ' ').replace(/’/g, '\'') || ''}", ${move.effect_chance || -1}, ${move.priority}, ${generationMap[move.generation.name]})`;
    const expectedTarget = move.damage_class.name !== 'status' || moveTarget !== MoveTarget.USER ? MoveTarget.NEAR_OTHER : MoveTarget.USER;
    if (matchingLine && matchingLine.length > 1) {
      const newLineIndex = matchingLine.indexOf('\n');
      if (newLineIndex > -1) {
        console.log( matchingLine.slice(newLineIndex).replace(/(?:\r)?\n[ \t]+.target\(.*?\)/g, ''), newLineIndex)
        moveStr += matchingLine.slice(newLineIndex).replace(/(?:\r)?\n[ \t]+.target\(.*?\)/g, '');
      }
    }
    if (moveTarget !== expectedTarget)
      moveStr += `\n      .target(MoveTarget.${MoveTarget[moveTarget]})`;
    moveStr += ',';
  }

  enumStr += `\n};`;
  moveStr += `\n);`;

  console.log(enumStr);
  console.log(moveStr);
}