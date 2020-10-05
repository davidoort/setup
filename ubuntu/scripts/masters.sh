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

#### Add docker dependencies?