const bcrypt = require('bcryptjs');

module.exports.createProduct = async(data, ProductModel) => {
    var product = new ProductModel(data)
    product.created = Date.now()

    return await product.save()
}

module.exports.getProductsCount = async (ProductModel) => {
    return await ProductModel.estimatedDocumentCount();
}

module.exports.getAllProducts = async (ProductModel, pagination) => {
    return await ProductModel.paginate({}, pagination)
}

module.exports.getProductsSearch = async (name, ProductModel, {page, limit}) => {
    return await ProductModel.paginate({ $text: { $search: name } }, {page, limit})
}

module.exports.getProduct = async (id, ProductModel) => {
    return await ProductModel.findOne({_id: id})
}

module.exports.getProductsFromIdsArray = async (arrayOfIds, ProductModel, page, limit) => {
    return await ProductModel.paginate({_id: {$in: arrayOfIds}}, {page, limit})
}

module.exports.getProductsFromIdsArrayNoPagination = async (arrayOfIds, ProductModel) => {
    return await ProductModel.find({_id: {$in: arrayOfIds}}).lean()
}

module.exports.getProductsNotInArray = async(data_array, ProductModel) => {
    return await ProductModel.find({_id: {$nin: data_array}}).lean()
}

module.exports.getProductsNotInArrayWithSearchTerm = async(data_array, page, limit, ProductModel, name) => {
    
    let query = {
        _id: {$nin: data_array}
    }

    if(!!name){
        query = {...query, $text: { $search: name }}
    }

    return await ProductModel.paginate(query, {page,limit})
}

module.exports.getAllProductsToAdd = async(ProductModel) => {
    return await ProductModel.find({}).lean()
}

module.exports.getAllProductsToAddSearch = async(page, limit, ProductModel, name) => {
    let query = {}

    if(!!name){
        query = {...query, $text: { $search: name }}
    }

    return await ProductModel.paginate(query, {page,limit})
}

module.exports.deleteProduct = async(id, ProductModel) => {
    return await ProductModel.deleteOne({_id: id})
}

module.exports.updateProduct = async(id, new_data, ProductModel) => {
    const product = await ProductModel.findOne({_id:id})

    if(product){
        product.set(new_data);

        return await product.save();
    }
    
    return null;
}

module.exports.getProductsUsingIngredient = async(ProductModel) => {
    
}

module.exports.getProductsFromMaterialsArray = async(materialsIds, ProductModel) => {
    return await ProductModel.find({'materials.material': { $in: materialsIds }})
}


module.exports.getProductsFromRecipesArray = async(recipesIds, ProductModel) => {
    return await ProductModel.find({'recipes.recipe': { $in: recipesIds }})
} 