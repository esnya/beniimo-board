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
    this.width = 600;
    this.height = 400;

    console.log('New room: ', this.id);
};
Room.dataFields = ['title', 'width', 'height', 'readonly', 'background'];
Room.rooms = {};
Room.getRoom = function (user, room_id) {
    if (room_id && (room_id in Room.rooms)) {
        return Room.rooms[room_id];
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
    return user && (!this.readonly || this.user.id == user.id);
};

////////// Server //////////
var io = require('socket.io').listen(8012);
var server = io.sockets.on('connection', function (socket) {
    console.log('New connection: ' + socket.id);

    socket.on('disconnect', function () {
        var room = socket.room;
        if (room) {
            socket.leave(room.id);
            room.release();
        }
    });

    socket.on('join', function (user, room_id) {
        if (user && user.id && user.name) {
            console.log('Join request: ' + socket.id + '@' + user.id + ' -> ' + room_id);

            socket.user = { id: user.id, name: user.name };

            var room = Room.getRoom(user, room_id);
            socket.room =room;
            room.addRef();
            socket.join(room.id);

            socket.emit('join', room.id);
            console.log('Joined: ' + room.id);

            socket.emit('user', room.user);

            Room.dataFields.forEach(function (key) {
                socket.emit('setting', key, room[key]);
            });

            room.pieces.forEach(function (piece) {
                socket.emit('piece', piece.id, piece.x, piece.y, piece.color, piece.character_url);
            });
        }
    });

    socket.on('setting', function (key, value) {
        var room = socket.room;
        if (room && room.canModify(socket.user)) {
            for (var i = 0; i < Room.dataFields.length; ++i) {
                if (key == Room.dataFields[i]) {
                    room[key] = value;
                    server.to(room.id).emit('setting', key, value);
                    break;
                }
            }
        }
    });

    socket.on('piece', function (id, x, y, color, character_url) {
        var room = socket.room;
        if (room && room.canModify(socket.user)) {

            var piece = room.pieces[+id];

            if (!piece) {
                piece = { id: room.pieces.length };
                room.pieces.push(piece);
            }
            piece.x = Math.max(Math.min(x, room.width), 0);
            piece.y = Math.max(Math.min(y, room.height), 0);
            if (color) {
                piece.color = color;
            }
            if (character_url) {
                piece.character_url = character_url;
            }
            server.to(room.id).emit('piece', piece.id, piece.x, piece.y, color, character_url);
        }
    });
});
