const { connect } = require('./dbconnection.module')

const { recipeSchema } = require('../model/recipe.model')
const { orderSchema } = require('../model/order.model')
const { ingredientSchema } = require('../model/ingredient.model')
const { materialSchema } = require('../model/material.model')
const { productSchema } = require('../model/product.model')

const { RecipeModel, IngredientModel, MaterialModel, OrderModel, ProductModel } = require("../modules/tenantModels.module")

const config = require('../config/config');

let db;

const getTenantDB = async(tenantId) => {
    const dbName = `tenant-${tenantId}`

    db = db ? db : await connect(config.db.uri);

    let tenantDb = db.useDb(dbName, {
        useCache: true
    })

    return tenantDb;
}

const getTenantModels = async(tenantId) => {
    const tenantDb = await getTenantDB(tenantId)

    const recipeModel = tenantDb.model(RecipeModel, recipeSchema)
    const orderModel = tenantDb.model(OrderModel, orderSchema)
    const productModel = tenantDb.model(ProductModel, productSchema)
    const ingredientModel = tenantDb.model(IngredientModel, ingredientSchema)
    const materialModel = tenantDb.model(MaterialModel, materialSchema)

    return {
        recipeModel,
        orderModel,
        productModel,
        ingredientModel,
        materialModel
    }
}


module.exports = getTenantModels
