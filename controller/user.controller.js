
const RecipeService = require("../service/recipe.service")
const IngredientService = require("../service/ingredient.service")
const ProductService = require("../service/product.service")
const MaterialService = require("../service/material.service")
const OrderService = require("../service/order.service")
const TenantService = require("../service/tenant.service")
const TenantModels = require("../modules/tenantModels.module")

const { MATERIAL, INGREDIENT } = require("../modules/constants.module")

const bcrypt = require("bcryptjs")

const config = require('../config/config');

const jwt = require("jsonwebtoken")

const mongoose = require('mongoose');

module.exports.login = async(req,res) => {
    const {email, password} = req.body

    if(!email || !password){
        return res.status(400).send({response: "bad request"})
    }

    try{
        var tenant = await TenantService.getTenantFromEmail(email.trim(), req.tenantModel)
        
        if(!tenant){
            return res.status(200).send({"tenant":{}, "token":"", "msg": "not_found" });
        }
        else{
            const confirmation = await tenant.comparePassword(password.trim())

            if(confirmation){
                const token = jwt.sign({tenantId: tenant._id, firstname: tenant.firstname, lastname: tenant.lastname}, config.secret, {issuer: "Profit Table", audience: "Tenant", expiresIn: 60*60*24*500, algorithm: "HS256"});
                
                tenant.tokens.push(token);

                await TenantService.updateTenant(tenant._id, tenant, req.tenantModel)
                        
                tenant.tokens = null;
                tenant.password = null;

                return res.status(200).send({"tenant":tenant, "token":token, "msg": "success" });
            }
            else{
                return res.status(200).send({"business":{}, "token":null, "msg": "wrong_password" });
            }
        }
    }
    catch(err){
        console.log({err})
        return res.status(500).send(err)
    } 
}

module.exports.signup = async(req,res) => {
    const { firstname, lastname, phone_number, email, password } = req.body

    if(!firstname || !lastname || !phone_number || !email || !password){
        return res.status(400).send({response: "bad request"});
    }

    try{
        let existingTenant = await TenantService.getTenantFromEmailAndPhoneNumber(email, phone_number, req.tenantModel)

        if(existingTenant){
            return res.status(400).send({"tenant":null, "token":null, "msg": "user_exists"});
        }

        let createdTenant = await TenantService.createTenant({firstname, lastname, phone_number, email, password}, req.tenantModel);
    
        if(createdTenant){
            const token = jwt.sign({tenantId: createdTenant._id, firstname: createdTenant.firstname, lastname: createdTenant.lastname}, config.secret, {issuer: "Profit Table", audience: "Tenant", expiresIn: 60*60*24*500, algorithm: "HS256"});
                
            createdTenant.tokens.push(token);

            await TenantService.updateTenant(createdTenant._id, createdTenant, req.tenantModel)

            createdTenant.tokens = null;
            createdTenant.password = null;

            return res.status(200).send({"tenant":createdTenant, "token":token, "msg": "success" });
        }
        else{
            return res.status(500).send({response: "Error Creating User"})
        }
    }
    catch(err){
        console.log(err)
        return res.status(500).send(err)
    } 

}

module.exports.changePassword = async(req,res) => {
    const {oldPassword, newPassword, newPasswordAgain} = req.body

    if(newPasswordAgain!=newPasswordAgain){
        return res.status(400).send({response: "bad request"})
    }

    const confirmation = await req.tenant.comparePassword(oldPassword.trim())

    if(confirmation){
        req.tenant.password = bcrypt.hashSync(newPassword, 10);

        await TenantService.updateTenant(req.tenant._id, req.tenant, req.tenantModel)

        req.tenant.tokens = null;
        req.tenant.password = null;

        return res.status(200).send({response: req.tenant})
    }

    return res.status(400).send({response: "wrong password"})
}





//Dashboard

module.exports.entitiesCount = async (req,res) => {

    try{
        const materialsCount = await MaterialService.countMaterials(req.tenantModels.materialModel)

        const ingredientsCount = await IngredientService.countIngredients(req.tenantModels.ingredientModel)

        const recipesCount = await RecipeService.getRecipesCount(req.tenantModels.recipeModel)

        const productsCount = await ProductService.getProductsCount(req.tenantModels.productModel)

        const pendingOrdersCount = await OrderService.getPendingOrdersCount(req.tenantModels.orderModel);

        const fulfilledOrdersCount = await OrderService.getFulfilledOrdersCount(req.tenantModels.orderModel);
        
        return res.status(200).send({response: {
            pendingOrdersCount,
            fulfilledOrdersCount,
            productsCount,
            recipesCount,
            inventoryCount: materialsCount + ingredientsCount
        }})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.recentOrders = async(req,res) => {
    try{
        const orders = await OrderService.getRecentOrders(req.tenantModels.orderModel)

        return res.status(200).send({response: orders})
    }
    catch(err){
        return res.status(500).send({response: err})
    }

}





/*
Recipes / Recipe
*/

module.exports.getAllRecipes = async(req,res) => {
    
    const { offset, limit } = req.query;

    try{
        let allRecipes = await RecipeService.getAllRecipes(req.tenantModels.recipeModel, { offset, limit })

        if(allRecipes.docs && allRecipes.docs.length == 0 ){
            return res.status(200).send({response: allRecipes})
        }

        const allRecipesArray = await Promise.all(allRecipes.docs.map(async (aRecipe) => {

            let recipeIngredientsIdsArray = aRecipe.ingredients.map(ingredient => {
                return ingredient.ingredient;
            })
    
            const fullIngredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(recipeIngredientsIdsArray, req.tenantModels.ingredientModel)
            
            let recipeIngredientsCost = 0;

            fullIngredientObjects.map(fullIngredientObject => {
                const foundIngredient = aRecipe.ingredients.find(recipeIngredient => recipeIngredient.ingredient.toString() == fullIngredientObject._id.toString())
                
                recipeIngredientsCost += (foundIngredient.quantity * fullIngredientObject.price) 
            })

            const newRecipeObject = {...aRecipe._doc, totalCost: recipeIngredientsCost}

            return newRecipeObject
        }))

        return res.status(200).send({response: {...allRecipes, docs: allRecipesArray}})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.searchRecipes = async(req,res) => {
    const { searchTerm } = req.query

    if(!searchTerm){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const allRecipes = await RecipeService.getRecipesSearch(searchTerm, req.tenantModels.recipeModel)

        if(allRecipes.docs && allRecipes.docs.length == 0 ){
            return res.status(200).send({response: allRecipes})
        }

        const allRecipesArray = await Promise.all(allRecipes.docs.map(async (aRecipe) => {

            let recipeIngredientsIdsArray = aRecipe.ingredients.map(ingredient => {
                return ingredient.ingedient;
            })
    
            const fullIngredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(recipeIngredientsIdsArray, req.tenantModels.ingredientModel)
    
            const recipeIngredientsCost = 0;

            fullIngredientObjects.map(fullIngredientObject => {
                const foundIngredient = aRecipe.ingredients.find(recipeIngredient => recipeIngredient.iongredient.toString() == fullIngredientObject._id.toString())
    
                recipeIngredientsCost += (foundIngredient.quantity * fullIngredientObject.price) 
            })

            const newRecipeObject = {...aRecipe._doc, totalCost: recipeIngredientsCost}

            return newRecipeObject
        }))

        return res.status(200).send({response: {...allRecipes, docs: allRecipesArray}})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.addRecipe = async(req,res) => {
    const { name, description, category= "", yield = {}, ingredients = [] } = req.body;

    if(!name || !description || !yield){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let createdRecipe = await RecipeService.createRecipe({name,description, category, yield, ingredients}, req.tenantModels.recipeModel)
        
        return res.status(200).send({response: createdRecipe})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.getRecipe = async(req,res) => {
    const { id } = req.query

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const recipe = await RecipeService.getRecipe(id, req.tenantModels.recipeModel)

        return res.status(200).send({response: recipe})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.editRecipe = async (req,res) => {
    const {name,description, category, yield, ingredients, _id} = req.body

    if(!_id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let updatedRecipe = await RecipeService.updateRecipe(_id, {name,description, category, yield, ingredients}, req.tenantModels.recipeModel)
    
        return res.status(200).send({updatedRecipe})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.deleteRecipe = async(req,res) => {
    const {id} = req.body

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let deletedRecipe = await RecipeService.deleteRecipe(id, req.tenantModels.recipeModel)
        
        return res.status(200).send({response: deletedRecipe})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.addIngredientsToRecipe = async(req,res) => {
    const {ingredients, id} = req.body

    if(!id || !ingredients){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let recipe = await RecipeService.getRecipe(id, req.tenantModels.recipeModel)

        if(!recipe){
            return res.status(400).send({response: "recipe not found"})
        }

        recipe.ingredients = [...recipe.ingredients, ...ingredients ]

        let updatedRecipe = await RecipeService.updateRecipe(id, recipe, req.tenantModels.recipeModel)
    
        return res.status(200).send({response: updatedRecipe})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.editRecipeIngredient = async(req,res) => {
    const {ingredient_id, quantity, id} = req.body

    if(!id || !ingredient_id || !quantity){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let recipe = await RecipeService.getRecipe(id, req.tenantModels.recipeModel)

        if(!recipe){
            return res.status(400).send({response: "recipe not found"})
        }

        const newIngredientsArray = recipe.ingredients.map(ingredient => {
            if (ingredient.ingredient.toString() === ingredient_id.toString()) {
              return {...ingredient, quantity: quantity};
            }
            return ingredient;
        });

        recipe.ingredients = []
        recipe.ingredients = newIngredientsArray;

        let updatedRecipe = await RecipeService.updateRecipe(id, recipe, req.tenantModels.recipeModel)
    
        return res.status(200).send({response: updatedRecipe})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.deleteRecipeIngredient = async(req,res) => {
    const {ingredient_id, id} = req.body

    if(!id || !ingredient_id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let recipe = await RecipeService.getRecipe(id, req.tenantModels.recipeModel)

        if(!recipe){
            return res.status(400).send({response: "recipe not found"})
        }

        const newIngredientsArray = recipe.ingredients.filter(ingredient => {
            return ingredient.ingredient.toString() != ingredient_id.toString();
        });

        recipe.ingredients = []
        recipe.ingredients = newIngredientsArray;

        let updatedRecipe = await RecipeService.updateRecipe(id, recipe, req.tenantModels.recipeModel)
    
        return res.status(200).send({response: updatedRecipe})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.getRecipeIngredients = async(req,res) => {
    const {id, offset, limit} = req.query

    if(!id || !offset || !limit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let recipe = await RecipeService.getRecipe(id, req.tenantModels.recipeModel)

        if(!recipe){
            return res.status(400).send({response: "recipe not found"})
        }

        if(recipe.ingredients.length == 0){
            return res.status(200).send({response: []})
        }

        let recipeIngredientsIdsArray = recipe.ingredients.map(ingredient => {
            return ingredient.ingredient;
        })

        const fullIngredientObjects = await IngredientService.findIngredientsFromArrayIds(recipeIngredientsIdsArray, req.tenantModels.ingredientModel, offset,limit)
        
        const recipeIngredients = fullIngredientObjects.docs.map(fullIngredientObject => {
            const foundIngredient = recipe.ingredients.find(recipeIngredient => recipeIngredient.ingredient.toString() == fullIngredientObject._id.toString())

            return {...fullIngredientObject._doc, quantity: foundIngredient.quantity, totalCost: foundIngredient.quantity*fullIngredientObject.price}
        })

        return res.status(200).send({response: recipeIngredients})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}








/*
Inventory
*/

module.exports.getInventory = async(req,res) => {
    const { limit, offset, type, searchTerm, status } = req.query;

    if(!limit || !offset || !type || !status){
        return res.status(400).send({response: "bad request"})
    }

    try{
        if(type.toLowerCase() == "ingredients" || type.toLowerCase() == "ingredient"){
            let allIngredients = await IngredientService.getAllIngredients(req.tenantModels.ingredientModel, {limit, offset}, searchTerm, status)
            
            return res.status(200).send({response: allIngredients})
        }
        
        if(type.toLowerCase() == "materials" || type.toLowerCase() == "material"){
            let allMaterials = await MaterialService.getAllMaterials(req.tenantModels.materialModel, {limit, offset}, searchTerm,  status)
            
            return res.status(200).send({response: allMaterials})
        }
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.searchInventory = async(req,res) => {
    const { pagination, type, name } = req.query;

    if(!pagination || !type || !name){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let results;

        if(type == TenantModels.IngredientModel){
            results = await IngredientService.getIngredientsSearch(searchTerm, req.tenantModels.ingredientModel, pagination)
        }

        if(type == TenantModels.MaterialModel){
            results = await MaterialService.getMaterialsSearch(searchTerm, req.tenantModels.materialModel, pagination)
        }

        return res.status(200).send({response: results})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.exportInventory = (req,res) => {
    
}

module.exports.deleteInventoryIngredient = async(req,res) => {
    const {id} = req.body

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let updatedIngredient = await IngredientService.deleteIngredient(id, req.tenantModels.ingredientModel)
    
        return res.status(200).send({response: updatedIngredient})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.deleteInventoryMaterial = async(req,res) => {
    const {id} = req.body

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let updatedMaterial = await MaterialService.deleteMaterial(id, req.tenantModels.materialModel)
    
        return res.status(200).send({response: updatedMaterial})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.addIngredientsToInventory = async (req,res) => {
    //This should be multiple i gredients but will work with one for now till we figure it out
    const {ingredient} = req.body
    
    if(!ingredient){
        return res.status(400).send({response: "bad request"})
    }

    try{
        ingredient.purchase_quantity = {
            amount: ingredient.purchase_quantity,
            unit: ingredient.purchase_size
        }

        const createdIngredient = await IngredientService.createIngredient(ingredient, req.tenantModels.ingredientModel);

        return res.status(200).send({response: createdIngredient})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.addMaterialsToInventory = async(req,res) => {
    //This should be multiple ingredients but will work with one for now till we figure it out
    const {material} = req.body

    if(!material){
        return res.status(400).send({response: "bad request"})
    }

    try{
        material.purchase_quantity = {
            amount: material.purchase_quantity,
            unit: material.purchase_size
        }

        const createdMaterial = await MaterialService.createMaterial(material, req.tenantModels.materialModel);

        return res.status(200).send({response: createdMaterial})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.editInventoryIngredient = async(req,res) => {
    const {ingredient} = req.query

    const new_ingredient = JSON.parse(ingredient)

    if(!new_ingredient){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let updatedIngredient = await IngredientService.updateIngredient(new_ingredient._id, new_ingredient, req.tenantModels.ingredientModel)
    
        return res.status(200).send({response: updatedIngredient})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.editInventoryMaterial = async(req,res) => {
    const {material} = req.query

    const new_material = JSON.parse(material)

    if(!new_material){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let updatedMaterial = await MaterialService.updateMaterial(new_material._id, new_material, req.tenantModels.materialModel)
    
        return res.status(200).send({response: updatedMaterial})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.getIngredientsToAdd = async(req,res) => {
    const { recipe_id } = req.query

    if(!recipe_id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const recipe = await RecipeService.getRecipe(recipe_id, req.tenantModels.recipeModel)

        if(!recipe){
            return res.status(404).send({response: "recipe not found"})
        }

        if(recipe.ingredients.length > 0){
            const recipe_ingredients_ids = recipe.ingredients.map(ingredient => {
                return ingredient.ingredient
            })
    
            const ingredients_found = await IngredientService.getIngredientsNotInArray(recipe_ingredients_ids, req.tenantModels.ingredientModel)
        
            return res.status(200).send({response: ingredients_found})
        }
        else{
            const ingredients_found = await IngredientService.getAllIngredientsToAdd(req.tenantModels.ingredientModel)

            return res.status(200).send({response: ingredients_found})
        }
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.getMaterialsToAdd = async(req,res) => {
    const { product_id } = req.query

    if(!product_id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const product = await ProductService.getProduct(product_id, req.tenantModels.productModel)

        if(!product){
            return res.status(404).send({response: "product not found"})
        }

        if(product.materials.length > 0){
            const product_materials_ids = product.materials.map(material => {
                return material.material
            })
    
            const materials_found = await MaterialService.getMaterialsNotInArray(product_materials_ids, req.tenantModels.materialModel)
        
            return res.status(200).send({response: materials_found})
        }
        else{
            const materials_found = await MaterialService.getAllMaterialsToAdd(req.tenantModels.materialModel)

            return res.status(200).send({response: materials_found})
        }
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}


module.exports.getRecipesToAdd = async(req,res) => {
    const { product_id } = req.query

    if(!product_id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const product = await ProductService.getProduct(product_id, req.tenantModels.productModel)

        if(!product){
            return res.status(404).send({response: "product not found"})
        }

        if(product.recipes.length > 0){
            const product_recipes_ids = product.recipes.map(recipe => {
                return recipe.recipe
            })
    
            const recipes_found = await RecipeService.getRecipesNotInArray(product_recipes_ids, req.tenantModels.recipeModel)
        
            return res.status(200).send({response: recipes_found})
        }
        else{
            const recipes_found = await RecipeService.getAllRecipesToAdd(req.tenantModels.recipeModel)

            return res.status(200).send({response: recipes_found})
        }
        
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}





/*
Products / Product
*/

module.exports.getAllProducts = async(req,res) => {

    const { offset, limit } = req.query;

    if(!offset || !limit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let allProducts = await ProductService.getAllProducts(req.tenantModels.productModel, { offset, limit })

        const updatedProducts = await Promise.all(allProducts.docs.map(async productFound => {
            const recipesIds = productFound.recipes.map(aRecipe => {
                return aRecipe.recipe
            })

            const productRecipes = await RecipeService.findRecipesFromArrayIdsNoPagination(recipesIds, req.tenantModels.recipeModel)

            let allRecipesCost = 0

            await Promise.all(productRecipes.map(async aProductRecipe => {
                const foundRecipe = productFound.recipes.find(aRecipe => aRecipe.recipe.toString() === aProductRecipe._id.toString())

                const ingredientsIds = aProductRecipe.ingredients.map(anIngredient => {
                    return anIngredient.ingredient
                })

                const ingredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(ingredientsIds, req.tenantModels.ingredientModel)
                
                let recipeCost = 0

                ingredientObjects.map(ingredientObject => {
                    const foundIngredient = aProductRecipe.ingredients.find(anIngredient => anIngredient.ingredient.toString() === ingredientObject._id.toString())

                    recipeCost += ingredientObject.price * (foundIngredient.quantity ? foundIngredient.quantity : 1)
                })

                allRecipesCost += recipeCost * (foundRecipe.quantity && foundRecipe.quantity>0 ? foundRecipe.quantity : 1)

                return true;
            }))

            const productMaterialsIds = productFound.materials.map(aMaterial => {
                return aMaterial.material;
            })

            const productMaterialObjects = await MaterialService.findMaterialsFromArrayIdsNoPagination(productMaterialsIds, req.tenantModels.materialModel)

            let allMaterialsCost = 0;

            await Promise.all(productMaterialObjects.map(aProductMaterial => {
                const foundMaterial = productFound.materials.find(aMaterial => aMaterial.material.toString() === aProductMaterial._id.toString())

                allMaterialsCost += (foundMaterial.quantity ? foundMaterial.quantity : 1) * aProductMaterial.price
            }))

            //console.log({allMaterialsCost, allRecipesCost, labourCost: productFound._doc.labour_cost, overheadCost: productFound._doc.overhead_cost})

            let productCost = allMaterialsCost + allRecipesCost + productFound._doc.labour_cost + productFound._doc.overhead_cost

            const profitCost = productFound._doc.profit_margin / 100 * productCost

            const totalCost = productCost + profitCost
            
            return { ...productFound._doc, totalCost: totalCost }
        }))

        return res.status(200).send({response: {...allProducts, docs: updatedProducts}})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.searchProducts = async(req,res) => {
    const { limit, offset, searchTerm } = req.query;

    if(!limit || !offset || !searchTerm){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let results = await ProductService.getProductsSearch(searchTerm, req.tenantModels.productModel, {limit, offset})

        return res.status(200).send({response: results})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.deleteProduct = async(req,res) => {
    const {id} = req.body

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let updatedProduct = await ProductService.deleteProduct(id, req.tenantModels.productModel)
    
        return res.status(200).send({response: updatedProduct})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.addProduct = async(req,res) => {
    const default_profit_margin = req.tenant.profit_margin

    const { name, profit_margin=default_profit_margin, labour_cost = 0, overhead_cost = 0, actual_selling_price = 0 } = req.body;

    if(!name || !profit_margin || !labour_cost || !overhead_cost){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let createdProduct = await ProductService.createProduct({ name,profit_margin,labour_cost,overhead_cost,actual_selling_price}, req.tenantModels.productModel)

        return res.status(200).send({response: createdProduct})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.getProduct = async(req,res) => {
    const { id } = req.query

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const product = await ProductService.getProduct(id, req.tenantModels.productModel)
        
        return res.status(200).send({response: product})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.addRecipesToProduct = async(req,res) => {
    const {id, recipes} = req.body

    if(!id || !recipes){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let product = await ProductService.getProduct(id, req.tenantModels.productModel)

        if(!product){
            return res.status(400).send({response: "product not found"})
        }

        product.recipes = [...product.recipes, ...recipes ]

        let updatedProduct = await ProductService.updateProduct(id, product, req.tenantModels.productModel)

        return res.status(200).send({response: updatedProduct})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.addMaterialsToProduct = async(req,res) => {
    const {id, materials} = req.body

    if(!id || !materials){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let product = await ProductService.getProduct(id, req.tenantModels.productModel)

        if(!product){
            return res.status(400).send({response: "product not found"})
        }

        product.materials = [...product.materials, ...materials]

        let updatedProduct = await ProductService.updateProduct(id, product, req.tenantModels.productModel)
    
        return res.status(200).send({response: updatedProduct})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.editProduct = async(req,res) => {
    const {id, name, profit_margin, labour_cost, overhead_cost, actual_selling_price} = req.body

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let updatedProduct = await ProductService.updateProduct(id, {name, profit_margin, labour_cost, overhead_cost, actual_selling_price}, req.tenantModels.productModel)
    
        return res.status(200).send({updatedProduct})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.editProductRecipe = async(req,res) => {
    const {recipe_id, quantity, id} = req.body
    //quantity should be an object containing amount and unit

    if(!id || !recipe_id || !quantity){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let product = await ProductService.getProduct(id, req.tenantModels.productModel)

        if(!product){
            return res.status(400).send({response: "product not found"})
        }

        const newRecipesArray = product.recipes.map(recipe => {
            if (recipe.recipe === recipe_id) {
                return {...recipe, quantity: quantity};
            }
            return recipe;
        });

        product.recipes = []
        product.recipes = newRecipesArray;

        let updatedProduct = await ProductService.updateProduct(id, product, req.tenantModels.productModel)
    
        return res.status(200).send({response: updatedProduct})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.deleteProductRecipe = async(req,res) => {
    const {recipe_id, id} = req.body

    if(!id || !recipe_id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let product = await ProductService.getProduct(id, req.tenantModels.productModel)

        if(!product){
            return res.status(400).send({response: "product not found"})
        }

        const newRecipesArray = product.recipes.filter(recipe => {
            return recipe.recipe != recipe_id;
        });

        product.recipes = []
        product.recipes = newRecipesArray;

        let updatedProduct = await ProductService.updateProduct(id, product, req.tenantModels.productModel)
    
        return res.status(200).send({response: updatedProduct})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.editProductMaterial = async(req,res) => {
    const {material_id, quantity, id} = req.body

    if(!id || !material_id || !quantity){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let product = await ProductService.getProduct(id, req.tenantModels.productModel)

        if(!product){
            return res.status(400).send({response: "product not found"})
        }

        const newMaterialsArray = product.materials.map(material => {
            if (material.material === material_id) {
                return {...material, quantity: quantity};
            }
            return recipe;
        });

        product.materials = []
        product.materials = newMaterialsArray;

        let updatedProduct = await ProductService.updateProduct(id, product, req.tenantModels.productModel)
    
        return res.status(200).send({response: updatedProduct})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.deleteProductMaterial = async(req,res) => {
    const {material_id, id} = req.body

    if(!id || !material_id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let product = await ProductService.getProduct(id, req.tenantModels.productModel)

        if(!product){
            return res.status(400).send({response: "product not found"})
        }

        const newMaterialsArray = product.materials.filter(material => {
            return material.material.toString() != material_id.toString();
        });

        product.materials = []
        product.materials = newMaterialsArray;

        let updatedProduct = await ProductService.updateProduct(id, product, req.tenantModels.productModel)
    
        return res.status(200).send({response: updatedProduct})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.getProductRecipes = async(req,res) => {
    const {id, offset, limit} = req.query

    if(!id || !limit || !offset){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let product = await ProductService.getProduct(id, req.tenantModels.productModel)

        if(!product){
            return res.status(400).send({response: "product not found"})
        }

        if(product.recipes.length == 0){
            return res.status(200).send({response: []})
        }

        if(product.recipes.length > 0){
            let productRecipesIdsArray = product.recipes.map((recipe) => {
                return recipe.recipe;
            })
    
            //find all recipes based on the array of ids
            const arrayOfFullRecipeObjects = await RecipeService.findRecipesFromArrayIds(productRecipesIdsArray, req.tenantModels.recipeModel, offset, limit);
    
            if(arrayOfFullRecipeObjects.docs.length == 0){
                return res.status(200).send({response: {}})
            }

            //for each recipe set the amount of the yield
            const arrayOfUpdatedFullRecipes = await Promise.all(arrayOfFullRecipeObjects.docs.map(async fullRecipeObject => {
                const aFoundRecipe = product.recipes.find(recipe => recipe.recipe.toString() === fullRecipeObject._id.toString());
                
                fullRecipeObject.yield.amount = aFoundRecipe.quantity.amount

                const recipeIngredientsIdsArray = fullRecipeObject.ingredients.map(ingredientInRecipe => {
                    return ingredientInRecipe.ingredient;
                })

                const fullIngredientsObjects = await IngredientService.findIngredientsFromArrayIds(recipeIngredientsIdsArray, req.tenantModels.ingredientModel, 0, 1000)
    
                let totalRecipeCost = 0;

                fullIngredientsObjects.docs.map(fullIngredientObject => {
                    const aFoundIngredient = fullRecipeObject.ingredients.find(ingredient => ingredient.ingredient.toString() === fullIngredientObject._id.toString());
                    
                    totalRecipeCost += fullIngredientObject.price * aFoundIngredient.quantity;
                })

                return {...fullRecipeObject._doc, cost: totalRecipeCost * aFoundRecipe.quantity.amount};
            }))

            return res.status(200).send({response: {...arrayOfFullRecipeObjects, docs: arrayOfUpdatedFullRecipes}})
        }

        return res.status(200).send({response: []})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.getProductMaterials = async(req,res) => {
    const {id,offset,limit} = req.query

    if(!id || !limit || !offset){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let product = await ProductService.getProduct(id, req.tenantModels.productModel)

        if(!product){
            return res.status(400).send({response: "product not found"})
        }

        if(product.materials.length == 0){
            return res.status(200).send({response: []})
        }

        if(product.materials.length > 0){
            let productMaterialsIdsArray = product.materials.map((material) => {
                return material.material;
            })
    
            //find all materials based on the array of ids
            const arrayOfFullMaterialObjects = await MaterialService.findMaterialsFromArrayIds(productMaterialsIdsArray, req.tenantModels.materialModel,offset,limit);
            
            if(arrayOfFullMaterialObjects.docs.length == 0){
                return res.status(200).send({response: {}})
            }

            const arrayOfUpdatedFullMaterials = arrayOfFullMaterialObjects.docs.map(fullMaterialObject => {
                const aFoundMaterial = product.materials.find(material => material.material.toString() === fullMaterialObject._id.toString());

                return {...fullMaterialObject._doc, quantity: aFoundMaterial.quantity, totalCost: aFoundMaterial.quantity*fullMaterialObject.price}
            })

            return res.status(200).send({response: {...arrayOfFullMaterialObjects, docs: arrayOfUpdatedFullMaterials}})
        }

        return res.status(200).send({response: {}})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}







//Orders

module.exports.getAllOrders = async (req,res) => {
    const { offset, limit } = req.query;
    
    if(!offset || !limit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let allOrders = await OrderService.getAllOrders(req.tenantModels.orderModel, { offset, limit })

        if(allOrders.docs.length > 0){
            const allOrdersArray = await Promise.all(allOrders.docs.map(async (anOrder) => {

                if(anOrder.products.length > 0){
                    const orderProductsIds = anOrder.products.map(product => {
                        return product.product
                    })
    
                    const orderProductObjects = await ProductService.getProductsFromIdsArray(orderProductsIds, req.tenantModels.productModel, 1, 1000)

                    const totalCost = orderProductObjects.docs.reduce((acc,product) => {
                        return acc + product.actual_selling_price ? product.actual_selling_price : 0
                    }, 0)

                    return {...anOrder._doc, totalCost:totalCost}
                }
                else{
                    return {...anOrder._doc, totalCost:0}
                }
            }))

            return res.status(200).send({response: {...allOrders, docs: allOrdersArray}})
        }

        return res.status(200).send({response: allOrders})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.deleteOrder = async (req,res) => {
    const {id} = req.body

    if(!id){    
        return res.status(400).send({response: "bad request"})
    }

    try{
        const deletedOrder = await OrderService.deleteOrder(id, req.tenantModels.orderModel)

        return res.status(200).send({response: deletedOrder})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.addOrder = async(req,res) => {
    const {name, fulfillment_date} = req.body;

    if(!name){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const createdOrder = await OrderService.createOrder({name, fulfillment_date}, req.tenantModels.orderModel)

        return res.status(200).send({response: createdOrder})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.searchOrders = async(req,res) => {
    const { limit, offset, searchTerm } = req.query;

    if(!limit || !offset || !searchTerm){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let results = await OrderService.getOrdersSearch(searchTerm, req.tenantModels.orderModel, {limit, offset})

        return res.status(200).send({response: results})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}


//Order

module.exports.getOrderProducts = async(req,res) => {
    const {id, offset, limit} = req.query

    if(!id || !offset || !limit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const order = await OrderService.getOrder(id, req.tenantModels.orderModel)

        if(!order){
            return res.status(404).send({response: "not found"})
        }

        if(order.products.length == 0){
            return res.status(200).send({response: []})
        }

        const orderProductsIds = order.products.map(product => {
            return product.product
        })

        const productsFoundArray = await ProductService.getProductsFromIdsArray(orderProductsIds, req.tenantModels.productModel, offset, limit)
        
        const updatedOrderProducts = await Promise.all(productsFoundArray.docs.map(async productFound => {
            const foundProduct = order.products.find(aProduct => aProduct.product.toString() === productFound._id.toString())

            const recipesIds = productFound.recipes.map(aRecipe => {
                return aRecipe.recipe
            })

            const productRecipes = await RecipeService.findRecipesFromArrayIdsNoPagination(recipesIds, req.tenantModels.recipeModel)

            let allRecipesCost = 0

            await Promise.all(productRecipes.map(async aProductRecipe => {
                const foundRecipe = productFound.recipes.find(aRecipe => aRecipe.recipe.toString() === aProductRecipe._id.toString())

                const ingredientsIds = aProductRecipe.ingredients.map(anIngredient => {
                    return anIngredient.ingredient
                })

                const ingredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(ingredientsIds, req.tenantModels.ingredientModel)
                
                let recipeCost = 0

                ingredientObjects.map(ingredientObject => {
                    const foundIngredient = aProductRecipe.ingredients.find(anIngredient => anIngredient.ingredient.toString() === ingredientObject._id.toString())

                    recipeCost += ingredientObject.price * (foundIngredient.quantity ? foundIngredient.quantity : 1)
                })

                allRecipesCost += recipeCost * (foundRecipe.quantity && foundRecipe.quantity>0 ? foundRecipe.quantity : 1)

                return true;
            }))

            const productMaterialsIds = productFound.materials.map(aMaterial => {
                return aMaterial.material;
            })

            const productMaterialObjects = await MaterialService.findMaterialsFromArrayIdsNoPagination(productMaterialsIds, req.tenantModels.materialModel)

            let allMaterialsCost = 0;

            await Promise.all(productMaterialObjects.map(aProductMaterial => {
                const foundMaterial = productFound.materials.find(aMaterial => aMaterial.material.toString() === aProductMaterial._id.toString())

                allMaterialsCost += (foundMaterial.quantity ? foundMaterial.quantity : 1) * aProductMaterial.price
            }))

            //console.log({allMaterialsCost, allRecipesCost, labourCost: productFound._doc.labour_cost, overheadCost: productFound._doc.overhead_cost})

            let productCost = allMaterialsCost + allRecipesCost + productFound._doc.labour_cost + productFound._doc.overhead_cost

            const profitCost = productFound._doc.profit_margin / 100 * productCost

            const totalCost = productFound.actual_selling_price && productFound.actual_selling_price > 0 ? productFound.actual_selling_price : (productCost + profitCost)
            
            const totalQuantity = (foundProduct.quantity && foundProduct.quantity > 0 ? foundProduct.quantity : 1)

            const finalProductTotalCost = totalCost * totalQuantity

            return { ...productFound._doc, quantity: foundProduct.quantity, totalCost: finalProductTotalCost}
        }))

        return res.status(200).send({response: updatedOrderProducts})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.getOrder = async(req,res) => {
    const {id} = req.query

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const order = await OrderService.getOrder(id, req.tenantModels.orderModel)

        if(!order){
            return res.status(404).send({response: "not found"})
        }

        if(order.products.length == 0){
            return res.status(200).send({response: {...order, totalCost:0}})
        }

        const orderProductsIds = order.products.map(product => {
            return product.product
        })

        const orderProductObjects = await ProductService.getProductsFromIdsArray(orderProductsIds, req.tenantModels.productModel, 1, 1000)

        const totalCost = orderProductObjects.docs.reduce((acc,product) => {
            return acc + product.actual_selling_price ? product.actual_selling_price : 0
        }, 0)

        return res.status(200).send({response: {...order, totalCost: totalCost}})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.editOrder = async(req,res) => {
    const {id, name, fulfillment_date, status} = req.body;

    if(!id || !name){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const editedOrder = await OrderService.updateOrder(id,{name, fulfillment_date, status})

        return res.status(200).send({response: editedOrder})
    }
    catch(err){

    }
}

module.exports.fulfillOrder = async(req,res) => {
    const {id} = req.body;

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        //find Order
        const order = await OrderService.getOrder(id, req.tenantModels.orderModel)

        if(order){
            const orderProductIds = order.products.map(aProduct => {
                return aProduct.product
            })

            //find All products in Order
            const fullProductObjects = await ProductService.getProductsFromIdsArrayNoPagination(orderProductIds, req.tenantModels.productModel)

            await Promise.all(fullProductObjects.map(async fullProductObject => {
                //find All recipes and materials in products
                //find All ingredients in recipes
                //get the quantity specified for each material and ingredient for respective recipes and products
                //update the quantity in stock for each material and ingredient
                
                //handle all ingredients in product first
                if(fullProductObject.recipes.length > 0){
                    const allProductRecipesIds = fullProductObject.recipes.map(aRecipe => {
                        return aRecipe.recipe
                    })

                    const fullRecipeObjects = await RecipeService.findRecipesFromArrayIdsNoPagination(allProductRecipesIds, req.tenantModels.recipeModel)

                    await Promise.all(fullRecipeObjects.map(async fullRecipeObjectItem => {
                        const foundRecipe = fullProductObject.recipes.find(aRecipe => aRecipe.recipe.toString() === fullRecipeObjectItem._id.toString())

                        //The quantity of the recipe
                        const recipeQuantity = foundRecipe.quantity;

                        const ingredientsIds = fullRecipeObjectItem.ingredients.map(anIngredient => {
                            return anIngredient.ingredient
                        })

                        const fullIngredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(ingredientsIds, req.tenantModels.ingredientModel)
                        
                        await Promise.all(fullIngredientObjects.map(async fullIngredientObjectsItem => {
                            const foundIngredient = fullRecipeObjectItem.ingredients.find(anIngredient => anIngredient.ingredient.toString() === fullIngredientObjectsItem._id.toString())

                            const quantityToDeduct = foundIngredient.quantity * (recipeQuantity ? recipeQuantity : 1);

                            fullIngredientObjectsItem.quantity_in_stock = Math.abs(fullIngredientObjectsItem.quantity_in_stock - quantityToDeduct);

                            await IngredientService.updateIngredient(fullIngredientObjectsItem._id, fullIngredientObjectsItem, req.tenantModels.ingredientModel)

                            return true;
                        }))

                    }))
                }

                //handle all materials in product next
                if(fullProductObject.materials.length > 0){
                    const allProductMaterialsIds = fullProductObject.materials.map(aMaterial => {
                        return aMaterial.material
                    })

                    const fullMaterialObjects = await MaterialService.findMaterialsFromArrayIdsNoPagination(allProductMaterialsIds, req.tenantModels.materialModel)

                    await Promise.all(fullMaterialObjects.map(async fullMaterialObject => {
                        const foundMaterial = fullProductObject.materials.find(aMaterial => aMaterial.material.toString() === fullMaterialObject._id.toString())

                        fullMaterialObject.quantity_in_stock = Math.abs(fullMaterialObject.quantity_in_stock - foundMaterial.quantity)

                        await MaterialService.updateMaterial(fullMaterialObject._id, fullMaterialObject, req.tenantModels.materialModel)

                        return true;
                    }))
                }

                return true
            }))

            order.status = "FULFILLED"
            
            await OrderService.updateOrder(order._id, order, req.tenantModels.orderModel)

            return res.status(200).send({response: "success"})
        }

        return res.status(404).send({response: "order not found"})    
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.addProductsToOrder = async(req,res) => {
    const {id, products} = req.body

    if(!id || !products){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const order = await OrderService.getOrder(id, req.tenantModels.orderModel)

        if(!order){
            return res.status(404).send({response: "not found"})
        }

        order.products = [...order.products, ...products]

        let updatedOrder = await OrderService.updateOrder(id, order, req.tenantModels.orderModel)
    
        return res.status(200).send({response: updatedOrder})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.editOrderProduct = async(req,res) => {
     const {id, product_id, quantity} = req.body

     if(!id || !product_id || !quantity){
         return res.status(400).send({response: "bad request"})
     }

     try{
        const order = await OrderService.getOrder(id, req.tenantModels.orderModel)

        if(!order){
            return res.status(404).send({response: "order not found"})
        }

        order.products = order.products.map(aProduct => {
            if(aProduct.product.toString() === product_id.toString()){
                aProduct.quantity = parseInt(quantity)
            }
            
            return aProduct;
        })

        await OrderService.updateOrder(id, order, req.tenantModels.orderModel)

        return res.status(200).send({response: order})
     }
     catch(err){
        console.log(err)
        return res.status(500).send({response: err})
     }
}

module.exports.deleteOrderProduct = async(req,res) => {
    const {product_id, id} = req.body

    if(!id || !product_id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const order = await OrderService.getOrder(id, req.tenantModels.orderModel)

        if(!order){
            return res.status(404).send({response: "not found"})
        }

        const newProductsArray = order.products.filter(product => {
            return product.product.toString() !== product_id.toString();
        });

        order.products = []
        order.products = newProductsArray;

        let updatedOrder = await OrderService.updateOrder(id, order, req.tenantModels.orderModel)
    
        return res.status(200).send({response: updatedOrder})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.getProductstoAdd = async(req,res) => {
    const {id} = req.query

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const order = await OrderService.getOrder(id, req.tenantModels.orderModel)

        if(!order){
            return res.status(404).send({response: "not found"})
        }

        if(order.products.length > 0){
            const orderProductsIds = order.products.map(aProduct => {
                return aProduct.product;
            })

            const products_found = await ProductService.getProductsNotInArray(orderProductsIds, req.tenantModels.productModel)
        
            return res.status(200).send({response: products_found})
        }
        else{
            const products_found = await ProductService.getAllProductsToAdd(req.tenantModels.productModel)
            
            return res.status(200).send({response: products_found})
        }
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }

}






/*
*Profit Table 
*/

module.exports.getProfitTableProductChanges = async(req,res) => {
    const {type, changeList} = req.query

    if(!type || !changeList){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const aChangeList = JSON.parse(changeList)

        const cost_diff_found = 0;

        const changeListIds = Object.keys(aChangeList)

        const newListOfMongooseIds = changeListIds.map(changeListItem => {
            return mongoose.Types.ObjectId(changeListItem);
        })

        let products;

        if(type.toLowerCase() == MATERIAL || type.toLowerCase().includes(MATERIAL)){
            products = await ProductService.getProductsFromMaterialsArray(changeListIds, req.tenantModels.productModel) 
        }

        if(type.toLowerCase() == INGREDIENT || type.toLowerCase().includes(INGREDIENT)){
            //Pull all recipes from the list of ingredients ids
            const recipes = await RecipeService.getRecipesFromIngredientsArray(newListOfMongooseIds, req.tenantModels.recipeModel) 

            if(recipes && recipes.length > 0){
                const recipesIdsArray = recipes.map(aRecipe => {
                    return aRecipe.recipe
                })

                //find all products based on the list of recipes ids found above
                products = await ProductService.getProductsFromRecipesArray(recipesIdsArray, req.tenantModels.productModel) 
            }
        }

        

        if(products && products.length > 0){
            const updatedProducts = await Promise.all(products.map(async aProduct => {
                //For each product get the total cost with profit margin and without profit margin
                //Perform calculation

                //1. get cost of all recipes
                let costOfRecipes = 0

                if(aProduct.recipes.length > 0){
                    const productRecipeIds = aProduct.recipes.map(aRecipe => {
                        return aRecipe.recipe
                    })

                    const allProductRecipes = await RecipeService.findRecipesFromArrayIdsNoPagination(productRecipeIds, req.tenantModels.recipeModel)

                    await Promise.all(allProductRecipes.map(async allProductRecipe => {
                        const aFoundRecipe = aProduct.recipes.find(aRecipe => aRecipe.recipe._id.toString() === allProductRecipe._id.toString())

                        const recipeQuantity = aFoundRecipe.quantity

                        //get cost of recipe ingredients

                        if(allProductRecipe.ingredients && allProductRecipe.ingredients.length > 0 && recipeQuantity > 0){
                            const ingredientIds = allProductRecipe.ingredients.map(anIngredient => {
                                return anIngredient.ingredient
                            })
    
                            //find all full ingredient objects
                            const allIngredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(ingredientIds, req.tenantModels.ingredientModel)
    
                            const allIngredientsCost = allIngredientObjects.reduce( (acc, allIngredientObject) => {
                                 const aFoundIngredient = allProductRecipe.ingredients.find(anIngredient => anIngredient.ingredient.toString() === allIngredientObject._id.toString())
                          
                                 if(type.toLowerCase() == INGREDIENT || type.toLowerCase().includes(INGREDIENT)){
                                     if(changeListIds[0].toString() === allIngredientObject._id.toString()){
                                        cost_diff_found = Object.values(aChangeList)[0] - allIngredientObject.rice
                                     }
                                 }

                                 return acc + (allIngredientObject.price * aFoundIngredient.quantity)
                            },0)
                        
                            //join the total cost of the recipe to the total cost of all recipes
                            
                            costOfRecipes += (recipeQuantity * allIngredientsCost);
                        }

                        return true
                    }))
                }

                //2. Get Cost of materials

                let costOfMaterials = 0

                if(aProduct.materials.length > 0){
                    const productMaterialIds = aProduct.materials.map(aMaterial => {
                        return aMaterial.material
                    })

                    const allProductMaterials = await MaterialService.findMaterialsFromArrayIdsNoPagination(productMaterialIds, req.tenantModels.materialModel)
                
                    costOfMaterials = allProductMaterials.reduce( (acc, aProductMaterial) => {
                        const aFoundMaterial = aProduct.materials.find(aMaterial => aMaterial.material.toString() == aProductMaterial._id.toString())

                        if(type.toLowerCase() == MATERIAL || type.toLowerCase().includes(MATERIAL)){
                            if(changeListIds[0].toString() === aProductMaterial._id.toString()){
                               cost_diff_found = Object.values(aChangeList)[0] - aProductMaterial.Price
                            }
                        }

                        return acc+(aFoundMaterial.quantity * aProductMaterial.price)
                    }, 0)
                }

                const totalCostWithoutProfitMargin = costOfRecipes + costOfMaterials + aProduct.labour_cost + aProduct.overhead_cost

                const totalCostWithProfitMargin = (aProduct.profit_margin / 100 * totalCostWithoutProfitMargin) + totalCostWithoutProfitMargin

                const totalCostWithIncrease = totalCostWithoutProfitMargin + cost_diff_found

                const newProposedCostPriceWithIncreaseAndProfitMargin = (aProduct.profit_margin / 100 * totalCostWithIncrease) + totalCostWithIncrease

                return {...aProduct._doc, change: cost_diff_found, totalCostWithoutProfitMargin:totalCostWithoutProfitMargin, totalCostWithProfitMargin:totalCostWithProfitMargin, totalCostWithIncrease:totalCostWithIncrease, newProposedCostPriceWithIncreaseAndProfitMargin:newProposedCostPriceWithIncreaseAndProfitMargin}
            }))

            return res.status(200).send({response: updatedProducts})
        }

        return res.status(200).send({response: []})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}





module.exports.applyProfitTableChanges = async(req,res) => {
    const {id, type, change} = req.body

    if(!id || !type || !change){
        return res.status(400).send({response: "bad request"})
    }

    try{
        if(type.toLowerCase() == MATERIAL || type.toLowerCase().includes(MATERIAL)){
            const material = await MaterialService.updateMaterial(id, {purchase_quantity: change}, req.tenantModels.materialModel)

            return res.status(200).send({response: material})
        }

        if(type.toLowerCase() == INGREDIENT || type.toLowerCase().includes(INGREDIENT)){
            const ingredient = await IngredientService.updateIngredient(id, {purchase_quantity: change}, req.tenantModels.ingredientModel)

            return res.status(200).send({response: ingredient})
        }
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}






//Shopping List

module.exports.getOrderShoppingList = async (req,res) => {
    const {id} = req.query

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const order = await OrderService.getOrder(id, req.tenantModels.orderModel)

        if(!order){
            return res.status(404).send({response: "Order Not Found"})
        }

        if(!order.products || order.products.length == 0){
            return res.status(200).send({response: "Order has no Products", order: order})
        }

        const orderProductsIds = order.products.map(orderProduct => {
            return orderProduct.product
        })

        const orderProducts = await ProductService.getProductsFromIdsArrayNoPagination(orderProductsIds, req.tenantModels.productModel)

        if(!orderProducts || orderProducts.length == 0){
            return res.status(200).send({response: "Order has no Products", order: order})
        }

        const orderMaterials = {}
        const orderIngredients = {}

        await Promise.all(orderProducts.map(async anOrderProduct => {
            //get All materials and ingredients for this product and add to the object of materials and ingredients respectively

            //We handle the materials part first
            if(anOrderProduct.materials && anOrderProduct.materials.length > 0){
                const anOrderProductMaterialsIds = anOrderProduct.materials.map(anOrderProductMaterial => {
                    return anOrderProductMaterial.material
                })

                const fullMaterialObjects = await MaterialService.findMaterialsFromArrayIdsNoPagination(anOrderProductMaterialsIds, req.tenantModels.materialModel)

                fullMaterialObjects.map(fullMaterialObject => {
                    const aFoundMaterial = anOrderProduct.materials.find(anOrderProductMaterial => anOrderProductMaterial.material.toString() === fullMaterialObject._id.toString())

                    if(!orderMaterials[fullMaterialObject._id]){
                        const cost = aFoundMaterial.quantity * fullMaterialObject.price

                        const resolvedQuantity = fullMaterialObject.quantity_in_stock - aFoundMaterial.quantity

                        const status = resolvedQuantity < 0 ? "LOW" : "NORMAL"

                        const quantityToFulfill = resolvedQuantity < 0 ? Math.abs(fullMaterialObject.quantity_in_stock - aFoundMaterial.quantity) : 0

                        orderMaterials[fullMaterialObject._id] = { ...fullMaterialObject, cost: cost, status: status, quantity: aFoundMaterial.quantity, quantityToFulfill: quantityToFulfill}
                    }
                    else{
                        const cost = (aFoundMaterial.quantity * fullMaterialObject.price) + orderMaterials[fullMaterialObject._id].cost

                        const resolvedQuantity = fullMaterialObject.quantity_in_stock - orderMaterials[fullMaterialObject._id].quantity - aFoundMaterial.quantity

                        const status = resolvedQuantity < 0 ? "LOW" : "NORMAL"

                        const quantityToFulfill = resolvedQuantity < 0 ? Math.abs(resolvedQuantity) : 0

                        orderMaterials[fullMaterialObject._id] = { ...fullMaterialObject, cost: cost, status: status, quantity: orderMaterials[fullMaterialObject._id].quantity + aFoundMaterial.quantity, quantityToFulfill: quantityToFulfill}
                    }
                })
            }

            //We handle the recipes part next
            if(anOrderProduct.recipes && anOrderProduct.recipes.length > 0){
                const anOrderProductRecipesIds = anOrderProduct.recipes.map(anOrderProductRecipe => {
                    return anOrderProductRecipe.recipe
                })

                const fullRecipesObjects = await MaterialService.findMaterialsFromArrayIdsNoPagination(anOrderProductRecipesIds, req.tenantModels.recipeModel)

                await Promise.all(fullRecipesObjects.map(async fullRecipeObject => {
                    //get ingredients in this recipe and calculate cost

                    if(fullRecipeObject.ingredients && fullRecipeObject.ingredients.length > 0){
                        const ingredientsIdsArray = fullRecipeObject.ingredients.map(fullRecipeObjectIngredient => {
                            return fullRecipeObjectIngredient.ingredient
                        })

                        //get full ingredient objects
                        const fullIngredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(ingredientsIdsArray, req.tenantModels.ingredientModel)

                        if(fullIngredientObjects && fullIngredientObjects.length > 0){
                            fullIngredientObjects.map(fullIngredientObject => {
                                const aFoundIngredient = fullRecipeObject.ingredients.find(fullRecipeObjectIngredient => fullRecipeObjectIngredient.ingredient.toString() === fullIngredientObject._id.toString())

                                if(!orderIngredients[fullIngredientObject._id]){
                                    const cost = aFoundIngredient.quantity * fullIngredientObject.price
            
                                    const resolvedQuantity = fullIngredientObject.quantity_in_stock - aFoundIngredient.quantity
            
                                    const status = resolvedQuantity < 0 ? "LOW" : "NORMAL"
            
                                    const quantityToFulfill = resolvedQuantity < 0 ? Math.abs(fullIngredientObject.quantity_in_stock - aFoundIngredient.quantity) : 0
            
                                    orderIngredients[fullIngredientObject._id] = { ...fullIngredientObject, cost: cost, status: status, quantity: aFoundIngredient.quantity, quantityToFulfill: quantityToFulfill}
                                }
                                else{
                                    const cost = (aFoundIngredient.quantity * fullIngredientObject.price) + orderIngredients[fullIngredientObject._id].cost
            
                                    const resolvedQuantity = fullIngredientObject.quantity_in_stock - orderIngredients[fullIngredientObject._id].quantity - aFoundIngredient.quantity
            
                                    const status = resolvedQuantity < 0 ? "LOW" : "NORMAL"
            
                                    const quantityToFulfill = resolvedQuantity < 0 ? Math.abs(resolvedQuantity) : 0
            
                                    orderIngredients[fullIngredientObject._id] = { ...fullIngredientObject, cost: cost, status: status, quantity: orderIngredients[fullIngredientObject._id].quantity + aFoundIngredient.quantity, quantityToFulfill: quantityToFulfill}
                                }
                            })
                        }
                    }
                }))
            }

            return true
        }))

        //At this point we have found all the materials and ingredients that are in the order and what their costs are as well as whcih ones are low and what it will take to fulfill the orders
        
        return res.status(200).send({response: {...order, materials: Object.values(orderMaterials), ingredients: Object.values(orderIngredients)/*, products: orderProducts*/}})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({resonse: err})
    }
}
