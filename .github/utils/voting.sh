# change to git root if not there
cd "$(git rev-parse --show-toplevel)" || return
awk '{printf "%s\\n", $0}' .github/assets/voting.md