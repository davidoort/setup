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
#### [Fixes](ubuntu/scripts/fixes.sh)
 * Touchpad
 * Energy management
 * Brightness control
#### [Desktop Apps](ubuntu/scripts/desktop_apps.sh)
 * Chrome
 * Spotify
 * Slack
 * Gitter
 * Terminator
 * VS Code
 * *Zoom*
 * [Screen recorder](https://www.ubuntupit.com/15-best-linux-screen-recorder-and-how-to-install-those-on-ubuntu/)
#### [Robotics](ubuntu/scripts/robotics.sh)
 * ROS
 * OpenCV?
 * Repos:
    * autonomy
    * Unreal Engine
    * FSDS
#### [App development](ubuntu/scripts/appdevel.sh) 
 * Flutter & Dart
 * Android Studio & Emulator
#### [Config files](ubuntu/scripts/utils.sh)
 * .bashrc (add exports, link to aliases)
 * .aliases
 * inputrc

### Todo's
#### [Web Development?](ubuntu/scripts/webdevel.sh) 
 * Nodejs
 * ...

 
### Instructions (for Dell XPS)

Reference tutorials:
* https://medium.com/@peterpang_84917/personal-experience-of-installing-ubuntu-18-04-lts-on-xps-15-9570-3e53b6cfeefe
* https://medium.com/@tylergwlum/my-journey-installing-ubuntu-18-04-on-the-dell-xps-15-7590-2019-756f738a6447

*Note: many of the steps in these tutorials were skipped*. Below I summarize the process by focusing on the crucial steps.

**This tutorial assumes you already have a partition for Ubuntu and a bootable USB with an Ubuntu 18.04 image on it.** My computer was connected to the internet via an ethernet during the installation process.

Insert this USB into your laptop and reboot. When you see the Dell logo, press F2 (or F10/F12) to enter BIOS. Secure boot should be disabled, SATA drives should be using AHCI and the boot order should start with the USB device. After leaving BIOS, you should go to GRUB. Without doing anything, after a few seconds you will boot into a test version of Ubuntu, where you can click on the desk icon "Install Ubuntu 18.04". 

Personally I used a normal installation (not sure if it is required vs the minimal installation). Installing 3rd party software such as Wifi drivers, etc is **highly recommended**. Once the installation completes, press restart, eject your USB and hold the power button to shutdown the computer. 

Next, switch on the laptop (you should be taken to GRUB) and boot with *Ubuntu*. Once you see the Ubuntu desktop, search for Ubuntu’s “Software & Updates”. All you need to do is to select “Using NVIDIA driver … (proprietary, tested)” in the “Additional drivers” tab and press “Apply changes”. After **restarting**, you can test if the driver is installed correctly by typing `nvidia-smi` in the terminal after reboot. It should show you the GPU information. 

You should now be able to switch between the nvidia and intel graphics card by typing `sudo prime-select nvidia/intel` respectively, followed by a reboot.

Once you are in this state, it is time to start using the installation scripts in this repo.

To begin, open a terminal and run the following commands:
```
sudo apt-get install git 
git clone https://github.com/davidoort/setup.git
bash setup/ubuntu/install.sh
```

TODO: add instructions on how to do the dual boot for ubuntu 20 (with the approach of allocating 20GB of memory to /, 2xRAM to swap partition and the rest to /home/)
add this to fixes:
In the file /etc/xdg/autostart/org.gnome.Evolution-alarm-notify.desktop I changed the line
OnlyShowIn=GNOME;Unity;XFCE;Dawati;MATE;
to
NotShowIn=GNOME;
