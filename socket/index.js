var HttpError = require('error').HttpError;
var cookie = require('cookie');
var config = require('config');
var cookieParser = require('cookie-parser');
var sessionStore = require('libs/sessionStore');
var async = require('async');
var User = require('models/user').User;

module.exports = function (server) {
    var io = require('socket.io')(server);

    io.set('origins', 'localhost:*');
    io.set('transports', ['websocket']);


    io.use(function(socket, next) {
        var handshake = socket.request;
        handshake.cookies = cookie.parse(handshake.headers.cookie || '');
        var sidCookie = handshake.cookies[config.get('session:key')];
        var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));
        async.waterfall([
            function(callback) {
                sessionStore.load(sid, function (err, session) {
                    if (err) return next(err);
                    if (!session) next(new HttpError(401, "No Session"));
                    handshake.session = session;
                    callback(null, session)

                })
            },
            function (session, callback) {
                User.findById(session.user, function (err, user) {
                    if (err) return next(err);
                    callback(null, user)
                })
            }
        ], function (err, user) {
            if (err) next(err)
            if (!user) next(new HttpError(403, "Anonymous sesion may not connect"));
            handshake.user = user;
            next();
        });
    });

    io.sockets.on('connection', function (socket) {

        var username = socket.request.user.username

        socket.broadcast.emit('join', username);

        socket.on('message', function (text, callback) {
            socket.broadcast.emit('message', username, text);
            callback && callback();
        });

        socket.on('disconnect', function () {
            socket.broadcast.emit('leave', username);
        });
    });

    return io;
};
