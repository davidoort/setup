#!/bin/bash
set -e
set -x

# .bash_profile
echo -e 'source ~/.aliases' >> ~/.bashrc
# export PATH="/usr/local/bin:$PATH"
# export PATH="$PATH:`pwd`/flutter/bin"
# export PATH="$PATH:`pwd`/flutter/bin/cache/dart-sdk/bin"
# export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
# export PATH=$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/tools:$PATH
# .aliases
cp ~/setup/ubuntu/files/.aliases ~/.aliases


# .inputrc
# Incremental history searching
sudo cat > /etc/inputrc << "EOF"
"\e[A": history-search-backward
"\e[B": history-search-forward
"\e[C": forward-char
"\e[D": backward-char
EOF

# htop
sudo apt install htop