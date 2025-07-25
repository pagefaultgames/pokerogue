import fs from "fs";
import path from "path";
import type { Plugin as VitePlugin } from "vite";

/**
 * Crawl a directory (recursively if wanted) for json files and minifies found ones.
 * @param dir the directory to crawl
 * @param recursive if true, will crawl subdirectories
 */
function applyToDir(dir: string, recursive?: boolean) {
  const files = fs.readdirSync(dir).filter(file => !/^\..*/.test(file));

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory() && recursive) {
      applyToDir(filePath, recursive); // only if recursive is true
    } else if (path.extname(file) === ".json") {
      const contents = fs.readFileSync(filePath, "utf8");
      const minifiedContent = JSON.stringify(JSON.parse(contents));

      fs.writeFileSync(filePath, minifiedContent, "utf8");
    }
  }
}

/**
 * Plugin to mnify json files in the build folder after the bundling is done.
 * @param basePath base path/es starting inside the build dir (e.g. will always start with "/dist" if dist is the build dir)
 * @param recursive if true, will crawl subdirectories
 */
export function minifyJsonPlugin(basePath: string | string[], recursive?: boolean): VitePlugin {
  let buildDir = "dist"; // Default build dir

  return {
    name: "flx-minify-json",
    apply: "build",
    configResolved(config) {
      buildDir = config.build.outDir; // Read the build output directory from Vite config
    },
    async closeBundle() {
      console.log("Minifying JSON files...");
      const basePaths = Array.isArray(basePath) ? basePath : [basePath];

      basePaths.forEach(basePath => {
        const baseDir = path.resolve(buildDir, basePath);
        if (fs.existsSync(baseDir)) {
          applyToDir(baseDir, recursive);
        } else {
          console.error(`Path ${baseDir} does not exist!`);
        }
      });
      console.log("Finished minifying JSON files!");
    },
  };
}
