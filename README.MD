# jspenguin.com

This is the server code for [https://jspenguin.com/](https://jspenguin.com/), without private data. 

*Note: Server is not up currently*

Please open an issue if there is something you want me to know. 

## Server setup: 

Here is a sample setup guide for Raspberry Pi 3 from a Windows 10 host, steps for other systems would be similar. 

### Prepare server software

1. Download [Raspbian Jessie Lite](https://www.raspberrypi.org/downloads/raspbian/). 
2. Download and install [Win32 Disk Imager](https://sourceforge.net/projects/win32diskimager/). 
3. Write Raspbian Jessie Lite onto an Micro SD card using Win32 Disk Imager. 
4. In `Control Panel -> Programs and Features -> Turn Windows features on or off`, check `Windows Subsystem for Linux`. 
5. In `Settings -> Update & security -> For developers`, choose `Developer mode`. 
6. Restart Windows 10, open Command Prompt, run `bash`, then complete installation. 
7. Start Bash on Ubuntu on Windows, and execute these lines as root: 

```
apt update
apt upgrade
```

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
