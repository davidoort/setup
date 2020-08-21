# Setup
An automated way of setting up my workstation on macOS or Ubuntu after a reinstall of the OS

## MacOS
### List of applications & files:
#### [Core](macos/scripts/install.sh)
 * Homebrew
 * Homebrew cask
#### [Desktop Apps](macos/scripts/destop_apps.sh)
 * Chrome
 * Spotify
 * Flux
 * Slack
 * iTerm2
#### [App development](macos/scripts/appdevel.sh) 
 * Flutter
 * VS Code
 * Android Studio
 * XCode
#### [Git Repositories](macos/scripts/git_repos.sh)
 * autonomy
 * flutter_playground
#### [Music Production](macos/scripts/music_production.sh)
 * Logic Pro X
#### [Config files](macos/scripts/config_files.sh)
 * .bash_profile (add exports, link to aliases)
 * .aliases
 * .inputrc


### Instructions

Power on your mac and hold the keys `Shift+alt+cmd+R`. You should see a rotating globe and you'll have to wait for about 10 minutes. When a menu pops up, select reinstall MacOS. This will install MacOS _Mavericks_. Once you are logged in, open `Safari` and go to the following [link](https://support.apple.com/es-lamr/HT210190) to download _Mojave_.

Once _Mojave_ is installed, open a terminal and run the following:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```
which will install brew and a few other basic packages.

Then, run 
```
brew install git
cd 
git clone https://github.com/davidoort/setup.git
bash setup/macos/install.sh 
```

VS Code extensions (todo: automate this):

* Flutter 

Android Studio configuration (Preferences->Plugins):

* Flutter plugin
* Dart plugin

To launch the android emulator from terminal and to grant it internet connection, do the following:

```
emulator -list-avds
emulator -avd NameOfYourDevice -dns-server 8.8.8.8
```

### Todo's
* Automate:
    * Launching apps like Logic Pro X and Android Studio after installation so that additional components can be installed. Android's SDK is actually installed when you first open Android Studio.
    * plugin installation and emulator image download.
    
Download Garmin Desktop app and Adobe XD

## Ubuntu
### List of applications & files
#### [Core](macos/scripts/install.sh)
 * Homebrew
 * Homebrew cask
#### [Desktop Apps](macos/scripts/destop_apps.sh)
 * Chrome
 * Spotify
 * Slack
 * Gitter
 * Terminator
#### [Development](macos/scripts/appdevel.sh) 
 * ROS 
 * VS Code
#### [Git Repositories](macos/scripts/git_repos.sh)
 * autonomy
 * Unreal Engine
 * FSDS
#### [Config files](macos/scripts/utils.sh)
 * .bashrc (add exports, link to aliases)
 * .aliases
 * inputrc

 ### Todo's
* Flutter stuff
* Web dev stuff

 
