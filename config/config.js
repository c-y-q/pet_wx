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
    wxpublic: {
        appid: 'wx833268732e68920c',
        appsecret: '92d5f8b18485998950486d25a41ca14c',
        access_token: '',
        token: '123456',
        encodingAESKey: 'olz6qa2Ew77LFRB7GVGoHraPeGvVBX3SerO0ehVIjFp',
        checkSignature: true // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
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
    pay: {
        mid: "898130448161057", // 商户号  998340149100000
        merchantUserId: "898340149000005", // 商户用户名
        tid: "04936623", // 终端号 88880001
        Authorization: 'Authorization', // 权限
        md5Key: 'rkx3iEaYfzWrDDCzsKPmfBXsWJpEj2M7SsChiestNkdkc5yE',
        notifyUrl: 'http://eggsy.free.idcfengye.com/pay/wpPayNotify',
        unfolderUrl: 'https://qr.chinaums.com/netpay-route-server/api/'
    }
}