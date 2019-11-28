const express = require('express');
const router = express.Router();
const uuidTool = require('uuid/v4');
const config = require('../config/config');
const moment = require('moment');
const service = require('../service/pay');
const registerService = require('../service/petRegister');
const axios = require('axios');
/**
 * 统一下单
 */
router.post('/wpPay', async (req, res) => {


    //1.判断微信用户是否关注公众号
    const {
        openid,
        unionid,
        orderNum
    } = req.body;
    if (!openid) {
        throw {
            status: '0001',
            respMsg: " lost openid"
        }
    }
    if (!unionid) {
        throw {
            status: '0001',
            respMsg: '缺失unionid！'
        }
    }
    const bindWxUserInfo = await registerService.isWxPubBind(unionid, openid);
    if (bindWxUserInfo.length == 0) {
        throw {
            status: '0001',
            respMsg: " to bind wxpulic !"
        }
    }
    /**
     * 2.判断订单号，金额，订单创建者是否存在系统中；如果存在，判断订单的支付状态
     */
    const orderInfo = await service.queryOrder(openid, orderNum);
    if (!orderInfo.length || orderInfo[0].order_status != 0) {
        throw {
            status: '0001',
            respMsg: " order is not exists !"
        }
    }
    //3.支付
    const {
        Authorization,
        mid,
        merchantUserId,
        tid  
    } = config.wppay;
    const params = {
        msgId: uuidTool().replace(/-/gi, ''),
        requestTimestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        merOrderId: orderInfo[0].order_num,
        mid: mid,
        tid: tid,
        instMid: "MINIDEFAULT",
        totalAmount: orderInfo[0].total_price * 100, //单位为分
        subOpenId: openid,
        tradeType: "MINI",
        merchantUserId: merchantUserId,
        msgType: "WXPay",
        msgSrc: "WWW.TEST.COM",
        msgSrcId: "3194",
        notifyUrl: "http://pet.hbzner.com/wx/wpPayNotify"
    }

    const requestOptins = {
        method: 'POST',
        headers: {
            'Authorization': Authorization
        },
        data: params,
        url: 'http://58.247.0.18:29015/v1/netpay/wx/unified-order' //https://api-mop.chinaums.com/v1/netpay/wx/unified-order
    }
    const {
        data: {
            targetSys,
            status,
            errCode,
            totalAmount,
            targetStatus,
            qrCode,
            miniPayRequest,
            merOrderId
        }
    } = await axios(requestOptins);
    if (status != 'WAIT_BUYER_PAY' || errCode != 'SUCCESS' || targetStatus != "SUCCESS|SUCCESS" || targetSys != 'WXPay') {
        throw {
            status: 400,
            msg: 'order is not right!'
        }
    }
    const resData = {
        appId: miniPayRequest.appid,
        nonceStr: miniPayRequest.noncestr,
        package: `prepay_id=${miniPayRequest.prepayid}`,
        signType: 'MD5',
        timeStamp: parseInt(Date.now() / 1000).toString(),
        paySign: miniPayRequest.sign
    }
    res.json({
        status: 200,
        result: resData
    })
})

router.post('/wpPayNotify', async (req, res) => {
    /*
     * 1.支付成功后的时间，即为首次登记时间
     */
    //1.1.支付成功
    const {
        status,
        targetSys,
        mid,
        tid,
        totalAmount,
        merOrderId,
        payTime,
        sign
    } = req.body;
    /**
     * 1.2查询本系统订单状态，获取金额进行对比
     */
    const orderInfo = await service.queryOrder('', merOrderId);
    if (!orderInfo.length || orderInfo[0].order_status != 0) {
        throw {
            status: '0001',
            respMsg: " order is not exists !"
        }
    }
    if (!(status == 'TRADE_SUCCESS' && targetSys == 'WXPay' && mid == config.wppay.mid && tid == config.wppay.tid && orderInfo[0].total_price * 100 == totalAmount)) {
        res.body = 'FAIL';
        return;
    }
    res.body = 'SUCCESS';
    /**
     * 2.1更新订单状态
     */
    await service.updateOrder(merOrderId, 1, payTime);
    //2.2 支付成功后，需要去修改regist_info中的pay_type为1，微信支付
    await service.updateRegisterPayType(orderInfo[0].creator, 1);
})

router.post('wxCreateOrder', async (req, res) => {
    //1.判断微信用户是否关注公众号
    const {
        openid,
        unionid,
        payType
    } = req.body;
    if (!openid) {
        throw {
            status: '0001',
            respMsg: " lost openid"
        }
    }
    if (!unionid) {
        throw {
            status: '0001',
            respMsg: '缺失unionid！'
        }
    }
    const bindWxUserInfo = await registerService.isWxPubBind(unionid, openid);
    if (bindWxUserInfo.length == 0) {
        throw {
            status: '0001',
            respMsg: " to bind wxpulic !"
        }
    }
    const orderNum = `${moment().format('YYYYMMDDHHmmss')}${new Date().getTime()}${service.getMyUUId(5)}`;
    const price = await service.queryPrice(payType);
    const orderModel = {
        order_num: orderNum,
        creator: openid,
        order_status: 0,
        create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        order_source: parseInt(options.orderSource) || 0,
        total_price: price[0] || 9999

    }
    await service.addWxOrder(orderModel);
    res.json({
        status: 200,
        result: orderModel
    })
})

//查询当前用户所有订单
router.post('/queryWxOrder', async (req, res) => {
    const {
        openid,
        unionid,
    } = req.body;
    if (!openid) {
        throw {
            status: '0001',
            respMsg: " lost openid"
        }
    }
    if (!unionid) {
        throw {
            status: '0001',
            respMsg: '缺失unionid！'
        }
    }
    const bindWxUserInfo = await registerService.isWxPubBind(unionid, openid);
    if (bindWxUserInfo.length == 0) {
        throw {
            status: '0001',
            respMsg: " to bind wxpulic !"
        }
    }
    const result = await service.queryOrder(openid, '');
    const payOk = result.length > 0 && result.filter(obj => obj.order_status != 0);
    const notPayOk = result.length > 0 && result.filter(obj => obj.order_status == 0);
    res.json({
        status: 200,
        payOk,
        notPayOk
    })
})

/**
 * 年审
 */
router.post('/yearCheck', async (req, res) => {
    const openId = req.body.openid;
    const unionId = req.body.unionid;
    const petRegId = req.body.petRegId;
    if (!openId || !unionId) {
        throw {
            respCode: '0001',
            respMsg: " lost params"
        }
    }
    const bindWxUserInfo = await registerService.isWxPubBind(unionId, openId);
    if (bindWxUserInfo.length == 0) {
        throw {
            status: 10010,
            respMsg: " to bind wxpulic !"
        }
    }
    const options = {
        year: req.body.year,
        photoUrl: req.body.photoUrl,
        photoUrl2: req.body.photoUrl2,
        updateTime: moment().format('YYYYMMDDHHmmss')
    }
    await registerService.yearCheck(openId, petRegId, options);
    //创建订单
    const orderNum = `${moment().format('YYYYMMDDHHmmss')}${new Date().getTime()}${service.getMyUUId(5)}`;
    const price = await service.queryPrice(2);
    const orderModel = {
        order_num: orderNum,
        creator: openid,
        order_status: 0,
        create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        order_source: 2,
        total_price: price[0] || 9999
    }
    await service.addWxOrder(orderModel);
    res.json({
        status: 200,
        result: '提交年审信息成功,请前往订单列表支付'
    })
})
module.exports = router;