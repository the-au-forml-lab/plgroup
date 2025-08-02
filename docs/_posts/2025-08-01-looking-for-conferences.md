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
1.  Navigate to the page of your chosen conference.
1.  Look at the URL in your browser. It should be formatted like this:

    ```
    https://dblp.org/db/conf/<NAME>/index.html
    ```
    If the URL does not look like this,
    you can [open an issue][issues] on github.
1.  Edit our [list of sources][sources].
    Add the `NAME` as you saw it in the previous step and the most recent year
    that conference took place.
1.  Add as many conferences as you like and submit a pull request.
1.  Done; Thank you!
    
[sources]: https://github.com/the-au-forml-lab/plgroup/blob/main/data/sources.csv
[issues]: https://github.com/the-au-forml-lab/plgroup/issues
