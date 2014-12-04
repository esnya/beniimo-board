$(function () {
    'use strict';

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

    var gridInterval;
    var drawGrid = function (width, height) {
        if (gridInterval && gridInterval > 0) {
            var borad = $('#board');

            width = width || borad.width();
            height = height || borad.height();

            var grid = borad.find('.layer-grid').attr('width', width).attr('height', height);
            var ctx = grid[0].getContext('2d');
            
            ctx.strokeStyle = 'rgb(0, 0, 0);';
            ctx.fillStyle = 'rgb(0, 0, 0);';
            ctx.globalAlpha = 0.5;

            ctx.beginPath();
            for (var x = 0; x < width; x += gridInterval) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }
            for (var y = 0; y < height; y += gridInterval) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.textAlign = 'center';
            for (var x = 0; x < width; x += gridInterval) {
                var n = Math.floor(x / gridInterval);
                var c = 'a'.charCodeAt(0) + n % 26;
                var codes = [];
                for (var i = 0; i < Math.floor(n / 26) + 1; ++i) {
                    codes.push(c);
                }

                ctx.textBaseline = 'top';
                ctx.fillText(String.fromCharCode.apply(String, codes), x + gridInterval / 2, 0);

                ctx.textBaseline = 'bottom';
                ctx.fillText(String.fromCharCode.apply(String, codes), x + gridInterval / 2, height);
            }

            ctx.textBaseline = 'middle';
            for (var y = 0; y < height; y += gridInterval) {
                var n = ' ' + Math.floor(y / gridInterval) + ' ';

                ctx.textAlign = 'left';
                ctx.fillText(n, 0, y + gridInterval / 2);

                ctx.textAlign = 'right';
                ctx.fillText(n, width, y + gridInterval / 2);
            }
        }
    };

    var _defaultTitle = document.title;
    socket.on('setting', function (key, value) {
        var selector = '#input-config-' + key;
        var elm = $(selector);
        elm.filter(':not([type=checkbox])').val(value);
        elm.filter('[type=checkbox]').prop('checked', value);
        switch (key) {
            case 'title':
                document.title = value + ' - ' + _defaultTitle;
                $('.title').text(value);
                break;
            case 'lock':
                $('#form-config input').prop('disabled', value && user.id != room.user.id);
                break;
            case 'width':
            case 'height':
                $('#board').css(key, value + 'px');
                drawGrid(key == 'width' ? +value : null, key == 'height' ? +value : null);
                break;
            case 'gridinterval':
                gridInterval = +value;
                drawGrid();
                break;
            case 'grid':
                if (value) $('#board .layer-grid').fadeIn();
                else $('#board .layer-grid').fadeOut();
                break;
        }
    });

    socket.on('background', function  (data, name, type) {
        var board = $('#board');
        var old = board.data('url');

        var url = window.URL.createObjectURL(new File([data], name, { type: type }));
        console.log(url);

        board.data('url', url).css('background-image', 'url(' + url + ')');

        if (old) {
            window.URL.revokeObjectURL(old);
        }
    });

    socket.on('piece', function (id, x, y, color, character_url) {
        var piece = $('#board .piece[data-id="' + id + '"]');
        if (piece.length == 0) {
            var piece = $('<div>')
                .addClass('piece')
                .attr('data-id', id)
                .mousedown(function () {
                    draggingPiece = $(this).appendTo('#board .layer-pieces');
                })
                .appendTo('#board');
            if (character_url) {
                $.getJSON(character_url).done(function (data) {
                    var icon = data.icon || data.portrait;
                    if (icon) {
                        if (color) {
                            piece.css('border-color', color);
                        }
                        piece.css('background-image', 'url(' + icon + ')');
                    }
                    piece
                        .css({
                            'border-color': piece.data('color'),
                            'background-color': 'white'
                        })
                        .addClass('icon')
                        .addClass('tooltipped')
                        .attr('data-position', 'bottom')
                        .attr('data-tooltip', data.name)
                        .tooltip({delay: 10});
                });
            }
        }
        if (color) {
            piece.css('background-color', color);
        }
        piece.css('transform', 'translate(' + x + 'px, ' + y + 'px)');
    });

    socket.on('connect', function () {
        console.log('Connected');
        var room_id = document.location.hash;
        socket.emit('join', user, room_id);
    });

    socket.on('disconnect', function () {
        $('#board .piece').remove();
        document.title = 'Beniimoo Board';
        $('.title').text(document.title);
        $('input').val('');
    });

    ////////// DOM Event //////////
    var dragging = null;

    $('[data-action]').click(function (event) {
        event.preventDefault();
        var button = $(this);
        switch (button.data('action')) {
            case 'zoom':
                zoom = Math.max(Math.min(zoom + (0 + button.data('zoom')), 1.0), 0.1);
                $('#board').css('transform', 'scale(' + zoom + ')');
                break;
        }
    });
    $('#form-config input').change(function (event) {
        var input = $(this);
        socket.emit('setting', input.attr('name'), input.is('[type=checkbox]') ? input.prop('checked') : input.val());
    });

    var getData = function (event, type) {
        var dataTransfer = event.dataTransfer || event.originalEvent.dataTransfer;
        return dataTransfer.getData(type);
    };

    $('#board').bind({
        mousemove: function (event) {
            if (draggingPiece) {
                var offset = draggingPiece.offset();
                var boff = $('#board').offset();
                var x = event.originalEvent.pageX - boff.left - draggingPiece.width() / 2 * zoom;
                var y = event.originalEvent.pageY - boff.top - draggingPiece.height() / 2 * zoom;
                x /= zoom, y /= zoom;
                socket.emit('piece', draggingPiece.data('id'), x, y);
            }
        },
        mouseleave: function (event) {
            draggingPiece = null;
        },
        mouseup: function (event) {
            draggingPiece = null;
        },
        dragover: function (event) {
            event.preventDefault();
        },
        drop: function (event) {
            event.preventDefault();
            var file = event.originalEvent.dataTransfer.files[0];

            if (file) {
                if (!file.type.match(/^image\//)) {
                    alert('Unsupported file type: '+ file.type);
                } else {
                    socket.emit('background', file, file.name, file.type);
                }
            } else {
                var piece = $('.piece.template:first-child');
                var boff = $('#board').offset();
                var x = event.originalEvent.pageX - boff.left - piece.width() / 2 * zoom;
                var y = event.originalEvent.pageY - boff.top - piece.height() / 2 * zoom;
                x /= zoom, y /= zoom;
                var data = event.originalEvent.dataTransfer.getData('text/html').split('/');
                socket.emit('piece', data[1], x, y, data[0]);
            }
        }
    });

    $('#add-character').submit(function () {
        var character_url = $(this).find('input[type=url]').val();
        $.getJSON(character_url).done(function (data) {
            var color = data.color || makeColor(data.name + user.id);
            socket.emit('piece', -1, 0, 0, color, character_url);
        });
    });

    $('[href="#modal-config"]').click(function () {
        $('#form-config input').each(function () {
            $(this).trigger('focus');
        });
    });

    $('.piece.template').bind({
        dragstart: function (event) {
            var piece = $(this);
            piece.addClass('dragging');
            event.originalEvent.dataTransfer.setData('text/html', piece.data('color') + '/' + piece.data('id'));
        },
        dragend: function (event) {
            $(this).removeClass('dragging');
        }
    }).each(function () {
        var piece = $(this);
        piece.css('background-color', piece.data('color'));
    });
});
