(function (Socket) {
    var _socket = io.connect('http://' + location.host, {
            transports: ['websocket'],
            reconnectionDelay: 0,
            timeout: 1000
            });

    var _roomId;
    var _user;

    _socket.on('connect', function () {
        console.log('Connected');
        Socket.emit('join', user, location.hash);
    });

    _socket.on('join', function (room_id) {
        console.log('Joined: ' + room_id);
        _roomId = room_id;
    });

    _socket.on('user', function (user) {
        _user = user;
    });

    /// 
    Socket.on = function () {
        _socket.on.apply(_socket, arguments);
    };

    /// 
    Socket.emit = function () {
        _socket.emit.apply(_socket, arguments);
    };

    /// 
    Socket.reconnect = function () {
        _socket.emit('join', user, location.hash);
    };
})(this.Socket || (this.Socket = {}));
