#!/bin/bash
set -e # Stop executing when a command returns a non-0 exit code
set -x

# Install homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
brew doctor
# Install brew cask
brew install cask
brew doctor
brew tap buo/cask-upgrade

# Install git
brew install git

# Git config?

echo "First, whats your full name (used for git commits)?"
read name
echo "It's nice to meet you $name, my name is super-awesome-script, what is your github email?"
read email

ssh-keygen -o -t rsa -b 4096 -C "$email"
echo
echo "https://github.com/settings/ssh"
read -p "Press [Enter] key when you have opened the above link..."
echo
cat ~/.ssh/id_rsa.pub
echo
echo "The sshkey is shown above"
git config --global user.name "$name"
git config --global user.email "$email"
git config --global core.editor vim


# Clone setup repository
cd ~
git clone git@github.com:davidoort/setup.git

# Update shell to handle asdf
echo -e '\n. $HOME/.asdf/asdf.sh' >> ~/.bashrc
echo -e '\n. $HOME/.asdf/completions/asdf.bash' >> ~/.bashrc

# Do a similar menu layout as in the autonomy install scripts