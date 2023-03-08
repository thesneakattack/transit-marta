<?php
if (isset($_GET['endpoint'])) {
    $url = $_GET['endpoint'];

    $allExceptMethod = $_GET; // PHP arrays are copy-by-value
    unset($allExceptMethod['endpoint']);

    $url .= http_build_query($allExceptMethod);


    $response = file_get_contents($url);
    echo $response;
}
