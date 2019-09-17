module.exports = {
    session: {
        secret: 'testcharts',
        key: 'testcharts',
        maxAge: 2592000000
    },
    mysql: {
        host: '192.168.50.111',
        port: 3306,
        user: 'root',
        password: '123456',
        database: 'manage-sys_db',
        charset: 'utf8', 
        acquireTimeout: 10000, //获取连接的毫秒
        waitForConnections: true,
        connectionLimit: 10, //单次可创建最大连接数
        queueLimit: 0 //连接池的最大请求数，从getConnection方法前依次排队。设置为0将没有限制
    },
    wxpublic:{
            appid: 'wx833268732e68920c',
            appsecret: '92d5f8b18485998950486d25a41ca14c',
            access_token: '',
            token: '123456',
            encodingAESKey: 'olz6qa2Ew77LFRB7GVGoHraPeGvVBX3SerO0ehVIjFp',
            checkSignature: true // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
    }
}
