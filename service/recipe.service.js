const bcrypt = require('bcryptjs');

module.exports.createRecipe = async(data, RecipeModel) => {
    var recipe = new RecipeModel(data)
    recipe.created = Date.now()

    return await recipe.save()
}

module.exports.getRecipesCount = async (RecipeModel) => {
    return await RecipeModel.estimatedDocumentCount();
}

module.exports.getAllRecipes = async (RecipeModel, pagination) => {
    return await RecipeModel.paginate({}, pagination)
}

module.exports.getRecipesSearch = async (name, RecipeModel) => {
    //Needs to be refactored
    return await RecipeModel.paginate({ $text: { $search: name } }, {page: 0, limit: 1000})
}

module.exports.findRecipesFromArrayIds = async(arrayIds, RecipeModel, page, limit) => {
    return await RecipeModel.paginate({_id: { $in: arrayIds} }, {page,limit})
}

module.exports.findRecipesFromArrayIdsNoPagination = async(arrayIds, RecipeModel) => {
    return await RecipeModel.find({_id: { $in: arrayIds} }).lean()
}

module.exports.getRecipesNotInArray = async(data_array, RecipeModel) => {
    return await RecipeModel.find({_id: {$nin: data_array}}).lean()
}

module.exports.getRecipesNotInArrayWithSearchTerm = async(data_array, page, limit, RecipeModel, name) => {
    
    let query = {
        _id: {$nin: data_array}
    }

    if(!!name){
        query = {...query, $text: { $search: name }}
    }

    return await RecipeModel.paginate(query, {page,limit})
}

module.exports.getAllRecipesToAdd = async(RecipeModel) => {
    return await RecipeModel.find({}).lean()
}

module.exports.getAllRecipesToAddSearch = async(page, limit, RecipeModel, name) => {
    let query = {}

    if(!!name){
        query = {...query, $text: { $search: name }}
    }

    return await RecipeModel.paginate(query, {page,limit})
}

module.exports.getRecipe = async (id, RecipeModel) => {
    return await RecipeModel.findOne({_id: id}).lean()
}

module.exports.deleteRecipe = async(id, RecipeModel) => {
    return await RecipeModel.deleteOne({_id: id})
}

module.exports.updateRecipe = async(id, new_data, RecipeModel) => {
    const recipe = await RecipeModel.findOne({_id:id})

    if(recipe){
        recipe.set(new_data);

        return await recipe.save();
    }
    
    return null;
}

module.exports.getRecipesFromIngredientsArray = async(arrayIds, RecipeModel) => {
    return await RecipeModel.find({'ingredients.ingredient': { $in: arrayIds }}).lean()
}

module.exports.getRecipesUsingIngredient = async(RecipeModel) => {
    
}
