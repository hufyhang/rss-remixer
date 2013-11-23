<?php
$username = $_POST['username'];
$password = $_POST['password'];

header('Content-Type: text/plain');
$con = mysqli_connect("31.22.4.32","feifeiha_public","p0OnMM722iqZ","feifeiha_rss_mixer");
$res = 'ERROR';

// Check connection
if (mysqli_connect_errno($con))
{
    $res = "Failed to connect to MySQL: " . mysqli_connect_error();
}
$result = mysqli_query($con, "SELECT * FROM Users WHERE username='" . $username . "'");
while($row = mysqli_fetch_array($result)) {
    echo 'This username has already been taken. Please try again.';
    return;

}

mysqli_query($con, "INSERT INTO Users (username, password) VALUES('" . $username . "','" . $password . "')");

mysqli_close($con);
echo 'OK';
?>

