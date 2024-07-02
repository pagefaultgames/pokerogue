import { Graphviz } from "@hpcc-js/wasm/graphviz";

const graphviz = await Graphviz.load();

const inputFile = [];
for await (const chunk of process.stdin) {
  inputFile.push(chunk);
}

const file = Buffer.concat(inputFile).toString("utf-8");

const svg = graphviz.dot(file, "svg");
process.stdout.write(svg);