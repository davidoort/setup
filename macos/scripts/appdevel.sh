#!/bin/bash
set -e
set -x

# VS Code
brew cask install visual-studio-code

# asdf for dart, flutter and ruby runtimes
# brew install asdf
# Update shell to handle asdf
# echo -e '\n. $HOME/.asdf/asdf.sh' >> ~/.bashrc
# echo -e '\n. $HOME/.asdf/completions/asdf.bash' >> ~/.bashrc

# android sdk for command line util sdkmanager
brew cask install android-sdk

# android studio to build flutter apps for android
brew cask install android-studio

# intel haxm to help speed up flutter rendering
brew cask install intel-haxm

# adoptopenjdk8 prebuilt java binary to make sure the above android stuff works
# brew cask install adoptopenjdk8

# Install asdf plugins for dart, flutter and ruby
# asdf plugin install dart https://github.com/patoconnor43/asdf-dart.git
# asdf plugin-add flutter
# asdf plugin install ruby https://github.com/asdf-vm/asdf-ruby.git

# Install the actual runtimes
# asdf install dart 2.7.0
# asdf install flutter 1.12.13+hotfix.9-stable 
# asdf install ruby 2.3.7

# Set the runtimes to global
# asdf global dart 2.7.0
# asdf global flutter 1.12.13+hotfix.9-stable 
# asdf global ruby 2.3.7 

# Get the source code from the Flutter repo on GitHub, and change branches or tags as needed. 
{ # try
    cd ~/flutter
    git pull

} || { # catch
    cd ~
    git clone https://github.com/flutter/flutter.git -b master
    echo -e 'export PATH="$PATH:`pwd`/flutter/bin"' >> ~/.bash_profile
}

export PATH="$PATH:`pwd`/flutter/bin"


# Install cocoapods and dependencies
sudo gem install cocoapods
pod setup

# Accept android studio licenses (this might also download Dart SDK)
flutter doctor --android-licenses


# Running the command below will display a dialog where you can either:
## Install Xcode and the command line tools
## Install the command line tools only
## Cancel the install
# xcode-select --install

# Copy XCode from backup. In app store you are required to upgrade to Catalina
# cp -Rv /Volumes/BackupDrive/Backups.backupdb/David’s\ MacBook\ Pro/Latest/MacOS/Applications/Xcode.app /Applications/
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch

# Accept xcode licenses
sudo xcodebuild -license

# Check if everything is ready to write flutter apps!
flutter doctor -v