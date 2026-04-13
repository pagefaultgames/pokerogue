import { relative } from "node:path";
import { parseStacktrace } from "@vitest/utils/source-map";
import chalk from "chalk";
import type { UserConsoleLog } from "vitest";
import type { TestState } from "vitest/node";
import { DefaultReporter } from "vitest/reporters";

const IGNORE_STACKTRACE: boolean = true;

const F_POINTER = "❯";

// NB: If we ever want to use benchmark support, we will need to move the console log overriding to a mixin (different reporter base classes)

/**
 * Custom Vitest reporter to strip file name headers and `console.log` stack traces from logging output.
 */
export class CustomDefaultReporter extends DefaultReporter {
  public override onUserConsoleLog(log: UserConsoleLog, taskState?: TestState): void {
    // This code is more or less copied verbatim from the `vitest/reporters` bundled source code, with minor tweaks to use
    // dependencies we actually _have_ (i.e. chalk) rather than ones we don't (i.e. tinyrainbow).

    // SPDX-SnippetBegin
    // SPDX-SnippetCopyrightText: 2021 VoidZero Inc. and Vitest contributors
    // SPDX-License-Identifier: MIT

    if (!super.shouldLog(log, taskState)) {
      return;
    }

    const output = log.type === "stdout" ? this.ctx.logger.outputStream : this.ctx.logger.errorStream;

    const write = (msg: string) => output.write(msg);

    const task = log.taskId ? this.ctx.state.idMap.get(log.taskId) : undefined;

    // this is the original version of the following line:
    // write(c.gray(log.type + c.dim(` | ${headerText}\n`)) + log.content);
    write(log.content);

    if (!log.origin || IGNORE_STACKTRACE) {
      return;
    }

    // Code for stack trace, ripped directly out of Vitest source code.
    // I wish they had a helper function to do this so we didn't have to import `@vitest/utils`, but oh well...

    // browser logs don't have an extra end of line at the end like Node.js does
    if (log.browser) {
      write("\n");
    }

    const project = task ? this.ctx.getProjectByName(task.file.projectName ?? "") : this.ctx.getRootProject();

    const stack = log.browser ? (project.browser?.parseStacktrace(log.origin) ?? []) : parseStacktrace(log.origin);

    const highlight = task && stack.find(i => i.file === task.file.filepath);

    for (const frame of stack) {
      const color = frame === highlight ? chalk.cyan : chalk.gray;
      const path = relative(project.config.root, frame.file);

      const positions = [frame.method, `${path}:${chalk.dim(`${frame.line}:${frame.column}`)}`]
        .filter(Boolean)
        .join(" ");

      write(color(` ${chalk.dim(F_POINTER)} ${positions}\n`));
    }

    // SPDX-SnippetEnd
  }
}
