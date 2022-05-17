
const userController = require("../controller/user.controller")

module.exports = function(router){

    //Account

    router.post("/login", function(req,res){
        userController.login(req,res)
    });

    router.post("/signup", function(req,res){
        userController.signup(req,res)
    });

    router.get("/confirm_email", function(req,res){
        userController.confirmEmail(req,res)
    });

    router.post("/forgot_password", function(req,res){
        userController.forgotPassword(req,res)
    });

    router.put("/update_account", function(req,res){
        userController.updateAccount(req,res)
    });

    router.get("/change_password", function(req,res){
        userController.changePassword(req,res)
    });

    router.post("/logout", function(req,res){
        userController.logout(req,res)
    });




    //Dashboard

    router.get("/recipes_ingredients_count", function(req,res){
        userController.recipesCount(req,res)
    });

    router.get("/recent_recipes", function(req,res){
        userController.recentRecipes(req,res)
    });




    //Recipes

    router.get("/all_recipes", function(req,res){
        userController.allRecipes(req,res)
    });

    router.get("/search_recipes", function(req,res){
        userController.searchRecipes(req,res)
    });

    router.delete("/delete_recipe", function(req,res){
        userController.deleteRecipe(req,res)
    });

    router.post("/create_recipe", function(req,res){
        userController.createRecipe(req,res)
    });




    //Recipe

    router.put("/update_recipe", function(req,res){
        userController.updateRecipe(req,res)
    });

    router.post("/add_ingredients", function(req,res){
        userController.addIngredients(req,res)
    });

    router.put("/update_recipe_ingredient", function(req,res){
        userController.updateRecipeIngredient(req,res)
    });

    router.get("/delete_recipe_ingredient", function(req,res){
        userController.deleteRecipeIngredient(req,res)
    });




    //Ingredients

    router.get("/all_ingredients", function(req,res){
        userController.allIngredients(req,res)
    });

    router.get("/search_ingrdients", function(req,res){
        userController.searchIngredients(req,res)
    });

    router.post("/create_ingredient", function(req,res){
        userController.createIngredient(req,res)
    });

    router.put("/update_ingredient", function(req,res){
        userController.updateIngredient(req,res)
    });

    router.delete("/delete_ingredient", function(req,res){
        userController.deleteIngredient(req,res)
    });




    //Ingredient

    router.get("/recipes_using_ingredient", function(req,res){
        userController.recipesCount(req,res)
    });

    router.get("/ingredient", function(req,res){
        userController.getIngredient(req,res)
    });
}


