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

module.exports.getProductsSearch = async (name, ProductModel, pagination) => {
    return await ProductModel.find({ $text: { $search: name } , score: { $meta: "textScore" } })
            .sort( { score: { $meta: "textScore" } } )
            .limit(pagination.limit)
            .skip(pagination.offset)
            .exec()
}

module.exports.getProduct = async (id, ProductModel) => {
    return await ProductModel.findOne({_id: id})
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
