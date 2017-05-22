<?php

/**
 * Redirect (URL shortening) for a community chat board.
 */
//Write response code
http_response_code(301);
//Write redirect header
header("Location: https://jspenguin2017.github.io/z2p/ChatCore.html?page=chatting");
