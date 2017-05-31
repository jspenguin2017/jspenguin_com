<?php

/**
 * The API for JavaScript client.
 */

/**
 * Format SQL result into the format that the client accepts.
 * @function
 * @param string $id - The ID of the message.
 * @param string $ip - The IP address of the sender.
 * @param string $reference - The reference of the message.
 * @param boolean $message - The message.
 * @return Object - A formatted object.
 */
function formatter($id, $ip, $reference, $message) {
    return [
        "id" => $id,
        "ip" => $ip,
        "reference" => $reference,
        "message" => $message
    ];
}

//Load configuration
require("Config.php");
//Connect to database
try {
    $db = new PDO("mysql:host=localhost;dbname=PrivateMessage", $uname, $pw);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
} catch (PDOException $e) {
    //Connection failed
    echo "Database error: Could not connect to database.";
    die;
}
//Check command
switch (filter_input(INPUT_POST, "cmd", FILTER_UNSAFE_RAW)) {
    case "send":
        //Check rate limit
        $rateOK = false;
        $query = $db->prepare("SELECT AccessTime FROM LastAccess WHERE IP = ?;");
        if ($query->execute(array(filter_input(INPUT_SERVER, "REMOTE_ADDR", FILTER_UNSAFE_RAW)))) {
            if ($query->rowCount() > 1) {
                //There should be at most one row
                echo "Database error: LastAccess table is corrupted.";
                die;
            } else {
                if ($query->rowCount() === 1) {
                    $row = ($query->fetch());
                    if ($row["AccessTime"] + (15 * 60) < time()) {
                        $rateOK = true;
                    }
                } else {
                    //This is the first time this IP sends a message
                    $rateOK = true;
                }
            }
        } else {
            echo "Database error: Could not access LastAccess table.";
            die;
        }
        //Save message if rate limit check passed
        if ($rateOK) {
            //Prepare query, update rate limit entry then save message
            $query = $db->prepare("REPLACE INTO LastAccess VALUES (:ip, :time); INSERT INTO Messages (IP, Reference, Message) VALUES (:ip, :reference, :message);");
            $ip = filter_input(INPUT_SERVER, "REMOTE_ADDR", FILTER_UNSAFE_RAW);
            $reference = filter_input(INPUT_POST, "reference", FILTER_UNSAFE_RAW);
            if ($reference === null) {
                $reference = "";
            }
            $message = filter_input(INPUT_POST, "message", FILTER_UNSAFE_RAW);
            if ($message === null) {
                $message = "";
            }
            //Execute query
            $query->bindValue(":ip", $ip, PDO::PARAM_STR);
            $query->bindValue(":time", time(), PDO::PARAM_INT);
            $query->bindValue(":reference", $reference, PDO::PARAM_STR);
            $query->bindValue(":message", $message, PDO::PARAM_STR);
            if ($query->execute()) {
                echo "ok";
            } else {
                echo "Database error: Could not save message.";
            }
        } else {
            echo "Rate limited: You can only send one message every 15 minutes.";
        }
        break;
    case "admin count":
        //Check administration key
        if ($adminKey === filter_input(INPUT_POST, "adminKey", FILTER_UNSAFE_RAW)) {
            //Prepare to count messages
            $query = $db->prepare("SELECT Count(ID) AS MessagesCount FROM Messages;");
            //Count messages
            if ($query->execute()) {
                echo $query->fetch()["MessagesCount"];
            } else {
                echo "Database error: Could not access Messages table.";
            }
        } else {
            echo "Administration key is not valid";
        }
        break;
    case "admin get page":
        //Check administration key
        if ($adminKey === filter_input(INPUT_POST, "adminKey", FILTER_UNSAFE_RAW)) {
            //Prepare to load messages
            $query = $db->prepare("SELECT * FROM Messages ORDER BY ID DESC LIMIT 20 OFFSET :offset;");
            $offset = intval(filter_input(INPUT_POST, "page", FILTER_UNSAFE_RAW)) * 20;
            //Load messages
            $query->bindValue(":offset", $offset, PDO::PARAM_INT);
            if ($query->execute()) {
                echo json_encode($query->fetchAll(PDO::FETCH_FUNC, "formatter"));
            } else {
                echo "Database error: Could not access Messages table.";
            }
        } else {
            echo "Administration key is not valid";
        }
        break;
    case "admin clear timeout":
        //Check administration key
        if ($adminKey === filter_input(INPUT_POST, "adminKey", FILTER_UNSAFE_RAW)) {
            //Truncate LastAccess table
            $query = $db->prepare("TRUNCATE TABLE LastAccess;");
            if ($query->execute()) {
                echo "ok";
            } else {
                echo "Database error: Could not update LastAccess table.";
            }
        } else {
            echo "Administration key is not valid";
        }
        break;
    case "admin delete":
        //Check administration key
        if ($adminKey === filter_input(INPUT_POST, "adminKey", FILTER_UNSAFE_RAW)) {
            //Check if ID is supplied
            $id = filter_input(INPUT_POST, "id", FILTER_UNSAFE_RAW);
            if ($id === null) {
                echo "no id";
            } else {
                //Prepare to delete messages
                $query = $db->prepare("DELETE FROM Messages WHERE ID = :id;");
                $query->bindValue(":id", intval($id), PDO::PARAM_INT);
                //Delete messages
                if ($query->execute()) {
                    //This should affect exactly one row
                    if ($query->rowCount() === 1) {
                        echo "ok";
                    } else {
                        echo "Database error: Messages table is corrupted.";
                    }
                } else {
                    echo "Database error: Could not update Messages table.";
                }
            }
        } else {
            echo "Administration key is not valid";
        }
        break;
    default:
        //Command is not valid
        echo "bad cmd";
        break;
}
