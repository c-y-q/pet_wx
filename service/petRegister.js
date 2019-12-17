const conn = require("../conn/conn");
const moment = require("moment");
const imgHttp = "http://192.168.50.111:7001";
const imgDbPath = "/home/manage_sys/app";
const config = require('../config/config');
const replaceImgPath = "/home/manage_sys/app";
const orderService = require("../service/pay");
//const imgHttp = 'https://api.hbzner.com/dog';
exports.findPetColor = async () => {
    const sql = `select * from pet_color`;
    return await conn.query(sql);
};

exports.judgedogRegNum = async dogRegNum => {
    const sql = `select * from  wx_pet_register_info where dog_reg_num = '${dogRegNum}' `;
    return await conn.query(sql);
};

exports.addPetMaster = async (creatorId, uuid, options) => {
    const sql = `insert into wx_pet_master set ? `;
    const petMaseterModel = {
        id: uuid,
        real_name: options.realName || "",
        id_number: options.idNumber || "",
        residence_permit: options.residencePermit || "",
        contact_phone: options.contactPhone || "",
        residential_address: options.residentialAddress || "",
        creator_id: creatorId || "",
        create_time: moment().format("YYYYMMDDHHmmss"),
        update_time: moment().format("YYYYMMDDHHmmss"),
        id_number_pic1: options.idNumberPic1 || "",
        id_number_pic2: options.idNumberPic2 || "",
        residence_permit_pic: options.residencePermitPic || "",
        residence_permit_pic2: options.residencePermitPic2 || ""
    };
    return await conn.query(sql, petMaseterModel);
};

exports.addPetregister = async (
    creatorId,
    petRegId,
    uuid,
    options,
    orderNum
) => {
    const sql = `insert into wx_pet_register_info set ? `;
    const petRegModel = {
        id: petRegId,
        pet_name: options.petName || "",
        gender: options.gender || 0,
        breed: options.breed || "",
        coat_color: options.coatColor || "",
        birthday: options.birthday || "",
        area_code: options.areaCode || "",
        dog_reg_num: options.dogRegNum || "",
        epc_num: options.epcNum || "",
        submit_source: 2 || "",
        audit_status: options.auditStatus || 0,
        master_id: uuid || "",
        creator_id: creatorId,
        audit_remarks: options.auditRemarks || "",
        pet_photo_url: options.petPhotoUrl || "",
        pet_category_id: options.petCategoryId || "",
        pet_state: 0,
        pay_type: 1,
        first_reg_time: moment().format("YYYYMMDDHHmmss"),
        expire_time: addyear(),
        renew_time: moment().format("YYYYMMDDHHmmss"),
        change_time: "",
        logout_time: "",
        create_time: moment().format("YYYYMMDDHHmmss"),
        update_time: moment().format("YYYYMMDDHHmmss"),
        receive: parseInt(options.receive || 1),
        receive_name: options.receiveName || "",
        courier_number: options.courierNumber || "",
        receive_phone: options.receivePhone || "",
        receive_addr: options.receiveAddr || "",
        deliver: parseInt(options.deliver || 2),
        audit_time: options.auditTime || "",
        deliver_time: options.deliverTime || "",
        audit_type: 1,
        latest_order_num: orderNum
    };
    return await conn.query(sql, petRegModel);
};

exports.addPetPreventionInfo = async (creatorId, petRegId, options) => {
    const sql = `insert into wx_pet_prevention_img set ? `;
    const petPreventionModel = {
        year: moment().format("YYYY"),
        pet_reg_id: petRegId,
        creator_id: creatorId || "",
        photo_url: options.photoUrl || "",
        photo_url2: options.photoUrl2 || "",
        create_time: moment().format("YYYYMMDDHHmmss") || "",
        update_time: moment().format("YYYYMMDDHHmmss") || ""
    };
    return await conn.query(sql, petPreventionModel);
};

exports.queryRegStatu = async (openId) => {
    const sql = `select p.expressname,p.audit_type,p.deliver,p.checker,p.receive_addr,p.receive_phone,p.receive_name, p.courier_number,p.receive,p.pay_type,s.remarks branchAddr, p.audit_remarks,p.gender,p.breed,p.coat_color, p.id,wr.audit_status,m.real_name,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,p.create_time,p.pet_photo_url 
                 from  wx_pet_register_info p,sys_branch s,wx_pet_master m,wx_addpet_record wr
                 where 
                 p.area_code = s.code and m.creator_id = p.creator_id and m.id = p.master_id
                 and p.old_id  is  null
                 and p.creator_id = '${openId}'
                 and wr.pet_id = p.id 
                 and p.pay_type <> -1
                 order by p.create_time desc `;
    return await conn.query(sql);
};


exports.findPetType = async () => {
    const sql = `select * from pet_type`;
    return await conn.query(sql);
};

exports.findPetColor = async () => {
    const sql = `select * from pet_color`;
    return await conn.query(sql);
};

function addyear() {
    return moment()
        .add(1, "y")
        .format("YYYYMMDDHHmmss");
}
exports.isWxPubBind = async (unionId, openId) => {
    const sql = `select * from wx_pub where unionId = '${unionId}' or openId = '${openId}' `;
    const result = await conn.query(sql);
    return result;
};

exports.isfree = async (dogRegNum, phone) => {
    const sql = ` SELECT r.* FROM pet_register_info r LEFT JOIN pet_master m ON r.master_id = m.id WHERE r.dog_reg_num = '${dogRegNum}' and m.contact_phone = '${phone}' `;
    const result = await conn.query(sql);
    return result;
}
exports.eiditDogRegNum = async (
    dogRegNum,
    dogRegId,
    creatorId,
    unionId,
    idNumber
) => {
    const wx_pet_ref_sql = " insert into wx_pub_petInf_rel set ? ";
    const wx_pub_sql = ` update wx_pet_register_info set dog_reg_num = ? where id =? and dog_reg_num = '' `;
    const wxPubPetInfRel = {
        unionId: unionId,
        pet_reg_id: dogRegId,
        openId: creatorId,
        dog_reg_num: dogRegNum,
        id_number: idNumber
    };
    const wx_pet_ref = conn.query(wx_pet_ref_sql, wxPubPetInfRel);
    const wx_pub = conn.query(wx_pub_sql, [dogRegNum, dogRegId]);
    return await Promise.all([wx_pet_ref, wx_pub]);
};

exports.isBinwxRef = async (dogRegNum, dogRegId, creatorId, unionId) => {
    const sql = ` select id from  wx_pub_petInf_rel where  dog_reg_num = ? and pet_reg_id = ? and openId = ? and unionId = ? `;
    const result = await conn.query(sql, [
        dogRegNum,
        dogRegId,
        creatorId,
        unionId
    ]);
    return result.length > 0;
};
//查询没有绑定狗证的且未付款的注册
exports.findNotBindRegIdsByOpenId = async openId => {
    const sql = `select p.pay_type,p.audit_remarks, t.name petType, c.color petColor,p.gender,p.breed,p.coat_color, p.id,p.audit_status,m.real_name,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,p.create_time,p.pet_photo_url 
                 from  wx_pet_register_info p,sys_branch s,wx_pet_master m, pet_type t,pet_color c
                 where 
                 p.area_code = s.code and m.id = p.master_id
                 and p.creator_id = ?
                 and p.pay_type <> -1
                 and p.pet_state =1
                 and p.dog_reg_num = ''
                 and p.breed = t.id
                 and p.coat_color = c.id
                 order by p.create_time desc `;
    const result = await conn.query(sql, [openId]);
    return result;
};
//证件号没有被绑定过,没被实用过
exports.findNotHasBindDogRegNum = async dogRegNum => {
    const sql = ` select dog_reg_num from wx_pet_register_info where  dog_reg_num = ? `;
    const result = await conn.query(sql, [dogRegNum]);
    return result;
};
exports.findPetInfosByIdNum = async (
    idNumber,
    realName,
    contactPhone,
    dogRegNum
) => {
    const sql = `select p.pay_type,p.audit_remarks,p.gender,p.breed,p.coat_color, p.id,p.audit_status,m.real_name,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,p.create_time,p.pet_photo_url
              from  wx_pet_register_info p,sys_branch s,pet_master m
              where
              p.area_code = s.code and m.id = p.master_id
              and p.pet_state > 0
              and p.audit_status = 1
              and p.dog_reg_num = '${dogRegNum}'
              and m.id_number = '${idNumber}'
              and m.real_name = '${realName}'
              and m.contact_phone ='${contactPhone}'
              order by p.create_time desc `;
    const result = await conn.query(sql);
    return result;
};
exports.queryRegList = async (openId, unionId) => {
    const wxPubRegIdsResult = await conn.query(
        `select pet_reg_id from wx_pub_petInf_rel where openId = ? and unionId = ?`,
        [openId, unionId]
    );
    const wxPubRegIds = wxPubRegIdsResult.map(
        obj => obj.pet_reg_id && obj.pet_reg_id
    );
    const resultRegIds = Array.from(new Set(wxPubRegIds));
    if (resultRegIds.length == 0) {
        return [];
    }
    const resultSql = ` select p.expire_time,p.birthday,p.pay_type,wx.audit_remarks,p.gender,p.breed,p.coat_color, p.id,wx.audit_status,m.real_name,m.id_number,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,p.create_time,p.pet_photo_url 
                 from  pet_register_info p,wx_pet_register_info wx,sys_branch s,pet_master m
                 where 
                 p.id = wx.id and 
                 p.area_code = s.code and m.id = p.master_id
                 and p.id in (?)
                 and p.dog_reg_num <> ''
                 order by p.create_time desc `;
    const result = await conn.query(resultSql, [resultRegIds]);
    return result;
};

exports.findBindPetOpenIds = async petRegIds => {
    if (petRegIds.length > 0) {
        const sql = `select * from wx_pub_petInf_rel wf where wf.pet_reg_id in (?)`;
        const result = await conn.query(sql, [petRegIds]);
        return result;
    } else {
        return [];
    }
};

exports.judePetExists = async id => {
    const sql = `select id from pet_register_info where id = ? `;
    const result = await conn.query(sql, [id]);
    return result.length > 0;
};

exports.directBindDogRegNum = async (openid, unionId, petRegId, dogRegNum) => {
    const wx_pet_ref_sql = " insert into wx_pub_petInf_rel set ? ";
    const wxPubPetInfRel = {
        unionId: unionId,
        pet_reg_id: petRegId,
        openId: openid,
        dog_reg_num: dogRegNum
    };
    return await conn.query(wx_pet_ref_sql, wxPubPetInfRel);
};

exports.petRegIdPay = async id => {
    const sql = `select id,pay_type from wx_pet_register_info where id = ? `;
    const result = await conn.query(sql, [id]);
    return result;
};

exports.findAllArea = async () => {
    const sql = `select * from sys_branch  where parent_code = '130401' `;
    return await conn.query(sql);
};

exports.judeWxUserIsBindPet = async (openId, unionId, petRegId) => {
    const sql = `select * from wx_pub_petInf_rel where openId = ? and unionId = ?  and pet_reg_id = ? `;
    const result = await conn.query(sql, [openId, unionId, petRegId]);
    return result;
};



exports.yearCheck = async (openId, petRegId, options, dogRegNum, orderNum) => {
    const wxquerySql = ` select * from wx_pet_register_info where dog_reg_num = '${dogRegNum}' `;
    const wxpetRegResult = await conn.query(wxquerySql);
    /**
     * 复制防疫信息表，复制主人表，复制犬登记表
     */
    if (wxpetRegResult.length == 0) {
        const petRegInfo = await conn.query(`select id,master_id from pet_register_info  where dog_reg_num = ${dogRegNum} `);
        const copyToWxPrevPromise = conn.query(`insert into wx_pet_prevention_img select * from pet_prevention_img where pet_reg_id = '${petRegInfo[0].id}' `);
        const copyToWxPetMasterPromise = conn.query(`insert into wx_pet_master(year,pet_reg_id,photo_url,creator_id,create_time,update_time,photo_url2) select year,pet_reg_id,photo_url,creator_id,create_time,update_time,photo_url2 from pet_master where id = '${petRegInfo[0].master_id}' `);
        let petRegCloumn = `id,pet_name,gender,pet_state,pet_category_id,breed,coat_color,birthday,area_code,dog_reg_num,first_reg_time,renew_time,expire_time,change_time,logout_time,
                              submit_source, pet_photo_url,master_id,creator_id,create_time,update_time,pay_type,punish_info`;
        const copyToWxPetRegPromise = conn.query(`insert into wx_pet_register_info(${petRegCloumn}) select ${petRegCloumn} from pet_register_info where dog_reg_num = ${dogRegNum} `);
        await Promise.all([copyToWxPrevPromise, copyToWxPetMasterPromise, copyToWxPetRegPromise]);
    }
    await conn.query(` update pet_register_info set locking = 1  where dog_reg_num = ${dogRegNum} `);
    const wxPetRegSql = ` update wx_pet_register_info set pet_state = 3 ,submit_source = 2 ,audit_status = 0,pay_type = 1 ,audit_type = 2, year_latest_order_num = ? where dog_reg_num = ? `;
    const yearRecordModel = {
        pet_id: petRegId,
        audit_status: 0,
        checkor: '',
        create_time: moment().format('YYYYMMDDHHmmss'),
        update_time: moment().format('YYYYMMDDHHmmss'),
        creator: openId,
        order_num: orderNum
    }
    const yearCheckRecordSql = ' insert into wx_review_record set ? ';
    await conn.query(yearCheckRecordSql, yearRecordModel);
    const wxPetRegPromise = conn.query(wxPetRegSql, [orderNum, dogRegNum]);
    const wxPetPrevSql = `update wx_pet_prevention_img set year = ?,photo_url = ?, photo_url2 = ?, update_time = ? where pet_reg_id = ? `;
    const petPrevParam = [
        options.year,
        options.photoUrl,
        options.photoUrl2,
        options.updateTime,
        petRegId
    ]
    const wxPetPrevPromise = conn.query(wxPetPrevSql, petPrevParam);
    return await Promise.all([wxPetPrevPromise, wxPetRegPromise]);
};

exports.queryRegInfoByRegId = async queryRegInfoByRegId => {
    const sql = ` SELECT 
            r.audit_type,
            r.receive,
            IFNULL(r.courier_number, '') as courier_number,
            IFNULL(r.courier_time, '') as courier_time,
            IFNULL(r.receive_name, '') as receive_name ,
            IFNULL(r.receive_phone, '') as receive_phone,
            IFNULL(r.receive_addr, '') as receive_addr,
            r.deliver,
            IFNULL(r.audit_time, '') as audit_time,
            IFNULL(r.deliver_time, '') as deliver_time,
            IFNULL(r.receive_addr,'') as receive_addr,
            IFNULL(r.id, '') as id,
            IFNULL(r.pet_name, '') as pet_name,
            IFNULL(r.gender, '') as gender,
            IFNULL(r.pet_state, '') as pet_state,
            IFNULL(r.pet_category_id, '') as pet_category_id,
            IFNULL(r.breed, '') as breed,
            IFNULL(r.coat_color, '') as coat_color,
            IFNULL(r.birthday, '') as birthday,
            IFNULL(r.area_code, '') as area_code,
            IFNULL(r.dog_reg_num, '') as dog_reg_num,
            IFNULL(r.epc_num, '') as epc_num,
            IFNULL(DATE_FORMAT(r.first_reg_time,'%Y/%m/%d %H:%i:%s'), '') as first_reg_time,
            IFNULL(DATE_FORMAT(r.renew_time, '%Y/%m/%d'), '') as renew_time,
            IFNULL(DATE_FORMAT(r.change_time, '%Y/%m/%d %H:%i:%s'), '') as change_time,
            IFNULL(DATE_FORMAT(r.logout_time, '%Y/%m/%d %H:%i:%s'), '') as logout_time,
            IFNULL(r.submit_source, '') as submit_source,
            IFNULL(r.audit_status, '') as checkStatus,
            IFNULL(r.audit_remarks, '') as audit_remarks,
            replace(r.pet_photo_url, '${replaceImgPath}', '${imgHttp}')  pet_photo_url,
            IFNULL(r.create_time, '') as create_time,
            IFNULL(DATE_FORMAT(r.create_time,'%Y/%m/%d %H:%i:%s'), '') as create_time,
            IFNULL(DATE_FORMAT(r.update_time, ''), '') as update_time,
            IFNULL(r.creator_id, '%Y/%m/%d %H:%i:%s') as creator_id,
            replace(m.id_number_pic1, '${replaceImgPath}', '${imgHttp}')  id_number_pic1,
            replace(m.id_number_pic2, '${replaceImgPath}', '${imgHttp}')  id_number_pic2,
            replace(m.residence_permit_pic, '${replaceImgPath}', '${imgHttp}')  residence_permit_pic,
            replace(m.residence_permit_pic2, '${replaceImgPath}', '${imgHttp}')  residence_permit_pic2,
            IFNULL(m.real_name, '') as real_name,
            IFNULL(m.id_number, '') as id_number,
            IFNULL(m.residence_permit, '') as residence_permit,
            IFNULL(m.contact_phone, '') as contact_phone,
            IFNULL(m.residential_address, '') as residential_address,
            IFNULL(r.master_id, '') as master_id,
            replace(e.photo_url, '${replaceImgPath}', '${imgHttp}')  photo_url,
            replace(e.photo_url2, '${replaceImgPath}', '${imgHttp}')  photo_url2,
            IFNULL(e.pet_reg_id, '') as pet_reg_id,
            IFNULL(s.name, '') as areaName
            FROM
                wx_pet_register_info r INNER JOIN wx_pet_master m ON r.master_id = m.id 
                INNER JOIN wx_pet_prevention_img e ON r.id = e.pet_reg_id 
                INNER JOIN sys_branch s on r.area_code = s.code 
            where 
                r.pay_type != -1  and  r.id = ?  `;
    const result = await conn.query(sql, [queryRegInfoByRegId]);
    const res = result.length > 0 ? result.map(obj => this.toTuoFeng(obj)) : [];
    return res;
};

exports.toTuoFeng = obj => {
    const result = {};
    for (let key in obj) {
        let resutKey = key.replace(/\_[a-z]/g, val =>
            val.toUpperCase().replace(/\_/g, "")
        );
        result[resutKey] = obj[key];
    }
    return result;
};

exports.updatePetRegInfo = async options => {
    //更具petRegId查找宠物主人id
    const sql = "select master_id from wx_pet_register_info where id = ? ";
    const petRegMaster = await conn.query(sql, [options.petRegId]);
    const addRecordSql = 'update  wx_addpet_record set audit_status = 0   where pet_id =? ';
    await conn.query(addRecordSql, [options.petRegId]);
    if (!petRegMaster.length) {
        return [];
    }
    const petMasterSql = `update wx_pet_master set real_name = ?,id_number = ?,residence_permit = ?,contact_phone = ?,residential_address = ?,
                          update_time = ? ,id_number_pic1 = ?,
                          id_number_pic2 = ?, residence_permit_pic = ?, residence_permit_pic2 = ?
                          where id = ?  `;
    const petMasterSqlUpdatePromise = conn.query(petMasterSql, [
        options.realName,
        options.idNumber,
        options.residencePermit,
        options.contactPhone,
        options.residentialAddress,
        moment().format("YYYYMMDDHHmmss"),
        options.idNumberPic1.replace(imgHttp, imgDbPath),
        options.idNumberPic2.replace(imgHttp, imgDbPath),
        options.residencePermitPic.replace(imgHttp, imgDbPath),
        options.residencePermitPic2.replace(imgHttp, imgDbPath),
        petRegMaster[0].master_id
    ]);

    const petPrevSql = `update wx_pet_prevention_img set  photo_url = ?,photo_url2 = ?,update_time = ?  where  pet_reg_id = ?  `;
    const petPrevlUpdatePromise = conn.query(petPrevSql, [
        options.photoUrl.replace(imgHttp, imgDbPath),
        options.photoUrl2.replace(imgHttp, imgDbPath),
        moment().format("YYYYMMDDHHmmss"),
        options.petRegId
    ]);
    const petRegSql = ` update wx_pet_register_info  set audit_remarks = '', audit_status = ? ,pet_name = ?, gender = ?,breed = ?,coat_color = ?,
                        birthday = ?,area_code = ?,pet_photo_url = ?,update_time = ?
                        where id = ? `;
    const petRegModel = [
        0,
        options.petName || "",
        options.gender || 0,
        options.breed || "",
        options.coatColor || "",
        options.birthday || "",
        options.areaCode || "",
        options.petPhotoUrl.replace(imgHttp, imgDbPath) || "",
        moment().format("YYYYMMDDHHmmss"),
        options.petRegId
    ];
    const petRegUpdatePromise = conn.query(petRegSql, petRegModel);
    return await Promise.all([
        petMasterSqlUpdatePromise,
        petPrevlUpdatePromise,
        petRegUpdatePromise
    ]); //
};

exports.unbindPetDogRegNum = async (openid, unionId, petRegId, dogRegNum) => {
    const sql = " delete from  wx_pub_petInf_rel where  unionId = ? and pet_reg_id = ? and openId = ? and dog_reg_num = ? ";
    const result = await conn.query(sql, [unionId, petRegId, openid, dogRegNum]);
    return result.affectedRows == 1;
};

exports.updatePetRegLatestNum = async (openid, orderNum) => {
    const sql = " update wx_pet_register_info set latest_order_num = ?,audit_type = 2,audit_status = 3,pay_type = -1 where creator_id = ? ";
    return await conn.query(sql, [orderNum, openid]);
};

exports.findPreventionInfo = async petRegId => {
    const sql = " select expire_time,pet_state from wx_pet_register_info where id = ? ";
    return await conn.query(sql, [petRegId]);
};
//年审,审核状态不通过，更改年审信息pet_state = 3 and audit_status =2
exports.updateYearCheckInfo = async (petRegId, options) => {
    const updateSql1 = ` update wx_pet_register_info set audit_status = 0, audit_remarks = '',pet_state = 3 ,submit_source = 2 where id = ? `;
    await conn.query(updateSql1, [petRegId]);
    //更改年审记录
    const updateSql2 = 'update  wx_review_record set  audit_status = 0, update_time = ?  where pet_id = ? and order_num = ? ';
    await await conn.query(updateSql2, [moment().format('YYYYMMDDHHmmss'), petRegId, options.orderNum]);
    const petPrevSql = "update wx_pet_prevention_img set photo_url = ?, photo_url2 = ?, update_time = ? where pet_reg_id = ?  ";
    const petPrevUpdateResult = await conn.query(petPrevSql, [
        options.photoUrl.replace(imgHttp, imgDbPath),
        options.photoUrl2.replace(imgHttp, imgDbPath),
        options.updateTime,
        petRegId
    ]);
    return petPrevUpdateResult.affectedRows == 1;
};

exports.canOldUpdateCount = async (options) => {
    let querySql = ` select state, djhm,name,sex,type,color,birthday,count(djhm) count from old_pet_info 
                     where`;
    let groupSql = ' GROUP BY  ';
    for (let key in options) {
        if (options[key]) {
            querySql += ` and ${key} = '${options[key]}' `;
            groupSql += `${key},`;
        }
    }
    groupSql = groupSql.slice(0, -1);
    const resultSql = querySql + groupSql;
    const match = resultSql.match('where')
    const substr = resultSql.substr(0, match.index + 5)
    const querylength = resultSql.length;
    const substr2 = resultSql.substr(match.index + 9, querylength)
    const resultsSql = substr.concat(substr2);
    const result = await conn.query(resultsSql);
    return {
        count: result[0] && result[0].count || 0,
        state: result[0] && result[0].state,
    }
}

exports.upperldDogRegNum = async (params, petRegId, uuid, orderNum) => {
    const addpet = this.addinformations(params, petRegId, uuid, orderNum);
    return addpet;
}
exports.addinformations = async (params, petRegId, uuid, orderNum) => {
    const oldId = params.oldId;
    //更新已升级的状态
    const updateOldPetSql = 'update old_pet_info set state = 2 where id = ? ';
    await conn.query(updateOldPetSql, [oldId]);
    const datetime = moment(new Date()).format('YYYYMMDDHHmmss')
    const addtime = moment(new Date()).add(1, 'y').format('YYYYMMDDHHmmss')
    const year = moment(new Date()).format('YYYY');
    //处理参数
    const handleParams = {
        petName: params.petName || '',
        gender: params.gender || 0,
        breed: params.breed || '',
        coatColor: params.coatColor || '',
        birthday: params.birthday || '',
        areaCode: params.areaCode || '',
        petPhotoUrl: params.petPhotoUrl && params.petPhotoUrl.replace(imgHttp, imgDbPath) || '',
        openid: params.openid,
        oldId: params.oldId || '',
        receiveName: params.receiveName || '',
        receivePhone: params.receivePhone || '',
        receiveAddr: params.receiveAddr || '',
        receive: params.receive || 1,
        realName: params.realName || '',
        idNumber: params.idNumber || '',
        contactPhone: params.contactPhone || '',
        residentialAddress: params.residentialAddress || '',
        idNumberPic1: params.idNumberPic1 && params.idNumberPic1.replace(imgHttp, imgDbPath) || '',
        idNumberPic2: params.idNumberPic2 && params.idNumberPic2.replace(imgHttp, imgDbPath) || '',
        residencePermitPic: params.residencePermitPic && params.residencePermitPic.replace(imgHttp, imgDbPath) || '',
        residencePermitPic2: params.residencePermitPic2 && params.residencePermitPic2.replace(imgHttp, imgDbPath) || '',
        photoUrl: params.photoUrl && params.photoUrl.replace(imgHttp, imgDbPath) || '',
        photoUrl2: params.photoUrl2 && params.photoUrl2.replace(imgHttp, imgDbPath) || ''
    }
    const petsql = `INSERT INTO wx_pet_register_info (
                            id,
                            pet_name,
                            gender,
                            pet_state,
                            pet_category_id,
                            breed,
                            coat_color,
                            birthday,
                            area_code,
                            first_reg_time,
                            renew_time,
                            expire_time,
                            submit_source,
                            pet_photo_url,
                            master_id,
                            creator_id,
                            create_time,
                            audit_type,
                            old_id,
                            receive_name,
                            receive_phone,
                            receive_addr,
                            receive,
                            audit_status,
                            pay_type

                           )
                       VALUES
                        ('${petRegId}','${handleParams.petName}',${handleParams.gender},1,0,'${handleParams.breed}','${handleParams.coatColor}','${handleParams.birthday}','${handleParams.areaCode}',
                        '${datetime}','${datetime}','${addtime}',2,'${handleParams.petPhotoUrl}','${uuid}','${handleParams.openid}','${datetime}',3,${handleParams.oldId},
                        '${handleParams.receiveName}','${handleParams.receivePhone}','${handleParams.receiveAddr}',${handleParams.receive},0,1)`;

    const mastersql = `INSERT INTO wx_pet_master (
        id,
        real_name,
        id_number,
        contact_phone,
        residential_address,
        creator_id,
        create_time,
        id_number_pic1,
        id_number_pic2,
        residence_permit_pic,
        residence_permit_pic2
        )
        VALUES
            ('${uuid}','${handleParams.realName}','${handleParams.idNumber}','${handleParams.contactPhone}','${handleParams.residentialAddress}','${handleParams.openid}',
            '${datetime}','${handleParams.idNumberPic1}','${handleParams.idNumberPic2}','${handleParams.residencePermitPic}','${handleParams.residencePermitPic2}')`;

    const persql = `INSERT INTO wx_pet_prevention_img (
        year,
        pet_reg_id,
        photo_url,
        creator_id,
        create_time,
        photo_url2
        )
        VALUES
            ('${year}','${petRegId}','${handleParams.photoUrl}','${handleParams.openid}','${datetime}','${handleParams.photoUrl2}')`;


    const addpetRecordModel = {
        pet_id: petRegId,
        audit_status: 0,
        checkor: '',
        create_time: moment().format('YYYYMMDDHHmmss'),
        creator: params.openid,
        order_num: orderNum
    }
    const addpetRecordSql = 'insert into wx_addpet_record set ? ';
    await conn.query(addpetRecordSql, addpetRecordModel);
    const pet = await conn.query(petsql);
    const master = await conn.query(mastersql);
    const perven = await conn.query(persql);
    return {
        pet,
        master,
        perven,
        orderNum
    };
}

exports.addPetRegAllInfo = async (options) => {
    const {
        openid,
        petRegId,
        uuid,
        params,
        orderNum
    } = options;
    const petMasterPromise = this.addPetMaster(openid, uuid, params);
    const petPrevPromise = this.addPetPreventionInfo(openid, petRegId, params);
    const petRegInfoPromise = this.addPetregister(openid, petRegId, uuid, params, orderNum);
    const addpetRecordModel = {
        pet_id: petRegId,
        audit_status: 0,
        checkor: '',
        create_time: moment().format('YYYYMMDDHHmmss'),
        creator: openid,
        order_num: orderNum
    }
    const addpetRecordSql = 'insert into wx_addpet_record set ? ';
    const addpetRecordPromise = conn.query(addpetRecordSql, addpetRecordModel);
    return await Promise.all([petMasterPromise, petPrevPromise, petRegInfoPromise, addpetRecordPromise]);
}
//todo： 小程序新登记审核通过的，需要在网页端插入wx_pub_petInf_rel,即小程序端绑定微信用户自己的狗证

exports.petexamine = async (dogRegNum) => {
    const sql = `SELECT
    IFNULL(id, '') AS petRegId,
    IFNULL(replace(pet_photo_url, '${replaceImgPath}', '${imgHttp}'), '') AS petPhotoUrl,
    IFNULL(pet_name, '') AS petName,
    IFNULL(breed, '') AS petType,
    IFNULL(coat_color, '') AS petColor,
    IFNULL(gender, '') AS petGender,
    IFNULL(dog_reg_num, '') AS dogRegNum
    FROM
        pet_register_info 
    WHERE
        dog_reg_num = '${dogRegNum}' and pay_type != -1`;
    const result = await conn.query(sql);
    return result;
}
//年审记录列表
exports.queryYearCheckRecord = async (openId) => {
    const sql = `select wr.order_num,v.photo_url,v.photo_url2,p.pay_type,s.remarks branchAddr, p.audit_remarks,p.gender,p.breed,p.coat_color, p.id,wr.audit_status,m.real_name,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,wr.update_time create_time,p.pet_photo_url 
    from wx_pet_register_info p, wx_review_record wr, wx_pet_prevention_img v, sys_branch s, wx_pet_master m
    where
    p.area_code = s.code  and m.id = p.master_id
    and wr.pet_id = p.id
    and p.id = v.pet_reg_id
    and wr.creator = ?
    and p.pay_type <> -1
    order by wr.update_time desc `
    return await conn.query(sql, [openId]);
}

exports.isCanUpperOld = async (options) => {
    let sql = 'select * from old_pet_info where state = 1 ';
    for (let key in options) {
        if (options[key]) {
            sql += ` and ${key} =  '${options[key]}'`;
        }
    }
    console.log('----sql----', sql);
    return await conn.query(sql);
}

exports.queryOldUpper = async (openId) => {
    const sql = `select p.expressname,p.audit_type,p.deliver,p.checker,p.receive_addr,p.receive_phone,p.receive_name, p.courier_number,p.receive,p.pay_type,s.remarks branchAddr, p.audit_remarks,p.gender,p.breed,p.coat_color, p.id,wr.audit_status,m.real_name,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,p.create_time,p.pet_photo_url 
                 from  wx_pet_register_info p,sys_branch s,wx_pet_master m,wx_addpet_record wr
                 where 
                 p.old_id != ''
                 and p.area_code = s.code and m.creator_id = p.creator_id and m.id = p.master_id
                 and p.creator_id = '${openId}'
                 and wr.pet_id = p.id 
                 order by wr.create_time desc `;
    return await conn.query(sql);
};

exports.getPriceAndExressCost = async () => {
    const sql = ` select code,data from  sys_params where type = 'paymentType' and code <> 4 `;
    return await conn.query(sql);
}

exports.queryDogRegNumIsOk = async (petRegId) => {
    const sql = ` select pet_state from wx_pet_register_info  where id = ? `;
    const result = await conn.query(sql, [petRegId]);
    return result.length > 0 && result[0].pet_state == 1;
}


exports.findPetState = async (petRegId) => {
    const sql = " select expire_time,pet_state from pet_register_info where id = ? ";
    return await conn.query(sql, [petRegId]);
};

exports.hasUserBindSysInfo = async (idNumber) => {
    let flag = false;
    const resul1 = conn.query('select m.* from wx_pet_master m,pet_register_info p where  m.id = p.master_id and p.pet_state in(1,3,0) and m.id_number = ?', [idNumber]);
    const result2 = conn.query('select m.* from pet_master m,pet_register_info p where  m.id = p.master_id and p.pet_state in(1,3,0) and id_number = ?', [idNumber]);
    const result3 = conn.query('select * from wx_pet_master where id_number = ? ', [idNumber]);
    const result4 = conn.query('select * from pet_master where id_number = ? ', [idNumber]);
    const [wxMaster, petMaster, wxExistsMaster, existsMaster] = await Promise.all([resul1, result2, result3, result4]);
    console.log(733, wxExistsMaster, existsMaster)
    if (wxMaster && wxMaster.length > 0) {
        flag = true;
    }
    if (petMaster && petMaster.length) {
        flag = true;
    }
    if (wxExistsMaster.length > 0 && existsMaster.length == 0) {
        flag = true;
    }
    return flag;
};

exports.queryPayMentRecord = async (petRegId) => {
    const sql = ' select * from pet_payment_record where pay_status = 0 and pet_id = ? ';
    return await conn.query(sql, [petRegId]);
}