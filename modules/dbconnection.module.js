const mongoose = require('../modules/mongoose.module')
const log = require('./logger.module')

const config = require('../config/config');

const connect = async (url) => {
    return new Promise(async (resolve, reject) => {
        try{
            const connection = (mongoose.connection.readyState == 1 || mongoose.connection.readyState == 2) ? mongoose.connection : await mongoose.connect(url, config.db.options)

            if(!connection){
                log.error(`Error connecting to Database url : `+url)
            }
            
            resolve(connection)
        }
        catch(err){
            reject(err)
        }
    })
}

module.exports = {
    connect
}