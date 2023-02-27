<?php
if (isset($_GET['endpoint'])) {
    $allExceptMethod = $_GET; // PHP arrays are copy-by-value
    // unset($allExceptMethod['method']);

    $url = $_GET['endpoint'] . http_build_query($allExceptMethod);

    echo file_get_contents($url);
}
