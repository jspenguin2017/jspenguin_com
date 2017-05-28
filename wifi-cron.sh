#!/bin/bash

# Depends on procmail
# Get lockfile, make sure we are not running 2 instances
lockfile -r 0 /tmp/wifi-cron.lock || exit 1

# Ping Google to see if Internet is working
ping -c 1 google.com > /dev/null

# Check if ping failed, if yes, restart wi-fi
if [ $? != 0 ]; then
    ifdown --force wlan0
    sleep 3
    ifup --force wlan0
fi

# Remove lockfile
rm -f /tmp/wifi-cron.lock
