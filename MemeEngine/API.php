<?php

/**
 * The API for JavaScript client.
 */

/**
 * Format SQL result into the format that the client accepts.
 * @function
 * @param string $id - The ID of the meme.
 * @param string $keywords - The keywords of the meme.
 * @param boolean $isOffensive - The offensive flag of the meme.
 * @return Array - A formatted array.
 */
function formatter($id, $keywords, $isOffensive) {
    return [$id, $keywords, $isOffensive === "1", false];
}

//Load configuration
require("Config.php");
//Check key
if ($key === filter_input(INPUT_POST, "key", FILTER_UNSAFE_RAW)) {
    //Connect to database
    try {
        $db = new PDO("mysql:host=localhost;dbname=MemeEngine", $uname, $pw);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
    } catch (PDOException $e) {
        //Connection failed
        echo "could not connect to database";
        die;
    }
    //Run command
    switch (filter_input(INPUT_POST, "cmd", FILTER_UNSAFE_RAW)) {
        case "search":
            //Prepare query
            if (filter_input(INPUT_POST, "includeOffensive", FILTER_UNSAFE_RAW) === "true") {
                $query = $db->prepare("SELECT * FROM Memes WHERE Keywords LIKE ?;");
            } else {
                $query = $db->prepare("SELECT * FROM Memes WHERE Keywords LIKE ? AND isOffensive = false;");
            }
            //Execute query
            $keywords = filter_input(INPUT_POST, "keywords", FILTER_UNSAFE_RAW);
            if ($query->execute(array("%$keywords%"))) {
                //Encode to JSON and send to client
                echo json_encode($query->fetchAll(PDO::FETCH_FUNC, "formatter"));
            } else {
                echo "could not read from database";
            }
            break;
        case "update":
            //Get variables
            $id = filter_input(INPUT_POST, "id", FILTER_UNSAFE_RAW);
            $keywords = filter_input(INPUT_POST, "keywords", FILTER_UNSAFE_RAW);
            if ($keywords === null) {
                $keywords = "";
            }
            $isOffensive = (filter_input(INPUT_POST, "isOffensive", FILTER_UNSAFE_RAW) !== "false");
            //Check ID length
            if (strlen($id) === 32) {
                //Prepare query
                $query = $db->prepare("UPDATE Memes SET Keywords = ?, isOffensive = ? WHERE ID = ?;");
                //Execute query
                if ($query->execute(array($keywords, $isOffensive, $id))) {
                    //Successful, inform client
                    echo "ok";
                } else {
                    echo "could not update database";
                }
            } else {
                echo "bad id";
            }
            break;
        case "delete":
            //Get variables
            $id = filter_input(INPUT_POST, "id", FILTER_UNSAFE_RAW);
            //Check ID length
            if (strlen($id) === 32) {
                //Prepare query
                $query = $db->prepare("DELETE FROM Memes WHERE ID = ?;");
                //Execute query
                if ($query->execute(array($id))) {
                    //Remove local file
                    if (unlink("./MemeData/$id.png")) {
                        //Everything is done successfully, inform client
                        echo "ok";
                    } else {
                        echo "could not delete file";
                    }
                } else {
                    echo "could not update database";
                }
            } else {
                echo "bad id";
            }
            break;
        case "upload":
            //Get variables
            $rawMeme = filter_input(INPUT_POST, "data", FILTER_UNSAFE_RAW);
            $keywords = filter_input(INPUT_POST, "keywords", FILTER_UNSAFE_RAW);
            if ($keywords === null) {
                $keywords = "";
            }
            $isOffensive = (filter_input(INPUT_POST, "isOffensive", FILTER_UNSAFE_RAW) !== "false");
            //Trim off identifier
            $i = strpos($rawMeme, ",");
            if ($i === false) {
                echo "bad meme encoding";
                exit;
            }
            $meme = substr($rawMeme, $i + 1);
            if ($meme === false) {
                echo "bad meme encoding";
                exit;
            }
            //Decode data
            $decodedMeme = base64_decode($meme);
            if ($decodedMeme === false) {
                echo "bad meme encoding";
                exit;
            }
            //Release memory
            unset($rawMeme);
            unset($meme);
            //Generate file ID
            $fileID = md5(microtime(false));
            //Make sure the ID is unique
            while (file_exists("./MemeData/$fileID.png")) {
                $fileID = md5($fileID . microtime(false));
            }
            //Write to file
            if (file_put_contents("./MemeData/$fileID.png", $decodedMeme) === false) {
                //Failed to write file
                echo "could not create file";
            } else {
                //Add entry to database
                $query = $db->prepare("INSERT INTO Memes VALUES (?, ?, ?);");
                //Execute query
                if ($query->execute(array($fileID, $keywords, $isOffensive))) {
                    //Successful, inform client
                    echo "ok";
                } else {
                    echo "could not update database";
                }
            }
            break;
        default:
            //Command is not valid
            echo "bad cmd";
            break;
    }
} else {
    //Key is not accepted
    echo "bad key";
}
