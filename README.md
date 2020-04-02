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
 <!-- * asdf -->
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

Power on your mac and hold the keys `Shift+alt+cmd+R`. You see a rotating globe and you'll have to wait for about 10 minutes. When a menu pops up, select reinstall MacOS. This will install MacOS _Mavericks_. Once you are logged in, open `Safari` and go to the following [link](https://support.apple.com/es-lamr/HT210190) to download _Mojave_.

Once _Mojave_ is installed, open a terminal and run the following:

`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"`
which will install brew and a few other basic packages.

Then, run 
```
brew install git
cd 
git clone git@github.com:davidoort/setup.git
bash setup/macos/install.sh 
```


VS Code extensions:

Android Studio configuration:






### References
* Install flutter on MacOS using brew and asdf https://dev.to/0xdonut/how-to-install-flutter-on-macos-using-homebrew-and-asdf-3loa
* Install asdf https://dev.to/0xdonut/manage-your-runtime-environments-using-asdf-and-not-nvm-or-rvm-etc-2c7c


## Ubuntu
### List of applications & files

 
