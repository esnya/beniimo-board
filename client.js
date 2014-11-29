$(function () {
    'use strict';

    var makeColor = function (data) {
        var rgb = [data.slice(0, data.length / 3), data.slice(data.length / 3, 2 * data.length / 3), data.slice(2 * data.length / 3)].map(function (data) {
            var sum = 0;
            for (var i = 0; i < data.length; ++i) {
                sum += data.charCodeAt(i) & 0xff;
            }
            return sum & 0xff;
        });
        rgb.push(1);
        return 'rgba(' + rgb.join(",") + ')';
    }

    var socket = io.connect('http://yy.shy.jp/', { transports: ['websocket', 'comet', 'polling'] });
    var room = {};
    var zoom = 1.0;
    var draggingPiece;

    ////////// Socket Event //////////
    socket.on('join', function (room_id) {
        console.log('Joined: ', room_id);
        room.id = room_id;
        document.location.hash = room_id;
    });

    socket.on('user', function (user) {
        room.user = user;
    });

    socket.on('setting', function (key, value) {
        var elm = $('[data-setting="' + key + '"]').val(value);
        switch (key) {
            case 'title':
                document.title = value + room.id + ' : Whiteboard';
                break;
            case 'readonly':
                $('[data-setting]').prop('disabled', value && user.id != room.user.id);
                elm.filter('input[type=checkbox]').prop('checked', value);
                break;
            case 'width':
            case 'height':
                $('#board').css(key, value + 'px');
                break;
            case 'background':
                $('#board').css('background-image', value ? 'url(' + value + ')' : '');
                break;
        }
    });

    socket.on('piece', function (id, x, y, color, character_url) {
        var piece = $('#board .piece[data-id="' + id + '"]');
        if (piece.length == 0) {
            var piece = $('<div>').addClass('piece').attr('draggable', 'true').attr('data-id', id).appendTo('#board');
            if (character_url) {
                $.getJSON(character_url).done(function (data) {
                    var icon = data.icon || data.portrait;
                    if (icon) {
                        piece.css('background-image', 'url(' + icon + ')');
                    }
                    piece.css('border-color', piece.data('color'));
                    piece.addClass('icon');
                    piece.append($('<div class="data">').text(data.name));
                });
            }
            initPiece(piece);
        }
        if (color) {
            piece.attr('data-color', color);
        }
        piece.css('transform', 'translate(' + x + 'px, ' + y + 'px)');
    });

    socket.on('connect', function () {
        console.log('Connected');
        var room_id = document.location.hash;
        socket.emit('join', user, room_id);
    });

    ////////// DOM Event //////////
    $('[data-action]').click(function (event) {
        var button = $(this);
        switch (button.data('action')) {
            case 'zoom':
                zoom = Math.max(Math.min(zoom + (0 + button.data('zoom')), 1.0), 0.1);
                $('#board').css('transform', 'scale(' + zoom + ')');
                break;
        }
    });
    $('#setting input').change(function (event) {
        var input = $(this);
        socket.emit('setting', input.data('setting'), input.is('[type=checkbox]') ? input.prop('checked') : input.val());
    });

    var getData = function (event, type) {
        var dataTransfer = event.dataTransfer || event.originalEvent.dataTransfer;
        return dataTransfer.getData(type);
    };
    $('#board').bind({
        dragover: function (event) {
            event.preventDefault();
            //var id = event.originalEvent.dataTransfer.getData('text/html').split('/')[1];
            var id = getData(event, 'text/html').split('/')[1];
            var piece = $('#board .piece[data-id="' + id + '"]');
            if (piece.length) {
                var offset = $(this).offset();
                var x = (event.originalEvent.pageX - offset.left - 8) / zoom;
                var y = (event.originalEvent.pageY - offset.top - 8) / zoom;
                //piece.css('transform', 'translate(' + x + 'px, ' + y + 'px)');
                socket.emit('piece', id, x, y);
            }
        },
        drop: function (event) {
            event.preventDefault();
            var file = event.originalEvent.dataTransfer.files[0];

            if (file) {
                if (!file.type.match(/^image\//)) {
                    alert('Unsupported file type: '+ file.type);
                } else {
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        socket.emit('setting', 'background', reader.result);
                    };
                    reader.readAsDataURL(file);
                }
            } else {
                var offset = $(this).offset();
                var x = (event.originalEvent.pageX - offset.left - 8) / zoom;
                var y = (event.originalEvent.pageY - offset.top - 8) / zoom;
                var data = event.originalEvent.dataTransfer.getData('text/html').split('/');
                socket.emit('piece', data[1], x, y, data[0]);
            }
        }
    });

    $('#add-character').submit(function () {
        var character_url = $(this).find('input[type=url]').val();
        $.getJSON(character_url).done(function (data) {
            var color = data.color || makeColor(data.name + data.user_id);
            socket.emit('piece', -1, 0, 0, color, character_url);
        });
    });

    var initPiece = function (target) {
        target.bind({
            dragstart: function (event) {
                var piece = $(this);
                piece.addClass('dragging');
                event.originalEvent.dataTransfer.setData('text/html', piece.data('color') + '/' + piece.data('id'));
            },
            dragend: function (event) {
                $(this).removeClass('dragging');
            }
        });
    };
    initPiece($('.piece'));
});
