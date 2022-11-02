var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');

var MODEL_NAME = "Tenant"

var schema = new Schema({
    firstname: {
        minlength: 2,
        maxlength: 100,
        required: true,
        type: String,
    },
    lastname: {
        minlength: 2,
        maxlength: 100,
        required: true,
        type: String,
    },
    phone_number: {
        type: String,
        maxlength: 30,
        minlength: 8,
        unique: true
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 100,
        unique: true
    },
    created: {
        type: Date,
        default: Date.now()
    },
    tokens:[{
        type: String   
    }],
    password: {
        type: String,
        required: true
    }, 
    reset_token: {
        token: String,
        created: Date
    },
    verified: {
        type: Boolean,
        default: false,
        required: true
    },
    profit_margin: {
        type: Number,
        default: 0
    }
})

schema.methods.comparePassword = function(password){
    return bcrypt.compare(password, this.password);
}      

module.exports =  { 
    
    tenantModel: mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, schema),
    tenantSchema: schema

}



