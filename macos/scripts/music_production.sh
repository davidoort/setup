#!/bin/bash
set -e
set -x

# Wait for user to connect Backup Drive
read -p $'\e[32mPress [Enter] if you have connected your Backup Drive\e[0m' firstrun

# Move Logic Pro X from Backup Drive
cp /Volumes/BackupDrive/Backups.backupdb/David’s\ MacBook\ Pro/Latest/MacOS/Applications/Logic\ Pro\ X.app /Applications/


# Launch Logic Pro X
# TODO
