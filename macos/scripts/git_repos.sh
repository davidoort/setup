#!/bin/bash
set -e
set -x
# Installer: Clone github repositories which are frequently used 
# Default: ON


cd ~

# Autonomy repo and submodules
git clone git@github.com:DUT-Racing/autonomy.git
cd autonomy
git submodule update --init --recursive

cd ~

# Flutter playground repo and submodules
git clone https://github.com/davidoort/flutter_playground
cd flutter_playground
git submodule update --init --recursive

cd ~