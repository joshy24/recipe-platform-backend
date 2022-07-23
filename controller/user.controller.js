
const RecipeService = require("../service/recipe.service")
const IngredientService = require("../service/ingredient.service")
const ProductService = require("../service/product.service")
const MaterialService = require("../service/material.service")
const OrderService = require("../service/order.service")
const TenantService = require("../service/tenant.service")
const TenantModels = require("../modules/tenantModels.module")

const config = require('../config/config');

const jwt = require("jsonwebtoken")

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




//Dashboard

module.exports.entitiesCount = async (req,res) => {

    try{
        const materialsCount = await MaterialService.countMaterials(req.tenantModels.materialModel)

        const ingredientsCount = await IngredientService.countIngredients(req.tenantModels.ingredientModel)

        const recipesCount = await RecipeService.getRecipesCount(req.tenantModels.recipeModel)

        const productsCount = await ProductService.getProductsCount(req.tenantModels.productModel)

        const ordersCount = await OrderService.countOrders(req.tenantModels.orderModel);

        return res.status(200).send({response: {
            ordersCount,
            productsCount,
            recipesCount,
            inventoryCount: materialsCount + ingredientsCount
        }})
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

        return res.status(200).send({response: allRecipes})
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
        const results = await RecipeService.getRecipesSearch(searchTerm, req.tenantModels.recipeModel)

        return res.status(200).send({response: results})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.addRecipe = async(req,res) => {
    const { name, description, category= "", yield = {}, ingredients = [] } = req.body;

    if(!name || !description){
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

    console.log({id})

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
    const {name,description, category, yield, ingredients, id} = req.body

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let updatedRecipe = await RecipeService.updateRecipe(id, {name,description, category, yield, ingredients}, req.tenantModels.recipeModel)
    
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
        let updatedRecipe = await RecipeService.deleteRecipe(id, req.tenantModels.recipeModel)
    
        return res.status(200).send({response: updatedRecipe})
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
            if (ingredient.ingredient === ingredient_id) {
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
            return ingredient.ingredient != ingredient_id;
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
    const {id} = req.body

    if(!id){
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

        let recipeIngredients = recipe.ingredients.map(async (ingredient) => {
            let foundIngredient = await IngredientService.getIngredientFromId(ingredient.ingredient, req.tenantModels.ingredientModel)

            return {...foundIngredient, quantity: ingredient.quantity, price: ingredient.quantity*foundIngredient.price}
        })

        return res.status(200).send({response: recipeIngredients})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}








/*
Inventory
*/

module.exports.getInventory = async(req,res) => {
    const { limit, offset, type } = req.query;

    console.log(limit,type,offset)

    if(!limit || !offset || !type){
        return res.status(400).send({response: "bad request"})
    }

    try{
        if(type.toLowerCase() == "ingredients" || type.toLowerCase() == "ingredient"){
            let allIngredients = await IngredientService.getAllIngredients(req.tenantModels.ingredientModel, {limit, offset})
            
            return res.status(200).send({response: allIngredients})
        }

        if(type.toLowerCase() == "materials" || type.toLowerCase() == "material"){
            let allMaterials = await MaterialService.getAllMaterials(req.tenantModels.materialModel, {limit, offset})
            
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
    const {name,purchase_quantity, purchase_size, price, quantity_in_stock} = req.body

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let updatedIngredient = await IngredientService.updateIngredient(id, {name,purchase_quantity, purchase_size, price, quantity_in_stock}, req.tenantModels.ingredientModel)
    
        return res.status(200).send({response: updatedIngredient})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.editInventoryMaterial = async(req,res) => {
    const {name,purchase_quantity, purchase_size, price, quantity_in_stock} = req.body

    if(!id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let updatedMaterial = await MaterialService.updateMaterial(id, {name,purchase_quantity, purchase_size, price, quantity_in_stock}, req.tenantModels.materialModel)
    
        return res.status(200).send({response: updatedMaterial})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}


module.exports.getIngredientsToAdd = async(req,res) => {
    const { recipe_id } = req.query

    if(!recipe_id){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const recipe = await RecipeService.getRecipe(recipe_id)

        if(!recipe){
            return res.status(404).send({response: "recipe not found"})
        }

        if(recipe.ingredients.length == 0){
            return res.status(200).send({response: []})
        }

        const recipe_ingredients_ids = recipe.ingredients.map(ingredient => {
            return ingredient.ingredient
        })

        const ingredients_found = await IngredientService.getIngredientsNotInArray(recipe_ingredients_ids, req.tenantModels.ingredientModel)
    
        return res.status(200).send({response: ingredients_found})
    }
    catch(err){
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






/*
Products / Product
*/

module.exports.getAllProducts = async(req,res) => {

    const { offset, limit } = req.query;

    console.log({offset, limit})

    if(!offset || !limit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let allProducts = await ProductService.getAllProducts(req.tenantModels.productModel, { offset, limit })

        return res.status(200).send({response: allProducts})
    }
    catch(err){

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

    console.log({ name, profit_margin, labour_cost, overhead_cost, actual_selling_price })

    if(!name || !profit_margin || !labour_cost || !overhead_cost){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let createdProduct = await ProductService.createProduct({ name,profit_margin,labour_cost,overhead_cost,actual_selling_price}, req.tenantModels.productModel)

        return res.status(200).send({response: createdProduct})
    }
    catch(err){
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

        product.materials = [...product.materials, ...materials ]

        let updatedProduct = await ProductService.updateProduct(id, product, req.tenantModels.productModel)
    
        return res.status(200).send({response: updatedProduct})
    }
    catch(err){
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

module.exports.editProductRecipe = async() => {
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

module.exports.deleteProductRecipe = async() => {
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

module.exports.editProductMaterial = async() => {
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

module.exports.deleteProductMaterial = async() => {
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
            return material.material != material_id;
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

module.exports.getProductRecipes = async(req,res) => {
    const {id} = req.body

    if(!id){
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
            let productRecipesIdsArray = product.recipes.map(async (recipe) => {
                return recipe.recipe;
            })
    
            //find all recipes based on the array of ids
            const arrayOfFullRecipeObjects = await RecipeService.findRecipesFromArrayIds(productRecipesIdsArray);
    
            //for each recipe set the amount of the yield
            const arrayOfUpdatedFullRecipes = Promise.all(arrayOfFullRecipeObjects.map(async fullRecipeObject => {
                const aFoundRecipe = product.recipes.find(recipe => recipe.recipe === fullRecipeObject._id);
    
                fullRecipeObject.yield.amount = aFoundRecipe.amount
    
                const recipeIngredientsIdsArray = fullRecipeObject.ingredients.map(ingredientInRecipe => {
                    return ingredientInRecipe.ingredient;
                })
    
                const fullIngredientsObjects = await IngredientService.findIngredientsFromArrayIds(recipeIngredientsIdsArray)
    
                let totalRecipeCost = 0;
    
                fullIngredientsObjects.map(fullIngredientObject => {
                    const aFoundIngredient = fullRecipeObject.ingredients.find(ingredient => ingredient.ingredient === fullIngredientObject._id);
    
                    totalRecipeCost += fullIngredientObject.price * aFoundIngredient.quantity;
                })
    
                return {...fullRecipeObject, cost: totalRecipeCost};
            }))

            return res.status(200).send({response: arrayOfUpdatedFullRecipes})
        }

        return res.status(200).send({response: []})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

module.exports.getProductMaterials = async(req,res) => {
    const {id} = req.query

    if(!id){
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

        if(product.materials.length > 0){
            let productMaterialsIdsArray = product.materials.map(async (material) => {
                return material.material;
            })
    
            //find all recipes based on the array of ids
            const arrayOfFullMaterialObjects = await MaterialService.findMaterialsFromArrayIds(productMaterialsIdsArray);
    
            const arrayOfUpdatedFullMaterials = arrayOfFullMaterialObjects.map(fullMaterialObject => {
                const aFoundMaterial = product.materials.find(material => material.material === fullMaterialObject._id);

                return {...fullMaterialObject, quantity: aFoundMaterial.quantity, totalCost: aFoundMaterial.quantity*fullMaterialObject.price}
            })

            return res.status(200).send({response: arrayOfUpdatedFullMaterials})
        }

        return res.status(200).send({response: []})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}