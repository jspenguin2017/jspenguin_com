# jspenguin.com

This is the server code for [https://jspenguin.com/](https://jspenguin.com/), without private data. 

*Note: Server is not up currently*

Please open an issue if there is something you want me to know. 

## Server setup: 

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

4. If your router blocks internal connections, forward port 22 of your Raspberry Pi 3 to a random port between 1024 and 65535 
 that is not in use. 
5. Find the internal IP address of your Raspberry Pi 3 from your router configuration page. 
6. Run `ssh pi@192.168.1.XXX` (put in the internal IP of your Raspberry Pi 3) in Bash on Ubuntu on Windows to connect to your 
 Raspberry Pi 3 via Secure Shell, the default password is `raspberry`. 

### Configure Raspbian Jessie Lite

1. Run `passwd pi` to change your password. 
2. Run `sudo nano /etc/dhcpcd.conf` and add these lines to the end (put in the static internal IP for your Raspberry Pi 3 
 and the internal router IP, make sure the static internal IP is not in use): 

```
interface wlan0
static ip_address=192.168.1.150/24
static routers=192.168.1.254
```

3. Run `sudo reboot`. 
4. Update port forwarding, forward port 22 to a random port like before, but using the new static internal IP,
 also forward port 80 to 80, and 443 to 443. 
5. Connect back to your Raspberry Pi 3 like before, but using the new static IP this time. 
6. Run these commands: 

```
sudo apt update
sudo apt upgrade
```

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

### Installing server software and configure server

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
~/certbot-auto
sudo ~/certbot-auto --apache --no-bootstrap
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

6. Run `mysql -uroot -p`, then run these queries: 

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

7. Create `/etc/www/html/MemeEngine/Config.php` and `/etc/www/html/PrivateMessage/Config.php` from their template by any 
 convenient method. 
8. Run these commands: 

```
sudo mkdir /etc/www/html/MemeEngine/MemeData
sudo chown -R www-data: /var/www/html
```

## Server maintenance: 

1. To start Apache web server after a reboot, run `sudo systemctl start apache2`. 
2. To backup the server, plug in an USB drive (do not mount it), then run `sudo ~/backup-tool.sh`. 
3. To restore the server from backup, run `cp -r /media/usb/backup_XXXXXXXXXX/html/* /etc/www/html/`, 
 run `mysql -uroot-p`, then run these queries (replace XXXXXXXXXX with appropriate timestamp): 

```
CREATE DATABASE `MemeEngine`;
USE `MemeEngine`;
SOURCE /media/usb/backup_XXXXXXXXXX/MemeEngine-db.sql

CREATE DATABASE `PrivateMessage`;
USE `PrivateMessage`;
SOURCE /media/usb/backup_XXXXXXXXXX/PrivateMessage-db.sql
```

4. To create an image of the server system, use Win32 Disk Imager to image the Micro SD card. 
5. To restore the server system from an image, use Win32 Disk Imager to write the image back onto the Micro SD card. 
6. To update the server, download all files in this repository and paste them over `/etc/www/html` by any convenient method, 
 you will need to recreate those `Config.php` from their templates again if the templates have changed. 
