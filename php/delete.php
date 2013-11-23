<?php
$username = $_POST['username'];
$rss = $_POST['rss'];
header('Content-Type: text/plain');

$con=mysqli_connect("31.22.4.32","feifeiha_public","p0OnMM722iqZ","feifeiha_rss_mixer");

// Check connection
if (mysqli_connect_errno($con))
{
    echo "Failed to connect to MySQL: " . mysqli_connect_error();
    return;
}

mysqli_query($con, "DELETE FROM Feeds WHERE username='" . $username . "' AND rss='" . $rss . "'");

mysqli_close($con);

echo 'OK';
?>

