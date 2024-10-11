import { normalizePath, type Plugin as VitePlugin } from "vite";
import fs from "fs";
import path from "path";
import * as Utils from "../utils-plugins";

const namespaceMapSwap = Utils.objectSwap(Utils.namespaceMap);
/**
 * Crawl a directory recursively for json files to returns her name with camelCase format...
 * Also if file is in directory returns format "dir/fileName" format
 * @param dir the directory to crawl
 * @returns {string[]}
 */
function getNameSpaces(dir: string): string[] {
  const namespace: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      const subnamespace = getNameSpaces(filePath);
      for (let i = 0; i < subnamespace.length; i++) {
        let ns = subnamespace[i];
        if (namespaceMapSwap[file.replace(".json", "")]) {
          ns = namespaceMapSwap[file.replace(".json", "")];
        } else  if (Utils.kebabCaseToCamelCase(file).replace(".json", "").startsWith("mysteryEncounters")) {
          ns = subnamespace[i].replace(/Dialogue$/, "");
        }
        // format "directory/namespace" for namespace in folder
        namespace.push(`${Utils.kebabCaseToCamelCase(file).replace(".json", "")}/${ns}`);
      }
    } else if (path.extname(file) === ".json") {
      let ns = Utils.kebabCaseToCamelCase(file).replace(".json", "");
      if (namespaceMapSwap[file.replace(".json", "")]) {
        ns = namespaceMapSwap[file.replace(".json", "")];
      }
      namespace.push(ns);
    }
  }

  return namespace;
}


export function LocaleNamespace(): VitePlugin {
  const nsRelativePath = "./public/locales";
  const nsEn = `${nsRelativePath}/en`; // Default namespace
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
      const restartHandler = async (file, action: string) => {
        /**
         * If any JSON file in {@linkcode nsLocation} is created/modified..
         * refresh the page to update the namespaces of i18next
         */
        if (Utils.isFileInsideDir(file, nsAbsolutePath) && file.endsWith(".json")) {
          const timestamp = new Date().toLocaleTimeString();
          const filePath = nsRelativePath.replace(/^\.\/(?=.*)/, "") + normalizePath(file.replace(nsAbsolutePath, ""));
          console.info(`${timestamp} \x1b[36m\x1b[1m[ns-plugin]\x1b[0m reloading page, \x1b[32m${filePath}\x1b[0m ${action}...`);

          namespaces = await getNameSpaces(nsEn);
          await server.moduleGraph.invalidateAll();
          await server.ws.send({
            type: "full-reload"
          });
        }
      };

      server.watcher
        .on("change", (file) => restartHandler(file, "updated"))
        .on("add", (file) => restartHandler(file, "added"))
        .on("unlink", (file) => restartHandler(file, "removed"));
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
