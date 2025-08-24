// @ts-check

import { PageKind, Renderer } from "typedoc";

/**
 * Typedoc plugin to run post-processing on the README.md
 */

/**
 * @param {import('typedoc').Application} app
 */
export function load(app) {
  if (!process.env.REF_NAME) {
    return;
  }
  app.renderer.on(Renderer.EVENT_END_PAGE, page => {
    if (page.pageKind === PageKind.Index && page.contents) {
      page.contents = page.contents
        // Replace links to the beta documentation site with the current ref name
        .replace(
          /href="(.*pagefaultgames.github.io\/pokerogue\/).*?"/, // formatting
          `href="$1/${process.env.REF_NAME}"`,
        )
        // Replace the link to Beta's coverage SVG with the SVG file for the branch in question.
        .replace(
          /img src=".*?coverage.svg/, // formatting
          `img src="coverage.svg"`,
        );
    }
  });
}
