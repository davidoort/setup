#!/bin/bash
set -e
set -x

# ROS

if [ -f "/etc/apt/sources.list.d/ros-latest.list" ]; then
    echo "Ros package repositories already installed. skipping."
else
    echo "Installing ROS package repositories..." $'\n'
    sudo apt-key adv --keyserver 'hkp://keyserver.ubuntu.com:80' --recv-key C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654
    sudo sh -c 'echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list'
fi

sudo apt-get update

sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  keyboard-configuration ros-melodic-desktop-full curl geographiclib-tools gfortran git libgeographic-dev \
  libpcap-dev libreadline-dev libv4l-dev nano net-tools openssh-client openssh-server python-catkin-lint python-catkin-tools \
  ros-melodic-ackermann-msgs ros-melodic-effort-controllers ros-melodic-geographic-msgs \
  ros-melodic-joy ros-melodic-mavlink ros-melodic-velocity-controllers \
  ros-melodic-velodyne ros-melodic-velodyne-description ros-melodic-velodyne-description \
  ros-melodic-velodyne-simulator ros-melodic-velodyne-simulator simplescreenrecorder stress \
  wget xserver-xorg-core xserver-xorg-input-all xserver-xorg-input-synaptics vim python-pip \
  python3-pip build-essential curl software-properties-common tar libopenblas-dev meld apt-utils tmux nmap htop \
  ros-melodic-rqt gstreamer1.0-plugins-bad gstreamer1.0-libav libraw1394-11 libavcodec57 libavformat57 \
  libswscale4 libswresample2 libavutil55 libgtkmm-2.4-1v5 libglademm-2.4-1v5 libgtkglextmm-x11-1.2-0v5 libgtkmm-2.4-dev \
  libglademm-2.4-dev libgtkglextmm-x11-1.2-dev libusb-1.0-0 ethtool libelf-dev libcanberra-gtk-module \
  x11-xserver-utils liblapack-dev libblas-dev ccache libssh2-1-dev pylint python-autopep8 python-rosdep \
  python-git python-setuptools python-termcolor python-wstool libatlas3-base xboxdrv python3-dev ros-melodic-robot-upstart \
  apt-transport-https ca-certificates gnupg ros-melodic-socketcan-bridge doxygen gnupg-agent ros-melodic-opencv-apps iputils-ping \
  ros-melodic-rqt-multiplot clang-format-8 clang-tools bison flex libxml2 libxml2-dev zlib1g-dev python-dev ros-melodic-mavros \
  can-utils libigraph0-dev nlohmann-json-dev clang-tidy clang-tools dialog python-rosinstall

sudo pip install --upgrade pip

# Python requirements

sudo pip install setuptools numpy
pip3 install numpy pandas matplotlib scipy plotly

sudo rosdep init
rosdep update
echo "source /opt/ros/melodic/setup.bash" | sudo tee -a /etc/bash.bashrc > /dev/null
# shellcheck disable=SC1090
source /opt/ros/melodic/setup.bash

# Github repositories

# Autonomy repo and submodules
cd ~
git clone git@github.com:DUT-Racing/autonomy.git
cd autonomy
git submodule update --init --recursive

echo "source ~/autonomy/devel/setup.bash || true" >> ~/.bashrc


# Unreal Engine
cd ~
# We will be compiling all kinds of C++ files and it is important that they are all compiled using the same compiler version. Therefore we will install GCC 8 and set it to use it when gcc is called.
sudo apt-get install gcc-8 g++-8 -y
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-7 700 --slave /usr/bin/g++ g++ /usr/bin/g++-7
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-8 800 --slave /usr/bin/g++ g++ /usr/bin/g++-8
git clone --depth=1 -b 4.25 git@github.com:EpicGames/UnrealEngine.git
cd UnrealEngine
./Setup.sh && ./GenerateProjectFiles.sh && make

# FSDS
git clone git@github.com:FS-Driverless/Formula-Student-Driverless-Simulator.git --recurse-submodules
cd Formula-Student-Driverless-Simulator
git lfs pull
./AirSim/setup.sh && ./AirSim/build.sh
echo "source ~/Formula-Student-Driverless-Simulator/ros/devel/setup.bash || true" >> ~/.bashrc
 


