```js
import { readFileSync, appendFileSync } from "node:fs";
import { connect, createDataItemSigner } from "@permaweb/aoconnect";

const { message, spawn } = connect({
  MU_URL: "https://ur-mu.randao.net/",
  CU_URL: "https://ur-cu.randao.net/",
  //GATEWAY_URL: "https://arweave.net/",
});

const wallet = JSON.parse(readFileSync("./wallet.json").toString());
async function spawnProcess() {
  try {
  const processId = await spawn({
    //module: "M7fUx6rbRI9OND91sqTi9v1Wn84AatLVm6hC54AipFQ",
    module:"URgYpPQzvxxfYQtjrIQ116bl3YBfcImo3JEnNo8Hlrk",
    //scheduler: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA",
    scheduler: "hgyPiR329mfonaqwAdqIygJPrLL8ypflUAzgUZTyYnA",
    signer: createDataItemSigner(wallet),
    tags: [
      { name: "Authority", value: "fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY" },
      { name: "Authority", value: "--TKpHlFyOR7aLqZ-uR3tqtmgQisllKaRVctMlwvPwE" },
      { name: "App-Name", value: "aos" },
      { name: "Data-Protocol", value: "ao" },
      { name: "aos-version", value: "2.0.6" },
      { name: "Name", value: "test-proc" },
      { name: "Type", value: "Process" }
    ],
  });

  console.log("Process spawned with ID:", processId);

  return processId;
}catch(error ){
console.log("error is" + error)
}
}

async function sendData(processId, tags, data) {
  const messageId = await message({
    process: processId,
    tags,
    signer: createDataItemSigner(wallet),
    data,
  });

  console.log("Message sent with ID:", messageId);

  return messageId;
}

async function main() {
  const processId = await spawnProcess();

  await sendData(
    processId,
    [
      { name: "Action", value: "Eval" },
    ],
    JSON.stringify("1+1")
  );
}

main().catch(console.error);
```