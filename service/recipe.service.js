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
    return await RecipeModel.paginate({ $text: { $search: name } }, {offset: 0, limit: 1000})
}

module.exports.findRecipesFromArrayIds = async(arrayIds, RecipeModel, offset, limit) => {
    return await RecipeModel.paginate({_id: { $in: arrayIds} }, {offset,limit})
}

module.exports.getRecipesNotInArray = async(data_array, RecipeModel) => {
    return await RecipeModel.find({_id: {$nin: data_array}}).lean()
}

module.exports.getAllRecipesToAdd = async(RecipeModel) => {
    return await RecipeModel.find({}).lean()
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

module.exports.getRecipesUsingIngredient = async(RecipeModel) => {
    
}
