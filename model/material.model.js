const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const { MaterialModel } = require("../modules/tenantModels.module")

const MODEL_NAME = MaterialModel

const schema = new Schema({
    name: {
        minlength: 2,
        maxlength: 250,
        required: true,
        type: String,
    },
    purchase_quantity: {
        amount: Number,
        unit: String
    },
    purchase_size: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    created: {
        type: Date,
        default: Date.now()
    },
    quantity_in_stock: {
        required: true,
        type: Number
    }
})

schema.plugin(mongoosePaginate);

schema.index({name: "text"}, {unique:true});

module.exports = { 
    materialModel: mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, schema),
    materialSchema: schema
}