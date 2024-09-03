# change to git root if not there
cd "$(git rev-parse --show-toplevel)" || return
cat ".github/assets/discord_voting_instructions.md"