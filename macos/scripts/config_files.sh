#!/bin/bash
set -e
set -x

# .bash_profile
echo -e 'source ~/.aliases' >> ~/.bash_profile
export PATH="/usr/local/bin:$PATH"
export PATH="$PATH:`pwd`/flutter/bin"
export PATH="$PATH:`pwd`/flutter/bin/cache/dart-sdk/bin"
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
export PATH=$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/tools:$PATH
# .aliases
cp ~/setup/macos/files/.aliases ~/.aliases


# .inputrc
# Incremental history searching
cat > ~/.inputrc << "EOF"
"\e[A": history-search-backward
"\e[B": history-search-forward
"\e[C": forward-char
"\e[D": backward-char
EOF
