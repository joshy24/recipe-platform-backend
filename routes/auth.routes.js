
const { getTenantModel } = require('../modules/adminDB.module');
const getTenantModels = require('../modules/tenantDB.module');

const tenantService = require('../service/tenant.service')

const userController = require("../controller/user.controller")

const jwt = require("jsonwebtoken")

const config = require('../config/config');


module.exports = function(router){

    router.use( async(req,res,next) => {
        const tenantModel = await getTenantModel()

        req.tenantModel = tenantModel

        next()
    })

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

    router.use( async(req,res,next) => {

        let token = "";
        
        token = req.headers.authorization; // in authorization header

        if(!token){
            token = req.query.token; // in query string of get request
           
            if(!token){
                token = req.body.token; // in body of post request
            }
        }
        else{
            token = token.split(':')[1];
        }
        
        if(!token){
            return res.status(400).send("Bad Request Token");
        }
        else{
            jwt.verify(token, config.secret, async (err, decodedPayload) => {
                if (err) {
                    console.log(err)
                    //on client side 403 should mean that the token has expired and the user should be forced to re-authenticate except during a game
                    //the token should be removed from users list of tokens
                    tenantService.removeTokenAndSave(token, decodedPayload.tenantId, req.tenantModel)
                            .then(result => {
                                return res.status(400).send("Expired Token");
                            })
                            .catch(err => {
                                return res.status(400).send("Bad Request Token");
                            })
                } 
                else {
                    let tenant = await tenantService.getTenantFromId(decodedPayload.tenantId, req.tenantModel)

                    if(!tenant){
                        return res.status(400).send("Tenant Not Found");
                    }

                    req.tenant = tenant;
                    req.token = token;

                    req.tenantModels = await getTenantModels(decodedPayload.tenantId)
                    
                    next();
                }
            });
        }
    });
}
