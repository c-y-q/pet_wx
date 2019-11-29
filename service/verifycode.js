const conn = require('../conn/conn');

exports.isfree = async (phone, dogRegNum) => {
    const sql = ` SELECT * FROM pet_register_info r INNER JOIN pet_master m ON r.master_id = m.id WHERE r.dog_reg_num = ? and m.contact_phone = ? `;
    console.log('----sql----', sql);
    const result = await conn.query(sql, [
        dogRegNum,
        phone
    ]);
    return result;
}