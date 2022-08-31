
module.exports.createIngredient = async(data, IngredientModel) => {
    const ingredient = new IngredientModel(data)
    ingredient.created = Date.now()

    return await ingredient.save()
}

module.exports.deleteIngredient = async(id, IngredientModel) => {
    return await IngredientModel.deleteOne({_id: id})
}

module.exports.findIngredientsFromArrayIdsNoPagination = async(arrayIds, IngredientModel) => {
    return await IngredientModel.find({_id: { $in: arrayIds}}).lean()
}

module.exports.findIngredientsFromArrayIds = async(arrayIds, IngredientModel, offset, limit) => {
    return await IngredientModel.paginate({_id: { $in: arrayIds}},{offset,limit})
}

module.exports.countIngredients = async(IngredientModel) => {
    return await IngredientModel.estimatedDocumentCount();
}

module.exports.getAllIngredients = async(IngredientModel, pagination, searchTerm, status) => {
    let query = {}

    switch(status){
        case "Low":
            query = {...query, $expr: { $gt: [ "$lowLevel" , "$quantity_in_stock" ] }}
        break;
        case "Normal":
            query = {...query, $expr: { $gte: [ "$quantity_in_stock" , "$lowLevel" ] }}
        break;
    }

    return await IngredientModel.paginate(query, pagination);
}

module.exports.getIngredientsSearch = async(searchTerm, IngredientModel) => {
    return await IngredientModel.find({ $text: { $search: searchTerm } })
            .limit(pagination.limit)
            .skip(pagination.offset)
            .exec()
}

module.exports.getIngredientFromId = async(data, IngredientModel) => {

}

module.exports.getAllIngredientsToAdd = async(IngredientModel) => {
    return await IngredientModel.find({}).lean()
}

module.exports.getIngredientsNotInArray = async(data_array, IngredientModel) => {
    return await IngredientModel.find({_id: {$nin: data_array}}).lean()
}

module.exports.getIngredientsNotInArray = async(data_array, offset, limit, name, IngredientModel) => {

    let query = {
        _id: {$nin: data_array}
    }

    if(!!name){
        query = {...query, $text: { $search: name }}
    }

    return await IngredientModel.paginate(query, {offset,limit})
}

module.exports.getIngredientCount = async(data, IngredientModel) => {

}

module.exports.updateIngredient = async(id, data, IngredientModel) => {
    const ingredient = await IngredientModel.findOne({_id:id})

    if(ingredient){
        ingredient.set(data);

        return await ingredient.save();
    }
    
    return null;
}
