var mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
var Schema = mongoose.Schema;

const { RecipeModel } = require("../modules/tenantModels.module")

var MODEL_NAME = RecipeModel

var schema = new Schema({
    name: {
        minlength: 2,
        maxlength: 250,
        required: true,
        type: String,
    },
    description: {
        required: true,
        type: String,
    },
    category: {
        type: String,
    },
    yield:{
        amount: Number,
        unit: String
    }, 
    created: {
        type: Date,
        default: Date.now()
    },
    ingredients: [{
        ingredient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient'
        },
        quantity: {
            type: Number,
        }
    }]
})

schema.plugin(mongoosePaginate);

schema.index({name: "text"});

module.exports = { 
    recipeModel: mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, schema),
    recipeSchema: schema
}