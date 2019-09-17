const conn = require('../conn/conn')();
const moment = require('moment');

exports.findPetColor = async () => {
    const sql = `select * from pet_color`;
    return await conn.query(sql);
}

exports.judgedogRegNum = async (dogRegNum) => {
    const sql = `select * from  pet_register_info where dog_reg_num = '${dogRegNum}' `;
    return await conn.query(sql);
}

exports.addPetMaster = async (creatorId,uuid, options) => {
    const sql = `insert into pet_master set ? `;
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
        residence_permit_pic: options.residencePermitPic || ''
    }
    return await conn.query(sql, petMaseterModel);
}

exports.addPetregister = async (creatorId,petRegId, uuid, options) => {
    const sql = `insert into pet_register_info set ? `;
    const petRegModel = {
        id : petRegId,
        pet_name: options.petName || '',
        gender: options.gender || 0,
        breed: options.breed || '',
        coat_color: options.coatColor || '',
        birthday: options.birthday || '',
        area_code: options.areaCode || '',
        dog_reg_num: options.dogRegNum || 0,
        epc_num: options.epcNum || '',
        submit_source : 2 || '',
        audit_status: options.auditStatus || 0,
        master_id :uuid || '',
        creator_id:creatorId,
        audit_remarks: options.auditRemarks || '',
        pet_photo_url: options.petPhotoUrl || '',
        pet_category_id: options.petCategoryId || '',
        pet_state : 0,
        pay_type : -1,
        first_reg_time : moment().format('YYYYMMDDHHmmss'),
        expire_time : addyear(),
        renew_time: '',
        change_time: '',
        logout_time:'',
        create_time : moment().format('YYYYMMDDHHmmss'),
        update_time : moment().format('YYYYMMDDHHmmss'),
    }
    return await conn.query(sql, petRegModel);
}

exports.addPetPreventionInfo = async (creatorId, petRegId, options) => {
  const sql = `insert into pet_prevention_img set ? `;
  const petPreventionModel = {
    year:moment().format('YYYY'),
    pet_reg_id : petRegId,
    creator_id: creatorId ||'',
    photo_url: options.photoUrl || '',
    create_time : moment().format('YYYYMMDDHHmmss')|| '',
    update_time : moment().format('YYYYMMDDHHmmss')|| ''
  };
  return await conn.query(sql, petPreventionModel);
}

exports.queryRegStatu = async (openId) => {
     const sql = `select p.pay_type,p.audit_remarks, t.name petType, c.color petColor,p.gender,p.breed,p.coat_color, p.id,p.audit_status,m.real_name,m.residential_address,m.contact_phone,s.name,p.dog_reg_num,p.pet_name,p.pet_state,p.renew_time,p.create_time,p.pet_photo_url 
                 from  pet_register_info p,sys_area s,pet_master m, pet_type t,pet_color c
                 where 
                 p.area_code = s.code and m.creator_id = p.creator_id and m.id = p.master_id
                 and p.creator_id = '${openId}'
                 and p.breed = t.id
                 and p.coat_color = c.id
                 order by p.create_time desc `;
    return await conn.query(sql);
}

exports.findPetType = async()=>{
    const sql = `select * from pet_type`;
    return await conn.query(sql);
}

exports.findPetColor = async()=>{
     const sql = `select * from pet_color`;
     return await conn.query(sql);
}

function addyear(){
    return moment().add(1, 'y').format('YYYYMMDDHHmmss');
}

exports.isWxPubBind = async (unionId, openId) => {
      const sql = `select * from wx_pub where unionId = '${unionId}' or openId = '${openId}' `;
      const result = await conn.query(sql);
      return result;
}

exports.eiditDogRegNum = async (dogRegNum,dogRegId,creatorId ) => {
    const sql = ` update pet_register_info set dog_reg_num = ? where id =?  and creator_id = ? `;
    const result = await conn.query(sql, [dogRegNum, dogRegId, creatorId]);
    return result;
}

exports.isBindDogRegNum = async (dogRegNum) => {
 const sql = ` select * from  pet_register_info where dog_reg_num = ?`;
 const result = await conn.query(sql, [dogRegNum]);
 return result[0].length > 0;
}