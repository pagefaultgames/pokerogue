<!--
Thank you for contributing to PokéRogue!
Open-source contributions like yours are what keep this project going.

Note that these comment blocks are purely informative and can be removed once you're done reading them.
-->

<!--
Make sure your title matches the https://www.conventionalcommits.org/en/v1.0.0/ format.
Attempt to make the title no longer than 72 characters (GitHub cuts off commit titles longer than this length).

See https://github.com/pagefaultgames/pokerogue/blob/beta/CONTRIBUTING.md#-submitting-a-pull-request
for more information on the allowed scopes and prefixes.

Example:
fix(move): Future Sight no longer crashes
^   ^      ^
|   |      |__ Subject
|   |_________ Scope (optional)
|_____________ Prefix
-->


## What are the changes the user will see?
<!--
Summarize the changes from a user perspective on the application.
Try to keep this section (relatively) brief as it is used to generate changelogs.

PRs with no user-facing changes should instead write "N/A" to be ommitted from auto-generated changelogs.
-->

## Why am I making these changes?
<!--
Explain why you decided to introduce these changes.
Does it come from another issue, PR or other prior discussion? Link to them if possible.
Explain why you believe this can enhance user experience or otherwise improve the codebase.

If this PR fixes an existing GitHub issue,
you can add "Fixes #[issue number]" (e.g.: "Fixes #1234") to link the issue
so that it will automatically be closed when the PR is merged.
-->

## What are the changes from a developer perspective?
<!--
Describe the changes this PR introduces to the codebase.
You can make use of a comparison between the state of the code before and after your changes.
Ex: What files have been changed? What classes/functions/variables/etc have been added or changed?

Include enough detail to convey the changes being made and the rationale behind their implementation.
-->

## Screenshots/Videos
<!--
If you are changing anything visual (such as UI/UX), include screenshot(s) and/or video(s) showing the changes within collapsible blocks, like below:

<details><summary>Before</summary>

[before screenshot here]

</details>
<details><summary>After</summary>

[after screenshot here]

</details>
-->

## How to test the changes?
<!--
How can a reviewer test your changes once they check out on your branch?
Did you make use of the `src/overrides.ts` file?
Did you introduce any automated tests?
Do the reviewers need to do something special in order to test your changes?
-->

## Checklist
<!--
Please ensure the following requirements are all met before creating your PR.
If this is not the case, consider [marking the PR as a draft](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-stage-of-a-pull-request) until all bullets have been resolved.

If an item or category isn't valid for the particular changes being made (for example, you didn't make any locales changes)
you can strike it out with the `~` character to mark them as not applicable.
-->

- [ ] The PR is correctly formatted
  - [ ] **I'm using `beta` as my base branch**
  - [ ] **The current branch is not named `beta`, `main` or the name of another long-lived feature branch**
  - [ ] I have provided a clear explanation of the changes within the PR description
  - [ ] The PR title matches the Conventional Commits format (as described in [CONTRIBUTING.md](../CONTRIBUTING.md#pr-title-format))
- [ ] The PR is self-contained and cannot be split into smaller PRs
  - [ ] There is no overlap with another open PR
- [ ] The PR has been confirmed to work correctly
  - [ ] I have tested the changes manually
  - [ ] The full automated test suite still passes
  - [ ] I have created new automated tests (`pnpm test:create`) or updated existing tests related to the PR's changes if necessary
- [ ] I have provided screenshots/videos of the changes (if applicable)
  - [ ] I have made sure that any UI changes work for both the default and legacy UI themes (if applicable)
- [ ] **I have notified the Dev Team about this PR's existence** (such as by posting inside the current PR callout thread on Discord)

Are there any localization additions or changes? If so:
- [ ] I have created an associated PR on the [locales](https://github.com/pagefaultgames/pokerogue-locales) repository (pagefaultgames/pokerogue-locales#<PR_NUMBER_HERE>)
  - [ ] I have contacted translation team on Discord for proofreading/translation

Does this require any additions or changes to in-game assets? If so:
- [ ] I have created an associated PR on the [assets](https://github.com/pagefaultgames/pokerogue-assets) repository (pagefaultgames/pokerogue-assets#<PR_NUMBER_HERE>)