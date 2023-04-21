# Programming Languages Reading Group

![GitHub last commit](https://img.shields.io/github/last-commit/the-au-forml-lab/plgroup)
[![Choose paper](https://github.com/the-au-forml-lab/plgroup/actions/workflows/choose.yaml/badge.svg)](https://github.com/the-au-forml-lab/plgroup/actions/workflows/choose.yaml)

**This project includes information about our programming languages reading group.**

This repository contains a small website and tooling for selecting papers to read.
We select papers randomly from top programming languages conferences.

HOW IT WORKS

<p align="center">
<img width="700" alt="workflow" src='https://raw.githubusercontent.com/the-au-forml-lab/plgroup/main/.github/assets/workflow.png' />
</p>

## In this Repository

The content of this repository is organized as follows:

- **`.github/workflows`** — GitHub actions definitions.
- **`data`** — mostly generate files, for paper selection purpose.
- **`docs`** — the website content, in markdown (jekyll).
- **`src`** — source code for randomly choosing papers.

The paper selection is mostly automatic, with a scheduled GitHub action set to suggest the next paper.
Repo maintainers are asked to approve or reject this suggestion.

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

**How to filter papers by specific keywords?**

"Stopwords" is a list of keywords where, if any of them appear in the paper title, that paper is not considered for selection.
Edit this list by changing [`stopwords.txt`](data/stopwords.txt).
Each line is considered a separate stopword, and paper is evaluated against each word in this list (case-insensitive match).

**How to change the website content?**

Edit files in [`docs`](docs), in markdown. Note that in some places there are clear markers for automatically injecting text.
Do not remove these markers or make edits between these markers.
Editing anywhere else is fine.
The website theme is from [here](https://github.com/the-au-forml-lab/the-au-forml-lab.github.io), but you can override desired parts, following [Jekyll docs](https://jekyllrb.com/docs/themes/#overriding-theme-defaults).

**How to get a suggestion for next paper?**

Run the ["choose paper"](https://github.com/the-au-forml-lab/plgroup/actions) action. Look for "run workflow".
This will generate a PR with a suggestion.

**How to change the paper selection schedule**

The ["choose paper" workflow](https://github.com/the-au-forml-lab/plgroup/blob/main/.github/workflows/choose.yaml) runs on schedule.
It can be customized using [these instructions](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule).
It is also possible to pause the workflow, without code changes, from repository actions settings.
To pause the workflow change `PAPER_CHOOSE_ON` variable to `0`. To resume action set the value to `1`.

**Notes for forking**

- The repository code is generic in the sense that, by changing the conference sources, it can be made to suggest any kinds of papers (that have DOIs)
- To get the automatic actions to work properly, enable workflow permissions (in settings > action):
  1. read and write permissions,
  2. permission to create and approve pull requests.
- In repository settings, Add actions environment variable named `PAPER_CHOOSE_ON`, with binary value `0` (off) or `1` (on).
- There is also a slack/discord integration, which requires a repository secret for "incoming webhook" URL. Otherwise, disable the notification workflow.
