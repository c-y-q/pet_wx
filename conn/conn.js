const mysql = require('mysql2');
const config = require('../config/config');
module.exports = ()=>{
    const pool = mysql.createPool(config.mysql);
    const promisePool = pool.promise();
    return promisePool;
};
