/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EGG_MOVE_LEVEL_REQUIREMENT } from "#balance/moves/moveset-generation";
import { SpeciesId } from "#enums/species-id";
import { spawn } from "node:child_process";
import net from "node:net";
import { confirm, input, number as promptNumber } from "@inquirer/prompts";
import chalk from "chalk";
import type { SamplerPayload } from "./types";

/**
 * Starts a TCP server and returns a Promise that resolves with the dataPromise and port.
 */
function spawnServer(payload: SamplerPayload): Promise<{ dataPromise: Promise<string>; port: number }> {
  const { promise: dataPromise, resolve: dataResolver } = Promise.withResolvers<string>();

  const server = net.createServer(socket => {
    socket.write(JSON.stringify(payload));
    let data = "";
    socket.on("data", chunk => {
      data += chunk.toString();
    });
    socket.on("end", () => {
      server.close();
      dataResolver(data);
    });
  });

  const { promise, resolve } = Promise.withResolvers<{ dataPromise: Promise<string>; port: number }>();
  server.listen(0, () => {
    const port = (server.address() as net.AddressInfo).port;
    resolve({ dataPromise, port });
  });

  return promise;
}

async function getDataFromChildProcess(payload: SamplerPayload): Promise<void> {
  const { dataPromise, port } = await spawnServer(payload);

  const child = spawn("pnpm", ["vitest", "-c", "scripts/gen-moveset/gen-moveset.config.ts"], {
    env: {
      ...process.env,
      COMMUNICATION_PORT: port.toString(),
    },
    stdio: ["inherit", "ignore", "ignore"],
  });

  child.on("exit", async () => {
    const data = await dataPromise;
    if (!data) {
      console.error("No data received from child process.");
      process.exit(1);
    }

    process.stdout.write(data + "\n");
  });
}

async function promptInputs(): Promise<SamplerPayload> {
  const speciesInput = await input({
    message: "Enter the species ID or name of the Pokémon to generate movesets for:",
    validate: value => {
      return SpeciesId[value.toUpperCase()] != null;
    },
  });

  let speciesName: string;
  let speciesId = Number(speciesInput) as SpeciesId;
  let wasNum = false;
  if (Number.isNaN(speciesId)) {
    speciesName = speciesInput;
    speciesId = SpeciesId[speciesInput.toUpperCase()] as SpeciesId;
  } else {
    speciesName = SpeciesId[speciesId];
    wasNum = true;
  }
  speciesName = speciesName[0].toUpperCase() + speciesName.slice(1).toLowerCase();
  if (wasNum) {
    console.log(chalk.bold(`  Selected species: ${speciesName}`));
  }

  const boss = await confirm({
    message: "Generate as boss (default yes)?",
    default: true,
  });

  const forTrainer = await confirm({
    message: "Generate as for a trainer (default yes)?",
    default: true,
  });

  const level = await promptNumber({
    message: "Enter the level of the Pokémon (default 100):",
    default: 100,
    max: 200,
    min: 3,
    required: true,
  });

  let allowEggMoves: boolean | undefined;
  if (forTrainer && level >= EGG_MOVE_LEVEL_REQUIREMENT) {
    allowEggMoves = await confirm({
      message: "Allow egg moves? (default no)?",
      default: false,
    });
  }
  const formIndex = await promptNumber({
    message: "Enter the form index to generate (if empty or invalid, will default to the base form):",
    default: 0,
    min: 0,
    required: false,
  });

  const abilityIndex = await promptNumber({
    message: "Enter an ability index to force (leave blank to not force any):",
    min: 0,
    max: 2,
    required: false,
  });

  const trials = await promptNumber({
    message: "Enter the number of movesets to generate (default 100):",
    default: 100,
    min: 1,
    required: true,
  });

  const printWeights = await confirm({
    message: "Print move weight details (default no)?",
    default: false,
  });

  return {
    speciesId,
    boss,
    level,
    trials,
    printWeights,
    forTrainer,
    abilityIndex,
    allowEggMoves,
    formIndex,
  };
}

async function main() {
  let payload: SamplerPayload;
  try {
    payload = await promptInputs();
  } catch (err: any) {
    // Suppress annoying stack trace on SIGINT
    if (err?.message.includes("User force closed the prompt with SIGINT")) {
      process.exit(130);
    }
    throw err;
  }

  await getDataFromChildProcess(payload);
}

await main();
