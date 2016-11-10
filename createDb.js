var mongoose = require('libs/mongoose');
mongoose.set('debug', true);

var async = require('async');

async.series([
    open,
    dropDatabase,
    requireModels,
    createUsers
], function (err) {
    mongoose.disconnect();
    process.exit(err ? 255 : 0);
});

function  open(callback) {
    mongoose.Promise = global.Promise;
    mongoose.connection.on('open', callback);
}

function dropDatabase(callback) {
    var db = mongoose.connection.db;
    db.dropDatabase(callback);
}

function requireModels(callback) {
    require('models/user');
    async.each(Object.keys(mongoose.models), function (modelName, callback) {
            mongoose.models[modelName].ensureIndexes(callback)
        }, callback)
}

function createUsers(callback) {
    var users= [
        {username: 'Петя', password: '1234'},
        {username: 'Петя', password: '4321'},
        {username: 'admin', password: '1111'}
    ];

    async.each(users, function (userData, callback) {
        var user = new mongoose.models.User(userData);
        user.save(callback)
    }, callback);
}



