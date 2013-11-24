<?php
$md5= $_POST['md5'];
$sender = $_POST['sender'];
$recipient = $_POST['recipient'];
$importance = strtoupper($_POST['importance']);
$msg = htmlentities($_POST['message'], ENT_QUOTES);
$timestamp = $_POST['timestamp'];

$msg = str_replace("\n", "<br/>", $msg);

header('Content-Type: text/plain');
header('Cache-Control: no-cache'); // recommended to prevent caching of event data.

$con=mysqli_connect("31.22.4.32","feifeiha_public","p0OnMM722iqZ","feifeiha_cloud_stacks");

// Check connection
if (mysqli_connect_errno($con))
{
    $res = "Failed to connect to MySQL: " . mysqli_connect_error();
    echo $res;
    return;
}

if($importance == 'NORMAL') {
    $importance = 0;
}
else if($importance == 'IMPORTANT') {
    $importance = 1;
}
else if($importance == 'URGENT') {
    $importance = 2;
}
else {
    $importance = 0;
}

mysqli_query($con, "INSERT INTO messages (md5, sender, recipient, importance, message, timestamp) VALUES ('" . $md5 . "', '" . $sender . "','" . $recipient . "','" . $importance . "','" . $msg . "','" . $timestamp . "')");

mysqli_close($con);
echo "OK";
?>
