# change to git root if not there
cd "$(git rev-parse --show-toplevel)" || return
sed -n '2p' ./data/desc.txt