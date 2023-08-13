# PL Reading Group Website 

This directory contains documents for the PL Reading Group website.
It is build using Jekyll and markdown.

**Setup** 

You need Ruby, bundle, and various gems to run Jekyll. 
To install jekyll dependencies, run:

```
bundle install
```

To debug locally, run:

```
bundle exec jekyll serve
```


### Update semesters

First, archive the previous semester by setting appropriate values for `YEAR` and `SEM` variables, then run the command.

````shell
YEAR=2023 && SEM=fall \
&& OLD_DIR="_past_semesters/"$YEAR"_"$SEM \
&& mkdir $OLD_DIR \
&& cp index.md $OLD_DIR"/index.md" \
&& mv papers.md $OLD_DIR"/papers.md" \
&& [ ! -f awards.md ] || mv awards.md $OLD_DIR"/awards.md" \
&& echo '' > next.md \
&& touch papers.md
````

Next, edit `index.md` front-matter to match the current or upcoming semester.