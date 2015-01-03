<?php require_once(dirname(dirname(__FILE__)) . '/locale/locale.php') ?>
<!DOCTYPE html>
<html lang=ja ng-app=BeniimoBoardApp>
    <head>
        <meta charset=UTF-8>
        <title><?= _('Beniimo Board') ?></title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="lib/materialize/css/materialize.css">
        <link rel="stylesheet" href="css/board.css">
        <style>
            [ng-cloak] {
                display: none !impoartant;
            }
        </style>
    </head>
    <body ng-controller=BeniimoBoardCtrl ng-mousemove=move($event) ng-mouseup=endMove($event)>
        <!-- .modal -->
        <div id=modal-config class="modal">
            <h4><?= _('Board Configuration') ?></h4>
            <br>
            <form id=form-config onsubmit="return false">
                <!-- .row -->
                <div class="row">
                    <div class="input-field col s12">
                        <input type=text ng-change="change('title')" ng-model=room.title id=input-config-title>
                        <label for=input-config-title><?= _('Title') ?></label>
                    </div>
                </div>
                <!-- /.row -->
                <!-- .row -->
                <div class="row">
                    <div class="input-field col s6">
                        <input type=text ng-change="change('width')" ng-model=room.width id=input-config-width>
                        <label for=input-config-width><?= _('Width') ?></label>
                    </div>
                    <div class="input-field col s6">
                        <input type=text ng-change="change('height')" ng-model=room.height id=input-config-height>
                        <label for=input-config-height><?= _('Height') ?></label>
                    </div>
                </div>
                <!-- /.row -->
                <!-- .row -->
                <div class="row" my-drop=dropBackground(files)>
                    <div class="input-field col s8">
                        <input type=file id=input-config-background>
                        <label for=input-config-background class=active><?= _('Background Image') ?></label>
                    </div>
                    <div class="input-field text col s4">
                        <button ng-click="formBackground()" onclick="return false"><?= _('Apply') ?></button>
                        <?= _('or D&D Here') ?>
                    </div>
                </div>
                <!-- /.row -->
                <!-- .row -->
                <div class="row">
                    <div class="input-field col s12" style="margin-bottom: 0;">
                        <input type=text ng-change="change('gridinterval')" ng-model=room.gridinterval id=input-config-gridinterval>
                        <label for=input-config-gridinterval><?= _('Grid Interval') ?></label>
                    </div>
                </div>
                <!-- /.row -->

                <!-- .row -->
                <div class="row">
                    <div class="col s3">
                        <p>
                            <input type=checkbox ng-change="change('lock')" ng-model=room.lock id=input-config-lock />
                            <label for=input-config-lock><?= _('Lock') ?></label>
                        </p>
                    </div>
                    <div class="col s3">
                        <p>
                            <input type=checkbox ng-change="change('grid')" ng-model=room.grid id=input-config-grid />
                            <label for=input-config-grid><?= _('Grid') ?></label>
                        </p>
                    </div>
                </div>
                <!-- /.row -->
            </form>
            <br>
            <a href="#" class="btn-flat modal-close modal-action"><?= _('Close') ?></a>
        </div>
        <!-- /.modal -->

        <!-- .modal -->
        <div class="modal" id=modal-add-character>
            <h4><?= _('Add Character') ?></h4>
            <form id=add-character onsubmit="return false" ng-submit=addCharacter()>
                <div class="input-field" style="margin-bottom: 0;">
                    <input type=text id=character-url ng-model=addingPiece.character_url>
                    <label for=character-url><?= _('Character URL') ?></label>
                </div>
                <input type=submit class="btn-flat modal-action" value="<?= _('Add') ?>">
                <a href="#" class="btn-flat modal-action modal-close"><?= _('Cancel') ?></a>
            </form>
        </div>
        <!-- /.modal -->

        <nav class="green lighten-1">
            <!-- .container -->
            <div class="container">
                <!-- .nav-wrapper -->
                <div class="nav-wrapper">
                    <a class="brand-logo" ng-href=room.id ng-hide=room><?= _('Beniimo Board') ?></a>
                    <a class="brand-logo" ng-href=room.id ng-show=room ng-bind=room.title></a>
                </div>
                <!-- /.nav-wrapper -->
            </div>
            <!-- /.container -->
        </nav>
        <div id=toolbar>
            <!-- .container -->
            <div class="container">
                <a href="#" class="btn btn-icon" onclick="return false" ng-click="changeZoom(0.1)"><i class="mdi-">+</i></a>
                <a href="#" class="btn btn-icon" onclick="return false" ng-click="changeZoom(-0.1)"><i class="mdi-">-</i></a>
                <a class="btn btn-icon" my-drop=dropBackground(files)><i class="mdi-maps-terrain"></i></a>
                <a class="btn btn-icon modal-trigger" href="#modal-config"><i class="mdi-action-settings"></i></a>
            </div>
            <!-- /.container -->
        </div>
        <div ng-hide="room" class=fill>
            <div class="preloader-wrapper big active">
                <div class="spinner-layer spinner-blue">
                    <div class="circle-clipper left">
                        <div class="circle"></div>
                        </div><div class="gap-patch">
                        <div class="circle"></div>
                        </div><div class="circle-clipper right">
                        <div class="circle"></div>
                    </div>
                </div>

                <div class="spinner-layer spinner-red">
                    <div class="circle-clipper left">
                        <div class="circle"></div>
                        </div><div class="gap-patch">
                        <div class="circle"></div>
                        </div><div class="circle-clipper right">
                        <div class="circle"></div>
                    </div>
                </div>

                <div class="spinner-layer spinner-yellow">
                    <div class="circle-clipper left">
                        <div class="circle"></div>
                        </div><div class="gap-patch">
                        <div class="circle"></div>
                        </div><div class="circle-clipper right">
                        <div class="circle"></div>
                    </div>
                </div>

                <div class="spinner-layer spinner-green">
                    <div class="circle-clipper left">
                        <div class="circle"></div>
                        </div><div class="gap-patch">
                        <div class="circle"></div>
                        </div><div class="circle-clipper right">
                        <div class="circle"></div>
                    </div>
                </div>
            </div>
            <p>Connecting...</p>
        </div>
        <main>
            <div ng-show=room ng-cloak id=board style="transform: scale({{zoom}}); width: {{room.width}}px; height: {{room.height}}px; background-image: url({{background_url}});" my-drop="drop($event, data, files)">
                <canvas class="layer layer-grid" width={{room.width}} height={{room.height}} ng-show=room.grid ng-cloak></canvas>
                <div
                    class="piece"
                    style="
                    border-color: {{pieceBorder(piece)}};
                    background-color: {{piece.color}};
                    background-image: {{piece.icon}};
                    z-index: {{piece.z}};
                    transform: translate({{piece.x}}px,{{piece.y}}px);
                    "
                    ng-repeat="piece in pieces"
                    ng-mousedown="startMove($event, piece)"
                    my-drop="removePiece($event, data, piece)"
                    >
                </div>
            </div>
        </main>
        <footer class="white">
            <div>
                <div class="piece {{piece.type}}" style="background-color: {{piece.color}};" ng-repeat="piece in templates" my-draggable={{piece}}>
                    <i ng-if="piece.type == 'remove'" class=mdi-content-remove></i>
                    <i ng-if="piece.type == 'character'" class=mdi-social-person-add></i>
                </div>
           </div>
        </footer>
        <script src="lib/jquery/jquery.js"></script>
        <script src="lib/socket.io-client/socket.io.js"></script>
        <script src="lib/materialize/js/materialize.js"></script>
        <script src="lib/angular/angular.js"></script>
        <script src="lib/angular-socket-io/socket.js"></script>
        <script src="js/init.js"></script>
        <script src="js/main.js"></script>
    </body>
</html>
