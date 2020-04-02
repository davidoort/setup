#!/bin/bash
set -e
set -x
# Installer: Must-have desktop apps such as Chrome, Flux, Slack, Spotify
# Default: ON

# Chrome
brew cask install google-chrome

# Flux
brew cask install flux

# iTerm2
brew cask install iterm2

# Slack
brew cask install slack

# Spotify
brew cask install spotify