# Programming Languages Reading Group

![GitHub last commit](https://img.shields.io/github/last-commit/the-au-forml-lab/plgroup)
[![Test changes](https://github.com/the-au-forml-lab/plgroup/actions/workflows/test.yaml/badge.svg)](https://github.com/the-au-forml-lab/plgroup/actions/workflows/test.yaml)

The Augusta University Programming Languages Reading Group is a regular meeting
to discuss recent results in programming languages (PL) research.
The intent of the group is to learn about various ideas and generally broaden
perspectives on PL research.
Each week, members vote on a selection of papers drawn at random from top PL
conferences.
We gather in person weekly to discuss the selected papers.
This repository contains our website and the tooling we use to select papers.
The PL Reading Group is organized by the
[ΔΛΔ](https://augusta.presence.io/organization/delta-lambda-delta)
student organization.

## Quick start

1.  [Populate](#setting-sources-for-paper-selection)
    `data/sources.csv` with your favorite venues.
1.  Execute `npm run update` to fetch papers from those venues.
1.  Commit these changes to the repository.
1.  [Enable one of the workflows](#using-the-workflows) for automatic paper
    selection.

## Everyday use

### Common commands

| Command                    | Effect                                                 |
|:---------------------------|--------------------------------------------------------|
| `npm run choose`           | [select a paper randomly][choose] from the dataset     |
| `npm run details -- <DOI>` | look up title and citation of the paper with given DOI |
| `npm run set -- <DOI>`     | [manually set the next paper][manual]                  |
| `npm run stats`            | print statistics about the dataset                     |
| `npm run update`           | [update the dataset](#updating-the-dataset)            |

[manual]: #manually-setting-the-next-paper
[choose]: #getting-a-next-paper-suggestion


### Setting sources for paper selection

The file `data/sources.csv` contains a list of conferences, one per line,
from which papers are selected.
After modifying this file you must
[update the dataset](#updating-the-dataset) for the changes to take effect.

Each line of `data/sources.csv` contains the `name` and `year` of a conference
separated by a comma, and with no additional whitespace.
The `name` is such that the following URL is valid on DBLP.
``` text
https://dblp.org/db/conf/<name>/index.html
```
You can use this to discover conferences by browsing DBLP.

**Notes.**
-   Venues other than conferences (e.g. journals) are not supported at the moment.
-   This software identifies papers by their DOI,
    so conferences that do not register DOIs for their papers are not supported.

### Filtering papers by keywords

Each line of the file `data/stopwords.txt` contains a keywords to exclude during
the selection process.
Any paper whose title contains (case-insensitively) such a keyword will not be
suggested for reading.

### Updating the dataset

To update the dataset, run `npm run update`.
This operation uses the existing dataset as a cache to minimize API calls.
If you want to rebuild the dataset from scratch, delete the file `data/papers.json`.
By default, papers from venues (and years) no longer listed in `data/sources.csv`
will be removed during the update.
This behavior may be changed by editing the `DATASET.KEEP_OLD_PAPERS`
[option](#configuration-file).

**Troubleshooting.** If calls to the DBLP API fail,
you can inspect the relevant URLs by running `npm run venues`.

### Getting the next paper suggestion

The paper selection actions run on a schedule,
but can also be triggered manually by running the
[configured workflow](#using-the-workflows) in [GitHub actions](./actions).
Doing so will generate PRs with paper suggestions.
Only those with the appropriate repository permissions may run these workflows
manually.

Both workflows invoke `npm run choose` in the background.

### Manually setting the next paper

Manually run the
[set paper](https://github.com/the-au-forml-lab/plgroup/actions/workflows/set.yaml)
workflow with the desired paper's DOI as input.
If the DOI does not correspond to any paper in the data set,
information about the paper will be retrieved from the internet
and added to the dataset.

The corresponding command is `npm run set -- <DOI>`.

### Configuration file

The file `src/config.ts` contains various settings for the runtime behavior of
the paper selection script.
The effects of individual configuration options is described in the comments of
that file.

## Semester maintenance

Light maintenance is needed between semesters/reading periods.

### Start of semester

1.  Archive the previous semester:
    Run the script to archive the most recent semester
    ``` bash
    bash archive_semester.sh <SEMESTER> <YEAR>
    ```
    For example `archive_semester.sh fall 2025`.
    This script will create a new directory in `docs/_past_semesters`,
    copy the reading group info for the past semester to that directory and
    clear the automatically generated files in `docs/`.

2.  Clear the Schedule:
    Edit the schedule (the table at the bottom of `docs/index.md`).
    Adjust dates, locations etc. as appropriate.
    Fill the description colum with a placeholder.
    By default you should use
    ``` text
    Paper <number> discussion
    ```
    If you wish to use a different placeholder,
    [customize](#configuration-file) the variable `SCHEDULE_PLACEHOLDER_RE`
    to a regular expression which matches your placeholder
    (and no other part of `index.md`).

3.  Edit `readme.md` to reflect information about the new semester.

4.  Enable one of the paper selection [workflows](#using-the-workflows).

### End of semester

Disable the configured workflow.

## Editing

### Development commands

| Command          | Effect                                                       |
|:-----------------|--------------------------------------------------------------|
| `npm install`    | Install [development dependencies](#editing-the-source-code) |
| `npm run build`  | Typecheck the source code                                    |
| `npm run serve`  | Run Jekyll for [Website development](#website-development)   |
| `npm run venues` | Print URLs for debugging DBLP requests


### Editing the source code

To execute the source code,
[Node.js][nodejs] version `22.6.0` or greater is required.
This version added
[native typescript execution](https://nodejs.org/en/learn/typescript/run-natively).

To work on the source code, you will need:

-   the [typescript compiler](https://www.typescriptlang.org)
-   [type declarations][definitelyTyped] for nodejs
-   (optional) the [typescript language server][typescriptLS]

Running `npm install` will install all of the above locally in your development
directory.

[nodejs]: https://nodejs.org/en/download/
[definitelyTyped]: https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master
[typescriptLS]: https://github.com/typescript-language-server/typescript-language-server

### Editing the website

Basic edits to the website can be performed by editing the markdown files in the
`docs` directory.
For more comprehensive edits,
follow the instructions at [website development](#website-development).

### Editing the blog

Blog posts are ordinary markdown files located in the `docs/_posts` directory.
Their file names are formatted as `YYYY-MM-DD-<short title>.md`,
where the former part is the date of the blog post.
A template for authoring new posts is provided at `docs/_posts/template.md`.

### Website development

The `docs/` directory contains files for the PL Reading Group website.
It is build using Jekyll and markdown.
Substantial edits to the website should be prototyped locally,
which requires Ruby and Jekyll.
To install dependencies and get started with local development,
follow these instructions:

1.   [Install Jekyll](https://jekyllrb.com/docs/installation)
1.   `cd docs/`.
1.   Install dependencies: `bundle install`
1.   Run the website locally: `bundle exec jekyll serve`
    _or_ `cd .. && npm run serve`
1.   Preview the website on `localhost:4000/plgroup`.

## Using the workflows

There are two available workflows:
_ranked choice voting_ and _reviewer approval_.
Only one workflow should be enabled during a semester/reading period.
Workflows are controlled by variables which can be managed at
_settings > secrets and variables > actions (variables)_

### Workflow scheduling

The paper-selection actions run on automated schedule.
To change the schedule, refer to the documentation on
[workflow schedules][workflow-schedules].

[workflow-schedules]: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule

### Workflow I: ranked choice voting

This workflow generates a predefined number of random paper suggestions.
Those suggestions are then posted to a Discord channel for voting by channel members.
A corresponding PR is generated for each paper suggestion.
The vote is concluded manually by merging the winning suggestion PR.
The remaining PRs will be closed/discarded automatically.
The relevant GitHub actions are "Vote open" and "Vote close".
This workflow requires Discord integration to conduct voting.

+   Set `DISCORD_WEBHOOK_URL` secret to direct to the intended discord channel.
+   Set `PAPER_VOTE_ON` variable to `1` to enable voting.
+   Set `OPTIONS` to a numerical list of options, e.g. `[1, 2, 3]` means three
    options.
+   Set `OPTION_COUNT` to a the discord-string-representation of the emoji
    representing the number of options.
    For example, for three options the emoji 3️⃣ is typed in discord as `:three:`,
    so set this variable to `:three:`.

### Workflow II: reviewer approval

This picks one paper at random and suggets it as the next paper.
Designated reviewers must approve the suggetion which comes in the form of PR.
Once a sufficient number of reviewers accept the suggestion, the PR is merged.
Closing the PR without approval automatically generates a new suggestion.
This process repeats until a satisfactory suggestion has been found.
The relevant GitHub actions is "Random paper".

+   Create a branch protection rule for `main` branch,
    to enforce reviewer approval of a paper suggestion, in _settings > branches_.
    -   Check "Require a pull request before merging".
    -   Set "Require approvals" count to the minimum number of reviewer required
        to approve paper suggestion.
+   Set `REVIEWERS` variable to a newline-separated string of GitHub usernames.
    -   For example: `user1 \n user2 \n user3`
    -   The users must have sufficient permissions to perform PR reviews.
+   Set `PAPER_CHOOSE_ON` variable to <code>1</code> to enable automatic
            suggestions.
+   Set `AUTOMERGE_PAT` secret to a personal access token of a user with
    repository write access, to enable auto-merging approved PRs.
    -   Permission scopes for classic token: repo
    -   Permission scopes for fine-grained token:
        pull requests write and contents write.
+   (Optional) Set `DISCORD_WEBHOOK_URL` secret to a Discord channel URL
    to enable notifications.

### Initial setup for forked repositories

Complete the following steps to activate the automated actions.

+   Enable workflow permissions in _settings > actions > general_:
    -   choose "Read and write permissions"
    -   check "Allow GitHub Actions to create and approve pull requests
+   Create environment secrets and variables
    with empty default values, in _settings > secrets and variables > actions_:
    -   secrets: `DISCORD_WEBHOOK_URL` and `AUTOMERGE_PAT`
    -   variables: `PAPER_CHOOSE_ON` and `PAPER_VOTE_ON` and `REVIEWERS` and
        `OPTIONS` and `OPTION_COUNT`
+   Configure a paper selection workflow as described above to enable
    automated paper suggestions.
