#!/bin/bash
set -e
set -x

## Semester 1

### Duckietown


### Embedded
cd ~ 
git clone https://gitlab.ethz.ch/tec/public/teaching/lecture_es.git
cd lecture_es

#### Run the installation script, which will install TI drivers, download CCS, and download lab files to ~/Embedded_Systems
sudo sh ./setup_css.sh -y

cd ~
rm -rf lecture_es

### PAI
#### Clone the project repo
cd ~
git clone git@github.com:davidoort/PAI2020.git

#### Clone demos repo
cd ~
git clone git@gitlab.inf.ethz.ch:scuri/pai_notebooks.git

#### Install anaconda. VSCode can handle notebooks pretty well, so this might not even be necessary
wget -P /tmp https://repo.anaconda.com/archive/Anaconda3-2020.02-Linux-x86_64.sh
sha256sum /tmp/Anaconda3-2020.02-Linux-x86_64.sh
bash /tmp/Anaconda3-2020.02-Linux-x86_64.sh

#### Uninstall anaconda
# rm -rf ~/anaconda3 ~/.condarc ~/.conda ~/.continuum
# clear bashrc

#### Add docker dependencies?
