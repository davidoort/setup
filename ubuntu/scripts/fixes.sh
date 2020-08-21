#!/bin/bash
set -e
set -x

# Fix the touchpad - reboot will be required after this
sudo apt-get install xserver-xorg-input-libinput
sudo apt-get remove --purge xserver-xorg-input-synaptics

# Improve battery life - reboot will be required after this
sudo apt update
sudo apt install tlp tlp-rdw powertop
sudo tlp start
sudo powertop --auto-tune
# sudo prime-select intel will help when GPU is not needed

# Brightness
sudo apt install liblcms2-dev 
cd && git clone https://github.com/udifuchs/icc-brightness.git
cd icc-brightness
make
./icc-brightness
sudo make install

