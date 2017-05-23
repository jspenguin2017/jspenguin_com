# jspenguin.com

This is the server code for [https://jspenguin.com/](https://jspenguin.com/), without private data. 

*Note: Server is not up currently*

Please open an issue if there is something you want me to know. 

## Server setup: 

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
```

## To-do: 

1. Add home page, and pm (with pm setup instructions).
2. Add sample full install instruction (for raspi). 
3. Add sample auto backup script. 
