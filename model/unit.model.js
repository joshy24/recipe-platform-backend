const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const { UnitModel } = require("../modules/tenantModels.module")

const MODEL_NAME = UnitModel

const schema = new Schema({
    name: {
        required: true,
        type: String,
        unique: true
    },
    abbreviation: {
        required: true,
        type: String,
        unique: true
    },
    amount: {
        type: Number,
        required: true,
    },
    isParent: {
        type: Boolean,
        required: true,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    }
}, { timestamps: true })

schema.plugin(mongoosePaginate);

module.exports = { 
    unitModel: mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, schema),
    unitSchema: schema
}