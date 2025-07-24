# Programming Languages Reading Group

![GitHub last commit](https://img.shields.io/github/last-commit/the-au-forml-lab/plgroup)
[![Test changes](https://github.com/the-au-forml-lab/plgroup/actions/workflows/test.yaml/badge.svg)](https://github.com/the-au-forml-lab/plgroup/actions/workflows/test.yaml)

The Augusta University Programming Languages Reading Group is a regular meeting
to discuss recent results in programming languages research. The intent of the
group is to learn about various ideas and generally broaden perspectives on PL
research. Each week, members vote on a selection of papers drawn at random from
top PL conferences. We gather in person weekly to discuss the selected
papers. This repository contains our website and the tooling we use to select
papers. The PL Reading Group is organized by the
[ΔΛΔ](https://augusta.presence.io/organization/delta-lambda-delta) student
organization. 

## Quick start

1.  Populate `data/sources.csv` with your favorite venues.
1.  Execute `npm run update` to fetch papers from those venues.
1.  Commit these changes to the repository.
1.  [Enable one of the workflows](#using-the-workflows) for automatic paper
    selection.

### Repository overview

| Directory               | Description                                                   |
|:------------------------|---------------------------------------------------------------|
| **`data`**              | static and auto-generated files pertaining to paper selection |
| **`docs`**              | documentation                                                 |
| **`site`**              | website content                                               |
| **`src`**               | source code for paper selection                               |
| **`.github/workflows`** | automated paper selection workflows                           |

## Available commands

Running these commands requires [Node.js](nodejs) version 22.6.0 or later with
npm.

`npm run choose`. Select a paper randomly from the dataset. This command also
updates the history and website.

`npm run details -- <DOI>`. Look up the title and citation for paper with the
given DOI. If the paper is not contained in the local dataset, retrieve its
details from the internet

`npm run set -- <DOI>`. Manually choose the next paper, bypassing random
selection and stopwords. If the paper is not contained in the local dataset, its
details are retrieved from the internet and added to the dataset. This command
also updates the history and website.

`npm run stats`. Count the number of papers from each venue in the data set and
output the satistics.

`npm run update`. Rebuild the dataset of papers according to the list of venues
`data/sources.csv`. By default the following behaviours occur:
+   The local dataset is used as a cache, so that papers which are already
    contained in it are not retrieved again. This reduced the number of API
    calls. To rebuild the dataset from scratch, execute `echo '[]' >
    data/papers.json`. To always rebuild the dataset from scratch enable
    `DATASET.MAKE.clear` in `src/config.ts`.
+   Whenever a line is removed from `data/sources.csv` its corresponding papers
    are also deleted from the dataset. In particular when the year of a
    conferene is incremented, papers from the previous year will be deleted. To
    keep old papers enable `DATASET.MAKE.additive` in `src/config.ts`.

`npm run venues`. Output the list of URLs which are generated from
`data/sources.csv` and requested from DBLP. This is mainly for debugging
purposes.

`npm install`. Install [development dependencies](#editing-the-source-code).

`npm run build`. Typecheck the code using typescript.

`npm run serve`. Initialize Jekyll for local
[website development](#website-development)

`npm run clean`. Remove unnecessary files.

## Configuration

### Selecting conferences for paper selection

The file `data/sources.csv` contains a list of conferences---one per line---from
which papers are selected. After modifying `sources.csv` you must execute `npm
run update` for the changes to take effect. The retrieved papers are stored in
the file `data/papers.json`.

Each line of `data/sources.csv` contains the **name** and **year** of a
conference separated by a comma, and with no additional whitespace. The **name**
of is such that the following URL is valid on DBLP:

``` plain
https://dblp.org/db/conf/<name>/index.html
```

You can use this to discover conferences by browsing DBLP. If checking the above
URL succeeds, but retrieval still fails, you can inspect the URLs to which the
program makes API calls by running `npm run venues` and navigating to the
returned URLs using a web browser.

### Filtering papers by keywords

Each line of the file `data/stopwords.txt` contains a keywords to exclude from
the selection process. Any paper whose title contains (case-insensitively) such
a keyword will not be suggested for reading.


### Configuration file

The file `src/config.ts` contains various settings for the runtime behavior of
the paper selection script. The effects of individual configuration options is
described in the comments of that file and also in the relevant places in this
document.

## Editing

### Editing the website

Basic edits to the website can be performed by editing the markdown files
(`*.md`) in the `site` directory. For more comprehensive edits, follow the
instructions at [website development](#website-development).

### Editing the blog

Blog posts are ordinary markdown files located in the `site/_posts` directory.
Their file names are formatted as `YYYY-MM-DD-<short title>.md`, where the
former part is the date of the blog post.  To create a new post, create an
appropriately named markdown file and insert the following header:

``` text
---
title: // title for your post
layout: post
excerpt_separator: <!--more-->
---
```

You can edit your post normally. In addition to existing as its own page, an
excerpt of your post will be added to
the [main blog page](https://the-au-forml-lab.github.io/plgroup/blog).  You may
control the cut-off location for the excerpt by inserting the snippet
`<!--more-->` into your blog post: The excerpt will extend from the top of the
page to the location of that snippet.

### Website development

The `site/` directory contains files for the PL Reading Group website.  It is
build using Jekyll and markdown. Substantial edits to the website should be
prototyped locally, which requires Ruby and Jekyll. To install dependencies and
get started with local development, follow these instructions:

1.   [Install Jekyll](https://jekyllrb.com/docs/installation)
1.   Change into the `docs/` directory.
1.   Install dependencies: execute `bundle install`
1.   Run the website locally: `bundle exec jekyll serve`
1.   You can now access the website on `localhost:4000/plgroup`.

### Source code development

To execute the source code, [Node.js](nodejs) version `22.6.0` or greater is
required. This version
added
[native typescript execution](https://nodejs.org/en/learn/typescript/run-natively)
and typescript files can be executed by running

``` bash
node --experimental-strip-types /path/to/typescript-file.ts
```

To work on development, you will need:

-   the [typescript compiler](https://www.typescriptlang.org)
-   [type declarations for nodejs](definitelyTyped)
-   (optional) the [typescript language server](typescriptLS). you can execute
    it with the command `npx tsc`

Running `npm install` will install all of the above locally in your development
directory.

[nodejs] https://nodejs.org/en/download/
[definitelyTyped] https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master
[typescriptLS] https://github.com/typescript-language-server/typescript-language-server

## Using the workflows

There are two available workflows: _ranked choice voting_ and _reviewer
approval_.  Only one workflow should be enabled during a semester/reading
period. Workflows are controlled by variables which can be managed at

_settings > secrets and variables > actions (variables)_

### Workflow scheduling

The paper-selection actions run on automated schedule.  To change the schedule,
refer to the documentation on [workflow schedules](workflow-schedules).

[workflow-schedules] https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule

### Workflow I: ranked choice voting

This workflow generates a predefined number of random paper suggestions.  Those
suggestions are then posted to a Discord channel for voting by channel members.
A corresponding PR is generated for each paper suggestion.  The vote is
concluded manually by merging the winning suggestion PR.  The remaining PRs will
be closed/discarded automatically.  The relevant GitHub actions are "Vote open"
and "Vote close".  This workflow requires Discord integration to conduct voting.

*   Set `DISCORD_WEBHOOK_URL` secret to direct to the intended discord channel.
*   Set `PAPER_VOTE_ON` variable to `1` to enable voting.
*   Set `OPTIONS` to a numerical list of options, e.g. `[1, 2, 3]` means three
    options.
*   set `OPTION_COUNT` to a the discord-string-representation of the emoji
    representing the number of options. For example, for three options the emoji
    3️⃣ is typed in discord `:three:`, so set this variable to `:three:`

### Workflow II: reviewer approval

This picks one paper at random and suggets it as the next paper.  Designated
reviewers must approve the suggetion which comes in the form of PR.  Once a
sufficient number of reviewers accept the suggestion, the PR is merged.  Closing
the PR without approval automatically generates a new suggestion.  This process
repeats until a satisfactory suggestion has been found.  The relevant GitHub
actions is "Random paper".

+   Create a branch protection rule for `main` branch, to enforce reviewer
    approval of a paper suggestion, in _settings > branches_.
    * Check "Require a pull request before merging".
    * Set "Require approvals" count to the minimum number of reviewer required
      to approve paper suggestion.
+   Set `REVIEWERS` variable to a newline-separated string of GitHub usernames.
    -   For example:
        ```
        "user1
        user2
        user3"
        ```
    -   The users must have sufficient permissions to perform PR reviews.
+   Set `PAPER_CHOOSE_ON` variable to <code>1</code> to enable automatic
    suggestions.
+   Set `AUTOMERGE_PAT` secret to a personal access token of a user with
    repository write access, to enable auto-merging approved PRs.
    -   Permission scopes for classic token: repo
    -   Permission scopes for fine-grained token: pull requests write and contents
        write.
+   (Optional) Set `DISCORD_WEBHOOK_URL` secret to a Discord channel URL to
    enable notifications.

### Initial setup for forked repositories

Complete the following steps to activate the automated actions.

+   **Enable workflow permissions** in _settings > actions > general_:
      - choose "Read and write permissions"
      - check "Allow GitHub Actions to create and approve pull requests
+   **Create environment secrets and variables**, with empty default values, in
    _settings > secrets and variables > actions_:
    -   secrets: `DISCORD_WEBHOOK_URL` and `AUTOMERGE_PAT`
    -   variables: `PAPER_CHOOSE_ON` and `PAPER_VOTE_ON` and `REVIEWERS` and
        `OPTIONS` and `OPTION_COUNT`
+   **[Configure a paper selection workflow](#paper-selection-workflow-configuration)**
    to enable automated paper suggestions.

    
