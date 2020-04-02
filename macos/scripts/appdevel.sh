#!/bin/bash
set -e
set -x

# VS Code
brew cask install visual-studio-code

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

# android studio to build flutter apps for android
brew cask install android-studio

# launching this app and following the Setup Wizard will install the Android SDK
open /Applications/Android\ Studio.app/

read -p $'\e[32mFollow the Setup Wizard in Android Studio (check with flutter doctor that android sdk is found) and press [ENTER]\e[0m' foo

# Accept android studio licenses (this might also download Dart SDK)
flutter doctor --android-licenses

# intel haxm to help speed up flutter rendering
brew cask install intel-haxm

# Install cocoapods and dependencies
sudo gem install cocoapods
pod setup


# Copy XCode from backup. In app store you are required to upgrade to Catalina
open https://developer.apple.com/services-account/download?path=/Developer_Tools/Xcode_11.2.1/Xcode_11.2.1.xip

read -p $'\e[32mWait for the download of the updated Xcode xip, unzip it, move xcode into /Applications and press [ENTER]\e[0m' foo

sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
# This will automatically ask for licenses
sudo xcodebuild -runFirstLaunch


# Check if everything is ready to write flutter apps!
flutter doctor -v