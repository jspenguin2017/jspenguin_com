# jspenguin.com

This is the server code for [https://jspenguin.com/](https://jspenguin.com/), without private data. 

*Note: Server is not up currently*

Please open an issue if there is something you want me to know. 

## Server setup: 

Here is a sample setup guide for Raspberry Pi 3 from a Windows 10 host, steps for other systems would be similar. 

### Prepare Windows 10 host

1. Download [Raspbian Jessie Lite](https://www.raspberrypi.org/downloads/raspbian/). 
2. Download and install [Win32 Disk Imager](https://sourceforge.net/projects/win32diskimager/). 
3. In `Control Panel -> Programs and Features -> Turn Windows features on or off`, check `Windows Subsystem for Linux`. 
4. In `Settings -> Update & security -> For developers`, choose `Developer mode`. 
5. Restart Windows 10, open Command Prompt, run `bash`, then complete installation. 
6. Start Bash on Ubuntu on Windows, and execute these lines as root: 

```
apt update
apt upgrade
```

### Install Raspbian Jessie Lite

1. Write Raspbian Jessie Lite onto an Micro SD card using Win32 Disk Imager. 
2. Create an empty file called `ssh` to the boot partition of the image. 
3. Create a file called `wpa_supplicant.conf` and enter the following data, fill in your private data as appropriate: 

```
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="YOUR WI-FI SSID"
    psk="YOUR WI-FI PASSWORD"
}
```

4. If your router blocks internal connections, forward port 22 of Raspberry Pi 3 to a random port between 1024 and 65535. 
5. Find the internal IP address of Raspberry Pi 3, then run `ssh pi@192.168.1.150` (replace the IP with yours) in Bash on 
Ubuntu on Windows to connect to Raspberry Pi 3 via Secure Shell, the default password is `raspberry`. 

### Configure Raspbian Jessie Lite

1. Run `sudo passwd pi` and enter a new password. 
2. Run `sudo nano /etc/dhcpcd.conf` and add these to the end (put in the static IP you want, and put in the IP of your router): 

```
interface wlan0
static ip_address=192.168.1.150/24
static routers=192.168.1.254
```

3. Run `sudo reboot`. 
4. Connect back to Raspberry Pi 3 like before (`ssh pi@192.168.1.150`), but using the new IP this time. 
5. Run these commands: 

```
sudo apt update
sudo apt upgrade
sudo apt install procmail

```

### Installing server software



### MemeEngine

1. Create `Config.php` from `Config_Template.php`. 
2. Create a directory `MemeData`, make sure PHP can write into it. 
3. Create a database called `MemeEngine` and create the following table: 

```
CREATE TABLE `Memes` (
  `ID` char(32) DEFAULT NULL,
  `Keywords` mediumtext CHARACTER SET utf8,
  `isOffensive` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

### PrivateMessage

1. Create `Config.php` from `Config_Template.php`. 
2. Create a database called `PrivateMessage` and create the following tables: 

```
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

## To-do: 

1. Add sample full install instruction (for raspi). 
2. Add sample auto backup script. 
