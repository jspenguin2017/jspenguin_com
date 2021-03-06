# jspenguin.com

This is the old server code for `https://jspenguin.com/`, without private data. 

The new server code is proprietary. 

Please open an issue if there is something you want me to know. 

*Note 1*: I noticed that this server code is vulnerable to timing attack, I will not fix it as it is no longer in use. My new server code is not vulnerable. 

*Note 2*: I no longer control the `jspenguin.com` domain. 

## Server Setup

Here is a sample setup guide for Raspberry Pi 3 server from a Windows 10 device, steps for other systems would be similar. 

### Prepare the Windows 10 device

1. Download and extract [Raspbian Jessie Lite image](https://www.raspberrypi.org/downloads/raspbian/). 
2. Download and install [Win32 Disk Imager](https://sourceforge.net/projects/win32diskimager/). 
3. In `Control Panel -> Programs and Features -> Turn Windows features on or off`, check `Windows Subsystem for Linux`. 
4. In `Settings -> Update & security -> For developers`, choose `Developer mode`. 
5. Restart Windows 10, open Command Prompt, run `bash`, then complete the installation of Bash on Ubuntu on Windows. 
6. Start Bash on Ubuntu on Windows, then run `sudo apt update && sudo apt upgrade`. 

### Install Raspbian Jessie Lite

1. Write Raspbian Jessie Lite image onto a Micro SD card using Win32 Disk Imager. 
2. Create a file called `ssh` to the boot partition of the image, the content doesn't matter, it can be an empty file. 
3. Create another file called `wpa_supplicant.conf` and paste the following lines, fill in your private data as appropriate: 

```
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="YOUR WI-FI NAME"
    psk="YOUR WI-FI PASSWORD"
}
```

4. Update your router firewall settings if needed. Port 22, 80, and 443 need to be white listed. 
5. Find the internal IP address of your Raspberry Pi 3 from your router status page. 
6. Run `ssh pi@192.168.1.XXX` (put in the internal IP of your Raspberry Pi 3) in Bash on Ubuntu on Windows to connect to your 
 Raspberry Pi 3 via Secure Shell, the default password is `raspberry`. 

### Configure Raspbian Jessie Lite

1. Run `passwd pi` to change your password. 
2. Run `sudo nano /etc/dhcpcd.conf` and add these lines to the end (put in a static internal IP for your Raspberry Pi 3 
 and the internal router IP, make sure the static internal IP is not in use): 

```
interface wlan0
static ip_address=192.168.1.150/24
static routers=192.168.1.254
```

3. Run `sudo reboot`. 
4. Go into your router control pannel, and add new port forwardings, forward port 22 to a random port between 1024 and 65535, 
 then forward port 80 to 80, and 443 to 443. 
5. Connect back to your Raspberry Pi 3 like before, but using the new static IP this time. 
6. Run `sudo apt update && sudo apt upgrade`. 
7. Run `sudo raspi-config` and change these configurations as appropriate (for timezone, choose the closest city if 
 you can't find yours): 

```
Localisation Options -> Change Locale: 
  en_CA.UTF-8 UTF-8 -> en_CA.UTF-8
Localisation Options -> Change Timezone: 
  America -> Edmonton
Localisation Options -> Change Wi-fi Country: 
  CA Canada
Advanced Options: 
  Expand Filesystem
```

8. Run `sudo reboot`. 

### Install server software and configure server

1. Connect back to your Raspberry Pi 3, then run these commands: 

```
sudo apt install apache2
sudo apt install php5 libapache2-mod-php5
sudo apt install mysql-server php5-mysql
sudo service apache2 restart
sudo systemctl disable apache2
cd ~
wget https://dl.eff.org/certbot-auto
chmod 700 certbot-auto
./certbot-auto
sudo ./certbot-auto --apache --no-bootstrap
```

2. Run `sudo nano /etc/apache2/apache2.conf`, find `<Directory /var/www/>` section, change `Options Indexes FollowSymLinks` to
 `Options FollowSymLinks`. 
3. Run `sudo service apache2 restart`. 
4. Copy all files in this repository to `/var/www/html` by any convenient method, then run these commands: 

```
sudo apt install procmail
sudo cp /var/www/html/wifi-cron.sh ~/wifi-cron.sh
sudo cp /var/www/html/backup-tool.sh ~/backup-tool.sh
sudo chmod 555 ~/wifi-cron.sh
sudo chmod 555 ~/backup-tool.sh
mkdir /media/usb
```

5. Run `sudo nano /etc/crontab` and add this line to the end: 

```
*/3 *   * * *   root    /home/pi/wifi-cron.sh
```

6. Run `mysql -uroot -p`, log in, then run these queries: 

```
CREATE DATABASE `MemeEngine`;
USE `MemeEngine`;
CREATE TABLE `Memes` (
  `ID` char(32) DEFAULT NULL,
  `Keywords` mediumtext CHARACTER SET utf8,
  `isOffensive` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE DATABASE `PrivateMessage`;
USE `PrivateMessage`;
CREATE TABLE `Messages` (
  `ID` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `IP` varchar(512) DEFAULT NULL,
  `Reference` text CHARACTER SET utf8,
  `Message` mediumtext CHARACTER SET utf8
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
CREATE TABLE `LastAccess` (
  `IP` varchar(512) DEFAULT NULL UNIQUE KEY,
  `AccessTime` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

7. Create `/var/www/html/MemeEngine/Config.php` and `/var/www/html/PrivateMessage/Config.php` from their template by any 
 convenient method. 
8. Run these commands: 

```
sudo mkdir /var/www/html/MemeEngine/MemeData
sudo chown -R www-data: /var/www/html
```

### Server maintenance

1. To start Apache web server after a reboot, run `sudo systemctl start apache2`. 
2. To backup the server, plug in an USB drive (do not mount it), run `sudo ~/backup-tool.sh`, then follow instructions. 
3. To restore the server from backup, run `cp -r /media/usb/backup_XXXXXXXXXX/html/* /var/www/html/`, 
 run `mysql -uroot -p`, then run these queries (replace XXXXXXXXXX with appropriate timestamp): 

```
CREATE DATABASE `MemeEngine`;
USE `MemeEngine`;
SOURCE /media/usb/backup_XXXXXXXXXX/MemeEngine-db.sql

CREATE DATABASE `PrivateMessage`;
USE `PrivateMessage`;
SOURCE /media/usb/backup_XXXXXXXXXX/PrivateMessage-db.sql
```

4. To create an image of the server system, use Win32 Disk Imager to read the Micro SD card into an image. 
5. To restore the server system from an image, use Win32 Disk Imager to write the image back onto the Micro SD card. 
6. To update the server, download all files in this repository and paste them over `/var/www/html` by any convenient method, 
 you may need to change configuration files (`Config.php`) or mySQL tables structure depending on the update. 

### Using GNU Screen to prevent damage from accidental Secure Shell disconnection

1. Run `sudo apt install screen`. 
2. Common commands: 
    * `screen` to start a session. 
    * `exit` in a screen session to end the session. 
    * `screen -ls` to list all sessions. 
    * `screen -r` to reconnect to last session. 
    * `screen -r <ID>` to reconnect to a specific session. Use `screen -ls` to find out what is the session ID. 
