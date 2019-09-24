const config = require('../config/config').wxpublic;
const conn = require('../conn/conn');
const WechatApi = require('co-wechat-api');
const wxApi = new WechatApi(config.appid, config.appsecret);
const moment = require('moment');
/**
 * 处理公众号关注与取消关注事件
 */
exports.wxPubEvent = async (message) => {
    console.log(10, message)
    const wxpubOpenId = message.FromUserName;
    //根据不同事件类型，分别处理
    switch (message.Event) {
        case 'subscribe': //关注事件
            //获得微信用户微信信息
            const resUserInfo = await wxApi.getUser(wxpubOpenId);
            console.log("微信用户信息:", resUserInfo)
            const wxpetUnionId = resUserInfo && resUserInfo.unionid || '';
            const flagFocusPub = await isFocusWxPub(wxpetUnionId, wxpubOpenId);
            if (flagFocusPub.length == 0) {
                await addWxPub(wxpubOpenId, wxpetUnionId);
            } else {
                await updateWxpub(wxpubOpenId, wxpetUnionId);
            }
            return resUserInfo.nickname + '，欢迎关注 宠物登记信息!';
        case 'unsubscribe': //取消关注事件  
            console.log("用户【", message.FromUserName, "】取消关注公众号。")
            await updateWxpub(wxpubOpenId, '');
            return "";
        default:
            console.log("消息事件：", message.Event)
            return "";
    }
}

/**
 * 判断是否关注宠物公众号
 */
async function isFocusWxPub(unionId, openId) {
    const sql = `select * from wx_pub where unionId = '${unionId}' or openId = '${openId}'  `;
    const result = await conn.query(sql);
    return result;
}

/**
 * 公众号取消/订阅事件，将unionid写入pet_master中做记录
 */
async function updateWxpub(openId, unionId) {
    const updateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    const sql = `update wx_pub set unionId = '${unionId}',update_time = '${updateTime}'  where openId = '${openId}' `;
    console.log(113, sql)
    return await conn.query(sql);
}

/**
 * 关注公众号,添加宠物主人信息,
 * openid公众号
 */
async function addWxPub(openId, unionId) {
    const sql = `insert into wx_pub set ? `;
    const petMaseterModel = {
        openId: openId,
        unionId: unionId,
        create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        update_time: ''
    }
    return await conn.query(sql, petMaseterModel);
}