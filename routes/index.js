const service = require('../service/wxpub');
const wechat = require('wechat');
const conn = require('../config/config');
module.exports = function (app) {
    app.use('/pet', require('./petRegister'));
     app.use('/wxpub/bindWxEvent', wechat(conn.wxpublic).text(function (message, req, res, next) {
        // TODO
        res.reply('');
    }).image(function (message, req, res, next) {
		res.reply('');
	}).voice(function (message, req, res, next) {
		res.reply('');
	}).video(function (message, req, res, next) {
		res.reply('');
	}).location(function (message, req, res, next) {
		res.reply('');
	}).link(function (message, req, res, next) {
		res.reply('');
	}).event(async function (message, req, res, next) {
        const result = await service.wxPubEvent(message);
        res.reply(result);
    }).device_text(function (message, req, res, next) {
        res.reply('');
    }).device_event(function (message, req, res, next) {
        res.reply('');
    }).middlewarify());
}
