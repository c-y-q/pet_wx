const conn = require("../conn/conn");
const moment = require("moment");
const config = require("../config/config");
const axios = require("axios");
const uuidTool = require("uuid/v4");
const md5 = require("md5-hex");
const chars = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z"
];
exports.getMyUUId = n => {
  let str = "";
  for (let i = 0; i < n; i++) {
    let num = parseInt(Math.random() * 36);
    str += chars[num];
  }
  return str;
};

exports.addWxOrder = async options => {
  const sql = `insert into wx_order set ? `;

  return await conn.query(sql, options);
};

//订单状态：0未支付，1.支付成功
exports.queryOrder = async (creatorId, orderNum) => {
  let sql = "select * from wx_order where 1=1   ";
  const queryParam = [];
  if (orderNum) {
    sql += " and order_num = ?  ";
    queryParam.push(orderNum);
  }
  if (creatorId) {
    sql += " and creator = ? ";
    queryParam.push(creatorId);
  }
  const result = await conn.query(sql, queryParam);
  return result;
};

exports.queryPrice = async code => {
  const sql = `select data from sys_params where type = 'paymentType' and code = ? `;
  const result = await conn.query(sql, [code]);
  return parseInt(result[0].data) || 0;
};

exports.queryRegInfoAuditStatus = async creatorId => {
  const sql = `select p.audit_status auditStatus from wx_pet_master m ,wx_pet_register_info p where  m.creator_id = ? and m.id = p.master_id   `;
  return await conn.query(sql, [creatorId]);
};

exports.updateOrder = async (orderNum, orderStatus, payTime) => {
  let sql = ` update wx_order set order_status = ?, pay_time = ?  where order_num = ?  `;
  return await conn.query(sql, [orderStatus, payTime, orderNum]);
};

exports.updateRegisterPayType = async (masterId, payType) => {
  const sql = `update wx_pet_register_info set pay_type = ? where master_id = ? `;
  return await conn.query(sql, [payType, masterId]);
};

exports.queryExpressCost = async () => {
  const sql = ` select data from sys_params where type = 'expresscost' `;
  const result = await conn.query(sql);
  return parseInt(result[0].data) || 0;
};

exports.queryOrderStatus = async (openId, orderSource, petRegId) => {
  let sql = " select * from wx_order where creator = ? and order_source = ?  ";
  if (petRegId) {
    sql += " and pet_id = ? ";
  }
  return await conn.query(sql, [openId, orderSource, petRegId]);
};

//统一下单封装
exports.unfolderToPay = async (openid, orderNum, totalPrice) => {
  //3.支付
  const {
    Authorization,
    mid,
    merchantUserId,
    tid,
    md5Keys
  } = config.wppay;
  const params = {
    msgId: uuidTool().replace(/-/gi, ""),
    requestTimestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
    merOrderId: orderNum,
    mid: mid,
    tid: tid,
    instMid: "MINIDEFAULT",
    totalAmount: totalPrice * 100, //单位为分
    subOpenId: openid,
    tradeType: "MINI",
    merchantUserId: merchantUserId,
    msgType: "WXPay",
    msgSrc: "WWW.TEST.COM",
    msgSrcId: "3194",
    notifyUrl: "http://pet.hbzner.com/wx/wpPayNotify",
    md5Key: md5Keys
  };

  /**
   * 传入对象 ,返回对象的属性数组
   */
  let rest = {};
  const keyArray = Object.keys(params).sort();
  for (const key of keyArray) {
    rest[key] = signStr[key];
  }

  /**
   * 输入排序过后的key=value 值数组,用  "&" 字符拼接为字符串
   */
  let longStr = "";
  for (const str in rest) {
    longStr += str + "=" + rest[str] + "&";
  }
  const signs = md5(longStr.substring(0, longStr.length - 1)); // 移除最后一个 & 符号
  longStr = longStr + "&sign=" + signs;
  console.log(120, longStr);
  const requestOptins = {
    method: "POST",
    headers: {
      Authorization: Authorization
    },
    data: params,
    url: "http://58.247.0.18:29015/v1/netpay/wx/unified-order" //https://api-mop.chinaums.com/v1/netpay/wx/unified-order
  };
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
  if (
    status != "WAIT_BUYER_PAY" ||
    errCode != "SUCCESS" ||
    targetStatus != "SUCCESS|SUCCESS" ||
    targetSys != "WXPay"
  ) {
    throw {
      status: 400,
      msg: "order is not right!"
    };
  }
  const resData = {
    appId: miniPayRequest.appid,
    nonceStr: miniPayRequest.noncestr,
    package: `prepay_id=${miniPayRequest.prepayid}`,
    signType: "MD5",
    timeStamp: parseInt(Date.now() / 1000).toString(),
    paySign: miniPayRequest.sign
  };
  return resData;
};