# PL Reading Group

This project includes information and tooling for choosing random papers for our Programming Languages (PL) reading group.

We select papers ~randomly from following PL conferences: 
[POPL](https://popl23.sigplan.org/series/POPL), 
[PLDI](https://pldi23.sigplan.org/series/pldi), and 
[OOPSLA](https://2022.splashcon.org/series/splash), 
from their most recent year.

---

## In this Repository

- **`docs`** -- the website content, in markdown.
- **`data`** -- contains mostly generate files, for paper selection purpose.
- **`src`** -- source code for randomly choosing papers.
- **`.github/workflows`** -- github actions definitions.

The paper selection is mostly automatic, with an automatic GitHub action set to suggest the next paper. 
Repo moderators can approve or reject and rerun this suggestion.

#### Guide for editing this repository

* **Edit source conferences**

    The conference sources are in [`sources.txt`](data/sources.txt), one per line.
    Change these sources, then run `npm run update` to regenerate a dataset of papers.
    This process will take up to a few minutes, depending on the number of new papers.

* **Filter papers by specific keywords**

    "Stopwords" is a list of keywords where, if any of them appear in the paper title, that paper is not considered for selection.
    Edit this list by changing [`stopwords.txt`](data/stopwords.txt). Each line is considered a separate stopword, and paper is evaluated against each word in this list.

* **To change the website content**

    Edit files in `docs`, in markdown.