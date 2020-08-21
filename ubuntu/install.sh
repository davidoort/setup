#!/bin/bash
set -e # Stop executing when a command returns a non-0 exit code
set -x # For command execution visibility

read -p $'\e[32mIs this your first time running the installation script? [y/n] \e[0m' firstrun

echo $firstrun
if [ $firstrun = 'y' ]; then

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

    read -p "Press [Enter] key when you have added the key to Github..."


    # Git lfs
    sudo apt-get install git-lfs
    git lfs install

    # curl
    sudo apt install curl -y

fi

# plot main menu with multi-choice
cmd=(whiptail --separate-output --checklist "What things do you want to install?" 22 76 16)

options=(1 "Ubuntu Fixes" off
         2 "Desktop Apps" off
	       3 "Robotics" off
         4 "Utils" off)

choices=$("${cmd[@]}" "${options[@]}" 2>&1 >/dev/tty)
clear

# execute commands based on the choice made by the user
for choice in $choices
do
    case $choice in

        1)
            printf "\e[5m\n\nFixing weird Ubuntu features on XPS\n\n\e[25m"
            bash ~/setup/ubuntu/scripts/fixes.sh
            printf "\n"
            read -p $'\e[32mThis one is done. If you are ready for the next, press [ENTER]\e[0m' foo
            printf "\n"
            ;;
        2)
            printf "\e[5m\n\nInstalling Desktop Apps\n\n\e[25m"
            bash ~/setup/ubuntu/scripts/desktop_apps.sh
            printf "\n"
            read -p $'\e[32mThis one is done. If you are ready for the next, press [ENTER]\e[0m' foo
            printf "\n"
            ;;
        3)
            printf "\e[5m\n\nSetting up Robotics environment\n\n\e[25m"
            bash ~/setup/ubuntu/scripts/robotics.sh
            printf "\n"
            read -p $'\e[32mThis one is done. If you are ready for the next, press [ENTER]\e[0m' foo
            printf "\n"
            ;;
        4)
            printf "\e[5m\n\nSetting up configuration files\n\n\e[25m"
            bash ~/setup/ubuntu/scripts/utils.sh
            printf "\n"
            read -p $'\e[32mThis one is done. If you are ready for the next, press [ENTER]\e[0m' foo
            printf "\n"
            ;;

            
        
    esac

done
