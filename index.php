<?php 
require_once('/usr/share/php/takiri/user.inc.php');
$user = user::getCurrentUser();
?>
<!DOCTYPE html>
<html lang=ja>
<head>
    <meta charset=UTF-8>
    <title>Whiteboard</title>
    <link rel="stylesheet" href="client.css">
    <script>
var user = { id: '<?= $user->userid ?>', name: '<?= $user->name ?>' };
    </script>
</head>
<body>
    <header>
        <nav id=setting>
            <input placeholder=title data-setting=title>
            <input placeholder=width type=number data-setting=width>
            px &times;
            <input placeholder=height type=number data-setting=height>
            px
            <input id=setting-readonly type=checkbox data-setting=readonly>
            <label for=setting-readonly>Readonly</label>
        </nav>
        <nav id=tool>
            <button data-action=zoom data-zoom="0.1">+</button>
            <button data-action=zoom data-zoom="-0.1">-</button>
        </nav>
    </header>
    <main>
        <div id=board></div>
    </main>
    <footer>
        <div draggable=true class=piece data-color=white></div>
        <div draggable=true class=piece data-color=black></div>
        <div draggable=true class=piece data-color=grey></div>
        <div draggable=true class=piece data-color=darkgrey></div>
        <div draggable=true class=piece data-color=lightgrey></div>
        <div draggable=true class=piece data-color=red></div>
        <div draggable=true class=piece data-color=blue></div>
        <div draggable=true class=piece data-color=green></div>
        <div draggable=true class=piece data-color=yellow></div>
        <div draggable=true class=piece data-color=pink></div>
        <div draggable=true class=piece data-color=lightgreen></div>
        <div draggable=true class=piece data-color=lightblue></div>
        <br>
        <form id=add-character onsubmit="return false">
            <input type="url" placeholder="Character URL">
            <input type="submit" value="Add Character">
        </form>
    </footer>
    <script src=//code.jquery.com/jquery-2.1.1.min.js></script>
    <script src=//cdn.socket.io/socket.io-1.2.0.js></script>
    <script src=client.js></script>
</body>
</html>
