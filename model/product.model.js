const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const { ProductModel } = require("../modules/tenantModels.module")

const MODEL_NAME = ProductModel

const schema = new Schema({
    name:{
        type: String,
        required: true,
        unique: true
    },
    profit_margin:{
        type: Number,
    },
    labour_cost: {
        type: Number,
    },
    overhead_cost: {
        type: Number,
    },
    actual_selling_price: {
        type: Number,
    },
    created: {
        type: Date,
        default: Date.now()
    },
    recipes: [{
        recipe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe'
        },
        quantity: {
            type: Number
        },
        unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit'
        }
    }],
    materials: [{
        material: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Material'
        },
        quantity: {
            type: Number,
        },
        unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit'
        }
    }]
})

schema.plugin(mongoosePaginate);

schema.index({name: "text"});

module.exports = { 
    productModel: mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, schema),
    productSchema: schema
}