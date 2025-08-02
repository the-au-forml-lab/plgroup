---
title: "Looking for Conferences"
layout: post
excerpt_separator: <!--more-->
---

For a while now, we have been wanting to expand the paper selection pool to
include more venues than just the four SIGPLAN conferences.
I have been re-writing our codebase over the summer,
and the paper picker can now handle any conference indexed by DBLP.

With support for a variety of conferences added,
all that remains is to choose some new conferences.
Please submit conferences from which you would like to read papers by following
these steps:

<!--more-->

1.  Head to [DBLP.org](https://dblp.org).
2.  Navigate to the page of your chosen conference.
3.  Look at the URL in your browser. It should be formatted like this:

    ``` text
    https://dblp.org/db/conf/<NAME>/index.html
    ```
4.  Edit our [list of sources][sources].
    Add the `NAME` as you saw it above and the most recent year that conference
    took place.
5.  Add as many conferences as you like and submit a pull request.
6.  Done!
    
[sources]: https://github.com/the-au-forml-lab/plgroup/blob/main/data/sources.csv
