'use strict';

////////// Room //////////
var crypto = require('crypto');
var Room = function (user) {
    this.id = (new Date).getTime() + user.id;
    do {
        this.id = '#' + crypto.createHash('sha256').update(this.id).digest('hex').substr(0, 16);
    } while (this.id in Room.rooms);

    this.user = {
        id: user.id,
        name: user.name
    };

    this.refCount = 0;
    this.pieces = [];

    Room.dataFields.forEach(function (key) { this[key] = null; }.bind(this));

    this.title = 'Whiteboard';
    this.width = 800;
    this.height = 800;
    this.gridinterval = 50;

    this.addRef();
    console.log('New room: ', this);
};
Room.dataFields = ['title', 'width', 'height', 'lock', 'grid', 'gridinterval'];
Room.rooms = {};
Room.getRoom = function (user, room_id) {
    if (room_id && (room_id in Room.rooms)) {
        var room = Room.rooms[room_id]
            room.addRef();
        return room;
    } else {
        var room = new Room(user);
        return (Room.rooms[room.id] = room);
    }
};
Room.prototype.addRef = function () {
    console.log('Room ' + this.id + '@' + ++this.refCount);
};
Room.prototype.release = function () {
    setTimeout(function () {
        if (--this.refCount <= 0) {
            console.log('Room ' + this.id + ' dead.');
            delete Room.rooms[this.id];
            delete this;
        } else {
            console.log('Room ' + this.id + '@' + this.refCount);
        }
    }.bind(this), 60 * 1000);
};
Room.prototype.canModify = function (user) {
    return user && (!this.lock || this.user.id == user.id);
};

////////// Server //////////
var io = require('socket.io').listen(8041, { path: '/board/socket.io' });

io.use(function (socket, next) {
    var user_id = socket.request.headers['username'];

    socket.user = {id: user_id, name: user_id};

    if (user_id) {
        next();
    } else {
        next(new Error);
    }
});

var server = io.sockets.on('connection', function (socket) {
    console.log('New connection: ' + socket.id);

    var _room;

    socket.on('disconnect', function () {
        socket.leave();
        if (_room) {
            _room.release();
        }
    });

    socket.on('join', function (room_id) {
        var user = socket.user;
        if (user && user.id && user.name) {
            console.log('Join request: ' + socket.id + '@' + user.id + ' -> ' + room_id);

            _room = Room.getRoom(user, room_id);
            socket.join(_room.id);

            socket.emit('join', _room.id);
            console.log('Joined: ' + _room.id);

            socket.emit('user', _room.user);

            Room.dataFields.forEach(function (key) {
                socket.emit(key, _room[key]);
            });

            _room.pieces.forEach(function (piece, id) {
                if (piece) {
                    socket.emit('piece', id, piece);
                }
            });

            socket.emit('background', _room.background);

            if (_room.draw) {
                socket.emit('draw', _room.draw.data, _room.draw.time);
            }
        }
    });

    Room.dataFields.forEach(function (field) {
        socket.on(field, function (value) {
            if (_room && _room.canModify(socket.user)) {
                _room[field] = value;
                server.to(_room.id).emit(field, value);
            }
        });
    });

    var limit = function (n, min, max) {
        return (n < min) ? min : ((n < max) ? n : max);
    };

    socket.on('add piece', function (data) {
        if (_room && _room.canModify(socket.user)) {
            var piece = {
                x: limit(data.x || 0, 0, _room.width),
                y: limit(data.y || 0, 0, _room.height),
                color: data.color || null,
                character_url: data.character_url || null
            };

            var id = _room.pieces.push(piece) - 1;

            console.log('Pice add: ', id, piece);

            server.to(_room.id).emit('piece', id, piece);
        }
    });

    socket.on('set piece', function (id, data) {
        if (_room && _room.canModify(socket.user) && id != null && (id in _room.pieces)) {
            var piece = _room.pieces[id];

            var send = {};
            for (var key in piece) {
                if (key in data) {
                    send[key] = piece[key] = data[key];
                }
            }

            server.to(_room.id).emit('piece', id, send);
        }
    });

    socket.on('remove piece', function (id) {
        if (_room && _room.canModify(socket.user) && id != null && (id in _room.pieces)) {
            delete _room.pieces[id];
            server.to(_room.id).emit('remove piece', id);
        }
    });

    socket.on('background', function (data, name, type) {
        if (_room && _room.canModify(socket.user) && type.match(/^image\//)) {
            _room.background = { data: data, name: name, type: type }; 
            server.to(_room.id).emit('background', _room.background);
        }
    });

    socket.on('draw', function (data, time) {
        if (_room && _room.canModify(socket.user)) {
            _room.draw = {data: data, time: time};
            server.to(_room.id).emit('draw', data, time);
        }
    });

    socket.emit('hello', socket.user);
});
