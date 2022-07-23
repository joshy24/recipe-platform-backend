'use strict'

module.exports = {
    name: 'Profit Table',
    version: '1.0.0',
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    socket_port: process.env.SOCKET_PORT,
    base_url: process.env.BASE_URL,
    db: {
        uri: process.env.DB_URL,
        options: {
            /*user: process.env.DB_USER,
            pass: process.env.DB_PWD,*/
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            autoIndex: true,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 30000
        }
    },
    secret: process.env.JWT_SECRET_KEY,
    reset_secret: process.env.RESET_SECRET_KEY,
    paystack: {
        secret: process.env.PAYSTACK_SECRET
    },
}