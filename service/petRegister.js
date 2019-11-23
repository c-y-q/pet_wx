const conn = require('../conn/conn');
const moment = require('moment');
const imgHttp = 'http://192.168.50.111:7001';


const replaceImgPath = '/home/manage_sys/app';
//const imgHttp = 'https://api.hbzner.com/dog';
exports.findPetColor = async () => {
    const sql = `select * from pet_color`;
    return await conn.query(sql);
}

exports.judgedogRegNum = async (dogRegNum) => {
    const sql = `select * from  wx_pet_register_info where dog_reg_num = '${dogRegNum}' `;
    return await conn.query(sql);
}

exports.addPetMaster = async (creatorId, uuid, options) => {
    const sql = `insert into wx_pet_master set ? `;
    const petMaseterModel = {
        id: uuid,
        real_name: options.realName || '',
        id_number: options.idNumber || '',
        residence_permit: options.residencePermit || '',
        contact_phone: options.contactPhone || '',
        residential_address: options.residentialAddress || '',
        creator_id: creatorId || '',
        create_time: moment().format('YYYYMMDDHHmmss'),
        update_time: moment().format('YYYYMMDDHHmmss'),
        id_number_pic1: options.idNumberPic1 || '',
        id_number_pic2: options.idNumberPic2 || '',
        residence_permit_pic: options.residencePermitPic || '',
        residence_permit_pic2: options.residencePermitPic2 || ''
    }
    return await conn.query(sql, petMaseterModel);
}

exports.addPetregister = async (creatorId, petRegId, uuid, options) => {
    const sql = `insert into wx_pet_register_info set ? `;
    const petRegModel = {
        id: petRegId,
        pet_name: options.petName || '',
        gender: options.gender || 0,
        breed: options.breed || '',
        coat_color: options.coatColor || '',
        birthday: options.birthday || '',
        area_code: options.areaCode || '',
        dog_reg_num: options.dogRegNum || '',
        epc_num: options.epcNum || '',
        submit_source: 2 || '',
        audit_status: options.auditStatus || 0,
        master_id: uuid || '',
        creator_id: creatorId,
        audit_remarks: options.auditRemarks || '',
        pet_photo_url: options.petPhotoUrl || '',
        pet_category_id: options.petCategoryId || '',
        pet_state: 0,
        pay_type: -1,
        first_reg_time: moment().format('YYYYMMDDHHmmss'),
        expire_time: addyear(),
        renew_time: '',
        change_time: '',
        logout_time: '',
        create_time: moment().format('YYYYMMDDHHmmss'),
        update_time: moment().format('YYYYMMDDHHmmss'),
        receive: parseInt(options.receive || 0),
        receive_name: options.receiveName || '',
        courier_number: options.courierNumber || '',
        receive_phone: options.receivePhone || '',
        receive_addr: options.receiveAddr || '',
        deliver: parseInt(options.deliver || 2),
        audit_time: options.auditTime || '',
        deliver_time: options.deliverTime || '',
        audit_type: 1

    }
    return await conn.query(sql, petRegModel);
}

exports.addPetPreventionInfo = async (creatorId, petRegId, options) => {
    const sql = `insert into wx_pet_prevention_img set ? `;
    const petPreventionModel = {
        year: moment().format('YYYY'),
        pet_reg_id: petRegId,
        creator_id: creatorId || '',
        photo_url: options.photoUrl || '',
        photo_url2: options.photoUrl2 || '',
        create_time: moment().format('YYYYMMDDHHmmss') || '',
        update_time: moment().format('YYYYMMDDHHmmss') || ''
    };
    return await conn.query(sql, petPreventionModel);
}

exports.queryRegStatu = async (openId) => {
    const sql = `select p.audit_type,p.deliver,p.checker,p.receive_addr,p.receive_phone,p.receive_name, p.courier_number,p.receive,p.pay_type,s.remarks branchAddr, p.audit_remarks,p.gender,p.breed,p.coat_color, p.id,p.audit_status,m.real_name,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,p.create_time,p.pet_photo_url 
                 from  wx_pet_register_info p,sys_branch s,wx_pet_master m
                 where 
                 p.area_code = s.code and m.creator_id = p.creator_id and m.id = p.master_id
                 and p.creator_id = '${openId}'
                 and p.pay_type <> -1
                 order by p.create_time desc `;
    return await conn.query(sql);
}

exports.findPetType = async () => {
    const sql = `select * from pet_type`;
    return await conn.query(sql);
}

exports.findPetColor = async () => {
    const sql = `select * from pet_color`;
    return await conn.query(sql);
}

function addyear() {
    return moment().add(1, 'y').format('YYYYMMDDHHmmss');
}
exports.isWxPubBind = async (unionId, openId) => {
    const sql = `select * from wx_pub where unionId = '${unionId}' or openId = '${openId}' `;
    const result = await conn.query(sql);
    return result;
}
exports.eiditDogRegNum = async (dogRegNum, dogRegId, creatorId, unionId, idNumber) => {
    const wx_pet_ref_sql = ' insert into wx_pub_petInf_rel set ? ';
    const wx_pub_sql = ` update wx_pet_register_info set dog_reg_num = ? where id =? and dog_reg_num = '' `;
    const wxPubPetInfRel = {
        unionId: unionId,
        pet_reg_id: dogRegId,
        openId: creatorId,
        dog_reg_num: dogRegNum,
        id_number: idNumber
    }
    const wx_pet_ref = conn.query(wx_pet_ref_sql, wxPubPetInfRel);
    const wx_pub = conn.query(wx_pub_sql, [dogRegNum, dogRegId]);
    return await Promise.all([wx_pet_ref, wx_pub]);
}


exports.isBinwxRef = async (dogRegNum, dogRegId, creatorId, unionId) => {
    const sql = ` select id from  wx_pub_petInf_rel where  dog_reg_num = ? and pet_reg_id = ? and openId = ? and unionId = ? `;
    const result = await conn.query(sql, [dogRegNum, dogRegId, creatorId, unionId]);
    return result.length > 0;
}
//查询没有绑定狗证的且未付款的注册
exports.findNotBindRegIdsByOpenId = async (openId) => {
    const sql = `select p.pay_type,p.audit_remarks, t.name petType, c.color petColor,p.gender,p.breed,p.coat_color, p.id,p.audit_status,m.real_name,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,p.create_time,p.pet_photo_url 
                 from  wx_pet_register_info p,sys_branch s,wx_pet_master m, pet_type t,pet_color c
                 where 
                 p.area_code = s.code and m.creator_id = p.creator_id and m.id = p.master_id
                 and p.creator_id = ?
                 and p.pay_type <> -1
                 and p.pet_state =1
                 and p.dog_reg_num = ''
                 and p.breed = t.id
                 and p.coat_color = c.id
                 order by p.create_time desc `;
    const result = await conn.query(sql, [openId]);
    return result;
}
//证件号没有被绑定过,没被实用过
exports.findNotHasBindDogRegNum = async (dogRegNum) => {
    const sql = ` select dog_reg_num from wx_pet_register_info where  dog_reg_num = ? `;
    const result = await conn.query(sql, [dogRegNum]);
    return result;
}
exports.findPetInfosByIdNum = async (idNumber, realName, contactPhone) => {
    const sql = `select p.pay_type,p.audit_remarks,p.gender,p.breed,p.coat_color, p.id,p.audit_status,m.real_name,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,p.create_time,p.pet_photo_url
              from  wx_pet_register_info p,sys_branch s,wx_pet_master m
              where
              p.area_code = s.code and m.creator_id = p.creator_id and m.id = p.master_id
              and p.pet_state > 0
              and p.audit_status = 1
              and m.id_number = '${idNumber}'
              and m.real_name = '${realName}'
              and m.contact_phone ='${contactPhone}'
              order by p.create_time desc `;
    const result = await conn.query(sql);
    return result;
}
exports.queryRegList = async (openId, unionId) => {
    const wxPubRegIdsResult = await conn.query(`select pet_reg_id from wx_pub_petInf_rel where openId = ? and unionId = ?`, [openId, unionId]);
    const wxPubRegIds = wxPubRegIdsResult.map(obj => obj.pet_reg_id && obj.pet_reg_id);
    const petRegInfoIdsResult = await conn.query(`select id from wx_pet_register_info where creator_id = ? and pay_type <> -1 `, [openId]);
    const petRegInfoIds = petRegInfoIdsResult.map(obj => obj.id);
    const resultRegIds = Array.from(new Set(wxPubRegIds.concat(petRegInfoIds)));
    console.log(169, resultRegIds);
    if (resultRegIds.length == 0) {
        return [];
    }
    const resultSql = ` select p.pay_type,p.audit_remarks,p.gender,p.breed,p.coat_color, p.id,p.audit_status,m.real_name,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,p.create_time,p.pet_photo_url 
                 from  wx_pet_register_info p,sys_branch s,wx_pet_master m
                 where 
                 p.area_code = s.code and m.creator_id = p.creator_id and m.id = p.master_id
                 and p.id in (?)
                 and p.dog_reg_num <> ''
                 order by p.create_time desc `;
    const result = await conn.query(resultSql, [resultRegIds]);
    return result;
}
exports.findBindPetOpenIds = async (petRegIds) => {
    if (petRegIds.length > 0) {
        const sql = `select * from wx_pub_petInf_rel wf where wf.pet_reg_id in (?)`;
        const result = await conn.query(sql, [petRegIds]);
        return result;
    } else {
        return [];
    }
}
exports.judePetExists = async (id) => {
    const sql = `select id from wx_pet_register_info where id = ? `;
    const result = await conn.query(sql, [id]);
    return result.length > 0;
}

exports.directBindDogRegNum = async (openid, unionId, petRegId, dogRegNum) => {
    const wx_pet_ref_sql = ' insert into wx_pub_petInf_rel set ? ';
    const wxPubPetInfRel = {
        unionId: unionId,
        pet_reg_id: petRegId,
        openId: openid,
        dog_reg_num: dogRegNum,
    }
    return await conn.query(wx_pet_ref_sql, wxPubPetInfRel);
}

exports.petRegIdPay = async (id) => {
    const sql = `select id,pay_type from wx_pet_register_info where id = ? `;
    const result = await conn.query(sql, [id]);
    return result;
}
exports.findAllArea = async () => {
    const sql = `select * from sys_branch  where parent_code = '130401' `; //
    return await conn.query(sql);
}

exports.judeWxUserIsBindPet = async (openId, unionId, petRegId) => {
    const sql = `select * from wx_pub_petInf_rel where openId = ? and unionId = ?  and pet_reg_id = ? `;
    const result = await conn.query(sql, [openId, unionId, petRegId]);
    return result;
}

exports.hasUserBindSysInfo = async (idNumber) => {
    const sql = `select id from wx_pet_master where id_number = ? `;
    const result = await conn.query(sql, [idNumber]);
    return result;
}

//年审
exports.yearCheck = async (creatorId, petRegId, options) => {
    const petRegSql = `update pet_register_info set pet_state = 3 where master_id = ? `;
    const petRegPromise = conn.query(petRegSql, [creatorId]);

    const petPrevSql = `update pet_prevention_img set year = ?,photo_url = ?, photo_url2 = ?, update_time = ? where pet_reg_id = ? `;
    const petPrevPromise = conn.query(petPrevSql, [options.year, options.photoUrl, options.photoUrl2, options.updateTime, petRegId]);

    return await Promise.all([petRegPromise, petPrevPromise]);

}

exports.queryRegInfoByRegId = async (queryRegInfoByRegId) => {
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
                r.pay_type != -1  and  r.id = ?  `
    const result = await conn.query(sql, [queryRegInfoByRegId]);
    const res = result.length > 0 ? result.map(obj => this.toTuoFeng(obj)) : [];
    return res;
}

exports.toTuoFeng = obj => {
    const result = {};
    for (let key in obj) {
        let resutKey = key.replace(/\_[a-z]/g, val => val.toUpperCase().replace(/\_/g, ''));
        result[resutKey] = obj[key];
    }
    return result;
}

exports.updatePetRegInfo = async (options) => {
    const petMasterSql = `update wx_pet_master set real_name = ?,id_number = ?,residence_permit = ?,contact_phone = ?,residential_address = ?,
                         update_time = ? ,id_number_pic1 = ?, id_number_pic1 = ?,
                        id_number_pic2 = ?, residence_permit_pic = ?, residence_permit_pic2 = ?
                        where creator_id = ?  `
    const petMasterSqlUpdatePromise = conn.query(petMasterSql, [
        options.realName,
        options.idNumber,
        options.residencePermit,
        options.contactPhone,
        options.residentialAddress,
        moment().format('YYYYMMDDHHmmss'),
        options.idNumberPic1,
        options.idNumberPic2,
        options.residencePermitPic,
        options.residencePermitPic2,
        options.openId
    ]);

    const petPrevSql = `update wx_pet_prevention_img set  photo_url = ?,photo_url2 = ?,update_time = ?  where  pet_reg_id = ?  `;
    const petPrevlUpdatePromise = conn.query(petPrevSql, [options.photoUrl, options.photoUrl2, moment().format('YYYYMMDDHHmmss'), options.petRegId]);

    const petRegSql = `update wx_pet_register_info  set pet_name = ?, gender = ?,breed = ?,coat_color = ?,
                        birthday = ?,area_code = ?,pet_photo_url = ?,update_time = ?,receive = ?,receive_name = ?,
                        courier_number = ?,receive_phone = ?,receive_addr = ?,deliver = ? where id = ? `
    const petRegModel = [
        options.petName || '',
        options.gender || 0,
        options.breed || '',
        options.coatColor || '',
        options.birthday || '',
        options.areaCode || '',
        options.petPhotoUrl || '',
        moment().format('YYYYMMDDHHmmss'),
        parseInt(options.receive || 0),
        options.receiveName || '',
        options.courierNumber || '',
        options.receivePhone || '',
        options.receiveAddr || '',
        parseInt(options.deliver || 2),
        options.petRegId
    ]
    const petRegUpdatePromise = conn.query(petRegSql, petRegModel);
    return await Promise.all([petMasterSqlUpdatePromise, petPrevlUpdatePromise, petRegUpdatePromise])
}