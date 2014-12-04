(function (View) {
    'use strict';

    var _zoom = 1.0;
    var _title = document.title;
    var _room;

    var Grid = {
        interval: 0,
        draw: function (options) {
            if (this.interval > 0) {
                if (!options) {
                    options = {};
                }

                var borad = $('#board');

                var width = options.width || borad.width();
                var height = options.height || borad.height();

                var grid = borad.find('.layer-grid').attr('width', width).attr('height', height);
                var ctx = grid[0].getContext('2d');

                ctx.strokeStyle = 'rgb(0, 0, 0);';
                ctx.fillStyle = 'rgb(0, 0, 0);';
                ctx.globalAlpha = 0.5;

                ctx.beginPath();
                for (var x = 0; x < width; x += this.interval) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                }
                for (var y = 0; y < height; y += this.interval) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                }
                ctx.closePath();
                ctx.stroke();

                ctx.textAlign = 'center';
                for (var x = 0; x < width; x += this.interval) {
                    var n = Math.floor(x / this.interval);
                    var c = 'a'.charCodeAt(0) + n % 26;
                    var codes = [];
                    for (var i = 0; i < Math.floor(n / 26) + 1; ++i) {
                        codes.push(c);
                    }

                    ctx.textBaseline = 'top';
                    ctx.fillText(String.fromCharCode.apply(String, codes), x + this.interval / 2, 0);

                    ctx.textBaseline = 'bottom';
                    ctx.fillText(String.fromCharCode.apply(String, codes), x + this.interval / 2, height);
                }

                ctx.textBaseline = 'middle';
                for (var y = 0; y < height; y += this.interval) {
                    var n = ' ' + Math.floor(y / this.interval) + ' ';

                    ctx.textAlign = 'left';
                    ctx.fillText(n, 0, y + this.interval / 2);

                    ctx.textAlign = 'right';
                    ctx.fillText(n, width, y + this.interval / 2);
                }
            }
        }
    };

    var Drag = {
        getpos: function (e) {
            var offset = $('#board').offset();
            return {
                x: ((e.pageX || e.originalEvent.pageX) - offset.left - this.offset.left) / _zoom,
                y: ((e.pageY || e.originalEvent.pageY) - offset.top  - this.offset.top ) / _zoom
            };
        },
        start: function (target, e) {
            this.target = $(target);
            var offset = this.target.offset();
            this.offset = {
                left: ((e.pageX || e.originalEvent.pageX) - offset.left) * _zoom,
                top:  ((e.pageY || e.originalEvent.pageY) - offset.top ) * _zoom
            };
        },
        move: function (e) {
            if (this.target) {
                var pos = this.getpos(e);
                Socket.emit('set piece', this.target.data('id'), pos);
            }
        },
        end: function (e) {
            delete this.target;
        },
        drop: function (e) {
            var color = (e.dataTransfer || e.originalEvent.dataTransfer).getData('text/plain');
            if (color) {
                var pos = this.getpos(e);
                console.log(pos, color);
                Socket.emit('add piece', {
                    x: pos.x,
                    y: pos.y,
                    color: color
                });
            }
        }
    };

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

    Socket.on('disconnect', function () {
        document.title = _title;
        $('.title').text(_title).trigger('change');

        $('input').val('').trigger('change');
    });

    Socket.on('join', function (room_id) {
        $('#board .piece').remove();
        document.location.hash = room_id;
        _room = { id: room_id };
    });

    ['title', 'width', 'height', 'lock', 'grid', 'gridinterval'].forEach(function (field) {
        Socket.on(field, function (value) {
            var input = $('#input-config-' + field);
            input.filter(':not([type=checkbox])').val(value);
            input.filter('[type=checkbox]').prop('checked', value);

            var text = input.filter('[type=text]');
            if (text.length) {
                text.siblings('label').toggleClass('active', text.val().length !== 0);
            }
        });
    });

    Socket.on('user', function (user) {
        _room.user = user;
    });

    Socket.on('title', function (title) {
        document.title = title + ' - ' + _title;
        $('.title').text(title).trigger('change');
    });

    Socket.on('lock', function (lock) {
        $('#form-config input').prop('disabled', lock && user.id != _room.user.id);
    });

    ['width', 'height'].forEach(function (field) {
        Socket.on(field, function (value) {
            $('#board').css(field, value + 'px');
            var options = {};
            options[field] = +value;
            Grid.draw(options);
        });
    });

    Socket.on('gridinterval', function (interval) {
        Grid.interval = +interval;
        Grid.draw();
    });

    Socket.on('grid', function (grid) {
        $('#board .layer-grid')['fade' + (grid ? 'In' : 'Out')]();
    });

    Socket.on('background', function (bg) {
        var board = $('#board');
        var old = board.data('url');

        if (bg) {
            var url = window.URL.createObjectURL(new File([bg.data], bg.name, { type: bg.type }));
            board.data('url', url).css('background-image', 'url' + '(' + url + ')');
        } else {
            board.data('url', '').css('background-image', 'none');
        }

        if (old) {
            window.URL.revokeObjectURL(old);
        }
    });

    var _z = 1;
    var _lastId;
    Socket.on('piece', function (id, data) {
        var piece = $('#board .piece[data-id="' + id + '"]');

        if (piece.length == 0) {
            piece = $('<div class=piece draggable=true>')
                .attr('data-id', id)
                .bind('dragstart', function (e) {
                    e.preventDefault();
                    Drag.start(this, e);
                }).appendTo('#board');
            
            if (data.character_url) {
                $.getJSON(data.character_url).done(function (character) {
                    piece
                        .addClass('icon')
                        .addClass('tooltipped')
                        .attr({
                            'data-position': 'bottom',
                            'data-tooltip': character.name
                        }).css({
                            'border-color': character.color || data.color,
                            'background-color': 'white'
                        }).tooltip({
                            delay: 10
                        });

                    var icon = character.icon || character.portrait;
                    if (icon) {
                        piece.css('background-image', 'url' + '(' + icon + ')');
                    }
                });
            }
        }

        piece.css({
            'z-index': _z,
            'transform': 'translate(' + data.x + 'px,' + data.y +'px)',
            'background-color': data.color
        });

        if (_lastId != id) {
            _lastId = id;
            ++_z;
        }
    });

    $('.zoom').bind({
        click: function (e) {
            e.preventDefault();
            var button = $(this);

            var set = button.data('set');
            if (set != null) {
                _zoom = +set;
            } else {
                _zoom = Math.max(Math.min(_zoom * (1 + (+button.data('zoom'))), 1.0), 0.1);
            }
            $('#board').css('transform', 'scale' + '(' + _zoom + ')');
        },
        mousedown: function (e) {
            var button = $(this);
            button.data('timeout', setTimeout(function () {
                button.css('duration', '0s 0s').data('interval', setInterval(function () {
                    button.trigger('click');
                }, 100));
            }, 500));
        },
        mouseup: function (e) {
            var button = $(this).css('duration', '');
            clearTimeout(button.data('timeout'));
            clearInterval(button.data('interval'));
        }
    });

    $('#form-config input').change(function (e) {
        var input = $(this);

        Socket.emit(input.attr('name'),
                input.is('[type=checkbox]') ? input.prop('checked') : input.val());
    });

    $('#board').bind({
        mousemove: function (e) { Drag.move(e); },
        mouseup: function (e) { Drag.end(e); },
        dragenter: function (e) {
            e.preventDefault();
        },
        dragover: function (e) {
            e.preventDefault();
        },
        drop: function (e) {
            e.preventDefault();

            var file = (e.dataTransfer || e.originalEvent.dataTransfer).files[0];

            if (file) {
                if (!file.type.match(/^image/)) {
                    alert('Unsupported file type: '+ file.type);
                } else {
                   Socket.emit('background', file, file.name, file.type);
                }
            } else {
                Drag.drop(e);
            }
        }
    });


    $('#add-character').submit(function () {
        var character_url = $(this).find('input[type=url]').val();
        $.getJSON(character_url).done(function (data) {
            Socket.emit('add piece', { character_url: character_url });
        });
    });

    $('.piece.template').bind('dragstart', function (e) {
            (e.dataTransfer || e.originalEvent.dataTransfer).setData('text/plain', $(this).data('color'));
            Drag.start(this, e);
    }).each(function () {
        var piece = $(this);
        piece.css('background-color', piece.data('color'));
    });

    $(document.body).mouseleave(function (e) { Drag.end(e); });
    $(window).bind('hashchange', function () {
        if (!_room || location.hash != _room.id) {
            Socket.emit('join', user, location.hash);
        }
    });
})(this.View || (this.View = {}));
