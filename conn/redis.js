const config = require("../config/config");
const Redis = require('ioredis');
const cache = new Redis.Cluster(config.redis.config);
module.exports = {
    cache: cache,
    reqCount: config.redis.reqCount,
    expireTime: config.redis.expireTime
};