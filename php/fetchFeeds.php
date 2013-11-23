<?php
$username = $_GET['username'];

header('Content-Type: application/json');
$con = mysqli_connect("31.22.4.32","feifeiha_public","p0OnMM722iqZ","feifeiha_rss_mixer");
$res = '{"status":"';

// Check connection
if (mysqli_connect_errno($con))
{
    $res = "Failed to connect to MySQL: " . mysqli_connect_error() . '"';
}
else {
    $result = mysqli_query($con, "SELECT * FROM Feeds WHERE username='" . $username . "'");
    $res = $res . 'OK", "feeds": [';
    while($row = mysqli_fetch_array($result))
    {
        $res = $res . '{"rss":"' . $row['rss'] . '"},';
    }
    $res = rtrim($res, ',');
    $res = $res . ']';

}
mysqli_close($con);
$res = $res . '}';
echo $res;
?>

