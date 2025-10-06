import fs from "fs";
import path from "path";
import { normalizePath, type Plugin as VitePlugin } from "vite";
import "#app/plugins/utils-plugins";
import { isFileInsideDir, namespaceMap, objectSwap } from "#app/plugins/utils-plugins";
import { toCamelCase } from "#app/utils/strings";

const namespaceMapSwap = objectSwap(namespaceMap);

/**
 * Crawl a directory recursively for json files to return their name with camelCase format.
 * Also if file is in directory returns format "dir/fileName" format
 * @param dir - The directory to crawl
 */
function getNameSpaces(dir: string): string[] {
  const namespace: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(file, filePath, namespace);
    } else if (path.extname(file) === ".json") {
      processJsonFile(file, namespace);
    }
  }

  return namespace;
}

function processDirectory(file: string, filePath: string, namespace: string[]) {
  const subnamespace = getNameSpaces(filePath);
  for (const subNameSpace of subnamespace) {
    let ns = subNameSpace;
    if (namespaceMapSwap[file.replace(".json", "")]) {
      ns = namespaceMapSwap[file.replace(".json", "")];
    } else if (toCamelCase(file).replace(".json", "").startsWith("mysteryEncounters")) {
      ns = subNameSpace.replace(/Dialogue$/, "");
    }
    // format "directory/namespace" for namespace in folder
    namespace.push(`${toCamelCase(file).replace(".json", "")}/${ns}`);
  }
}

function processJsonFile(file: string, namespace: string[]) {
  let ns = toCamelCase(file).replace(".json", "");
  if (namespaceMapSwap[file.replace(".json", "")]) {
    ns = namespaceMapSwap[file.replace(".json", "")];
  }
  namespace.push(ns);
}

export function LocaleNamespace(): VitePlugin {
  const nsRelativePath = "./locales";
  const nsEn = nsRelativePath + "/en"; // Default namespace
  let namespaces = getNameSpaces(nsEn);
  const nsAbsolutePath = path.resolve(process.cwd(), nsRelativePath);

  return {
    name: "namespaces-i18next",
    buildStart() {
      if (process.env.NODE_ENV === "production") {
        console.log("Collect namespaces");
      }
    },
    configureServer(server) {
      const restartHandler = async (file: string, action: string) => {
        /*
         * If any JSON file in nsLocation is created/modified..
         * refresh the page to update the namespaces of i18next
         */
        if (isFileInsideDir(file, nsAbsolutePath) && file.endsWith(".json")) {
          const timestamp = new Date().toLocaleTimeString();
          const filePath = nsRelativePath.replace(/^\.\/(?=.*)/, "") + normalizePath(file.replace(nsAbsolutePath, ""));
          console.info(
            `${timestamp} \x1b[36m\x1b[1m[ns-plugin]\x1b[0m reloading page, \x1b[32m${filePath}\x1b[0m ${action}...`,
          );

          namespaces = getNameSpaces(nsEn);
          server.moduleGraph.invalidateAll();
          server.ws.send({
            type: "full-reload",
          });
        }
      };

      server.watcher
        .on("change", file => restartHandler(file, "updated"))
        .on("add", file => restartHandler(file, "added"))
        .on("unlink", file => restartHandler(file, "removed"));
    },
    transform: {
      handler(code, id) {
        if (id.endsWith("i18n.ts")) {
          return code.replace("const nsEn = [];", `const nsEn = ${JSON.stringify(namespaces)};`);
        }
        return code;
      },
    },
  };
}
