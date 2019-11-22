const conn = require('../conn/conn');
const moment = require('moment');

const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
exports.getMyUUId = n => {
    let str = '';
    for (let i = 0; i < n; i++) {
        let num = parseInt(Math.random() * 36);
        str += chars[num];
    }
    return str;
}

exports.addWxOrder = async (options) => {
    const sql = `insert into wx_order set ? `;

    return await conn.query(sql, options);
}

//订单状态：0未支付，1.支付成功
exports.queryOrder = async (creatorId, orderNum) => {
    let sql = 'select * from wx_order where 1=1   ';
    const queryParam = [];
    if (orderNum) {
        sql += ' and order_num = ?  ';
        queryParam.push(orderNum);
    }
    if (creatorId) {
        sql += ' and creator = ? ';
        queryParam.push(creatorId);
    }
    const result = await conn.query(sql, queryParam);
    return result;
}

exports.queryPrice = async (code) => {
    const sql = `select data from sys_params where type = 'paymentType' and code = ? `;
    const result = await conn.query(sql, [code]);
    return parseInt(result[0].data) || 0;
}

exports.queryRegInfoAuditStatus = async (creatorId) => {
    const sql = `select p.audit_status auditStatus from wx_pet_master m ,wx_pet_register_info p where  m.creator_id = ? and m.id = p.master_id   `;
    return await conn.query(sql, [creatorId]);
}

exports.updateOrder = async (orderNum, orderStatus, payTime) => {
    let sql = ` update wx_order set orderStatus = ?, pay_time = ?  where order_num = ?  `;
    return await conn.query(sql, [orderStatus, payTime, orderNum]);
}