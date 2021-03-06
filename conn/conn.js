const mysql = require("mysql2");
const config = require("../config/config");
module.exports = {
  query: (sql, options) => {
    const poolCluster = mysql.createPoolCluster({
      removeNodeErrorCount: 1, // Remove the node immediately when connection fails.
      defaultSelector: "RR" //RR,RANDOM,ORDER
    });
    for (let node in config.mysql) {
      poolCluster.add(`"${node}"`, config.mysql[`${node}`]);
    }
    return new Promise((resolve, reject) => {
      poolCluster.getConnection(function (err, connection) {
        if (err) {
          reject(err);
        } else {
          connection.query(sql, options, function (error, results, fields) {
            if (error) {
              reject(error);
            } else {
              //pool.releaseConnection(conn)，在mysql中生效,mysql2中，connection.release();该方法太坑，不生效,总是报错链接过多
              poolCluster.end();
              resolve(results);
            }
          });
        }
      });
    });
  }
};