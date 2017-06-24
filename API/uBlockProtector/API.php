<?php

/**
 * The API for Node.js build script.
 */
//Load configuration
require("Config.php");
//Check key
if ($key === filter_input(INPUT_POST, "key", FILTER_UNSAFE_RAW)) {
    preg_match("/^\d+\.\d+$/", filter_input(INPUT_POST, "data", FILTER_UNSAFE_RAW), $match);
    if (count($match) === 1) {
        if (file_put_contents('Data.txt', $match[0])) {
            echo "ok";
        } else {
            echo "could not save";
        }
    } else {
        echo "bad payload";
    }
} else {
    echo "bad key";
}
