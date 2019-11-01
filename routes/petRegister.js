const express = require('express');
const router = express.Router();
const service = require('../service/petRegister');
const multer = require('multer');
const uuidTool = require('uuid/v4');
const axios = require('axios');
const regIdCard = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
const regPhoneNum = /(^1[3456789]\d{9}$)|(^(0\d{2,3}\-)?([2-9]\d{6,7})+(\-\d{1,6})?$)/;
const regDogRegNum = /^\d{6}$/;
const moment = require('moment');
const imgHttp = 'http://192.168.50.111:7001' //'https://api.hbzner.com/dog';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/home/manage_sys/app/public/images')
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}.jpg`);
  }
})
const upload = multer({
  storage: storage
})
/**
 * 微信小程序端上传图片
 */
router.post('/uploadImg', upload.single('file'), async (req, res, next) => {
  const file = req.file;
  res.json({
    code: '200',
    url: `/home/manage_sys/app/public/images/${file.filename}`
  })
});
/**
 * 添加宠物注册信息到pet_regist
 */
router.post('/addpetRegist', async (req, res, next) => {
  const params = req.body;
  if (!params.openid) {
    throw {
      status: '0001',
      respMsg: " lost openid"
    }
  }
  if (!params.unionid) {
    throw {
      status: '0001',
      respMsg: '缺失unionid！'
    }
  }
  const bindWxUserInfo = await service.isWxPubBind(params.unionid, params.openid);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: '0001',
      respMsg: " to bind wxpulic !"
    }
  }
  if (!params.petPhotoUrl) {
    throw {
      status: '0001',
      respMsg: " lost petPhotoUrl"
    }
  }
  if (!params.idNumberPic1) {
    throw {
      status: '0001',
      respMsg: " lost idNumberPic1"
    }
  }
  if (!params.idNumberPic2) {
    throw {
      status: '0001',
      respMsg: " lost idNumberPic2"
    }
  }
  if (!params.areaCode) {
    throw {
      respCode: '0001',
      respMsg: " lost areaCode"
    }
  }
  if (params.dogRegNum) {
    if (!regDogRegNum.test(params.dogRegNum)) {
      throw {
        respCode: '0001',
        respMsg: " dogRegNum not  correct!"
      }
    }
    const result = await service.judgedogRegNum(dogRegNum);
    if (result && result.length > 0) {
      throw {
        respCode: '0001',
        respMsg: " dogRegNum has exists !"
      }
    }
  }
  if (!params.realName) {
    throw {
      respCode: '0001',
      respMsg: " lost realName"
    }
  }
  if (!regIdCard.test(params.idNumber)) {
    throw {
      respCode: '0001',
      respMsg: " lost idNumber"
    }
  }
  //根据身份证号，判断如果已有一条该犬主信息，则不能再申请添加
  const hasUserBindSysInfo = await service.hasUserBindSysInfo(params.idNumber);
  if (hasUserBindSysInfo.length > 0) {
    throw {
      respCode: '0001',
      respMsg: "每个人只能申请一条犬证信息！"
    }
  }
  if (!regPhoneNum.test(params.contactPhone)) {
    throw {
      respCode: '0001',
      respMsg: " lost contactPhone"
    }
  }
  const uuid = uuidTool().replace(/-/gi, '');
  const addPetMasterResult = await service.addPetMaster(params.openid, uuid, params);
  const petRegId = uuidTool().replace(/-/gi, '');
  const addPetRegResult = await service.addPetregister(params.openid, petRegId, uuid, params);
  const addPetPreventionResult = await service.addPetPreventionInfo(params.openid, petRegId, params);
  res.json({
    status: 200,
    respMsg: '提交信息成功！'
  })
})

router.post('/wxLogin', async (req, res, next) => {
  const code = req.body.code;
  const appId = 'wx8a3e72751aa71401';
  const appSecreat = '0eac0a4f5ed9a3f46dc882833d035956';
  //获取用户的openId和sessionKey
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecreat}&js_code=${code}&grant_type=authorization_code`;
  const {
    data
  } = await axios.get(url);
  console.log(157, data)
  if (data.errcode) {
    throw {
      status: 403,
      respMsg: 'code 非法！'
    }
  }
  if (!data.unionid) {
    throw {
      status: '0001',
      respMsg: '缺失unionid !'
    }
  }
  const bindWxUserInfo = await service.isWxPubBind(data.unionid, data.openid);
  if (bindWxUserInfo.length == 0) {
    res.json({
      status: 10010,
      data,
      respMsg: " to bind wxpulic !"
    })
    return;
  }
  res.json({
    data
  });
})
router.post('/queryRegStatu', async (req, res) => {
  const openId = req.body.openid;
  const result = await service.queryRegStatu(openId);
  let petRegInfo = [];
  if (result.length > 0) {
    petRegInfo = result.map(obj => {
      let checkStatus = obj.audit_status;
      return {
        "payType": obj.pay_type,
        "branchAddr": obj.branchAddr || '【邯郸市公安局】滏东北大街与联纺东路交叉口北行200米',
        "petColor": obj.coat_color,
        "petGender": obj.gender == 1 ? '雄' : obj.gender == 2 ? '雌' : '未知',
        "petType": obj.breed,
        "petRegId": obj.id,
        "checkStatus": checkStatus == 1 ? '已通过' : checkStatus == 2 ? '未通过' : '审核中',
        "auditRemarks": obj.audit_remarks,
        "areaName": obj.name || '',
        "dogRegNum": obj.dog_reg_num || 0,
        "petName": obj.pet_name || '',
        "petState": obj.pet_state,
        "renewTime": obj.renew_time ? moment(obj.renew_time, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss') : '',
        "createTime": moment(obj.create_time, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss'),
        "petPhotoUrl": obj.pet_photo_url && obj.pet_photo_url.replace('/home/manage_sys/app', imgHttp) || '',
        "masterName": obj.real_name || '',
        "masterAdress": obj.residential_address || '',
        "contactPhone": obj.contact_phone || ''
      }
    })
  }
  res.json({
    status: 200,
    result: petRegInfo
  });
});
router.get('/getPetColor', async (req, res) => {
  const result = await service.findPetColor();
  const petColor = result.reduce((pre, cur) => {
    pre[cur.id] = cur.color;
    return pre;
  }, {})
  res.json({
    status: 200,
    petColor
  });
});
router.get('/getPetType', async (req, res) => {
  const result = await service.findPetType();
  const petType = result.reduce((pre, cur) => {
    pre[cur.id] = cur.name;
    return pre;
  }, {})
  res.json({
    status: 200,
    petType
  });
})
router.post('/addDogRegNum', async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const dogRegNum = req.body.dogRegNum;
  const dogRegId = req.body.petRegId;
  const idNumber = req.body.idNumber;
  if (!regIdCard.test(idNumber)) {
    throw {
      respCode: '0001',
      respMsg: " lost idNumber"
    }
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    }
  }
  if (!openId || !unionId) {
    throw {
      status: 10011,
      respMsg: " openId, unionId is not null !"
    }
  }
  if (!dogRegNum) {
    throw {
      status: 10011,
      respMsg: " dogRegNum is not null !"
    }
  }
  if (!regDogRegNum.test(dogRegNum)) {
    throw {
      respCode: '0001',
      respMsg: " dogRegNum not  correct!"
    }
  }
  if (!dogRegId) {
    throw {
      status: 10011,
      respMsg: " petRegId is not null !"
    }
  }
  const judePetExists = await service.judePetExists(dogRegId);
  if (!judePetExists) {
    throw {
      status: 10011,
      respMsg: " the dog not exists !"
    }
  }
  const ispaid = await service.petRegIdPay(dogRegId);
  if (!(ispaid && ispaid.pay_type != -1)) {
    throw {
      status: 10011,
      respMsg: "该号码未付款！"
    }
  }
  const flag = await service.isBinwxRef(dogRegNum, dogRegId, openId, unionId);
  if (flag) {
    throw {
      status: 10011,
      respMsg: " you have bind this dog regsiter number !"
    }
  }
  const result = await service.eiditDogRegNum(dogRegNum, dogRegId, openId, unionId, idNumber);
  res.json({
    status: 200,
    respMsg: "bind success !"
  });
})

router.post('/findNotBindRegIdsByOpenId', async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    }
  }
  if (!openId || !unionId) {
    throw {
      status: 10011,
      respMsg: " openId, unionId is not null !"
    }
  }
  if (!dogRegNum) {
    throw {
      status: 10011,
      respMsg: " dogRegNum is not null !"
    }
  }
  if (!regDogRegNum.test(dogRegNum)) {
    throw {
      respCode: '0001',
      respMsg: " dogRegNum not  correct!"
    }
  }
  if (!dogRegId) {
    throw {
      status: 10011,
      respMsg: " petRegId is not null !"
    }
  }
  const result = await service.findNotBindRegIdsByOpenId(openId);
  res.json({
    status: 200,
    result: result
  });
});
router.post('/findNotHasBindDogRegNum', async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const dogRegNum = req.body.dogRegNum;
  if (!openId || !unionId) {
    throw {
      respCode: '0001',
      respMsg: " lost params"
    }
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    }
  }
  if (!dogRegNum) {
    throw {
      respCode: '0001',
      respMsg: " lost dogRegNum"
    }
  }
  if (!regDogRegNum.test(dogRegNum)) {
    throw {
      respCode: '0001',
      respMsg: " dogRegNum not  correct!"
    }
  }
  const result = await service.findNotHasBindDogRegNum(dogRegNum);
  res.json({
    status: 200,
    binding: result.length > 0
  });
});
router.post('/findPetInfosByIdNum', async (req, res) => {
  const idNumber = req.body.idNumber;
  const realName = req.body.realName;
  const contactPhone = req.body.contactPhone;
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  if (!regIdCard.test(idNumber)) {
    throw {
      respCode: '0001',
      respMsg: " lost idNumber"
    }
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    }
  }
  if (!regPhoneNum.test(contactPhone)) {
    throw {
      respCode: '0001',
      respMsg: " lost contactPhone"
    }
  }
  const result = await service.findPetInfosByIdNum(idNumber, realName, contactPhone);
  let petRegInfo = [];
  if (result.length > 0) {
    for (let obj of result) {
      let checkStatus = obj.audit_status;
      const judeWxUserIsBindPet = await service.judeWxUserIsBindPet(openId, unionId, obj.id);
      console.log(396, judeWxUserIsBindPet);
      petRegInfo.push({
        "isBindMe": judeWxUserIsBindPet.length > 0,
        "petType": obj.breed,
        "payType": obj.pay_type,
        "petColor": obj.coat_color || '',
        "petGender": obj.gender == 1 ? '雄' : obj.gender == 2 ? '雌' : '未知',
        "petRegId": obj.id,
        "checkStatus": checkStatus == 1 ? '已通过' : checkStatus == 2 ? '未通过' : '审核中',
        "auditRemarks": obj.audit_remarks,
        "areaName": obj.name || '',
        "dogRegNum": obj.dog_reg_num || '',
        "petName": obj.pet_name || '',
        "petState": obj.pet_state,
        "renewTime": obj.renew_time ? moment(obj.renew_time, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss') : '',
        "createTime": moment(obj.create_time, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss'),
        "petPhotoUrl": obj.pet_photo_url && obj.pet_photo_url.replace('/home/manage_sys/app', imgHttp) || '',
        "masterName": obj.real_name || '',
        "masterAdress": obj.residential_address || '',
        "contactPhone": obj.contact_phone || ''
      })
    }
  }
  res.json({
    status: 200,
    result: petRegInfo,
  });
});
router.post('/queryRegList', async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const idNumber = req.body.idNumber;
  if (!openId || !unionId) {
    throw {
      respCode: '0001',
      respMsg: " lost params"
    }
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    }
  }
  const result = await service.queryRegList(openId, unionId);
  let petRegInfo = [];
  if (result.length > 0) {
    petRegInfo = result.map(obj => {
      let checkStatus = obj.audit_status;
      return {
        "petType": obj.breed,
        "payType": obj.pay_type,
        "petColor": obj.coat_color,
        "petGender": obj.gender == 1 ? '雄' : obj.gender == 2 ? '雌' : '未知',
        "petRegId": obj.id,
        "checkStatus": checkStatus == 1 ? '已通过' : checkStatus == 2 ? '未通过' : '审核中',
        "auditRemarks": obj.audit_remarks,
        "areaName": obj.name || '',
        "dogRegNum": obj.dog_reg_num || '',
        "petName": obj.pet_name || '',
        "petState": obj.pet_state,
        "renewTime": obj.renew_time ? moment(obj.renew_time, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss') : '',
        "createTime": moment(obj.create_time, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss'),
        "petPhotoUrl": obj.pet_photo_url && obj.pet_photo_url.replace('/home/manage_sys/app', imgHttp) || '',
        "masterName": obj.real_name || '',
        "masterAdress": obj.residential_address || '',
        "contactPhone": obj.contact_phone || ''
      }
    })
  }
  res.json({
    status: 200,
    result: petRegInfo
  });
});
router.post('/directBindDogRegNum', async (req, res) => {
  const openId = req.body.openid;
  const unionId = req.body.unionid;
  const dogRegId = req.body.petRegId;
  const dogRegNum = req.body.dogRegNum;
  if (!openId || !unionId) {
    throw {
      respCode: '0001',
      respMsg: " lost params"
    }
  }
  const bindWxUserInfo = await service.isWxPubBind(unionId, openId);
  if (bindWxUserInfo.length == 0) {
    throw {
      status: 10010,
      respMsg: " to bind wxpulic !"
    }
  }
  if (!dogRegNum) {
    throw {
      respCode: '0001',
      respMsg: " lost dogRegNum"
    }
  }
  if (!regDogRegNum.test(dogRegNum)) {
    throw {
      respCode: '0001',
      respMsg: " dogRegNum not  correct!"
    }
  }
  const flag = await service.isBinwxRef(dogRegNum, dogRegId, openId, unionId);
  if (flag) {
    throw {
      status: 10011,
      respMsg: " 已绑定过该号码，请勿重复绑定 !"
    }
  }
  const judePetExists = await service.judePetExists(dogRegId);
  if (!judePetExists) {
    throw {
      status: 10011,
      respMsg: " the dog not exists !"
    }
  }
  const result = await service.directBindDogRegNum(openId, unionId, dogRegId, dogRegNum);
  res.json({
    status: 200,
    respMsg: "bind success !"
  });
});
router.post('/findAllArea', async (req, res, next) => {
  const result = await service.findAllArea();
  res.json({
    status: 200,
    result: result
  })
})

module.exports = router;