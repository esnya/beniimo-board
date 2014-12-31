<!DOCTYPE html>
<html lang=ja>
    <head>
        <meta charset=UTF-8>
        <title><?= _('Beniimo Board') ?></title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="lib/materialize/css/materialize.css">
        <link rel="stylesheet" href="css/board.css">
        <script>
            var user = {id: 'id', name: 'name'};
        </script>
    </head>
    <body>
        <!-- .modal -->
        <div id=modal-config class="modal">
            <h4><?= _('Board Configuration') ?></h4>
            <br>
            <form id=form-config onsubmit="return false">
                <!-- .row -->
                <div class="row">
                    <div class="input-field col s12">
                        <input type=text name=title id=input-config-title>
                        <label for=input-config-title><?= _('Title') ?></label>
                    </div>
                </div>
                <!-- /.row -->
                <!-- .row -->
                <div class="row">
                    <div class="input-field col s6">
                        <input type=text name=width id=input-config-width>
                        <label for=input-config-width><?= _('Width') ?></label>
                    </div>
                    <div class="input-field col s6">
                        <input type=text name=height id=input-config-height>
                        <label for=input-config-height><?= _('Height') ?></label>
                    </div>
                </div>
                <!-- /.row -->
                <!-- .row -->
                <div class="row">
                    <div class="input-field col s12" style="margin-bottom: 0;">
                        <input type=text name=gridinterval id=input-config-gridinterval>
                        <label for=input-config-gridinterval><?= _('Grid Interval') ?></label>
                    </div>
                </div>
                <!-- /.row -->

                <!-- .row -->
                <div class="row">
                    <div class="col s3">
                        <p>
                            <input type=checkbox name=lock id=input-config-lock />
                            <label for=input-config-lock><?= _('Lock') ?></label>
                        </p>
                    </div>
                    <div class="col s3">
                        <p>
                            <input type=checkbox name=grid id=input-config-grid />
                            <label for=input-config-grid><?= _('Grid') ?></label>
                        </p>
                    </div>
                </div>
                <!-- /.row -->
            </form>
            <br>
            <a href="#" class="btn-flat modal_close modal-action"><?= _('Close') ?></a>
        </div>
        <!-- /.modal -->

        <!-- .modal -->
        <div class="modal" id=modal-add-character>
            <h4><?= _('Add Character') ?></h4>
            <form id=add-character onsubmit="return false">
                <div class="input-field" style="margin-bottom: 0;">
                    <input type=text id=character-url>
                    <label for=character-url><?= _('Character URL') ?></label>
                </div>
                <!-- .col -->
                <!--
                <div class="col s12">
                    <div class="card">
                        <div class="card-content">
                            <img id=add-character-preview-portrait>
                            <span class="add-character-preview-name card-title"></span>
                        </div>
                    </div>
                </div>
                -->
                <!-- /.col -->
                <input type=submit class="btn-flat modal-action" value="<?= _('Add') ?>">
                <a href="#" class="btn-flat modal-action close"><?= _('Cancel') ?></a>
            </form>
        </div>
        <!-- /.modal -->

        <nav class="green lighten-1">
            <!-- .container -->
            <div class="container">
                <!-- .nav-wrapper -->
                <div class="nav-wrapper">
                    <a class="brand-logo title" href="#"><?= _('Beniimo Board') ?></a>
                </div>
                <!-- /.nav-wrapper -->
            </div>
            <!-- /.container -->
        </nav>
        <div id=toolbar>
            <!-- .container -->
            <div class="container">
                <a href="#" class="btn btn-icon zoom" data-zoom=0.1><i class="mdi-">+</i></a>
                <a href="#" class="btn btn-icon zoom" data-zoom=-0.1><i class="mdi-">-</i></a>
                <a class="btn btn-icon modal-trigger" href="#modal-config"><i class="mdi-action-settings"></i></a>
            </div>
            <!-- /.container -->
        </div>
        <main>
            <div id=board><canvas class="layer layer-grid" width=0 height=0></canvas></div>
        </main>
        <footer>
            <div>
                <div draggable=true class="piece template" data-color=white></div><div draggable=true class="piece template" data-color=black></div><div draggable=true class="piece template" data-color=grey></div><div draggable=true class="piece template" data-color=darkgrey></div><div draggable=true class="piece template" data-color=lightgrey></div><div draggable=true class="piece template" data-color=red></div><div draggable=true class="piece template" data-color=blue></div><div draggable=true class="piece template" data-color=green></div><div draggable=true class="piece template" data-color=yellow></div><div draggable=true class="piece template" data-color=pink></div><div draggable=true class="piece template" data-color=lightgreen></div><div draggable=true class="piece template" data-color=lightblue></div><div class="piece template character" draggable=true><i class=mdi-social-person-add></i></div><div class="piece template remove" draggable=true><i class=mdi-content-remove></i></div>
            </div>
        </footer>
        <script src="lib/jquery/jquery.js"></script>
        <script src="lib/socket.io-client/socket.io.js"></script>
        <script src="lib/materialize/js/materialize.js"></script>
        <script src="js/init.js"></script>
        <script src="js/socket.js"></script>
        <script src="js/view.js"></script>
    </body>
</html>
