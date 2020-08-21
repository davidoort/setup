#!/bin/bash
set -e
set -x

# Chrome
if isInstalled "google-chrome-stable"; then
  echo "Skipping installation of google-chrome because it is already installed."
else
  echo "Installing Chrome Browser..."
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
  echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | sudo tee /etc/apt/sources.list.d/google-chrome.list
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y google-chrome-stable
fi

# VS Code
if isInstalled "code"; then
  echo "Skipping installation of Visual Studio Code because it is already installed."
else
  tmp
    echo "Installing Visual Studio Code..." $'\n'

    sudo touch /etc/apt/sources.list.d/vscode.list
    echo "deb [arch=amd64] http://packages.microsoft.com/repos/vscode stable main" | sudo tee /etc/apt/sources.list.d/vscode.list

    curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
    sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg

    sudo apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install code -y
  tmpExit
fi

# Terminator
if isInstalled "terminator"; then
  echo "Skipping installation of terminator because it is already installed."
else
  tmp
    echo "Installing Terminator..." $'\n'
    sudo apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install terminator -y
  tmpExit
fi

# Slack
if isInstalled "slack-desktop"; then
  echo "Skipping installation of slack-desktop because it is already installed."
else
  echo "Installing Slack..."
  tmp
    wget -q https://downloads.slack-edge.com/linux_releases/slack-desktop-4.0.2-amd64.deb
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ./slack-desktop-*.deb
  tmpExit
fi

# Spotify
if isInstalled "spotify-client"; then
  echo "Skipping installation of spotify-client because it is already installed."
else
  tmp
    echo "Installing Spotify..."
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 4773BD5E130D1D45
    echo deb http://repository.spotify.com stable non-free | sudo tee /etc/apt/sources.list.d/spotify.list
    sudo apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y spotify-client
  tmpExit
fi