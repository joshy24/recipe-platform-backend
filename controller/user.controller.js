
const RecipeService = require("../service/recipe.service")
const IngredientService = require("../service/ingredient.service")
const ProductService = require("../service/product.service")
const MaterialService = require("../service/material.service")
const OrderService = require("../service/order.service")
const UnitService = require("../service/unit.service")
const TenantService = require("../service/tenant.service")
const TenantModels = require("../modules/tenantModels.module")

const getTenantModels = require('../modules/tenantDB.module');

const { MATERIAL, INGREDIENT } = require("../modules/constants.module")

const { defaultMaterialUnits, getPriceOfQuantity, defaultUnitsAndConversions, getPlainUnits, isDefaultUnit, findDefaultUnit, getChosenQuantityFromEntityUnit, calculateCostOfAddedMaterial, calculateDesiredQuantityFromQuantity, convertQuantityToOtherQuantity } = require("../modules/utils")

const bcrypt = require("bcryptjs")

const config = require('../config/config');

const jwt = require("jsonwebtoken")

const mongoose = require('mongoose');



/*
Units
*/

module.exports.getMaterialUnits = (req,res) => {
    return res.status(200).send({response: defaultMaterialUnits})
}

module.exports.getUnits = async (req,res) => {
    try{
        const allUnits =  await UnitService.getUnits(req.tenantModels.unitModel)
        
        return res.status(200).send({response: allUnits})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err.message})
    }
}


module.exports.createUnit = async (req,res) => {
    const {unit} = req.body

    if(!unit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const abbreviationsCount = await UnitService.countUnitByAbbreviations([unit.abbreviation], req.tenantModels.unitModel)

        const namesCount = await UnitService.countUnitByAbbreviations([unit.name], req.tenantModels.unitModel)

        if(abbreviationsCount > 0 || namesCount > 0){
            return res.status(400).send({response: "records exist"})
        }

        //Create unit

        const creationResult =  await UnitService.createUnit(unit, req.tenantModels.unitModel)

        console.log(`Unit created for ${req.tenant._id} with result - ${creationResult}`)

        return res.status(200).sendO({response: creationResult ? "success" : "failure"})
        
    }
    catch(err){
        return res.status(500).send({response: err.message})
    };
}


/*module.exports.createUnit = async (req,res) => {
    const {units} = req.body

    if(!units || units.length == 0){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const names = [];
        const abbreviations = [];

        units.map(aUnit => {
            names.push(aUnit.name)
            abbreviations.push(aUnit.abbreviation)
        })

        //Check if units exist in db

        const abbreviationsCount = await UnitService.countUnitByAbbreviations(abbreviations, req.tenantModels.unitModel)

        const namesCount = await UnitService.countUnitByAbbreviations(names, req.tenantModels.unitModel)

        if(abbreviationsCount > 0 || namesCount > 0){
            return res.status(400).send({response: "records exist"})
        }


        //Check if units are default units

        const plainDefaultUnits = getPlainUnits(defaultUnitsAndConversions)

        units.forEach(aUnit => {
            if(isDefaultUnit(aUnit, plainDefaultUnits)){
                return res.status(400).send({response: "records exists"})
            }
        })


        //Create parent unit and hold parentId

        let parentId = null

        units.every(async unitToCreate => {
            if(unitToCreate.isParent){
                const createdUnit = await UnitService.createUnit(unitToCreate, req.tenantModels.unitModel)

                parentId = createdUnit._id
                return false;
            }
        })

        
        //Set parentId for each child unit

        if(parentId){
            const childUnitsToCreate = units.map(async unitToCreate => {
                if(!unitToCreate.isParent){
                    return {...unitToCreate, parentId: parentUnit._id}
                }
            })
        }
    
        //Create child units

        const createdUnitsDone = await UnitService.createManyUnits(childUnitsToCreate, req.tenantModels.unitModel)

        console.log(createdUnitsDone)

        return res.status(200).send({response: createdUnitsDone})
    }
    catch(err){
        return res.status(500).send({response: err.message})
    }
}

module.exports.createChildUnit = async (req,res) => {
    const {parentId, childUnit} = req.body

    if(!parentId || !childUnit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const parentUnit = await UnitService.getUnit(getUnit, req.tenantModels.unitModel)

        if(parentUnit){
            
            //Check if unit exist

            const abbreviationsCount = await UnitService.countUnitByAbbreviations([childUnit.abbreviation], req.tenantModels.unitModel)

            const namesCount = await UnitService.countUnitByAbbreviations([childUnit.name], req.tenantModels.unitModel)

            if(abbreviationsCount > 0 || namesCount > 0){
                return res.status(400).send({response: "records exist"})
            }

            //Check if unit is one of default units
            const plainDefaultUnits = getPlainUnits(defaultUnitsAndConversions)

            if(isDefaultUnit(childUnit, plainDefaultUnits)){
                return res.status(400).send({response: "records exists"})
            }

            //Create child unit
            await UnitService.createUnit({...childUnit, parentId: parentUnit._id}, req.tenantModels.unitModel)

            return res.status(200).send({response: "success"})
        }

        return res.status(400).send({response: "bad request"})
    }
    catch(err){
        return res.status(500).send({response: err.message})
    }
}*/

module.exports.deleteUnit = async(req,res) => {
    const {unitId} = req.body

    if(!unitId){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const deletedUnit = await UnitService.deleteUnit(unitId, req.tenantModels.unitModel)

        return res.status(200).send({response: deletedUnit})
    }
    catch(err){
        return res.status(500).send({response: err.message})
    }
}

module.exports.editUnit = async (req,res) => {
    const {name, abbreviation, amount, parent, isBase, _id} = req.body

    if(!_id || !name || !abbreviation || !amount || !parent || !isBase){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const abbreviationsCount = await UnitService.countUnitByAbbreviations([abbreviation], req.tenantModels.unitModel)

        const namesCount = await UnitService.countUnitByAbbreviations([name], req.tenantModels.unitModel)

        if(abbreviationsCount > 0 || namesCount > 0){
            return res.status(400).send({response: "records exist"})
        }

        //Check if units are default units

        defaultUnitsAndConversions.forEach(defaultUnit => {
            if(name == defaultUnit.name || abbreviation == defaultUnit.abbreviation){
                return res.status(400).send({response: "records exist"})
            }
        })

        let updatedUnit = await UnitService.updateUnit(_id, {name, abbreviation, amount, parent, isBase}, req.tenantModels.unitModel)
    
        return res.status(200).send({updatedUnit})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}


module.exports.unitIngredients = async(req,res) => {
    const {ingredient_id} = req.query

    try{
        const ingredient = await IngredientService.getIngredientFromId(ingredient_id, req.tenantModels.ingredientModel)

        if(!ingredient){
            res.status(400).send({response: "ingredient not found"})
        }

        const foundUnit = findDefaultUnit(ingredient.purchase_quantity.unit)

        if(!foundUnit){
            foundUnit = await UnitService.getUnit(ingredient.purchase_quantity.unit, req.tenantModels.unitModel)
        }

        if(!foundUnit){
            return res.status(400).send({response: "unit not found"})
        }

        if(foundUnit.isBase){
            //We can query the db with all the units with that base unit id or string
            //We first need to know if its a default unit or not so we can either use the abbreviation or _id

            const allUnits = await UnitService.getUnitsByParent(foundUnit._id, req.tenantModels.unitModel);

            //Lastly we add the base unit itself
            const finalResult = [foundUnit].concat(allunits)

            return res.status(200).send({response: finalResult})
        }

        //We move on to find all the units with the parent in foundUnit
        const allUnits = await UnitService.getUnitsByParent(foundUnit.parent, req.tenantModels.unitModel);

        //Lastly we find the base unit itself
        const foundParent = await UnitService.getUnit(foundUnit.parent, req.tenantModels.unitModel);

        const finalResult = [foundParent].concat(allUnits)

        return res.status(200).send({response: finalResult})
    }   
    catch(err){
        return res.status(500).send({response: err})
    }
}






/*
Account
*/

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

            //insert default units for tenant
            try{
                const tenantModels = await getTenantModels(createdTenant._id)

                const baseUnits = defaultUnitsAndConversions.filter(baseUnit => baseUnit.isBase)

                const nonBaseUnits = defaultUnitsAndConversions.filter(baseUnit => !baseUnit.isBase)

                const unitsInsertResult = await UnitService.createManyUnits(baseUnits, tenantModels.unitModel)

                await Promise.all(unitsInsertResult.map(async insertedBaseUnit => {
                    const aSet = nonBaseUnits.filter(nonBaseUnit => nonBaseUnit.parent.toString() === insertedBaseUnit.abbreviation.toString()).map(nonBaseUnit => {
                        return {...nonBaseUnit, parent: insertedBaseUnit._id}
                    })

                    await UnitService.createManyUnits(aSet, tenantModels.unitModel)

                    return true;
                }))
            }
            catch(err){
                console.log("Error occurred processing units with info - "+err)
            }

            console.log(`Default units inserted for tenant - ${createdTenant._id}`)

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


module.exports.updateAccount = async(req,res) => {
    const { firstname, lastname, phone_number, email, profit_margin} = req.body

    if(!firstname || !lastname || !phone_number || !email){
        return res.status(400).send({response: "bad request"});
    }

    try{
        if(req.tenant.email.toString() !== email.toString()){
            const tenantFound = await TenantService.getTenantFromEmail(email, req.tenantModel)

            if(!!tenantFound){
                return res.status(200).send({response: "user_email_exists"})
            }
        }

        if(req.tenant.phone_number.toString() !== phone_number.toString()){
            const tenantFound = await TenantService.getTenantFromPhoneNumber(phone_number, req.tenantModel)

            if(!!tenantFound){
                return res.status(200).send({response: "user_phone_number_exists"})
            }
        }

        const newTenantDetails = {...req.tenant._doc, firstname, lastname, phone_number, email, profit_margin}

        const token = jwt.sign({tenantId: newTenantDetails._id, firstname: newTenantDetails.firstname, lastname: newTenantDetails.lastname}, config.secret, {issuer: "Profit Table", audience: "Tenant", expiresIn: 60*60*24*500, algorithm: "HS256"});
                
        newTenantDetails.tokens.push(token)

        await TenantService.updateTenant(req.tenant._id, newTenantDetails, req.tenantModel)

        newTenantDetails.tokens = null;
        newTenantDetails.password = null;

        return res.status(200).send({"tenant":newTenantDetails, "token":token, "msg": "success" })
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
    
    const { page, limit } = req.query;

    try{
        let allRecipes = await RecipeService.getAllRecipes(req.tenantModels.recipeModel, { page, limit })

        if(allRecipes.docs && allRecipes.docs.length == 0 ){
            return res.status(200).send({response: allRecipes})
        }

        const allRecipesArray = await Promise.all(allRecipes.docs.map(async (aRecipe) => {

            let recipeIngredientsIdsArray = aRecipe.ingredients.map(ingredient => {
                return ingredient.ingredient;
            })
    
            const fullIngredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(recipeIngredientsIdsArray, req.tenantModels.ingredientModel)
            
            let recipeIngredientsCost = 0;

            await Promise.all(fullIngredientObjects.map(async fullIngredientObject => {
                const foundIngredient = aRecipe.ingredients.find(recipeIngredient => recipeIngredient.ingredient.toString() == fullIngredientObject._id.toString())
                
                const recipeIngredientQuantity = await calculateDesiredQuantityFromQuantity(fullIngredientObject, foundIngredient, req.tenantModels.unitModel)

                recipeIngredientsCost += getPriceOfQuantity(fullIngredientObject.price, fullIngredientObject.purchase_quantity.amount, recipeIngredientQuantity)
            }))

            const recipeUnit = await UnitService.getUnit(aRecipe.yield.unit, req.tenantModels.unitModel)

            const newRecipeObject = {...aRecipe._doc, totalCost: recipeIngredientsCost, yield: {...aRecipe.yield, unit: recipeUnit}};

            return newRecipeObject
        }))

        return res.status(200).send({response: {...allRecipes, docs: allRecipesArray}})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}


/*
fullEntityUnit - ObjectId
foundEntityUnit - ObjectId
foundEntityQuantity - Number
unitModel - Mongoose Model
*/
const getEntityQuantity = async(fullEntityUnit, foundEntityUnit, foundEntityQuantity, unitModel) => {
    if(fullEntityUnit == foundEntityUnit){
        return foundEntityQuantity
    }

     //1. Ingredient unit
    let entitytUnit = await UnitService.getUnit(fullEntityUnit, unitModel)

    if(!entitytUnit){
        console.error("Error retreiving unit for ingredient from both default and DB with unit string - "+fullEntityUnit)
    }


    //2. Ingredient Added to Recipe
    let foundUnit = await UnitService.getUnit(foundEntityUnit, unitModel)

    if(!foundUnit){
        console.error("Error retreiving unit for found ingredient from both default and DB with unit string - "+foundEntityUnit)
    }

    return {entitytUnit, foundUnit}
}

//Get the units that are associated with an entity(ingredient, recipe etc), units include base unit and all its children
const getEntityUnits = async(entityUnit, entityModel) => {
   
    if(entityUnit.isBase){
        //We can query the db with all the units with that base unit id or string
        //We first need to know if its a default unit or not so we can either use the abbreviation or _id
        let  allUnits = await UnitService.getUnitsByParent(entityUnit._id, entityModel);

        //Lastly we add the base unit itself

        return [entityUnit].concat(allUnits)
    }

    //We move on to find all the units with the parent in entityUnit
    const allUnits = await UnitService.getUnitsByParent(entityUnit.parent, entityModel);
    
    //Lastly we find the base unit itself
    const foundParent = await UnitService.getUnit(entityUnit.parent, entityModel);

    return [foundParent].concat(allUnits)
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

            await Promise.all(fullIngredientObjects.map(async fullIngredientObject => {
                const foundIngredient = aRecipe.ingredients.find(recipeIngredient => recipeIngredient.iongredient.toString() == fullIngredientObject._id.toString())
    
                //We need to find the unit object that both the ingredient and the ingredient added to recipe have 
                const recipeIngredientQuantity = await calculateDesiredQuantityFromQuantity(fullIngredientObject, foundIngredient, req.tenantModels.unitModel)

                recipeIngredientsCost += getPriceOfQuantity(fullIngredientObject.price, fullIngredientObject.purchase_quantity.amount, recipeIngredientQuantity)
            }))

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

        const recipeUnit = await UnitService.getUnit(recipe.yield.unit, req.tenantModels.unitModel)

        const ingredientUnits = await getEntityUnits(recipeUnit, req.tenantModels.unitModel)
        
        return res.status(200).send({response: {...recipe, units:ingredientUnits, yield: {...recipe.yield, unit: recipeUnit}}})
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
    const {id, page, limit} = req.query

    if(!id || !page || !limit){
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

        const fullIngredientObjects = await IngredientService.findIngredientsFromArrayIds(recipeIngredientsIdsArray, req.tenantModels.ingredientModel, page,limit)
        
        const recipeIngredients = await Promise.all(fullIngredientObjects.docs.map(async fullIngredientObject => {
            const foundIngredient = recipe.ingredients.find(recipeIngredient => recipeIngredient.ingredient.toString() == fullIngredientObject._id.toString())
            
            const ingredientUnit = await UnitService.getUnit(foundIngredient.unit, req.tenantModels.unitModel)

            const ingredientUnits = await getEntityUnits(ingredientUnit, req.tenantModels.unitModel)

            const recipeIngredientQuantity = await calculateDesiredQuantityFromQuantity(fullIngredientObject, foundIngredient, req.tenantModels.unitModel)

            const purchase_quantity = {...fullIngredientObject.purchase_quantity, unit: ingredientUnit}

            return {...fullIngredientObject._doc, purchase_quantity, units: ingredientUnits, quantity: foundIngredient.quantity, totalCost: getPriceOfQuantity(fullIngredientObject.price, fullIngredientObject.purchase_quantity.amount, recipeIngredientQuantity)}
        }))

        return res.status(200).send({response: {...fullIngredientObjects, docs:recipeIngredients}})
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
    const { limit, page, type, searchTerm, status } = req.query;

    if(!limit || !page || !type || !status){
        return res.status(400).send({response: "bad request"})
    }

    try{
        if(type.toLowerCase() == "ingredients" || type.toLowerCase() == "ingredient"){
            let allIngredients = await IngredientService.getAllIngredients(req.tenantModels.ingredientModel, {limit, page}, searchTerm, status)
            
            if(allIngredients.docs && allIngredients.docs.length > 0){
                const allIngredientDocs = await Promise.all(allIngredients.docs.map(async ingredientItem => {
                    const ingredientUnit = await UnitService.getUnit(ingredientItem.purchase_quantity.unit, req.tenantModels.unitModel)

                    const ingredientUnits = await getEntityUnits(ingredientUnit, req.tenantModels.unitModel)

                    const purchase_quantity = {...ingredientItem.purchase_quantity, unit: ingredientUnit}

                    return {...ingredientItem._doc, purchase_quantity, units:ingredientUnits, costOfQuantityInStock: getPriceOfQuantity(ingredientItem.price, ingredientItem.purchase_quantity.amount, ingredientItem.quantity_in_stock)}
                }))
    
                return res.status(200).send({response: {...allIngredients, docs: allIngredientDocs}})
            }

            return res.status(200).send({response: {...allIngredients, docs: []}})
        }
        
        if(type.toLowerCase() == "materials" || type.toLowerCase() == "material"){
            let allMaterials = await MaterialService.getAllMaterials(req.tenantModels.materialModel, {limit, page}, searchTerm,  status)
            
            const editedList = getQuantityInStockForInventoryList(allMaterials.docs)

            const newItemsList = editedList.map(editedListItem => {
                const foundUnit = defaultMaterialUnits.filter(aUnit => aUnit._id == editedListItem.purchase_quantity.unit).shift()

                if(foundUnit){
                    return {...editedListItem, purchase_quantity: {...editedListItem.purchase_quantity, unit: foundUnit}}
                }

                return editedListItem
            })
        
            return res.status(200).send({response: {...allMaterials, docs: newItemsList}})
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

        const editedList = getQuantityInStockForInventoryList(results)

        return res.status(200).send({response: editedList})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}

const getQuantityInStockForInventoryList = (inventoryItems) => {
    return inventoryItems.map(inventoryItem => {
        const item = {...inventoryItem._doc}
        
        return {...item, costOfQuantityInStock: getPriceOfQuantity(item.price, item.purchase_quantity.amount, item.quantity_in_stock)}
    })
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
    //This should be multiple igredients but will work with one for now till we figure it out
    const {ingredient} = req.body

    if(!ingredient){
        return res.status(400).send({response: "bad request"})
    }

    try{
        ingredient.purchase_quantity = {
            amount: ingredient.purchase_quantity,
            unit: ingredient.purchase_unit
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

    console.log(material)

    if(!material){
        return res.status(400).send({response: "bad request"})
    }

    try{
        material.purchase_quantity = {
            amount: material.purchase_quantity,
            unit: material.purchase_unit._id
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
    const { recipe_id, search_term, page, limit } = req.query

    if(!recipe_id || !page || !limit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const recipe = await RecipeService.getRecipe(recipe_id, req.tenantModels.recipeModel)

        if(!recipe){
            return res.status(404).send({response: "recipe not found"})
        }

        let ingredients_found = null;

        if(recipe.ingredients.length > 0){
            const recipe_ingredients_ids = recipe.ingredients.map(ingredient => {
                return ingredient.ingredient
            })
            
            ingredients_found = await IngredientService.getIngredientsNotInArrayWithSearchTerm(recipe_ingredients_ids, page, limit, req.tenantModels.ingredientModel, search_term)
        }
        else{
            ingredients_found = await IngredientService.getAllIngredientsToAddSearch(page, limit, req.tenantModels.ingredientModel, search_term)
        }

        if(ingredients_found && ingredients_found.docs.length > 0){
            
            const allIngredients = await Promise.all(ingredients_found.docs.map(async ingredient_found => {
                const ingredientUnit = await UnitService.getUnit(ingredient_found.purchase_quantity.unit, req.tenantModels.unitModel)

                const ingredientUnits = await getEntityUnits(ingredientUnit, req.tenantModels.unitModel)

                const purchase_quantity = {...ingredient_found.purchase_quantity, unit: ingredientUnit}

                return {...ingredient_found._doc, units: ingredientUnits, purchase_quantity}
            }))

            return res.status(200).send({response: {...ingredients_found, docs: allIngredients}})
        }

        return res.status(200).send({response: ingredients_found})

    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}

module.exports.getMaterialsToAdd = async(req,res) => {
    const { product_id, search_term, page, limit } = req.query

    if(!product_id || !page || !limit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const product = await ProductService.getProduct(product_id, req.tenantModels.productModel)

        if(!product){
            return res.status(404).send({response: "product not found"})
        }

        let materials_found;

        if(product.materials.length > 0){
            const product_materials_ids = product.materials.map(material => {
                return material.material
            })

            materials_found = await MaterialService.getMaterialsNotInArrayWithSearchTerm(product_materials_ids, page, limit, req.tenantModels.materialModel, search_term)
        }
        else{
            materials_found = await MaterialService.getAllMaterialsToAddSearch(page, limit, req.tenantModels.materialModel, search_term) 
        }

        const finalMaterials = materials_found.docs.map(materialFound => {
            const foundUnit = defaultMaterialUnits.filter(defaultUnit => defaultUnit._id === materialFound.purchase_quantity.unit).shift()

            return {...materialFound._doc, purchase_quantity: {...materialFound.purchase_quantity, unit: foundUnit}}
        })

        return res.status(200).send({response: {...materials_found, docs: finalMaterials}})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
    }
}


module.exports.getRecipesToAdd = async(req,res) => {
    const { product_id, search_term, page, limit } = req.query

    if(!product_id || !page || !limit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const product = await ProductService.getProduct(product_id, req.tenantModels.productModel)

        if(!product){
            return res.status(404).send({response: "product not found"})
        }

        let recipes_found = null;

        if(product.recipes.length > 0){
            const product_recipes_ids = product.recipes.map(recipe => {
                return recipe.recipe
            })

            recipes_found = await RecipeService.getRecipesNotInArrayWithSearchTerm(product_recipes_ids, page, limit, req.tenantModels.recipeModel, search_term)
        }
        else{
            recipes_found = await RecipeService.getAllRecipesToAddSearch(page, limit, req.tenantModels.recipeModel, search_term)
        }

        if(recipes_found && recipes_found.docs.length > 0){
            const allRecipes = await Promise.all(recipes_found.docs.map(async recipe_found => {
                const recipeUnit = await UnitService.getUnit(recipe_found.yield.unit, req.tenantModels.unitModel)

                const recipeUnits = await getEntityUnits(recipeUnit, req.tenantModels.unitModel)

                const yield = {...recipe_found.yield, unit: recipeUnit}

                return {...recipe_found._doc, units: recipeUnits, yield}
            }))

            return res.status(200).send({response: {...recipes_found, docs: allRecipes}})
        }

        return res.status(200).send({response: recipes_found})
        
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

    let { page, limit } = req.query;

    if(!page || !limit){
        return res.status(400).send({response: "bad request"})
    }

    page = parseInt(page)

    try{
        let allProducts = await ProductService.getAllProducts(req.tenantModels.productModel, { page, limit })

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

                await Promise.all(ingredientObjects.map(async ingredientObject => {
                    const foundIngredient = aProductRecipe.ingredients.find(anIngredient => anIngredient.ingredient.toString() === ingredientObject._id.toString())

                    const recipeIngredientQuantity = await calculateDesiredQuantityFromQuantity(ingredientObject, foundIngredient, req.tenantModels.unitModel)

                    recipeCost += getPriceOfQuantity(ingredientObject.price, ingredientObject.purchase_quantity.amount, recipeIngredientQuantity);
                }))

                const productRecipeQuantity = await calculateDesiredQuantityFromQuantity(aProductRecipe, foundRecipe, req.tenantModels.unitModel)

                allRecipesCost += getPriceOfQuantity(recipeCost, aProductRecipe.yield.amount, productRecipeQuantity);

                return true;
            }))

            const productMaterialsIds = productFound.materials.map(aMaterial => {
                return aMaterial.material;
            })

            const productMaterialObjects = await MaterialService.findMaterialsFromArrayIdsNoPagination(productMaterialsIds, req.tenantModels.materialModel)

            let allMaterialsCost = 0;

            await Promise.all(productMaterialObjects.map(aProductMaterial => {
                const foundMaterial = productFound.materials.find(aMaterial => aMaterial.material.toString() === aProductMaterial._id.toString())

                const foundMaterialQuantity = convertQuantityToOtherQuantity(aProductMaterial, foundMaterial)

                allMaterialsCost += getPriceOfQuantity(aProductMaterial.price, aProductMaterial.purchase_quantity.amount, foundMaterialQuantity);
            }))

            let productCost = allMaterialsCost + allRecipesCost + (productFound._doc.labour_cost ? productFound._doc.labour_cost : 0) + (productFound._doc.overhead_cost ? productFound._doc.overhead_cost : 0)

            const profitCost = productFound._doc.profit_margin ? productFound._doc.profit_margin / 100 * productCost : 0

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
    const { limit, page, searchTerm } = req.query;

    if(!limit || !page || !searchTerm){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let results = await ProductService.getProductsSearch(searchTerm, req.tenantModels.productModel, {limit, page})

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
    const { name } = req.body;

    if(!name){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let createdProduct = await ProductService.createProduct({ name }, req.tenantModels.productModel)

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
    const {recipe_id, quantity, unit, id} = req.body
    //quantity should be an object containing amount and unit

    if(!id || !recipe_id || !quantity || !unit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let product = await ProductService.getProduct(id, req.tenantModels.productModel)

        if(!product){
            return res.status(400).send({response: "product not found"})
        }

        const newRecipesArray = product.recipes.map(recipe => {
            if (recipe.recipe.toString() === recipe_id.toString()) {
                recipe.quantity = quantity
                recipe.unit = unit;
                return recipe
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
    const {material_id, quantity, unit, id} = req.body

    if(!id || !material_id || !quantity || !unit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let product = await ProductService.getProduct(id, req.tenantModels.productModel)

        if(!product){
            return res.status(400).send({response: "product not found"})
        }

        const newMaterialsArray = product.materials.map(material => {
            if (material.material.toString() === material_id.toString()) {
                material.quantity = quantity;
                material.unit = unit

                return material;
            }
            return material;
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
    const {id, page, limit} = req.query

    if(!id || !limit || !page){
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
            const arrayOfFullRecipeObjects = await RecipeService.findRecipesFromArrayIds(productRecipesIdsArray, req.tenantModels.recipeModel, page, limit);
    
            if(arrayOfFullRecipeObjects.docs.length == 0){
                return res.status(200).send({response: {}})
            }

            //for each recipe set the amount of the yield
            const arrayOfUpdatedFullRecipes = await Promise.all(arrayOfFullRecipeObjects.docs.map(async fullRecipeObject => {
                const aFoundRecipe = product.recipes.find(recipe => recipe.recipe.toString() === fullRecipeObject._id.toString());

                //fullRecipeObject.yield.amount = aFoundRecipe.quantity

                const recipeIngredientsIdsArray = fullRecipeObject.ingredients.map(ingredientInRecipe => {
                    return ingredientInRecipe.ingredient;
                })

                const fullIngredientsObjects = await IngredientService.findIngredientsFromArrayIds(recipeIngredientsIdsArray, req.tenantModels.ingredientModel, 0, 1000)
    
                let totalRecipeCost = 0;

                await Promise.all(fullIngredientsObjects.docs.map(async fullIngredientObject => {
                    const aFoundIngredient = fullRecipeObject.ingredients.find(ingredient => ingredient.ingredient.toString() === fullIngredientObject._id.toString());
                    
                    const recipeIngredientQuantity = await calculateDesiredQuantityFromQuantity(fullIngredientObject, aFoundIngredient, req.tenantModels.unitModel)

                    totalRecipeCost += getPriceOfQuantity(fullIngredientObject.price, fullIngredientObject.purchase_quantity.amount, recipeIngredientQuantity)
                }))

                const recipeUnit = await UnitService.getUnit(aFoundRecipe.unit, req.tenantModels.unitModel)

                const recipeUnits = await getEntityUnits(recipeUnit, req.tenantModels.unitModel)

                const recipeQuantity = await calculateDesiredQuantityFromQuantity(fullRecipeObject, aFoundRecipe, req.tenantModels.unitModel)

                return {...fullRecipeObject._doc, units: recipeUnits, yield: {...fullRecipeObject.yield, amount: aFoundRecipe.quantity, unit: recipeUnit} , cost: getPriceOfQuantity(totalRecipeCost, fullRecipeObject.yield.amount, recipeQuantity)};
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
    const {id,page,limit} = req.query

    if(!id || !limit || !page){
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
            const arrayOfFullMaterialObjects = await MaterialService.findMaterialsFromArrayIds(productMaterialsIdsArray, req.tenantModels.materialModel,page,limit);
            
            if(arrayOfFullMaterialObjects.docs.length == 0){
                return res.status(200).send({response: {}})
            }

            const arrayOfUpdatedFullMaterials = arrayOfFullMaterialObjects.docs.map(fullMaterialObject => {
                const aFoundMaterial = product.materials.find(material => material.material.toString() === fullMaterialObject._id.toString());
                const foundUnit = defaultMaterialUnits.filter(defaultUnit => defaultUnit._id == aFoundMaterial.unit).shift()
                const totalClost = calculateCostOfAddedMaterial(fullMaterialObject, aFoundMaterial);
                return {...fullMaterialObject._doc, quantity: aFoundMaterial.quantity, totalCost: totalClost, purchase_quantity: {...fullMaterialObject._doc.purchase_quantity, unit: foundUnit}}
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
    const { page, limit } = req.query;
    
    if(!page || !limit){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let allOrders = await OrderService.getAllOrders(req.tenantModels.orderModel, { page, limit })

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
    const { limit, page, searchTerm } = req.query;

    if(!limit || !page || !searchTerm){
        return res.status(400).send({response: "bad request"})
    }

    try{
        let results = await OrderService.getOrdersSearch(searchTerm, req.tenantModels.orderModel, {limit, page})

        return res.status(200).send({response: results})
    }
    catch(err){
        return res.status(500).send({response: err})
    }
}



//Order

module.exports.getOrderProducts = async(req,res) => {
    const {id, page, limit} = req.query

    if(!id || !page || !limit){
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

        const productsFoundArray = await ProductService.getProductsFromIdsArray(orderProductsIds, req.tenantModels.productModel, page, limit)
        
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

                await Promise.all(ingredientObjects.map(async ingredientObject => {
                    const foundIngredient = aProductRecipe.ingredients.find(anIngredient => anIngredient.ingredient.toString() === ingredientObject._id.toString())

                    const recipeIngredientQuantity = await calculateDesiredQuantityFromQuantity(ingredientObject, foundIngredient, req.tenantModels.unitModel)

                    recipeCost += getPriceOfQuantity(ingredientObject.price, ingredientObject.purchase_quantity.amount, recipeIngredientQuantity) 
                }))

                const productRecipeQuantity = await calculateDesiredQuantityFromQuantity(aProductRecipe, foundRecipe, req.tenantModels.unitModel)

                //allRecipesCost += recipeCost * (foundRecipe.quantity.amount && foundRecipe.quantity.amount > 0 ? foundRecipe.quantity.amount : 1)

                allRecipesCost += getPriceOfQuantity(recipeCost, aProductRecipe.yield.amount, productRecipeQuantity);

                return true;
            }))

            const productMaterialsIds = productFound.materials.map(aMaterial => {
                return aMaterial.material;
            })

            const productMaterialObjects = await MaterialService.findMaterialsFromArrayIdsNoPagination(productMaterialsIds, req.tenantModels.materialModel)

            let allMaterialsCost = 0;

            await Promise.all(productMaterialObjects.map(aProductMaterial => {
                const foundMaterial = productFound.materials.find(aMaterial => aMaterial.material.toString() === aProductMaterial._id.toString())
                //const foundUnit = defaultMaterialUnits.filter(defaultUnit => defaultUnit._id == aFoundMaterial.unit).shift()
                const totalClost = calculateCostOfAddedMaterial(aProductMaterial, foundMaterial);
                allMaterialsCost += totalClost
            }))

            //console.log({allMaterialsCost, allRecipesCost, labourCost: productFound._doc.labour_cost, overheadCost: productFound._doc.overhead_cost})

            let productCost = allMaterialsCost + allRecipesCost + (productFound._doc.labour_cost ? productFound._doc.labour_cost : 0) + (productFound._doc.overhead_cost ? productFound._doc.overhead_cost : 0)

            const profitCost = productFound._doc.profit_margin ? productFound._doc.profit_margin / 100 * productCost : 0

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
    const {id, name, fulfillment_date, status, note} = req.body;

    if(!id || !name){
        return res.status(400).send({response: "bad request"})
    }

    try{
        const editedOrder = await OrderService.updateOrder(id,{name, fulfillment_date, status, note}, req.tenantModels.orderModel)

        return res.status(200).send({response: editedOrder})
    }
    catch(err){
        console.log(err)
        return res.status(500).send({response: err})
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

                const foundProduct = order.products.find(aProduct => aProduct.product.toString() === fullProductObject._id.toString())

                const productQuantity = foundProduct.quantity;
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

                        //Total quantity of the product and recipe
                        //---------------------------
                        const  productRecipeQuantity = productQuantity * recipeQuantity
                        //---------------------------

                        const ingredientsIds = fullRecipeObjectItem.ingredients.map(anIngredient => {
                            return anIngredient.ingredient
                        })

                        const fullIngredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(ingredientsIds, req.tenantModels.ingredientModel)
                        
                        await Promise.all(fullIngredientObjects.map(async fullIngredientObjectsItem => {
                            const foundIngredient = fullRecipeObjectItem.ingredients.find(anIngredient => anIngredient.ingredient.toString() === fullIngredientObjectsItem._id.toString())

                            const chosenQuantityConverted = await calculateDesiredQuantityFromQuantity(fullIngredientObjectsItem, foundIngredient, req.tenantModels.unitModel)

                            const quantityToDeduct = productRecipeQuantity * chosenQuantityConverted

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

                        const quantityToDeduct = productQuantity * convertQuantityToOtherQuantity(fullMaterialObject, foundMaterial) 

                        fullMaterialObject.quantity_in_stock = Math.abs(fullMaterialObject.quantity_in_stock - quantityToDeduct)

                        await MaterialService.updateMaterial(fullMaterialObject._id, fullMaterialObject, req.tenantModels.materialModel)

                        return true;
                    }))
                }

                return true
            }))

            order.status = "FULFILLED"
            order.fulfillment_date = new Date()
            
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
    const {id, search_term, page, limit} = req.query

    if(!id || !page || !limit){
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

            if(page && limit){
                const products_found = await ProductService.getProductsNotInArrayWithSearchTerm(orderProductsIds, page, limit, req.tenantModels.productModel, search_term)
                
                return res.status(200).send({response: products_found})
            }

            const products_found = await ProductService.getProductsNotInArray(orderProductsIds, req.tenantModels.productModel)
        
            return res.status(200).send({response: products_found})
        }
        else{
            if(page && limit){
                const products_found = await ProductService.getAllProductsToAddSearch(page, limit, req.tenantModels.productModel, search_term)
                
                return res.status(200).send({response: products_found})
            }
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

        let cost_diff_found = 0;

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
            const recipes = await RecipeService.getRecipesFromIngredientsArray(changeListIds, req.tenantModels.recipeModel) 

            if(recipes && recipes.length > 0){
                const recipesIdsArray = recipes.map(aRecipe => {
                    return aRecipe._id
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

                        const recipeQuantity = aFoundRecipe.quantity.amount

                        //get cost of recipe ingredients

                        if(allProductRecipe.ingredients && allProductRecipe.ingredients.length > 0 && recipeQuantity > 0){
                            const ingredientIds = allProductRecipe.ingredients.map(anIngredient => {
                                return anIngredient.ingredient
                            })
    
                            //find all full ingredient objects
                            const allIngredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(ingredientIds, req.tenantModels.ingredientModel)
    
                            const allIngredientsCost = await Promise.all(allIngredientObjects.reduce(async(acc, allIngredientObject) => {
                                const aFoundIngredient = allProductRecipe.ingredients.find(anIngredient => anIngredient.ingredient.toString() === allIngredientObject._id.toString())
                          
                                if(type.toLowerCase() == INGREDIENT || type.toLowerCase().includes(INGREDIENT)){
                                    if(changeListIds[0].toString() === allIngredientObject._id.toString()){
                                        cost_diff_found = (Object.values(aChangeList)[0] * aFoundIngredient.quantity) - (allIngredientObject.price * aFoundIngredient.quantity)
                                    }
                                }

                                const recipeIngredientQuantity = await calculateDesiredQuantityFromQuantity(allIngredientObject, aFoundIngredient, req.tenantModels.unitModel)

                                return acc + getPriceOfQuantity(allIngredientObject.price, allIngredientObject.purchase_quantity.amount, recipeIngredientQuantity)
                            },0))

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
                               cost_diff_found = (aFoundMaterial.quantity * Object.values(aChangeList)[0]) - (aFoundMaterial.quantity * aProductMaterial.price)
                            }
                        }

                        const totalClost = calculateCostOfAddedMaterial(aProductMaterial, aFoundMaterial);
                        
                        return acc + totalClost
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
            const material = await MaterialService.updateMaterial(id, {price: change}, req.tenantModels.materialModel)

            return res.status(200).send({response: material})
        }

        if(type.toLowerCase() == INGREDIENT || type.toLowerCase().includes(INGREDIENT)){
            const ingredient = await IngredientService.updateIngredient(id, {price: change}, req.tenantModels.ingredientModel)
            
            return res.status(200).send({response: ingredient})
        }
    }
    catch(err){
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

            const foundProduct = order.products.find(aProduct => aProduct.product.toString() === anOrderProduct._id.toString())

            const productQuantity  = foundProduct.quantity

            //get All materials and ingredients for this product and add to the object of materials and ingredients respectively

            //We handle the materials part first
            if(anOrderProduct.materials && anOrderProduct.materials.length > 0){
                const anOrderProductMaterialsIds = anOrderProduct.materials.map(anOrderProductMaterial => {
                    return anOrderProductMaterial.material
                })

                const fullMaterialObjects = await MaterialService.findMaterialsFromArrayIdsNoPagination(anOrderProductMaterialsIds, req.tenantModels.materialModel)

                fullMaterialObjects.map(fullMaterialObject => {
                    const aFoundMaterial = anOrderProduct.materials.find(anOrderProductMaterial => anOrderProductMaterial.material.toString() === fullMaterialObject._id.toString())

                    let chosenQuantityConverted = convertQuantityToOtherQuantity(fullMaterialObject, aFoundMaterial)
                    chosenQuantityConverted = chosenQuantityConverted * productQuantity

                    const priceOfQuantity = getPriceOfQuantity(fullMaterialObject.price, fullMaterialObject.purchase_quantity.amount, chosenQuantityConverted)

                    if(!orderMaterials[fullMaterialObject._id]){
                        const cost = priceOfQuantity

                        const resolvedQuantity = fullMaterialObject.quantity_in_stock - chosenQuantityConverted

                        const status = resolvedQuantity < 0 ? "LOW" : "NORMAL"

                        const quantityToFulfill = resolvedQuantity < 0 ? Math.abs(fullMaterialObject.quantity_in_stock - aFoundMaterial.quantity) : 0

                        const unit = defaultMaterialUnits.find(defaultMaterialUnit => defaultMaterialUnit._id.toString() === aFoundMaterial.unit.toString())

                        orderMaterials[fullMaterialObject._id] = { ...fullMaterialObject, unit:unit, cost: cost, status: status, quantity: chosenQuantityConverted, quantityToFulfill: quantityToFulfill}
                    }
                    else{
                        const cost = priceOfQuantity + orderMaterials[fullMaterialObject._id].cost

                        const resolvedQuantity = fullMaterialObject.quantity_in_stock - orderMaterials[fullMaterialObject._id].quantity - chosenQuantityConverted

                        const status = resolvedQuantity < 0 ? "LOW" : "NORMAL"

                        const quantityToFulfill = resolvedQuantity < 0 ? Math.abs(resolvedQuantity) : 0

                        orderMaterials[fullMaterialObject._id] = { ...fullMaterialObject, cost: cost, status: status, quantity: orderMaterials[fullMaterialObject._id].quantity + chosenQuantityConverted, quantityToFulfill: quantityToFulfill}
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
                    const foundRecipe = anOrderProduct.recipes.find(aRecipe => aRecipe.recipe.toString() === fullRecipeObject._id.toString())

                    const recipeQuantity =  foundRecipe.quantity 

                    const productRecipeQuantity = productQuantity * recipeQuantity


                    //get ingredients in this recipe and calculate cost
                    if(fullRecipeObject.ingredients && fullRecipeObject.ingredients.length > 0){
                        const ingredientsIdsArray = fullRecipeObject.ingredients.map(fullRecipeObjectIngredient => {
                            return fullRecipeObjectIngredient.ingredient
                        })

                        //get full ingredient objects
                        const fullIngredientObjects = await IngredientService.findIngredientsFromArrayIdsNoPagination(ingredientsIdsArray, req.tenantModels.ingredientModel)

                        if(fullIngredientObjects && fullIngredientObjects.length > 0){
                            await Promise.all(fullIngredientObjects.map(async fullIngredientObject => {
                                const aFoundIngredient = fullRecipeObject.ingredients.find(fullRecipeObjectIngredient => fullRecipeObjectIngredient.ingredient.toString() === fullIngredientObject._id.toString())

                                let chosenQuantityConverted = await calculateDesiredQuantityFromQuantity(fullIngredientObject, aFoundIngredient, req.tenantModels.unitModel)
                                chosenQuantityConverted = chosenQuantityConverted * productRecipeQuantity;

                                const priceOfQuantity = getPriceOfQuantity(fullIngredientObject.price, fullIngredientObject.purchase_quantity.amount, chosenQuantityConverted)

                                if(!orderIngredients[fullIngredientObject._id]){
                                    const cost = priceOfQuantity

                                    const resolvedQuantity = fullIngredientObject.quantity_in_stock - chosenQuantityConverted
            
                                    const status = resolvedQuantity < 0 ? "LOW" : "NORMAL"
            
                                    const quantityToFulfill = resolvedQuantity < 0 ? Math.abs(fullIngredientObject.quantity_in_stock - aFoundIngredient.quantity) : 0
                                    
                                    const unit = await UnitService.getUnit(aFoundIngredient.unit, req.tenantModels.unitModel)

                                    orderIngredients[fullIngredientObject._id] = { ...fullIngredientObject, unit:unit, cost: cost, status: status, quantity: chosenQuantityConverted, quantityToFulfill: quantityToFulfill}
                                }
                                else{
                                    const cost =  priceOfQuantity + orderIngredients[fullIngredientObject._id].cost
            
                                    const resolvedQuantity = fullIngredientObject.quantity_in_stock - orderIngredients[fullIngredientObject._id].quantity - chosenQuantityConverted
            
                                    const status = resolvedQuantity < 0 ? "LOW" : "NORMAL"
            
                                    const quantityToFulfill = resolvedQuantity < 0 ? Math.abs(resolvedQuantity) : 0
            
                                    orderIngredients[fullIngredientObject._id] = { ...fullIngredientObject, cost: cost, status: status, quantity: orderIngredients[fullIngredientObject._id].quantity + chosenQuantityConverted, quantityToFulfill: quantityToFulfill}
                                }
                            }))
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
