---
title: "PL Reading Group Blog"
lead: One stop place for all PL Reading Group news and updates.
layout: page
---

<ul>
{% for post in site.posts %}
{% assign currentdate = post.date | date: "%B %Y" %}
{% if currentdate != date %}
</ul>
##### {{ currentdate }}
<ul>
{% assign date = currentdate %} 
{% endif %}
<li><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
{% endfor %}
</ul>
