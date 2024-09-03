# change to git root if not there
cd "$(git rev-parse --show-toplevel)" || return
tle=$(bash .github/utils/title.sh)
mla=$(bash .github/utils/mla.sh)
abs=$(bash .github/utils/abs.sh)

# construct a pull request body text
body="This paper was randomly selected as your next reading.

### ${tle}

${abs}

${mla}

**Merge this PR to apply selection.**"

body=$(echo "$body" | sed 's/[^a-z“\.,;:\/ \*\#0-9A-Z]//g')
body=${body//$'\n'/\\n}

# output to terminal
echo "$body"
