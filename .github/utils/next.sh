# change to git root if not there
cd "$(git rev-parse --show-toplevel)" || return
tle=$(bash .github/utils/title.sh)
mla=$(bash .github/utils/mla.sh)
# shellcheck disable=SC2028
echo "Next paper: ${tle}\n\n${mla}"
