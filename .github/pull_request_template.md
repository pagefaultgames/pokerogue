<!-- Once you have read these comments, you are free to remove them -->

<!-- Feel free to look at other PRs for examples -->

<!--
Make sure your title matches the https://www.conventionalcommits.org/en/v1.0.0/ format.
Ideally the title is less than or equal to 72 characters (GitHub cuts off commit titles longer than this length).

See https://github.com/pagefaultgames/pokerogue/blob/beta/CONTRIBUTING.md#-submitting-a-pull-request
for more information on the allowed scopes and prefixes.

Example:
fix(move): Future Sight no longer crashes
^   ^      ^
|   |      |__ Subject
|   |_________ Scope (optional)
|_____________ Prefix
-->

<!--
Make sure that this PR is not overlapping with someone else's work.
Please try to keep the PR self-contained (don't change a bunch of unrelated things).
-->

<!--
The first section is mandatory if there are user-facing changes (it will be used as the base for a changelog entry).
The second and third section are mandatory.
The screenshot/video section is mandatory if you made any visual changes (such as to UI elements).
-->

## What are the changes the user will see?
<!--
Summarize what are the changes from a user perspective on the application.
Try to keep it short in this section since this is used to generate a changelog.
-->

## Why am I making these changes?
<!--
Explain why you decided to introduce these changes.
Does it come from an issue or another PR? Link to them if possible.
Explain why you believe this can enhance user experience.
-->
<!--
If there are existing GitHub issues related to the PR that would be fixed,
you can add "Fixes #[issue number]" (e.g.: "Fixes #1234") to link an issue to your PR
so that it will automatically be closed when the PR is merged.
-->

## What are the changes from a developer perspective?
<!--
Describe the codebase changes introduced by the PR.
You can make use of a comparison between the state of the code before and after your changes.
Ex: What files have been changed? What classes/functions/variables/etc have been added or changed?
-->

## Screenshots/Videos
<!--
If you are changing anything visual (such as UI/UX), put screenshot(s) and/or video(s) showing the changes here.
Please use one or more collapsible blocks, e.g.:

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
If an item isn't valid (for example, you didn't make any locales changes)
you can cross it out using the tilde character (~), e.g.:
- ~[ ] A locales PR been created on the [locales](https://github.com/pagefaultgames/pokerogue-locales) repo~
-->
- [ ] **I'm using `beta` as my base branch**
- [ ] There is no overlap with another PR
- [ ] The PR is self-contained and cannot be split into smaller PRs
- [ ] I have provided a clear explanation of the changes
- [ ] The PR title matches the format described in [CONTRIBUTING.md](https://github.com/pagefaultgames/pokerogue/blob/beta/CONTRIBUTING.md#-submitting-a-pull-request)
- [ ] I have tested the changes manually
- [ ] The full test suite still passes (`pnpm test:silent`)
  - [ ] I have created new automated tests (`pnpm test:create`) or updated existing tests related to the PR's changes
- [ ] I have provided screenshots/videos of the changes (if applicable)
  - [ ] I have made sure that any UI change works for both the default and legacy UI themes (if applicable)

Are there any localization additions or changes? If so:
- [ ] A locales PR been created on the [locales](https://github.com/pagefaultgames/pokerogue-locales) repo
  - [ ] Link to locales PR: 
- [ ] The translation team been contacted for proofreading/translation on Discord

Does this require any changes to the assets folder? If so:
- [ ] A PR been created on the [assets](https://github.com/pagefaultgames/pokerogue-assets) repo
  - [ ] Link to assets PR: 