#!/bin/bash
set -e
set -x

# .bash_profile
echo -e 'source ~/.aliases' >> ~/.bashrc

# .aliases
cp ~/setup/ubuntu/files/.aliases ~/.aliases


# .inputrc
# Incremental history searching
sudo bash -c 'cat > /home/davidoort/.inputrc << "EOF"
"\e[A": history-search-backward
"\e[B": history-search-forward
"\e[C": forward-char
"\e[D": backward-char
EOF'

# htop
sudo apt install htop

# vim
sudo apt install vim -y