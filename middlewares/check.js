module.exports = {
    checkLogin: function checkLogin(req, res, next) {
       if (!req.session.openId) {
            console.log('未登录')
            res.json({
                status: 403,
                respMsg: "请重新登录！"
            });
            return;
        } else {
            next()
        }
    }
}
