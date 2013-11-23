<?php
$username = $_POST['username'];
$url = $_POST['url'];

header('Content-Type: text/plain');

$con=mysqli_connect("31.22.4.32","feifeiha_public","p0OnMM722iqZ","feifeiha_rss_mixer");

// Check connection
if (mysqli_connect_errno($con))
{
    $res = "Failed to connect to MySQL: " . mysqli_connect_error();
    echo $res;
    return;
}

mysqli_query($con, "INSERT INTO Feeds (username, rss) VALUES ('" . $username . "', '" . $url . "')");

mysqli_close($con);
echo "OK";
?>

