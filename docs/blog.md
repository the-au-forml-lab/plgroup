---
title: "PL Reading Group Blog"
layout: page
---

{% for post in site.posts %}
{% capture anchor %}{{ post.title | split: " " | join: "-" }}{% endcapture %}
<h2 id="{{ anchor | escape }}">{{ post.title }}</h2>
<p class="date">{{ post.date | date: "%B %d %Y" }}</p>
{{ post.excerpt }}
<a href="{{ post.url | relative_url }}" >[...read more]</a>
* * *
{% endfor %}
