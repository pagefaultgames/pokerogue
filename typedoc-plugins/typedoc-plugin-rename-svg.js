// @ts-check

import { PageKind, Renderer } from "typedoc";

/**
 * @module
 * Typedoc plugin to run post-processing on the `index.html` file and replace the coverage SVG
 * for Beta with the newly generated file for the current branch.
 */

/**
 * @param {import('typedoc').Application} app
 */
export function load(app) {
  // Don't do anything if no REF_NAME was specified (likely indicating a local docs run)
  if (!process.env.REF_NAME) {
    return;
  }
  app.renderer.on(Renderer.EVENT_END_PAGE, page => {
    if (page.pageKind === PageKind.Index && page.contents) {
      page.contents = page.contents
        // Replace the SVG to the beta documentation site with the current ref name
        .replace(
          /^<a href="(.*?)\/beta(.*?)"><img src=".*coverage.svg"/m, // formatting
          `<a href="$1/${process.env.REF_NAME}$2"><img src="coverage.svg"`,
        );
    }
  });
}
