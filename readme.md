# Programming Languages Reading Group

![GitHub last commit](https://img.shields.io/github/last-commit/the-au-forml-lab/plgroup)
[![Choose paper](https://github.com/the-au-forml-lab/plgroup/actions/workflows/choose.yaml/badge.svg)](https://github.com/the-au-forml-lab/plgroup/actions/workflows/choose.yaml)

**This project includes information about our programming languages reading group.**

This repository contains a small website and tooling for selecting papers to read.
We select papers randomly from top programming languages conferences.

**HOW IT WORKS**

<p align="center">
<img width="700" alt="workflow" src='https://raw.githubusercontent.com/the-au-forml-lab/plgroup/main/.github/assets/workflow.png' />
</p>

## In this Repository

The content of this repository is organized as follows:

| Directory               | Description                                       |
|:------------------------|:--------------------------------------------------|
| **`.github/workflows`** | GitHub actions                                    |
| **`data`**              | mostly generate files for paper selection purpose |
| **`docs`**              | the website content (jekyll and markdown)         |
| **`src`**               | source code for randomly choosing papers          |

The paper selection is mostly automatic, with a scheduled GitHub action set to suggest the next paper.
Repository reviewers are asked to approve or reject this suggestion.

**Available commands**

```
npm run update  -- update paper dataset
npm run stats   -- display paper dataset statistics
npm run choose  -- choose next paper
npm run web     -- auto-update web page 
```

Running these commands requires [Node.js](https://nodejs.org/en/download/)

## Guide for editing this repository

This section describes to how to apply the most commonly expected changes.

**How to edit source conferences?**

The conference sources are in [`sources.txt`](data/sources.txt), one per line.
Change these sources, then run `npm run update` to regenerate a dataset of papers.
This process will take up to a few minutes, depending on the number of new papers.
Note, the update is additive. To remove older entries, first delete `data/papers.json`.

**How to filter papers by specific keywords?**

"Stopwords" is a list of keywords where, if any of them appear in the paper title, that paper is not considered for selection.
Edit this list by changing [`stopwords.txt`](data/stopwords.txt).
Each line is considered a separate stopword, and paper is evaluated against each word in this list (case-insensitive match).

**How to change the website content?**

Edit files in [`docs`](docs) written in markdown.
The website theme is from [here](https://github.com/the-au-forml-lab/the-au-forml-lab.github.io). 
You can override desired parts and customize the site following [Jekyll docs](https://jekyllrb.com/docs/themes/#overriding-theme-defaults).

**How to get a suggestion for next paper?**

Run the ["choose paper"](https://github.com/the-au-forml-lab/plgroup/actions) action. 
Look for "run workflow" which is available based on repository permission.
This will generate a PR with a suggestion.

**How to change the paper selection schedule**

The ["choose paper" workflow](https://github.com/the-au-forml-lab/plgroup/blob/main/.github/workflows/choose.yaml) runs on schedule.
To change the schedule, follow [these instructions](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule).
It is also possible to pause the workflow without code changes from repository settings (secrets and variables > actions > variables):

- to pause the workflow set `PAPER_CHOOSE_ON` value to `0`. 
- to resume action set `PAPER_CHOOSE_ON` value to `1`.

### Notes for forking

The repository code is generic in the sense that, by changing the conference [`sources.txt`](data/sources.txt), it can be made to suggest any kinds of papers that have DOIs.
To get the automatic actions to work properly, complete the following steps.

- Enable workflow permissions, in settings > action
  - [ ] read and write permissions
  - [ ] permission to create and approve pull requests
- Create expected environment secrets, in settings > secrets and variables > actions
  - [ ] add variable `PAPER_CHOOSE_ON` with value `0` or `1` (off or on).
  - [ ] add variable `REVIEWERS` whose value is a comma-separated list of GH usernames. The identified users will be asked to approve paper suggestion. Reviewers must have sufficient repo/org permissions (for and org, they have to be members). 
  - [ ] add secret incoming webhook URL to enable discord or slack integration (`DISCORD_WEBHOOK_URL` or `SLACK_WEBHOOK_URL`). 
    Otherwise, the notification step will be skipped during workflow runs.
