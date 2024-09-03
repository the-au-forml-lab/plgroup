# change to git root if not there
cd "$(git rev-parse --show-toplevel)" || return

# Format abstract so it can be used in JSON+Discord post
# * remove double quotes
# * characters: remove special chars ==> allow only certain chars
abs=$(sed -n '3p' ./data/desc.txt | sed "s/\"/'/g" | sed 's/[^a-z\.,; 0-9A-Z]//g' )

# * max length: limit number of characters
mx_len=1200
if [[ ${#abs} -gt mx_len ]] ; then
  abs=$(echo "$abs" | cut -c 1-$mx_len)
  abs=${abs% *}
fi

echo "$abs"