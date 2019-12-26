module.exports = {
    session: {
        secret: 'testcharts',
        key: 'testcharts',
        maxAge: 2592000000
    },
    mysql: {
        node1: {
            host: '192.168.50.111',
            port: 3306,
            user: 'root',
            password: '123456',
            database: 'manage-sys-pro-emp',
            charset: 'utf8',
            waitForConnections: true,
            connectionLimit: 10, //单次可创建最大连接数
            queueLimit: 0 //连接池的最大请求数，从getConnection方法前依次排队。设置为0将没有限制
        },
        node2: {
            host: '192.168.50.111',
            port: 3306,
            user: 'root',
            password: '123456',
            database: 'manage-sys-pro-emp',
            charset: 'utf8',
            waitForConnections: true,
            connectionLimit: 10, //单次可创建最大连接数
            queueLimit: 0 //连接池的最大请求数，从getConnection方法前依次排队。设置为0将没有限制
        },
        node3: {
            host: '192.168.50.111',
            port: 3306,
            user: 'root',
            password: '123456',
            database: 'manage-sys-pro-emp',
            charset: 'utf8',
            waitForConnections: true,
            connectionLimit: 10, //单次可创建最大连接数
            queueLimit: 0 //连接池的最大请求数，从getConnection方法前依次排队。设置为0将没有限制
        }
    },

    // redis: {
    //     config: [{
    //         port: 6379,
    //         host: '172.169.1.249'
    //     }, {
    //         port: 6380,
    //         host: '172.169.1.249'
    //     }, {
    //         port: 6379,
    //         host: '172.169.1.248'
    //     }, {
    //         port: 6380,
    //         host: '172.169.1.248'
    //     }, {
    //         port: 6379,
    //         host: '172.169.1.247'
    //     }, {
    //         port: 6380,
    //         host: '172.169.1.247'
    //     }],
    //     //限制每个微信用户每3分钟才能访问一次添加宠物注册信息
    //     expireTime: 60 * 3,
    //     reqCount: 1
    // },
    redis: {
        config: {
            port: 6300, // Redis port
            host: '192.168.50.111', // Redis host
            password: '123',
            db: 0,
        }
    },

}