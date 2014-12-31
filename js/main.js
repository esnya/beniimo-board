(function () {
    'use strict';

    var DataFields = ['title', 'width', 'height', 'lock', 'grid', 'gridinterval'];

    var makeColor = function (data) {
        var hash = Array.prototype.reduce.call(data + data, function (sum, c, i) {
            return (sum * 31 + c.charCodeAt(0)) & 0xffffff;
        }, 0);

        var color = [];
        for (var i = 0; i < 3; ++i) {
            color.push(hash & 0xff);
            hash >>= 8;
        }
        color.push(1);

        return 'rgba(' + color.join(",") + ')';
    };

    angular
        .module('BeniimoBoardApp', ['btford.socket-io'])
        .factory('socket', function (socketFactory) {
            return socketFactory({
                ioSocket: io.connect('http://'+ location.host,
                                  {
                                      path: '/board/socket.io',
                                      transports: ['websocket'],
                                      reconnectionDelay: 0,
                                      timeout: 1000,
                                  })
            });
        }).directive('myDraggable', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    var data = attrs.myDraggable;
                    var dragstart = function (e) {
                        (e.dataTransfer || e.originalEvent.dataTransfer)
                            .setData('text/plain', data);
                    };
                    element.bind('dragstart', dragstart);
                    element.attr('draggable', 'true');

                    element.on('$destory', function () {
                        element.unbind('dragstart', dragstart);
                        element.removeAttr('draggable');
                    });
                }
            };
        }).factory('getCharacter', function ($q, $http) {
            var character_cache = {};

            var getCharacter = function (url, d) {
                if (!d) {
                    d = $q.defer();
                }

                var character = character_cache[url];
                var time = new Date;
                if (character && character.loading) {
                    setTimeout(function () {
                        getCharacter(url, d);
                    }, 500);
                } else if (character && time - character.time < 60 * 1000) {
                    d.resolve(character.data);
                } else {
                    character_cache[url] = {
                        loading: true
                    };
                    $http({
                        method: 'get',
                        url: url,
                    }).success(function (data) {
                        character_cache[url].time = time;
                        character_cache[url].data = data;
                        character_cache[url].loading = false;
                        d.resolve(data);
                    }).error(function (data, status) {
                        delete character_cache[url];
                        d.reject(status);
                    });
                }

                return d.promise;
            };

            return getCharacter;
        }).directive('myDrop', function () {
            return {
                restrict: 'A',
                scope: {
                    myDrop: '&'
                },
                link: function (scope, element, attrs) {
                    var prevent = function (e) {
                        e.preventDefault();
                    };
                    var drop = function (e) {
                        e.preventDefault();
                        var data = (e.dataTransfer || e.originalEvent.dataTransfer);
                        scope.myDrop({
                            $event: e,
                            data: data.getData('text/plain'),
                            files: data.files
                        });
                    };
                    element.bind('dragover', prevent);
                    element.bind('dragenter', prevent);
                    element.bind('drop', drop);

                    element.on('$destory', function () {
                        element.unbind('dragover', prevent);
                        element.unbind('dragenter', prevent);
                        element.unbind('drop', drop);
                    });
                }
            };
        }).controller('BeniimoBoardCtrl', function ($scope, socket, getCharacter) {
            $scope.defaultTitle = document.title;

            $scope.zoom = 0.8;
            $scope.pieces = {};
            $scope.templates = [];

            ['white', 'black', 'gray', 'darkgray', 'red', 'green', 'yellow', 'blue'].forEach(function (color) {
                $scope.templates.push({
                    type: 'color',
                    color: color,
                    template: true
                });
            });
            $scope.templates.push({
                type: 'character',
                color: null,
                template: true
            });
            $scope.templates.push({
                type: 'remove',
                color: null,
                template: true
            });

            $scope.changeZoom = function (zoom) {
                $scope.zoom = Math.max(Math.min($scope.zoom + zoom, 1.0), 0.1);
            };
            $scope.drop = function (e, data, files) {
                var piece = JSON.parse(data);
                if (piece.template) {
                    delete piece.template;
                }

                piece.x = (e.layerX || e.originalEvent.layerX) - 16;
                piece.y = (e.layerY || e.originalEvent.layerY) - 16;

                if (piece.type == 'color') {
                    socket.emit('add piece', piece);
                } else if (piece.type == 'character') {
                    $scope.addingPiece = piece;
                    $('<a class=modal-trigger href=#modal-add-character>').leanModal().trigger('click');
                }
            };
            $scope.addCharacter = function () {
                getCharacter($scope.addingPiece.character_url).then(function (data) {
                    $scope.addingPiece.color = makeColor(data.name + $scope.user.id);
                    socket.emit('add piece', $scope.addingPiece);
                    $('#lean-overlay').trigger('click');
                });
            };
            $scope.removePiece = function (e, data, piece) {
                var remove = JSON.parse(data);
                if (remove.type == 'remove') {
                    socket.emit('remove piece', piece.id);
                }
            };
            $scope.startMove = function (e, piece) {
                e.preventDefault();
                $scope.moving = piece;
                $scope.offset = {
                    x: (e.layerX || e.originalEvent.layerX),
                    y: (e.layerY || e.originalEvent.layerY)
                };
            };
            $scope.move = function (e) {
                if ($scope.moving) {
                    e.preventDefault();
                    var boardOffset = $('#board').offset();
                    var offset = $scope.offset;
                    var x = (e.pageX || e.originalEvent.pageX) - offset.x - boardOffset.left;
                    var y = (e.pageY || e.originalEvent.pageY) - offset.y - boardOffset.top;
                    socket.emit('set piece', $scope.moving.id, {x: x / $scope.zoom, y: y / $scope.zoom});
                }
            };
            $scope.endMove = function (e) {
                $scope.moving = null;
            };
            $scope.change = function (field) {
                socket.emit(field, $scope.room[field]);
            };
            $scope.pieceBorder = function (piece) {
                return piece.character_url ? piece.color : 'black';
            };
            $scope.formBackground = function () {
                var file = $('#input-config-background')[0].files[0];
                socket.emit('background', file, file.name, file.type);
            };
            $scope.dropBackground = function (files) {
                if (files.length >= 1) {
                    var file = files[0];
                    socket.emit('background', file, file.name, file.type);
                }
            };

            var updateGrid = function () {
                if ($scope.room.gridinterval > 0) {
                    var borad = $('#board');

                    var grid = borad.find('.layer-grid');
                    var ctx = grid[0].getContext('2d');
                    
                    ctx.clearRect(0, 0, $scope.room.width, $scope.room.height);

                    ctx.strokeStyle = 'rgb(0, 0, 0);';
                    ctx.fillStyle = 'rgb(0, 0, 0);';
                    ctx.globalAlpha = 0.5;

                    var width = +$scope.room.width;
                    var height = +$scope.room.width;
                    var gridinterval = +$scope.room.gridinterval;


                    ctx.beginPath();
                    for (var x = 0; x < width; x += gridinterval) {
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, height);
                    }
                    for (var y = 0; y < height; y += gridinterval) {
                        ctx.moveTo(0, y);
                        ctx.lineTo(width, y);
                    }
                    ctx.closePath();
                    ctx.stroke();

                    ctx.textAlign = 'center';
                    ctx.font = gridinterval / 4 + 'px/2 Yu-Githic, sans-serif';
                    for (var x = 0; x < width; x += gridinterval) {
                        var n = Math.floor(x / gridinterval);
                        var c = 'a'.charCodeAt(0) + n % 26;
                        var codes = [];
                        for (var i = 0; i < Math.floor(n / 26) + 1; ++i) {
                            codes.push(c);
                        }

                        ctx.textBaseline = 'top';
                        ctx.fillText(String.fromCharCode.apply(String, codes), x + gridinterval / 2, 0);

                        ctx.textBaseline = 'bottom';
                        ctx.fillText(String.fromCharCode.apply(String, codes), x + gridinterval / 2, height);
                    }

                    ctx.textBaseline = 'middle';
                    for (var y = 0; y < height; y += gridinterval) {
                        var n = ' ' + Math.floor(y / gridinterval + 1) + ' ';

                        ctx.textAlign = 'left';
                        ctx.fillText(n, 0, y + gridinterval / 2);

                        ctx.textAlign = 'right';
                        ctx.fillText(n, width, y + gridinterval / 2);
                    }
                }
            }


            socket.on('connect', function () {
                $scope.connected = true;
                socket.emit('join', location.hash);
            });
            socket.on('disconnect', function () {
                $scope.connected = false;
            });
            socket.on('hello', function (user) {
                $scope.user = user;
            });
            socket.on('join', function (room_id) {
                $scope.room = {id: room_id};
                location.hash = room_id;
            });
            socket.on('user', function (user) {
                $scope.room.user = user;
            });
            socket.on('title', function (title) {
                document.title = title + ' - ' + $scope.defaultTitle;
            });
            socket.on('piece', function (id, data) {
                var piece;
                if (id in $scope.pieces) {
                    piece = $scope.pieces[id];
                } else {
                    piece = $scope.pieces[id] = {
                        id: id,
                        z: 0
                    };
                }
                for (var key in data) {
                    piece[key] = data[key];

                    if (key == 'character_url') {
                        getCharacter(data[key]).then(function (data) {
                            var icon = data.icon || data.portrait;
                            piece.icon = icon ? 'url(' + icon + ')' : 'none';
                        });
                    }
                }
            });
            socket.on('remove piece', function (id) {
                delete $scope.pieces[id];
            });
            DataFields.forEach(function (field) {
                socket.on(field, function (data) {
                    $scope.room[field] = data;
                    $('input').trigger('focus');

                    if (field == 'width' || field == 'height' || field == 'gridinterval') {
                        updateGrid();
                    }
                });
            });
        });
})(angular);
