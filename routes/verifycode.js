const axios = require('axios');
const service = require('../service/verifycode');
const express = require('express');
const router = express.Router();
const caches = require('../conn/redis');

console.log('------7-----------', caches);
const { cache } = caches;
  
  console.log('----------36------------', cache);

router.post('/verify', async (req, res) => {

    const {
        phone,
        dogRegNum
    } = req.body;



    console.log(7, req);
    let arr = [];
    for(let i=0; i<=9; i++){
        arr.push(i);
    }
        
    arr.sort(function(){
        return 0.5-Math.random();
    });
    arr.length=6;

    let code = "";
    for(idx in arr){
        code += arr[idx];
    }


      



    let url = "https://feginesms.market.alicloudapi.com/codeNotice?param="+code+"&phone="+phone+"&sign=500064&skin=900115";
    const isfree = await service.isfree(phone, dogRegNum);
    console.log(52, isfree);
    if (isfree.length > 0) {
        // const resnum = await cache.incr('string');
        // console.log('-------------验证码限制次数----------',resnum);
        // return;
        const cacheWxResCount = await cache.get(phone);			
        if (!cacheWxResCount) {

            const axioes = await axios.get(url, {headers: {Authorization:"APPCODE 2f9ea1ef7eb445368398c0c767521a87"}})

            if (resnum)
            if(axioes){
                const expireTime = 60 * 2;
                await cache.set(phone, code, 'EX', expireTime);
                res.json({
                    status: "200",
                    respMsg: '验证码发送成功!'
                  });
                } else {
                    console.log(phone, ' 验证码发送异常');
                    throw {
                        status: '0001',
                        respMsg: "验证码发送异常!"
                      }
                }    
            } else {
                throw {
                    status: '0001',
                    respMsg: "请勿频繁提交!"
                    }
            };
    } else {
        console.log('查询失败');
        throw {
            status: 10011,
            respMsg: "该犬只不存在!"
        }
    }
})

router.post('/checkverify', async (req, res) => {

    const {
        phone,
        code
    } = req.body;

    const cacheWxResCount = await cache.get(phone);
    if (code == cacheWxResCount) {
        console.log('验证通过');
        res.json({
            code: "200",
            respMsg: '验证通过!'
          });
    } else {
        throw {
            status: 10011,
            respMsg: "验证失败!"

        }
    }
})

module.exports = router;