<!-- (Once you have read these comments, you are free to remove them) -->
<!-- Feel free to look at other PRs for examples -->
<!--
Make sure the title includes categorization (choose the one that best fits):
-  [Bug]: If the PR is primarily a bug fix
-  [Move]: If a move has new or changed functionality
-  [Ability]: If an ability has new or changed functionality
-  [Item]: For new or modified items
-  [Mystery]: For new or modified Mystery Encounters
-  [Test]: If the PR is primarily adding or modifying tests
-  [UI/UX]: If the PR is changing UI/UX elements
-  [Audio]: If the PR is adding or changing music/sfx
-  [Sprite]: If the PR is adding or changing sprites
-  [Balance]: If the PR is related to game balance
-  [Challenge]: If the PR is adding or modifying challenges
-  [Refactor]: If the PR is primarily rewriting existing code
-  [Dev]: If the PR is primarily changing something pertaining to development (lefthook hooks, linter rules, etc.)
-  [i18n]: If the PR is primarily adding/changing locale keys or key usage (may come with an associated locales PR)
-  [Docs]: If the PR is adding or modifying documentation (such as tsdocs/code comments)
-  [GitHub]: For changes to GitHub workflows/templates/etc
-  [Misc]: If no other category fits the PR
-->

<!--
Make sure that this PR is not overlapping with someone else's work
Please try to keep the PR self-contained (and small!)
-->

## What are the changes the user will see?
<!-- Summarize what are the changes from a user perspective on the application -->

## Why am I making these changes?
<!--
Explain why you decided to introduce these changes
Does it come from an issue or another PR? Please link it
Explain why you believe this can enhance user experience
-->
<!--
If there are existing GitHub issues related to the PR that would be fixed,
you can add "Fixes #[issue number]" (ie: "Fixes #1234") to link an issue to your PR
so that it will automatically be closed when the PR is merged.
-->

## What are the changes from a developer perspective?
<!--
Explicitly state what are the changes introduced by the PR
You can make use of a comparison between what was the state before and after your PR changes
Ex: What files have been changed? What classes/functions/variables/etc have been added or changed?
-->

## Screenshots/Videos
<!--
If your changes are changing anything on the user experience, please provide visual proofs of it
Please take screenshots/videos before and after your changes, to show what is brought by this PR
-->

## How to test the changes?
<!--
How can a reviewer test your changes once they check out on your branch?
Did you make use of the `src/overrides.ts` file?
Did you introduce any automated tests?
Do the reviewers need to do something special in order to test your changes?
-->

## Checklist
- [ ] **I'm using `beta` as my base branch**
- [ ] There is no overlap with another PR?
- [ ] The PR is self-contained and cannot be split into smaller PRs?
- [ ] Have I provided a clear explanation of the changes?
- [ ] Have I tested the changes manually?
- [ ] Are all unit tests still passing? (`pnpm test:silent`)
  - [ ] Have I created new automated tests (`pnpm test:create`) or updated existing tests related to the PR's changes?
- [ ] Have I provided screenshots/videos of the changes (if applicable)?
  - [ ] Have I made sure that any UI change works for both UI themes (default and legacy)?

Are there any localization additions or changes? If so:
- [ ] Has a locales PR been created on the [locales](https://github.com/pagefaultgames/pokerogue-locales) repo?
  - [ ] If so, please leave a link to it here: 
- [ ] Has the translation team been contacted for proofreading/translation?
