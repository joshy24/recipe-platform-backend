const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const { OrderModel } = require("../modules/tenantModels.module")

const MODEL_NAME = OrderModel

const schema = new Schema({
    name: {
        required: true,
        type: String
    },
    fulfillment_date: {
        type: Date,
        default: Date.now()
    },
    status: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now()
    },
    note: {
        type: String,
        maxlength: 500,
        minlength: 2
    },
    products: [{
        product:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        quantity: {
            type: Number,
        }
    }]
})

schema.plugin(mongoosePaginate);

schema.index({name: "text"}, {unique:false});

module.exports = { 
    orderModel: mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, schema),
    orderSchema: schema
}