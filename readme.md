# Programming Languages Reading Group

![GitHub last commit](https://img.shields.io/github/last-commit/the-au-forml-lab/plgroup)
[![Test changes](https://github.com/the-au-forml-lab/plgroup/actions/workflows/test.yaml/badge.svg)](https://github.com/the-au-forml-lab/plgroup/actions/workflows/test.yaml)
[![Maintainability](https://api.codeclimate.com/v1/badges/b10b07ed0fded196aaa2/maintainability)](https://codeclimate.com/github/the-au-forml-lab/plgroup/maintainability)

**This project includes information about and tooling for our programming languages reading group.**

Augusta University Programming Languages (PL) Reading Group is a regular meeting to discuss exciting recent results in programming languages research. 
The intent of the group is to learn about various ideas and generally broaden perspectives on PL research topics.
This repository contains a small website and tooling for selecting papers to read.
We select papers randomly from top programming languages conferences.

**PAPER SELECTION: HOW IT WORKS**

We use ranked choice voting to choose papers to read.

<p align="center">
<img width="700" alt="workflow" src='https://raw.githubusercontent.com/the-au-forml-lab/plgroup/main/.github/assets/voting.png' />
</p>

Although the selection is random, the selection pool is controlled by the initial sources.
The paper selection process is mostly automated with a scheduled GitHub action set to suggest the next paper.
The suggestions appear as pull requests. 
The paper selection is completed by merging a PR. 
After a merge, the website is updated and readers are notified of the selected paper.

## In this repository

The content of this repository is organized as follows:

| Directory               | Description                                    |
|:------------------------|:-----------------------------------------------|
| **`.github/workflows`** | GitHub actions for automation                  |
| **`data`**              | static and generated files for paper selection |
| **`docs`**              | website content                                |
| **`src`**               | source code for choosing papers                |



**Available commands**

<pre>
npm run update             : update paper dataset
npm run stats              : display paper dataset statistics
npm run choose             : choose next paper
npm run web                : auto-update web page 
npm run set -- [doi]       : manually set the next paper
npm run details -- [doi]   : print meta data about a paper
</pre>

Running these commands requires [Node.js](https://nodejs.org/en/download/).

The back-end for DOI lookups is [Crossref API](https://github.com/the-au-forml-lab/plgroup/blob/main/src/config.js#L6).

## Guide for repository editing

This section describes to how to apply the most commonly expected changes.

**How to edit source conferences?**

The conference sources are in [`sources.txt`](data/sources.txt), one per line.
Change these sources, then run `npm run update` to regenerate a dataset of papers.
This process will take up to a few minutes, depending on the number of new papers.
The update is additive. To remove older entries, first delete `data/papers.json`.

**How to filter papers by specific keywords?**

"Stopwords" is a list of keywords where, if any of them appear in the paper title, that paper is not considered for selection.
Edit this list by changing [`stopwords.txt`](data/stopwords.txt).
Each line is considered a separate stop word, and paper is evaluated against each word in this list (case-insensitive match).

**How to change the website content?**

Edit files in [`docs`](docs) written in markdown.
The website theme is from [here](https://github.com/the-au-forml-lab/the-au-forml-lab.github.io). 
You can override desired parts and customize the site following [Jekyll docs](https://jekyllrb.com/docs/themes/#overriding-theme-defaults).

**How to get a suggestion for next paper?**

Paper selection actions can be discpatched manually if needed.
Run the "random paper" action or "vote open" action in [actions](https://github.com/the-au-forml-lab/plgroup/actions). 
The option to dispatch an action is available based on repository permissions.
Running a paper-selection action will generate appropriate PRs with paper suggestions.

**How to change the paper selection schedule**

The paper-selection actions run on automated schedule.
To change the schedule, follow [these instructions](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule).

## Semester maintenance

Light maintenance is needed between semesters/reading periods to boot and shutdown the automated actions.
  
### Start of semester

1. Update semester docs

    Set values for `SEM` and `YEAR` variables to the most recently concluded semester. 
    Then, run the command to archive the corresponding semester.
    It archives the appropriate files and initializes a new semester.
    
    ````shell
    SEM=fall && YEAR=2023 \
    && DOCS=docs/ && DATA=data/ \
    && OLD_DIR=$DOCS"_past_semesters/"$YEAR"_"$SEM \
    && mkdir -p $OLD_DIR \
    && cp $DOCS"index.md" $OLD_DIR"/index.md" \
    && mv $DOCS"papers.md" $OLD_DIR"/papers.md" \
    && [ ! -f $DOCS"awards.md" ] || mv $DOCS"awards.md" $OLD_DIR"/awards.md" \
    && echo '' > $DOCS"/next.md" \
    && echo '' > $DATA"/past.txt" \
    && echo '' > $DATA"/next.txt" \
    && touch $DOCS"papers.md"
    ````
    
    Edit `docs/index.md` front-matter to describe the current or upcoming semester.

2. Turn on paper selection workflow in _settings > secrets and variables > actions_:  
   - For random paper suggestions, set `PAPER_CHOOSE_ON` value to `1`
   - For ranked choice voting, set `PAPER_VOTE_ON` value to `1`

### End of semester

1. Turn off paper selection workflows in _settings > secrets and variables > actions_:  
   Set `PAPER_CHOOSE_ON` and `PAPER_VOTE_ON` values to `0`.
2. Clear the next paper selection. You can include a custom message in the quotes: 

   ```
   echo '' > docs/next.md
   ```

## Initial setup & guidance for forking

The repository code is generic in the sense that, by changing the conference [`sources.txt`](data/sources.txt), it can be made to suggest any kinds of papers that have DOIs indexed by Crossref.
Complete the following steps to activate the automated actions.

* **Enable workflow permissions** in _settings > actions > general_:
    - choose "Read and write permissions"
    - check "Allow GitHub Actions to create and approve pull requests
* **Create environment secrets and variables**, with empty default values, in _settings > secrets and variables > actions_:
    - secrets: `DISCORD_WEBHOOK_URL` and `AUTOMERGE_PAT` 
    - variables: `PAPER_CHOOSE_ON` and `PAPER_VOTE_ON` and `REVIEWERS`
* **[Configure a paper selection workflow](#paper-selection-workflow-configuration)** to enable automated paper suggestions.

## Paper selection workflow configuration

There are two available workflows: _ranked choice voting_ and _random paper suggestion_.
One workflow should be enabled during a semester/reading period.

### Workflow I: ranked choice voting

This workflow generates 3 random paper suggestions.
Those suggestions are then posted to a Discord channel for voting by channel members.
A corresponding PR is generated for each paper suggestion.
The vote is concluded manually by merging the winning suggestion PR.
The remaining PRs will be closed/discarded automatically.
The relevant GitHub actions are "Vote open" and "Vote close".
This workflow requires Discord integration to conduct voting.

<details>
  <summary><strong>Configuration</strong></summary>
  <br/>In <i>settings > secrets and variables > actions (variables)</i>:<br/><br/>
  <ol>
    <li>Set <code>DISCORD_WEBHOOK_URL</code> secret to direct to the intended discord channel.</li>
    <li>Set <code>PAPER_VOTE_ON</code> variable to <code>1</code> to enable voting.</li>
  </ol>
</details>

<table align="center"><tr><td>
<p align="center">
<img width="600" alt="workflow" src='https://raw.githubusercontent.com/the-au-forml-lab/plgroup/main/.github/assets/voting.png' />
</p><strong>Ranked choice voting</strong> generates multiple paper suggestions and readers vote for a winner.
</td></tr></table>

### Workflow II: random paper suggestion

This workflow chooses randomly one paper suggestion. 
It creates a matching PR and designated reviewers must approve the PR.
Once a sufficient number of reviewers accept the suggestion, it will be merged.
Closing a suggestion without approval automatically generates a new suggestion.
This process repeats until a satisfactory suggestion has been found.
The relevant GitHub actions is "Random paper".

<details>
  <summary><strong>Configuration</strong></summary>
  <br/>
  Environment secrets and variables are configured in <i>settings > secrets and variables > actions</i>.<br/><br/>
  <ol>
    <li>Create a branch protection rule for <code>main</code> branch, to enforce reviewer approval of a paper suggestion, in <i>settings > branches</i>
    <ul>
        <li>Check "Require a pull request before merging".</li>
        <li>Set "Require approvals" count to the minimum number of reviewer required to approve paper suggestion.</li>
    </ul></li>
    <li>Set <code>REVIEWERS</code> variable value to a newline-separated string of GitHub usernames, for example <code>"user1 \n user2 \n user3"</code>. The users must have sufficient repository and organization permissions to perform PR reviews.</li>
    <li>Set <code>PAPER_CHOOSE_ON</code> variable to <code>1</code> to enable automatic suggestions.</li>
    <li>Set <code>AUTOMERGE_PAT</code> secret to a personal access token of a user with repository write access, to enable auto-merge of PRs approved by reviewers.</li>
    <li>(Optional) To enable notifications of paper selection, set <code>DISCORD_WEBHOOK_URL</code> secret to appropriate Discord channel URL.</li>
  </ol>
</details>

<table align="center"><tr><td>
<p align="center">
<img width="580" alt="workflow" src='https://raw.githubusercontent.com/the-au-forml-lab/plgroup/main/.github/assets/workflow.png' />
</p>
<strong>Random paper suggestion</strong> generates one paper suggestion for reviewers to approve.
</td></tr></table>

