#!/bin/bash
set -e
set -x

# .bash_profile
echo -e 'bash ~/.aliases' >> ~/.bash_profile

# .aliases
## git status
echo -e 'alias gs="git status"' >> ~/.aliases


# .inputrc
# Incremental history searching
cat > ~/.inputrc << "EOF"
"\e[A": history-search-backward
"\e[B": history-search-forward
"\e[C": forward-char
"\e[D": backward-char
EOF