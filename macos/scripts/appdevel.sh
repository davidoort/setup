#!/bin/bash
set -e
set -x

# Installer: Flutter, VS Code, Android Studio and XCode
# Default: ON

# VS Code
brew cask install visual-studio-code

# asdf for dart, flutter and ruby runtimes
# brew install asdf

# android sdk for command line util sdkmanager
brew install android-sdk

# android studio to build flutter apps for android
brew install android-studio

# intel haxm to help speed up flutter rendering
brew install haxm

# adoptopenjdk8 prebuilt java binary to make sure the above android stuff works
brew cask install adoptopenjdk8

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
cd ~
git clone https://github.com/flutter/flutter.git -b master
echo -e 'export PATH="$PATH:`pwd`/flutter/bin"' >> ~/.bash_profile

# Install cocoapods and dependencies
sudo gem install cocoapods
pod setup

# Accept android studio licenses 
flutter doctor --android-licenses


# Running the command below will display a dialog where you can either:
## Install Xcode and the command line tools
## Install the command line tools only
## Cancel the install
xcode-select --install
# sudo xcodebuild -runFirstLaunch

# Accept xcode licenses
sudo xcodebuild -license

# Check if everything is ready to write flutter apps!
flutter doctor -v