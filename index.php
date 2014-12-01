<?php 
require_once('/usr/share/php/takiri/user.inc.php');
$user = user::getCurrentUser();
?>
<!DOCTYPE html>
<html lang=ja>
    <head>
        <meta charset=UTF-8>
        <title>Beniimo Board</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="css/materialize.min.css">
        <link rel="stylesheet" href="css/whiteboard.min.css">
        <script>
            var user = { id: '<?= $user->userid ?>', name: '<?= $user->name ?>' };
        </script>
    </head>
    <body>
        <!-- .modal -->
        <div id=modal-config class="modal">
            <h4>Board Configuration</h4>
            <br>
            <form id=form-config onsubmit="return false">
                <!-- .row -->
                <div class="row">
                    <div class="input-field col s12">
                        <input type=text name=title id=input-config-title>
                        <label for=input-config-title>Title</label>
                    </div>
                </div>
                <!-- /.row -->
                <!-- .row -->
                <div class="row">
                    <div class="input-field col s6">
                        <input type=text name=width id=input-config-width>
                        <label for=input-config-width>Width</label>
                    </div>
                    <div class="input-field col s6">
                        <input type=text name=height id=input-config-height>
                        <label for=input-config-height>Height</label>
                    </div>
                </div>
                <!-- /.row -->
                <!-- .row -->
                <div class="row">
                    <div class="input-field col s12">
                        <input type=text name=gridinterval id=input-config-gridinterval>
                        <label for=input-config-gridinterval>Grid Interval</label>
                    </div>
                </div>
                <!-- /.row -->

                <!-- .row -->
                <div class="row">
                    <div class="col s2">
                        <p>
                            <input type=checkbox name=lock id=input-config-lock />
                            <label for=input-config-lock>Lock</label>
                        </p>
                    </div>
                    <div class="col s2">
                        <p>
                            <input type=checkbox name=grid id=input-config-grid />
                            <label for=input-config-grid>Grid</label>
                        </p>
                    </div>
                </div>
                <!-- /.row -->
            </form>
            <br>
            <a class="btn-flat modal_close">Close</a>
        </div>
        <!-- /.modal -->

        <nav>
            <!-- .container -->
            <div class="container">
                <!-- .nav-wrapper -->
                <div class="nav-wrapper">
                    <a class="brand-logo title" href="#">Beniimo Board</a>
                    <a class="button-collapse" href="#" data-activates="nav-mobile"><i class="mdi-navigation-menu"></i></a>
                </div>
                <!-- /.nav-wrapper -->
            </div>
            <!-- /.container -->
        </nav>
        <div id=toolbar>
            <!-- .container -->
            <div class="container">
                <a href="#" class="btn btn-icon" data-action=zoom data-zoom=0.1><i class="mdi-">+</i></a>
                <a href="#" class="btn btn-icon" data-action=zoom data-zoom=-0.1><i class="mdi-">-</i></a>
                <a class="btn btn-icon modal-trigger" href="#modal-config"><i class="mdi-action-settings"></i></a>
            </div>
            <!-- /.container -->
        </div>
        <main>
            <div id=board>
                <canvas class="layer layer-grid" width=0 height=0></canvas>
                <div class="layer layer-pieces"></div>
            </div>
        </main>
        <footer>
            <div>
                <div draggable=true class="piece template" data-color=white></div><div draggable=true class="piece template" data-color=black></div><div draggable=true class="piece template" data-color=grey></div><div draggable=true class="piece template" data-color=darkgrey></div><div draggable=true class="piece template" data-color=lightgrey></div><div draggable=true class="piece template" data-color=red></div><div draggable=true class="piece template" data-color=blue></div><div draggable=true class="piece template" data-color=green></div><div draggable=true class="piece template" data-color=yellow></div><div draggable=true class="piece template" data-color=pink></div><div draggable=true class="piece template" data-color=lightgreen></div><div draggable=true class="piece template" data-color=lightblue></div>
            </div>
            <form id=add-character onsubmit="return false">
                <input type="url" placeholder="Character URL">
                <input type="submit" value="Add Character">
            </form>
        </footer>
        <script src=//code.jquery.com/jquery-2.1.1.min.js></script>
        <script src=//cdn.socket.io/socket.io-1.2.0.js></script>
        <script type="text/javascript" src="js/materialize.min.js"></script>
        <script src="js/init.js"></script>
        <script src=client.js></script>
    </body>
</html>
