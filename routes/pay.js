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
    console.log(19, req.body.orderNum)
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
        tid,
        md5Key,
        notifyUrl,
        unfolderUrl
    } = config.pay;
    const type = typeof (orderInfo[0].total_price);
    const types = orderInfo[0].total_price * 100;
    const params = {
        msgId: uuidTool().replace(/-/gi, ''),
        requestTimestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        merOrderId: orderInfo[0].order_num,
        mid: mid,
        tid: tid,
        instMid: "MINIDEFAULT",
        totalAmount: orderInfo[0].total_price * 100, //单位为分 
        openid: openid,
        subOpenId: openid,
        subAppId: "wx8a3e72751aa71401",
        tradeType: "MINI",
        merchantUserId: merchantUserId,
        msgType: "wx.unifiedOrder",
        msgSrc: "WWW.HBZNEWL.COM",
        msgSrcId: "6594",
        md5Key: md5Key,
        notifyUrl: notifyUrl //"http://wxpet.free.idcfengye.com/pay/wpPayNotify",
    }
    let rest = {};
    const keyArray = Object.keys(params).sort();
    for (const key of keyArray) {
        rest[key] = params[key];
    }
    let longStr = '';
    for (const str in rest) {
        longStr += str + '=' + rest[str] + '&';
    }
    let signs = md5(longStr.substring(0, longStr.length - 1) + md5Key); // 移除最后一个 & 符号 生成签名
    params.sign = signs;
    const requestOptins = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: params,
        url: unfolderUrl //https://api-mop.chinaums.com/v1/netpay/wx/unified-order
    } // http://58.247.0.18:29015/v1/netpay/wx/unified-order
    const data = await axios(requestOptins);
    if (data.data.status != 'WAIT_BUYER_PAY' || data.data.errCode != 'SUCCESS' || data.data.targetStatus != "SUCCESS|SUCCESS" || data.data.targetSys != 'WXPay') {
        throw {
            status: 400,
            msg: 'order is not right!'
        }
    }
    res.json({
        status: 200,
        result: data.data.miniPayRequest
    })
})

router.post('/wpPayNotify', async (req, res) => {
    const wexResPonse = req.body;
    const merOrderId = wexResPonse.merOrderId;
    console.log(154, wexResPonse)
    console.log(155, wexResPonse.targetOrderId);
    /**
     * 1.2查询本系统订单状态，获取金额进行对比
     */
    try {
        const orderInfo = await service.queryOrder('', merOrderId);
        if (!orderInfo.length) {
            res.send('FAILED');
            return;
        }
        if (!(wexResPonse.status == 'TRADE_SUCCESS' && wexResPonse.targetSys == 'WXPay' && wexResPonse.mid == config.pay.mid && wexResPonse.tid == config.pay.tid && orderInfo[0] && orderInfo[0].total_price * 100 == wexResPonse.totalAmount)) {
            res.send('FAILED');
            return;
        }
        /**
         * 防止假通知，验证签名
         */
        const md5Key = config.pay.md5Key;
        const wxResSign = wexResPonse.sign || '';
        if (wexResPonse.sign) {
            delete wexResPonse.sign;
        };
        const Values = Object.keys(wexResPonse).sort();
        let md5str = '';
        for (let key of Values) {
            md5str += `${key}=${wexResPonse[key]}&`
        }
        md5str = md5str.slice(0, -1) + md5Key;
        let mysign = md5(md5str).toUpperCase();
        if (!wxResSign || !(mysign == wxResSign)) {
            res.send('FAILED');
            return;
        }
        /**
         * 2.1更新订单状态
         */
        await service.updateOrder(merOrderId, 1, moment().format('YYYYMMDDHHmmss'), wexResPonse.targetOrderId);
        const cacheParams = await cache.get(`${merOrderId}`);
        if (cacheParams) {
            let addPetRegAllInfoResult, yearCheckResult, oldUpperResult;
            const resdisParams = JSON.parse(cacheParams);
            console.log(177, resdisParams)
            //查询petRegId信息是否已存在wx_pet_reg_info
            const judePetExists = await registerService.petRegIdPay(orderInfo[0].pet_id);
            //2.2 支付成功后，从redis中取出数据，保存到微信表中.
            if (orderInfo[0].order_source == 1 && judePetExists.length == 0) { //新登记
                //添加新注册信息
                addPetRegAllInfoResult = await registerService.addPetRegAllInfo(resdisParams);
            } else if (orderInfo[0].order_source == 2) { //年审
                yearCheckResult = await registerService.yearCheck(orderInfo[0].creator, resdisParams.petRegId, resdisParams.params, resdisParams.dogRegNum, merOrderId);
            } else if (orderInfo[0].order_source == 3) { //旧证升级
                oldUpperResult = await registerService.upperldDogRegNum(resdisParams.params, resdisParams.petRegId, resdisParams.uuid, merOrderId);
            }
            await cache.del(`${merOrderId}`);
            console.log('微信支付回调成功，数据库处理结果', JSON.stringify({
                addPetRegAllInfoResult,
                yearCheckResult,
                oldUpperResult
            }))
        }
        res.send('SUCCESS');
    } catch (error) {
        console.log(199, error)
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