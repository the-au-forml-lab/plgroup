---
title: "PL Reading Group Blog"
layout: page
---

{% for post in site.posts %}
{% capture anchor %}{{ post.date }}-{{ post.title }}{% endcapture %}
<h1 id="{{ anchor | escape }}">{{ post.title }}</h1>
<p class="date">{{ post.date | date: "%B %d %Y" }}</p>
{{ post.excerpt }}
<a href="{{ post.url | relative_url }}" >[...read more]</a>
{% endfor %}
