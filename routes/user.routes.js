
const userController = require("../controller/user.controller")

module.exports = function(router){

    //Accoun

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

    router.get("/entities_count", function(req,res){
        //Counts Orders, Products, Recipes and Inventory and returns
        userController.entitiesCount(req,res)
    });

    router.get("/recent_orders", function(req,res){
        userController.recentOrders(req,res)
    });

        
    

    //Orders

    router.get("/orders", function(req,res){
        userController.getAllOrders(req,res)
    });

    router.delete("/orders/delete", function(req,res){
        userController.deleteOrder(req,res)
    });

    router.post("/orders/add", function(req,res){
        userController.addOrder(req,res)
    });

    router.get("/orders/search", function(req,res){
        userController.searchOrders(req,res)
    });
    

    //Order 

    router.get("/order/products", function(req,res){
        userController.getOrderProducts(req,res)
    });

    router.get("/order", function(req,res){
        userController.getOrder(req,res)
    });

    router.put("/order/edit", function(req,res){
        userController.editOrder(req,res)
    });

    router.put("/order/fulfill", function(req,res){
        userController.fulfillOrder(req,res)
    });

    router.put("/order/add_products", function(req,res){
        userController.addProductsToOrder(req,res)
    });

    router.put("/order/edit_product", function(req,res){
        userController.editOrderProduct(req,res)
    });

    router.delete("/order/delete_product", function(req,res){
        userController.deleteOrderProduct(req,res)
    });

    router.get("/order/shopping-list", (req,res) => {
        userController.getOrderShoppingList(req,res)
    })




    //Recipes

    router.get("/recipes", function(req,res){
        userController.getAllRecipes(req,res)
    });

    router.get("/recipes/search", function(req,res){
        userController.searchRecipes(req,res)
    });

    router.post("/recipes/add", function(req,res){
        userController.addRecipe(req,res)
    });


    
    //Recipe

    router.get("/recipe", function(req,res){
        userController.getRecipe(req,res)
    });

    router.put("/recipe/edit", function(req,res){
        userController.editRecipe(req,res)
    });

    router.delete("/recipe/delete", function(req,res){
        userController.deleteRecipe(req,res)
    });

    router.post("/recipe/add_ingredients", function(req,res){
        userController.addIngredientsToRecipe(req,res)
    });

    router.put("/recipe/edit_ingredient", function(req,res){
        userController.editRecipeIngredient(req,res)
    });

    router.delete("/recipe/delete_ingredient", function(req,res){
        userController.deleteRecipeIngredient(req,res)
    });

    router.get("/recipe/ingredients", function(req,res){
        userController.getRecipeIngredients(req,res)
    });





    //Products

    router.get("/products", function(req,res){
        userController.getAllProducts(req,res)
    });

    router.get("/products/search", function(req,res){
        userController.searchProducts(req,res)
    });

    router.delete("/products/delete", function(req,res){
        userController.deleteProduct(req,res)
    });

    router.post("/products/add", function(req,res){
        userController.addProduct(req,res)
    });

    router.get("/products/products_to_add", function(req,res){
        userController.getProductstoAdd(req,res)
    })


    //Product

    router.get("/product", function(req,res){
        userController.getProduct(req,res)
    });

    router.post("/product/add_recipes", function(req,res){
        userController.addRecipesToProduct(req,res)
    });

    router.post("/product/add_materials", function(req,res){
        userController.addMaterialsToProduct(req,res)
    });

    router.put("/product/edit", function(req,res){
        userController.editProduct(req,res)
    });

    router.put("/product/edit_recipe", function(req,res){
        userController.editProductRecipe(req,res)
    });

    router.delete("/product/delete_recipe", function(req,res){
        userController.deleteProductRecipe(req,res)
    });

    router.put("/product/edit_material", function(req,res){
        userController.editProductMaterial(req,res)
    });

    router.delete("/product/delete_material", function(req,res){
        userController.deleteProductMaterial(req,res)
    });

    router.get("/product/recipes", function(req,res){
        userController.getProductRecipes(req,res)
    });

    router.get("/product/materials", function(req,res){
        userController.getProductMaterials(req,res)
    });





    //Profit Table
    
    router.get("/profit_table/ingredients_materials", (req,res) => {
        userController.getProfitTableIngredientsMaterials(req,res)
    })

    router.get("/profit_table/recipe_changes", (req,res) => {
        userController.getProfitTableRecipeChanges(req,res)
    })

    router.get("/profit_table/product_changes", (req,res) => {
        userController.getProfitTableProductChanges(req,res)
    })

    router.get("/profit_table/order_changes", (req,res) => {
        userController.getProfitTableOrderChanges(req,res)
    })

    router.post("/profit_table/apply_changes", (req,res) => {
        userController.applyProfitTableChanges(req,res)
    })






    //Inventory

    router.get("/inventory", function(req,res){
        userController.getInventory(req,res)
    });

    router.get("/inventory/search", function(req,res){
        userController.searchInventory(req,res)
    });

    router.get("/inventory/export", function(req,res){
        userController.exportInventory(req,res)
    });

    router.get("/inventory/ingredients_to_add", function(req,res){
        userController.getIngredientsToAdd(req,res)
    });

    router.get("/inventory/materials_to_add", function(req,res){
        userController.getMaterialsToAdd(req,res)
    });

    router.delete("/inventory/delete_ingredient", function(req,res){
        userController.deleteInventoryIngredient(req,res)
    });

    router.delete("/inventory/delete_material", function(req,res){
        userController.deleteInventoryMaterial(req,res)
    });

    router.post("/inventory/add_ingredient", function(req,res){
        userController.addIngredientsToInventory(req,res)
    });

    router.post("/inventory/add_material", function(req,res){
        userController.addMaterialsToInventory(req,res)
    });

    router.put("/inventory/edit_ingredient", function(req,res){
        userController.editInventoryIngredient(req,res)
    });

    router.put("/inventory/edit_material", function(req,res){
        userController.editInventoryMaterial(req,res)
    });

    router.get("/inventory/ingredients_to_add", function(req,res){
        userController.getIngredientsToAdd(req,res)
    })

    router.get("/inventory/materials_to_add", function(req,res){
        userController.getMaterialsToAdd(req,res)
    })

    router.get("/inventory/recipes_to_add", function(req,res){
        userController.getRecipesToAdd(req,res)
    })

}


