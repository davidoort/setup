#!/bin/bash
set -e # Stop executing when a command returns a non-0 exit code
set -x # For command execution visibility

read -p $'\e[32mIs this your first time running the installation script? [y/n] \e[0m' firstrun

if [$firstrun == 'y']; then
    # Change path as recommended by brew doctor
    echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bash_profile

    # Git config

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


    # Do a similar menu layout as in the autonomy install scripts

    # Install dialog
    brew install dialog
fi

# plot main menu with multi-choice
cmd=(dialog --separate-output --checklist "What things do you want to install?" 22 76 16)

options=(1 "Desktop Apps" off
         2 "Github repositories" off
	       3 "App development suite" off
         4 "Configuration files" off
	       5 "Music Production" off)

choices=$("${cmd[@]}" "${options[@]}" 2>&1 >/dev/tty)
clear

# execute commands based on the choice made by the user
for choice in $choices
do
    case $choice in

        1)
            printf "\e[5m\n\nInstalling Desktop Apps\n\n\e[25m"
            bash ~/setup/macos/scripts/desktop_apps.sh
            printf "\n"
            read -p $'\e[32mThis one is done. If you are ready for the next, press [ENTER]\e[0m' foo
            printf "\n"
            ;;
        2)
            printf "\e[5m\n\nCloning your favourite Github repositories\n\n\e[25m"
            bash ~/setup/macos/scripts/git_repos.sh
            printf "\n"
            read -p $'\e[32mThis one is done. If you are ready for the next, press [ENTER]\e[0m' foo
            printf "\n"
            ;;
        3)
            printf "\e[5m\n\nGetting the Flutter App Dev Suite ready\n\n\e[25m"
            bash ~/setup/macos/scripts/appdevel.sh
            printf "\n"
            read -p $'\e[32mThis one is done. If you are ready for the next, press [ENTER]\e[0m' foo
            printf "\n"
            ;;
	      4)
            printf "\e[5m\n\nSetting up configuration files\n\n\e[25m"
            bash ~/setup/macos/scripts/utils.sh
            printf "\n"
            read -p $'\e[32mThis one is done. If you are ready for the next, press [ENTER]\e[0m' foo
            printf "\n"
            ;;
	      5)
            printf "\e[5m\n\nInstalling Logic Pro X\n\n\e[25m"
            bash ~/setup/macos/scripts/music_production.sh
            printf "\n"
            read -p $'\e[32mThis one is done. If you are ready for the next, press [ENTER]\e[0m' foo
            printf "\n"
            ;;
        
    esac

done
