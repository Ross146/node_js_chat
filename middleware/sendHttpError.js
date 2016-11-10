module.exports = function(req, res, next) {
    res.sendHttpError = function(error) {
        res.status(error.status);
        // ajax проверка
        if(res.req.headers['x-request-with'] == 'XMLHttpRequest') {
            res.json(error);
        } else {
            res.render('error', {error: error});
        }
    };

    next()
};