import * as core from "@actions/core";
import * as github from "@actions/github";

const PREFIXES = ["ability", "balance", "bug", "docs", "feature", "item", "locale", "move", "other"] as const;

const LOCALES = ["es", "fr", "de", "it", "zh_CN", "zh_TW", "pt_BR", "ko"];

const validEvent = ["pull_request"];

async function run() {
  try {
    const authToken = core.getInput("github_token", { required: true });
    const eventName = github.context.eventName;
    core.info(`Event name: ${eventName}`);
    if (!validEvent.includes(eventName)) {
      core.setFailed(`Invalid event: ${eventName}`);
      return;
    }

    const client = github.getOctokit(authToken);
    // The pull request info on the context isn't up to date. When
    // the user updates the title and re-runs the workflow, it would
    // be outdated. Therefore fetch the pull request via the REST API
    // to ensure we use the current title.
    const { data: pullRequest } = await client.rest.pulls.get({
      owner: github.context.payload.pull_request!.base.user.login,
      repo: github.context.payload.pull_request!.base.repo.name,
      pull_number: github.context.payload.pull_request!.number,
    });

    const title: string = pullRequest.title;
    core.info(`Pull Request title: "${title}"`);



    const info = `
Terminology:  [bug(ui)]: Fix female trainer names
               ^   ^     ^
               |   |     |__ Subject
               |   |________ Scope
               |____________ Prefix
`;

    core.info(info.trim());

    // Check if title pass regex
    const regex = RegExp(/^\[[a-zA-Z]+(\([a-zA-Z]+\))?\]: .+/);
    if (!regex.test(title)) {
      core.setFailed(`Pull Request title "${title}" failed to match - '[Prefix(Scope)]: Subject'`);
      return;
    }

    // Check if title starts with an allowed prefix
    core.info(`Allowed prefixes: ${PREFIXES}`);
    if (!PREFIXES.some((prefix) => title.toLowerCase().startsWith(`[${prefix}`))) {
      core.setFailed(`Pull Request title "${title}" did not match any of the prefixes - ${PREFIXES}`);
      return;
    }

    // Check if title has an allowed scope
    if (title.startsWith("locale")) {
      core.info(`Allowed locale scopes: ${LOCALES}`);
      const scope = regex.exec(title);
      if (!scope || !LOCALES.includes(scope[1])) {
        core.setFailed(`Pull Request title "${title}" did not match any of the locale scope - (${LOCALES})`);
        return;
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
