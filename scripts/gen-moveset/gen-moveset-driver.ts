/*
 * SPDX-Copyright-Text: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SpeciesId } from "#enums/species-id";
import { spawn } from "node:child_process";
import net from "node:net";
import { confirm, input, number as promptNumber } from "@inquirer/prompts";
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
  if (Number.isNaN(speciesId)) {
    speciesName = speciesInput;
    speciesId = SpeciesId[speciesInput.toUpperCase()] as SpeciesId;
  } else {
    speciesName = SpeciesId[speciesId].toUpperCase();
  }
  speciesName = speciesName[0].toUpperCase() + speciesName.slice(1).toLowerCase();

  const boss = await confirm({
    message: `Selected species: ${speciesName}\nGenerate as boss (default yes)?`,
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
  };
}

async function main() {
  const payload = await promptInputs();
  await getDataFromChildProcess(payload);
}

await main();
