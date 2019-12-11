const express = require("express");
const router = express.Router();
const service = require("../service/petRegister");
const multer = require("multer");
const uuidTool = require("uuid/v4");
const axios = require("axios");
const orderService = require("../service/pay");
const caches = require('../conn/redis');

const {
  cache
} = caches;

function regIdCard(idcode) {
  const weight_factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const check_code = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const idcard_patter = /^[1-9][0-9]{5}([1][9][0-9]{2}|[2][0][0|1][0-9])([0][1-9]|[1][0|1|2])([0][1-9]|[1|2][0-9]|[3][0|1])[0-9]{3}([0-9]|[X])$/;
  const format = idcard_patter.test(idcode);
  const seventeen = idcode.substring(0, 17);
  let num = 0;
  for (let i = 0; i < seventeen.length; i++) {
    num = num + seventeen[i] * weight_factor[i];
  }
  return idcode[17] === check_code[num % 11] && format ? true : false;
}

const regPhoneNum = /(^1[3456789]\d{9}$)|(^(0\d{2,3}\-)?([2-9]\d{6,7})+(\-\d{1,6})?$)/;
const regDogRegNum = /^\d{6}$/;
const moment = require("moment");
const imgHttp = 'http://192.168.50.111:7001'; //"https://api.hbzner.com/dog";
// const {
//   cache,
//   reqCount,
//   expireTime
// } = require('../conn/redis');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/home/manage_sys/app/public/images");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${orderService.getMyUUId(10)}.jpg`);
  }
});
const upload = multer({
  storage: storage
});
/**
 * 微信小程序端上传图片
 */
router.post("/uploadImg", upload.single("file"), async (req, res, next) => {
  const file = req.file;
  res.json({
    code: "200",
    url: `/home/manage_sys/app/public/images/${file.filename}`
  });
});
/**
 * 添加宠物注册信息到pet_regist
 */
router.post("/addpetRegist2", async (req, res, next) => {
  const params = req.body;
  if (!params.openid) {
    throw {
      status: "0001",
      respMsg: " lost openid"
    };
  }
  if (!params.unionid) {
    throw {
      status: "0001",
      respMsg: "缺失unionid！"
    };
  }

  // let cacheKey = `petwx_${params.openid}`;
  // const cacheWxResCount = await cache.get(cacheKey);
  // //限制每个微信用户每3分钟才能访问一次添加宠物注册信息
  // if (!cacheWxResCount) {
  //   cache.set(cacheKey, 1, 'EX', expireTime);
  // } else {
  //   if (cacheWxResCount > reqCount) {
  //     throw {
  //       status: '0001',
  //       respMsg: "请勿频繁提交!"
  //     }
  //   }
  //   cache.incr(cacheKey);
  // }
  const bindWxUserInfo = await service.isWxPubBind(
    params.unionid,
    params.openid
  );
  if (bindWxUserInfo.length == 0) {
    throw {
      status: "0001",
      respMsg: " to bind wxpulic !"
    };
  }
  const orderStatusInfo = await orderService.queryOrderStatus(params.openid, 1, '');
  if (orderStatusInfo.length && orderStatusInfo[0].order_status == 0) {
    throw {
      status: 10010,
      respMsg: `您有未支付的新登记订单，请勿多次提交登记信息！`
    };
  }
  if (!params.petPhotoUrl) {
    throw {
      status: "0001",
      respMsg: " lost petPhotoUrl"
    };
  }
  if (!params.idNumberPic1) {
    throw {
      status: "0001",
      respMsg: " lost idNumberPic1"
    };
  }
  if (!params.idNumberPic2) {
    throw {
      status: "0001",
      respMsg: " lost idNumberPic2"
    };
  }
  if (!params.areaCode) {
    throw {
      respCode: "0001",
      respMsg: " lost areaCode"
    };
  }
  if (params.dogRegNum) {
    if (!regDogRegNum.test(params.dogRegNum)) {
      throw {
        respCode: "0001",
        respMsg: " dogRegNum not  correct!"
      };
    }
    const result = await service.judgedogRegNum(dogRegNum);
    if (result && result.length > 0) {
      throw {
        respCode: "0001",
        respMsg: " dogRegNum has exists !"
      };
    }
  }
  if (!params.realName) {
    throw {
      respCode: "0001",
      respMsg: " lost realName"
    };
  }
  if (!regIdCard(params.idNumber)) {
    throw {
      respCode: "0001",
      respMsg: " lost idNumber"
    };
  }
  //根据身份证号，判断如果已有一条该犬主信息，则不能再申请添加
  const hasUserBindSysInfo = await service.hasUserBindSysInfo(params.idNumber);
  if (hasUserBindSysInfo.length > 0) {
    throw {
      respCode: "0001",
      respMsg: "每个人只能申请一条犬证信息！"
    };
  }
  if (!regPhoneNum.test(params.contactPhone)) {
    throw {
      respCode: "0001",
      respMsg: " lost contactPhone"
    };
  }
  const uuid = uuidTool().replace(/-/gi, "");
  const orderNum = `3194${moment().format("YYYYMMDDHHmmss")}${new Date().getTime()}`;
  // const orderNum = `${moment().format(
  //   "YYYYMMDDHHmmss"
  // )}${new Date().getTime()}${orderService.getMyUUId(3)}`;
  const addPetMasterResult = await service.addPetMaster(
    params.openid,
    uuid,
    params
  );
  const petRegId = uuidTool().replace(/-/gi, "");
  const addPetRegResult = await service.addPetregister(
    params.openid,
    petRegId,
    uuid,
    params,
    orderNum
  );
  const addPetPreventionResult = await service.addPetPreventionInfo(
    params.openid,
    petRegId,
    params
  );
  const price = await orderService.queryPrice(1);
  const receive = parseInt(params.receive) || 0;
  let totalPrice = 0,
    expresscost = 0;
  if (receive == 1) {
    //自取
    totalPrice = price;
  } else if (receive == 2) {
    //快递
    //查询快递金额并加上
    expresscost = await orderService.queryExpressCost();
    totalPrice = price + expresscost;
  } else {
    totalPrice = 9999;
  }

  const orderModel = {
    order_num: orderNum,
    creator: params.openid,
    order_status: 0,
    create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
    order_source: 1,
    total_price: totalPrice,
    pet_id: petRegId,
    expresscost
  };
  await orderService.addWxOrder(orderModel);
  res.json({
    status: 200,
    orderNum,
    respMsg: "提交信息成功！"
  });
});

router.post("/wxLogin", async (req, res, next) => {
  const code = req.body.code;
  const appId = "wx8a3e72751aa71401";
  const appSecreat = "0eac0a4f5ed9a3f46dc882833d035956";
  //获取用户的openId和sessionKey
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecreat}&js_code=${code}&grant_type=authorization_code`;
  const {
    data
  } = await axios.get(url);
  console.log(157, data);
  if (data.errcode) {
    throw {
      status: 403,
      data,
      respMsg: "code 非法！"
    };
  }
  if (!data.unionid) {
    throw {
      status: "0001",
      respMsg: "缺失unionid !"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(data.unionid, data.openid);
  if (bindWxUserInfo.length == 0) {
    res.json({
      status: 10010,
      data,
      respMsg: " to bind wxpulic !"
    });
    return;
  }
  res.json({
    data
  });
});
router.post("/queryRegStatu", async (req, res) => {
  const openId = req.body.openid;
  const result = await service.queryRegStatu(openId);
  let petRegInfo = [];
  if (result.length > 0) {
    petRegInfo = result.map(obj => {
      let checkStatus = obj.audit_status;
      return {
        expressname: obj.expressname || "",
        payType: obj.pay_type,
        // "branchAddr": obj.branchAddr || '【邯郸市公安局】滏东北大街与联纺东路交叉口北行200米',
        petColor: obj.coat_color,
        petGender: obj.gender == 1 ? "雄" : obj.gender == 2 ? "雌" : "未知",
        petType: obj.breed,
        petRegId: obj.id,
        checkStatus: checkStatus, //== 1 ? '已通过' : checkStatus == 2 ? '未通过' : '审核中',
        auditRemarks: obj.audit_remarks,
        areaName: obj.name || "",
        dogRegNum: obj.dog_reg_num || 0,
        petName: obj.pet_name || "",
        petState: obj.pet_state,
        renewTime: obj.renew_time ?
          moment(obj.renew_time, "YYYYMMDDHHmmss").format(
            "YYYY-MM-DD HH:mm:ss"
          ) : "",
        createTime: moment(obj.create_time, "YYYYMMDDHHmmss").format(
          "YYYY-MM-DD HH:mm:ss"
        ),
        petPhotoUrl: (obj.pet_photo_url &&
            obj.pet_photo_url.replace("/home/manage_sys/app", imgHttp)) ||
          "",
        masterName: obj.real_name || "",
        masterAdress: obj.residential_address || "",
        contactPhone: obj.contact_phone || "",
        receive: obj.receive,
        receiveName: obj.receive_name || "",
        courierNumber: obj.courier_number || "",
        receivePhone: obj.receive_phone || "",
        receiveAddr: obj.receive_addr || "",
        checker: obj.checker || "",
        deliver: obj.deliver,
        auditType: obj.audit_type
      };
    });
  }
  res.json({
    status: 200,
    result: petRegInfo
  });
});
router.get("/getPetColor", async (req, res) => {
  const result = await service.findPetColor();
  const petColor = result.reduce((pre, cur) => {
    pre[cur.id] = cur.color;
    return pre;
  }, {});
  res.json({
    status: 200,
    petColor
  });
});
router.get("/getPetType", async (req, res) => {
  const result = await service.findPetType();
  const petType = result.reduce((pre, cur) => {
    pre[cur.id] = cur.name;
    return pre;
  }, {});
  res.json({
    status: 200,
    petType
  });
});
router.post("/addDogRegNum", async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const dogRegNum = req.body.dogRegNum;
  const dogRegId = req.body.petRegId;
  const idNumber = req.body.idNumber;
  if (!regIdCard(idNumber)) {
    throw {
      respCode: "0001",
      respMsg: " lost idNumber"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    };
  }
  if (!openId || !unionId) {
    throw {
      status: 10011,
      respMsg: " openId, unionId is not null !"
    };
  }
  if (!dogRegNum) {
    throw {
      status: 10011,
      respMsg: " dogRegNum is not null !"
    };
  }
  if (!regDogRegNum.test(dogRegNum)) {
    throw {
      respCode: "0001",
      respMsg: " dogRegNum not  correct!"
    };
  }
  if (!dogRegId) {
    throw {
      status: 10011,
      respMsg: " petRegId is not null !"
    };
  }
  const judePetExists = await service.judePetExists(dogRegId);
  if (!judePetExists) {
    throw {
      status: 10011,
      respMsg: " the dog not exists !"
    };
  }
  const ispaid = await service.petRegIdPay(dogRegId);
  if (!(ispaid && ispaid.pay_type != -1)) {
    throw {
      status: 10011,
      respMsg: "该号码未付款！"
    };
  }
  const flag = await service.isBinwxRef(dogRegNum, dogRegId, openId, unionId);
  if (flag) {
    throw {
      status: 10011,
      respMsg: " you have bind this dog regsiter number !"
    };
  }
  const result = await service.eiditDogRegNum(
    dogRegNum,
    dogRegId,
    openId,
    unionId,
    idNumber
  );
  res.json({
    status: 200,
    respMsg: "bind success !"
  });
});

router.post("/findNotBindRegIdsByOpenId", async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    };
  }
  if (!openId || !unionId) {
    throw {
      status: 10011,
      respMsg: " openId, unionId is not null !"
    };
  }
  if (!dogRegNum) {
    throw {
      status: 10011,
      respMsg: " dogRegNum is not null !"
    };
  }
  if (!regDogRegNum.test(dogRegNum)) {
    throw {
      respCode: "0001",
      respMsg: " dogRegNum not  correct!"
    };
  }
  if (!dogRegId) {
    throw {
      status: 10011,
      respMsg: " petRegId is not null !"
    };
  }
  const result = await service.findNotBindRegIdsByOpenId(openId);
  res.json({
    status: 200,
    result: result
  });
});
router.post("/findNotHasBindDogRegNum", async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const dogRegNum = req.body.dogRegNum;
  if (!openId || !unionId) {
    throw {
      respCode: "0001",
      respMsg: " lost params"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    };
  }
  if (!dogRegNum) {
    throw {
      respCode: "0001",
      respMsg: " lost dogRegNum"
    };
  }
  if (!regDogRegNum.test(dogRegNum)) {
    throw {
      respCode: "0001",
      respMsg: " dogRegNum not  correct!"
    };
  }
  const result = await service.findNotHasBindDogRegNum(dogRegNum);
  res.json({
    status: 200,
    binding: result.length > 0
  });
});
router.post("/findPetInfosByIdNum", async (req, res) => {
  const idNumber = req.body.idNumber;
  const realName = req.body.realName;
  const dogRegNum = req.body.dogRegNum;
  const contactPhone = req.body.contactPhone;
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  if (!regIdCard(idNumber)) {
    throw {
      respCode: "0001",
      respMsg: " lost idNumber"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    };
  }
  if (!regPhoneNum.test(contactPhone)) {
    throw {
      respCode: "0001",
      respMsg: " lost contactPhone"
    };
  }
  const result = await service.findPetInfosByIdNum(
    idNumber,
    realName,
    contactPhone,
    dogRegNum
  );
  let petRegInfo = [];
  if (result.length > 0) {
    for (let obj of result) {
      let checkStatus = obj.audit_status;
      const judeWxUserIsBindPet = await service.judeWxUserIsBindPet(
        openId,
        unionId,
        obj.id
      );
      console.log(396, judeWxUserIsBindPet);
      petRegInfo.push({
        isBindMe: judeWxUserIsBindPet.length > 0,
        petType: obj.breed,
        payType: obj.pay_type,
        petColor: obj.coat_color || "",
        petGender: obj.gender == 1 ? "雄" : obj.gender == 2 ? "雌" : "未知",
        petRegId: obj.id,
        checkStatus: checkStatus == 1 ? "已通过" : checkStatus == 2 ? "未通过" : "审核中",
        auditRemarks: obj.audit_remarks,
        areaName: obj.name || "",
        dogRegNum: obj.dog_reg_num || "",
        petName: obj.pet_name || "",
        petState: obj.pet_state,
        renewTime: obj.renew_time ?
          moment(obj.renew_time, "YYYYMMDDHHmmss").format(
            "YYYY-MM-DD HH:mm:ss"
          ) : "",
        createTime: moment(obj.create_time, "YYYYMMDDHHmmss").format(
          "YYYY-MM-DD HH:mm:ss"
        ),
        petPhotoUrl: (obj.pet_photo_url &&
            obj.pet_photo_url.replace("/home/manage_sys/app", imgHttp)) ||
          "",
        masterName: obj.real_name || "",
        masterAdress: obj.residential_address || "",
        contactPhone: obj.contact_phone || ""
      });
    }
  }
  res.json({
    status: 200,
    result: petRegInfo
  });
});
router.post("/queryRegList", async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const idNumber = req.body.idNumber;
  if (!openId || !unionId) {
    throw {
      respCode: "0001",
      respMsg: " lost params"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    };
  }
  const result = await service.queryRegList(openId, unionId);
  let petRegInfo = [];
  if (result.length > 0) {
    petRegInfo = result.map(obj => {
      let checkStatus = obj.audit_status;
      return {
        expireTime: obj.expire_time ?
          moment(obj.expire_time, "YYYYMMDDHHmmss").format("YYYY-MM-DD") : "",
        birthday: obj.birthday ?
          moment(obj.birthday, "YYYYMMDD").format("YYYY-MM-DD") : "",
        idNumber: obj.id_number.replace(/^(.{6})(?:\d+)(.{4})$/, "$1********$2"),
        petType: obj.breed,
        payType: obj.pay_type,
        petColor: obj.coat_color,
        petGender: obj.gender == 1 ? "雄" : obj.gender == 2 ? "雌" : "未知",
        petRegId: obj.id,
        checkStatus: checkStatus, //== 1 ? '已通过' : checkStatus == 2 ? '未通过' : '审核中',
        auditRemarks: obj.audit_remarks,
        areaName: obj.name || "",
        dogRegNum: obj.dog_reg_num || "",
        petName: obj.pet_name || "",
        petState: obj.pet_state,
        renewTime: obj.renew_time ?
          moment(obj.renew_time, "YYYYMMDDHHmmss").format(
            "YYYY-MM-DD HH:mm:ss"
          ) : "",
        createTime: moment(obj.create_time, "YYYYMMDDHHmmss").format(
          "YYYY-MM-DD HH:mm:ss"
        ),
        petPhotoUrl: (obj.pet_photo_url &&
            obj.pet_photo_url.replace("/home/manage_sys/app", imgHttp)) ||
          "",
        masterName: obj.real_name || "",
        masterAdress: obj.residential_address || "",
        contactPhone: obj.contact_phone && obj.contact_phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") || ""
      };
    });
  }
  res.json({
    status: 200,
    result: petRegInfo
  });
});
router.post("/directBindDogRegNum", async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const dogRegNum = req.body.dogRegNum;
  const {
    phone,
    code
  } = req.body;

  let isfree = '';
  const cacheWxResCount = await cache.get(phone);
  if (code == cacheWxResCount) {
    isfree = await service.isfree(dogRegNum, phone);
    if (isfree.length > 0) {
      console.log('验证通过!');
    } else {
      res.json({
        status: 10011,
        respMsg: '验证失败!'
      });
    }
  } else {
    throw {
      status: 10011,
      respMsg: "验证码验证失败!"
    }
  }



  if (!openId || !unionId) {
    throw {
      respCode: "0001",
      respMsg: " lost params"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    };
  }
  if (!dogRegNum) {
    throw {
      respCode: "0001",
      respMsg: " lost dogRegNum"
    };
  }
  if (!regDogRegNum.test(dogRegNum)) {
    throw {
      respCode: "0001",
      respMsg: " dogRegNum not  correct!"
    };
  }
  const flag = await service.isBinwxRef(dogRegNum, isfree[0].id, openId, unionId);
  if (flag) {
    throw {
      status: 10011,
      respMsg: " 已绑定过该号码，请勿重复绑定 !"
    };
  }
  const judePetExists = await service.judePetExists(isfree[0].id);
  if (!judePetExists) {
    throw {
      status: 10011,
      respMsg: " the dog not exists !"
    };
  }
  const result = await service.directBindDogRegNum(
    openId,
    unionId,
    isfree[0].id,
    dogRegNum
  );
  console.log('---------------696------------', isfree);
  res.json({
    status: 200,
    respMsg: "bind success !"
  });
});

router.post("/findAllArea", async (req, res, next) => {
  const result = await service.findAllArea();
  res.json({
    status: 200,
    result: result
  });
});

router.post("/queryRegInfoByRegId", async (req, res, next) => {
  const petRegId = req.body.petRegId;
  const result = await service.queryRegInfoByRegId(petRegId);
  res.json({
    status: 200,
    result: result
  });
});

router.post("/updatePetRegInfo", async (req, res, next) => {
  const params = req.body;
  if (!params.petRegId) {
    return;
  }
  if (!params.unionid || !params.unionid) {
    throw {
      status: 10011,
      respMsg: " openId, unionId is not null !"
    };
  }
  // let cacheKey = `petwx_${params.openid}`;
  // const cacheWxResCount = await cache.get(cacheKey);
  // //限制每个微信用户每3分钟才能访问一次添加宠物注册信息
  // if (!cacheWxResCount) {
  //   cache.set(cacheKey, 1, 'EX', expireTime);
  // } else {
  //   if (cacheWxResCount > reqCount) {
  //     throw {
  //       status: '0001',
  //       respMsg: "请勿频繁提交!"
  //     }
  //   }
  //   cache.incr(cacheKey);
  // }
  const bindWxUserInfo = await service.isWxPubBind(
    params.unionid,
    params.openid
  );
  if (bindWxUserInfo.length == 0) {
    throw {
      status: "0001",
      respMsg: " to bind wxpulic !"
    };
  }
  if (!params.petPhotoUrl) {
    throw {
      status: "0001",
      respMsg: " lost petPhotoUrl"
    };
  }
  if (!params.idNumberPic1) {
    throw {
      status: "0001",
      respMsg: " lost idNumberPic1"
    };
  }
  if (!params.idNumberPic2) {
    throw {
      status: "0001",
      respMsg: " lost idNumberPic2"
    };
  }
  if (!params.areaCode) {
    throw {
      respCode: "0001",
      respMsg: " lost areaCode"
    };
  }
  if (params.dogRegNum) {
    if (!regDogRegNum.test(params.dogRegNum)) {
      throw {
        respCode: "0001",
        respMsg: " dogRegNum not  correct!"
      };
    }
    const result = await service.judgedogRegNum(dogRegNum);
    if (result && result.length > 0) {
      throw {
        respCode: "0001",
        respMsg: " dogRegNum has exists !"
      };
    }
  }
  if (!params.realName) {
    throw {
      respCode: "0001",
      respMsg: " lost realName"
    };
  }
  if (!regIdCard(params.idNumber)) {
    throw {
      respCode: "0001",
      respMsg: " lost idNumber"
    };
  }
  //根据身份证号，判断如果已有一条该犬主信息，则不能再申请添加
  const hasUserBindSysInfo = await service.hasUserBindSysInfo(params.idNumber);
  if (hasUserBindSysInfo.length == 0) {
    throw {
      respCode: "0001",
      respMsg: "该身份证申请的宠物信息不存在！"
    };
  }
  if (!regPhoneNum.test(params.contactPhone)) {
    throw {
      respCode: "0001",
      respMsg: " lost contactPhone"
    };
  }

  const result = await service.updatePetRegInfo(params);

  res.json({
    status: 200,
    result,
    respMsg: "更新成功！"
  });
});

router.post("/unbindPetDogRegNum", async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const dogRegId = req.body.petRegId;
  const dogRegNum = req.body.dogRegNum;
  if (!openId || !unionId) {
    throw {
      respCode: "0001",
      respMsg: " lost params"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    };
  }
  if (!dogRegNum) {
    throw {
      respCode: "0001",
      respMsg: " lost dogRegNum"
    };
  }
  if (!regDogRegNum.test(dogRegNum)) {
    throw {
      respCode: "0001",
      respMsg: " dogRegNum not  correct!"
    };
  }
  const flag = await service.isBinwxRef(dogRegNum, dogRegId, openId, unionId);
  if (!flag) {
    throw {
      status: 10011,
      respMsg: " 您未绑定，不能解绑 !"
    };
  }

  const result = await service.unbindPetDogRegNum(
    openId,
    unionId,
    dogRegId,
    dogRegNum
  );
  res.json({
    status: 200,
    respMsg: result ? "成功解除绑定" : "解除绑定失败"
  });
});

/**
 * 年审
 */
router.post("/yearCheck", async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const petRegId = req.body.petRegId;
  const dogRegNum = req.body.dogRegNum;
  if (!openId || !unionId) {
    throw {
      respCode: "0001",
      respMsg: " lost params"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    };
  }
  if (!regDogRegNum.test(dogRegNum)) {
    throw {
      respCode: "0001",
      respMsg: " dogRegNum not  correct!"
    };
  }
  //判断是否有正在审核的犬证，如果有，不能进行年审
  const isHasYearCheck = await service.findPreventionInfo(petRegId);
  if (isHasYearCheck[0].pet_state == 3) {
    throw {
      respCode: "0001",
      respMsg: " 您有正在年审的信息，请勿重复提交!"
    };
  }
  const options = {
    year: moment()
      .add(1, "years")
      .format("YYYY"),
    photoUrl: req.body.photoUrl,
    photoUrl2: req.body.photoUrl2,
    updateTime: moment().format("YYYYMMDDHHmmss")
  };
  const orderNum = `3194${moment().format("YYYYMMDDHHmmss")}${new Date().getTime()}`;
  // const orderNum = `${moment().format(
  //   "YYYYMMDDHHmmss"
  // )}${new Date().getTime()}${orderService.getMyUUId(3)}`;
  // const yearCheckResult = await service.yearCheck(petRegId, options, dogRegNum);
  const price = await orderService.queryPrice(2);
  const orderModel = {
    order_num: orderNum,
    creator: openId,
    order_status: 0,
    create_time: moment().format("YYYYMMDDHHmmss"),
    order_source: 2,
    total_price: price,
    pet_id: petRegId,
    expresscost: 0
  };
  await orderService.addWxOrder(orderModel);
  // const resData = await orderService.unfolderToPay(openId, orderNum, totalPrice);
  const yearCheckredisParams = {
    petRegId,
    params: options,
    dogRegNum
  }
  cache.set(`${orderNum}`, JSON.stringify(yearCheckredisParams), 'EX', 60 * 3);
  res.json({
    status: 200,
    orderNum,
    result: '' //resData
  });
});

//年审,审核状态不通过，更改年审信息
router.post("/updateYearCheckInfo", async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const petRegId = req.body.petRegId;
  if (!openId || !unionId) {
    throw {
      respCode: "0001",
      respMsg: " lost params"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    };
  }

  const options = {
    photoUrl: req.body.photoUrl,
    photoUrl2: req.body.photoUrl2,
    updateTime: moment().format("YYYYMMDDHHmmss"),
    orderNum: req.body.orderNum
  };
  const result = await service.updateYearCheckInfo(petRegId, options);
  res.json({
    status: result ? 200 : 201,
    respMsg: result ? "更改年审信息成功！" : "更改信息失败！"
  });
});

//旧证升级
router.post('/upperldDogRegNum', async (req, res) => {
  //1.判断老证提交的信息是否可以在小程序端进行升级
  const params = req.body;
  const oldId = req.body.oldId;
  if (!params.openid) {
    throw {
      status: "0001",
      respMsg: " lost openid"
    };
  }
  if (!params.unionid) {
    throw {
      status: "0001",
      respMsg: "缺失unionid！"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(
    params.unionid,
    params.openid
  );
  if (bindWxUserInfo.length == 0) {
    throw {
      status: "0001",
      respMsg: " to bind wxpulic !"
    };
  }
  const options = {
    djhm: params.djhm || '',
    name: params.name || '',
    sex: params.sex || '',
    type: params.type || '',
    color: params.color || '',
    birthday: params.birthday || ''
  };
  /**
   * 进行犬证升级逻辑
   * 第一步:补全信息
   * 第二步:检查信息是否完整吻合
   * 第三步:进行升级插入数据 成功(插入新表(wx表) 生成订单号) 失败(返回错误码)
   * 第四步:缴费
   * 第五步:审核(修改旧证状态)
   */
  const petRegId = uuidTool().replace(/-/gi, "");
  const uuid = uuidTool().replace(/-/gi, "");
  const orderNum = `3194${moment().format("YYYYMMDDHHmmss")}${new Date().getTime()}`;
  // const orderNum = `${moment().format(
  //   "YYYYMMDDHHmmss"
  // )}${new Date().getTime()}${orderService.getMyUUId(3)}`;
  const price = await orderService.queryPrice(3);
  const receive = parseInt(params.receive) || 0;
  let totalPrice = 0,
    expresscost = 0;
  if (receive == 1) {
    //自取
    totalPrice = price;
  } else if (receive == 2) {
    //快递
    //查询快递金额并加上
    expresscost = await orderService.queryExpressCost();
    totalPrice = price + expresscost;
  } else {
    totalPrice = 9999;
  }
  const orderModel = {
    order_num: orderNum,
    creator: params.openid,
    order_status: 0,
    create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
    order_source: 3,
    total_price: totalPrice,
    pet_id: petRegId,
    expresscost
  };

  await orderService.addWxOrder(orderModel);
  //1.调用统一下单接口
  // const resData = await orderService.unfolderToPay(params.openid, orderNum, totalPrice);
  //将所有信息登记信息保存在redis中
  const redisParams = {
    petRegId,
    uuid,
    params,
    orderNum
  }
  cache.set(`${orderNum}`, JSON.stringify(redisParams), 'EX', 60 * 3);
  res.json({
    status: 200,
    orderNum,
    result: ''
  })
  // const information = await service.addInfoPetToWx(params, petRegId, uuid);
})

router.post('/addpetRegist', async (req, res) => {
  const params = req.body;
  if (!params.openid) {
    throw {
      status: "0001",
      respMsg: " lost openid"
    };
  }
  if (!params.unionid) {
    throw {
      status: "0001",
      respMsg: "缺失unionid！"
    };
  }

  // let cacheKey = `petwx_${params.openid}`;
  // const cacheWxResCount = await cache.get(cacheKey);
  // //限制每个微信用户每3分钟才能访问一次添加宠物注册信息
  // if (!cacheWxResCount) {
  //   cache.set(cacheKey, 1, 'EX', expireTime);
  // } else {
  //   if (cacheWxResCount > reqCount) {
  //     throw {
  //       status: '0001',
  //       respMsg: "请勿频繁提交!"
  //     }
  //   }
  //   cache.incr(cacheKey);
  // }
  const bindWxUserInfo = await service.isWxPubBind(
    params.unionid,
    params.openid
  );
  if (bindWxUserInfo.length == 0) {
    throw {
      status: "0001",
      respMsg: " to bind wxpulic !"
    };
  }
  // const orderStatusInfo = await orderService.queryOrderStatus(params.openid, 1, '');
  // if (orderStatusInfo.length && orderStatusInfo[0].order_status == 0) {
  //   throw {
  //     status: 10010,
  //     respMsg: `您有未支付的新登记订单，请勿多次提交登记信息！`
  //   };
  // }
  if (!params.petPhotoUrl) {
    throw {
      status: "0001",
      respMsg: " lost petPhotoUrl"
    };
  }
  if (!params.idNumberPic1) {
    throw {
      status: "0001",
      respMsg: " lost idNumberPic1"
    };
  }
  if (!params.idNumberPic2) {
    throw {
      status: "0001",
      respMsg: " lost idNumberPic2"
    };
  }
  if (!params.areaCode) {
    throw {
      respCode: "0001",
      respMsg: " lost areaCode"
    };
  }
  if (params.dogRegNum) {
    if (!regDogRegNum.test(params.dogRegNum)) {
      throw {
        respCode: "0001",
        respMsg: " dogRegNum not  correct!"
      };
    }
    const result = await service.judgedogRegNum(dogRegNum);
    if (result && result.length > 0) {
      throw {
        respCode: "0001",
        respMsg: " dogRegNum has exists !"
      };
    }
  }
  if (!params.realName) {
    throw {
      respCode: "0001",
      respMsg: " lost realName"
    };
  }
  if (!regIdCard(params.idNumber)) {
    throw {
      respCode: "0001",
      respMsg: " lost idNumber"
    };
  }
  //根据身份证号，判断如果已有一条该犬主信息，则不能再申请添加
  const hasUserBindSysInfo = await service.hasUserBindSysInfo(params.idNumber);
  if (hasUserBindSysInfo.length > 0) {
    throw {
      respCode: "0001",
      respMsg: "每个人只能申请一条犬证信息！"
    };
  }
  if (!regPhoneNum.test(params.contactPhone)) {
    throw {
      respCode: "0001",
      respMsg: " lost contactPhone"
    };
  }
  const orderNum = `3194${moment().format("YYYYMMDDHHmmss")}${new Date().getTime()}`;
  // const orderNum = `${moment().format(
  //   "YYYYMMDDHHmmss"
  // )}${new Date().getTime()}${orderService.getMyUUId(3)}`;
  const price = await orderService.queryPrice(1);
  const receive = parseInt(params.receive) || 0;
  let totalPrice = 0,
    expresscost = 0;
  if (receive == 1) {
    //自取
    totalPrice = price;
  } else if (receive == 2) {
    //快递
    //查询快递金额并加上
    expresscost = await orderService.queryExpressCost();
    totalPrice = price + expresscost;
  } else {
    totalPrice = 9999;
  }
  const petRegId = uuidTool().replace(/-/gi, "");
  const orderModel = {
    order_num: orderNum,
    creator: params.openid,
    order_status: 0,
    create_time: moment().format("YYYY-MM-DD HH:mm:ss"),
    order_source: 1,
    total_price: totalPrice,
    pet_id: petRegId,
    expresscost
  };

  await orderService.addWxOrder(orderModel);
  //1.调用统一下单接口
  // const resData = await orderService.unfolderToPay(params.openid, orderNum, totalPrice);
  const uuid = uuidTool().replace(/-/gi, "");
  //将所有信息登记信息保存在redis中
  const redisParams = {
    openid: params.openid,
    petRegId,
    uuid,
    params,
    orderNum
  }
  cache.set(`${orderNum}`, JSON.stringify(redisParams), 'EX', 60 * 3);
  res.json({
    status: 200,
    orderNum,
    result: ''
  })
})

// 年审
router.post('/querypetexamine', async (req, res) => {
  const dogRegNum = req.body.dogRegNum;
  const result = await service.petexamine(dogRegNum);
  res.json({
    status: result.length ? 200 : 400,
    result
  })
})

router.post('/queryYearCheckRecord', async (req, res) => {
  const openId = req.body.openid;
  const result = await service.queryYearCheckRecord(openId);
  let petRegInfo = [];
  if (result.length > 0) {
    petRegInfo = result.map(obj => {
      let checkStatus = obj.audit_status;
      return {
        orderNum: obj.order_num,
        photoUrl: (obj.photo_url &&
            obj.photo_url.replace("/home/manage_sys/app", imgHttp)) ||
          "",
        photoUrl2: (obj.photo_url2 &&
            obj.photo_url2.replace("/home/manage_sys/app", imgHttp)) ||
          "",
        payType: obj.pay_type,
        // "branchAddr": obj.branchAddr || '【邯郸市公安局】滏东北大街与联纺东路交叉口北行200米',
        petColor: obj.coat_color,
        petGender: obj.gender == 1 ? "雄" : obj.gender == 2 ? "雌" : "未知",
        petType: obj.breed,
        petRegId: obj.id,
        checkStatus: checkStatus, //== 1 ? '已通过' : checkStatus == 2 ? '未通过' : '审核中',
        auditRemarks: obj.audit_remarks,
        areaName: obj.name || "",
        dogRegNum: obj.dog_reg_num || 0,
        petName: obj.pet_name || "",
        petState: obj.pet_state,
        renewTime: obj.renew_time ?
          moment(obj.renew_time, "YYYYMMDDHHmmss").format(
            "YYYY-MM-DD HH:mm:ss"
          ) : "",
        createTime: moment(obj.create_time, "YYYYMMDDHHmmss").format(
          "YYYY-MM-DD HH:mm:ss"
        ),
        petPhotoUrl: (obj.pet_photo_url &&
            obj.pet_photo_url.replace("/home/manage_sys/app", imgHttp)) ||
          "",
        masterName: obj.real_name || "",
        masterAdress: obj.residential_address || "",
        contactPhone: obj.contact_phone && obj.contact_phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") || "",
        checker: obj.checker || "",
        auditType: obj.audit_type
      };
    });
  }
  res.json({
    status: 200,
    result: petRegInfo
  });
})

//查询是否可以旧证升级.1.已升级的不能升级，2，微信端已操作升级，网页端正在审核的不能重复升级
router.post('/isCanUpperOld', async (req, res) => {
  const params = req.body;
  if (!params.openid) {
    throw {
      status: "0001",
      respMsg: " lost openid"
    };
  }
  if (!params.unionid) {
    throw {
      status: "0001",
      respMsg: "缺失unionid！"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(
    params.unionid,
    params.openid
  );
  if (bindWxUserInfo.length == 0) {
    throw {
      status: "0001",
      respMsg: " to bind wxpulic !"
    };
  }

  const options = {
    djhm: params.djhm || '',
    name: params.name || '',
    sex: params.sex || '',
    type: params.type || '',
    color: params.color || '',
    scdjsj: params.scdjsj || '',
    birthday: params.birthday || '',
    master_name: params.master_name || '',
    master_address: params.master_address
  }
  const canUpperCount = await service.canOldUpdateCount(options);
  if (canUpperCount == 0) {
    throw {
      status: "0001",
      respMsg: "该犬只不存在！"
    };
  }
  if (canUpperCount > 1) {
    throw {
      status: "0001",
      respMsg: "查询失败，请进行人工审核！"
    };
  }
  const result = await service.isCanUpperOld(options);
  const imgHttp = 'http://192.168.50.111:7001/public/oldImages/b/dog_image';
  result[0].photo = result[0].photo.replace(`/b/dog_image`, imgHttp);
  res.json({
    status: 200,
    respMsg: '可以升级旧犬证!',
    result
  })
});

router.post("/queryOldUpper", async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  if (!openId || !unionId) {
    throw {
      respCode: "0001",
      respMsg: " lost params"
    };
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    };
  }
  const result = await service.queryOldUpper(openId);
  let petRegInfo = [];
  if (result.length > 0) {
    petRegInfo = result.map(obj => {
      let checkStatus = obj.audit_status;
      return {
        expressname: obj.expressname || "",
        payType: obj.pay_type,
        // "branchAddr": obj.branchAddr || '【邯郸市公安局】滏东北大街与联纺东路交叉口北行200米',
        petColor: obj.coat_color,
        petGender: obj.gender == 1 ? "雄" : obj.gender == 2 ? "雌" : "未知",
        petType: obj.breed,
        petRegId: obj.id,
        checkStatus: checkStatus, //== 1 ? '已通过' : checkStatus == 2 ? '未通过' : '审核中',
        auditRemarks: obj.audit_remarks,
        areaName: obj.name || "",
        dogRegNum: obj.dog_reg_num || 0,
        petName: obj.pet_name || "",
        petState: obj.pet_state,
        renewTime: obj.renew_time ?
          moment(obj.renew_time, "YYYYMMDDHHmmss").format(
            "YYYY-MM-DD HH:mm:ss"
          ) : "",
        createTime: moment(obj.create_time, "YYYYMMDDHHmmss").format(
          "YYYY-MM-DD HH:mm:ss"
        ),
        petPhotoUrl: (obj.pet_photo_url &&
            obj.pet_photo_url.replace("/home/manage_sys/app", imgHttp)) ||
          "",
        masterName: obj.real_name || "",
        masterAdress: obj.residential_address || "",
        contactPhone: obj.contact_phone || "",
        receive: obj.receive,
        receiveName: obj.receive_name || "",
        courierNumber: obj.courier_number || "",
        receivePhone: obj.receive_phone || "",
        receiveAddr: obj.receive_addr || "",
        checker: obj.checker || "",
        deliver: obj.deliver,
        auditType: obj.audit_type
      };
    });
  }
  res.json({
    status: 200,
    result: petRegInfo
  });
});

module.exports = router;