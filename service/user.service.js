const User = require("../models/user.model");
var bcrypt = require('bcryptjs');

module.exports.saveUser = (data) => {
    return new Promise((resolve, reject) => {
        var user = new User(data)
        user.created = Date.now()

        if(user.password){
            user.password = bcrypt.hashSync(user.password, 10);
        }

        user.save((err, created) => {
            if(err){
                reject(err)
            }

            resolve(created)
        })
    })
}


module.exports.getUserEmailPhoneNumber = (email, phone_number) => {

}

module.exports.getUserEmail = (email, phone_number) => {

}

module.exports.updateUser = (email, phone_number) => {

}

module.exports.removeTokenAndSave = (email, phone_number) => {

}