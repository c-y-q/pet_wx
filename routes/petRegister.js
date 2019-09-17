const express = require('express');
const router = express.Router();
const service = require('../service/petRegister');
const multer = require('multer');
const uuidTool = require('uuid/v4');
const axios = require('axios');
const checkLogin = require('../middlewares/check').checkLogin;
const moment = require('moment');
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
  const regIdCard = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  const regPhoneNum = /(^1[3456789]\d{9}$)|(^(0\d{2,3}\-)?([2-9]\d{6,7})+(\-\d{1,6})?$)/;
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
  if (bindWxUserInfo[0].length == 0) {
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
    const result = await service.judgedogRegNum(dogRegNum);
    if (result[0] && result[0].length > 0) {
      throw {
        respCode: '0001',
        respMsg: " dogRegNum has exists !"
      }
    }
  }
  /*
   if (!params.petName) {
     throw {
       status: '0001',
       respMsg: " lost petName"
     }
   }
   if (!params.gender) {
     throw {
       status: '0001',
       respMsg: " lost gender"
     }
   }
   if (!params.breed) {
     throw {
       status: '0001',
       respMsg: " lost breed"
     }
   }
   if (!params.coatColor) {
     throw {
       status: '0001',
       respMsg: " lost coatColor"
     }
   }
   if (!params.birthday) {
     throw {
       status: '0001',
       respMsg: " lost birthday"
     }
   }
  */
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
    respMsg:'提交信息成功！'
  })
})

router.post('/wxLogin',async(req,res,next)=>{
   const code = req.body.code;
   const appId = 'wx8a3e72751aa71401';
   const appSecreat = '0eac0a4f5ed9a3f46dc882833d035956';
   //获取用户的openId和sessionKey
   const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecreat}&js_code=${code}&grant_type=authorization_code`;
   const { data} = await axios.get(url);
   console.log(157,data)
   if (data.errcode) {
     throw{
       status:403,
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
  console.log(117,bindWxUserInfo[0])
   if (bindWxUserInfo[0].length == 0) {
     throw {
       status: 10010,
       respMsg: " to bind wxpulic !"
     }
   }
   res.json({
     data
   });
})
router.post('/queryRegStatu', async (req, res) => {
 const openId = req.body.openid;
 const result = await service.queryRegStatu(openId);
  let petRegInfo = [];
  if (result[0].length > 0) {
    petRegInfo = result[0].map(obj => {
     let checkStatus = obj.audit_status;
      return {
        "petColor": obj.petColor,
        "petGender": obj.gender == 1 ? '雄' : obj.gender == 2 ?'雌':'未知' ,
        "petType": obj.petType,
        "petRegId":obj.id,
        "checkStatus": checkStatus == 1 ? '已通过' : checkStatus==2?'未通过':'审核中',
        "auditRemarks": obj.audit_remarks,
        "areaName": obj.name ||'',
        "dogRegNum": obj.dog_reg_num || 0,
        "petName": obj.pet_name || '',
        "petState": obj.pet_state,
        "renewTime": moment(obj.renew_time, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss'),
        "createTime": moment(obj.create_time, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss'),
        "petPhotoUrl": obj.pet_photo_url && obj.pet_photo_url.replace('/home/manage_sys/app', 'http://192.168.50.111:7001') || '',
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
router.get('/getPetColor', async(req, res) => {
   const result = await service.findPetColor();
   const petColor = result[0].reduce((pre,cur)=>{
     pre[cur.id] = cur.color;
     return pre;
   },{})
    res.json({
      status:200,
      petColor
    });
});
router.get('/getPetType',async(req,res)=>{
   const result = await service.findPetType();
   const petType = result[0].reduce((pre, cur) => {
     pre[cur.id] = cur.name;
     return pre;
   }, {})
   res.json({
     status: 200,
     petType
   });
})
module.exports = router;
