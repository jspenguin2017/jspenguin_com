#!/bin/bash

# Abort if there is an error
set -e

# Welcome
echo "Backup Tool Started"

# Check privilege
if (( $EUID != 0 )); then
    echo "You need to grant root privilege with sudo."
    exit
fi

# Flush file system cache
echo "Flushing file system cache..."
sync
sleep 2s

# Mount USB stick
echo "Mounting USB stick..."
mount /dev/sda /media/usb

# =====Backup Starts=====
# Create new backup folder
echo "Creating backup folder..."
DIR=/media/usb/backup_$(date +%s)
mkdir $DIR

# Copy server files
echo "Copying server files..."
cp -r /var/www/html $DIR

# Dump database
echo "Dumping database..."
echo "Enter database password when asked."
FILE=/MemeEngine-db.sql
mysqldump -uroot -p MemeEngine > $DIR$FILE
FILE=/PrivateMessage-db.sql
mysqldump -uroot -p PrivateMessage > $DIR$FILE
# =====Backup Ends=====

# Flush file system cache
echo "Flushing file system cache... "
sleep 2s
sync
sleep 5s

# Unmount USB stick
echo "Unmounting USB stick... "
umount /media/usb

# Finished
echo "Backup done"
