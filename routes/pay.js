const express = require('express');
const router = express.Router();
const uuidTool = require('uuid/v4');
const config = require('../config/config');
const moment = require('moment');
const service = require('../service/pay');
const registerService = require('../service/petRegister');
const axios = require('axios');
const md5 = require('md5-hex');
const {
    cache,
    reqCount,
    expireTime
} = require('../conn/redis');
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
        // Authorization,
        mid,
        merchantUserId,
        tid
    } = config.pay;
    const params = {
        msgId: uuidTool().replace(/-/gi, ''),
        requestTimestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        merOrderId: orderInfo[0].order_num,
        mid: mid,
        tid: tid,
        instMid: "MINIDEFAULT",
        totalAmount: orderInfo[0].total_price * 100, //单位为分
        openid: openid,
        tradeType: "MINI",
        merchantUserId: merchantUserId,
        msgType: "wx.unifiedOrder",
        msgSrc: "WWW.TEST.COM",
        msgSrcId: "3194",
        notifyUrl: "http://pet.hbzner.com/wx/wpPayNotify"
    }

    let rest = {};
    const keyArray = Object.keys(params).sort();
    for (const key of keyArray) {
        rest[key] = params[key];
    }

    /**
    * 输入排序过后的key=value 值数组,用  "&" 字符拼接为字符串
    */
    let longStr = '';
    for (const str in rest) {
        longStr += str + '=' + rest[str] + '&';
    }
    console.log('---待签名参数---', longStr);
    let signs = md5(longStr.substring(0, longStr.length - 1)+'fcAmtnx7MwismjWNhNKdHC44mNXtnEQeJkRrhKJwyrW2ysRR');// 移除最后一个 & 符号 生成签名
    params.sign = signs;
    // const sign = longStr + 'sign=' + signs;
    // console.log(117, sign);

    const requestOptins = {
        method: 'POST',
        headers: {
            // 'Authorization': Authorization
        'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: params,
        url: 'https://qr-test2.chinaums.com/netpay-route-server/api/' //https://api-mop.chinaums.com/v1/netpay/wx/unified-order
    }// http://58.247.0.18:29015/v1/netpay/wx/unified-order
    const data = await axios(requestOptins);
    console.log(120, data);
        if (data.data.status != 'WAIT_BUYER_PAY' || data.data.errCode != 'SUCCESS' || data.data.targetStatus != "SUCCESS|SUCCESS" || data.data.targetSys != 'WXPay') {
            throw {
                status: 400,
                msg: 'order is not right!'
            }
        }
        const resData = {
            appId: data.data.miniPayRequest.appid,
            nonceStr: data.data.miniPayRequest.nonceStr,
            package: data.data.miniPayRequest.package,
            signType: data.data.miniPayRequest.signType,
            timeStamp: data.data.miniPayRequest.timeStamp,
            paySign: data.data.miniPayRequest.paySign,
        }

    res.json({
        status: 200,
        result: resData
    })
})

router.post('/wpPayNotify', async (req, res) => {
    const merOrderId = req.body.orderNum;
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
        payTime,
        sign
    } = req.body;
    /**
     * 1.2查询本系统订单状态，获取金额进行对比
     */
    const orderInfo = await service.queryOrder('', merOrderId);
    if (!orderInfo.length) {
        throw {
            status: '0001',
            respMsg: " order is not exists !"
        }
    }
    const cacheParams = await cache.get(`${merOrderId}`);
    if (orderInfo.length && orderInfo[0].order_status == 1) {
        res.json({
            status: 200,
        })
        return;
    }
    // if (!(status == 'TRADE_SUCCESS' && targetSys == 'WXPay' && mid == config.wppay.mid && tid == config.wppay.tid && orderInfo[0].total_price * 100 == totalAmount)) {
    //     res.body = 'FAIL';
    //     return;
    // }
    // res.body = 'SUCCESS';
    /**
     * 2.1更新订单状态
     */
    if (orderInfo[0].order_status == 0) {
        await service.updateOrder(merOrderId, 1, payTime || moment().format('YYYYMMDDHHmmss'));
    }
    if (cacheParams) {
        let addPetRegAllInfoResult, yearCheckResult, oldUpperResult;
        const resdisParams = JSON.parse(cacheParams);
        //查询petRegId信息是否已存在wx_pet_reg_info
        const judePetExists = await registerService.petRegIdPay(orderInfo[0].pet_id);
        //2.2 支付成功后，从redis中取出数据，保存到微信表中.
        if (orderInfo[0].order_source == 1 && judePetExists.length == 0) { //新登记
            //添加新注册信息
            addPetRegAllInfoResult = await registerService.addPetRegAllInfo(resdisParams);
        } else if (orderInfo[0].order_source == 2) { //年审
            yearCheckResult = await registerService.yearCheck(orderInfo[0].creator, resdisParams.petRegId, resdisParams.params, resdisParams.dogRegNum, merOrderId);
        } else if (orderInfo[0].order_source == 3) { //旧证升级
            oldUpperResult = await registerService.upperldDogRegNum(resdisParams.params, resdisParams.petRegId, resdisParams.uuid);
        }
        res.json({
            status: 200,
            addPetRegAllInfoResult,
            yearCheckResult,
            oldUpperResult
        })
    }

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

module.exports = router;