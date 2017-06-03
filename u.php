<?php

/**
 * Redirect (URL shortening) for uBlock Protector.
 */
//Write response code
http_response_code(301);
//Write redirect header
header("Location: https://github.com/jspenguin2017/uBlockProtector");
