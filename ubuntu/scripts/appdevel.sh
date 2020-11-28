# #!/bin/bash
# set -e
# set -x

# Get the source code from the Flutter repo on GitHub, and change branches or tags as needed. 
{ # try
    cd ~/flutter
    git pull

} || { # catch
    cd ~
    git clone https://github.com/flutter/flutter.git -b master
    echo -e 'export PATH="$PATH:`pwd`/flutter/bin"' >> ~/.bashrc
}

export PATH="$PATH:`pwd`/flutter/bin"

sudo apt install openjdk-11-jdk
echo -e 'export JAVA_HOME=/usr/lib/jvm/java-14-openjdk-amd64/' >> ~/.bashrc

sudo snap install android-studio --classic
echo -e 'export PATH="$PATH:/snap/android-studio/"' >> ~/.bashrc
# Launch android studio so that user can go through setup wizard
# android-studio 
# This should just wait for input from user
read -p $'\e[32m Please open another terminal, run android-studio, go through the standard installation. Then open AS again and go to Tools>SDK Manager>Appearance and Behaviour> System Settings> Android SDK > SDK Tools. Check Android SDK Command-line tools and click ‘apply’ to install. Then press [ENTER] here  [ENTER]\e[0m' foo
printf "\n"

# STEP 3 — Install Android SDK Command-Line Tools
# We need this add “Android SDK Command-line Tools” to run successfully certain commands needed for flutter otherwise you will meet lot of weird errors.
# In Android Studio
# Open Tools > SDK Manager
# From the left choose, Appearance & Behavior > System Settings > Android SDK
# Select SDK Tools from the top menu
# Check Android SDK Command-line tools and click ‘apply’ to install.
# STEP 4 — Install Flutter and Dart plugin in Android Studio
# If you want to use Android Studio as you Flutter IDE, then it’s good to install Flutter and Dart plugins.
# File -> Settings
# Plugins, type “Flutter” to search the plug-in.
# Click “Install”
# Flutter and Dart (you should be asked) plugins will be installed. IDE restart is needed after that.

flutter config — android-studio-dir=/snap/android-studio
flutter doctor --android-licenses

flutter doctor -v