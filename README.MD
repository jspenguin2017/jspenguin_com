# jspenguin.com

This is the server code for `jspenguin.com`, without private data. 

Please open an issue if there is something you want me to know. 

## Server setup: 

### MemeEngine

1. Create `Config.php` from `Config_Template.php`. 
2. Create a directory `MemeData`, make sure PHP can write into it. 
3. Create a database called `MemeEngine` and create the following table: 

```
CREATE TABLE `memes` (
  `ID` char(32) DEFAULT NULL,
  `Keywords` mediumtext CHARACTER SET utf8,
  `isOffensive` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```
