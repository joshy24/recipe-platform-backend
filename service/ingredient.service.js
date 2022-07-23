
module.exports.createIngredient = async(data, IngredientModel) => {
    const ingredient = new IngredientModel(data)
    ingredient.created = Date.now()

    return await ingredient.save()
}

module.exports.upateIngredient = async(data, IngredientModel) => {

}

module.exports.deleteIngredient = async(data, IngredientModel) => {

}

module.exports.findIngredientsFromArrayIds = async(arrayIds, IngredientModel) => {
    return await IngredientModel.find({_id: { $in: arrayIds} })
}

module.exports.countIngredients = async(IngredientModel) => {
    return await IngredientModel.estimatedDocumentCount();
}

module.exports.getAllIngredients = async(IngredientModel, pagination) => {
    return await IngredientModel.paginate({}, pagination);
}

module.exports.getIngredientsSearch = async(searchTerm, IngredientModel) => {
    return await IngredientModel.find({ $text: { $search: searchTerm } , score: { $meta: "textScore" } })
            .sort( { score: { $meta: "textScore" } } )
            .limit(pagination.limit)
            .skip(pagination.offset)
            .exec()
}

module.exports.getIngredientFromId = async(data, IngredientModel) => {

}

module.exports.getIngredientsNotInArray = async(data_array, IngredientModel) => {
    return await IngredientModel.find({_id: {$nin: data_array}}).lean()
}

module.exports.getIngredientCount = async(data, IngredientModel) => {

}

module.exports.updateIngredient = async(id, data, IngredientModel) => {

}
